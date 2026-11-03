/* ============================================================
   Mockup Studio — constantes, presets e helpers
   Unidades da cena: 1 unidade = 1 cm
   ============================================================ */

export const MUG = {
  height: 9.55, // cm; 1 unidade da cena = 1 cm
  topOuterR: 4.1,
  bottomOuterR: 4.1, // parede cilíndrica: o mesmo raio em toda a altura
  innerR: 3.725, // R_int=0.745 na escala normalizada de 0.2
  rimSegments: 32,
  footH: 0.18, // rebaixo de 1,8 mm no centro do fundo
  footWidth: 0.4, // anel de contato com 4 mm de largura radial
  baseBevel: 0.22,
  innerFloorY: 0.65,
  printTop: 9.32, // y do topo da área de impressão (padrão prensa)
  printBottom: 0.62, // y da base da área de impressão (padrão prensa)
  paperW: 21, // cm — largura do papel padrão (referência de DPI)
  paperH: 9.5, // cm — altura do papel padrão (referência de DPI)
  gapCirc: 4.6, // cm da circunferência sem impressão (região da alça)
  segments: 256, // segmentos radiais do corpo
} as const;

export const PRINT_HEIGHT_CM = MUG.printTop - MUG.printBottom; // 8.7 cm
/** Raio médio da parede para cálculo da circunferência de impressão */
export const AVG_R = MUG.topOuterR;
export const CIRC_CM = 2 * Math.PI * AVG_R;
export const GAP_ANGLE = (MUG.gapCirc / CIRC_CM) * Math.PI * 2; // rad
export const PRINT_ARC_CM = CIRC_CM - MUG.gapCirc;
/** Fração da volta (360°) ocupada pela arte — o resto é o vão da alça */
export const ARC_FRACTION = PRINT_ARC_CM / CIRC_CM;

/* ---------------- Área de impressão parametrizável ---------------- */

/**
 * Modos da área de impressão:
 *  - padrao:  prensa térmica clássica (≈20,7 × 8,7 cm)
 *  - alta:    papel 21×9,7 — preenche a altura praticamente toda
 *  - forno:   sublimação em forno — envolve 360° até a alça
 *  - custom:  medidas escolhidas pela pessoa
 */
export type AreaMode = "padrao" | "alta" | "forno" | "custom";

export interface PrintArea {
  mode: AreaMode;
  printBottom: number; // y cm (inferior da área)
  printTop: number; // y cm (superior da área)
  heightCm: number;
  arcCm: number; // arco impresso (o resto da volta é o vão da alça)
  gapCm: number;
}

/** limites físicos da parede impressível */
/** A folha cobre toda a altura. A geometria limita a impressão à face externa:
 * chanfro inferior e metade externa do lábio incluídos; interior e apoio limpos. */
export const PRINT_BOTTOM_MIN = 0;
export const PRINT_TOP_MAX = MUG.height;
/** vão mínimo escondido atrás da alça (cm) — mesmo no modo forno */
export const GAP_MIN_CM = 0;

const AREA_CENTER_Y = (PRINT_BOTTOM_MIN + PRINT_TOP_MAX) / 2;
const AREA_MAX_H = PRINT_TOP_MAX - PRINT_BOTTOM_MIN;

export const AREA_PRESETS: { id: AreaMode; label: string; desc: string }[] = [
  {
    id: "padrao",
    label: "Prensa 20,7×8,7",
    desc: "Padrão clássico da prensa térmica",
  },
  {
    id: "alta",
    label: "Altura cheia",
    desc: "Parede e borda externa até o topo, sem faixa branca",
  },
  {
    id: "forno",
    label: "Forno 360°",
    desc: "Sublimação em forno — envolve a caneca toda até a alça",
  },
  {
    id: "custom",
    label: "Personalizado",
    desc: "Você define largura e altura em cm",
  },
];

