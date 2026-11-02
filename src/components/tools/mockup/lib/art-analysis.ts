/** Small, local measurements. This is a fitting aid, never an AI restoration. */
export interface ArtAnalysis {
  empty: boolean;
  transparent: boolean;
  coverage: number;
  luminance: number;
  contrast: number;
  saturation: number;
  paleRatio: number;
  bounds: { x: number; y: number; width: number; height: number };
  profile: "empty" | "light" | "dark" | "colorful" | "balanced";
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** Alpha-weighted statistics: invisible RGB never influences recommendations. */
export function analyzeArtPixels(data: Uint8ClampedArray, width: number, height: number): ArtAnalysis {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || data.length !== width * height * 4)
    throw new Error("Amostra de imagem inválida.");
  let weight = 0, light = 0, squared = 0, saturation = 0, pale = 0;
  let left = width, top = height, right = -1, bottom = -1, translucent = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4, alpha = data[i + 3] / 255;
    if (alpha < 0.99) translucent++;
    if (alpha <= 0.025) continue;
    left = Math.min(left, x); right = Math.max(right, x);
    top = Math.min(top, y); bottom = Math.max(bottom, y);
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const l = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const s = max > 0 ? (max - min) / max : 0;
    weight += alpha; light += l * alpha; squared += l * l * alpha; saturation += s * alpha;
    if (l > 0.82 && s < 0.3) pale += alpha;
  }
  const empty = weight < 0.01;
  const luminance = empty ? 0 : light / weight;
  const contrast = empty ? 0 : Math.sqrt(Math.max(0, squared / weight - luminance * luminance));
  const sat = empty ? 0 : saturation / weight;
  const paleRatio = empty ? 0 : pale / weight;
  return {
    empty, transparent: translucent / (width * height) > 0.01,
    coverage: weight / (width * height), luminance, contrast, saturation: sat, paleRatio,
    bounds: empty ? { x: 0, y: 0, width: 1, height: 1 } : {
      x: left / width, y: top / height, width: (right - left + 1) / width, height: (bottom - top + 1) / height,
    },
    profile: empty ? "empty" : luminance > 0.76 || paleRatio > 0.6 ? "light" : luminance < 0.26 ? "dark" : sat > 0.45 ? "colorful" : "balanced",
  };
}

export function sampleArt(source: CanvasImageSource, width: number, height: number): ArtAnalysis | null {
  if (typeof document === "undefined") return null;
  try {
    const ratio = Math.min(1, 128 / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    return analyzeArtPixels(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
  } catch { return null; }
}

export interface ArtLayoutSuggestion {
  fit: "cover" | "contain";
  scale: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  repeat: number;
  mirror: boolean;
}

/** Cover only when a full background already matches the print proportions. */
export function suggestArtLayout(width: number, height: number, targetRatio: number, analysis?: ArtAnalysis | null): ArtLayoutSuggestion {
  const imageRatio = Math.max(1, width) / Math.max(1, height);
  const mismatch = Math.abs(Math.log(imageRatio / Math.max(0.01, targetRatio)));
  const fit = !analysis?.transparent && !analysis?.empty && mismatch < 0.1 ? "cover" : "contain";
  if (analysis?.transparent && !analysis.empty) {
    const bounds = analysis.bounds;
    const ratio = Math.max(0.01, targetRatio);
    const baseHeight = Math.min(ratio / imageRatio, 1);
    const baseWidth = baseHeight * imageRatio;
    // Center the visible alpha content instead of the transparent file margins.
    // A small safety margin protects anti-aliased edges lost in the sample.
    const scale = clamp(Math.min(ratio / (baseWidth * bounds.width), 1 / (baseHeight * bounds.height)) * 0.94, 0.1, 3);
    const x = bounds.x + bounds.width / 2 - 0.5;
    const y = bounds.y + bounds.height / 2 - 0.5;
    return { fit: "contain", scale,
      offsetX: clamp(-baseWidth * scale * x / ratio, -1, 1),
      offsetY: clamp(-baseHeight * scale * y * 2, -1, 1),
      rotation: 0, repeat: 1, mirror: false };
  }
  return { fit, scale: 1, offsetX: 0, offsetY: 0, rotation: 0, repeat: 1, mirror: false };
}

/** Conservative optional grading: no sharpening, opacity or white-balance guesses. */
export function suggestArtTone(analysis: ArtAnalysis) {
  const dark = analysis.profile === "dark";
  return {
    brightness: dark ? 0.04 : 0,
    contrast: analysis.profile === "light" || analysis.empty ? 0 : clamp((0.16 - analysis.contrast) * 0.35, 0, 0.045),
    saturation: 0,
    vibrance: analysis.profile === "colorful" || analysis.profile === "light" || analysis.empty ? 0 : 0.025,
    temperature: 0,
    sharpness: 0,
    opacity: 1,
  };
}
