/**
 * Studio Click Mockup 2D — detecção automática de área (v5.1, sem dependências).
 * Encontra o corpo da caneca numa foto de cena e sugere a calibração inicial.
 *
 * Método (leve, 100% no navegador, sem WASM):
 * 1. Reduz a cena para ~512 px de largura e calcula a luminância.
 * 2. Detecta bordas verticais fortes (gradiente horizontal de Sobel) — as
 *    laterais da caneca são as bordas verticais mais fortes e mais longas.
 * 3. Seleção do par de paredes — MESMA lógica do pipeline v5 Python:
 *    picos locais no perfil suavizado + largura em [12%, 42%] da imagem +
 *    score = força × brilho médio interno (a caneca é branca). Sem o teto
 *    de largura e sem o brilho, o detector achava as bordas da imagem.
 * 4. Topo/base (v5): pela EXTENSÃO DAS BORDAS VERTICAIS das paredes — não
 *    por brilho (o fundo claro estendia a caneca até o pé da imagem).
 *    Trava de proporção altura/largura em [0,85, 1,45].
 * 5. Devolve também um score de confiança (0–1). Score baixo = pedir
 *    calibração manual.
 *
 * v6 (JSFeat Canny) foi TESTADO e REJEITADO (2026-11-11, protótipo em
 * scripts/detect-v6-prototype.mjs): o Canny puro e o híbrido Sobel×Canny
 * pioraram o detector — em 18 templates, o híbrido achou 0 canecas em 8
 * (incluindo 4 controles que o v5 acerta) e os "acertos" eram falsos
 * positivos no fundo (prateleiras, armários). O Sobel + seleção v5 fica.
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
  // Força de borda por coluna (faixa vertical central).
  const y0 = Math.floor(H * 0.15);
  const y1 = Math.floor(H * 0.85);
  const colStrength = new Float32Array(W);
  for (let x = 0; x < W; x++) {
    let s = 0;
    for (let y = y0; y < y1; y++) s += edge[y * W + x];
    colStrength[x] = s / (y1 - y0);
  }
  // Seleção do par de paredes — MESMA lógica do pipeline v5 Python
  // (calibrate-templates-v5.py), não "melhor par por força bruta":
  // 1. Suaviza o perfil e acha PICOS locais (>= 35% do máximo).
  // 2. Agrupa picos próximos (distância mínima 3% da largura).
  // 3. Pares candidatos com largura em [12%, 42%] da imagem — sem esse
  //    teto, o detector achava as BORDAS DA IMAGEM (left=1, right=510).
  // 4. Score = força × brilho médio INTERNO (a caneca é branca; um par
  //    que abrange o fundo escuro perde mesmo com bordas fortes).
  // 5. Ganha o par de maior score.
  const smooth = new Float32Array(W);
  for (let x = 0; x < W; x++) {
    let s = 0;
    let n = 0;
    for (let k = -2; k <= 2; k++) {
      const xx = x + k;
      if (xx >= 0 && xx < W) {
        s += colStrength[xx];
        n++;
      }
    }
    smooth[x] = n > 0 ? s / n : 0;
  }
  let maxS = 0;
  for (let x = 0; x < W; x++) if (smooth[x] > maxS) maxS = smooth[x];
  if (maxS <= 0) return luminanceBlobFallback(img, lum, W, H, mugId, mugName, refW, refH);
  const peaks: number[] = [];
  for (let x = 1; x < W - 1; x++) {
    if (smooth[x] >= smooth[x - 1] && smooth[x] >= smooth[x + 1] && smooth[x] >= maxS * 0.35) {
      peaks.push(x);
    }
  }
  const minDist = Math.max(2, Math.floor(W * 0.03));
  const clustered: number[] = [];
  if (peaks.length > 0) {
    let group = [peaks[0]];
    for (const p of peaks.slice(1)) {
      if (p - group[group.length - 1] <= minDist) group.push(p);
      else {
        clustered.push(group.reduce((a, b) => (smooth[a] >= smooth[b] ? a : b)));
        group = [p];
      }
    }
    clustered.push(group.reduce((a, b) => (smooth[a] >= smooth[b] ? a : b)));
  }
  const minW = Math.floor(W * 0.12);
  const maxW = Math.floor(W * 0.42);
  const cy0 = Math.floor(H * 0.25);
  const cy1 = Math.floor(H * 0.75);
  let left = -1;
  let right = -1;
  let bestScore = -1;
  for (let i = 0; i < clustered.length; i++) {
    for (let j = i + 1; j < clustered.length; j++) {
      const a = clustered[i];
      const b = clustered[j];
      const width = b - a;
      if (width < minW || width > maxW) continue;
      let sumLum = 0;
      let nLum = 0;
      for (let y = cy0; y < cy1; y++) {
        for (let x = a; x <= b; x++) {
          sumLum += lum[y * W + x];
          nLum++;
        }
      }
      const meanLum = nLum > 0 ? sumLum / nLum : 0;
      const score = (smooth[a] + smooth[b]) * (meanLum / 255);
      if (score > bestScore) {
        bestScore = score;
        left = a;
        right = b;
      }
    }
  }
  const maxStrength = maxS;
  const confidence =
    left >= 0 && maxStrength > 0
      ? Math.min(1, ((smooth[left] + smooth[right]) / (2 * maxStrength)) * 1.15)
      : 0;
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
