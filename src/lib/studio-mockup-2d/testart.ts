/**
 * Studio Click Mockup 2D — artes de teste para o calibrador.
 * Geradas no navegador (2100x950, o formato da arte 21x9,5cm).
 * Servem para revelar erro de calibração na hora:
 * - grade: linhas retas e diagonais mostram se a malha acompanha a caneca
 *   (linha torta = topo/base ou curvatura errados; centro deslocado).
 * - xadrez: quadrados iguais mostram compressão lateral e distorção.
 * - texto: texto grande mostra se há inclinação, esticamento ou descentro.
 */

export type TestArtKind = "grid" | "checker" | "text";

export const TEST_ART_W = 2100;
export const TEST_ART_H = 950;

function makeCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = TEST_ART_W;
  c.height = TEST_ART_H;
  const g = c.getContext("2d");
  if (!g) throw new Error("Sem contexto 2d.");
  return [c, g];
}

function drawGrid(g: CanvasRenderingContext2D): void {
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, TEST_ART_W, TEST_ART_H);
  const stepX = 105;
  const stepY = 95;
  // Grade fina.
  g.strokeStyle = "#c8c8c8";
  g.lineWidth = 1;
  for (let x = 0; x <= TEST_ART_W; x += stepX) {
    g.beginPath();
    g.moveTo(x + 0.5, 0);
    g.lineTo(x + 0.5, TEST_ART_H);
    g.stroke();
  }
  for (let y = 0; y <= TEST_ART_H; y += stepY) {
    g.beginPath();
    g.moveTo(0, y + 0.5);
    g.lineTo(TEST_ART_W, y + 0.5);
    g.stroke();
  }
  // Linhas grossas a cada 5 células.
  g.strokeStyle = "#222222";
  g.lineWidth = 3;
  for (let x = 0; x <= TEST_ART_W; x += stepX * 5) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, TEST_ART_H);
    g.stroke();
  }
  for (let y = 0; y <= TEST_ART_H; y += stepY * 5) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(TEST_ART_W, y);
    g.stroke();
  }
  // Diagonais (revelam perspectiva/curvatura errada).
  g.strokeStyle = "#ff3b30";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(TEST_ART_W, TEST_ART_H);
  g.stroke();
  g.beginPath();
  g.moveTo(TEST_ART_W, 0);
  g.lineTo(0, TEST_ART_H);
  g.stroke();
  // Cruz central.
  g.strokeStyle = "#ff3b30";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(TEST_ART_W / 2, 0);
  g.lineTo(TEST_ART_W / 2, TEST_ART_H);
  g.stroke();
  g.beginPath();
  g.moveTo(0, TEST_ART_H / 2);
  g.lineTo(TEST_ART_W, TEST_ART_H / 2);
  g.stroke();
  // Números das colunas no topo.
  g.fillStyle = "#222222";
  g.font = "bold 28px system-ui, sans-serif";
  g.textAlign = "center";
  for (let i = 0; i <= 20; i++) {
    g.fillText(String(i), i * stepX, 34);
  }
}

function drawChecker(g: CanvasRenderingContext2D): void {
  const s = 105;
  for (let row = 0; row * s < TEST_ART_H; row++) {
    for (let col = 0; col * s < TEST_ART_W; col++) {
      g.fillStyle = (row + col) % 2 === 0 ? "#111111" : "#ffffff";
      g.fillRect(col * s, row * s, s, s);
    }
  }
  // Cruz central vermelha para achar o centro.
  g.strokeStyle = "#ff3b30";
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(TEST_ART_W / 2, 0);
  g.lineTo(TEST_ART_W / 2, TEST_ART_H);
  g.stroke();
  g.beginPath();
  g.moveTo(0, TEST_ART_H / 2);
  g.lineTo(TEST_ART_W, TEST_ART_H / 2);
  g.stroke();
}

function drawText(g: CanvasRenderingContext2D): void {
  g.fillStyle = "#0b0b18";
  g.fillRect(0, 0, TEST_ART_W, TEST_ART_H);
  // Linhas-guia horizontais (1/4, 1/2, 3/4).
  g.strokeStyle = "#ff3b30";
  g.lineWidth = 3;
  for (const fy of [0.25, 0.5, 0.75]) {
    g.beginPath();
    g.moveTo(0, TEST_ART_H * fy);
    g.lineTo(TEST_ART_W, TEST_ART_H * fy);
    g.stroke();
  }
  g.strokeStyle = "#00e5ff";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(TEST_ART_W / 2, 0);
  g.lineTo(TEST_ART_W / 2, TEST_ART_H);
  g.stroke();
  // Texto grande.
  g.fillStyle = "#ffffff";
  g.font = "900 340px system-ui, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("GAMER", TEST_ART_W / 2, TEST_ART_H * 0.42);
  g.fillStyle = "#00e5ff";
  g.font = "700 92px system-ui, sans-serif";
  g.fillText("NEON EDITION", TEST_ART_W / 2, TEST_ART_H * 0.78);
}

/** Gera a arte de teste e devolve um data URL PNG. */
export function makeTestArt(kind: TestArtKind): string {
  const [c, g] = makeCanvas();
  if (kind === "grid") drawGrid(g);
  else if (kind === "checker") drawChecker(g);
  else drawText(g);
  return c.toDataURL("image/png");
}

export const TEST_ART_LABELS: Record<TestArtKind, string> = {
  grid: "Grade técnica",
  checker: "Xadrez",
  text: "Texto grande",
};