/** Resolve a área de impressão a partir do estado da arte */
export function resolvePrintArea(art: {
  areaMode?: AreaMode;
  areaW?: number;
  areaH?: number;
  areaY?: number;
}): PrintArea {
  const mode = art.areaMode ?? "padrao";
  if (mode === "padrao") {
    return {
      mode,
      printBottom: MUG.printBottom,
      printTop: MUG.printTop,
      heightCm: PRINT_HEIGHT_CM,
      arcCm: PRINT_ARC_CM,
      gapCm: MUG.gapCirc,
    };
  }
  if (mode === "alta" || mode === "forno") {
    const arcCm = mode === "forno" ? CIRC_CM - GAP_MIN_CM : PRINT_ARC_CM;
    return {
      mode,
      printBottom: PRINT_BOTTOM_MIN,
      printTop: PRINT_TOP_MAX,
      heightCm: AREA_MAX_H,
      arcCm,
      gapCm: CIRC_CM - arcCm,
    };
  }
  // custom — altura e posição vertical livres dentro dos limites da parede
  const arcCm = Math.min(
    CIRC_CM - GAP_MIN_CM,
    Math.max(8, art.areaW ?? PRINT_ARC_CM),
  );
  const heightCm = Math.min(
    AREA_MAX_H,
    Math.max(3, art.areaH ?? PRINT_HEIGHT_CM),
  );
  const wantBottom = AREA_CENTER_Y + (art.areaY ?? 0) - heightCm / 2;
  const printBottom = Math.min(
    PRINT_TOP_MAX - heightCm,
    Math.max(PRINT_BOTTOM_MIN, wantBottom),
  );
  return {
    mode,
    printBottom,
    printTop: printBottom + heightCm,
    heightCm,
    arcCm,
    gapCm: CIRC_CM - arcCm,
  };
}

/* ---------------- Encaixe das canecas (multicaneca) ---------------- */
/** Maior raio do corpo (topo 4.11 + folga da borda arredondada) */
export const BODY_MAX_R = 4.3;
/** Raio máximo da caneca incluindo a alça (medido da caixa real da alça) */
export const MUG_FULL_R = 7.15;
/** Folga mínima entre canecas (cm) — quase zero: liberdade total de composição */
export const MUG_GAP_MIN = 0.08;
/** Altura do pedestal (cm) — canecas ficam apoiadas nele */
export const PEDESTAL_H = 0.9;
/** Altura das bases (redonda/quadrada) (cm) */
export const PLATE_H = 0.65;
/** Altura de flutuação padrão no modo "Flutuante" (cm) */
export const FLOAT_LIFT = 1.7;

/* ---------------- Textura da arte ---------------- */
/** Largura do canvas = volta COMPLETA (360°); a arte ocupa a fração ARC_FRACTION */
export const CANVAS_W_PREVIEW = 2560;
export const CANVAS_W_EXPORT = 4096;
/** Largura em px da área de impressão (arco) no canvas de preview */
export const ARC_W_PREVIEW = Math.round(CANVAS_W_PREVIEW * ARC_FRACTION);
/**
 * Layout da folha de textura (tudo em cm → a geometria e o canvas concordam
 * exatamente, em qualquer resolução):
 *   topo  → zona da parede, y = ZONE_CM (topo) … 0 (pé)  [cor-base + a arte]
 *           faixa de cor-base EXTERIOR (STRIP_CM)  — pé, fundo e borda
 *           faixa de cor-base INTERIOR (STRIP_CM)  — interior da caneca
 * Horizontal: 360° completos; a costura da textura fica ATRÁS (no vão da alça).
 */
export const ZONE_CM = 9.6;
export const STRIP_CM = 0.32;
export const TEX_TOTAL_CM = ZONE_CM + STRIP_CM * 2;
/** v (0..1, flipY) de uma altura y da parede */
export const texV = (y: number) =>
  1 - (ZONE_CM - Math.min(ZONE_CM, Math.max(0, y))) / TEX_TOTAL_CM;
export const V_EXT = 1 - (ZONE_CM + STRIP_CM / 2) / TEX_TOTAL_CM;
export const V_INT = 1 - (ZONE_CM + STRIP_CM * 1.5) / TEX_TOTAL_CM;
export const STRIP_PX = 32; // (legado)
/** Inset UV (px) que impede o “bleed” da filtragem na fronteira arte/cor-base */
export const UV_PAD_PX = 4;
export const MAX_ART_PX = 8192; // preserva mais detalhes da arte original; exportação ajusta à GPU // redimensionamento interno da arte
export const MAX_UPLOAD_MB = 25;
export const MAX_BG_PX = 4096; // redimensionamento interno da imagem de fundo

/* ---------------- Iluminação ---------------- */
export interface LightPresetDef {
  id: string;
  label: string;
  keyInt: number;
  keyTemp: number;
  keyDir: [number, number, number]; // posição da luz chave
  fillInt: number;
  fillTemp: number;
  rimInt: number;
  rimTemp: number;
  env: number; // intensidade geral do ambiente (reflexos)
  backdrop: "white" | "dark";
}

