/**
 * Studio Click Mockup 2D — projeção cilíndrica contínua (port do Wrap V2).
 * Sem as 180 faixas que geravam linhas. Cada pixel de destino mapeia
 * diretamente para um ponto da estampa. Bilinear nos dois eixos, wrap
 * horizontal sem costuras, alfa preservado. Funciona em preview e na
 * exportação 4K sem diferença de geometria.
 */
import type { ArtPixels, RenderState } from "./types";
import { mugLeft, mugRight, mugT, topY, botY } from "./geometry";
import type { MugCalibration } from "./types";

/** Amostra a arte em pixels (máx. 4096x2048) para o warp. */
export function cacheArtPixels(art: HTMLImageElement | null): ArtPixels | null {
  if (!art) return null;
  const reduction = Math.min(1, 4096 / art.naturalWidth, 2048 / art.naturalHeight);
  const w = Math.max(2, Math.round(art.naturalWidth * reduction));
  const h = Math.max(2, Math.round(art.naturalHeight * reduction));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true });
  if (!g) return null;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.drawImage(art, 0, 0, w, h);
  return { data: g.getImageData(0, 0, w, h).data, w, h };
}

/**
 * Texel de destino -> coordenada de longitude sobre o cilindro.
 * Não usa tiras de canvas; cada pixel é tratado independentemente e recebe
 * AA subpixel. A estampa cobre até a tangente do cilindro, e não é cortada
 * antes do contorno. splitStart/splitEnd limitam a composição à metade
 * correta no modo dividido.
 */
export function drawWarped(
  ctx: CanvasRenderingContext2D,
  m: MugCalibration,
  s: number,
  uCenter: number,
  visFrac: number,
  artPixels: ArtPixels | null,
  state: RenderState,
  splitStart = 0,
  splitEnd = 1,
): void {
  if (!artPixels) return;
  const { data, w: aw, h: ah } = artPixels;
  const xMin = Math.max(0, Math.floor(mugLeft(m) * s));
  const xMax = Math.ceil(mugRight(m) * s);
  const yMin = Math.max(0, Math.floor((m.topC + (m.lip ?? 5)) * s));
  const yMax = Math.ceil((m.botC + m.botRy) * s);
  const dw = xMax - xMin;
  const dh = yMax - yMin;
  if (dw <= 0 || dh <= 0) return;
  const layer = document.createElement("canvas");
  layer.width = dw;
  layer.height = dh;
  const lg = layer.getContext("2d");
  if (!lg) return;
  const rgba = lg.createImageData(dw, dh);
  const dst = rgba.data;
  const offV = state.offY / 100;
  const invS = 1 / s;
  const edgeAA = 1.2; // largura de antialias em pixels REAIS, sem faixa branca visível
  const subsetWidth = splitEnd - splitStart;
  const wrap = (v: number): number => v - Math.floor(v);
  for (let ix = 0; ix < dw; ix++) {
    const px = (xMin + ix + 0.5) * invS;
    const tx = mugT(m, px);
    if (tx <= -1 || tx >= 1) continue;
    // Projeto verdadeiro da superfície cilíndrica (theta da normal da caneca).
    const theta = Math.asin(Math.max(-1, Math.min(1, tx)));
    let u = uCenter + (theta * visFrac) / Math.PI;
    // O recorte dividido deve continuar na SUA meia-arte e não vazar na vizinha.
    if (subsetWidth < 0.999999) {
      u = splitStart + wrap((u - splitStart) / subsetWidth) * subsetWidth;
    } else {
      u = wrap(u);
    }
    const fxSrc = u * aw - 0.5;
    const floorX = Math.floor(fxSrc);
    let x0 = (((floorX % aw) + aw) % aw);
    let x1 = (x0 + 1) % aw;
    // No split, não misturar um pixel da metade oposta nas bordas da divisão.
    if (subsetWidth < 0.999999) {
      const a = Math.max(0, Math.min(aw - 1, Math.ceil(splitStart * aw)));
      const b = Math.max(a, Math.min(aw - 1, Math.floor(splitEnd * aw) - 1));
      x0 = Math.max(a, Math.min(b, x0));
      x1 = Math.max(a, Math.min(b, x1));
    }
    const dx = fxSrc - floorX;
    const w0 = 1 - dx;
    const w1 = dx;
    const top = topY(m, tx) * s;
    const bot = botY(m, tx) * s;
    const height = bot - top;
    if (height <= 0) continue;
    // O fator de transparência só atua nos últimos 1–2px do contorno.
    const dSide = Math.min(px - mugLeft(m), mugRight(m) - px) * s;
    const alphaSide = Math.max(0, Math.min(1, dSide / edgeAA));
    for (let iy = 0; iy < dh; iy++) {
      const pyDst = yMin + iy + 0.5;
      if (pyDst <= top - edgeAA || pyDst >= bot + edgeAA) continue;
      const alphaTop = Math.max(0, Math.min(1, (pyDst - top) / edgeAA));
      const alphaBottom = Math.max(0, Math.min(1, (bot - pyDst) / edgeAA));
      const aMask = alphaSide * alphaTop * alphaBottom;
      if (aMask <= 0) continue;
      const norm = (pyDst - top) / height - offV;
      if (norm < 0 || norm > 1) continue;
      const srcY = Math.max(0, Math.min(ah - 1, norm * (ah - 1)));
      const y0 = Math.floor(srcY);
      const y1 = Math.min(ah - 1, y0 + 1);
      const dy = srcY - y0;
      const o00 = (y0 * aw + x0) * 4;
      const o01 = (y0 * aw + x1) * 4;
      const o10 = (y1 * aw + x0) * 4;
      const o11 = (y1 * aw + x1) * 4;
      const oDst = (iy * dw + ix) * 4;
      const v0 = 1 - dy;
      for (let k = 0; k < 3; k++) {
        dst[oDst + k] =
          (data[o00 + k] * w0 + data[o01 + k] * w1) * v0 +
          (data[o10 + k] * w0 + data[o11 + k] * w1) * dy;
      }
      dst[oDst + 3] =
        aMask *
        ((data[o00 + 3] * w0 + data[o01 + 3] * w1) * v0 +
          (data[o10 + 3] * w0 + data[o11 + 3] * w1) * dy);
    }
  }
  lg.putImageData(rgba, 0, 0);
  ctx.save();
  ctx.filter = "saturate(" + state.sat + "%)";
  ctx.drawImage(layer, xMin, yMin);
  ctx.restore();
}
