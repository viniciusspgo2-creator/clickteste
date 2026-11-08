/* ============================================================
   Estado central do Mockup Studio — Zustand + undo/redo
   ============================================================ */

"use client";

import { create } from "zustand";
import {
  BODY_MAX_R,
  FLOAT_LIFT,
  MUG_FULL_R,
  MUG_GAP_MIN,
  PEDESTAL_H,
  CIRC_CM,
  MODEL_METRICS,
  resolvePrintArea,
  type AreaMode,
  type FloorType,
} from "../lib/config";
import { getArtImage } from "../lib/art-registry";
import { suggestArtLayout } from "../lib/art-analysis";
import { NEUTRAL_ADJUSTMENTS } from "../lib/art-adjustments";
import { DEFAULT_CERAMIC_FINISH, migrateCeramicFinish } from "../lib/ceramic-finishes";
import type { HandleStyle } from "../scene/mug-geometry";
import { normalizeHandleStyle } from "../lib/handle-styles";

export type MugModel =
  | "classic"
  | "square"
  | "cone"
  | "beer"
  | "latte"
  | "tea";
export interface ArtState {
  decalImageId?: string | null;
  decalScale?: number;
  decalX?: number;
  decalY?: number;
  decalRotation?: number;
  decalOpacity?: number;
  baseImageId?: string | null;
  baseRotation?: number;
  baseScale?: number;
  baseOffsetX?: number;
  baseOffsetY?: number;
  metallic?: boolean;
  bleed: number;
  brightness: number;
  contrast: number;
  saturation: number;
  vibrance: number;
  temperature: number;
  sharpness: number;
  opacity: number;
  imageId: string | null;
  name: string;
  width: number; // px naturais
  height: number;
  scale: number; // 0.1..3
  offsetX: number; // -1..1 (wrap em volta da caneca)
  offsetY: number; // -1..1
  rotation: number; // -180..180
  mirror: boolean;
  fit: "cover" | "contain" | "stretch";
  repeat: number; // 1..4
  /** tamanho da área de impressão na caneca (prensa / altura cheia / forno / custom) */
  areaMode: AreaMode;
  areaW: number; // cm — largura do arco (modo custom)
  areaH: number; // cm — altura da área (modo custom)
  areaY: number; // cm — deslocamento vertical da área (modo custom, + sobe)
  /** camada de texto (ideia de editor concorrente, implementada ao nosso jeito) */
  text: string;
  textColor: string;
  textSize: number; // fração da altura da área (0.04..0.24)
  textY: number; // -1..1
}

export interface MugState {
  model: MugModel;
  handleStyle: HandleStyle;
  baseColor?: string;
  bodyColor: string;
  interiorColor: string;
  handleColor: string;
  clearcoat: number;
  clearcoatRoughness?: number;
  specularIntensity?: number;
  glazeStrength?: number;
  roughness: number;
  reflection: number;
  faithfulColor: boolean;
  posX: number;
  posZ: number;
  locked: boolean;
  hidden: boolean;
  name: string;
  variant: "white" | "accent" | "magic";
  accentColor: string; // alça e interior (nas mágicas também)
  magicHeat: number; // 0..1 — 0 = fria (preta) · 1 = quente (arte revelada)
  magicDirection: "baixo" | "lateral" | "radial"; // de onde a revelação começa
  magicDissolve: number; // 0..1 — 0 = linha reta · 1 = dissolução total
  rotationY: number; // graus — gira a caneca (não a câmera)
  tiltX: number; // graus -35..35 (inclina p/ frente/trás)
  tiltZ: number; // graus -30..30 (inclina p/ esquerda/direita)
  scale: number; // 0.6..1.4
  posY: number; // cm -1..2
}

export interface LightState {
  keyStrength?: number;
  fillStrength?: number;
  rimStrength?: number;
  ambientStrength?: number;
  hdriId?: string | null;
  preset: string;
  intensity: number; // multiplicador 0.2..2
  temperature: number; // offset em K aplicado via absoluto? usa valor direto -2000..+2000
  rotation: number; // 0..360 gira o rig
  softness: number; // 0..1 suavidade da sombra
  shadowOpacity?: number;
  shadowColor?: string;
  /** Offsets and spread of the photographic floor shadow (cm / relative multiplier). */
  shadowShiftX?: number;
  shadowShiftZ?: number;
  shadowSpread?: number;
  envIntensity: number; // 0..2 reflexos do estúdio
}

export interface BackgroundState {
  imageContrast: number;
  imageVignette: number;
  type:
    | "studio-white"
    | "studio-dark"
    | "gradient"
    | "solid"
    | "image"
    | "transparent";
  colorA: string;
  colorB: string;
  angle: number; // 0..360
  contactShadow: boolean;
  castShadow: boolean;
  /** tipo de chão — padrão: contínuo (sem borda) */
  floor: FloorType;
  /** brilho suave atrás da caneca (look premium) — desligado por padrão */
  glow: boolean;
  /** animação leve de sobe-e-desce (só preview; exportações saem paradas) */
  floatAnim: boolean;
  /* ---- imagem de fundo ---- */
  imageId: string | null;
  imageFit: "cover" | "contain" | "stretch";
  imageZoom: number; // 0.5..3
  imageX: number; // -1..1
  imageY: number; // -1..1
  imageRot: number; // -180..180
  imageMirror: boolean;
  imageBlur: number; // 0..20 px
  imageBright: number; // 0.5..1.6
  /** tinge o ambiente com a cor média da foto */
  matchLight: boolean;
}

