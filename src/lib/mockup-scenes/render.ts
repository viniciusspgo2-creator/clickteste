import type {
  Artwork,
  ArtPlacement,
  Piece,
  SceneDocument,
  SceneModel,
  Surface,
} from "./types";
import { sceneSize } from "./types";

const images = new Map<string, Promise<HTMLImageElement>>();
const imageBytes = new Map<string, number>();
const rasters = new Map<string, HTMLCanvasElement>();
const artIds = new Map<string, number>();
export function loadImage(src: string): Promise<HTMLImageElement> {
  const old = images.get(src);
  if (old) return old;
  const next = new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.decoding = "async";
    im.onload = () => {
      if (images.has(src)) imageBytes.set(src, im.width * im.height * 4);
      let bytes = [...imageBytes.values()].reduce((sum, n) => sum + n, 0);
      while (bytes > 128 * 1024 * 1024 && images.size > 1) {
        const oldest = images.keys().next().value!;
        bytes -= imageBytes.get(oldest) ?? 0;
        images.delete(oldest);
        imageBytes.delete(oldest);
      }
      resolve(im);
    };
    im.onerror = () => {
      images.delete(src);
      imageBytes.delete(src);
      reject(
        new Error(
          "Uma imagem não pôde ser carregada. Confira o cenário, a arte e o modelo.",
        ),
      );
    };
    im.src = src;
  });
  if (images.size >= 20) {
    const oldest = images.keys().next().value!;
    images.delete(oldest);
    imageBytes.delete(oldest);
  }
  images.set(src, next);
  return next;
}
const canvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};
const context = (c: HTMLCanvasElement) => {
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx)
    throw new Error("Seu navegador não disponibilizou o editor de imagens.");
  return ctx;
};

export async function readArtwork(file: File): Promise<Artwork> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 12 * 1024 * 1024
  )
    throw new Error("Envie PNG, JPEG ou WebP de até 12 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    if (
      !image.width ||
      !image.height ||
      image.width * image.height > 36_000_000
    )
      throw new Error("A imagem deve ter até 36 megapixels.");
    const scale = Math.min(1, 6000 / Math.max(image.width, image.height));
    const c = canvas(
      Math.round(image.width * scale),
      Math.round(image.height * scale),
    );
    context(c).drawImage(image, 0, 0, c.width, c.height);
    return {
      src: c.toDataURL(
        file.type === "image/jpeg" ? "image/jpeg" : "image/png",
        0.97,
      ),
      name: file.name,
      width: c.width,
      height: c.height,
    };
  } finally {
    images.delete(url);
    imageBytes.delete(url);
    URL.revokeObjectURL(url);
  }
}

/** Artwork is fitted by its real aspect ratio, never stretched to the mug. */
function flatArtwork(
  image: HTMLImageElement,
  p: ArtPlacement,
  ratio: number,
  pixels: number,
) {
  const desired = Math.max(1600, Math.min(4096, Math.ceil(pixels * 1.3)));
  const shrink = Math.min(1, 4096 / (desired / ratio));
  const w = Math.max(1, Math.round(desired * shrink)),
    h = Math.max(1, Math.round(w / ratio)),
    c = canvas(w, h),
    ctx = context(c);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  const scale =
    (p.fit === "contain"
      ? Math.min(w / image.width, h / image.height)
      : Math.max(w / image.width, h / image.height)) * p.zoom;
  const dw = image.width * scale,
    dh = image.height * scale;
  ctx.drawImage(image, (w - dw) / 2 + p.x * w, (h - dh) / 2 + p.y * h, dw, dh);
  return c;
}

