/**
 * Studio Click Mockup 2D — mapas derivados da foto original (port do Wrap V2).
 * Calculados 1x por template, a partir da foto original da caneca branca.
 * - lumMap: luminosidade normalizada (ref = percentil 95) -> sombreamento
 *   natural sem escurecer a arte.
 * - specMap: reflexos especulares naturais (smoothstep p80->p99 + blur) ->
 *   brilho vitrificado sem faixas artificiais.
 * - edgeColors: cor RGB real das bordas de cada caneca (só o matiz) ->
 *   reflexo ambiente discreto.
 * - grainPattern: grão sutil da porcelana.
 */
import { REF_W, REF_H } from "./types";
import type { MugCalibration, SceneMaps } from "./types";
import { bodyPath, mugX, topY, botY } from "./geometry";

export function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function blurCanvas(src: HTMLCanvasElement, scale: number): HTMLCanvasElement {
  const w = Math.max(2, Math.round(src.width * scale));
  const h = Math.max(2, Math.round(src.height * scale));
  const tmp = document.createElement("canvas");
  tmp.width = w;
  tmp.height = h;
  const tmpCtx = tmp.getContext("2d");
  if (tmpCtx) tmpCtx.drawImage(src, 0, 0, w, h);
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  const outCtx = out.getContext("2d");
  if (outCtx) outCtx.drawImage(tmp, 0, 0, src.width, src.height);
  return out;
}

/** Gera os mapas de um template a partir da imagem base já carregada. */
export function computeMaps(baseImg: HTMLImageElement, mugs: MugCalibration[]): SceneMaps {
  const empty: SceneMaps = { lumMap: null, specMap: null, edgeColors: [], grainPattern: null, ready: false };
  const tmp = document.createElement("canvas");
  tmp.width = REF_W;
  tmp.height = REF_H;
  const tctx = tmp.getContext("2d", { willReadFrequently: true });
  if (!tctx) return empty;
  tctx.drawImage(baseImg, 0, 0, REF_W, REF_H);
  const img = tctx.getImageData(0, 0, REF_W, REF_H);
  const d = img.data;
  const maskC = document.createElement("canvas");
  maskC.width = REF_W;
  maskC.height = REF_H;
  const mctx = maskC.getContext("2d");
  if (!mctx) return empty;
  mctx.fillStyle = "#fff";
  for (const m of mugs) {
    bodyPath(mctx, m, 1);
    mctx.fill();
  }
  const mask = mctx.getImageData(0, 0, REF_W, REF_H).data;
  const lums: number[] = [];
  for (let i = 0; i < d.length; i += 4) {
    if (mask[i] > 0) lums.push(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
  }
  if (!lums.length) return empty;
  lums.sort((a, b) => a - b);
  const pct = (p: number): number => lums[Math.min(lums.length - 1, Math.floor((p / 100) * lums.length))];
  const p80 = pct(80);
  const p95 = pct(95);
  const p99 = pct(99);
  const lumC = document.createElement("canvas");
  lumC.width = REF_W;
  lumC.height = REF_H;
  const lctx = lumC.getContext("2d");
  const lumImg = lctx ? lctx.createImageData(REF_W, REF_H) : null;
  const specC = document.createElement("canvas");
  specC.width = REF_W;
  specC.height = REF_H;
  const sctx = specC.getContext("2d");
  const specImg = sctx ? sctx.createImageData(REF_W, REF_H) : null;
  if (!lctx || !lumImg || !sctx || !specImg) return empty;
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    const sh = Math.max(0.6, Math.min(1, lum / p95));
    const sp = smoothstep(p80, p99, lum) * 0.85;
    const v = Math.round(sh * 255);
    const sv = Math.round(sp * 255);
    lumImg.data[i] = v;
    lumImg.data[i + 1] = v;
    lumImg.data[i + 2] = v;
    lumImg.data[i + 3] = 255;
    specImg.data[i] = sv;
    specImg.data[i + 1] = sv;
    specImg.data[i + 2] = sv;
    specImg.data[i + 3] = 255;
  }
  lctx.putImageData(lumImg, 0, 0);
  sctx.putImageData(specImg, 0, 0);
  const lumMap = blurCanvas(lumC, 0.5);
  const specMap = blurCanvas(specC, 0.25);
  const sampleEdge = (m: MugCalibration, tEdge: number): [number, number, number] => {
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    const x = Math.round(mugX(m, tEdge));
    const yT = topY(m, tEdge);
    const yB = botY(m, tEdge);
    for (let k = 0; k < 12; k++) {
      const y = Math.round(yT + (yB - yT) * (0.15 + (0.7 * k) / 11));
      if (x < 0 || x >= REF_W || y < 0 || y >= REF_H) continue;
      const idx = (y * REF_W + x) * 4;
      r += d[idx];
      g += d[idx + 1];
      b += d[idx + 2];
      n++;
    }
    if (!n) return [128, 128, 128];
    r /= n;
    g /= n;
    b /= n;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b || 1;
    const k = 128 / lum;
    return [
      Math.round(Math.min(255, r * k)),
      Math.round(Math.min(255, g * k)),
      Math.round(Math.min(255, b * k)),
    ];
  };
  const edgeColors = mugs.map((m) => ({ left: sampleEdge(m, -0.9), right: sampleEdge(m, 0.9) }));
  const nc = document.createElement("canvas");
  nc.width = 128;
  nc.height = 128;
  const nctx = nc.getContext("2d");
  let grainPattern: CanvasPattern | null = null;
  if (nctx) {
    const nimg = nctx.createImageData(128, 128);
    for (let i = 0; i < nimg.data.length; i += 4) {
      const v = 128 + Math.round((Math.random() - 0.5) * 64);
      nimg.data[i] = v;
      nimg.data[i + 1] = v;
      nimg.data[i + 2] = v;
      nimg.data[i + 3] = 255;
    }
    nctx.putImageData(nimg, 0, 0);
    grainPattern = tctx.createPattern(nc, "repeat");
  }
  return { lumMap, specMap, edgeColors, grainPattern, ready: true };
}
