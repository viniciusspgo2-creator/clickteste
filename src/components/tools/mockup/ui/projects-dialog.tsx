/* ============================================================
   Diálogo de projetos — salvar/abrir/gerenciar cenas no
   IndexedDB com miniatura renderizada e arte original.
   ============================================================ */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  FilePlus2,
  FolderOpen,
  Loader2,
  Pencil,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  getEnvironment,
  registerEnvironment,
} from "../lib/environment-registry";
import { useMockupStore } from "../state/store";
import { getArtBlob, loadArtBlob } from "../lib/art-registry";
import {
  getBgBlob,
  getBackgroundImage,
  loadBgBlob,
  ensureScenes,
} from "../lib/background-registry";
import {
  blobToDataUrl,
  deleteProject,
  formatRelative,
  getProject,
  listProjects,
  putProject,
  type StoredProject,
} from "../lib/projects-db";
import { exportImageCanvas } from "../exporters/image-exporter";
import { ExportError } from "../exporters/frame-capture";
import { PrimaryButton } from "./controls";
import { cn } from "@/lib/utils";

/** monta o snapshot serializável do estado atual */
function snapshotState() {
  const s = useMockupStore.getState();
  return {
    projectName: s.projectName,
    art: { ...s.art },
    mug: { ...s.mug },
    light: { ...s.light },
    bg: { ...s.bg },
    camera: { ...s.camera },
    exportSettings: { ...s.exportSettings },
    companions: s.companions.map((c) => ({ ...c })),
    layerOrder: [...s.layerOrder],
    fx: { ...s.fx },
    watermark: { ...s.watermark },
    video: { ...s.video },
    gif: { ...s.gif },
  };
}

/** Embedded companion artwork survives reload and portable saves. */
async function collectAssets(state: ReturnType<typeof snapshotState>) {
  const assets: NonNullable<StoredProject["assets"]> = {};
  for (const a of [
    state.art,
    ...state.companions.map((c) => c.art).filter(Boolean),
  ]) {
    if (!a) continue;
    for (const id of [a.imageId, a.decalImageId, a.baseImageId]) {
      if (!id || assets[id]) continue;
      const blob = await getArtBlob(id);
      if (blob)
        assets[id] = {
          blob,
          name: a.name,
          type: blob.type || "image/png",
          width: a.width,
          height: a.height,
          naturalWidth: a.width,
          naturalHeight: a.height,
        };
    }
  }
  return assets;
}

/** salva o projeto atual (novo ou por cima) e devolve o registro */
export async function saveCurrentProject(
  id: string,
  name: string,
): Promise<StoredProject> {
  const state = snapshotState();
  state.projectName = name;
  let thumbnail = "";
  try {
    const canvas = await exportImageCanvas({
      width: 480,
      height: 480,
      format: "jpeg",
      quality: 0.72,
      transparent: false,
    });
    thumbnail = canvas.toDataURL("image/jpeg", 0.72);
  } catch {
    thumbnail = "";
  }
  let art: StoredProject["art"] = null;
  try {
    const blob = await getArtBlob(state.art.imageId);
    if (blob) {
      art = {
        name: state.art.name || "arte.png",
        type: blob.type || "image/png",
        blob,
        width: state.art.width,
        height: state.art.height,
        naturalWidth: state.art.width,
        naturalHeight: state.art.height,
      };
    }
  } catch {
    art = null;
  }
  let bgImage: StoredProject["bgImage"] = null;
  try {
    const blob = await getBgBlob(state.bg.imageId);
    if (blob)
      bgImage = {
        name: "fundo.png",
        type: "image/png",
        blob,
        width: 0,
        height: 0,
        naturalWidth: 0,
        naturalHeight: 0,
      };
  } catch {
    bgImage = null;
  }
  const project: StoredProject = {
    id,
    name,
    updatedAt: Date.now(),
    thumbnail,
    state,
    art,
    bgImage,
    assets: await collectAssets(state),
    environment: getEnvironment(state.light.hdriId)
      ? {
          blob: getEnvironment(state.light.hdriId)!.blob,
          name: getEnvironment(state.light.hdriId)!.name,
        }
      : undefined,
  };
  await putProject(project);
  return project;
}

