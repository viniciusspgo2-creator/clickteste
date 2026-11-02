import type { MugState } from "../state/store";

export type CeramicFinish = Pick<MugState, "roughness" | "clearcoat" | "clearcoatRoughness" | "specularIntensity" | "reflection" | "glazeStrength">;
export const CERAMIC_FINISHES: { id: string; label: string; description: string; values: CeramicFinish }[] = [
  { id: "satin", label: "Acetinado", description: "Reflexo suave e espalhado", values: {
    roughness: 0.3, clearcoat: 0.55, clearcoatRoughness: 0.2, specularIntensity: 0.6, reflection: 0.5, glazeStrength: 0.65,
  } },
  { id: "sublimation", label: "Sublimação", description: "Verniz polido suave, com reflexos que preservam a leitura da estampa", values: {
    roughness: 0.085, clearcoat: 1, clearcoatRoughness: 0.075, specularIntensity: 0.85, reflection: 0.9, glazeStrength: 1,
  } },
  { id: "gloss", label: "Alto brilho", description: "Brilho destacado com reflexos mais nítidos", values: {
    roughness: 0.045, clearcoat: 1, clearcoatRoughness: 0.025, specularIntensity: 1, reflection: 1.4, glazeStrength: 2.2,
  } },
  { id: "glazed", label: "Vitrificado", description: "Esmalte bem polido com reflexos intensos", values: {
    roughness: 0.025, clearcoat: 1, clearcoatRoughness: 0.015, specularIntensity: 1, reflection: 2, glazeStrength: 3,
  } },
];

export const DEFAULT_CERAMIC_FINISH = CERAMIC_FINISHES[1].values;

/** Update the previous shipped preset only; custom finishes stay untouched. */
export function migrateCeramicFinish<T extends Partial<MugState>>(mug: T): T {
  const old = { roughness: 0.055, clearcoat: 1, clearcoatRoughness: 0.025,
    specularIntensity: 1, reflection: 1.25, glazeStrength: 1.45 };
  const matches = Object.entries(old).every(([key, value]) =>
    Math.abs((mug[key as keyof typeof old] ?? NaN) - value) < 0.00001);
  return matches ? { ...mug, ...DEFAULT_CERAMIC_FINISH } : mug;
}

export function ceramicFinishValues(mug: Partial<MugState>): CeramicFinish {
  return Object.fromEntries(Object.entries(CERAMIC_FINISHES[1].values)
    .map(([key, fallback]) => [key, mug[key as keyof CeramicFinish] ?? fallback])) as CeramicFinish;
}
