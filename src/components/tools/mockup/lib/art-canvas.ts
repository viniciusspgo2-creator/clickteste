/* ============================================================
   Motor de arte em canvas — desenha a arte na "folha" que
   envolve a caneca em projeção cilíndrica.

   A folha cobre a parede INTEIRA (0 → 9,6 cm de altura × 360°) com a
   cor-base, e a arte é desenhada num retângulo exato dentro dela.
   Os UVs são contínuos na parede e no chanfro inferior. O lábio e o
   interior usam uma faixa de cerâmica separada, sem estampa. A fronteira
   da área personalizada é desenhada na textura, dentro desses limites.

   Layout (cm, de cima para baixo — ver texV/V_EXT/V_INT no config):
     zona da parede  y = 9,6 … 0   → cor-base + arte
     faixa exterior  (borda arredondada, pé, fundo)
     faixa interior  (interior da caneca)
   ============================================================ */

import * as THREE from "three";
import {
  CANVAS_W_PREVIEW,
  CIRC_CM,
  ZONE_CM,
  STRIP_CM,
  TEX_TOTAL_CM,
  UV_PAD_PX,
  MODEL_METRICS,
  MAX_ART_PX,
  resolvePrintArea,
  type PrintArea,
} from "./config";
import type { ArtState, MugState } from "../state/store";
import { getArtImage } from "./art-registry";
import { adjustPixels } from "./art-adjustments";

const adjustedCache = new Map<string, HTMLCanvasElement>();
function adjustedSource(
  art: ArtState,
  entry: NonNullable<ReturnType<typeof getArtImage>>,
  drawnWidth: number,
  drawnHeight: number,
): CanvasImageSource {
  const values = [
    art.brightness,
    art.contrast,
    art.saturation,
    art.vibrance,
    art.temperature,
    art.sharpness,
  ];
  if (!values.some(Boolean)) return entry.source;
  // Grade only pixels needed by this output. Original files stay untouched;
  // a 12K upload must not allocate several full-size pixel buffers per slider.
  const desired = Math.min(entry.vector ? Infinity : 1,
    Math.max(Math.abs(drawnWidth) / entry.width, Math.abs(drawnHeight) / entry.height),
    MAX_ART_PX / Math.max(entry.width, entry.height),
    Math.sqrt(16_000_000 / (entry.width * entry.height)));
  const width = Math.max(1, Math.round(entry.width * desired));
  const height = Math.max(1, Math.round(entry.height * desired));
  const key = entry.id + `${width}x${height}` + JSON.stringify(values);
  const cached = adjustedCache.get(key);
  if (cached) return cached;
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(entry.source, 0, 0, c.width, c.height);
  const pixels = ctx.getImageData(0, 0, c.width, c.height);
  adjustPixels(pixels.data, c.width, c.height, art);
  ctx.putImageData(pixels, 0, 0);
  // At most two destination-size canvases retained, even during slider drags.
  if (adjustedCache.size >= 2) adjustedCache.delete(adjustedCache.keys().next().value!);
  adjustedCache.set(key, c);
  return c;
}

/* ------------ ruído estável da revelação térmica (cache por tamanho) ------------ */

const noiseCache = new Map<string, Uint8Array>();

function magicNoise(w: number, h: number): Uint8Array {
  const key = `${w}x${h}`;
  const cached = noiseCache.get(key);
  if (cached) return cached;
  // ruído em blocos 4×4 suavizado — célula maior parece a mancha real do revestimento
  const data = new Uint8Array(w * h);
  const cw = Math.ceil(w / 4) + 1;
  const ch = Math.ceil(h / 4) + 1;
  const cell = new Float32Array(cw * ch);
  for (let i = 0; i < cell.length; i++) cell[i] = Math.random();
  for (let y = 0; y < h; y++) {
    const cy = y / 4;
    const y0 = Math.floor(cy);
    const fy = cy - y0;
    for (let x = 0; x < w; x++) {
      const cx = x / 4;
      const x0 = Math.floor(cx);
      const fx = cx - x0;
      const a = cell[y0 * cw + x0];
      const b = cell[y0 * cw + x0 + 1];
      const c = cell[(y0 + 1) * cw + x0];
      const d = cell[(y0 + 1) * cw + x0 + 1];
      const top = a + (b - a) * fx;
      const bottom = c + (d - c) * fx;
      data[y * w + x] = Math.round((top + (bottom - top) * fy) * 255);
    }
  }
  if (noiseCache.size > 4) noiseCache.clear();
  noiseCache.set(key, data);
  return data;
}

