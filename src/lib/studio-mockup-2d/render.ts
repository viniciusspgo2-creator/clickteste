/**
 * Studio Click Mockup 2D — composição em camadas (port do Wrap V2).
 * Ordem das camadas por caneca (com clip no corpo da caneca):
 * 1. tinta (drawWarped, source-over, opacidade)
 * 2. mapa de luminosidade (multiply, alpha shade)
 * 3. mapa especular (screen, alpha light)
 * 4. gradiente RGB ambiente nas bordas (soft-light, alpha light*0.25)
 * 5. grão da porcelana (overlay, alpha 0.05)
 * Máscaras (debug): contorno + nome da caneca.
 */
import type { ArtPixels, MockupTemplate, RenderState, SceneMaps } from "./types";
import { bodyPath, mugLeft, mugRight } from "./geometry";
import { drawWarped } from "./warp";

export function renderMockup(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  template: MockupTemplate,
  baseImg: HTMLImageElement,
  artPixels: ArtPixels | null,
  maps: SceneMaps,
  state: RenderState,
): void {
  // O fator de escala usa o espaço de referência DESTE template (2048x1152
  // nas cenas gamer, 1080x1350 nas retrato). O canvas tem a mesma proporção
  // do espaço de referência, então um único fator serve aos dois eixos.
  const s = W / template.refW;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(baseImg, 0, 0, W, H);
  if (artPixels && !state.compare) {
    const sp = state.splitPoint / 100;
    for (const m of template.mugs) {
      if (!state.use[m.id - 1]) continue;
      let visFrac = Math.min(1, 0.613 * (100 / state.zoom));
      let uCenter: number;
      let segStart = 0;
      let segEnd = 1;
      if (state.split) {
        segStart = m.id === 1 ? 0 : sp;
        segEnd = m.id === 1 ? sp : 1;
        // Mantém cada caneca na sua porção, sem repetir faixa da outra.
        // Modulação da estampa é curva, sem achatamento ao longo da largura.
        const segmentSpan = segEnd - segStart;
        visFrac = Math.min(visFrac, segmentSpan * 0.97);
        uCenter = (segStart + segEnd) * 0.5 + (state.offX / 100) * segmentSpan * 0.45;
      } else {
        uCenter = 0.5 + state.offX / 100;
      }
      ctx.save();
      bodyPath(ctx, m, s);
      ctx.clip();
      /* CAMADA 1 — tinta acompanha todo o cilindro, preservando lábio superior. */
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = state.opacity / 100;
      drawWarped(ctx, m, s, uCenter, visFrac, artPixels, state, segStart, segEnd);
      ctx.globalAlpha = 1;
      if (maps.ready) {
        // Realismo: intensidade com que a arte herda a luz da foto.
        const realism = state.realismo / 100;
        /* CAMADA 2 — mapa de luminosidade da foto original (sombreamento natural, normalizado). */
        if (maps.lumMap) {
          ctx.globalCompositeOperation = "multiply";
          ctx.globalAlpha = (state.shade / 100) * realism;
          ctx.drawImage(maps.lumMap, 0, 0, W, H);
          ctx.globalAlpha = 1;
        }
        const gl = (state.light / 100) * realism;
        if (gl > 0) {
          /* CAMADA 3 — mapa especular da foto original (reflexos naturais da porcelana, por cima da estampa). */
          if (maps.specMap) {
            ctx.globalCompositeOperation = "screen";
            ctx.globalAlpha = gl;
            ctx.drawImage(maps.specMap, 0, 0, W, H);
            ctx.globalAlpha = 1;
          }
          /* CAMADA 4 — RGB ambiente nas bordas (cores reais da foto, discreto). */
          const ec = maps.edgeColors[m.id - 1];
          if (ec) {
            const bx0 = mugLeft(m) * s;
            const bx1 = mugRight(m) * s;
            ctx.globalCompositeOperation = "soft-light";
            const rgb = ctx.createLinearGradient(bx0, 0, bx1, 0);
            rgb.addColorStop(0, "rgba(" + ec.left.join(",") + "," + (gl * 0.25).toFixed(3) + ")");
            rgb.addColorStop(1, "rgba(" + ec.right.join(",") + "," + (gl * 0.25).toFixed(3) + ")");
            ctx.fillStyle = rgb;
            ctx.fillRect(bx0, (m.topC - 40) * s, bx1 - bx0, (m.botC + 40 - m.topC + 40) * s);
          }
          /* CAMADA 5 — textura sutil da porcelana (grão). */
          if (maps.grainPattern) {
            ctx.globalCompositeOperation = "overlay";
            ctx.globalAlpha = 0.05 * realism;
            ctx.fillStyle = maps.grainPattern;
            ctx.fillRect(
              mugLeft(m) * s,
              (m.topC - 40) * s,
              (mugRight(m) - mugLeft(m)) * s,
              (m.botC - m.topC + 80) * s,
            );
            ctx.globalAlpha = 1;
          }
        }
        /* CAMADA 6 — curva: queda de luz nas bordas do cilindro. */
        const curve = state.curva / 100;
        if (curve > 0) {
          const bx0 = mugLeft(m) * s;
          const bx1 = mugRight(m) * s;
          const falloff = ctx.createLinearGradient(bx0, 0, bx1, 0);
          const edgeAlpha = (0.35 * curve).toFixed(3);
          falloff.addColorStop(0, "rgba(0,0,0," + edgeAlpha + ")");
          falloff.addColorStop(0.25, "rgba(0,0,0,0)");
          falloff.addColorStop(0.75, "rgba(0,0,0,0)");
          falloff.addColorStop(1, "rgba(0,0,0," + edgeAlpha + ")");
          ctx.globalCompositeOperation = "multiply";
          ctx.globalAlpha = 1;
          ctx.fillStyle = falloff;
          ctx.fillRect(bx0, (m.topC - 40) * s, bx1 - bx0, (m.botC + 40 - m.topC + 40) * s);
        }
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
    }
  }
  if (state.showMasks) {
    for (const m of template.mugs) {
      ctx.save();
      bodyPath(ctx, m, s);
      ctx.strokeStyle = m.cor;
      ctx.lineWidth = Math.max(2, 2 * s);
      ctx.stroke();
      ctx.fillStyle = m.cor;
      ctx.font = "bold " + Math.round(22 * s) + "px system-ui, sans-serif";
      ctx.fillText(m.nome, mugLeft(m) * s + 6, (m.topC - 12) * s);
      ctx.restore();
    }
  }
}

/**
 * Renderiza o mockup num canvas offscreen e devolve o blob PNG.
 * É o mesmo render da prévia, sem diferença de geometria.
 */
export function exportMockupBlob(
  template: MockupTemplate,
  baseImg: HTMLImageElement,
  artPixels: ArtPixels | null,
  maps: SceneMaps,
  state: RenderState,
  W: number,
  H: number,
): Promise<Blob | null> {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const cx = c.getContext("2d");
  if (!cx) return Promise.resolve(null);
  cx.imageSmoothingEnabled = true;
  cx.imageSmoothingQuality = "high";
  const wasComparing = state.compare;
  const renderState = { ...state, compare: false };
  try {
    renderMockup(cx, W, H, template, baseImg, artPixels, maps, renderState);
  } finally {
    void wasComparing;
  }
  return new Promise((resolve) => {
    c.toBlob((b) => resolve(b), "image/png");
  });
}