export function surfacePoint(
  s: Surface,
  u: number,
  v: number,
): [number, number] {
  const topX = s.topLeft[0] + (s.topRight[0] - s.topLeft[0]) * u;
  const botX = s.bottomLeft[0] + (s.bottomRight[0] - s.bottomLeft[0]) * u;
  const topY = s.topLeft[1] + (s.topRight[1] - s.topLeft[1]) * u;
  const botY = s.bottomLeft[1] + (s.bottomRight[1] - s.bottomLeft[1]) * u;
  // Equal increments in angle are compressed at the silhouette of a cylinder.
  const angle = (u - 0.5) * Math.PI * 0.86;
  const curved = 0.5 + Math.sin(angle) / (2 * Math.sin(Math.PI * 0.43));
  return [
    topX +
      (botX - topX) * v +
      (curved - u) *
        ((s.topRight[0] - s.topLeft[0]) * (1 - v) +
          (s.bottomRight[0] - s.bottomLeft[0]) * v),
    topY + (botY - topY) * v + Math.sin(u * Math.PI) * s.curvature,
  ];
}

/** Piece-local raster. The baked UV map includes true perspective and curvature. */
export async function renderPiece(
  piece: Piece,
  model: SceneModel,
  pixels: number,
): Promise<HTMLCanvasElement> {
  if (
    model.preview &&
    pixels <= model.preview.width &&
    model.mapping.kind === "uv"
  ) {
    model = {
      ...model,
      imageUrl: model.preview.imageUrl,
      width: model.preview.width,
      height: model.preview.height,
      mapping: {
        ...model.mapping,
        uvUrl: model.preview.uvUrl,
        glossUrl: model.preview.glossUrl,
      },
    };
  }
  const size = Math.max(64, Math.min(model.width, Math.ceil(pixels / 64) * 64));
  let artId = 0;
  if (piece.art) {
    artId = artIds.get(piece.art.src) ?? artIds.size + 1;
    artIds.set(piece.art.src, artId);
  }
  const key = JSON.stringify([
    model.id,
    model.imageUrl,
    model.mapping,
    piece.placement,
    artId,
    size,
  ]);
  const cached = rasters.get(key);
  if (cached) return cached;
  const [base, art] = await Promise.all([
    loadImage(model.imageUrl),
    piece.art ? loadImage(piece.art.src) : null,
  ]);
  const c = canvas(size, Math.round((size * model.height) / model.width)),
    ctx = context(c);
  ctx.drawImage(base, 0, 0, c.width, c.height);
  if (art) {
    const arc = piece.placement.mode === "wrap" ? 0.82 : 0.43;
    const flat = flatArtwork(
      art,
      piece.placement,
      model.mapping.kind === "uv"
        ? (arc * 25.76) / 9.55
        : surfaceAspect(model.mapping.surface, model.width, model.height) *
            (piece.placement.mode === "wrap" ? 1.9 : 1),
      size,
    );
    const a = context(flat).getImageData(0, 0, flat.width, flat.height).data;
    const original = ctx.getImageData(0, 0, c.width, c.height),
      data = original.data;
    if (model.mapping.kind === "uv") {
      const uvImage = await loadImage(model.mapping.uvUrl),
        uvCanvas = canvas(c.width, c.height),
        uc = context(uvCanvas);
      uc.imageSmoothingEnabled = false;
      uc.drawImage(uvImage, 0, 0, c.width, c.height);
      const uv = uc.getImageData(0, 0, c.width, c.height).data;
      let gloss: Uint8ClampedArray | undefined;
      if (model.mapping.glossUrl) {
        const im = await loadImage(model.mapping.glossUrl);
        uc.imageSmoothingEnabled = true;
        uc.clearRect(0, 0, c.width, c.height);
        uc.drawImage(im, 0, 0, c.width, c.height);
        gloss = uc.getImageData(0, 0, c.width, c.height).data;
      }
      for (let i = 0; i < data.length; i += 4) {
        if (uv[i + 3] < 250 || data[i + 3] < 1) continue;
        const rawU = (uv[i] * 16 + (uv[i + 2] >> 4)) / 4095;
        const rawV = (uv[i + 1] * 16 + (uv[i + 2] & 15)) / 4095;
        const du = ((rawU - model.mapping.uCenter + 1.5) % 1) - 0.5;
        const u = du / arc + 0.5,
          v = 1 - rawV;
        if (u < 0 || u > 1 || v < 0 || v > 1) continue;
        sampleAndShade(data, i, a, flat.width, flat.height, u, v, gloss);
      }
      ctx.putImageData(original, 0, 0);
    } else {
      // Invert a prepared cylindrical surface through a dense, triangulated map.
      // Rasterizing barycentric UV coordinates avoids cracks between canvas triangles.
      const surface = model.mapping.surface;
      const uv = new Float32Array(c.width * c.height * 2).fill(-1);
      const cols = 64,
        rows = 20;
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          const u = x / cols,
            v = y / rows,
            u1 = (x + 1) / cols,
            v1 = (y + 1) / rows;
          const p00 = surfacePoint(surface, u, v),
            p10 = surfacePoint(surface, u1, v),
            p01 = surfacePoint(surface, u, v1),
            p11 = surfacePoint(surface, u1, v1);
          rasterTriangle(
            uv,
            c.width,
            c.height,
            [p00, p10, p11],
            [
              [u, v],
              [u1, v],
              [u1, v1],
            ],
          );
          rasterTriangle(
            uv,
            c.width,
            c.height,
            [p00, p11, p01],
            [
              [u, v],
              [u1, v1],
              [u, v1],
            ],
          );
        }
      for (let i = 0; i < data.length; i += 4) {
        const j = i / 2;
        if (uv[j] < 0 || data[i + 3] < 1) continue;
        sampleAndShade(
          data,
          i,
          a,
          flat.width,
          flat.height,
          (uv[j] - 0.5) * (piece.placement.mode === "wrap" ? 0.52 : 1) + 0.5,
          uv[j + 1],
        );
      }
      ctx.putImageData(original, 0, 0);
    }
  }
  let cachedPixels = [...rasters.values()].reduce(
    (sum, c) => sum + c.width * c.height,
    0,
  );
  while (
    rasters.size &&
    (rasters.size >= 8 || cachedPixels + c.width * c.height > 32_000_000)
  ) {
    const oldest = rasters.keys().next().value!;
    const old = rasters.get(oldest)!;
    cachedPixels -= old.width * old.height;
    rasters.delete(oldest);
  }
  rasters.set(key, c);
  return c;
}
export function surfaceAspect(s: Surface, width: number, height: number) {
  const distance = (a: [number, number], b: [number, number]) =>
    Math.hypot((a[0] - b[0]) * width, (a[1] - b[1]) * height);
  const w =
    (distance(s.topLeft, s.topRight) + distance(s.bottomLeft, s.bottomRight)) /
    2;
  const h =
    (distance(s.topLeft, s.bottomLeft) + distance(s.topRight, s.bottomRight)) /
    2;
  return Math.max(
    0.1,
    (w / Math.max(h, 1)) * ((Math.PI * 0.43) / Math.sin(Math.PI * 0.43)),
  );
}
function sampleAndShade(
  out: Uint8ClampedArray,
  i: number,
  a: Uint8ClampedArray,
  w: number,
  h: number,
  u: number,
  v: number,
  gloss?: Uint8ClampedArray,
) {
  const x = Math.max(0, Math.min(w - 1, u * (w - 1))),
    y = Math.max(0, Math.min(h - 1, v * (h - 1)));
  const x0 = Math.floor(x),
    y0 = Math.floor(y),
    fx = x - x0,
    fy = y - y0;
  for (let k = 0; k < 3; k++) {
    const tl = a[(y0 * w + x0) * 4 + k],
      tr = a[(y0 * w + Math.min(x0 + 1, w - 1)) * 4 + k],
      bl = a[(Math.min(y0 + 1, h - 1) * w + x0) * 4 + k],
      br = a[(Math.min(y0 + 1, h - 1) * w + Math.min(x0 + 1, w - 1)) * 4 + k];
    const pigment =
      (tl * (1 - fx) + tr * fx) * (1 - fy) + (bl * (1 - fx) + br * fx) * fy;
    // Preserve the photographic luminance of the ceramic, including its shadows.
    out[i + k] =
      (pigment * out[i + k]) / 255 +
      (gloss ? gloss[i + k] * (1 - pigment / 255) : 0);
  }
}
function rasterTriangle(
  map: Float32Array,
  w: number,
  h: number,
  ps: [number, number][],
  uvs: [number, number][],
) {
  const [a, b, c] = ps.map(([x, y]) => [x * w, y * h]);
  const denom = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
  if (Math.abs(denom) < 1e-7) return;
  const minX = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]))),
    maxX = Math.min(w - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
  const minY = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]))),
    maxY = Math.min(h - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
  for (let y = minY; y <= maxY; y++)
    for (let x = minX; x <= maxX; x++) {
      const l =
        ((b[1] - c[1]) * (x + 0.5 - c[0]) + (c[0] - b[0]) * (y + 0.5 - c[1])) /
        denom;
      const m =
          ((c[1] - a[1]) * (x + 0.5 - c[0]) +
            (a[0] - c[0]) * (y + 0.5 - c[1])) /
          denom,
        n = 1 - l - m;
      if (l < -0.001 || m < -0.001 || n < -0.001) continue;
      const i = (y * w + x) * 2;
      map[i] = l * uvs[0][0] + m * uvs[1][0] + n * uvs[2][0];
      map[i + 1] = l * uvs[0][1] + m * uvs[1][1] + n * uvs[2][1];
    }
}

