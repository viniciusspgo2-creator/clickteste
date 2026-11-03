/* ============================================================
   Painéis do estúdio (Arte, Caneca, Cena, Iluminação, Câmera)
   + diálogo de exportação de imagem.
   ============================================================ */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { writeHandoff } from "@/lib/creative/handoff";
import { trimTransparentMockup } from "@/lib/creative/transparent-crop";
import { FinalPreviewViewer } from "./final-preview-viewer";
import {
  ImagePlus,
  Settings2,
  CupSoda,
  Mountain,
  Lightbulb,
  Camera,
  Sparkles,
  Download,
  Loader2,
  Trash2,
  Wand2,
  RotateCw,
  FlipHorizontal2,
  Crosshair,
  Check,
  TriangleAlert,
  Flame,
  Snowflake,
  Play,
  Square,
  Grid3X3,
  Maximize,
  Move,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMockupStore, type VideoState } from "../state/store";
import { makeSampleArt, getArtImage } from "../lib/art-registry";
import { computeDpi, computeFitScale } from "../lib/art-canvas";
import {
  loadBgFile,
  ensureScenes,
  SCENES,
  drawSceneThumb,
} from "../lib/background-registry";
import {
  AREA_PRESETS,
  BACKGROUND_LABELS,
  CAMERA_PRESETS,
  EXPORT_RATIOS,
  FLOOR_OPTIONS,
  LIGHT_PRESETS,
  MAX_EXPORT_PX,
  resolvePrintArea,
  type AreaMode,
  type BackgroundType,
} from "../lib/config";
import {
  ColorRow,
  MiniButton,
  PrimaryButton,
  Section,
  Segmented,
  SliderRow,
  ToggleRow,
} from "./controls";
import {
  downloadBlob,
  exportImage,
  ExportError,
} from "../exporters/image-exporter";
import {
  exportVideo,
  exportGif,
  VIDEO_RESOLUTIONS,
} from "../exporters/video-exporter";
import { exportBatch, batchVariantsFor } from "../exporters/batch-exporter";
import { exportTemplate } from "../exporters/template-exporter";
import { cn } from "@/lib/utils";
import { getStudioPlan } from "../lib/entitlements";

/* ---------------- Arte ---------------- */

