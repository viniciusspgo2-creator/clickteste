/* ============================================================
   Cenários do Editor 2D dentro do Studio 3D.
   Os 112 cenários de foto do Editor 2D (studio-scenes.ts) como
   fundo da viewport 3D: a caneca continua renderizada em 3D por
   cima da foto (ImageBackdrop alinha o quadro à câmera), então
   orbitar, zoom, girar e reposicionar continuam funcionando — e o
   cenário pode ser trocado ou removido a qualquer momento.
   ============================================================ */

"use client";

import { useMemo, useState } from "react";
import { Ban, Check, Images, Loader2, Search, X } from "lucide-react";
import {
  filterStudioScenes,
  studioSceneCategories,
  studioScenes,
  type StudioScene,
} from "@/lib/creative/studio-scenes";
import { loadScene2dBackground } from "../lib/background-registry";
import { useMockupStore } from "../state/store";
import { useToast } from "@/hooks/use-toast";
import { Section } from "./controls";
import { cn } from "@/lib/utils";

const SCENE_BG_ID = (sceneId: string) => `scene-2d-${sceneId}`;

export function StudioScenesPanel() {
  const bg = useMockupStore((s) => s.bg);
  const patch = useMockupStore((s) => s.patch);
  const frameAll = useMockupStore((s) => s.frameAll);
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const activeSceneId =
    bg.type === "image" && bg.imageId?.startsWith("scene-2d-")
      ? bg.imageId.slice("scene-2d-".length)
      : null;

  const filtered = useMemo(
    () => filterStudioScenes(query, category),
    [query, category],
  );

  const applyScene = async (scene: StudioScene) => {
    if (busyId) return;
    setBusyId(scene.id);
    try {
      const entry = await loadScene2dBackground(scene);
      patch("bg", {
        type: "image",
        imageId: entry.id,
        imageFit: "cover",
        imageZoom: 1,
        imageX: 0,
        imageY: 0,
        imageRot: 0,
        imageMirror: false,
        imageBlur: 0,
        imageBright: 1,
      });
      // Enquadra a caneca dentro do quadro do cenário.
      frameAll();
      toast({
        title: "Cenário aplicado!",
        description: `${scene.name} agora é o fundo do Studio 3D.`,
      });
    } catch (e) {
      toast({
        title: "Não deu para aplicar o cenário",
        description:
          e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const removeScene = () => {
    patch("bg", { type: "studio-white", imageId: null });
  };

  return (
    <Section title="Cenários do Editor 2D" icon={Images} defaultOpen>
      <p className="text-xs leading-relaxed text-neutral-400">
        Os {studioScenes.length} cenários do Editor 2D, agora no 3D — escolha
        um e continue orbitando a caneca sobre ele. Troque ou remova quando
        quiser.
      </p>

      {/* busca */}
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar cenário…"
          aria-label="Buscar cenário"
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 pl-8 pr-8 text-sm text-neutral-200 placeholder:text-neutral-500 focus:border-primary/50 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpar busca"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-neutral-500 transition-colors hover:text-neutral-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* categorias */}
      <div
        className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin]"
        role="group"
        aria-label="Filtrar por tema"
      >
        {["", ...studioSceneCategories].map((cat) => (
          <button
            key={cat || "todas"}
            type="button"
            onClick={() => setCategory(cat)}
            aria-pressed={category === cat}
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold transition-colors",
              category === cat
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200",
            )}
          >
            {cat || "Todas"}
          </button>
        ))}
      </div>

      <p className="mt-2 text-xs font-medium text-neutral-500">
        {filtered.length} {filtered.length === 1 ? "cenário" : "cenários"}
        {activeSceneId
          ? ` · em uso: ${studioScenes.find((s) => s.id === activeSceneId)?.name ?? "cenário"}`
          : ""}
      </p>

      {/* grade */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        {/* remover cenário */}
        <button
          type="button"
          onClick={removeScene}
          disabled={!activeSceneId}
          title="Voltar ao fundo branco de estúdio"
          className={cn(
            "group flex aspect-[4/5] flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border transition-all",
            activeSceneId
              ? "border-white/10 bg-white/[0.03] text-neutral-300 hover:border-primary/50"
              : "cursor-default border-white/[0.06] bg-white/[0.01] text-neutral-600",
          )}
        >
          <span
            aria-hidden
            className="inline-block h-8 w-8 rounded-lg border border-white/40"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #9ca3af 25%, transparent 25%, transparent 75%, #9ca3af 75%), linear-gradient(45deg, #9ca3af 25%, #efefef 25%, #efefef 75%, #9ca3af 75%)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 8px 8px",
            }}
          />
          <span className="flex items-center gap-1 px-2 text-center text-xs font-bold">
            <Ban className="h-3.5 w-3.5 shrink-0" />
            Sem cenário
          </span>
        </button>

        {filtered.map((scene) => {
          const active = activeSceneId === scene.id;
          const busy = busyId === scene.id;
          return (
            <button
              key={scene.id}
              type="button"
              onClick={() => void applyScene(scene)}
              disabled={!!busyId}
              title={`${scene.name} · ${scene.category}`}
              aria-pressed={active}
              className={cn(
                "group overflow-hidden rounded-xl border text-left transition-all hover:-translate-y-0.5 hover:border-primary/50",
                active
                  ? "border-primary ring-1 ring-primary/60"
                  : "border-white/10",
              )}
            >
              <span className="relative block aspect-[4/5] w-full overflow-hidden bg-white/[0.04]">
                <img
                  src={scene.preview}
                  alt={scene.name}
                  loading="lazy"
                  className="block h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                {busy && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </span>
                )}
                {active && !busy && (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </span>
              <span className="flex items-center justify-between gap-1 px-2 py-1.5 text-xs font-semibold text-neutral-300">
                <span className="truncate">{scene.name}</span>
                {active && (
                  <Check className="h-3 w-3 shrink-0 text-primary" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="mt-2 text-center text-xs text-neutral-500">
          Nenhum cenário encontrado para essa busca.
        </p>
      )}
    </Section>
  );
}

// Reexportado para testes futuros do painel.
export { SCENE_BG_ID };