export interface CameraState {
  lens: number; // 24..100 mm
  autoRotate: boolean;
  spinIds?: string[] | null;
  autoRotateSpeed: number; // 0.2..6
  direction?: "right" | "left" | "pingpong";
  secondsPerTurn?: number;
}

/** caneca acompanhante para cenas com várias canecas (máx. 3) */
export interface CompanionMug {
  model?: MugModel;
  handleStyle?: HandleStyle;
  baseColor?: string;
  bodyColor?: string;
  interiorColor?: string;
  handleColor?: string;
  clearcoat?: number;
  clearcoatRoughness?: number;
  specularIntensity?: number;
  glazeStrength?: number;
  roughness?: number;
  reflection?: number;
  faithfulColor?: boolean;
  name?: string;
  tiltX?: number;
  tiltZ?: number;
  posY?: number;
  locked?: boolean;
  hidden?: boolean;
  art?: ArtState;
  id: string;
  variant: "white" | "accent" | "magic";
  accentColor: string;
  magicHeat: number; // 0..1 (só variante mágica)
  showArt: boolean; // usa a mesma arte da caneca principal
  rotationY: number; // graus
  posX: number; // cm -18..18
  posZ: number; // cm -14..14
  scale: number; // 0.65..1.35
}

/** pós-processamento — grading, bloom, vinheta e granulado */
export interface FxState {
  enabled: boolean;
  lut: "none" | "vivo" | "quente" | "frio" | "cinema" | "pb";
  exposure: number; // 0.5..1.8
  contrast: number; // -0.5..0.5
  saturation: number; // -1..1
  temperature: number; // -1..1
  vignette: number; // 0..1
  bloom: number; // 0..1
  grain: number; // 0..1
}

export interface WatermarkState {
  enabled: boolean;
  text: string;
  position: "tl" | "tr" | "bl" | "br";
  opacity: number; // 0.1..1
  size: number; // fração da largura 0.02..0.06
}

export type VideoAnim = "giro" | "orbita" | "zoom" | "revelacao";

export interface VideoState {
  anim: VideoAnim;
  transparent: boolean;
  duration: number; // 3..20 s
  fps: 24 | 30 | 60;
  res: "sq1080" | "hd" | "vertical" | "wide" | "qhd" | "uhd" | "story4k" | "square4k" | "feed" | "feed4k";
  quality?: "fast" | "high" | "ultra";
  direction?: "right" | "left" | "pingpong";
  turns?: 0.5 | 1 | 2 | 3;
}

export interface GifState {
  anim: VideoAnim;
  duration: number; // 2..8 s
  fps: 10 | 15 | 20;
  width: 360 | 480 | 640;
}

export interface ExportState {
  ratioId: string;
  customW: number;
  customH: number;
  scale: 1 | 2 | 3 | 4;
  format: "png" | "jpeg" | "webp";
  quality: number; // 0.5..1
  transparent: boolean;
  background?: "scene" | "white" | "transparent";
  dpi?: number;
}

export interface CameraPresetRequest {
  pos: [number, number, number];
  target: [number, number, number];
  nonce: number;
}

type Snapshot = {
  art: ArtState;
  mug: MugState;
  light: LightState;
  bg: BackgroundState;
  companions: CompanionMug[];
  fx: FxState;
  camera: CameraState;
  layerOrder: string[];
  projectName: string;
  watermark: WatermarkState;
  video: VideoState;
  gif: GifState;
  exportSettings: ExportState;
};

export type PatchSlice =
  | "art"
  | "mug"
  | "light"
  | "bg"
  | "camera"
  | "fx"
  | "watermark"
  | "video"
  | "gif";

