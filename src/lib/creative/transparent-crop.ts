/**
 * Trim the *transparent canvas margin* from a local Studio mockup before passing
 * it to the Editor. Only the image bounding rectangle changes: no pixels of
 * the ceramic, artwork, watermark or visible shadow are erased.
 * This module never uploads images and never touches admin storage.
 */
export type AlphaCrop = { x: number; y: number; width: number; height: number };

export function findVisibleAlphaBounds(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  opts: { alphaThreshold?: number; paddingFraction?: number } = {},
): AlphaCrop | null {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 ||
      width * height > 12_000_000 || rgba.length < width * height * 4) {
    throw new Error('Dimensões inválidas para recortar o mockup.');
  }
  const threshold = Number.isFinite(opts.alphaThreshold)
    ? Math.max(1, Math.min(255, Math.round(opts.alphaThreshold!))) : 2;
  const pad = Number.isFinite(opts.paddingFraction)
    ? Math.max(0, Math.min(0.1, opts.paddingFraction!)) : 0.025;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rgba[(y * width + x) * 4 + 3] < threshold) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX) return null;
  const margin = Math.ceil(Math.max(maxX - minX + 1, maxY - minY + 1) * pad);
  const left = Math.max(0, minX - margin);
  const top = Math.max(0, minY - margin);
  const right = Math.min(width, maxX + margin + 1);
  const bottom = Math.min(height, maxY + margin + 1);
  return { x: left, y: top, width: right - left, height: bottom - top };
}

export async function trimTransparentMockup(blob: Blob): Promise<{
  blob: Blob; cropped: boolean; width: number; height: number;
}> {
  if (blob.type && blob.type !== 'image/png') throw new Error('A transferência exige um PNG transparente.');
  let bitmap: ImageBitmap | null = null;
  let img: HTMLImageElement | null = null;
  let objectUrl: string | null = null;
  try {
    if (typeof createImageBitmap === 'function') {
      // Some Safari versions expose createImageBitmap but reject specific PNG
      // color profiles; fall back to a local image URL without uploading.
      try { bitmap = await createImageBitmap(blob); } catch { /* image URL fallback */ }
    }
    if (!bitmap) {
      objectUrl = URL.createObjectURL(blob);
      img = new Image();
      img.src = objectUrl;
      await img.decode();
    }
    const width = bitmap?.width ?? img!.naturalWidth;
    const height = bitmap?.height ?? img!.naturalHeight;
    if (width * height > 12_000_000) throw new Error('Mockup grande demais para recorte local.');
    const source = document.createElement('canvas');
    source.width = width; source.height = height;
    const sourceCtx = source.getContext('2d', { willReadFrequently: true });
    if (!sourceCtx) throw new Error('Canvas 2D indisponível neste navegador.');
    sourceCtx.drawImage((bitmap ?? img)!, 0, 0);
    const bounds = findVisibleAlphaBounds(sourceCtx.getImageData(0, 0, width, height).data, width, height);
    if (!bounds) throw new Error('O mockup exportado está completamente transparente.');
    if (bounds.width >= width * 0.95 && bounds.height >= height * 0.95) {
      return { blob, cropped: false, width, height };
    }
    const output = document.createElement('canvas');
    output.width = bounds.width; output.height = bounds.height;
    const ctx = output.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D indisponível neste navegador.');
    ctx.drawImage(source, bounds.x, bounds.y, bounds.width, bounds.height,
      0, 0, bounds.width, bounds.height);
    const result = await new Promise<Blob>((resolve, reject) => output.toBlob(
      value => value?.type === 'image/png' ? resolve(value) : reject(new Error('Falha ao preparar PNG do mockup.')),
      'image/png',
    ));
    return { blob: result, cropped: true, width: bounds.width, height: bounds.height };
  } finally {
    bitmap?.close();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}
