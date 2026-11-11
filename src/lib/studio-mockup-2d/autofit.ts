/**
 * Studio Click Mockup 2D — ajuste automático da arte (aspect-fit).
 * Centraliza e dimensiona a arte na área de impressão da caneca,
 * respeitando a proporção real 21 x 9,5 cm, sem distorcer.
 * Matemática de encaixe (contain/cover) — ver pod-mockup-forge (MIT).
 *
 * A área de impressão visível da caneca:
 * - largura útil ~= arco visível do cilindro = visFrac * PI * R (em px de referência)
 * - altura útil = botC - topC (em px de referência)
 * O zoom do motor controla visFrac: visFrac = min(1, 0,613 * (100 / zoom)).
 * Então, para cobrir uma largura de arco A com a arte, zoom = 100 * 0,613 * PI * R / A.
 */
import type { MugCalibration } from "./types";
import { mugLeft, mugRight, topY, botY } from "./geometry";

/** Proporção real da arte de caneca: 21 x 9,5 cm. */
export const ART_ASPECT = 21 / 9.5;

export interface AutoFit {
  /** Zoom (%) para o ajuste. */
  zoom: number;
  /** Deslocamento horizontal (%) — 0 = centralizado. */
  offX: number;
  /** Deslocamento vertical (%) — 0 = centralizado. */
  offY: number;
  /** Modo usado. */
  mode: "contain" | "cover";
}

/**
 * Calcula o ajuste automático da arte para a caneca.
 * - contain: a arte inteira cabe na área (pode sobrar faixa nas laterais).
 * - cover: a arte cobre toda a área (pode cortar um pouco nas laterais).
 */
export function autoFitArt(
  m: MugCalibration,
  artWidth: number,
  artHeight: number,
  mode: "contain" | "cover" = "contain",
): AutoFit {
  const R = (mugRight(m) - mugLeft(m)) / 2;
  // Altura útil da área (no centro, onde a elipse é mais alta).
  const top = topY(m, 0);
  const bot = botY(m, 0);
  const areaH = Math.max(1, bot - top);
  // Largura do arco visível com zoom 100: visFrac = 0,613.
  // Arco visível = visFrac * PI * R.
  const arcAtZoom100 = 0.613 * Math.PI * R;
  const artAspect = artWidth / Math.max(1, artHeight);
  // Para a arte caber na área sem distorcer, comparamos as proporções.
  // A arte ocupa, no cilindro, uma largura de arco e uma altura.
  // zoom controla a largura do arco visível; offY controla o centro vertical.
  // Queremos: altura da arte projetada ~= areaH (contain) e arco coberto ~= artAspect * areaH.
  const targetArc = artAspect * areaH;
  let zoom: number;
  if (mode === "contain") {
    // O arco necessário não pode passar do arco máximo (zoom 60 -> visFrac 1, arco = PI*R).
    const arcNeeded = Math.min(targetArc, Math.PI * R);
    zoom = 100 * ((0.613 * Math.PI * R) / Math.max(1, arcNeeded));
    zoom = Math.max(60, Math.min(200, zoom));
  } else {
    // cover: garante que o arco cubra a largura da área visível.
    const arcNeeded = Math.max(targetArc, arcAtZoom100);
    zoom = 100 * ((0.613 * Math.PI * R) / Math.max(1, arcNeeded));
    zoom = Math.max(60, Math.min(200, zoom));
  }
  return { zoom: Math.round(zoom), offX: 0, offY: 0, mode };
}

/**
 * Encaixe rápido: centraliza a arte (zoom 100, offsets 0) — o padrão do motor.
 * Útil como "resetar encaixe" sem mudar os outros controles.
 */
export function resetFit(): AutoFit {
  return { zoom: 100, offX: 0, offY: 0, mode: "contain" };
}