interface MockupStore {
  selectedIds: string[];
  layerOrder: string[];
  tool: "select" | "move" | "rotate" | "scale" | "art" | "pan";
  snapEnabled: boolean;
  compareArt: boolean;
  zoom: number;
  select: (id: string, additive?: boolean) => void;
  setTool: (tool: MockupStore["tool"]) => void;
  setSnap: (v: boolean) => void;
  setCompare: (v: boolean) => void;
  setZoom: (v: number) => void;
  patchObject: (id: string, partial: Partial<MugState>) => void;
  commitObjectTransforms: (updates: Record<string, Partial<MugState>>) => void;
  patchObjectArt: (id: string, partial: Partial<ArtState>) => void;
  duplicateSelected: () => void;
  copyArtToAll: (sourceId: string) => void;
  deleteSelected: () => void;
  transformSelected: (axis: "posX" | "posY" | "posZ", delta: number) => void;
  alignSelected: (kind: "left" | "center" | "right" | "distribute") => void;
  reorderLayer: (id: string, direction: -1 | 1) => void;
  compose: (
    kind: "solo" | "pair" | "trio" | "row" | "fan" | "stack" | "gift",
  ) => void;
  projectName: string;
  art: ArtState;
  mug: MugState;
  light: LightState;
  bg: BackgroundState;
  camera: CameraState;
  exportSettings: ExportState;
  companions: CompanionMug[];
  fx: FxState;
  watermark: WatermarkState;
  video: VideoState;
  gif: GifState;
  presetRequest: CameraPresetRequest | null;
  focusNonce: number;
  artAppliedNonce: number; // microinteração ao aplicar arte
  exportOpen: boolean;
  projectsOpen: boolean;
  /** modo "ajustar fundo no 3D" (arrasta a imagem de fundo direto na cena) */
  bgAdjustMode: boolean;
  /** guias de enquadramento (grade de terços) */
  showGuides: boolean;
  /** incrementado quando uma posição foi ajustada para canecas não se sobreporem */
  collisionNonce: number;
  /** incrementado para pedir "Enquadrar tudo" na câmera */
  fitNonce: number;
  fitDirection: [number, number, number] | null;
  // histórico
  past: Snapshot[];
  future: Snapshot[];
  // ações
  setProjectName: (n: string) => void;
  patch: <K extends PatchSlice>(
    slice: K,
    partial: Partial<MockupStore[K]>,
  ) => void;
  setArtImage: (meta: {
    objectId?: string;
    imageId: string;
    name: string;
    width: number;
    height: number;
  }) => void;
  clearArt: () => void;
  notifyArtApplied: () => void;
  rotateMug: (deg: number) => void;
  applyCameraPreset: (p: {
    pos: [number, number, number];
    target: [number, number, number];
  }) => void;
  requestFocus: () => void;
  setExportOpen: (v: boolean) => void;
  setExport: (partial: Partial<ExportState>) => void;
  addCompanion: () => void;
  patchCompanion: (id: string, partial: Partial<CompanionMug>) => void;
  removeCompanion: (id: string) => void;
  arrangeScene: (kind: "duo" | "trio" | "quarto" | "vitrine" | "solo") => void;
  spreadEvenly: () => void;
  frameAll: () => void;
  setBgAdjustMode: (v: boolean) => void;
  setShowGuides: (v: boolean) => void;
  setProjectsOpen: (v: boolean) => void;
  hydrate: (s: {
    projectName?: string;
    art?: Partial<ArtState>;
    mug?: Partial<MugState>;
    light?: Partial<LightState>;
    bg?: Partial<BackgroundState>;
    camera?: Partial<CameraState>;
    exportSettings?: Partial<ExportState>;
    companions?: CompanionMug[];
    layerOrder?: string[];
    fx?: Partial<FxState>;
    watermark?: Partial<WatermarkState>;
    video?: Partial<VideoState>;
    gif?: Partial<GifState>;
  }) => void;
  undo: () => void;
  redo: () => void;
  resetAll: (keepArt?: boolean) => void;
}

export const migrateMugModel = (model: unknown): MugModel =>
  (["classic", "square", "cone", "beer", "latte", "tea"] as string[]).includes(String(model))
    ? model as MugModel : "classic";

const initialArt: ArtState = {
  bleed: 0,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  sharpness: 0,
  opacity: 1,
  imageId: null,
  name: "",
  width: 0,
  height: 0,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  mirror: false,
  fit: "cover",
  repeat: 1,
  areaMode: "forno",
  areaW: 20.7,
  areaH: 8.7,
  areaY: 0,
  text: "",
  textColor: "#1d130d",
  textSize: 0.09,
  textY: 0.15,
};

const initialMug: MugState = {
  model: "classic",
  handleStyle: "classic",
  bodyColor: "#ffffff",
  interiorColor: "#ffffff",
  handleColor: "#ffffff",
  ...DEFAULT_CERAMIC_FINISH,
  faithfulColor: true,
  posX: 0,
  posZ: 0,
  locked: false,
  hidden: false,
  name: "Caneca 01",
  variant: "white",
  accentColor: "#1d130d",
  magicHeat: 0.85,
  magicDirection: "baixo",
  magicDissolve: 0.35,
  rotationY: 55,
  tiltX: 0,
  tiltZ: 0,
  scale: 1,
  posY: 0,
};

const initialLight: LightState = {
  preset: "suave",
  intensity: 1,
  temperature: 0,
  rotation: 0,
  softness: 0.5,
  shadowOpacity: 0.44,
  shadowColor: "#242424",
  shadowShiftX: 0, shadowShiftZ: 0, shadowSpread: 1,
  envIntensity: 1,
};

const initialBg: BackgroundState = {
  imageContrast: 0,
  imageVignette: 0,
  type: "studio-white",
  colorA: "#e8703a",
  colorB: "#161210",
  angle: 90,
  contactShadow: true,
  castShadow: true,
  floor: "continuo",
  glow: false,
  floatAnim: false,
  imageId: null,
  imageFit: "cover",
  imageZoom: 1,
  imageX: 0,
  imageY: 0,
  imageRot: 0,
  imageMirror: false,
  imageBlur: 0,
  imageBright: 1,
  matchLight: false,
};

const initialCamera: CameraState = {
  lens: 85,
  autoRotate: false,
  spinIds: null,
  autoRotateSpeed: 1.6,
  direction: "right",
  secondsPerTurn: 8,
};

const initialFx: FxState = {
  enabled: false,
  lut: "none",
  exposure: 1,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  vignette: 0,
  bloom: 0,
  grain: 0,
};

const initialWatermark: WatermarkState = {
  enabled: false,
  text: "Feito no Mockup Studio · Click & Gruda",
  position: "br",
  opacity: 0.7,
  size: 0.028,
};