export function ArtPanel({ onUpload }: { onUpload: () => void }) {
  const selectedId = useMockupStore((s) => s.selectedIds[0] ?? "hero");
  const art = useMockupStore((s) =>
    selectedId === "hero"
      ? s.art
      : (s.companions.find((c) => c.id === selectedId)?.art ?? s.art),
  );
  const patch = (
    _slice: "art",
    p: Partial<import("../state/store").ArtState>,
  ) => useMockupStore.getState().patchObjectArt(selectedId, p);
  const clearArt = () =>
    patch("art", { imageId: null, name: "", width: 0, height: 0 });
  const notifyArtApplied = useMockupStore((s) => s.notifyArtApplied);
  const locked = useMockupStore(s => selectedId === "hero" ? s.mug.locked : !!s.companions.find(c => c.id === selectedId)?.locked);
  const model = useMockupStore(s => selectedId === "hero" ? s.mug.model : (s.companions.find(c => c.id === selectedId)?.model ?? s.mug.model));
  const hasArt = !!art.imageId;
  // área de impressão ativa (muda com o painel Arte) — resolvePrintArea é barato
  const area = useMemo(() => resolvePrintArea(art), [art]);
  const dpi = useMemo(() => computeDpi(art, area, model), [art, area, model]);

  return (
    <fieldset disabled={locked} className="min-w-0 border-0 p-0"><Section title="Arte" icon={ImagePlus} defaultOpen>
      {!hasArt ? (
        <button
          onClick={onUpload}
          disabled={locked}
          className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] px-4 py-6 transition-colors hover:border-primary/50 hover:bg-primary/5"
        >
          <ImagePlus className="h-6 w-6 text-primary" />
          <span className="text-xs font-semibold text-neutral-200">
            Enviar arte
          </span>
          <span className="text-center text-xs leading-relaxed text-neutral-500">
            PNG, JPG, WebP, SVG ou AVIF · clique, arraste aqui ou cole com
            Ctrl+V
          </span>
        </button>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-neutral-100">
                {art.name}
              </p>
              <p className="text-xs text-neutral-500">
                {art.width} × {art.height} px
              </p>
            </div>
            <MiniButton onClick={onUpload} className="shrink-0">
              Trocar
            </MiniButton>
            <MiniButton
              onClick={clearArt}
              className="shrink-0 hover:!border-red-500/50 hover:!text-red-400"
            >
              <Trash2 className="h-3 w-3" />
            </MiniButton>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            {dpi === null ? null : dpi >= 300 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-400">
                <Check className="h-3 w-3" /> {Math.round(dpi)} DPI · excelente
                para sublimação
              </span>
            ) : dpi >= 150 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-400">
                {Math.round(dpi)} DPI · qualidade boa
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-400">
                <TriangleAlert className="h-3 w-3" /> {Math.round(dpi)} DPI ·
                abaixo de 150, pode sair borrado
              </span>
            )}
          </div>
        </div>
      )}

      <MiniButton
        onClick={() => {
          const s = makeSampleArt();
          const { setArtImage } = useMockupStore.getState();
          setArtImage({
            objectId: selectedId,
            imageId: s.id,
            name: s.name,
            width: s.naturalWidth,
            height: s.naturalHeight,
          });
        }}
        className="w-full"
      >
        <Wand2 className="mr-1 inline h-3 w-3 text-primary" /> Usar arte de
        exemplo
      </MiniButton>

      {/* tamanho da área de impressão na caneca */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
        <p
          className="mb-1.5 text-[13px] font-medium text-neutral-400"
          title="Onde a arte é impressa na caneca — escolha o tamanho do papel que você usa"
        >
          Tamanho na caneca
        </p>
        <div className="grid grid-cols-2 gap-1">
          {AREA_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              title={p.desc}
              onClick={() => patch("art", { areaMode: p.id as AreaMode })}
              className={cn(
                "rounded-lg border px-1.5 py-1.5 text-xs font-bold transition-all",
                (art.areaMode ?? "padrao") === p.id
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {(art.areaMode ?? "padrao") === "custom" && (
          <div className="mt-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="mb-1 text-xs text-neutral-500">
                  Largura (cm)
                </p>
                <input
                  type="number"
                  min={8}
                  max={23.4}
                  step={0.1}
                  value={art.areaW}
                  onChange={(e) =>
                    patch("art", {
                      areaW: Math.min(
                        23.4,
                        Math.max(8, +e.target.value || 20.7),
                      ),
                    })
                  }
                  className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-neutral-100 outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-neutral-500">Altura (cm)</p>
                <input
                  type="number"
                  min={3}
                  max={9.1}
                  step={0.1}
                  value={art.areaH}
                  onChange={(e) =>
                    patch("art", {
                      areaH: Math.min(9.1, Math.max(3, +e.target.value || 8.7)),
                    })
                  }
                  className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-neutral-100 outline-none focus:border-primary/60"
                />
              </div>
            </div>
            <div>
              <p className="mb-1 flex justify-between text-xs text-neutral-500">
                <span>Posição vertical da área</span>
                <span className="text-neutral-300">
                  {(art.areaY ?? 0) > 0 ? "+" : ""}
                  {(art.areaY ?? 0).toFixed(1).replace(".", ",")} cm
                </span>
              </p>
              <input
                type="range"
                min={-4}
                max={4}
                step={0.05}
                value={art.areaY ?? 0}
                onChange={(e) => patch("art", { areaY: +e.target.value })}
                className="w-full accent-orange-500"
              />
            </div>
            <MiniButton
              onClick={() => patch("art", { areaMode: "alta" as AreaMode })}
              className="w-full"
            >
              Cobrir a caneca de cima a baixo
            </MiniButton>
          </div>
        )}

        <p className="mt-2 text-xs leading-relaxed text-neutral-500">
          Área ativa:{" "}
          <strong className="text-neutral-300">
            {area.arcCm.toFixed(1).replace(".", ",")} ×{" "}
            {area.heightCm.toFixed(1).replace(".", ",")} cm
          </strong>
          {(art.areaMode ?? "padrao") === "forno" &&
            " · envolve a caneca toda até a alça"}
          {(art.areaMode ?? "padrao") === "alta" &&
            " · vai do pé até a borda, sem espaço em branco"}
        </p>
      </div>

      {/* texto escrito direto na caneca (sai também na folha de sublimação) */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
        <p
          className="mb-1.5 text-[13px] font-medium text-neutral-400"
          title="Escreva uma frase ou nome — vai para a caneca e para a folha de sublimação"
        >
          Texto na caneca (opcional)
        </p>
        <input
          value={art.text}
          maxLength={40}
          onChange={(e) => patch("art", { text: e.target.value })}
          placeholder="Ex.: Feliz Aniversário! "
          className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-neutral-100 outline-none focus:border-primary/60"
        />
        {art.text.trim() && (
          <div className="mt-2 space-y-2">
            <ColorRow
              label="Cor do texto"
              value={art.textColor}
              onChange={(v) => patch("art", { textColor: v })}
            />
            <SliderRow
              label="Tamanho do texto"
              value={art.textSize * 100}
              min={4}
              max={24}
              onChange={(v) => patch("art", { textSize: v / 100 })}
              defaultValue={9}
              format={(v) => `${Math.round(v)}% da altura`}
            />
            <SliderRow
              label="Altura do texto"
              value={art.textY * 100}
              min={-100}
              max={100}
              onChange={(v) => patch("art", { textY: v / 100 })}
              defaultValue={15}
            />
          </div>
        )}
      </div>

      {hasArt && (
        <>
          <Segmented
            label="Ajuste à área"
            value={art.fit}
            options={[
              { value: "cover", label: "Preencher" },
              { value: "contain", label: "Conter" },
              { value: "stretch", label: "Esticar" },
            ]}
            onChange={(v) => patch("art", { fit: v, scale: 1 })}
          />
          <button
            type="button"
            onClick={() =>
              patch("art", {
                fit: "cover",
                scale: 1,
                repeat: 1,
                offsetX: 0,
                offsetY: 0,
                rotation: 0,
              })
            }
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-left text-[13px] font-bold text-primary transition-colors hover:bg-primary/15"
            title="Faz a arte cobrir toda a área de impressão selecionada, mantendo a proporção e sem deixar faixas vazias."
          >
            <span>Cobrir 100% da área de impressão</span>
            <Maximize className="h-3.5 w-3.5 shrink-0" />
          </button>
          <p className="-mt-1 text-xs leading-relaxed text-neutral-500">
            A arte cobre a área escolhida sem distorção. Para ir do topo à base
            da caneca, selecione “Altura cheia” em “Tamanho na caneca” e aplique
            esta opção.
          </p>
          <div className="flex gap-1.5">
            <MiniButton
              className="flex-1"
              title="Aumenta/diminui a arte para ocupar exatamente a altura toda da área"
              onClick={() => {
                const k = computeFitScale(art, "height", area);
                if (k) patch("art", { scale: Math.round(k * 100) / 100 });
              }}
            >
              Preencher altura
            </MiniButton>
            <MiniButton
              className="flex-1"
              title="Aumenta/diminui a arte para ocupar exatamente a largura toda da área"
              onClick={() => {
                const k = computeFitScale(art, "width", area);
                if (k) patch("art", { scale: Math.round(k * 100) / 100 });
              }}
            >
              Preencher largura
            </MiniButton>
          </div>
          <SliderRow
            label="Tamanho"
            value={art.scale * 100}
            min={10}
            max={300}
            onChange={(v) => patch("art", { scale: v / 100 })}
            defaultValue={100}
            format={(v) => `${Math.round(v)}%`}
          />
          <SliderRow
            label="Posição em volta (frente ← → trás)"
            value={art.offsetX * 100}
            min={-100}
            max={100}
            onChange={(v) => patch("art", { offsetX: v / 100 })}
            defaultValue={0}
          />
          <SliderRow
            label="Altura"
            value={art.offsetY * 100}
            min={-100}
            max={100}
            onChange={(v) => patch("art", { offsetY: v / 100 })}
            defaultValue={0}
          />
          <SliderRow
            label="Rotação"
            value={art.rotation}
            min={-180}
            max={180}
            onChange={(v) => patch("art", { rotation: v })}
            defaultValue={0}
            format={(v) => `${Math.round(v)}°`}
          />
          <SliderRow
            label="Repetir lateralmente"
            value={art.repeat}
            min={1}
            max={4}
            onChange={(v) => patch("art", { repeat: Math.round(v) })}
            defaultValue={1}
            format={(v) => `${Math.round(v)}× na volta`}
          />
          <div className="flex gap-1.5">
            <MiniButton
              onClick={() => patch("art", { mirror: !art.mirror })}
              active={art.mirror}
              className="flex-1"
            >
              <FlipHorizontal2 className="mr-1 inline h-3 w-3" /> Espelhar
            </MiniButton>
            <MiniButton
              onClick={() =>
                patch("art", { offsetX: 0, offsetY: 0, rotation: 0, scale: 1 })
              }
              className="flex-1"
            >
              <Crosshair className="mr-1 inline h-3 w-3" /> Centralizar
            </MiniButton>
          </div>
        </>
      )}
    </Section></fieldset>
  );
}

/* ---------------- Caneca ---------------- */

/** presets de inclinação/perspectiva da caneca */
const TILT_PRESETS: {
  id: string;
  label: string;
  tiltX: number;
  tiltZ: number;
  title: string;
}[] = [
  {
    id: "frontal",
    label: "Frontal",
    tiltX: 0,
    tiltZ: 0,
    title: "Caneca reta, de frente",
  },
  {
    id: "esq",
    label: "Inclinada ←",
    tiltX: 5,
    tiltZ: 16,
    title: "Inclinada para a esquerda",
  },
  {
    id: "dir",
    label: "Inclinada →",
    tiltX: 5,
    tiltZ: -16,
    title: "Inclinada para a direita",
  },
  {
    id: "cima",
    label: "Vista de cima",
    tiltX: 22,
    tiltZ: 0,
    title: "Topo da caneca virado para a câmera",
  },
  {
    id: "baixo",
    label: "Vista de baixo",
    tiltX: -14,
    tiltZ: 0,
    title: "Base da caneca virada para a câmera",
  },
];

export function MugPanel() {
  const mug = useMockupStore((s) => s.mug);
  const patch = useMockupStore((s) => s.patch);
  const rotateMug = useMockupStore((s) => s.rotateMug);
  const isMagic = mug.variant === "magic";
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const holdHeatRef = useRef<number | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPlay = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setPlaying(false);
  }, []);

  useEffect(
    () => () => {
      stopPlay();
      if (previewTimer.current) clearTimeout(previewTimer.current);
    },
    [stopPlay],
  );

  /** pré-visualização: a caneca preta começa a revelar a arte */
  const startPlay = useCallback(() => {
    stopPlay();
    setPlaying(true);
    const t0 = performance.now();
    const dur = 3000;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      useMockupStore.getState().patch("mug", { magicHeat: 0.02 + e * 0.98 });
      if (k < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        setPlaying(false);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [stopPlay]);

  const holdCold = () => {
    if (holdHeatRef.current === null) holdHeatRef.current = mug.magicHeat;
    patch("mug", { magicHeat: 0 });
  };
  const releaseCold = () => {
    if (previewTimer.current) {
      clearTimeout(previewTimer.current);
      previewTimer.current = null;
    }
    if (holdHeatRef.current !== null) {
      patch("mug", { magicHeat: holdHeatRef.current });
      holdHeatRef.current = null;
    }
  };
  /** clique simples: pré-visualiza a caneca fria por 1,2 s (o hold também funciona) */
  const clickPreviewCold = () => {
    if (holdHeatRef.current !== null) return; // já segurando
    const held = mug.magicHeat;
    holdHeatRef.current = held;
    patch("mug", { magicHeat: 0 });
    previewTimer.current = setTimeout(() => {
      patch("mug", { magicHeat: held });
      holdHeatRef.current = null;
      previewTimer.current = null;
    }, 1200);
  };

  return (
    <Section title="Caneca" icon={CupSoda} defaultOpen>
      <Segmented
        label="Modelo — porcelana 11 oz (325 ml)"
        value={mug.variant}
        options={[
          { value: "white", label: "Branca" },
          { value: "accent", label: "Colorida" },
          { value: "magic", label: "Mágica" },
        ]}
        onChange={(v) => {
          stopPlay();
          patch("mug", { variant: v });
        }}
      />
      {mug.variant !== "white" && (
        <ColorRow
          label="Cor da alça e interior"
          value={mug.accentColor}
          onChange={(v) =>
            patch("mug", { accentColor: v, handleColor: v, interiorColor: v })
          }
        />
      )}
      {isMagic && (
        <>
          <SliderRow
            label="Calor (revelação)"
            value={mug.magicHeat * 100}
            min={0}
            max={100}
            onChange={(v) => patch("mug", { magicHeat: v / 100 })}
            defaultValue={85}
            format={(v) =>
              v <= 2
                ? "fria — tudo preto"
                : v >= 98
                  ? "quente — arte revelada"
                  : `${Math.round(v)}% revelado`
            }
          />
          <div className="flex gap-1.5">
            {playing ? (
              <MiniButton onClick={stopPlay} active className="flex-1">
                <Square className="mr-1 inline h-3 w-3" /> Parar
              </MiniButton>
            ) : (
              <MiniButton onClick={startPlay} className="flex-1">
                <Play className="mr-1 inline h-3 w-3 text-primary" /> Ver
                revelação
              </MiniButton>
            )}
            <MiniButton
              onClick={() => patch("mug", { magicHeat: 1 })}
              className="flex-1"
            >
              <Flame className="mr-1 inline h-3 w-3 text-amber-400" /> Quente
            </MiniButton>
            <MiniButton
              onClick={() => patch("mug", { magicHeat: 0 })}
              className="flex-1"
            >
              <Snowflake className="mr-1 inline h-3 w-3 text-sky-300" /> Fria
            </MiniButton>
          </div>
          <MiniButton
            onClick={clickPreviewCold}
            onPointerDown={holdCold}
            onPointerUp={releaseCold}
            onPointerLeave={releaseCold}
            className="w-full"
            title="Clique (1,2 s) ou segure para ver a caneca fria"
          >
            <Eye className="mr-1 inline h-3 w-3" /> Ver antes (clique ou segure)
          </MiniButton>
          <Segmented
            label="Direção da revelação"
            value={mug.magicDirection}
            options={[
              { value: "baixo", label: "De baixo p/ cima" },
              { value: "lateral", label: "Lateral" },
              { value: "radial", label: "Do centro" },
            ]}
            onChange={(v) => patch("mug", { magicDirection: v })}
          />
          <SliderRow
            label="Borda da revelação"
            value={mug.magicDissolve * 100}
            min={0}
            max={100}
            onChange={(v) => patch("mug", { magicDissolve: v / 100 })}
            defaultValue={35}
            format={(v) =>
              v <= 2 ? "linha reta" : `${Math.round(v)}% de dissolução`
            }
          />
        </>
      )}
      <SliderRow
        label="Rotação da caneca"
        value={mug.rotationY}
        min={0}
        max={360}
        onChange={(v) => patch("mug", { rotationY: v })}
        defaultValue={0}
        format={(v) => `${Math.round(v)}°`}
      />
      <div className="flex gap-1.5">
        <MiniButton onClick={() => rotateMug(180)} className="flex-1">
          Virar 180°
        </MiniButton>
        <MiniButton onClick={() => rotateMug(45)} className="flex-1">
          Girar +45°
        </MiniButton>
      </div>

      {/* perspectivas prontas */}
      <div>
        <p
          className="mb-1.5 text-[13px] font-medium text-neutral-400"
          title="Inclinações prontas da caneca na cena"
        >
          Perspectiva da caneca
        </p>
        <div className="grid grid-cols-3 gap-1">
          {TILT_PRESETS.map((p) => {
            const active =
              Math.abs((mug.tiltX ?? 0) - p.tiltX) < 0.5 &&
              Math.abs((mug.tiltZ ?? 0) - p.tiltZ) < 0.5;
            return (
              <button
                key={p.id}
                type="button"
                title={p.title}
                onClick={() => patch("mug", { tiltX: p.tiltX, tiltZ: p.tiltZ })}
                className={cn(
                  "rounded-lg border px-1 py-2 text-xs font-bold transition-all",
                  active
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
      <SliderRow
        label="Inclinar frente/trás"
        value={mug.tiltX}
        min={-35}
        max={35}
        onChange={(v) => patch("mug", { tiltX: v })}
        defaultValue={0}
        format={(v) => `${Math.round(v)}°`}
      />
      <SliderRow
        label="Inclinar esquerda/direita"
        value={mug.tiltZ ?? 0}
        min={-30}
        max={30}
        onChange={(v) => patch("mug", { tiltZ: v })}
        defaultValue={0}
        format={(v) => `${Math.round(v)}°`}
      />
      <SliderRow
        label="Tamanho na cena"
        value={mug.scale * 100}
        min={60}
        max={140}
        onChange={(v) => patch("mug", { scale: v / 100 })}
        defaultValue={100}
        format={(v) => `${Math.round(v)}%`}
      />
      <SliderRow
        label="Altura na cena"
        value={mug.posY * 10}
        min={-8}
        max={20}
        onChange={(v) => patch("mug", { posY: v / 10 })}
        defaultValue={0}
        format={(v) => `${(v / 10).toFixed(1)} cm`}
      />
      {isMagic && (
        <p className="text-xs leading-relaxed text-neutral-500">
          A revelação também sai na exportação — crie imagens &quot;antes e
          depois&quot; exportando com a caneca fria e depois quente, ou vídeo em
          Movimento &quot;Revelação&quot;.
        </p>
      )}
    </Section>
  );
}

/* ---------------- Cena (fundo e chão) ---------------- */

const BG_OPTIONS: { value: BackgroundType; label: string; title: string }[] = [
  {
    value: "studio-white",
    label: "Branco",
    title: "Fundo branco puro (padrão)",
  },
  { value: "studio-dark", label: "Escuro", title: "Estúdio escuro premium" },
  { value: "gradient", label: "Gradiente", title: "Duas cores em degradê" },
  { value: "solid", label: "Cor", title: "Uma cor sólida" },
  { value: "image", label: "Imagem", title: "Use uma foto sua como fundo" },
  {
    value: "transparent",
    label: "Sem fundo",
    title: "Transparente — exporta PNG/WebP com alfa",
  },
];

/** ícone de transparência (xadrez) desenhado em CSS puro */
function TransparentSwatch() {
  return (
    <span
      aria-hidden
      className="inline-block h-3 w-3 shrink-0 rounded-[3px] border border-white/40"
      style={{
        backgroundImage:
          "linear-gradient(45deg, #9ca3af 25%, transparent 25%, transparent 75%, #9ca3af 75%), linear-gradient(45deg, #9ca3af 25%, #efefef 25%, #efefef 75%, #9ca3af 75%)",
        backgroundSize: "8px 8px",
        backgroundPosition: "0 0, 4px 4px",
      }}
    />
  );
}

/** galeria de cenários prontos, todos gerados por código */
function ScenesGallery() {
  const patch = useMockupStore((s) => s.patch);
  const current = useMockupStore((s) => s.bg.imageId);
  const bgType = useMockupStore((s) => s.bg.type);
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    SCENES.forEach((s, i) => {
      const c = refs.current[i];
      if (c) drawSceneThumb(c, s.id);
    });
  }, []);

  return (
    <div>
      <p
        className="mb-1.5 text-[13px] font-medium text-neutral-400"
        title="Cenários desenhados pelo próprio estúdio — sem direitos autorais"
      >
        Cenários prontos
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              ensureScenes(s.id);
              patch("bg", {
                type: "image",
                imageId: s.id,
                imageFit: "cover",
                imageZoom: 1,
                imageX: 0,
                imageY: 0,
                imageRot: 0,
                imageMirror: false,
                imageBlur: 0,
                imageBright: 1,
              });
            }}
            title={s.label}
            aria-pressed={bgType === "image" && current === s.id}
            className={cn(
              "group overflow-hidden rounded-xl border text-left transition-all hover:-translate-y-0.5 hover:border-primary/50",
              bgType === "image" && current === s.id
                ? "border-primary ring-1 ring-primary/60"
                : "border-white/10",
            )}
          >
            <canvas
              ref={(el) => {
                refs.current[i] = el;
              }}
              width={256}
              height={144}
              className="block aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <span className="flex items-center justify-between gap-1 px-2 py-1.5 text-xs font-semibold text-neutral-300">
              <span className="truncate">{s.label}</span>
              {bgType === "image" && current === s.id && (
                <Check className="h-3 w-3 shrink-0 text-primary" />
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ScenePanel() {
  const bg = useMockupStore((s) => s.bg);
  const patch = useMockupStore((s) => s.patch);
  const bgAdjustMode = useMockupStore((s) => s.bgAdjustMode);
  const setBgAdjustMode = useMockupStore((s) => s.setBgAdjustMode);
  const { toast } = useToast();
  const [busyBg, setBusyBg] = useState(false);
  const bgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bg.type === "image" && bg.imageId?.startsWith("scene-"))
      ensureScenes(bg.imageId);
  }, [bg.type, bg.imageId]);

  const handleBgFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return;
      setBusyBg(true);
      try {
        const entry = await loadBgFile(file);
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
        toast({
          title: "Fundo aplicado!",
          description: `${file.name} agora é o cenário da cena.`,
        });
      } catch (e) {
        toast({
          title: "Não deu para usar essa imagem",
          description: e instanceof Error ? e.message : "Tente outro arquivo.",
          variant: "destructive",
        });
      } finally {
        setBusyBg(false);
      }
    },
    [patch, toast],
  );

  return (
    <Section title="Fundo & cena" icon={Mountain} defaultOpen>
      <input
        ref={bgInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          handleBgFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-neutral-200">
            Escolha um cenário
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Prévia ilustrada · você pode trocar quando quiser
          </p>
        </div>
        <button
          type="button"
          onClick={() => bgInputRef.current?.click()}
          disabled={busyBg}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
        >
          {busyBg ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImagePlus className="h-3.5 w-3.5" />
          )}
          Enviar imagem
        </button>
      </div>
      <ScenesGallery />

      <p className="pt-1 text-[13px] font-medium text-neutral-400">
        Fundo da cena
      </p>
      <div className="grid grid-cols-3 gap-1">
        {BG_OPTIONS.filter((o) => o.value !== "transparent").map((o) => (
          <button
            key={o.value}
            type="button"
            title={o.title}
            onClick={() => patch("bg", { type: o.value })}
            className={cn(
              "rounded-lg border px-1 py-2 text-xs font-bold transition-all",
              bg.type === o.value
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {/* opção "Sem fundo" em destaque — transparente de verdade */}
      <button
        type="button"
        title="A caneca fica sobre transparência (xadrez). Exporte em PNG/WebP para manter o fundo invisível."
        onClick={() => patch("bg", { type: "transparent" })}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-all",
          bg.type === "transparent"
            ? "border-primary/70 bg-primary/15 text-primary"
            : "border-white/15 bg-white/[0.03] text-neutral-300 hover:border-white/30 hover:text-white",
        )}
      >
        <TransparentSwatch />
        <span className="flex-1 text-[13px] font-bold">Fundo transparente</span>
        {bg.type === "transparent" && <Check className="h-3.5 w-3.5" />}
      </button>
      {bg.type === "transparent" && (
        <p className="rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-2 text-xs leading-relaxed text-neutral-300">
          O fundo some de verdade (veja o xadrez atrás da caneca). Na
          exportação, marque
          <strong className="text-primary">
            {" "}
            “Sem fundo (PNG transparente)”
          </strong>{" "}
          e escolha PNG ou WebP — a caneca fica pronta para montar em qualquer
          lugar, com a sombra suave preservada.
        </p>
      )}
      {bg.type === "gradient" && (
        <>
          <ColorRow
            label="Cor 1 (topo)"
            value={bg.colorA}
            onChange={(v) => patch("bg", { colorA: v })}
          />
          <ColorRow
            label="Cor 2 (base)"
            value={bg.colorB}
            onChange={(v) => patch("bg", { colorB: v })}
          />
          <SliderRow
            label="Ângulo"
            value={bg.angle}
            min={0}
            max={360}
            onChange={(v) => patch("bg", { angle: v })}
            defaultValue={90}
            format={(v) => `${Math.round(v)}°`}
          />
        </>
      )}
      {bg.type === "solid" && (
        <ColorRow
          label="Cor do fundo"
          value={bg.colorB}
          onChange={(v) => patch("bg", { colorB: v })}
        />
      )}

      {bg.type === "image" && (
        <>
          <p className="text-xs text-neutral-500">
            Fundo ativo:{" "}
            {SCENES.find((s) => s.id === bg.imageId)?.label ?? "imagem enviada"}
            . JPG, PNG ou WebP · até 25 MB.
          </p>
          <Segmented
            label="Encaixe da foto"
            value={bg.imageFit}
            options={[
              { value: "cover", label: "Cobrir" },
              { value: "contain", label: "Conter" },
              { value: "stretch", label: "Esticar" },
            ]}
            onChange={(v) => patch("bg", { imageFit: v })}
          />
          <SliderRow
            label="Zoom"
            value={bg.imageZoom * 100}
            min={50}
            max={300}
            onChange={(v) => patch("bg", { imageZoom: v / 100 })}
            defaultValue={100}
            format={(v) => `${(v / 100).toFixed(1)}×`}
          />
          <SliderRow
            label="Posição horizontal"
            value={bg.imageX * 100}
            min={-100}
            max={100}
            onChange={(v) => patch("bg", { imageX: v / 100 })}
            defaultValue={0}
          />
          <SliderRow
            label="Posição vertical"
            value={bg.imageY * 100}
            min={-100}
            max={100}
            onChange={(v) => patch("bg", { imageY: v / 100 })}
            defaultValue={0}
          />
          <SliderRow
            label="Rotação da foto"
            value={bg.imageRot}
            min={-180}
            max={180}
            onChange={(v) => patch("bg", { imageRot: v })}
            defaultValue={0}
            format={(v) => `${Math.round(v)}°`}
          />
          <div className="flex gap-1.5">
            <MiniButton
              onClick={() => patch("bg", { imageMirror: !bg.imageMirror })}
              active={bg.imageMirror}
              className="flex-1"
            >
              <FlipHorizontal2 className="mr-1 inline h-3 w-3" /> Espelhar
            </MiniButton>
            <MiniButton
              onClick={() =>
                patch("bg", { imageX: 0, imageY: 0, imageZoom: 1, imageRot: 0 })
              }
              className="flex-1"
            >
              <Crosshair className="mr-1 inline h-3 w-3" /> Centralizar
            </MiniButton>
          </div>
          <SliderRow
            label="Desfoque"
            value={bg.imageBlur}
            min={0}
            max={20}
            step={0.5}
            onChange={(v) => patch("bg", { imageBlur: v })}
            defaultValue={0}
            format={(v) => (v <= 0.2 ? "sem desfoque" : `${v.toFixed(1)} px`)}
          />
          <SliderRow
            label="Clarear / escurecer"
            value={bg.imageBright * 100}
            min={50}
            max={160}
            onChange={(v) => patch("bg", { imageBright: v / 100 })}
            defaultValue={100}
            format={(v) =>
              v === 100
                ? "normal"
                : v > 100
                  ? `+${Math.round(v - 100)}% claro`
                  : `${Math.round(100 - v)}% escuro`
            }
          />
          <ToggleRow
            label="Combinar luz com o fundo"
            checked={bg.matchLight}
            onChange={(v) => patch("bg", { matchLight: v })}
          />
          <p className="text-xs leading-relaxed text-neutral-500">
            Tinge levemente a iluminação com a cor média da foto — a caneca fica
            “dentro” do cenário.
          </p>
          <MiniButton
            onClick={() => setBgAdjustMode(!bgAdjustMode)}
            active={bgAdjustMode}
            className="w-full"
          >
            <Move className="mr-1 inline h-3 w-3" /> Ajustar fundo no 3D
          </MiniButton>
          {bgAdjustMode && (
            <p className="text-xs leading-relaxed text-primary">
              Modo ativo: arraste direto na cena para posicionar (guia de centro
              com encaixe magnético). Duplo clique recentra.
            </p>
          )}
        </>
      )}
      {bg.type === "transparent" && (
        <p className="text-xs leading-relaxed text-neutral-500">
          Fundo invisível para exportar PNG/WebP com alfa — a sombra continua
          sobre a transparência.
        </p>
      )}

      <p
        className="pt-1 text-[13px] font-medium text-neutral-400"
        title="Como a base da cena aparece embaixo da caneca"
      >
        Base / chão
      </p>
      <div className="grid grid-cols-3 gap-1">
        {FLOOR_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            title={o.title}
            onClick={() => patch("bg", { floor: o.value })}
            className={cn(
              "rounded-lg border px-1 py-2 text-xs font-bold transition-all",
              (bg.floor ?? "continuo") === o.value
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {(bg.floor ?? "continuo") === "base-redonda" && (
        <p className="text-xs leading-relaxed text-neutral-500">
          Prato redondo de cerâmica clara sob a caneca — look de loja de
          produtos artesanais.
        </p>
      )}
      {(bg.floor ?? "continuo") === "base-quadrada" && (
        <p className="text-xs leading-relaxed text-neutral-500">
          Placa quadrada com cantos arredondados — o clássico dos mockups
          premium.
        </p>
      )}
      {(bg.floor ?? "continuo") === "pedestal" && (
        <p className="text-xs leading-relaxed text-neutral-500">
          Pódium escuro elevado — destaque de vitrine.
        </p>
      )}
      {(bg.floor ?? "continuo") === "flutuante" && (
        <ToggleRow
          label="Flutuar suavemente"
          checked={bg.floatAnim}
          onChange={(v) => patch("bg", { floatAnim: v })}
        />
      )}
      {(bg.floor ?? "continuo") === "flutuante" && (
        <p className="text-xs leading-relaxed text-neutral-500">
          Sem chão: a sombra vira um borrão suave no ar — quanto mais alta a
          caneca, mais difusa. As exportações saem paradas.
        </p>
      )}
      {(bg.type === "studio-dark" || bg.type === "solid") && (
        <ToggleRow
          label="Brilho suave atrás da caneca"
          checked={bg.glow ?? false}
          onChange={(v) => patch("bg", { glow: v })}
        />
      )}
      <ToggleRow
        label="Sombra de contato"
        checked={bg.contactShadow}
        onChange={(v) => patch("bg", { contactShadow: v })}
      />
      <ToggleRow
        label="Sombra projetada"
        checked={bg.castShadow}
        onChange={(v) => patch("bg", { castShadow: v })}
      />
    </Section>
  );
}

/* ---------------- Iluminação ---------------- */

export function LightPanel() {
  const light = useMockupStore((s) => s.light);
  const patch = useMockupStore((s) => s.patch);

  return (
    <Section title="Iluminação" icon={Lightbulb} defaultOpen>
      <div className="grid grid-cols-2 gap-1">
        {LIGHT_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => patch("light", { preset: p.id })}
            className={cn(
              "rounded-lg border px-2 py-2 text-xs font-bold transition-all",
              light.preset === p.id
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <SliderRow
        label="Intensidade geral"
        value={light.intensity * 100}
        min={20}
        max={200}
        onChange={(v) => patch("light", { intensity: v / 100 })}
        defaultValue={100}
        format={(v) => `${Math.round(v)}%`}
      />
      <SliderRow
        label="Cor da luz"
        value={light.temperature}
        min={-2500}
        max={2500}
        onChange={(v) => patch("light", { temperature: v })}
        defaultValue={0}
        format={(v) =>
          v === 0
            ? "neutra"
            : v > 0
              ? `+${Math.round(v)} K (mais quente)`
              : `${Math.round(v)} K (mais fria)`
        }
      />
      <SliderRow
        label="Girar o estúdio"
        value={light.rotation}
        min={0}
        max={360}
        onChange={(v) => patch("light", { rotation: v })}
        defaultValue={0}
        format={(v) => `${Math.round(v)}°`}
      />
      <SliderRow
        label="Suavidade das sombras"
        value={light.softness * 100}
        min={0}
        max={100}
        onChange={(v) => patch("light", { softness: v / 100 })}
        defaultValue={50}
        format={(v) => `${Math.round(v)}%`}
      />
      <Section title="Sombras" icon={Lightbulb} defaultOpen>
        <SliderRow
          label="Intensidade da sombra"
          min={0}
          max={100}
          value={(light.shadowOpacity ?? 0.44) * 100}
          defaultValue={44}
          onChange={(v) => patch("light", { shadowOpacity: v / 100 })}
          format={(v) => `${Math.round(v)}%`}
        />
        <ColorRow
          label="Cor da sombra"
          value={light.shadowColor ?? "#292520"}
          onChange={(v) => patch("light", { shadowColor: v })}
        />
        <p className="text-xs text-neutral-500">
          A sombra acompanha a peça também ao exportar imagem e vídeo, quando
          habilitada na cena.
        </p>
      </Section>
      <SliderRow
        label="Reflexos do estúdio"
        value={light.envIntensity * 100}
        min={0}
        max={200}
        onChange={(v) => patch("light", { envIntensity: v / 100 })}
        defaultValue={100}
        format={(v) => `${Math.round(v)}%`}
      />
    </Section>
  );
}

/* ---------------- Câmera ---------------- */

export function CameraPanel() {
  const camera = useMockupStore((s) => s.camera);
  const patch = useMockupStore((s) => s.patch);
  const applyPreset = useMockupStore((s) => s.applyCameraPreset);
  const rotateMug = useMockupStore((s) => s.rotateMug);
  const requestFocus = useMockupStore((s) => s.requestFocus);
  const frameAll = useMockupStore((s) => s.frameAll);
  const showGuides = useMockupStore((s) => s.showGuides);
  const setShowGuides = useMockupStore((s) => s.setShowGuides);

  const toggleFullscreen = () => {
    const el = document.getElementById("mockup-root");
    if (!document.fullscreenElement) el?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  return (
    <Section title="Câmera" icon={Camera} defaultOpen>
      <SliderRow
        label="Lente (zoom óptico)"
        value={camera.lens}
        min={24}
        max={100}
        onChange={(v) => patch("camera", { lens: v })}
        defaultValue={85}
        format={(v) => `${Math.round(v)} mm equivalente`}
      />
      <div className="grid grid-cols-3 gap-1">
        {CAMERA_PRESETS.map((p) => (
          <MiniButton
            key={p.id}
            onClick={() =>
              applyPreset({
                ...p,
                // Legacy camera distances were composed with a 50 mm lens.
                pos: p.pos.map(
                  (v, i) =>
                    p.target[i] + ((v - p.target[i]) * camera.lens) / 50,
                ) as [number, number, number],
              })
            }
            className="!px-1 !text-xs"
            title={`Ver a caneca de: ${p.label}`}
          >
            {p.label}
          </MiniButton>
        ))}
      </div>
      <div className="flex gap-1.5">
        <MiniButton
          onClick={requestFocus}
          className="flex-1"
          title="Aproxima a câmera da caneca"
        >
          <Crosshair className="mr-1 inline h-3 w-3" /> Focar (F)
        </MiniButton>
        <MiniButton
          onClick={() => rotateMug(180)}
          className="flex-1"
          title="Mostra o lado de trás da caneca"
        >
          <RotateCw className="mr-1 inline h-3 w-3" /> Virar
        </MiniButton>
      </div>
      <MiniButton
        onClick={frameAll}
        className="w-full"
        title="Ajusta a câmera para caber todas as canecas no quadro"
      >
        <Move className="mr-1 inline h-3 w-3" /> Enquadrar tudo
      </MiniButton>
      <ToggleRow
        label="Giro automático"
        checked={camera.autoRotate}
        onChange={(v) => patch("camera", { autoRotate: v })}
      />
      {camera.autoRotate && (
        <>
          <Segmented
            label="Sentido"
            value={camera.direction ?? "right"}
            options={[
              { value: "right", label: "Direita" },
              { value: "left", label: "Esquerda" },
              { value: "pingpong", label: "Vai e volta" },
            ]}
            onChange={(direction) => patch("camera", { direction })}
          />
          <SliderRow
            label="Segundos por volta"
            min={3}
            max={20}
            step={1}
            value={camera.secondsPerTurn ?? 8}
            defaultValue={8}
            onChange={(secondsPerTurn) => patch("camera", { secondsPerTurn })}
            format={(v) => `${Math.round(v)} s / volta`}
          />
          <div className="flex gap-2">
            {[4, 6, 10].map((seconds) => (
              <button
                key={seconds}
                type="button"
                className="rounded-lg border px-3 py-2 text-xs"
                onClick={() => patch("camera", { secondsPerTurn: seconds })}
              >
                {seconds}s
              </button>
            ))}
          </div>
          <Section title="Velocidade técnica" icon={Camera}>
            <SliderRow
              label="Velocidade do giro"
              value={camera.autoRotateSpeed}
              min={0.2}
              max={6}
              step={0.1}
              onChange={(v) => patch("camera", { autoRotateSpeed: v })}
              defaultValue={1.6}
            />
          </Section>
        </>
      )}
      <ToggleRow
        label="Guias de enquadramento"
        checked={showGuides}
        onChange={setShowGuides}
      />
      <p className="-mt-2 text-xs leading-relaxed text-neutral-500">
        Grade de terços para compor a foto como profissional.
      </p>
      <MiniButton
        onClick={toggleFullscreen}
        className="w-full"
        title="Mostra o estúdio em tela cheia"
      >
        <Maximize className="mr-1 inline h-3 w-3" /> Tela cheia
      </MiniButton>
    </Section>
  );
}

/* ---------------- Diálogo de exportação ---------------- */

type ExportTab = "imagem" | "video" | "gif" | "lote" | "folha";

const EXPORT_TABS: { id: ExportTab; label: string }[] = [
  { id: "imagem", label: "Imagem" },
  { id: "video", label: "Vídeo" },
  { id: "gif", label: "GIF" },
  { id: "lote", label: "Lote" },
  { id: "folha", label: "Folha" },
];

export function ExportDialog() {
  const open = useMockupStore((s) => s.exportOpen);
  const setOpen = useMockupStore((s) => s.setExportOpen);
  const [tab, setTab] = useState<ExportTab>("imagem");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto border-white/10 bg-[#141110] text-neutral-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" /> Exportar
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Imagens em alta resolução, vídeo em MP4 ou WebM com ALFA, GIF
            animado, lote em ZIP e a folha de sublimação.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-1 flex gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
          {EXPORT_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 rounded-lg px-1.5 py-2 text-[13px] font-bold transition-all",
                tab === t.id
                  ? "bg-primary text-[#1d130d] shadow-sm"
                  : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "imagem" && <ImageTab />}
        {tab === "video" && <VideoTab />}
        {tab === "gif" && <GifTab />}
        {tab === "lote" && <BatchTab />}
        {tab === "folha" && <TemplateTab />}
      </DialogContent>
    </Dialog>
  );
}

/* ---------- aba imagem ---------- */

function ImageTab() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const es = useMockupStore((s) => s.exportSettings);
  const setExport = useMockupStore((s) => s.setExport);
  const art = useMockupStore((s) => s.art);
  const wm = useMockupStore((s) => s.watermark);
  const sceneBackground = useMockupStore((s) => s.bg);
  const patch = useMockupStore((s) => s.patch);
  const setOpen = useMockupStore((s) => s.setExportOpen);
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const background =
    es.background ?? (es.transparent ? "transparent" : "scene");
  const destination =
    es.dpi === 300
      ? "print"
      : es.ratioId === "story"
        ? "story"
        : es.ratioId === "sq"
          ? "social"
          : "custom";
  function chooseDestination(value: string) {
    if (value === "print")
      setExport({
        ratioId: "custom",
        customW: 3000,
        customH: 3000,
        scale: 1,
        format: "png",
        dpi: 300,
      });
    else if (value === "custom")
      setExport({ ratioId: "custom", dpi: undefined });
    else
      setExport({
        ratioId: value === "story" ? "story" : "sq",
        scale: 1,
        dpi: undefined,
      });
  }

  const ratio = EXPORT_RATIOS.find((r) => r.id === es.ratioId);
  const width =
    (es.ratioId === "custom" ? es.customW : (ratio?.w ?? 1080)) * es.scale;
  const height =
    (es.ratioId === "custom" ? es.customH : (ratio?.h ?? 1080)) * es.scale;

  const [preview, setPreview] = useState<Awaited<ReturnType<typeof exportImage>> | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [draft, setDraft] = useState<Awaited<ReturnType<typeof exportImage>> | null>(null);
  const [draftUrl, setDraftUrl] = useState<string | null>(null);
  const [draftBusy, setDraftBusy] = useState(false);
  const [draftError, setDraftError] = useState("");
  // Both preview and full-size export share one WebGL renderer. Serialize them.
  const renderQueue = useRef<Promise<unknown>>(Promise.resolve());
  const enqueueRender = useCallback((options: Parameters<typeof exportImage>[0], isCurrent: () => boolean = () => true) => {
    const task = renderQueue.current.catch(() => {}).then(() => {
      if (!isCurrent()) throw new Error("Prévia substituída por uma configuração mais recente.");
      return exportImage(options);
    });
    renderQueue.current = task.catch(() => {});
    return task;
  }, []);
  // Settings changes always require a fresh preview; download reuses its exact blob.
  useEffect(() => { setPreview(null); }, [es, wm, sceneBackground]);
  useEffect(() => {
    if (!preview) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(preview.blob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [preview]);
  useEffect(() => {
    if (!draft) { setDraftUrl(null); return; }
    const url = URL.createObjectURL(draft.blob);
    setDraftUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [draft]);

  // A small automatic render shows the real background and output crop without
  // allocating a full-resolution/supersampled export on every control change.
  useEffect(() => {
    let cancelled = false;
    setDraft(null);
    setDraftError("");
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1 || width > MAX_EXPORT_PX || height > MAX_EXPORT_PX) {
      setDraftBusy(false);
      return;
    }
    setDraftBusy(true);
    const timer = window.setTimeout(() => {
      const scale = Math.min(1, 720 / Math.max(width, height));
      void enqueueRender({
        width: Math.max(1, Math.round(width * scale)),
        height: Math.max(1, Math.round(height * scale)),
        format: es.format,
        quality: es.quality,
        transparent: background === "transparent",
        background,
        supersample: 1,
      }, () => !cancelled).then((result) => {
        if (!cancelled) setDraft(result);
      }).catch((e) => {
        if (!cancelled) setDraftError(e instanceof Error ? e.message : "Não foi possível carregar a prévia.");
      }).finally(() => {
        if (!cancelled) setDraftBusy(false);
      });
    }, 350);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [width, height, es.format, es.quality, background, wm, sceneBackground, enqueueRender]);

  const estimate = useMemo(() => {
    const px = width * height;
    const f =
      es.format === "png"
        ? 0.9
        : es.format === "jpeg"
          ? 0.12 * es.quality
          : 0.09 * es.quality;
    const bytes = px * f;
    return bytes > 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
      : `${Math.round(bytes / 1024)} KB`;
  }, [width, height, es.format, es.quality]);

  const doExport = async () => {
    setBusy(true);
    try {
      const res = await enqueueRender({
        width,
        height,
        format: es.format,
        quality: es.quality,
        transparent: background === "transparent",
        background,
        dpi: es.dpi,
        supersample: 4,
      });
      if (useMockupStore.getState().exportSettings === es && useMockupStore.getState().watermark === wm && useMockupStore.getState().bg === sceneBackground) setPreview(res);
    } catch (e) {
      toast({
        title: "Falha na exportação",
        description:
          e instanceof ExportError
            ? e.message
            : "Erro inesperado ao renderizar a imagem.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const sendToEditor = async () => {
    if (busy || sending) return;
    setSending(true);
    try {
      // Sem sombra de piso no PNG transferido: o editor permite refazê-la para cada fundo.
      // Iluminação/reflexos da cerâmica permanecem; arquivo só no browser/IndexedDB.
      const transferScale = Math.min(1, 2400 / Math.max(width, height));
      const res = await enqueueRender({
        width: Math.round(width * transferScale),
        height: Math.round(height * transferScale),
        format: "png", quality: 1, transparent: true,
        background: "transparent", supersample: 2, hideGroundShadow: true,
      });
      // Remova apenas as margens alfa vazias. O Editor encaixa a caneca pelo
      // tamanho real do produto, não pelo quadro 16:9 da exportação.
      const handoff = await trimTransparentMockup(res.blob);
      await writeHandoff(handoff.blob);
      setOpen(false);
      router.push("/editor-artes?from=mockup");
    } catch (e) {
      toast({ title: "Não foi possível enviar ao Editor", description: e instanceof Error ? e.message : "Tente novamente.", variant: "destructive" });
    } finally { setSending(false); }
  };

  const tooBig = width > MAX_EXPORT_PX || height > MAX_EXPORT_PX;

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-xl border border-primary/25 bg-primary/5 p-3" aria-label="Prévia da exportação">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Prévia do mockup</p>
          <span className="text-xs text-neutral-400">{width} × {height} px</span>
        </div>
        <div className="relative flex min-h-48 items-center justify-center overflow-hidden rounded-lg p-2"
          style={{ background: 'repeating-conic-gradient(#dfdfda 0% 25%, #f5f5f1 0% 50%) 50% / 20px 20px' }} aria-busy={draftBusy}>
          {draftUrl && <img src={draftUrl}
            alt="Prévia do mockup com o fundo e o enquadramento da exportação"
            className="max-h-64 max-w-full object-contain" />}
          {draftBusy && <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/45 text-sm text-white" role="status">
            <Loader2 className="h-4 w-4 animate-spin" />Atualizando prévia…
          </div>}
          {!draftUrl && !draftBusy && <p className="max-w-xs text-center text-xs text-neutral-700" role="status">
            {draftError || "Escolha um tamanho válido para visualizar a composição."}
          </p>}
        </div>
        <p className="text-xs leading-relaxed text-neutral-400">A prévia atualiza com o tamanho e o fundo escolhidos. Use Pré-visualizar exportação para conferir o arquivo final em alta resolução.</p>
      </div>
      <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-3">
        <label
          className="block text-sm font-semibold"
          htmlFor="cg-export-purpose"
        >
          Onde você vai usar?
        </label>
        <select
          id="cg-export-purpose"
          value={destination}
          disabled={busy}
          onChange={(e) => chooseDestination(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-[#252222] p-3 text-sm text-neutral-100"
        >
          <option value="social">WhatsApp / Redes · quadrado 1:1</option>
          <option value="story">Stories / Reels · vertical 9:16</option>
          <option value="print">Alta resolução Print · 300 DPI</option>
          <option value="custom">Personalizado / outros formatos</option>
        </select>
        <p className="text-xs leading-relaxed text-neutral-400">
          {destination === "print"
            ? "PNG de 3000 × 3000 px com resolução de 300 DPI gravada no arquivo (25,4 × 25,4 cm)."
            : destination === "story"
              ? "Imagem vertical de 1080 × 1920 px para suas redes."
              : destination === "social"
                ? "Imagem de 1080 × 1080 px para enviar ao cliente ou publicar."
                : "Abra os ajustes avançados para definir as medidas."}
        </p>
      </div>
      <Segmented
        label="Fundo da imagem"
        value={background}
        options={[
          { value: "scene", label: "Cenário atual" },
          { value: "white", label: "Branco" },
          { value: "transparent", label: "Transparente" },
        ]}
        onChange={(value) =>
          setExport({
            background: value,
            transparent: value === "transparent",
            ...(value === "transparent" ? { format: "png" as const } : {}),
          })
        }
      />
      <Section
        key={destination === "custom" ? "custom" : "preset"}
        title="Avançado: tamanho e formato"
        icon={Settings2}
        defaultOpen={destination === "custom"}
      >
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-neutral-400">
            Proporção
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              ...EXPORT_RATIOS,
              {
                id: "custom",
                label: "Personalizado",
                w: es.customW,
                h: es.customH,
              },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setExport({ ratioId: r.id, dpi: undefined })}
                className={cn(
                  "rounded-lg border px-2 py-2 text-xs font-bold transition-all",
                  es.ratioId === r.id
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200",
                )}
              >
                {r.label}
                <span className="block text-xs font-normal opacity-70">
                  {r.w}×{r.h}
                </span>
              </button>
            ))}
          </div>
        </div>

        {es.ratioId === "custom" && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="mb-1 text-[13px] text-neutral-400">Largura (px)</p>
              <input
                type="number"
                value={es.customW}
                aria-label="Largura da imagem em pixels"
                min={200}
                max={MAX_EXPORT_PX}
                onChange={(e) =>
                  setExport({
                    customW: Math.max(
                      200,
                      Math.min(MAX_EXPORT_PX, +e.target.value || 1080),
                    ),
                  })
                }
                className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-neutral-100 outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <p className="mb-1 text-[13px] text-neutral-400">Altura (px)</p>
              <input
                type="number"
                value={es.customH}
                aria-label="Altura da imagem em pixels"
                min={200}
                max={MAX_EXPORT_PX}
                onChange={(e) =>
                  setExport({
                    customH: Math.max(
                      200,
                      Math.min(MAX_EXPORT_PX, +e.target.value || 1080),
                    ),
                  })
                }
                className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-neutral-100 outline-none focus:border-primary/60"
              />
            </div>
          </div>
        )}

        <Segmented
          label="Qualidade / escala"
          value={String(es.scale)}
          options={[
            { value: "1", label: "1×" },
            { value: "2", label: "2× HD" },
            { value: "3", label: "3×" },
            { value: "4", label: "4×" },
          ]}
          onChange={(v) => setExport({ scale: Number(v) as 1 | 2 | 3 | 4 })}
        />

        <Segmented
          label="Formato"
          value={es.format}
          options={[
            { value: "png", label: "PNG" },
            { value: "jpeg", label: "JPG" },
            { value: "webp", label: "WebP" },
          ]}
          onChange={(v) =>
            setExport({
              format: v,
              ...(v === "jpeg" && background === "transparent"
                ? { background: "white", transparent: false }
                : {}),
              ...(v !== "png" ? { dpi: undefined } : {}),
            })
          }
        />

        <p className="text-[13px] leading-relaxed text-neutral-400">
          PNG é sem perda de qualidade. A resolução define o detalhe; DPI define
          o tamanho de impressão. O render usa até 4× de suavização (até 2× com
          efeitos), conforme a memória e a GPU. O arquivo mantém os pixels
          escolhidos.
        </p>
        {es.format !== "png" && (
          <SliderRow
            label="Compressão"
            value={es.quality * 100}
            min={50}
            max={100}
            onChange={(v) => setExport({ quality: v / 100 })}
            defaultValue={92}
            format={(v) => `${Math.round(v)}%`}
          />
        )}
      </Section>

      <Section title="Marca d’água" icon={Eye}>
        <WatermarkBox wm={wm} patch={patch} />
      </Section>

      <p className="text-xs text-neutral-400">Enquadramento automático: a exportação adapta a câmera à proporção escolhida para incluir as peças. Confira a prévia final antes de baixar.</p>
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[13px]">
        <span className="text-neutral-400">
          Saída:{" "}
          <strong className="text-neutral-100">
            {width} × {height} px
          </strong>
        </span>
        <span className="text-neutral-500">≈ {estimate}</span>
      </div>

      {!art.imageId && (
        <p className="flex items-center gap-1.5 text-[13px] text-amber-400">
          <TriangleAlert className="h-3.5 w-3.5" /> A caneca está sem arte —
          envie uma imagem ou use o exemplo.
        </p>
      )}
      {tooBig && (
        <p className="flex items-center gap-1.5 text-[13px] text-red-400">
          <TriangleAlert className="h-3.5 w-3.5" /> Reduza a escala: máximo de{" "}
          {MAX_EXPORT_PX} px por lado.
        </p>
      )}

      {preview && previewUrl && <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-3">
        <p className="text-sm font-semibold">Confira a imagem antes de baixar</p>
        <div className="flex min-h-40 items-center justify-center overflow-hidden rounded-lg" style={{ background: 'repeating-conic-gradient(#dfdfda 0% 25%, #f5f5f1 0% 50%) 50% / 20px 20px' }}>
          <img src={previewUrl} alt="Pré-visualização exata da imagem que será exportada" className="max-h-80 max-w-full object-contain" />
        </div>
        <p className="text-xs text-neutral-400">{preview.width} × {preview.height} px · {(preview.blob.size / 1024 / 1024).toFixed(2)} MB. O download terá exatamente esta imagem, com o fundo e o enquadramento exibidos.</p>
        <FinalPreviewViewer result={preview} />
        <PrimaryButton className="w-full" onClick={() => {
          downloadBlob(preview.blob, preview.filename);
          toast({ title: "Imagem exportada!", description: `${preview.width} × ${preview.height} px · arquivo conferido na prévia.` });
          setOpen(false);
        }}><Download className="h-4 w-4" />Confirmar e baixar imagem</PrimaryButton>
      </div>}

      <button type="button" onClick={() => void sendToEditor()} disabled={busy || sending}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#e67f2c]/50 bg-[#422719] px-4 py-3 text-sm font-bold text-[#ffad68] transition-colors hover:bg-[#59321f] disabled:opacity-40">
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
        {sending ? "Transferindo composição..." : "Enviar mockup para o Editor de Artes"}
      </button>
      <p className="text-xs text-neutral-500">A caneca é transferida em PNG transparente pelo próprio navegador, sem upload para o servidor. As margens transparentes são recortadas automaticamente para facilitar o encaixe nos templates.</p>
      <PrimaryButton
        onClick={doExport}
        disabled={busy || tooBig}
        className="w-full"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {busy ? "Preparando a prévia…" : preview ? "Atualizar pré-visualização" : "Pré-visualizar exportação"}
      </PrimaryButton>
    </div>
  );
}

/* ---------- marca d'água (compartilhada) ---------- */

function WatermarkBox({
  wm,
  patch,
}: {
  wm: ReturnType<typeof useMockupStore.getState>["watermark"];
  patch: ReturnType<typeof useMockupStore.getState>["patch"];
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
      <ToggleRow
        label="Marca d'água"
        checked={getStudioPlan() === "free" || wm.enabled}
        onChange={(v) =>
          patch("watermark", { enabled: getStudioPlan() === "free" || v })
        }
      />
      {wm.enabled && (
        <div className="mt-2 space-y-2">
          <input
            value={wm.text}
            onChange={(e) =>
              patch("watermark", { text: e.target.value.slice(0, 60) })
            }
            placeholder="Texto da marca d'água"
            className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-neutral-100 outline-none focus:border-primary/60"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Posição</span>
            <div className="flex flex-1 gap-1">
              {(
                [
                  ["tl", "↑←"],
                  ["tr", "↑→"],
                  ["bl", "↓←"],
                  ["br", "↓→"],
                ] as const
              ).map(([p, icon]) => (
                <button
                  key={p}
                  onClick={() => patch("watermark", { position: p })}
                  className={cn(
                    "flex-1 rounded-md border py-1 text-xs font-bold transition-all",
                    wm.position === p
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-white/10 text-neutral-400 hover:text-neutral-200",
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <SliderRow
            label="Tamanho"
            value={wm.size * 100}
            min={1.6}
            max={6}
            step={0.1}
            onChange={(v) => patch("watermark", { size: v / 100 })}
            defaultValue={2.8}
            format={(v) => `${v.toFixed(1)}% da largura`}
          />
          <SliderRow
            label="Opacidade"
            value={wm.opacity * 100}
            min={10}
            max={100}
            onChange={(v) => patch("watermark", { opacity: v / 100 })}
            defaultValue={70}
            format={(v) => `${Math.round(v)}%`}
          />
        </div>
      )}
    </div>
  );
}

/* ---------- aba vídeo ---------- */

function VideoTab() {
  const video = useMockupStore((s) => s.video);
  const patch = useMockupStore((s) => s.patch);
  const mug = useMockupStore((s) => s.mug);
  const bg = useMockupStore((s) => s.bg);
  const wm = useMockupStore((s) => s.watermark);
  const setOpen = useMockupStore((s) => s.setExportOpen);
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const isMagic = mug.variant === "magic";

  const doExport = async () => {
    setBusy(true);
    setProgress(0);
    abortRef.current = new AbortController();
    try {
      const res = await exportVideo(video.res, {
        anim: video.anim,
        duration: video.duration,
        fps: video.fps,
        transparent: video.transparent,
        quality: video.quality ?? "high",
        direction: video.direction ?? "right",
        turns: video.turns ?? 1,
        signal: abortRef.current.signal,
        onProgress: setProgress,
      });
      downloadBlob(res.blob, res.filename);
      setOpen(false);
      toast({
        title: "Vídeo exportado!",
        description: `${res.width} × ${res.height} · ${(res.blob.size / 1024 / 1024).toFixed(1)} MB · ${video.transparent ? "WebM com ALFA" : res.mimeType.includes("mp4") ? "MP4 (H.264)" : "WebM"}${res.engine === "mediarecorder" ? " · Qualidade reduzida (navegador sem WebCodecs)" : ""}`,
      });
    } catch (e) {
      toast({
        title: "Falha no vídeo",
        description:
          e instanceof ExportError
            ? e.message
            : "Erro inesperado ao renderizar o vídeo.",
        variant: "destructive",
      });
    } finally {
      abortRef.current = null;
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <Segmented
        label="Movimento"
        value={video.anim}
        options={[
          { value: "giro", label: "Giro 360°" },
          { value: "orbita", label: "Órbita" },
          { value: "zoom", label: "Zoom" },
          { value: "revelacao", label: "Revelação" },
        ]}
        onChange={(v) => patch("video", { anim: v })}
      />
      {video.anim === "revelacao" && !isMagic && (
        <p className="flex items-center gap-1.5 text-[13px] text-amber-400">
          <TriangleAlert className="h-3.5 w-3.5" /> A revelação térmica exige a
          caneca mágica (aba Caneca).
        </p>
      )}
      <ToggleRow
        label="ALFA — fundo transparente"
        checked={!!video.transparent}
        onChange={(v) => patch("video", { transparent: v })}
      />
      {video.transparent && (
        <p className="text-[13px] leading-relaxed text-neutral-400">
          Exporta em WebM com canal alfa, sem o fundo da cena. Mantém a peça e
          as sombras transparentes para sobrepor em outras composições. Efeitos
          de tela inteira ficam desativados nesta exportação. Use um editor que
          aceite WebM com alfa; alguns players exibem o fundo preto.
        </p>
      )}
      {bg.type === "transparent" && !video.transparent && (
        <p className="flex items-center gap-1.5 text-[13px] text-amber-400">
          <TriangleAlert className="h-3.5 w-3.5" /> Ative ALFA para preservar o
          fundo transparente. No vídeo normal, ele sai preto.
        </p>
      )}

      <SliderRow
        label="Duração"
        value={video.duration}
        min={3}
        max={20}
        onChange={(v) => patch("video", { duration: v })}
        defaultValue={5}
        format={(v) => `${v} segundos`}
      />

      <div className="flex gap-2 flex-wrap">
        {[5, 10, 15, 20].map((seconds) => (
          <button
            key={seconds}
            type="button"
            onClick={() => patch("video", { duration: seconds })}
            className={`rounded-lg px-3 py-2 text-xs border ${video.duration === seconds ? "border-orange-500 bg-orange-100 text-orange-950" : "border-neutral-400/25"}`}
          >
            {seconds}s
          </button>
        ))}
      </div>
      <Segmented
        label="Qualidade"
        value={video.quality ?? "high"}
        options={[
          { value: "fast", label: "Rápida" },
          { value: "high", label: "Alta" },
          { value: "ultra", label: "Ultra" },
        ]}
        onChange={(quality) => patch("video", { quality })}
      />
      {video.anim === "giro" && (
        <>
          <Segmented
            label="Sentido do giro"
            value={video.direction ?? "right"}
            options={[
              { value: "right", label: "Direita" },
              { value: "left", label: "Esquerda" },
              { value: "pingpong", label: "Vai e volta" },
            ]}
            onChange={(direction) => patch("video", { direction })}
          />
          <Segmented
            label="Voltas"
            value={String(video.turns ?? 1)}
            options={[
              { value: "0.5", label: "½" },
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
            ]}
            onChange={(v) =>
              patch("video", { turns: Number(v) as 0.5 | 1 | 2 | 3 })
            }
          />
        </>
      )}
      <Segmented
        label="Quadros por segundo"
        value={String(video.fps)}
        options={[
          { value: "24", label: "24 fps" },
          { value: "30", label: "30 fps" },
          { value: "60", label: "60 fps" },
        ]}
        onChange={(v) => patch("video", { fps: Number(v) as 24 | 30 | 60 })}
      />

      <div>
        <p className="mb-1.5 text-[13px] font-medium text-neutral-400">
          Resolução
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(VIDEO_RESOLUTIONS).map(([id, r]) => (
            <button
              key={id}
              onClick={() => patch("video", { res: id as VideoState["res"] })}
              className={cn(
                "rounded-lg border px-2 py-2 text-xs font-bold transition-all",
                video.res === id
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200",
              )}
            >
              {r.label}
              <span className="block text-xs font-normal opacity-70">
                {r.w}×{r.h}
              </span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs font-semibold text-neutral-400">
        Tamanho previsto: cerca de{" "}
        {(() => {
          const r = VIDEO_RESOLUTIONS[video.res] ?? VIDEO_RESOLUTIONS.wide;
          const pixels = r.w * r.h;
          const factor =
            video.quality === "ultra"
              ? 1.15
              : video.quality === "fast"
                ? 0.42
                : 0.72;
          const rate = Math.min(
            110_000_000,
            Math.max(
              pixels >= 3840 * 2160
                ? 60_000_000
                : pixels >= 2560 * 1440
                  ? 35_000_000
                  : 20_000_000,
              pixels * video.fps * factor,
            ),
          );
          return Math.round((rate * video.duration) / 8_000_000);
        })()}{" "}
        MB (estimativa para MP4; o resultado varia)
      </p>
      <p className="text-xs text-neutral-500">
        4K e 60 fps usam mais memória. Se houver limite no navegador, escolha 2K
        ou Full HD. O resultado depende da resolução da arte enviada.
      </p>
      <WatermarkBox wm={wm} patch={patch} />

      {busy && (
        <ProgressBar
          progress={progress}
          label={`Renderizando ${Math.round(progress * 100)}%`}
        />
      )}

      {busy && (
        <button
          type="button"
          onClick={() => abortRef.current?.abort()}
          className="w-full rounded-lg border border-red-400/40 p-2 text-xs text-red-500"
        >
          Cancelar exportação
        </button>
      )}
      <PrimaryButton
        onClick={doExport}
        disabled={busy || (video.anim === "revelacao" && !isMagic)}
        className="w-full"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {busy
          ? "Gravando…"
          : video.transparent
            ? "Gerar WebM com ALFA"
            : "Gerar vídeo"}
      </PrimaryButton>
      <p className="text-center text-xs text-neutral-500">
        {video.transparent
          ? "WebM com ALFA • processamento no seu dispositivo. Se o navegador não for compatível, avisaremos antes de gerar."
          : "MP4 quando disponível; WebM em outros navegadores. Sem upload, tudo no seu dispositivo."}
      </p>
    </div>
  );
}

/* ---------- aba GIF ---------- */

function GifTab() {
  const gif = useMockupStore((s) => s.gif);
  const patch = useMockupStore((s) => s.patch);
  const mug = useMockupStore((s) => s.mug);
  const wm = useMockupStore((s) => s.watermark);
  const setOpen = useMockupStore((s) => s.setExportOpen);
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const isMagic = mug.variant === "magic";

  const doExport = async () => {
    setBusy(true);
    setProgress(0);
    try {
      const res = await exportGif(gif.width, {
        anim: gif.anim,
        duration: gif.duration,
        fps: gif.fps,
        onProgress: setProgress,
      });
      downloadBlob(res.blob, res.filename);
      setOpen(false);
      toast({
        title: "GIF exportado!",
        description: `${res.width} × ${res.height} · ${(res.blob.size / 1024 / 1024).toFixed(1)} MB · loop infinito`,
      });
    } catch (e) {
      toast({
        title: "Falha no GIF",
        description:
          e instanceof ExportError
            ? e.message
            : "Erro inesperado ao gerar o GIF.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <Segmented
        label="Movimento"
        value={gif.anim}
        options={[
          { value: "giro", label: "Giro 360°" },
          { value: "orbita", label: "Órbita" },
          { value: "zoom", label: "Zoom" },
          { value: "revelacao", label: "Revelação" },
        ]}
        onChange={(v) => patch("gif", { anim: v })}
      />
      {gif.anim === "revelacao" && !isMagic && (
        <p className="flex items-center gap-1.5 text-[13px] text-amber-400">
          <TriangleAlert className="h-3.5 w-3.5" /> A revelação térmica exige a
          caneca mágica.
        </p>
      )}

      <SliderRow
        label="Duração"
        value={gif.duration}
        min={2}
        max={8}
        onChange={(v) => patch("gif", { duration: v })}
        defaultValue={4}
        format={(v) => `${v} segundos`}
      />

      <Segmented
        label="Quadros por segundo"
        value={String(gif.fps)}
        options={[
          { value: "10", label: "10" },
          { value: "15", label: "15" },
          { value: "20", label: "20" },
        ]}
        onChange={(v) => patch("gif", { fps: Number(v) as 10 | 15 | 20 })}
      />

      <Segmented
        label="Largura"
        value={String(gif.width)}
        options={[
          { value: "360", label: "360 px" },
          { value: "480", label: "480 px" },
          { value: "640", label: "640 px" },
        ]}
        onChange={(v) => patch("gif", { width: Number(v) as 360 | 480 | 640 })}
      />

      <WatermarkBox wm={wm} patch={patch} />

      {busy && (
        <ProgressBar
          progress={progress}
          label={`Gerando GIF ${Math.round(progress * 100)}%`}
        />
      )}

      <PrimaryButton
        onClick={doExport}
        disabled={busy || (gif.anim === "revelacao" && !isMagic)}
        className="w-full"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {busy ? "Gerando…" : "Gerar GIF"}
      </PrimaryButton>
    </div>
  );
}

/* ---------- aba lote ---------- */

const BATCH_ANGLE_IDS = [
  "atual",
  "frente",
  "tres-quartos",
  "costas",
  "lateral-esq",
  "heroi",
  "close-arte",
  "topo",
];

function BatchTab() {
  const mug = useMockupStore((s) => s.mug);
  const art = useMockupStore((s) => s.art);
  const wm = useMockupStore((s) => s.watermark);
  const patch = useMockupStore((s) => s.patch);
  const setOpen = useMockupStore((s) => s.setExportOpen);
  const { toast } = useToast();
  const [angles, setAngles] = useState<string[]>([
    "atual",
    "frente",
    "tres-quartos",
  ]);
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [ratioId, setRatioId] = useState("sq");
  const [transparent, setTransparent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const variants = batchVariantsFor(mug.variant);
  const ratio = EXPORT_RATIOS.find((r) => r.id === ratioId) ?? EXPORT_RATIOS[0];

  const toggleAngle = (id: string) =>
    setAngles((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  const doExport = async () => {
    setBusy(true);
    setProgress(0);
    try {
      const res = await exportBatch({
        angles,
        variants,
        width: ratio.w,
        height: ratio.h,
        format,
        quality: 0.92,
        transparent: transparent && format === "png",
        onProgress: setProgress,
      });
      downloadBlob(res.blob, res.filename);
      setOpen(false);
      toast({
        title: "ZIP gerado!",
        description: `${res.count} imagens · ${(res.blob.size / 1024 / 1024).toFixed(1)} MB`,
      });
    } catch (e) {
      toast({
        title: "Falha no lote",
        description: e instanceof ExportError ? e.message : "Erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-[13px] font-medium text-neutral-400">
          Ângulos (escolha vários)
        </p>
        <div className="grid grid-cols-4 gap-1">
          {BATCH_ANGLE_IDS.map((id) => {
            const p = CAMERA_PRESETS.find((c) => c.id === id);
            const label = id === "atual" ? "Atual" : (p?.label ?? id);
            return (
              <button
                key={id}
                onClick={() => toggleAngle(id)}
                className={cn(
                  "rounded-lg border px-1 py-2 text-xs font-bold transition-all",
                  angles.includes(id)
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[13px] font-medium text-neutral-400">
          Variantes
        </p>
        <div className="flex flex-wrap gap-1">
          {variants.map((v) => (
            <span
              key={v.id}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-bold text-neutral-300"
            >
              {v.label}
            </span>
          ))}
        </div>
        {mug.variant !== "magic" && (
          <p className="mt-1 text-xs text-neutral-500">
            Dica: com a caneca mágica selecionada o lote sai com as versões fria
            e quente.
          </p>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-[13px] font-medium text-neutral-400">
          Proporção
        </p>
        <div className="grid grid-cols-4 gap-1">
          {EXPORT_RATIOS.filter((r) => r.id !== "catalog").map((r) => (
            <button
              key={r.id}
              onClick={() => setRatioId(r.id)}
              className={cn(
                "rounded-lg border px-1 py-2 text-xs font-bold transition-all",
                ratioId === r.id
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <Segmented
        label="Formato"
        value={format}
        options={[
          { value: "png", label: "PNG" },
          { value: "jpeg", label: "JPG" },
        ]}
        onChange={(v) => setFormat(v)}
      />
      {format === "png" && (
        <ToggleRow
          label="Sem fundo (PNG transparente)"
          checked={transparent}
          onChange={setTransparent}
        />
      )}

      <WatermarkBox wm={wm} patch={patch} />

      {!art.imageId && (
        <p className="flex items-center gap-1.5 text-[13px] text-amber-400">
          <TriangleAlert className="h-3.5 w-3.5" /> A caneca está sem arte.
        </p>
      )}
      {busy && (
        <ProgressBar
          progress={progress}
          label={`Renderizando ${Math.round(progress * 100)}%`}
        />
      )}

      <PrimaryButton
        onClick={doExport}
        disabled={busy || !angles.length || !art.imageId}
        className="w-full"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {busy
          ? "Gerando…"
          : `Exportar ${angles.length * variants.length} imagens em ZIP`}
      </PrimaryButton>
    </div>
  );
}

/* ---------- aba folha (template planificado) ---------- */

function TemplateTab() {
  const art = useMockupStore((s) => s.art);
  const [dpi, setDpi] = useState<300 | 600>(300);
  const [guides, setGuides] = useState(true);
  const setOpen = useMockupStore((s) => s.setExportOpen);
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const area = useMemo(() => resolvePrintArea(art), [art]);
  const widthCm = area.arcCm;
  const heightCm = area.heightCm;
  const outW = Math.round((widthCm * dpi) / 2.54);
  const outH = Math.round((heightCm * dpi) / 2.54);

  const doExport = async () => {
    setBusy(true);
    try {
      const res = await exportTemplate({ dpi, guides });
      downloadBlob(res.blob, res.filename);
      setOpen(false);
      toast({
        title: "Folha gerada!",
        description: `${res.width} × ${res.height} px · ${dpi} DPI — pronta para a prensa.`,
      });
    } catch (e) {
      toast({
        title: "Falha na folha",
        description: e instanceof ExportError ? e.message : "Erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const areaLabel =
    area.mode === "forno"
      ? "Forno 360° — envolve a caneca toda até a alça"
      : area.mode === "alta"
        ? "Altura cheia — papel 21×9,7"
        : area.mode === "custom"
          ? "Medidas personalizadas"
          : "Prensa padrão — 20,7 × 8,7 cm";

  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[13px] leading-relaxed text-neutral-300">
        A folha planificada é a arte no tamanho exato de impressão — envie
        direto para a prensa térmica. Ela segue o{" "}
        <strong className="text-primary">
          tamanho configurado no painel Arte
        </strong>
        ({areaLabel}) e os ajustes de escala, posição e repetir.
      </p>

      <Segmented
        label="Resolução de impressão"
        value={String(dpi)}
        options={[
          { value: "300", label: "300 DPI (padrão)" },
          { value: "600", label: "600 DPI (máx.)" },
        ]}
        onChange={(v) => setDpi(Number(v) as 300 | 600)}
      />

      <ToggleRow
        label="Guias de corte e margem de segurança"
        checked={guides}
        onChange={setGuides}
      />

      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[13px]">
        <span className="text-neutral-400">
          Área:{" "}
          <strong className="text-neutral-100">
            {widthCm.toFixed(1).replace(".", ",")} ×{" "}
            {heightCm.toFixed(1).replace(".", ",")} cm
          </strong>
        </span>
        <span className="text-neutral-500">
          {outW} × {outH} px
        </span>
      </div>

      {!art.imageId && (
        <p className="flex items-center gap-1.5 text-[13px] text-amber-400">
          <TriangleAlert className="h-3.5 w-3.5" /> Envie uma arte primeiro.
        </p>
      )}

      <PrimaryButton
        onClick={doExport}
        disabled={busy || !art.imageId}
        className="w-full"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {busy ? "Gerando…" : "Baixar folha PNG"}
      </PrimaryButton>
    </div>
  );
}

/* ---------- barra de progresso ---------- */

function ProgressBar({ progress, label }: { progress: number; label: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-neutral-400">
        <span>{label}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-150"
          style={{ width: `${Math.max(3, progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