/**
 * Revelação térmica da caneca mágica: mistura cada pixel da folha entre a
 * arte revelada e o revestimento preto conforme calor × campo de gradiente + ruído.
 */
function applyMagicReveal(
  canvas: HTMLCanvasElement,
  rect: ArtRect,
  mug: MugState,
) {
  if (mug.magicHeat >= 0.995) return;
  const W = rect.w;
  const printH = rect.h;
  const ctx = canvas.getContext("2d")!;
  const heat = Math.max(0, mug.magicHeat);
  const dis = Math.max(0, Math.min(1, mug.magicDissolve));
  const dir = mug.magicDirection;
  const noise = magicNoise(W, printH);
  const img = ctx.getImageData(rect.x, rect.y, W, printH);
  const px = img.data;
  const edge = 0.09 + dis * 0.5;
  const reach = 1.22; // margem para heat=1 revelar 100%
  const Cx = W / 2;
  const Cy = printH / 2;
  const Nr = Math.hypot(Cx, Cy);

  for (let y = 0; y < printH; y++) {
    const gy = y / printH;
    for (let x = 0; x < W; x++) {
      let g: number;
      if (dir === "baixo") {
        g = 1 - gy; // y=0 é o TOPO da caneca (flipY) — revela de baixo para cima
      } else if (dir === "lateral") {
        g = x / W;
      } else {
        g = Math.hypot(x - Cx, y - Cy) / Nr;
      }
      const field = g * (1 - dis) + (noise[y * W + x] / 255) * dis;
      let a = (heat * reach - field) / edge;
      if (a >= 1) continue;
      if (a < 0) a = 0;
      const i = (y * W + x) * 4;
      const k = 1 - a; // peso do revestimento preto
      px[i] = px[i] * a + 19 * k;
      px[i + 1] = px[i + 1] * a + 16 * k;
      px[i + 2] = px[i + 2] * a + 14 * k;
    }
  }
  ctx.putImageData(img, rect.x, rect.y);
}

/** retângulo (px do canvas) onde a arte é impressa */
export interface ArtRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Altura do canvas para uma largura (a volta de 360°) — independe da área ativa */
export function canvasHeightFor(
  width: number,
  _area?: PrintArea,
  model = "classic",
): number {
  const metrics = MODEL_METRICS[model] ?? MODEL_METRICS.classic;
  return Math.round(
    (width * (TEX_TOTAL_CM / 9.5) * metrics.height) / metrics.circumference,
  );
}

/**
 * Onde a arte cai na folha. Tudo vem do mesmo layout em cm usado pela
 * geometria (texV/V_EXT/V_INT), então a borda da arte coincide EXATAMENTE
 * com a altura física pedida — sem anéis, sem costuras, sem esticar pixel.
 * Horizontal: arco centrado na FRENTE (x = W/2); o vão da alça (atrás)
 * cai nas pontas do canvas, onde fica a costura da textura.
 */
export function artRectFor(W: number, H: number, a: PrintArea): ArtRect {
  const ppcX = W / CIRC_CM;
  const ppcY = H / TEX_TOTAL_CM;
  const w = Math.round(a.arcCm * ppcX);
  const top = Math.floor((ZONE_CM - a.printTop) * ppcY);
  const bottom = Math.ceil((ZONE_CM - a.printBottom) * ppcY);
  return {
    x: Math.round((W - w) / 2),
    y: top,
    w,
    h: bottom - top,
  };
}

/**
 * Desenha a camada de texto do usuário (legenda/slogan) sobre a área.
 * W = largura do arco de impressão em px; printH = altura da área em px.
 */