const initialVideo: VideoState = {
  anim: "giro",
  transparent: false,
  duration: 5,
  fps: 30,
  res: "wide",
  quality: "high",
  direction: "right",
  turns: 1,
};

const initialGif: GifState = {
  anim: "giro",
  duration: 4,
  fps: 15,
  width: 480,
};

/* ============ Encaixe sem sobreposição (T2) ============ */

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const round2 = (v: number) => Math.round(v * 100) / 100;

/** direção mundial da alça no plano XZ (graus, atan2(z, x)) — rotY como no mug.tsx */
function handleDirDeg(rotationY: number): number {
  const rad = (rotationY * Math.PI) / 180;
  return (Math.atan2(-Math.cos(rad), Math.sin(rad)) * 180) / Math.PI;
}

/** raio efetivo de uma caneca NA DIREÇÃO do outro objeto (a alça ocupa um setor ±55°) */
function effRadius(
  rotationY: number,
  scale: number,
  angleToDeg: number,
): number {
  const hd = handleDirDeg(rotationY);
  const d = Math.abs(((angleToDeg - hd + 540) % 360) - 180); // 0..180
  const rBody = BODY_MAX_R * scale;
  return d <= 55 ? Math.max(rBody, MUG_FULL_R * scale) : rBody;
}

function minDistBetween(
  a: { rotationY: number; scale: number; posX: number; posZ: number },
  b: { rotationY: number; scale: number; posX: number; posZ: number },
): number {
  const angA = (Math.atan2(b.posZ - a.posZ, b.posX - a.posX) * 180) / Math.PI;
  return (
    effRadius(a.rotationY, a.scale, angA) +
    effRadius(b.rotationY, b.scale, angA + 180) +
    MUG_GAP_MIN
  );
}

interface Posed {
  posX: number;
  posZ: number;
  rotationY: number;
  scale: number;
}

/**
 * Empurra as canecas acompanhantes até nenhuma encostar na principal
 * (em 0,0) nem entre si — respeitando a alça em qualquer rotação.
 */
function resolveOverlaps(
  list: CompanionMug[],
  hero: { rotationY: number; scale: number },
): { list: CompanionMug[]; moved: boolean } {
  const arr = list.map((c) => ({ ...c }));
  let moved = false;

  for (let iter = 0; iter < 24; iter++) {
    let touched = false;

    for (let i = 0; i < arr.length; i++) {
      const c = arr[i];
      // vs caneca principal
      const dist = Math.hypot(c.posX, c.posZ);
      const need = minDistBetween({ ...hero, posX: 0, posZ: 0 }, c as Posed);
      if (dist < need - 0.01) {
        const a = dist > 0.001 ? Math.atan2(c.posZ, c.posX) : Math.PI / 2;
        arr[i] = {
          ...c,
          posX: round2(Math.cos(a) * need),
          posZ: round2(Math.sin(a) * need),
        };
        touched = true;
      }
      // vs outras acompanhantes
      for (let j = i + 1; j < arr.length; j++) {
        const o = arr[j];
        const dd = Math.hypot(o.posX - arr[i].posX, o.posZ - arr[i].posZ);
        const need2 = minDistBetween(arr[i] as Posed, o as Posed);
        if (dd < need2 - 0.01) {
          const a =
            dd > 0.001
              ? Math.atan2(o.posZ - arr[i].posZ, o.posX - arr[i].posX)
              : 0.7;
          const push = (need2 - dd) / 2 + 0.06;
          arr[i] = {
            ...arr[i],
            posX: round2(arr[i].posX - Math.cos(a) * push),
            posZ: round2(arr[i].posZ - Math.sin(a) * push),
          };
          arr[j] = {
            ...o,
            posX: round2(o.posX + Math.cos(a) * push),
            posZ: round2(o.posZ + Math.sin(a) * push),
          };
          touched = true;
        }
      }
    }

    if (!touched) break;
    moved = true;
  }

  const limited = arr.map((c) => ({
    ...c,
    posX: clamp(c.posX, -150, 150),
    posZ: clamp(c.posZ, -150, 150),
  }));
  return { list: limited, moved };
}

let companionSeq = 0;
export function makeCompanion(partial?: Partial<CompanionMug>): CompanionMug {
  return {
    id: `comp_${Date.now()}_${++companionSeq}`,
    variant: "accent",
    accentColor: "#e8703a",
    magicHeat: 0.85,
    showArt: true,
    rotationY: -25,
    posX: 10.8,
    posZ: 0.6,
    scale: 0.95,
    ...partial,
  };
}

/**
 * Arranjos prontos — posições calculadas para NUNCA encostar nem
 * atravessar em qualquer rotação (alças apontam para fora do grupo).
 */