/** abre um projeto: restaura estado + arte + fundo */
export async function openProjectIntoStore(p: StoredProject) {
  const s = useMockupStore.getState();
  const { art, ...rest } = p.state;
  let imageId: string | null = null;
  if (p.art) {
    try {
      const entry = await loadArtBlob(p.art.blob, p.art.name);
      imageId = entry.id;
    } catch {
      imageId = null;
    }
  }
  // fundo: blob salvo, cenário pronto (regenerado) ou nada
  let bgId: string | null = rest.bg?.imageId ?? null;
  if (p.bgImage) {
    try {
      const entry = await loadBgBlob(p.bgImage.blob, p.bgImage.name);
      bgId = entry.id;
    } catch {
      bgId = null;
    }
  } else if (bgId?.startsWith("scene-")) {
    ensureScenes(bgId);
  } else if (bgId && !getBackgroundImage(bgId)) {
    bgId = null;
  }
  if (p.environment) {
    try {
      rest.light = {
        ...rest.light,
        hdriId: await registerEnvironment(
          p.environment.blob,
          p.environment.name,
        ),
      };
    } catch {
      rest.light = { ...rest.light, hdriId: null };
    }
  } else if (rest.light) rest.light = { ...rest.light, hdriId: null };
  const remap: Record<string, string> = {};
  for (const [id, a] of Object.entries(p.assets ?? {})) {
    try {
      const entry = await loadArtBlob(a.blob, a.name);
      remap[id] = entry.id;
    } catch {
      /* Invalid individual asset: keep other pieces usable. */
    }
  }
  if (art.imageId && imageId) remap[art.imageId] = imageId;
  const companions = (rest.companions ?? []).map((c) => ({
    ...c,
    art: c.art
      ? {
          ...c.art,
          imageId: remap[c.art.imageId ?? ""] ?? null,
          decalImageId: remap[c.art.decalImageId ?? ""] ?? null,
          baseImageId: remap[c.art.baseImageId ?? ""] ?? null,
        }
      : undefined,
  }));
  s.hydrate({
    ...rest,
    companions,
    art: {
      ...art,
      imageId,
      decalImageId: remap[art.decalImageId ?? ""] ?? null,
      baseImageId: remap[art.baseImageId ?? ""] ?? null,
    },
    bg: { ...(rest.bg ?? {}), imageId: bgId },
  });
}

export function ProjectsDialog() {
  const open = useMockupStore((s) => s.projectsOpen);
  const setOpen = useMockupStore((s) => s.setProjectsOpen);
  const projectName = useMockupStore((s) => s.projectName);
  const { toast } = useToast();
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const loadedOnce = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setProjects(await listProjects());
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && !loadedOnce.current) {
      loadedOnce.current = true;
      refresh();
    }
    if (!open) loadedOnce.current = false;
  }, [open, refresh]);

  const doSave = async (mode: "atual" | "novo") => {
    setBusy(true);
    try {
      const id = mode === "atual" ? currentProjectId() : `proj_${Date.now()}`;
      const name =
        mode === "atual"
          ? currentProjectName(projectName)
          : `${projectName || "Mockup"} — cópia`;
      const p = await saveCurrentProject(id, name);
      await refresh();
      markCurrent(p.id);
      toast({
        title: "Projeto salvo!",
        description: `"${p.name}" está no seu dispositivo.`,
      });
    } catch (e) {
      toast({
        title: "Não deu para salvar",
        description: e instanceof Error ? e.message : "Tente de novo.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const doOpen = async (p: StoredProject) => {
    try {
      await openProjectIntoStore(p);
      markCurrent(p.id);
      setOpen(false);
      toast({
        title: "Projeto aberto!",
        description: `"${p.name}" carregado na cena.`,
      });
    } catch (e) {
      toast({
        title: "Falha ao abrir",
        description: e instanceof Error ? e.message : "Projeto corrompido?",
        variant: "destructive",
      });
    }
  };

  const doDelete = async (p: StoredProject) => {
    await deleteProject(p.id);
    if (currentId === p.id) currentId = null;
    await refresh();
  };

  const doDuplicate = async (p: StoredProject) => {
    const copy: StoredProject = {
      ...p,
      id: `proj_${Date.now()}`,
      name: `${p.name} — cópia`,
      updatedAt: Date.now(),
    };
    await putProject(copy);
    await refresh();
  };

  const doRename = async (p: StoredProject) => {
    const name = renameValue.trim();
    setRenaming(null);
    if (!name || name === p.name) return;
    await putProject({ ...p, name, updatedAt: Date.now() });
    await refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[86dvh] overflow-y-auto border-white/10 bg-[#141110] text-neutral-100 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" /> Meus projetos
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Tudo fica salvo no seu dispositivo (IndexedDB) — nada vai para a
            nuvem.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <PrimaryButton
            onClick={() => doSave("atual")}
            disabled={busy}
            className="flex-1"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar atual
          </PrimaryButton>
          <PrimaryButton
            onClick={() => doSave("novo")}
            disabled={busy}
            className="flex-1"
          >
            <FilePlus2 className="h-4 w-4" /> Salvar como novo
          </PrimaryButton>
        </div>

        <div className="space-y-2">
          {loading && (
            <p className="flex items-center gap-2 py-6 text-center text-xs text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando projetos…
            </p>
          )}
          {!loading && !projects.length && (
            <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
              <Download className="mx-auto h-6 w-6 text-neutral-600" />
              <p className="mt-2 text-xs text-neutral-500">
                Nenhum projeto salvo ainda — configure sua cena e clique em{" "}
                <strong className="text-neutral-300">Salvar atual</strong>.
              </p>
            </div>
          )}
          {projects.map((p) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-white/[0.02] p-2.5 transition-colors",
                currentId === p.id
                  ? "border-primary/50 bg-primary/[0.06]"
                  : "border-white/10 hover:border-white/20",
              )}
            >
              <button
                onClick={() => doOpen(p)}
                className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10"
                title="Abrir projeto"
              >
                {p.thumbnail ? (
                  <img
                    src={p.thumbnail}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs font-bold text-neutral-600">
                    SEM PRÉVIA
                  </span>
                )}
              </button>
              <div className="min-w-0 flex-1">
                {renaming === p.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") doRename(p);
                        if (e.key === "Escape") setRenaming(null);
                      }}
                      className="min-w-0 flex-1 rounded-md border border-primary/50 bg-black/50 px-2 py-1 text-xs outline-none"
                    />
                    <button
                      onClick={() => doRename(p)}
                      className="rounded-md p-1 text-emerald-400 hover:bg-emerald-500/10"
                      aria-label="Confirmar"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setRenaming(null)}
                      className="rounded-md p-1 text-neutral-500 hover:bg-white/10"
                      aria-label="Cancelar"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="truncate text-xs font-semibold text-neutral-100">
                      {p.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatRelative(p.updatedAt)}
                      {currentId === p.id && (
                        <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-xs font-bold text-primary">
                          aberto
                        </span>
                      )}
                    </p>
                  </>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  onClick={() => doOpen(p)}
                  className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-primary/10 hover:text-primary"
                  title="Abrir"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    setRenaming(p.id);
                    setRenameValue(p.name);
                  }}
                  className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
                  title="Renomear"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => doDuplicate(p)}
                  className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
                  title="Duplicar"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => doDelete(p)}
                  className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  title="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---- id/name do projeto em aberto (fora do store: leve e impermanente) ---- */

