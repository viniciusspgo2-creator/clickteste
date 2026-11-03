/* ============================================================
   Folha planificada para sublimação — a arte exatamente como
   deve ser impressa, no tamanho da área configurada no painel
   Arte (prensa 20,7×8,7 · altura cheia · forno 360° · personalizada),
   em DPI real com guias de corte opcionais. 100% client-side.
   ============================================================ */

import { resolvePrintArea, MODEL_METRICS, CIRC_CM } from "../lib/config";
import { drawArtIntoArea } from "../lib/art-canvas";
import { useMockupStore } from "../state/store";
import { ExportError } from "./frame-capture";
import { withPngDpi } from "./png-dpi";

export interface TemplateOpts {
  dpi: 300 | 600;
  guides: boolean;
}

export interface TemplateResult {
  blob: Blob;
  filename: string;
  width: number;
  height: number;
  widthCm: number;
  heightCm: number;
}

export async function exportTemplate(
  opts: TemplateOpts,
): Promise<TemplateResult> {
  const state = useMockupStore.getState();
  const id = state.selectedIds[0] ?? "hero";
  const companion = state.companions.find((c) => c.id === id);
  const art = id === "hero" ? state.art : (companion?.art ?? state.art);
  const model =
    id === "hero" ? state.mug.model : (companion?.model ?? state.mug.model);
  const metrics = MODEL_METRICS[model] ?? MODEL_METRICS.classic;
  if (!art.imageId) {
    throw new ExportError(
      "Envie uma arte antes de gerar a folha de sublimação.",
    );
  }

  const area = resolvePrintArea(art);
  const widthCm = (area.arcCm * metrics.circumference) / CIRC_CM;
  const heightCm = (area.heightCm * metrics.height) / 9.5;
  const pxPerCm = opts.dpi / 2.54;
  const artW = Math.round(widthCm * pxPerCm);
  const artH = Math.round(heightCm * pxPerCm);

  // margem para as guias (fora da área impressa)
  const marginPx = opts.guides ? Math.round(0.5 * pxPerCm) : 0;
  const W = artW + marginPx * 2;
  const H = artH + marginPx * 2;

  if (W * H > 100_000_000) {
    throw new ExportError(
      "Resolução muito grande para o navegador. Use 300 DPI.",
    );
  }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // papel branco
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // arte nas coordenadas reais de impressão — SEM cópias de wrap: a folha
  // plana é um documento físico de impressão, o que passar da área é cortado
  ctx.save();
  ctx.translate(marginPx, marginPx);
  ctx.beginPath();
  ctx.rect(0, 0, artW, artH);
  ctx.clip();
  drawArtIntoArea(ctx, artW, artH, art, 0);
  ctx.restore();

  if (opts.guides) {
    drawGuides(ctx, marginPx, marginPx, artW, artH, pxPerCm);
  }

  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new ExportError("Falha ao gerar a folha."))),
      "image/png",
    ),
  );

  const label =
    area.mode === "forno"
      ? "forno-360"
      : area.mode === "custom"
        ? "personalizada"
        : area.mode === "alta"
          ? "altura-cheia"
          : "papel-padrao";
  return {
    blob: await withPngDpi(blob, opts.dpi),
    filename: `folha-sublimacao-caneca-${label}-${opts.dpi}dpi-${Date.now()}.png`,
    width: W,
    height: H,
    widthCm,
    heightCm,
  };
}

/** guias de corte: cantoneiras + linha de margem de segurança */
function drawGuides(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  pxPerCm: number,
) {
  ctx.save();
  ctx.strokeStyle = "#e8703a";
  ctx.lineWidth = Math.max(2, Math.round(pxPerCm * 0.07));

  // cantoneiras em L
  const L = Math.round(0.9 * pxPerCm);
  const corners: [number, number, number, number][] = [
    [x, y, 1, 1], // topo esq: (lx, ly, dx, dy)
    [x + w, y, -1, 1],
    [x, y + h, 1, -1],
    [x + w, y + h, -1, -1],
  ];
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx + dx * L, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + dy * L);
    ctx.stroke();
  }

  // margem de segurança tracejada (0,3 cm para dentro)
  ctx.setLineDash([pxPerCm * 0.25, pxPerCm * 0.2]);
  ctx.strokeStyle = "rgba(232,112,58,0.55)";
  ctx.lineWidth = Math.max(1, Math.round(pxPerCm * 0.05));
  const inset = 0.3 * pxPerCm;
  ctx.strokeRect(x + inset, y + inset, w - inset * 2, h - inset * 2);
  ctx.setLineDash([]);

  // marcas centrais de alinhamento (topo/base)
  ctx.strokeStyle = "rgba(29,19,13,0.5)";
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y - pxPerCm * 0.35);
  ctx.lineTo(x + w / 2, y - pxPerCm * 0.05);
  ctx.moveTo(x + w / 2, y + h + pxPerCm * 0.05);
  ctx.lineTo(x + w / 2, y + h + pxPerCm * 0.35);
  ctx.stroke();

  // etiqueta
  const cmW = (w / pxPerCm).toFixed(1).replace(".", ",");
  const cmH = (h / pxPerCm).toFixed(1).replace(".", ",");
  ctx.fillStyle = "rgba(29,19,13,0.65)";
  ctx.font = `600 ${Math.round(pxPerCm * 0.32)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(
    `Área de impressão: ${cmW} × ${cmH} cm · Click & Gruda Mockup Studio`,
    x,
    y + h + pxPerCm * 0.12,
  );
  ctx.restore();
}
