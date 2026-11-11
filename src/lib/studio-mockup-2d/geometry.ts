/**
 * Studio Click Mockup 2D — geometria da caneca (port do Wrap V2).
 * Geometria calibrada da parte EXTERNA do cilindro. A linha superior fica
 * alguns pixels ABAIXO da borda frontal de porcelana (nunca dentro da boca).
 * xLeft / xRight medidos por template impedem faixas brancas de uma máscara curta.
 */
import type { MugCalibration } from "./types";

export function mugLeft(m: MugCalibration): number {
  return m.xLeft ?? m.cx - m.R;
}

export function mugRight(m: MugCalibration): number {
  return m.xRight ?? m.cx + m.R;
}

/** x (px) -> t normalizado em [-1, 1]. */
export function mugT(m: MugCalibration, x: number): number {
  return ((x - mugLeft(m)) / (mugRight(m) - mugLeft(m))) * 2 - 1;
}

/** t normalizado em [-1, 1] -> x (px). */
export function mugX(m: MugCalibration, t: number): number {
  return mugLeft(m) + ((t + 1) * (mugRight(m) - mugLeft(m))) / 2;
}

/** Borda superior elíptica (px), com o deslocamento do lábio. */
export function topY(m: MugCalibration, t: number): number {
  return m.topC + m.topRy * Math.sqrt(Math.max(0, 1 - t * t)) + (m.lip ?? 5);
}

/** Borda inferior elíptica (px), com o deslocamento do pé. */
export function botY(m: MugCalibration, t: number): number {
  return m.botC + m.botRy * Math.sqrt(Math.max(0, 1 - t * t)) - (m.foot ?? 1.5);
}

/** Contorno fechado do corpo da caneca (96 segmentos por borda). */
export function bodyPath(ctx: CanvasRenderingContext2D, m: MugCalibration, s: number): void {
  const N = 96;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const t = -1 + (2 * i) / N;
    const x = mugX(m, t) * s;
    const y = topY(m, t) * s;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  for (let i = 0; i <= N; i++) {
    const t = 1 - (2 * i) / N;
    const x = mugX(m, t) * s;
    const y = botY(m, t) * s;
    ctx.lineTo(x, y);
  }
  ctx.closePath();
}
