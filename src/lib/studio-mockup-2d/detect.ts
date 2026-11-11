/**
 * Studio Click Mockup 2D — detecção automática de área (v5, sem dependências).
 * Encontra o corpo da caneca numa foto de cena e sugere a calibração inicial.
 *
 * Método (leve, 100% no navegador, sem WASM):
 * 1. Reduz a cena para ~512 px de largura e calcula a luminância.
 * 2. Detecta bordas verticais fortes (gradiente horizontal de Sobel) — as
 *    laterais da caneca são as bordas verticais mais fortes e mais longas.
 * 3. Encontra o par de bordas verticais que forma o corpo da caneca e deriva
 *    xLeft, xRight, cx, R.
 * 4. Topo/base (v5): pela EXTENSÃO DAS BORDAS VERTICAIS das paredes — não
 *    por brilho (o fundo claro estendia a caneca até o pé da imagem).
 *    Trava de proporção altura/largura em [0,85, 1,45].
 * 5. Devolve também um score de confiança (0–1). Score baixo = pedir
 *    calibração manual.
 *
 * Upgrade previsto (ver REFERENCIAS-PESQUISA.md): OpenCV.js + jscanify
 * (Canny → contornos → approxPolyDP → quadrilátero), carregado sob demanda.
 * A interface desta função é a mesma — trocar a implementação interna não
 * muda quem chama.
 */
import type { MugCalibration } from "./types";
import { REF_W, REF_H } from "./types";
export interface DetectedArea {
  calibration: MugCalibration;
  /** Confiança da detecção (0–1). < 0,5 = confirmar manualmente. */
  confidence: number;
  /** Método usado. */
  method: "vertical-edges" | "luminance-blob" | "fallback";
}

/** Carrega uma imagem (URL ou File) num elemento Image. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível carregar a imagem da cena."));
    img.src = src;
  });
}

/**
 * Detecta a área da caneca numa imagem de cena.
 * Devolve a calibração em coordenadas do espaço de referência do template
 * (refW x refH; padrão 2048x1152 das cenas gamer). Para cenas retrato,
 * passe 1080 e 1350.
 */
export function detectMugArea(
  img: HTMLImageElement,
  mugId = 1,
  mugName = "Caneca 1",
  refW: number = REF_W,
  refH: number = REF_H,
): DetectedArea {
  const W = 512;
  const scale = W / img.naturalWidth;
  const H = Math.max(2, Math.round(img.naturalHeight * scale));
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true });
  if (!g) return fallbackArea(mugId, mugName, refW, refH);
  g.drawImage(img, 0, 0, W, H);
  const { data } = g.getImageData(0, 0, W, H);
  const lum = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    lum[i] = 0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2];
  }
  // Gradiente horizontal (Sobel simplificado): bordas verticais.
  const edge = new Float32Array(W * H);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const gx =
        -lum[i - W - 1] - 2 * lum[i - 1] - lum[i + W - 1] +
        lum[i - W + 1] + 2 * lum[i + 1] + lum[i + W + 1];
      edge[i] = Math.abs(gx);
    }
  }
  // Para cada coluna, soma a força de borda na faixa vertical central (onde a caneca está).
  const y0 = Math.floor(H * 0.15);
  const y1 = Math.floor(H * 0.85);
  const colStrength = new Float32Array(W);
  for (let x = 0; x < W; x++) {
    let s = 0;
    for (let y = y0; y < y1; y++) s += edge[y * W + x];
    colStrength[x] = s / (y1 - y0);
  }
  // As duas bordas verticais mais fortes, com separação mínima (a caneca tem largura).
  const minGap = Math.floor(W * 0.12);
  let left = -1;
  let right = -1;
  let best = -1;
  for (let a = 0; a < W - minGap; a++) {
    for (let b = a + minGap; b < W; b++) {
      const score = colStrength[a] + colStrength[b];
      if (score > best) {
        best = score;
        left = a;
        right = b;
      }
    }
  }
  const maxStrength = Math.max(...colStrength);
  const confidence = maxStrength > 0 ? Math.min(1, best / (2 * maxStrength)) : 0;
  if (left < 0 || right < 0 || confidence < 0.15) {
    return luminanceBlobFallback(img, lum, W, H, mugId, mugName, refW, refH);
  }
  // Topo/base (v5): pela EXTENSÃO DAS BORDAS VERTICAIS das paredes da
  // caneca — não por brilho. O fundo claro (mármore, prateleira) estendia
  // a "corrida clara" até o pé da imagem e deixava a caneca 2,5x mais
  // alta que larga. A parede lateral só existe na altura do corpo.
  const wallProfile = new Float32Array(H);
  for (let y = 0; y < H; y++) {
    let s = 0;
    let n = 0;
    for (const cc of [left, right]) {
      for (let dx = -2; dx <= 2; dx++) {
        const xx = cc + dx;
        if (xx >= 0 && xx < W) {
          s += edge[y * W + xx];
          n++;
        }
      }
    }
    wallProfile[y] = n > 0 ? s / n : 0;
  }
  // Suaviza (média móvel de 5).
  const wallS = new Float32Array(H);
  for (let y = 0; y < H; y++) {
    let s = 0;
    let n = 0;
    for (let k = -2; k <= 2; k++) {
      const yy = y + k;
      if (yy >= 0 && yy < H) {
        s += wallProfile[yy];
        n++;
      }
    }
    wallS[y] = n > 0 ? s / n : 0;
  }
  // Corrida mais longa acima do limiar, só na faixa plausível da caneca
  // (25%–98% da altura). Permite buracos de até 3 linhas.
  const wy0 = Math.floor(H * 0.25);
  const wy1 = Math.floor(H * 0.98);
  let wmax = 0;
  for (let y = wy0; y < wy1; y++) if (wallS[y] > wmax) wmax = wallS[y];
  let top = -1;
  let bottom = -1;
  if (wmax > 0) {
    const thresh = wmax * 0.3;
    let bestStart = -1;
    let bestEnd = -1;
    let y = wy0;
    while (y < wy1) {
      if (wallS[y] > thresh) {
        let end = y;
        let gap = 0;
        let lastTrue = y;
        let k = y + 1;
        while (k < wy1) {
          if (wallS[k] > thresh) {
            lastTrue = k;
            gap = 0;
          } else {
            gap++;
            if (gap > 3) break;
          }
          k++;
        }
        end = lastTrue;
        if (end - y > bestEnd - bestStart) {
          bestStart = y;
          bestEnd = end;
        }
        y = end + 1;
      } else {
        y++;
      }
    }
    if (bestStart >= 0) {
      top = bestStart;
      bottom = bestEnd;
    }
  }
  // Trava de proporção: altura/largura de caneca real fica em [0,85, 1,45].
  const widthPx = right - left;
  if (top < 0 || bottom < 0 || bottom - top < 5) {
    const cy = Math.floor(H * 0.55);
    const hEst = Math.round(widthPx * 1.15);
    top = Math.max(wy0, cy - Math.floor(hEst / 2));
    bottom = Math.min(wy1 - 1, cy + Math.floor(hEst / 2));
  } else {
    const aspect = (bottom - top) / Math.max(1, widthPx);
    if (aspect < 0.85 || aspect > 1.45) {
      const cy = Math.floor((top + bottom) / 2);
      const hEst = Math.round(widthPx * 1.15);
      top = Math.max(wy0, cy - Math.floor(hEst / 2));
      bottom = Math.min(wy1 - 1, cy + Math.floor(hEst / 2));
    }
  }
  const sx = refW / W;
  const sy = refH / H;
  const xLeft = Math.round(left * sx);
  const xRight = Math.round(right * sx);
  const cx = Math.round(((left + right) / 2) * sx);
  const R = Math.round(((right - left) / 2) * sx);
  const topC = Math.round(top * sy);
  const botC = Math.round(bottom * sy);
  const calibration: MugCalibration = {
    id: mugId,
    nome: mugName,
    cor: "#ff3b30",
    cx,
    R,
    topC,
    topRy: Math.max(4, Math.round(R * 0.06)),
    botC,
    botRy: Math.max(5, Math.round(R * 0.07)),
    xLeft,
    xRight,
    lip: 6,
    foot: 1.5,
  };
  return { calibration, confidence, method: "vertical-edges" };
}