export const LIGHT_PRESETS: LightPresetDef[] = [
  {
    id: "suave",
    label: "Estúdio Suave",
    keyInt: 1.15,
    keyTemp: 6500,
    keyDir: [-6, 12, 8],
    fillInt: 0.5,
    fillTemp: 6500,
    rimInt: 0.75,
    rimTemp: 6500,
    env: 0.65,
    backdrop: "white",
  },
  {
    id: "contraste",
    label: "Alto Contraste",
    keyInt: 1.9,
    keyTemp: 5200,
    keyDir: [-8, 13, 6],
    fillInt: 0.14,
    fillTemp: 7000,
    rimInt: 1.5,
    rimTemp: 7200,
    env: 0.62,
    backdrop: "dark",
  },
  {
    id: "janela",
    label: "Luz de Janela",
    keyInt: 1.5,
    keyTemp: 6300,
    keyDir: [-11, 9, 3],
    fillInt: 0.35,
    fillTemp: 5600,
    rimInt: 0.4,
    rimTemp: 6800,
    env: 0.92,
    backdrop: "white",
  },
  {
    id: "premium",
    label: "Produto Premium",
    keyInt: 1.05,
    keyTemp: 5400,
    keyDir: [-4, 12, 9],
    fillInt: 0.45,
    fillTemp: 6200,
    rimInt: 1.05,
    rimTemp: 6400,
    env: 1.32,
    backdrop: "dark",
  },
  {
    id: "quente",
    label: "Ambiente Quente",
    keyInt: 1.2,
    keyTemp: 3400,
    keyDir: [-7, 10, 8],
    fillInt: 0.42,
    fillTemp: 3000,
    rimInt: 0.55,
    rimTemp: 4200,
    env: 0.85,
    backdrop: "white",
  },
  {
    id: "dramatico",
    label: "Dramático",
    keyInt: 1.7,
    keyTemp: 4800,
    keyDir: [-2, 14, -6],
    fillInt: 0.06,
    fillTemp: 6500,
    rimInt: 0.95,
    rimTemp: 7000,
    env: 0.38,
    backdrop: "dark",
  },
];

/** Temperatura de cor (K) → RGB aproximado 0..1 */
export function kelvinToRgb(k: number): [number, number, number] {
  const t = Math.min(12000, Math.max(1500, k)) / 100;
  let r: number, g: number, b: number;
  if (t <= 66) {
    r = 255;
    g = 99.47 * Math.log(t) - 161.12;
  } else {
    r = 329.7 * Math.pow(t - 60, -0.1332);
    g = 288.12 * Math.pow(t - 60, -0.0755);
  }
  if (t >= 66) b = 255;
  else if (t <= 19) b = 0;
  else b = 138.52 * Math.log(t - 10) - 305.04;
  const cl = (v: number) => Math.min(255, Math.max(0, v)) / 255;
  return [cl(r), cl(g), cl(b)];
}

/* ---------------- Câmera ---------------- */
export interface CameraPresetDef {
  id: string;
  label: string;
  pos: [number, number, number];
  target: [number, number, number];
}

export const CAMERA_PRESETS: CameraPresetDef[] = [
  { id: "frente", label: "Frente", pos: [0, 5.8, 27], target: [0, 4.75, 0] },
  {
    id: "tres-quartos",
    label: "3/4",
    pos: [17.5, 9, 18.5],
    target: [0, 4.6, 0],
  },
  { id: "costas", label: "Costas", pos: [0, 5.8, -27], target: [0, 4.75, 0] },
  {
    id: "lateral-esq",
    label: "Lateral esq.",
    pos: [-27, 5.8, 0],
    target: [0, 4.75, 0],
  },
  {
    id: "lateral-dir",
    label: "Lateral dir.",
    pos: [27, 5.8, 0],
    target: [0, 4.75, 0],
  },
  {
    id: "alca-esq",
    label: "Alça à esq.",
    pos: [23, 6, -14],
    target: [0, 4.7, -1.5],
  },
  {
    id: "alca-dir",
    label: "Alça à dir.",
    pos: [-23, 6, -14],
    target: [0, 4.7, -1.5],
  },
  { id: "topo", label: "Topo", pos: [0.01, 29, 5.5], target: [0, 3, 0] },
  {
    id: "heroi",
    label: "Ângulo destaque",
    pos: [4.5, 1.4, 21.5],
    target: [0, 4.3, 0],
  },
  {
    id: "angulo-alto",
    label: "Ângulo alto",
    pos: [0, 25, 13],
    target: [0, 3.3, 0],
  },
  {
    id: "close-arte",
    label: "Close na arte",
    pos: [0, 5.2, 15.5],
    target: [0, 5, 0],
  },
  {
    id: "close-alca",
    label: "Close na alça",
    pos: [0, 5.2, -16],
    target: [0, 5, -2],
  },
];