export const ARRANGEMENTS: Record<string, ReturnType<typeof makeCompanion>[]> =
  {
    duo: [makeCompanion({ posX: 10.8, posZ: 0.6, rotationY: 90, scale: 0.98 })],
    trio: [
      makeCompanion({ posX: -10.8, posZ: 0.8, rotationY: -90, scale: 0.94 }),
      makeCompanion({
        posX: 10.8,
        posZ: 0.8,
        rotationY: 90,
        scale: 0.94,
        variant: "white",
      }),
    ],
    quarto: [
      makeCompanion({ posX: -10.6, posZ: 3.4, rotationY: -115, scale: 0.92 }),
      makeCompanion({
        posX: 10.6,
        posZ: 3.4,
        rotationY: 115,
        scale: 0.92,
        variant: "white",
      }),
      makeCompanion({
        posX: 0,
        posZ: -12.4,
        rotationY: 0,
        scale: 0.9,
        variant: "magic",
        accentColor: "#8b2f1d",
      }),
    ],
    vitrine: [
      makeCompanion({ posX: -12.2, posZ: 2.2, rotationY: -125, scale: 0.9 }),
      makeCompanion({
        posX: 12.2,
        posZ: 2.2,
        rotationY: 125,
        scale: 0.9,
        variant: "white",
      }),
      makeCompanion({
        posX: 0,
        posZ: -12.8,
        rotationY: 0,
        scale: 0.86,
        variant: "magic",
        accentColor: "#1f4d3f",
      }),
    ],
  };

const initialExport: ExportState = {
  ratioId: "sq",
  customW: 1080,
  customH: 1080,
  scale: 1,
  format: "png",
  quality: 0.92,
  transparent: false,
};

const HISTORY_LIMIT = 60;
let commitTimer: ReturnType<typeof setTimeout> | null = null;

function snap(s: MockupStore): Snapshot {
  return {
    art: s.art,
    mug: s.mug,
    light: s.light,
    bg: s.bg,
    companions: s.companions,
    fx: s.fx,
    camera: s.camera,
    layerOrder: s.layerOrder,
    projectName: s.projectName,
    watermark: s.watermark,
    video: s.video,
    gif: s.gif,
    exportSettings: s.exportSettings,
  };
}

