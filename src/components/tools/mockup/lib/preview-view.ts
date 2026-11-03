/** Navigation in an already-exported image. No scene, camera or export state. */
export interface PreviewSize { width: number; height: number }
export interface PreviewView { scale: number; x: number; y: number }

export const MIN_PREVIEW_SCALE = 0.01;
export const MAX_PREVIEW_SCALE = 8;
const PADDING = 24;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function constrainPreview(view: PreviewView, image: PreviewSize, area: PreviewSize): PreviewView {
  const scale = clamp(Number.isFinite(view.scale) ? view.scale : 1, MIN_PREVIEW_SCALE, MAX_PREVIEW_SCALE);
  const maxX = Math.max(0, (image.width * scale - Math.max(1, area.width - PADDING)) / 2);
  const maxY = Math.max(0, (image.height * scale - Math.max(1, area.height - PADDING)) / 2);
  return {
    scale,
    x: clamp(Number.isFinite(view.x) ? view.x : 0, -maxX, maxX),
    y: clamp(Number.isFinite(view.y) ? view.y : 0, -maxY, maxY),
  };
}

export function fitPreview(image: PreviewSize, area: PreviewSize): PreviewView {
  return constrainPreview({
    scale: Math.min(1, Math.max(1, area.width - PADDING) / image.width,
      Math.max(1, area.height - PADDING) / image.height),
    x: 0, y: 0,
  }, image, area);
}

/** Keep the same image pixel beneath the zoom anchor until an edge is reached. */
export function zoomPreview(view: PreviewView, scale: number, anchor: { x: number; y: number }, image: PreviewSize, area: PreviewSize): PreviewView {
  const next = clamp(Number.isFinite(scale) ? scale : view.scale, MIN_PREVIEW_SCALE, MAX_PREVIEW_SCALE);
  const ratio = next / view.scale;
  return constrainPreview({ scale: next, x: anchor.x - (anchor.x - view.x) * ratio,
    y: anchor.y - (anchor.y - view.y) * ratio }, image, area);
}
