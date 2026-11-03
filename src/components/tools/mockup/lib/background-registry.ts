/* ============================================================
   Registro de imagens de FUNDO — 100% no dispositivo.
   Upload (jpg/png/webp, máx. 25 MB → reduzido a 4096 px) +
   cenários prontos gerados por código (sem direitos autorais).
   ============================================================ */

import { MAX_BG_PX, MAX_UPLOAD_MB } from "./config";

export interface BgImageEntry {
  id: string;
  source: CanvasImageSource; // ImageBitmap | HTMLImageElement | HTMLCanvasElement
  width: number;
  height: number;
  /** cor média da imagem (rgb 0..1) — usada em "Combinar luz com o fundo" */
  avg: [number, number, number];
  name: string;
  url?: string;
}

const registry = new Map<string, BgImageEntry>();
let seq = 0;

export function getBackgroundImage(id: string | null): BgImageEntry | null {
  if (!id) return null;
  return registry.get(id) ?? null;
}

/** cor média ou fallback neutro */
export function getBackgroundAvg(
  id: string | null,
): [number, number, number] | null {
  return getBackgroundImage(id)?.avg ?? null;
}

export function removeBackgroundImage(id: string | null) {
  if (!id) return;
  const e = registry.get(id);
  if (e?.url) URL.revokeObjectURL(e.url);
  registry.delete(id);
}

const BG_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateBgFile(file: File): string | null {
  if (!BG_TYPES.includes(file.type)) return "Use uma imagem JPG, PNG ou WebP.";
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024)
    return `Imagem muito grande (máximo ${MAX_UPLOAD_MB} MB).`;
  return null;
}

/** cor média de um source (amostra 8×8) */
function computeAvg(
  source: CanvasImageSource,
  w: number,
  h: number,
): [number, number, number] {
  try {
    const c = document.createElement("canvas");
    c.width = 8;
    c.height = 8;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(source, 0, 0, w, h, 0, 0, 8, 8);
    const d = ctx.getImageData(0, 0, 8, 8).data;
    let r = 0,
      g = 0,
      b = 0;
    for (let i = 0; i < d.length; i += 4) {
      r += d[i];
      g += d[i + 1];
      b += d[i + 2];
    }
    const n = d.length / 4;
    return [r / n / 255, g / n / 255, b / n / 255];
  } catch {
    return [0.85, 0.83, 0.8];
  }
}

function downscaleTo(
  source: CanvasImageSource,
  w: number,
  h: number,
): { source: CanvasImageSource; w: number; h: number } {
  const maxSide = Math.max(w, h);
  if (maxSide <= MAX_BG_PX) return { source, w, h };
  const f = MAX_BG_PX / maxSide;
  const tw = Math.round(w * f);
  const th = Math.round(h * f);
  const c = document.createElement("canvas");
  c.width = tw;
  c.height = th;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, tw, th);
  return { source: c, w: tw, h: th };
}

async function decode(
  file: Blob,
): Promise<{
  source: CanvasImageSource;
  w: number;
  h: number;
  keepUrl?: string;
}> {
  if (typeof createImageBitmap === "undefined") {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = "async";
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("decode"));
        img.src = url;
      });
      const r = downscaleTo(
        img,
        img.naturalWidth || 1920,
        img.naturalHeight || 1080,
      );
      return { ...r, keepUrl: url };
    } catch (e) {
      URL.revokeObjectURL(url);
      throw e;
    }
  }
  const bmp = await createImageBitmap(file);
  const r = downscaleTo(bmp, bmp.width, bmp.height);
  if (r.source === bmp) return { source: bmp, w: bmp.width, h: bmp.height };
  bmp.close();
  return { source: r.source, w: r.w, h: r.h };
}

export async function loadBgFile(file: File): Promise<BgImageEntry> {
  const err = validateBgFile(file);
  if (err) throw new Error(err);
  const d = await decode(file);
  const id = `bg_${Date.now()}_${++seq}`;
  const entry: BgImageEntry = {
    id,
    source: d.source,
    width: d.w,
    height: d.h,
    avg: computeAvg(d.source, d.w, d.h),
    name: file.name || "fundo",
    url: d.keepUrl,
  };
  registry.set(id, entry);
  return entry;
}

/** carrega um Blob já validado (restauração de projetos) */
export async function loadBgBlob(
  blob: Blob,
  name: string,
): Promise<BgImageEntry> {
  const d = await decode(blob);
  const id = `bg_${Date.now()}_${++seq}`;
  const entry: BgImageEntry = {
    id,
    source: d.source,
    width: d.w,
    height: d.h,
    avg: computeAvg(d.source, d.w, d.h),
    name,
  };
  registry.set(id, entry);
  return entry;
}