/** FOV vertical a partir de uma lente full-frame (sensor 24mm de altura) */
export function lensToFov(lensMm: number): number {
  return (2 * Math.atan(12 / lensMm) * 180) / Math.PI;
}

/* ---------------- Fundos e chão ---------------- */
export type BackgroundType =
  | "studio-white"
  | "studio-dark"
  | "gradient"
  | "solid"
  | "image"
  | "transparent";

export const BACKGROUND_LABELS: Record<BackgroundType, string> = {
  "studio-white": "Branco puro (padrão)",
  "studio-dark": "Estúdio escuro premium",
  gradient: "Gradiente colorido",
  solid: "Cor sólida",
  image: "Imagem do seu dispositivo",
  transparent: "Sem fundo (PNG/WebP com alfa)",
};

export type FloorType =
  | "continuo"
  | "flutuante"
  | "base-redonda"
  | "base-quadrada"
  | "pedestal"
  | "espelhado";

export const FLOOR_OPTIONS: {
  value: FloorType;
  label: string;
  title: string;
}[] = [
  {
    value: "continuo",
    label: "Contínuo",
    title: "Chão que se mistura ao fundo, sem borda visível",
  },
  {
    value: "flutuante",
    label: "Flutuante",
    title: "Sem chão — só a caneca, com sombra suave no ar",
  },
  {
    value: "base-redonda",
    label: "Base redonda",
    title: "Prato redondo de cerâmica sob a caneca",
  },
  {
    value: "base-quadrada",
    label: "Base quadrada",
    title: "Placa quadrada com cantos arredondados (look premium)",
  },
  {
    value: "pedestal",
    label: "Podium",
    title: "Pedestal escuro premium com bordas arredondadas",
  },
  {
    value: "espelhado",
    label: "Espelhado",
    title: "Piso com reflexo suave da caneca",
  },
];

export const FLOOR_LABELS: Record<FloorType, string> = {
  continuo: "Contínuo (sem borda)",
  flutuante: "Flutuante (sem chão)",
  "base-redonda": "Base redonda",
  "base-quadrada": "Base quadrada",
  pedestal: "Podium",
  espelhado: "Espelhado",
};

/**
 * Extensão horizontal do conjunto de canecas (cm) — usada para crescer
 * sombras, chão e pedestal junto com o grupo.
 */
export function groupFootprint(
  companions: { posX: number; posZ: number; scale: number }[],
  heroScale = 1,
): number {
  let r = MUG_FULL_R * heroScale + 1;
  for (const c of companions) {
    r = Math.max(r, Math.hypot(c.posX, c.posZ) + MUG_FULL_R * c.scale + 1);
  }
  return Math.min(34, Math.max(9, r));
}

/* ---------------- Exportação ---------------- */
export interface RatioDef {
  id: string;
  label: string;
  w: number;
  h: number;
}

export const EXPORT_RATIOS: RatioDef[] = [
  { id: "sq", label: "Feed 1:1", w: 1080, h: 1080 },
  { id: "portrait", label: "Retrato 4:5", w: 1080, h: 1350 },
  { id: "story", label: "Story 9:16", w: 1080, h: 1920 },
  { id: "wide", label: "Wide 16:9", w: 1920, h: 1080 },
  { id: "pinterest", label: "Pinterest 2:3", w: 1000, h: 1500 },
  { id: "4k", label: "Ultra HD 4K", w: 3840, h: 2160 },
  { id: "catalog", label: "Catálogo 1:1", w: 1000, h: 1000 },
];

export const MAX_EXPORT_PX = 8192;

/* ---------------- Qualidade do dispositivo ---------------- */
export function detectMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) ||
    (navigator.hardwareConcurrency ?? 8) <= 4
  );
}

/** Estimated physical proportions for the procedural family, in centimeters. */
export const MODEL_METRICS: Record<
  string,
  { height: number; circumference: number }
> = {
  classic: { height: MUG.height, circumference: CIRC_CM },
  square: { height: 9.5, circumference: 25.6 },
  cone: { height: 10.8, circumference: CIRC_CM * 0.89 },
  beer: { height: 14, circumference: CIRC_CM * 1.1 },
  latte: { height: 12, circumference: CIRC_CM * 0.955 },
  tea: { height: 6.5, circumference: CIRC_CM * 1.14 },
};
