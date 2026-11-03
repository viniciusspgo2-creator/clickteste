/** Click&Gruda workspace. Project/auth/hosting boundaries are unchanged. */
"use client";
import { STUDIO_ANNOUNCEMENTS_ENABLED } from "@/lib/features";
import { StudioAnnouncements } from "./ui/studio-announcements";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useMockupStore } from "./state/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { saveCurrentProject } from "./ui/projects-dialog";
import { useToast } from "@/hooks/use-toast";
import { Workspace } from "./ui/workspace";
import { ExportDialog } from "./ui/panels";
import {
  ProjectsDialog,
  autosaveSession,
  restoreLastSession,
} from "./ui/projects-dialog";
import { loadArtFile, removeArtImage } from "./lib/art-registry";
import { loadBgFile } from "./lib/background-registry";
import { setStudioPlan, type StudioPlan } from "./lib/entitlements";
const StudioCanvas = dynamic(() => import("./scene/studio-scene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-neutral-500">
      Preparando seu estúdio 3D…
    </div>
  ),
});
export function MockupStudio({ plan = "premium" }: { plan?: StudioPlan }) {
  const { toast } = useToast();
  const [shortcuts, setShortcuts] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const uploads = useRef(new Map<string, number>());
  const restored = useRef(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const st = useMockupStore();
  useEffect(() => {
    setStudioPlan(plan);
  }, [plan]);
  useEffect(() => {
    const pending = uploads.current;
    return () => pending.clear();
  }, []);
  async function upload(file: File) {
    const active = useMockupStore.getState().selectedIds[0] ?? "hero";
    const request = (uploads.current.get(active) ?? 0) + 1;
    uploads.current.set(active, request);
    try {
      const s = useMockupStore.getState();
      const selected = active === "hero" ? s.mug : s.companions.find(c => c.id === active);
      if (!selected || selected.locked) throw new Error("Desbloqueie a caneca antes de trocar a arte.");
      const e = await loadArtFile(file);
      if (uploads.current.get(active) !== request) {
        removeArtImage(e.id);
        return;
      }
      // Decoding can finish after a second upload, a lock, deletion or a model change.
      const current = useMockupStore.getState();
      const target = active === "hero" ? current.mug : current.companions.find(c => c.id === active);
      if (!target || target.locked) {
        removeArtImage(e.id);
        throw new Error("A caneca foi removida ou bloqueada durante o envio. Selecione uma caneca desbloqueada e tente novamente.");
      }
      current.setArtImage({
        objectId: active,
        imageId: e.id,
        name: e.name,
        width: e.naturalWidth,
        height: e.naturalHeight,
      });
      setError("");
    } catch (e) {
      if (uploads.current.get(active) === request)
        setError(e instanceof Error ? e.message : "Imagem inválida");
    }
  }
  useEffect(() => {
    if (!restored.current) {
      restored.current = true;
      const s = useMockupStore.getState();
      if (!s.art.imageId && !s.past.length)
        restoreLastSession().catch(() => {});
    }
    const timer = setInterval(() => autosaveSession().catch(() => {}), 25000);
    const save = () => {
      autosaveSession().catch(() => {});
    };
    window.addEventListener("pagehide", save);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pagehide", save);
      autosaveSession().catch(() => {});
    };
  }, []);
  useEffect(() => {
    const paste = (e: ClipboardEvent) => {
      if (
        (e.target as HTMLElement)?.closest(
          "input,textarea,[contenteditable=true],[role=dialog],[role=alertdialog]",
        )
      )
        return;
      const f = Array.from(e.clipboardData?.items ?? [])
        .find((x) => x.type.startsWith("image/"))
        ?.getAsFile();
      if (f) {
        e.preventDefault();
        upload(f);
      }
    };
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.closest("input,textarea,select,[contenteditable=true],[role=dialog],[role=alertdialog]")) return;
      if (document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]')) return;
      const s = useMockupStore.getState();
      if (s.exportOpen || s.projectsOpen) return;
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (mod && k === "s") {
        e.preventDefault();
        void saveCurrentProject("working-project", s.projectName)
          .then(() => toast({ title: "Projeto salvo neste dispositivo" }))
          .catch(() =>
            toast({
              title: "Não foi possível salvar o projeto",
              variant: "destructive",
            }),
          );
        return;
      }
      if (mod && e.shiftKey && k === "e") {
        e.preventDefault();
        s.setExportOpen(true);
        return;
      }
      if (k === "?") {
        setShortcuts(true);
        return;
      }
      if (mod && k === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
        return;
      }
      if (mod && k === "y") {
        e.preventDefault();
        s.redo();
        return;
      }
      if (mod && k === "d") {
        e.preventDefault();
        s.duplicateSelected();
        return;
      }
      if (mod && k === "a") {
        e.preventDefault();
        s.select("hero");
        for (const c of s.companions) s.select(c.id, true);
        return;
      }
      if (mod) return;
      if (k === "delete" || k === "backspace") {
        e.preventDefault();
        s.deleteSelected();
      } else if (k.startsWith("arrow")) {
        e.preventDefault();
        s.transformSelected(
          k === "arrowup" || k === "arrowdown" ? "posZ" : "posX",
          (k === "arrowleft" || k === "arrowup" ? -1 : 1) *
            (e.shiftKey ? 1 : 0.1),
        );
      } else if (k === "f") s.frameAll();
      else if (k === "r")
        for (const id of s.selectedIds) {
          const o =
            id === "hero" ? s.mug : s.companions.find((c) => c.id === id);
          if (o) s.patchObject(id, { rotationY: o.rotationY + 45 });
        }
      else if (k === " " && !t?.closest("button,a,[role=switch]")) {
        e.preventDefault();
        s.patch("camera", { autoRotate: !s.camera.autoRotate });
      } else if (k === "escape") s.select("hero");
      else {
        const tools = {
          v: "select",
          g: "move",
          e: "rotate",
          s: "scale",
          a: "art",
          h: "pan",
        } as const;
        if (k in tools) s.setTool(tools[k as keyof typeof tools]);
      }
    };
    window.addEventListener("paste", paste);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("paste", paste);
      window.removeEventListener("keydown", key);
    };
  }, []);
  const viewport = (
    <div className="relative h-full w-full">
      <StudioCanvas paused={shortcuts || guideOpen} />
      {st.showGuides && (
        <div className="pointer-events-none absolute inset-0 z-10 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="border border-black/10" />
          ))}
        </div>
      )}
      {st.bgAdjustMode && <BgAdjustOverlay />}
      {drag && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center border-2 border-dashed border-orange-400 bg-orange-400/10">
          Solte para adicionar a imagem
        </div>
      )}
      {error && (
        <button
          onClick={() => setError("")}
          className="absolute bottom-40 left-5 right-5 z-30 rounded-xl bg-red-950 p-3 text-sm text-white"
        >
          {error} · fechar
        </button>
      )}
    </div>
  );
  return (
    <div
      className="cg-studio-root"
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrag(false);
      }}
      onDrop={async (e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files[0];
        if (!f) return;
        if (st.bgAdjustMode) {
          try {
            const bg = await loadBgFile(f);
            st.patch("bg", { type: "image", imageId: bg.id });
          } catch (e) {
            setError(String(e));
          }
        } else upload(f);
      }}
    >
      <input
        ref={input}
        type="file"
        hidden
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      {STUDIO_ANNOUNCEMENTS_ENABLED && <StudioAnnouncements suspended={shortcuts || guideOpen} />}
      <Workspace
        viewport={viewport}
        onUpload={() => input.current?.click()}
        onShortcuts={() => setShortcuts(true)}
        onGuideOpenChange={setGuideOpen}
      />
      <Dialog open={shortcuts} onOpenChange={setShortcuts}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seu Studio, mais rápido</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-3 text-sm">
            {[
              ["Desfazer / refazer", "Ctrl Z / Ctrl Shift Z"],
              ["Salvar projeto no dispositivo", "Ctrl S"],
              ["Abrir exportação", "Ctrl Shift E"],
              ["Duplicar seleção", "Ctrl D"],
              ["Colar estampa", "Ctrl V"],
              ["Mover / girar / escala", "G / E / S"],
              ["Ajustar arte / mover cenário", "A / H"],
              ["Enquadrar tudo", "F"],
              ["Girar 45°", "R"],
              ["Iniciar / pausar giro", "Espaço"],
              ["Mover com precisão", "Setas · Shift: passo maior"],
              ["Ajuda de atalhos", "?"],
            ].map(([label, key]) => (
              <div key={key} className="contents">
                <span>{label}</span>
                <kbd className="text-xs text-orange-400">{key}</kbd>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            No Mac, use ⌘ no lugar de Ctrl. Os atalhos ficam suspensos enquanto
            você digita em campos.
          </p>
        </DialogContent>
      </Dialog>
      <ExportDialog />
      <ProjectsDialog />
    </div>
  );
}
function BgAdjustOverlay() {
  const patch = useMockupStore((s) => s.patch);
  const setBgAdjustMode = useMockupStore((s) => s.setBgAdjustMode);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const st = useMockupStore.getState();
    const dx = ((e.clientX - last.current.x) / rect.width) * 1.6;
    const dy = ((e.clientY - last.current.y) / rect.height) * 1.6;
    last.current = { x: e.clientX, y: e.clientY };
    let nx = Math.max(-1, Math.min(1, st.bg.imageX + dx));
    let ny = Math.max(-1, Math.min(1, st.bg.imageY + dy));
    // encaixe magnético no centro
    if (Math.abs(nx) < 0.035) nx = 0;
    if (Math.abs(ny) < 0.035) ny = 0;
    patch("bg", {
      imageX: Math.round(nx * 1000) / 1000,
      imageY: Math.round(ny * 1000) / 1000,
    });
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  return (
    <div
      ref={ref}
      className="absolute inset-0 z-20 cursor-move touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={() => patch("bg", { imageX: 0, imageY: 0 })}
    >
      {/* guias de centro */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-primary/60" />
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-primary/60" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-8 w-8 rounded-full border-2 border-primary/80" />
      </div>
      <div className="absolute inset-x-0 top-20 flex justify-center">
        <div className="flex items-center gap-3 rounded-full border border-primary/40 bg-black/70 px-4 py-2 text-[11px] font-semibold text-neutral-100 backdrop-blur-md">
          <span>Arraste para posicionar o fundo · duplo clique recentra</span>
          <button
            onClick={() => setBgAdjustMode(false)}
            className="pointer-events-auto rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-[#1d130d]"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