/** serializa o fundo atual como PNG (para salvar no projeto) — cenários prontos não precisam */
export async function getBgBlob(id: string | null): Promise<Blob | null> {
  if (!id || id.startsWith("scene-")) return null;
  const e = getBackgroundImage(id);
  if (!e) return null;
  const c = document.createElement("canvas");
  c.width = e.width;
  c.height = e.height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(e.source, 0, 0);
  return new Promise((res) => c.toBlob((b) => res(b), "image/png"));
}

/* ============ Cenários prontos (gerados por código) ============ */

type SceneMaker = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

/** ruído suave reutilizável */
function drawNoise(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  alpha: number,
  mono = true,
) {
  const S = 128;
  const n = document.createElement("canvas");
  n.width = S;
  n.height = S;
  const nctx = n.getContext("2d")!;
  const img = nctx.createImageData(S, S);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = mono ? 110 + Math.random() * 60 : Math.random() * 255;
    img.data[i] = v;
    img.data[i + 1] = mono ? v : Math.random() * 255;
    img.data[i + 2] = mono ? v : Math.random() * 255;
    img.data[i + 3] = Math.round(alpha * 255);
  }
  nctx.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalAlpha = alpha;
  const pat = ctx.createPattern(n, "repeat")!;
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

const SCENE_MAKERS: { id: string; label: string; make: SceneMaker }[] = [
  {
    id: "scene-madeira",
    label: "Madeira clara",
    make: (ctx, w, h) => {
      ctx.fillStyle = "#c9a274";
      ctx.fillRect(0, 0, w, h);
      // veios horizontais
      for (let i = 0; i < 90; i++) {
        const y = (i / 90) * h + Math.random() * 6;
        ctx.strokeStyle = `rgba(${100 + Math.random() * 40},${70 + Math.random() * 30},${40 + Math.random() * 20},${0.08 + Math.random() * 0.14})`;
        ctx.lineWidth = 1 + Math.random() * 3;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += w / 8) {
          ctx.lineTo(x, y + Math.sin(x * 0.01 + i) * 3);
        }
        ctx.stroke();
      }
      // nós
      ctx.globalAlpha = 0.14;
      for (let i = 0; i < 3; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const g = ctx.createRadialGradient(x, y, 2, x, y, 40);
        g.addColorStop(0, "#6b4a2a");
        g.addColorStop(1, "rgba(107,74,42,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - 40, y - 40, 80, 80);
      }
      ctx.globalAlpha = 1;
      drawNoise(ctx, w, h, 0.06);
    },
  },
  {
    id: "scene-marmore",
    label: "Mármore",
    make: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#f5f3f0");
      g.addColorStop(0.5, "#e9e6e2");
      g.addColorStop(1, "#f2efeb");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // veias cinza
      ctx.lineCap = "round";
      for (let i = 0; i < 14; i++) {
        ctx.strokeStyle = `rgba(120,118,124,${0.05 + Math.random() * 0.12})`;
        ctx.lineWidth = 0.6 + Math.random() * 2.4;
        ctx.beginPath();
        let x = Math.random() * w;
        let y = Math.random() * h;
        ctx.moveTo(x, y);
        for (let s = 0; s < 6; s++) {
          x += (Math.random() - 0.35) * w * 0.22;
          y += (Math.random() - 0.4) * h * 0.22;
          ctx.quadraticCurveTo(x + 30, y - 20, x, y);
        }
        ctx.stroke();
      }
      drawNoise(ctx, w, h, 0.04);
    },
  },
  {
    id: "scene-concreto",
    label: "Concreto",
    make: (ctx, w, h) => {
      const g = ctx.createRadialGradient(
        w / 2,
        h / 2,
        h * 0.1,
        w / 2,
        h / 2,
        w * 0.75,
      );
      g.addColorStop(0, "#c2beb8");
      g.addColorStop(1, "#a29e98");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      drawNoise(ctx, w, h, 0.1);
      // manchas suaves
      ctx.globalAlpha = 0.08;
      for (let i = 0; i < 6; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 60 + Math.random() * 160;
        const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
        rg.addColorStop(0, "#8d8a84");
        rg.addColorStop(1, "rgba(141,138,132,0)");
        ctx.fillStyle = rg;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
    },
  },
  {
    id: "scene-parede",
    label: "Parede creme",
    make: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#f4ecdf");
      g.addColorStop(0.6, "#eadfcd");
      g.addColorStop(1, "#dfd2bc");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // luz suave no topo
      const l = ctx.createRadialGradient(
        w * 0.5,
        -h * 0.2,
        0,
        w * 0.5,
        -h * 0.2,
        h * 1.4,
      );
      l.addColorStop(0, "rgba(255,255,255,0.5)");
      l.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = l;
      ctx.fillRect(0, 0, w, h);
      drawNoise(ctx, w, h, 0.035);
    },
  },
  {
    id: "scene-linho",
    label: "Tecido linho",
    make: (ctx, w, h) => {
      ctx.fillStyle = "#ddd2c2";
      ctx.fillRect(0, 0, w, h);
      // trama
      ctx.globalAlpha = 0.1;
      ctx.strokeStyle = "#b9a98f";
      ctx.lineWidth = 1.2;
      for (let x = 0; x < w; x += 5) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 5) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // dobras suaves
      for (let i = 0; i < 5; i++) {
        const y = Math.random() * h;
        const dg = ctx.createLinearGradient(0, y - 60, 0, y + 60);
        dg.addColorStop(0, "rgba(160,145,120,0)");
        dg.addColorStop(0.5, `rgba(160,145,120,${0.1 + Math.random() * 0.1})`);
        dg.addColorStop(1, "rgba(160,145,120,0)");
        ctx.fillStyle = dg;
        ctx.fillRect(0, y - 60, w, 120);
      }
      drawNoise(ctx, w, h, 0.05);
    },
  },
  {
    id: "scene-escuro",
    label: "Estúdio escuro",
    make: (ctx, w, h) => {
      const g = ctx.createRadialGradient(
        w / 2,
        h * 0.42,
        h * 0.05,
        w / 2,
        h * 0.42,
        w * 0.72,
      );
      g.addColorStop(0, "#3a332c");
      g.addColorStop(0.55, "#221d18");
      g.addColorStop(1, "#0d0b09");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // brilho frio de preenchimento
      const c = ctx.createRadialGradient(
        w * 0.82,
        h * 0.2,
        0,
        w * 0.82,
        h * 0.2,
        w * 0.4,
      );
      c.addColorStop(0, "rgba(120,130,150,0.10)");
      c.addColorStop(1, "rgba(120,130,150,0)");
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, w, h);
      drawNoise(ctx, w, h, 0.04);
    },
  },
  {
    id: "scene-poente",
    label: "Pôr do sol",
    make: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#2c1a12");
      g.addColorStop(0.42, "#8a4420");
      g.addColorStop(0.72, "#e8703a");
      g.addColorStop(1, "#f2a25e");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // sol difuso
      const s = ctx.createRadialGradient(
        w * 0.68,
        h * 0.66,
        0,
        w * 0.68,
        h * 0.66,
        h * 0.34,
      );
      s.addColorStop(0, "rgba(255,220,170,0.85)");
      s.addColorStop(1, "rgba(255,220,170,0)");
      ctx.fillStyle = s;
      ctx.fillRect(0, 0, w, h);
      drawNoise(ctx, w, h, 0.03);
    },
  },
  {
    id: "scene-sage",
    label: "Verde suave",
    make: (ctx, w, h) => {
      const g = ctx.createRadialGradient(
        w * 0.4,
        h * 0.3,
        h * 0.1,
        w * 0.5,
        h * 0.5,
        w * 0.8,
      );
      g.addColorStop(0, "#dfe5d8");
      g.addColorStop(0.6, "#c3cdb9");
      g.addColorStop(1, "#a8b49e");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // folhagem desfocada sugerida
      ctx.globalAlpha = 0.12;
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 40 + Math.random() * 90;
        const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
        rg.addColorStop(0, "#5f7355");
        rg.addColorStop(1, "rgba(95,115,85,0)");
        ctx.fillStyle = rg;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
      drawNoise(ctx, w, h, 0.04);
    },
  },
];

export const SCENES: { id: string; label: string }[] = SCENE_MAKERS.map(
  ({ id, label }) => ({ id, label }),
);

/** garante que todos os cenários gerados por código estão registrados */
export function ensureScenes(sceneId?: string): void {
  const makers = sceneId
    ? SCENE_MAKERS.filter((scene) => scene.id === sceneId)
    : SCENE_MAKERS;
  for (const s of makers) {
    if (registry.has(s.id)) continue;
    const w = 1920;
    const h = 1080;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    s.make(ctx, w, h);
    registry.set(s.id, {
      id: s.id,
      source: c,
      width: w,
      height: h,
      avg: computeAvg(c, w, h),
      name: s.label,
    });
  }
}

/** desenha a miniatura de um cenário num canvas pequeno (para a galeria) */
export function drawSceneThumb(
  canvas: HTMLCanvasElement,
  sceneId: string,
): void {
  const maker = SCENE_MAKERS.find((s) => s.id === sceneId);
  if (!maker) return;
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d")!;
  maker.make(ctx, w, h);
}