export function pieceBounds(
  piece: Piece,
  model: SceneModel,
  w: number,
  h: number,
) {
  const width = piece.width * w,
    height = (width * model.height) / model.width;
  return {
    x: piece.x * w - width / 2,
    y: piece.y * h - height / 2,
    width,
    height,
  };
}
export async function renderScene(
  doc: SceneDocument,
  models: SceneModel[],
  edge: number,
  transparent = false,
) {
  const { width, height } = sceneSize(doc.aspect, edge),
    out = canvas(width, height),
    ctx = context(out);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (!transparent) {
    ctx.fillStyle = doc.background.color;
    ctx.fillRect(0, 0, width, height);
    if (doc.background.src) {
      const im = await loadImage(doc.background.src),
        s =
          doc.background.fit === "cover"
            ? Math.max(width / im.width, height / im.height)
            : Math.min(width / im.width, height / im.height);
      const dw = im.width * s,
        dh = im.height * s;
      ctx.drawImage(
        im,
        (width - dw) * doc.background.x,
        (height - dh) * doc.background.y,
        dw,
        dh,
      );
    }
  }
  for (const p of doc.pieces) {
    if (p.hidden) continue;
    const model = models.find((m) => m.id === p.modelId);
    if (!model)
      throw new Error("Um modelo desta composição não está mais disponível.");
    const b = pieceBounds(p, model, width, height),
      raster = await renderPiece(p, model, b.width);
    if (p.shadow > 0) {
      ctx.save();
      ctx.filter = `blur(${Math.max(2, width * 0.009)}px)`;
      ctx.fillStyle = `rgba(30,24,19,${p.shadow * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(
        p.x * width,
        p.y * height + b.height * 0.405,
        b.width * 0.29,
        b.height * 0.025,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();
    }
    ctx.drawImage(raster, b.x, b.y, b.width, b.height);
  }
  if (doc.logo) {
    const l = doc.logo,
      im = await loadImage(l.image.src),
      w = l.width * width,
      h = (w * im.height) / im.width;
    ctx.globalAlpha = l.opacity;
    ctx.drawImage(im, l.x * width - w / 2, l.y * height - h / 2, w, h);
    ctx.globalAlpha = 1;
  }
  return out;
}

export async function exportScene(
  doc: SceneDocument,
  models: SceneModel[],
  edge: number,
  format: "png" | "jpeg",
  transparent: boolean,
) {
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  const out = await renderScene(
    doc,
    models,
    edge,
    transparent && format === "png",
  );
  const blob = await new Promise<Blob>((resolve, reject) =>
    out.toBlob(
      (b) =>
        b
          ? resolve(b)
          : reject(
              new Error(
                "Não foi possível preparar o arquivo. Tente uma resolução menor.",
              ),
            ),
      `image/${format}`,
      0.97,
    ),
  );
  return {
    blob,
    width: out.width,
    height: out.height,
    filename: `mockup-cenarios-${out.width}x${out.height}.${format === "jpeg" ? "jpg" : "png"}`,
  };
}
