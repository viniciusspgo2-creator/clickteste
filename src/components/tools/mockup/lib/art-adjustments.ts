import type { ArtState } from "../state/store";

export const NEUTRAL_ADJUSTMENTS = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  sharpness: 0,
  opacity: 1,
};
const byte = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const adjustment = (v: number | undefined) => Number.isFinite(v) ? Math.max(-1, Math.min(1, v!)) : 0;
/** Work in source sRGB. Neutral values are an exact byte-preserving operation. */
export function adjustPixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  art: Partial<ArtState>,
) {
  const b = adjustment(art.brightness),
    c = adjustment(art.contrast),
    s = adjustment(art.saturation),
    v = adjustment(art.vibrance),
    t = adjustment(art.temperature);
  if (b || c || s || v || t)
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      let r = data[i],
        g = data[i + 1],
        bl = data[i + 2];
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
      const chroma = (Math.max(r, g, bl) - Math.min(r, g, bl)) / 255;
      const sat = 1 + s + v * (1 - chroma);
      r = (l + (r - l) * sat - 127.5) * (1 + c) + 127.5 + b * 100 + t * 24;
      g = (l + (g - l) * sat - 127.5) * (1 + c) + 127.5 + b * 100;
      bl = (l + (bl - l) * sat - 127.5) * (1 + c) + 127.5 + b * 100 - t * 24;
      data[i] = byte(r);
      data[i + 1] = byte(g);
      data[i + 2] = byte(bl);
    }
  const amount = Math.max(0, adjustment(art.sharpness));
  if (amount > 0) {
    const src = data.slice();
    for (let y = 1; y < height - 1; y++)
      for (let x = 1; x < width - 1; x++)
        for (let k = 0; k < 3; k++) {
          const pixel = (y * width + x) * 4;
          if (src[pixel + 3] === 0) continue;
          const i = pixel + k;
          // Transparent neighbors contain arbitrary RGB (often black). Weight
          // their contribution by coverage to avoid dark/white outlines on PNGs.
          let difference = 0;
          for (const offset of [-4, 4, -width * 4, width * 4])
            difference += (src[i] - src[i + offset]) * Math.min(src[pixel + 3], src[pixel + offset + 3]) / 255;
          data[i] = byte(
            src[i] + amount * difference,
          );
        }
  }
  return data;
}