function drawArtText(
  ctx: CanvasRenderingContext2D,
  W: number,
  printH: number,
  art: ArtState,
) {
  const text = (art.text ?? "").trim();
  if (!text) return;
  const px = Math.max(
    8,
    printH * Math.min(0.24, Math.max(0.04, art.textSize ?? 0.09)),
  );
  ctx.save();
  ctx.font = `800 ${px}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = art.textColor || "#1d130d";
  const x = W / 2;
  const y = printH * (0.55 + Math.max(-1, Math.min(1, art.textY ?? 0)) * 0.42);
  ctx.fillText(text, x, y);
  ctx.restore();
}

/**
 * Desenha a arte na área de impressão (printH linhas) do ctx, com os
 * ajustes do usuário (fit, escala, posição, rotação, espelho, repetir)
 * e a camada de texto. Usada pela folha de textura 3D e pela folha
 * planificada para sublimação. W aqui = largura do ARCO de impressão.
 *
 * `wrapW` = período da volta COMPLETA (360°) em px do canvas. As cópias
 * de continuidade (a arte que “sai” de um lado reaparece do outro depois
 * de uma volta inteira) são desenhadas nesse período — nunca no período
 * do arco: com o período errado as cópias invadiam a área visível e
 * criavam as listras/faixas duplicadas perto das bordas da arte.
 * `wrapW = 0` desliga as cópias (folha plana de impressão).
 */
export function drawArtIntoArea(
  ctx: CanvasRenderingContext2D,
  W: number,
  printH: number,
  art: ArtState,
  wrapW?: number,
) {
  const entry = getArtImage(art.imageId);

  if (entry) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const iw = entry.width;
    const ih = entry.height;
    const repeat = Math.max(1, Math.round(art.repeat));
    const slotW = W / repeat;

    let dw: number, dh: number;
    if (art.fit === "stretch") {
      dw = slotW;
      dh = printH;
    } else if (art.fit === "cover") {
      const s = Math.max(slotW / iw, printH / ih);
      dw = iw * s;
      dh = ih * s;
    } else {
      const s = Math.min(slotW / iw, printH / ih);
      dw = iw * s;
      dh = ih * s;
    }
    const bleed = 1 + (Math.max(0, art.bleed ?? 0) * 2) / 8.7;
    dw *= art.scale * bleed;
    dh *= art.scale * bleed;
    const img = adjustedSource(art, entry, dw, dh);

    const wrap = Math.max(0, wrapW ?? W); // volta completa em px (0 = sem cópias)
    const phase = art.offsetX * W; // desloca em volta da caneca (com wrap)
    const cy = printH / 2 + art.offsetY * printH * 0.5;

    for (let i = 0; i < repeat; i++) {
      const cx = i * slotW + slotW / 2 + phase;
      // cópias de continuidade PRIMEIRO, cópia principal por último —
      // em zoom extremo (arte maior que a volta) a principal domina
      for (const xo of wrap > 0 ? [-wrap, wrap, 0] : [0]) {
        ctx.save();
        ctx.globalAlpha = art.opacity ?? 1;
        ctx.translate(cx + xo, cy);
        ctx.rotate((art.rotation * Math.PI) / 180);
        ctx.scale(art.mirror ? -1 : 1, 1);
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      }
    }
  }

  drawArtText(ctx, W, printH, art);
  const decal = getArtImage(art.decalImageId ?? null);
  if (decal) {
    const w = W * (art.decalScale ?? 0.25),
      h = (w * decal.height) / decal.width;
    for (const offset of wrapW ? [-wrapW, 0, wrapW] : [0]) {
      ctx.save();
      ctx.globalAlpha = art.decalOpacity ?? 1;
      ctx.translate(
        W * (0.5 + (art.decalX ?? 0) * 0.5) + offset,
        printH * (0.5 + (art.decalY ?? 0) * 0.5),
      );
      ctx.rotate(((art.decalRotation ?? 0) * Math.PI) / 180);
      ctx.drawImage(decal.source, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
  }
}

/**
 * Desenha a arte na folha (canvas) conforme os ajustes do usuário.
 * O canvas cobre a volta completa: a arte fica confinada ao arco de
 * impressão da área ativa e o vão da alça é preenchido com a cor-base —
 * sem listras nem vazamento da última coluna.
 * Na caneca mágica aplica a revelação térmica sobre a área de impressão.
 */
export function renderArtCanvas(
  canvas: HTMLCanvasElement,
  art: ArtState,
  mug: MugState,
  area?: PrintArea,
) {
  const a = area ?? resolvePrintArea(art);
  const W = canvas.width;
  const H = canvas.height;
  const ppcY = H / TEX_TOTAL_CM;
  const rect = artRectFor(W, H, a);
  const zoneBottom = Math.round(ZONE_CM * ppcY);
  const extBottom = Math.round((ZONE_CM + STRIP_CM) * ppcY);
  const ctx = canvas.getContext("2d")!;

  const isMagic = mug.variant === "magic";
  const ext = isMagic ? "#141110" : (mug.bodyColor ?? "#ffffff");
  const interior = mug.interiorColor ?? (mug.variant === "white" ? "#ffffff" : mug.accentColor);

  // cor-base em TODA a parede + faixa exterior; interior numa faixa à parte
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = ext;
  ctx.fillRect(0, 0, W, extBottom);
  ctx.fillStyle = mug.baseColor ?? ext;
  ctx.fillRect(0, zoneBottom, W, extBottom - zoneBottom);
  ctx.fillStyle = interior;
  ctx.fillRect(0, extBottom, W, H - extBottom);

  // arte confinada ao retângulo de impressão (bordas em pixel inteiro);
  // o wrap usa a volta COMPLETA (W) — nunca o arco — para não criar listras
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.translate(rect.x, rect.y);
  drawArtIntoArea(ctx, rect.w, rect.h, art, W);
  ctx.restore();

  if (isMagic) applyMagicReveal(canvas, rect, mug);
  // A borda y=0 cai entre texels. Repete a última linha para a filtragem
  // não puxar cerâmica branca para o pé, sem aumentar a área física impressa.
  if (a.printBottom <= 0) {
    const guard = Math.min(UV_PAD_PX, Math.floor(STRIP_CM * ppcY / 4));
    if (guard > 0) ctx.drawImage(canvas, rect.x, rect.y + rect.h - 1, rect.w, 1,
      rect.x, rect.y + rect.h, rect.w, guard);
  }
}

/** Cria a CanvasTexture com flags corretas de cor/filtragem */
export function makeArtTexture(
  canvas: HTMLCanvasElement,
  maxAniso: number,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping; // costura da textura fica atrás (vão da alça)
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = Math.max(1, maxAniso);
  tex.flipY = true;
  tex.needsUpdate = true;
  return tex;
}

/** DPI efetivo da arte na área de impressão ativa */
export function computeDpi(art: ArtState, area?: PrintArea, model = "classic"): number | null {
  const entry = getArtImage(art.imageId);
  if (!entry || entry.vector) return null;
  const a = area ?? resolvePrintArea(art);
  const metrics = MODEL_METRICS[model] ?? MODEL_METRICS.classic;
  const slotW = (a.arcCm * metrics.circumference / CIRC_CM) / Math.max(1, Math.round(art.repeat));
  const printH = a.heightCm * metrics.height / 9.5;
  const iw = entry.naturalWidth;
  const ih = entry.naturalHeight;
  const bleed = 1 + (Math.max(0, art.bleed ?? 0) * 2) / 8.7;
  const multiplier = art.scale * bleed;
  const base = art.fit === "cover" ? Math.max(slotW / iw, printH / ih) : Math.min(slotW / iw, printH / ih);
  const printedWidthCm = (art.fit === "stretch" ? slotW : iw * base) * multiplier;
  const printedHeightCm = (art.fit === "stretch" ? printH : ih * base) * multiplier;
  if (printedWidthCm <= 0 || printedHeightCm <= 0) return null;
  // Include cropped-away source pixels in the scale. Counting only the visible
  // width previously overstated the DPI of artwork zoomed to cover.
  return Math.min(iw / (printedWidthCm / 2.54), ih / (printedHeightCm / 2.54));
}

/**
 * Escala exata para a arte preencher a altura (ou a largura) da área,
 * respeitando o modo de encaixe atual — usada pelos botões rápidos do painel.
 */
export function computeFitScale(
  art: ArtState,
  target: "height" | "width",
  area?: PrintArea,
): number | null {
  const entry = getArtImage(art.imageId);
  if (!entry) return null;
  const a = area ?? resolvePrintArea(art);
  const printH = Math.round((CANVAS_W_PREVIEW * a.heightCm) / CIRC_CM);
  const arcPx = Math.round(CANVAS_W_PREVIEW * (a.arcCm / CIRC_CM));
  const slotW = arcPx / Math.max(1, Math.round(art.repeat));
  const iw = entry.width;
  const ih = entry.height;
  if (iw <= 0 || ih <= 0) return null;
  if (art.fit === "stretch") return 1; // esticado já preenche os dois eixos
  const s =
    art.fit === "cover"
      ? Math.max(slotW / iw, printH / ih)
      : Math.min(slotW / iw, printH / ih);
  const dwBase = iw * s;
  const dhBase = ih * s;
  const k = target === "height" ? printH / dhBase : slotW / dwBase;
  // A escala é um valor absoluto. Multiplicar pela escala atual faz o botão
  // aplicar o ajuste em cascata (ex.: 200% vira 400%) em vez de encaixar a arte.
  return Math.max(0.1, Math.min(3, k));
}

/** Artwork alpha becomes a separate metalness mask; ceramic areas remain dielectric. */
export function renderMetalMask(canvas: HTMLCanvasElement, art: ArtState) {
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const rect = artRectFor(canvas.width, canvas.height, resolvePrintArea(art));
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.translate(rect.x, rect.y);
  drawArtIntoArea(ctx, rect.w, rect.h, art, canvas.width);
  ctx.restore();
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";
}
