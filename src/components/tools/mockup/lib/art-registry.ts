/* ============================================================
   Registro de imagens da arte — 100% no dispositivo.
   Load, validação e fonte original preservada para salvar/exportar.
   ============================================================ */

import { MAX_UPLOAD_MB } from "./config";
import { sampleArt, type ArtAnalysis } from "./art-analysis";

export interface ArtImageEntry {
  id: string;
  source: CanvasImageSource; // ImageBitmap | HTMLImageElement | HTMLCanvasElement
  width: number; // px originais; o canvas 3D limita somente a prévia
  height: number;
  naturalWidth: number; // px originais (para DPI)
  naturalHeight: number;
  name: string;
  url?: string; // objectURL (revogado ao substituir)
  originalBlob?: Blob; // original byte-for-byte, never re-encoded on project save
  vector?: boolean;
  analysis?: ArtAnalysis | null;
}

const registry = new Map<string, ArtImageEntry>();
let seq = 0;

export function getArtImage(id: string | null): ArtImageEntry | null {
  if (!id) return null;
  return registry.get(id) ?? null;
}

export function removeArtImage(id: string | null) {
  if (!id) return;
  const e = registry.get(id);
  if (e?.url) URL.revokeObjectURL(e.url);
  if (e?.source && "close" in e.source && typeof e.source.close === "function") e.source.close();
  registry.delete(id);
}

const ACCEPTED = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  "image/gif",
  "image/bmp",
];

/** Same allowlist as uploads, so saved SVG/AVIF originals reopen intact. */
export function decodeArtDataUrl(data: string): Blob {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]*={0,2})$/.exec(data);
  if (!match || !ACCEPTED.includes(match[1])) throw new Error("Imagem de projeto inválida.");
  try {
    const binary = atob(match[2]);
    return new Blob([Uint8Array.from(binary, ch => ch.charCodeAt(0))], { type: match[1] });
  } catch { throw new Error("Imagem de projeto inválida."); }
}

export function validateFile(file: File): string | null {
  if (!ACCEPTED.includes(file.type))
    return "Formato não suportado. Use PNG, JPG, WebP, SVG ou AVIF.";
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024)
    return `Arquivo muito grande (máximo ${MAX_UPLOAD_MB} MB).`;
  return null;
}

/** Reject oversized rasters explicitly instead of silently destroying detail. */
export function validateArtDimensions(width: number, height: number): void {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1)
    throw new Error("A imagem não tem dimensões válidas.");
  if (width * height > 64_000_000 || Math.max(width, height) > 32768)
    throw new Error("Imagem acima do limite seguro de 64 megapixels. Exporte uma cópia menor; seu original não foi alterado.");
}

async function decode(
  file: Blob,
  isSvg: boolean,
): Promise<{
  source: CanvasImageSource;
  w: number;
  h: number;
  keepUrl?: string;
}> {
  // SVG e fallbacks: HTMLImageElement (createImageBitmap não decora SVG bem)
  if (isSvg || typeof createImageBitmap === "undefined") {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = "async";
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("decode"));
        img.src = url;
      });
      const w = img.naturalWidth || 1024, h = img.naturalHeight || 1024;
      validateArtDimensions(w, h);
      // SVG remains vector-backed; it is rasterized only at the target canvas size.
      return { source: img, w, h, keepUrl: url };
    } catch (e) {
      URL.revokeObjectURL(url);
      throw e;
    }
  }
  const bmp = await createImageBitmap(file);
  try { validateArtDimensions(bmp.width, bmp.height); }
  catch (error) { bmp.close(); throw error; }
  return { source: bmp, w: bmp.width, h: bmp.height };
}

export async function loadArtFile(file: File): Promise<ArtImageEntry> {
  const err = validateFile(file);
  if (err) throw new Error(err);
  return loadArtBlob(file, file.name || "arte");
}

/** carrega um Blob já validado (restauração de projetos) */
export async function loadArtBlob(
  blob: Blob,
  name: string,
): Promise<ArtImageEntry> {
  const d = await decode(blob, blob.type === "image/svg+xml");
  const id = `art_${Date.now()}_${++seq}`;
  const entry: ArtImageEntry = {
    id,
    source: d.source,
    width: d.w,
    height: d.h,
    naturalWidth: d.w,
    naturalHeight: d.h,
    name,
    url: d.keepUrl,
    originalBlob: blob,
    vector: blob.type === "image/svg+xml",
    analysis: sampleArt(d.source, d.w, d.h),
  };
  registry.set(id, entry);
  return entry;
}

/** Preserve uploaded bytes and format. Only procedural sample art is encoded. */
export async function getArtBlob(id: string | null): Promise<Blob | null> {
  const e = getArtImage(id);
  if (!e) return null;
  if (e.originalBlob) return e.originalBlob;
  const c = document.createElement("canvas");
  c.width = e.width;
  c.height = e.height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(e.source, 0, 0);
  return new Promise((res) => c.toBlob((b) => res(b), "image/png"));
}

/* ---------------- Arte de exemplo procedural ---------------- */

export function makeSampleArt(): ArtImageEntry {
  const W = 1400;
  const H = 700;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#e8703a");
  g.addColorStop(0.55, "#d95f2b");
  g.addColorStop(1, "#1d130d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // círculos decorativos
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#ffffff";
  for (const [x, y, r] of [
    [180, 160, 120],
    [1150, 520, 180],
    [700, 90, 70],
  ] as const) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // coração
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(700, 250);
  ctx.bezierCurveTo(640, 190, 545, 215, 545, 300);
  ctx.bezierCurveTo(545, 375, 645, 430, 700, 470);
  ctx.bezierCurveTo(755, 430, 855, 375, 855, 300);
  ctx.bezierCurveTo(855, 215, 760, 190, 700, 250);
  ctx.fill();
  ctx.fillStyle = "#e8703a";
  ctx.font = "800 86px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("&", 700, 330);

  // textos
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 92px sans-serif";
  ctx.fillText("CLICK & GRUDA", 700, 575);
  ctx.font = "600 34px sans-serif";
  ctx.globalAlpha = 0.85;
  ctx.fillText("A R T E   D E   E X E M P L O", 700, 640);
  ctx.globalAlpha = 1;

  const id = `art_sample_${++seq}`;
  const entry: ArtImageEntry = {
    id,
    source: c,
    width: W,
    height: H,
    naturalWidth: W,
    naturalHeight: H,
    name: "arte-exemplo",
    analysis: sampleArt(c, W, H),
  };
  registry.set(id, entry);
  return entry;
}