export const useMockupStore = create<MockupStore>((set, get) => {
  /** agenda coalescência do histórico (um snapshot por rajada de mudanças) */
  const scheduleCommit = () => {
    if (commitTimer) clearTimeout(commitTimer);
    commitTimer = setTimeout(() => {
      commitTimer = null;
    }, 500);
  };

  /** guarda snapshot ANTES da rajada (uma vez) */
  const guardHistory = (force = false) => {
    const s = get();
    if (force || !commitTimer) {
      const past = [...s.past, snap(s)].slice(-HISTORY_LIMIT);
      set({ past, future: [] } as Partial<MockupStore>);
    }
    scheduleCommit();
  };

  return {
    selectedIds: ["hero"],
    layerOrder: ["hero"],
    tool: "select",
    snapEnabled: true,
    compareArt: false,
    zoom: 100,
    select: (id, additive = false) =>
      set((s) => ({
        selectedIds: additive
          ? s.selectedIds.includes(id)
            ? s.selectedIds.filter((x) => x !== id)
            : [...s.selectedIds, id]
          : [id],
      })),
    setTool: (tool) => set({ tool }),
    setSnap: (snapEnabled) => set({ snapEnabled }),
    setCompare: (compareArt) => set({ compareArt }),
    setZoom: (zoom) => set({ zoom: Math.min(300, Math.max(25, zoom)) }),
    patchObject: (id, partial) => {
      const st = get();
      const obj =
        id === "hero" ? st.mug : st.companions.find((c) => c.id === id);
      if (
        !obj ||
        (obj.locked && !("locked" in partial) && !("hidden" in partial))
      )
        return;
      guardHistory();
      if (id === "hero") set({ mug: { ...st.mug, ...partial } });
      else
        set({
          companions: st.companions.map((c) =>
            c.id === id ? { ...c, ...partial } : c,
          ),
        });
    },
    commitObjectTransforms: (updates) => {
      const st = get();
      const eligible = Object.fromEntries(Object.entries(updates).filter(([id]) => {
        const object = id === "hero" ? st.mug : st.companions.find(c => c.id === id);
        return object && !object.locked && !object.hidden;
      }));
      if (!Object.keys(eligible).length) return;
      // A completed pointer gesture is one undo step, regardless of its duration
      // or how many pieces were selected. Preview transforms never enter history.
      guardHistory(true);
      set({
        mug: eligible.hero ? { ...st.mug, ...eligible.hero } : st.mug,
        companions: st.companions.map(c => eligible[c.id] ? { ...c, ...eligible[c.id] } : c),
      });
      if (commitTimer) clearTimeout(commitTimer);
      commitTimer = null;
    },
    patchObjectArt: (id, partial) => {
      const st = get();
      const object =
        id === "hero" ? st.mug : st.companions.find((c) => c.id === id);
      if (object?.locked) return;
      guardHistory();
      if (id === "hero") set({ art: { ...st.art, ...partial } });
      else
        set({
          companions: st.companions.map((c) =>
            c.id === id
              ? { ...c, showArt: partial.imageId ? true : c.showArt, art: { ...(c.art ?? st.art), ...partial } }
              : c,
          ),
        });
    },
    copyArtToAll: (sourceId) => {
      const st = get();
      const source = sourceId === "hero" ? st.art : st.companions.find(c => c.id === sourceId)?.art;
      if (!source?.imageId) return;
      guardHistory(true);
      set({
        art: st.mug.locked ? st.art : { ...source },
        companions: st.companions.map(c => c.locked ? c : { ...c, art: { ...source }, showArt: true }),
        compareArt: false, artAppliedNonce: st.artAppliedNonce + 1,
      });
    },
    duplicateSelected: () => {
      guardHistory(true);
      const st = get();
      let list = [...st.companions];
      const ids: string[] = [];
      for (const id of st.selectedIds) {
        if (list.length >= 7) break;
        const src =
          id === "hero"
            ? { ...st.mug, art: st.art, showArt: true }
            : list.find((c) => c.id === id);
        if (!src || src.locked) continue;
        // A conservative spacing includes the handle and every existing object.
        let x = (src.posX ?? 0) + 15 * src.scale,
          z = src.posZ ?? 0;
        const occupied = [st.mug, ...list];
        while (
          occupied.some(
            (o) =>
              Math.hypot((o.posX ?? 0) - x, (o.posZ ?? 0) - z) <
              14 * Math.max(o.scale, src.scale),
          )
        )
          x += 15;
        const c = makeCompanion({
          ...src,
          id: undefined,
          name: `${src.name ?? "Caneca"} cópia`,
          posX: x,
          posZ: z,
          art: { ...(src.art ?? st.art) },
          locked: false,
        });
        if (!c.id) c.id = `comp_${Date.now()}_${++companionSeq}`;
        list.push(c);
        ids.push(c.id);
      }
      set({
        companions: list,
        selectedIds: ids,
        layerOrder: [...st.layerOrder, ...ids],
        fitNonce: st.fitNonce + 1,
        fitDirection: null,
        zoom: 100,
      });
    },
    deleteSelected: () => {
      guardHistory(true);
      const st = get();
      const removed = st.selectedIds.filter((id) =>
        id === "hero"
          ? !st.mug.locked
          : !st.companions.find((c) => c.id === id)?.locked,
      );
      set({
        mug: removed.includes("hero") ? { ...st.mug, hidden: true } : st.mug,
        companions: st.companions.filter((c) => !removed.includes(c.id)),
        selectedIds: [],
        layerOrder: st.layerOrder.filter(
          (id) => id === "hero" || !removed.includes(id),
        ),
      });
    },
    transformSelected: (axis, delta) => {
      for (const id of get().selectedIds) {
        const st = get();
        const o =
          id === "hero" ? st.mug : st.companions.find((c) => c.id === id);
        if (o) get().patchObject(id, { [axis]: (o[axis] ?? 0) + delta });
      }
    },
    alignSelected: (kind) => {
      const st = get();
      const list = st.selectedIds
        .map((id) => ({
          id,
          o: id === "hero" ? st.mug : st.companions.find((c) => c.id === id),
        }))
        .filter((x) => x.o && !x.o.locked);
      if (list.length < 2) return;
      const xs = list.map((x) => x.o!.posX ?? 0);
      const min = Math.min(...xs),
        max = Math.max(...xs);
      list.sort((a, b) => (a.o!.posX ?? 0) - (b.o!.posX ?? 0));
      list.forEach((x, i) =>
        get().patchObject(x.id, {
          posX:
            kind === "left"
              ? min
              : kind === "right"
                ? max
                : kind === "center"
                  ? (min + max) / 2
                  : min + ((max - min) * i) / (list.length - 1),
        }),
      );
    },
    reorderLayer: (id, direction) => {
      guardHistory(true);
      const st = get();
      const order = [...st.layerOrder];
      const i = order.indexOf(id),
        j = i + direction;
      if (i < 0 || j < 0 || j >= order.length) return;
      [order[i], order[j]] = [order[j], order[i]];
      // Layers correspond to physical depth; opaque meshes still obey real occlusion.
      const a = order[i],
        b = order[j];
      const getZ = (k: string) =>
        k === "hero"
          ? st.mug.posZ
          : (st.companions.find((c) => c.id === k)?.posZ ?? 0);
      const za = getZ(a),
        zb = getZ(b);
      get().patchObject(a, { posZ: Math.max(za, zb) + 0.5 });
      get().patchObject(b, { posZ: Math.min(za, zb) - 0.5 });
      set({ layerOrder: order });
    },
    compose: (kind) => {
      guardHistory(true);
      const st = get();
      const n =
        kind === "solo"
          ? 1
          : kind === "pair" || kind === "stack" || kind === "gift"
            ? 2
            : kind === "row"
              ? 4
              : 3;
      const step = 15 * st.mug.scale;
      const hero = {
        ...st.mug,
        posX: (-(n - 1) * step) / 2,
        posY: 0,
        posZ: 0,
        tiltX: 0,
        tiltZ: 0,
        rotationY: -40,
        hidden: false,
      };
      const list = Array.from({ length: n - 1 }, (_, i) =>
        makeCompanion({
          ...hero,
          ...st.companions[i],
          posX: hero.posX + (i + 1) * step,
          name: `Caneca ${i + 2}`,
          art: { ...(st.companions[i]?.art ?? st.art) },
          rotationY: kind === "fan" ? (i + 1) * 55 - 55 : 40,
        }),
      );
      if (kind === "stack") {
        hero.posX = 0;
        list[0].posX = 0;
        list[0].posY = 9.55 * hero.scale;
      }
      if (kind === "gift") {
        hero.posX = -7.5;
        list[0].posX = 7.5;
        list[0].posZ = -4;
      }
      if (kind === "fan") {
        hero.posZ = 3;
        list[0].posZ = -3;
        list[1].posZ = 3;
      }
      set({
        mug: hero,
        companions: list,
        camera: { ...st.camera, autoRotate: false, spinIds: null },
        selectedIds: ["hero"],
        layerOrder: ["hero", ...list.map((c) => c.id)],
        fitNonce: st.fitNonce + 1,
        fitDirection: [0, 0.14, 1],
        zoom: 100,
      });
    },
    projectName: "Meu mockup",
    art: initialArt,
    mug: initialMug,
    light: initialLight,
    bg: initialBg,
    camera: initialCamera,
    exportSettings: initialExport,
    companions: [],
    fx: initialFx,
    watermark: initialWatermark,
    video: initialVideo,
    gif: initialGif,
    presetRequest: null,
    focusNonce: 0,
    artAppliedNonce: 0,
    exportOpen: false,
    projectsOpen: false,
    bgAdjustMode: false,
    showGuides: false,
    collisionNonce: 0,
    fitNonce: 0,
    fitDirection: null,
    past: [],
    future: [],

    setProjectName: (n) => {
      guardHistory();
      set({ projectName: n });
    },

    patch: (slice, partial) => {
      guardHistory();
      const current = get()[slice] as unknown as Record<string, unknown>;
      const next = { ...current, ...(partial as Record<string, unknown>) };
      set({ [slice]: next } as unknown as Partial<MockupStore>);
    },

    setArtImage: (meta) => {
      const state = get();
      const id = meta.objectId ?? "hero";
      const object = id === "hero" ? state.mug : state.companions.find(c => c.id === id);
      if (!object || object.locked) return;
      const art = id === "hero" ? state.art : (state.companions.find(c => c.id === id)?.art ?? state.art);
      const area = resolvePrintArea(art);
      const metrics = MODEL_METRICS[object.model ?? state.mug.model] ?? MODEL_METRICS.classic;
      const ratio = (area.arcCm * metrics.circumference / CIRC_CM) / (area.heightCm * metrics.height / 9.5);
      const layout = suggestArtLayout(meta.width, meta.height, ratio, getArtImage(meta.imageId)?.analysis);
      get().patchObjectArt(id, {
        ...NEUTRAL_ADJUSTMENTS,
        imageId: meta.imageId,
        name: meta.name,
        width: meta.width,
        height: meta.height,
        // Preserve the entire logo/portrait; fill only proportionate panoramas.
        ...layout,
      });
      set((s) => ({ artAppliedNonce: s.artAppliedNonce + 1, compareArt: false }));
    },
    clearArt: () => {
      get().patch("art", { imageId: null, name: "", width: 0, height: 0 });
    },

    notifyArtApplied: () =>
      set((s) => ({ artAppliedNonce: s.artAppliedNonce + 1 })),

    rotateMug: (deg) => {
      const r = get().mug.rotationY;
      get().patch("mug", { rotationY: (((r + deg) % 360) + 360) % 360 });
    },

    applyCameraPreset: (p) =>
      set((s) => ({
        presetRequest: {
          pos: p.pos,
          target: p.target,
          nonce: s.presetRequest ? s.presetRequest.nonce + 1 : 1,
        },
      })),

    requestFocus: () => set((s) => ({ focusNonce: s.focusNonce + 1 })),

    setExportOpen: (v) => set({ exportOpen: v }),

    setExport: (partial) =>
      set((s) => ({ exportSettings: { ...s.exportSettings, ...partial } })),

    addCompanion: () => {
      const st = get();
      st.select("hero");
      st.duplicateSelected();
    },
    patchCompanion: (id, partial) => get().patchObject(id, partial),

    removeCompanion: (id) => {
      guardHistory();
      set({
        companions: get().companions.filter((c) => c.id !== id),
        layerOrder: get().layerOrder.filter((x) => x !== id),
        fitNonce: get().fitNonce + 1,
        fitDirection: null,
        zoom: 100,
      });
    },

    arrangeScene: (kind) => {
      // Os dois caminhos da UI usam o mesmo Duo simétrico, sem prender
      // a primeira caneca à origem ou trocar a arte e o acabamento.
      if (kind === "duo" || kind === "solo") {
        get().compose(kind === "duo" ? "pair" : "solo");
        return;
      }
      guardHistory();
      const st = get();
      set({ mug: { ...st.mug, posX: 0, posZ: 0, posY: 0, hidden: false } });
      const fresh = ARRANGEMENTS[kind].map((c) => ({
        ...c,
        id: `comp_${Date.now()}_${++companionSeq}`,
      }));
      const res = resolveOverlaps(fresh, {
        rotationY: st.mug.rotationY,
        scale: st.mug.scale,
      });
      set({
        companions: res.list,
        layerOrder: ["hero", ...res.list.map((c) => c.id)],
        selectedIds: ["hero"],
        fitNonce: st.fitNonce + 1,
        fitDirection: [0, 0.14, 1],
        zoom: 100,
      });
    },

    /** Distribui todas as canecas numa fileira centralizada, com folga para girar. */
    spreadEvenly: () => {
      guardHistory();
      const st = get();
      const list = st.companions;
      if (!list.length) return;
      const maxScale = Math.max(...list.map((c) => c.scale), st.mug.scale);
      const step = 15 * maxScale;
      const start = -list.length * step / 2;
      set({
        mug: { ...st.mug, posX: start, posZ: 0 },
        companions: list.map((c, i) => ({ ...c, posX: start + (i + 1) * step, posZ: 0 })),
        fitNonce: st.fitNonce + 1,
        fitDirection: [0, 0.14, 1],
        zoom: 100,
      });
    },

    /** pede à câmera que enquadre o grupo inteiro */
    frameAll: () => set((s) => ({ fitNonce: s.fitNonce + 1, fitDirection: null, zoom: 100 })),

    setBgAdjustMode: (v) => set({ bgAdjustMode: v }),
    setShowGuides: (v) => set({ showGuides: v }),

    setProjectsOpen: (v) => set({ projectsOpen: v }),

    hydrate: (s) => {
      const st = get();
      const companions = s.companions
        ? s.companions.map((c) => ({
            ...migrateCeramicFinish(c),
            model: c.model ? migrateMugModel(c.model) : undefined,
            handleStyle: normalizeHandleStyle(c.handleStyle),
            posX: clamp(Number.isFinite(c.posX) ? c.posX : 10.8, -150, 150),
            posZ: clamp(Number.isFinite(c.posZ) ? c.posZ : 0.6, -150, 150),
            scale: clamp(Number.isFinite(c.scale) ? c.scale : 0.95, 0.2, 3),
          }))
        : st.companions;
      const mug = migrateCeramicFinish({ ...st.mug, ...s.mug,
        model: migrateMugModel(s.mug?.model ?? st.mug.model),
        handleStyle: s.mug ? normalizeHandleStyle(s.mug.handleStyle) : st.mug.handleStyle,
      });
      if (s.mug?.model && mug.model !== s.mug.model && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cg-mockup-migrated", { detail: "Um modelo antigo foi convertido para a caneca clássica." }));
      }
      const ids = ["hero", ...companions.map((c) => c.id)];
      const ordered = Array.isArray(s.layerOrder)
        ? s.layerOrder.filter((id) => ids.includes(id))
        : [];
      set({
        projectName: s.projectName ?? st.projectName,
        art: { ...st.art, ...s.art },
        mug,
        light: { ...st.light, ...s.light },
        bg: { ...st.bg, ...s.bg },
        camera: { ...st.camera, ...s.camera },
        exportSettings: { ...st.exportSettings, ...s.exportSettings },
        companions,
        layerOrder: [...new Set([...ordered, ...ids])],
        selectedIds: ["hero"],
        fx: { ...st.fx, ...s.fx },
        watermark: { ...st.watermark, ...s.watermark },
        video: { ...st.video, ...s.video, duration: clamp(s.video?.duration ?? st.video.duration, 3, 20) },
        gif: { ...st.gif, ...s.gif },
      });
      if (s.art) set((x) => ({ artAppliedNonce: x.artAppliedNonce + 1 }));
    },

    undo: () => {
      if (commitTimer) {
        clearTimeout(commitTimer);
        commitTimer = null;
      }
      const s = get();
      if (!s.past.length) return;
      const prev = s.past[s.past.length - 1];
      set({
        past: s.past.slice(0, -1),
        future: [snap(s), ...s.future].slice(0, HISTORY_LIMIT),
        art: prev.art,
        mug: prev.mug,
        light: prev.light,
        bg: prev.bg,
        companions: prev.companions,
        fx: prev.fx,
        camera: prev.camera,
        layerOrder: prev.layerOrder,
        projectName: prev.projectName,
        watermark: prev.watermark,
        video: prev.video,
        gif: prev.gif,
        exportSettings: prev.exportSettings,
      });
    },

    redo: () => {
      if (commitTimer) {
        clearTimeout(commitTimer);
        commitTimer = null;
      }
      const s = get();
      if (!s.future.length) return;
      const next = s.future[0];
      set({
        past: [...s.past, snap(s)].slice(-HISTORY_LIMIT),
        future: s.future.slice(1),
        art: next.art,
        mug: next.mug,
        light: next.light,
        bg: next.bg,
        companions: next.companions,
        fx: next.fx,
        camera: next.camera,
        layerOrder: next.layerOrder,
        projectName: next.projectName,
        watermark: next.watermark,
        video: next.video,
        gif: next.gif,
        exportSettings: next.exportSettings,
      });
    },

    resetAll: (keepArt = false) => {
      // zera TUDO de verdade: arte, caneca, luz, cena, efeitos, câmera e acompanhantes
      // (mantém um passo de histórico para poder desfazer o reset se for acidental)
      guardHistory(true);
      const priorArt = get().art;
      set({
        art: keepArt ? { ...initialArt, imageId: priorArt.imageId, name: priorArt.name, width: priorArt.width, height: priorArt.height } : { ...initialArt },
        mug: { ...initialMug },
        light: { ...initialLight },
        bg: { ...initialBg },
        fx: { ...initialFx },
        camera: { ...initialCamera },
        companions: [],
        selectedIds: ["hero"],
        layerOrder: ["hero"],
        bgAdjustMode: false,
        watermark: { ...initialWatermark },
        exportSettings: { ...initialExport },
        video: { ...initialVideo },
        gif: { ...initialGif },
        zoom: 100,
        tool: "select",
        showGuides: false,
        snapEnabled: true,
        compareArt: false,
        exportOpen: false,
        presetRequest: null,
        focusNonce: get().focusNonce + 1,
      });
    },
  };
});

/* usados pelos painéis para rótulos coerentes */
export const FLOAT_DEFAULT_LIFT = FLOAT_LIFT;
export const PEDESTAL_TOP = PEDESTAL_H;
