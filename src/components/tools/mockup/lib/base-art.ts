import type { ArtState } from "../state/store";
export function baseArtTransform(art: Partial<ArtState>) {
  const value = (n: number | undefined, fallback: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(n) ? n! : fallback));
  return { scale: value(art.baseScale, 1, 0.1, 3), x: value(art.baseOffsetX, 0, -1, 1), y: value(art.baseOffsetY, 0, -1, 1) };
}

/** Uma volta completa sem invalidar ângulos negativos de projetos legados. */
export function normalizeBocaoAngle(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return ((value % 360) + 360) % 360;
}

/** Angles measured from the wheel centre; shared by mouse, pen and touch. */
export function bocaoPointerAngleDeg(x: number, y: number, centreX: number, centreY: number): number {
  return Math.atan2(y - centreY, x - centreX) * 180 / Math.PI;
}

/** Keeps the artwork aligned across the -180°/180° pointer boundary. */
export function bocaoDragRotation(startRotation: number, startAngle: number, nextAngle: number): number {
  return normalizeBocaoAngle(Math.round((startRotation + nextAngle - startAngle) * 10) / 10);
}
