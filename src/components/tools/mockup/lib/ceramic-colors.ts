import type { MugState } from "../state/store";

export type CeramicPart = "all" | "body" | "handle" | "interior";
export const CERAMIC_PARTS = [
  {
    id: "all",
    label: "Caneca inteira",
    colorLabel: "Cor da caneca inteira",
    name: "Caneca",
  },
  {
    id: "body",
    label: "Só o corpo",
    colorLabel: "Cor do corpo",
    name: "Corpo",
  },
  { id: "handle", label: "Só a alça", colorLabel: "Cor da alça", name: "Alça" },
  {
    id: "interior",
    label: "Só o interior",
    colorLabel: "Cor do interior",
    name: "Interior",
  },
] as const;

export type HSV = { h: number; s: number; v: number };
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
export function normalizeHexColor(value: string): string | null {
  const text = value.trim();
  return /^#?[\da-f]{6}$/i.test(text)
    ? "#" + text.replace(/^#/, "").toLowerCase()
    : null;
}
export function hexToHsv(value: string, previousHue = 0): HSV {
  const hex = normalizeHexColor(value) ?? "#ffffff";
  const [r, g, b] = [1, 3, 5].map(
    (i) => parseInt(hex.slice(i, i + 2), 16) / 255,
  );
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    delta = max - min;
  let h = previousHue;
  if (delta > 0) {
    h =
      max === r
        ? 60 * (((g - b) / delta) % 6)
        : max === g
          ? 60 * ((b - r) / delta + 2)
          : 60 * ((r - g) / delta + 4);
    h = (h + 360) % 360;
  }
  return { h, s: max === 0 ? 0 : delta / max, v: max };
}
export function hsvToHex({ h, s, v }: HSV): string {
  const hue = ((clamp(h, 0, 360) % 360) + 360) % 360,
    sat = clamp(s, 0, 1),
    val = clamp(v, 0, 1);
  const c = val * sat,
    x = c * (1 - Math.abs(((hue / 60) % 2) - 1)),
    m = val - c;
  const channels =
    hue < 60
      ? [c, x, 0]
      : hue < 120
        ? [x, c, 0]
        : hue < 180
          ? [0, c, x]
          : hue < 240
            ? [0, x, c]
            : hue < 300
              ? [x, 0, c]
              : [c, 0, x];
  return (
    "#" +
    channels
      .map((n) =>
        Math.round((n + m) * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

/** Independent part changes never replace the uploaded art or another color. */
export function ceramicColorPatch(
  part: CeramicPart,
  value: string,
): Partial<MugState> {
  const hex = normalizeHexColor(value);
  if (!hex) return {};
  if (part === "body") return { bodyColor: hex };
  if (part === "handle") return { handleColor: hex };
  if (part === "interior") return { interiorColor: hex };
  return {
    variant: hex === "#ffffff" ? "white" : "accent",
    bodyColor: hex,
    handleColor: hex,
    interiorColor: hex,
    baseColor: hex,
    accentColor: hex,
  };
}
