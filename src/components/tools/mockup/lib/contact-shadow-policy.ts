/**
 * Budget for contact-shadow depth passes. A resting product doesn't require
 * two continuously updated render targets. Poses and lighting are included in
 * the cache key so changing a control causes a fresh depth capture.
 *
 * This module is pure: easy to test without a WebGL context, and does not
 * change the user's saved camera, light or ceramic settings.
 */
export type ShadowPiece = {
  id?: string;
  hidden?: boolean;
  model?: string;
  handleStyle?: string;
  posX?: number;
  posY?: number;
  posZ?: number;
  scale?: number;
  rotationY?: number;
  tiltX?: number;
  tiltZ?: number;
};

export type ShadowLight = {
  preset?: string;
  rotation?: number;
  intensity?: number;
  temperature?: number;
  envIntensity?: number;
  hdriId?: string | null;
  keyStrength?: number;
  fillStrength?: number;
  rimStrength?: number;
  softness?: number;
  shadowOpacity?: number;
  shadowShiftX?: number;
  shadowShiftZ?: number;
  shadowSpread?: number;
  shadowColor?: string;
};

const numberKey = (value: number | undefined): string =>
  Number.isFinite(value) ? Number(value).toFixed(3) : "0";

const pieceKey = (piece: ShadowPiece) => [
  piece.id ?? "hero", piece.hidden ? "hidden" : "shown",
  piece.model ?? "classic", piece.handleStyle ?? "classic",
  numberKey(piece.posX), numberKey(piece.posY), numberKey(piece.posZ),
  numberKey(piece.scale ?? 1), numberKey(piece.rotationY),
  numberKey(piece.tiltX), numberKey(piece.tiltZ),
].join("/");

/** Stable, bounded key: no uploads, artwork, base64 or user text are included. */
export function contactShadowSceneKey(
  hero: ShadowPiece,
  companions: ShadowPiece[],
  light: ShadowLight,
  floor: string,
): string {
  const lightKey = [
    light.preset ?? "default", light.hdriId ?? "studio", numberKey(light.rotation),
    numberKey(light.intensity), numberKey(light.temperature), numberKey(light.envIntensity),
    numberKey(light.keyStrength),
    numberKey(light.fillStrength), numberKey(light.rimStrength),
    numberKey(light.softness), numberKey(light.shadowOpacity),
    numberKey(light.shadowShiftX), numberKey(light.shadowShiftZ),
    numberKey(light.shadowSpread ?? 1), light.shadowColor ?? "#242424",
  ].join("/");
  return [floor, pieceKey(hero), ...companions.map(pieceKey), lightKey].join("|");
}

/**
 * Direct mug manipulation and automatic rotation need live shadows. Otherwise
 * zwei passes can be captured once and reused until a pose/light change.
 */
export function contactShadowRenderBudget(options: {
  autoRotate: boolean;
  tool: string;
  mobile: boolean;
}): { frames: number; resolution: number; dynamic: boolean } {
  const dynamic = options.autoRotate || ["move", "rotate", "scale"].includes(options.tool);
  return {
    frames: dynamic ? Infinity : 2,
    // While moving on a mobile GPU, favor responsiveness. Static scenes keep
    // the same quality as V5.1, but no longer repeat the expensive pass.
    resolution: dynamic ? (options.mobile ? 320 : 768) : (options.mobile ? 384 : 1024),
    dynamic,
  };
}