/** Fallback por mancha clara: maior região clara conexa (aproximada por bbox). */
function luminanceBlobFallback(
  _img: HTMLImageElement,
  lum: Float32Array,
  W: number,
  H: number,
  mugId: number,
  mugName: string,
  refW: number,
  refH: number,
): DetectedArea {
  let minX = W;
  let maxX = -1;
  let minY = H;
  let maxY = -1;
  let count = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (lum[y * W + x] > 200) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        count++;
      }
    }
  }
  if (count < W * H * 0.02 || maxX < 0) return fallbackArea(mugId, mugName, refW, refH);
  const sx = refW / W;
  const sy = refH / H;
  const xLeft = Math.round(minX * sx);
  const xRight = Math.round(maxX * sx);
  const cx = Math.round(((minX + maxX) / 2) * sx);
  const R = Math.round(((maxX - minX) / 2) * sx);
  const topC = Math.round(minY * sy);
  const botC = Math.round(maxY * sy);
  const height = Math.max(1, botC - topC);
  const calibration: MugCalibration = {
    id: mugId,
    nome: mugName,
    cor: "#ff3b30",
    cx,
    R,
    topC,
    topRy: Math.round(height * 0.035),
    botC,
    botRy: Math.round(height * 0.04),
    xLeft,
    xRight,
    lip: 6,
    foot: 1.5,
  };
  return { calibration, confidence: 0.35, method: "luminance-blob" };
}

/** Último recurso: área central padrão (o usuário calibra manualmente). */
function fallbackArea(mugId: number, mugName: string, refW: number = REF_W, refH: number = REF_H): DetectedArea {
  const calibration: MugCalibration = {
    id: mugId,
    nome: mugName,
    cor: "#ff3b30",
    cx: Math.round(refW * 0.35),
    R: Math.round(refW * 0.1),
    topC: Math.round(refH * 0.35),
    topRy: Math.round(refH * 0.03),
    botC: Math.round(refH * 0.8),
    botRy: Math.round(refH * 0.035),
    xLeft: Math.round(refW * 0.25),
    xRight: Math.round(refW * 0.45),
    lip: 6,
    foot: 1.5,
  };
  return { calibration, confidence: 0, method: "fallback" };
}