let currentId: string | null = null;
function currentProjectId(): string {
  return currentId ?? `proj_${Date.now()}`;
}
function currentProjectName(fallback: string): string {
  return fallback || "Mockup sem título";
}
function markCurrent(id: string) {
  currentId = id;
}

/** restaura a última sessão automaticamente (usado no mount do estúdio) */
export async function restoreLastSession(): Promise<boolean> {
  try {
    const p = await getProject("session-current");
    if (!p) return false;
    await openProjectIntoStore(p);
    return true;
  } catch {
    return false;
  }
}

/** salva a sessão silenciosamente (antes de sair da página / a cada 25 s) */
export async function autosaveSession() {
  try {
    const state = snapshotState();
    let art: StoredProject["art"] = null;
    try {
      const blob = await getArtBlob(state.art.imageId);
      if (blob) {
        art = {
          name: state.art.name || "arte.png",
          type: blob.type || "image/png",
          blob,
          width: state.art.width,
          height: state.art.height,
          naturalWidth: state.art.width,
          naturalHeight: state.art.height,
        };
      }
    } catch {
      art = null;
    }
    const project: StoredProject = {
      environment: getEnvironment(state.light.hdriId)
        ? {
            blob: getEnvironment(state.light.hdriId)!.blob,
            name: getEnvironment(state.light.hdriId)!.name,
          }
        : undefined,
      assets: await collectAssets(state),
      id: "session-current",
      name: state.projectName || "Sessão automática",
      updatedAt: Date.now(),
      thumbnail: "",
      state,
      art,
      bgImage: await (async () => {
        try {
          const blob = await getBgBlob(state.bg.imageId);
          return blob
            ? {
                name: "fundo.png",
                type: "image/png",
                blob,
                width: 0,
                height: 0,
                naturalWidth: 0,
                naturalHeight: 0,
              }
            : null;
        } catch {
          return null;
        }
      })(),
    };
    await putProject(project);
  } catch {
    /* silencioso — autosave nunca deve atrapalhar */
  }
}

export { ExportError };
