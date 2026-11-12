/**
 * Studio Click Mockup 2D — CANECA FIXA.
 *
 * Uma única caneca (o modelo de sublimação 325 ml, 9,5 cm × 8 cm),
 * recortada em PNG transparente (rembg isnet-general-use) e espelhada
 * para formar o par (alça esquerda + alça direita, quase encostando).
 * A caneca fica FIXA no editor; só o cenário (fundo) muda.
 * A calibração do wrap foi medida UMA vez, com precisão, no próprio
 * recorte — não há calibração por template, então não há como um
 * template sair desalinhado.
 *
 * Geometria medida no recorte 410×363 (1x), depois ×2 para o par:
 * - corpo: x 5..282, topo do aro y 5..14, base botC 314
 * - topRy = botRy = 4,5 (1x): o aro e a base são o MESMO círculo visto
 *   do mesmo ângulo, então têm o mesmo raio — as linhas horizontais da
 *   arte ficam retas e paralelas (o arco que se vê é o da elipse, igual
 *   em todas as alturas). O botRy=43 medido antes era a SILHUETA do pé
 *   arredondado, não a elipse da base — usar 43 arqueava as linhas.
 * - a arte é recortada pela SILHUETA real da caneca (destination-in),
 *   então ela cobre o corpo até a borda exata sem vazar, mesmo onde a
 *   elipse da base é mais rasa que a silhueta do pé.
 * - par 1644×726 (2x): corpos com gap de 24 px entre eles.
 */
import type { MockupTemplate, RenderState, SceneMaps } from "./types";
import { renderMockup } from "./render";

export const FIXED_MUG_PAIR_SRC = "/studio-mockup-2d/caneca-fixa/par-canecas.png";

/** Espaço de referência do par (a imagem do par, em 2x). */
export const FIXED_MUG_REF_W = 1644;
export const FIXED_MUG_REF_H = 726;

export const FIXED_MUG_TEMPLATE: MockupTemplate = {
  id: "caneca-fixa",
  nome: "Caneca Fixa — Par · 325 ml",
  base: FIXED_MUG_PAIR_SRC,
  exportName: "mockup-caneca-fixa.png",
  refW: FIXED_MUG_REF_W,
  refH: FIXED_MUG_REF_H,
  mugs: [
    {
      id: 1,
      nome: "Caneca 1",
      cor: "#ff3b30",
      cx: 533,
      R: 277,
      topC: 19,
      topRy: 9,
      botC: 705,
      botRy: 9,
      xLeft: 256,
      xRight: 810,
      lip: 6,
      foot: 2,
    },
    {
      id: 2,
      nome: "Caneca 2",
      cor: "#00e5ff",
      cx: 1111,
      R: 277,
      topC: 19,
      topRy: 9,
      botC: 705,
      botRy: 9,
      xLeft: 834,
      xRight: 1388,
      lip: 6,
      foot: 2,
    },
  ],
};

/** Largura do par como fração da largura do canvas (prévia/exportação). */
export const FIXED_MUG_WIDTH_FRAC = 0.92;
/** Altura da base do par como fração da altura do canvas (antes do offset). */
export const FIXED_MUG_BASE_Y_FRAC = 0.75;

export interface FixedMugBg {
  kind: "color" | "image";
  /** Cor sólida (#rrggbb) ou URL da imagem de fundo. */
  value: string;
  label: string;
}

export const FIXED_BG_COLORS: FixedMugBg[] = [
  { kind: "color", value: "#ffffff", label: "Branco" },
  { kind: "color", value: "#f2f0eb", label: "Off-white" },
  { kind: "color", value: "#e8e8e8", label: "Cinza claro" },
  { kind: "color", value: "#1a1a1e", label: "Preto" },
  { kind: "color", value: "#ff6a00", label: "Laranja ClickGruda" },
  { kind: "color", value: "#8ed0c5", label: "Menta" },
  { kind: "color", value: "#c9a0d8", label: "Lilás" },
  { kind: "color", value: "#6b3a7a", label: "Roxo" },
];

/**
 * Posição do par no canvas (W×H), dado o deslocamento vertical do usuário
 * (em px no espaço 1080×1350 — escala junto com o canvas).
 */
export function fixedMugPlacement(W: number, H: number, offsetY: number) {
  const pairW = W * FIXED_MUG_WIDTH_FRAC;
  const pairH = pairW * (FIXED_MUG_REF_H / FIXED_MUG_REF_W);
  const x = (W - pairW) / 2;
  const baseY = H * FIXED_MUG_BASE_Y_FRAC + offsetY * (H / 1350);
  const y = baseY - pairH;
  return { x, y, w: pairW, h: pairH };
}

/**
 * Renderiza o par (com a arte) num canvas offscreen transparente, usando
 * o motor Wrap V2 — a mesma geometria da prévia e da exportação.
 * O offscreen tem o tamanho do par (1644×726); a transparência fora das
 * canecas é preservada.
 *
 * Depois do render, a composição é recortada pela SILHUETA real do par
 * (destination-in com o próprio PNG): como a elipse da base é mais rasa
 * que a silhueta do pé arredondado, o warp pode estender a arte um pouco
 * além da borda nas laterais — o recorte pela silhueta remove esse excesso
 * e a arte termina exatamente na borda da caneca, sem vazar e sem faixa
 * branca. As linhas horizontais ficam retas porque topRy = botRy.
 */
export function renderFixedPairOffscreen(
  pairImg: HTMLImageElement,
  artPixels: import("./types").ArtPixels | null,
  maps: SceneMaps,
  state: RenderState,
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = FIXED_MUG_REF_W;
  c.height = FIXED_MUG_REF_H;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    renderMockup(ctx, FIXED_MUG_REF_W, FIXED_MUG_REF_H, FIXED_MUG_TEMPLATE, pairImg, artPixels, maps, state);
    // Recorta pela silhueta real do par (a arte não vaza para fora da caneca).
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(pairImg, 0, 0, FIXED_MUG_REF_W, FIXED_MUG_REF_H);
    ctx.globalCompositeOperation = "source-over";
  }
  return c;
}

/**
 * Compõe o mockup da Caneca Fixa num canvas: fundo (cor ou imagem, em
 * cover) + par com a arte, na posição calculada. Usado na prévia e na
 * exportação — a mesma geometria nos dois.
 */
export function renderFixedMug(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  bg: FixedMugBg,
  bgImg: HTMLImageElement | null,
  pairCanvas: HTMLCanvasElement,
  offsetY: number,
): void {
  ctx.clearRect(0, 0, W, H);
  if (bg.kind === "image" && bgImg) {
    // Cover: cobre o canvas, cortando o excesso.
    const s = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight);
    const dw = bgImg.naturalWidth * s;
    const dh = bgImg.naturalHeight * s;
    ctx.drawImage(bgImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = bg.value;
    ctx.fillRect(0, 0, W, H);
  }
  const p = fixedMugPlacement(W, H, offsetY);
  ctx.drawImage(pairCanvas, p.x, p.y, p.w, p.h);
}

/** Exporta o mockup da Caneca Fixa como blob PNG. */
export function exportFixedMugBlob(
  bg: FixedMugBg,
  bgImg: HTMLImageElement | null,
  pairCanvas: HTMLCanvasElement,
  offsetY: number,
  W: number,
  H: number,
): Promise<Blob | null> {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  renderFixedMug(ctx, W, H, bg, bgImg, pairCanvas, offsetY);
  return new Promise((resolve) => {
    c.toBlob((b) => resolve(b), "image/png");
  });
}
