/**
 * Studio Click Mockup 2D — tipos do motor Wrap V2 (port do HTML).
 * Espaço de referência da calibração: 2048 x 1152 (REF_W x REF_H).
 * A cena 4K (3840x2160) é 1,875x esse espaço.
 */

export const REF_W = 2048;
export const REF_H = 1152;

/** Calibração geométrica de UMA caneca numa cena. */
export interface MugCalibration {
  id: number;
  nome: string;
  /** Cor usada no contorno da máscara (overlay de debug). */
  cor: string;
  /** Centro horizontal do cilindro (px, espaço de referência). */
  cx: number;
  /** Raio nominal do cilindro (px). Usado só como fallback de xLeft/xRight. */
  R: number;
  /** Centro vertical da elipse do topo (px). */
  topC: number;
  /** Raio vertical da elipse do topo (px). */
  topRy: number;
  /** Centro vertical da elipse da base (px). */
  botC: number;
  /** Raio vertical da elipse da base (px). */
  botRy: number;
  /** Limite esquerdo medido da caneca (px). Evita faixas brancas. */
  xLeft?: number;
  /** Limite direito medido da caneca (px). */
  xRight?: number;
  /** Deslocamento da linha superior para baixo da borda de porcelana (px). Padrão 6. */
  lip?: number;
  /** Deslocamento da linha inferior para cima do pé (px). Padrão 1.5. */
  foot?: number;
  /** Confiança da detecção automática desta caneca (0–1). */
  confidence?: number;
  /** Esta caneca foi recuperada por espelhamento da outra do par. */
  mirrored?: boolean;
  /** Esta caneca usa a estimativa padrão (mediana do catálogo). */
  defaultEstimate?: boolean;
}

/** Uma cena (template): foto base + canecas calibradas. */
export interface MockupTemplate {
  id: string;
  nome: string;
  /** Caminho público da foto base (ex.: /studio-mockup-2d/scenes/gamer-2-canecas.jpg). */
  base: string;
  /** Nome base do arquivo exportado (sem resolução). */
  exportName: string;
  /**
   * Espaço de referência da calibração desta cena (px). As cenas gamer
   * usam 2048x1152 (16:9); as cenas retrato usam 1080x1350 (4:5).
   * O render escala por W / refW; o canvas da prévia tem a mesma
   * proporção de refW/refH, então um único fator de escala serve aos dois eixos.
   */
  refW: number;
  refH: number;
  mugs: MugCalibration[];
  /**
   * Metadados da calibração (opcional): confiança média da detecção
   * automática (0–1), se alguma caneca veio de estimativa/espelho e se
   * a cena precisa de revisão manual no calibrador.
   */
  calibration?: {
    /** Confiança média da detecção automática (0–1). */
    avgConfidence?: number;
    /** Alguma caneca foi recuperada por espelhamento do par. */
    mirrored?: boolean;
    /** Alguma caneca usa a estimativa padrão (mediana do catálogo). */
    defaultEstimate?: boolean;
    /** A calibração precisa de revisão manual antes de confiar nela. */
    needsManual?: boolean;
  };
}

/** Estado dos controles de renderização. */
export interface RenderState {
  /** Zoom da arte: 60–200 (%). Padrão 100. */
  zoom: number;
  /** Deslocamento horizontal da arte: -50..50 (%). Padrão 0. */
  offX: number;
  /** Deslocamento vertical da arte: -15..15 (%). Padrão 0. */
  offY: number;
  /** Opacidade da arte: 40–100 (%). Padrão 100. */
  opacity: number;
  /** Intensidade do reflexo especular: 0–100 (%). Padrão 50. */
  light: number;
  /** Intensidade do sombreamento (mapa de luminosidade): 0–100 (%). Padrão 75. */
  shade: number;
  /** Saturação da arte: 70–140 (%). Padrão 100. */
  sat: number;
  /** Arte dividida entre as canecas. Padrão false. */
  split: boolean;
  /** Ponto de divisão da arte (split): 30–70 (%). Padrão 50. */
  splitPoint: number;
  /** Quais canecas recebem a arte (por índice). */
  use: boolean[];
  /** Mostrar contorno/nome das máscaras (debug). */
  showMasks: boolean;
  /** Segurar para ver as canecas sem a estampa. */
  compare: boolean;
  /**
   * Realismo (0–100, padrão 100): intensidade com que a arte herda a luz,
   * as dobras e a textura da foto (mapa de luminosidade + especular + grão).
   * 100 = o visual de referência do Wrap V2. 0 = arte chapada, sem integração.
   * Ideia do stallkit (MIT) — lá o padrão para caneca é 45 na escala dele.
   */
  realismo: number;
  /**
   * Curva (0–100, padrão 0): queda de luz nas bordas do cilindro — a arte
   * escurece ao se aproximar das laterais da caneca, como envolve o cilindro.
   * 0 = igual ao Wrap V2 original (sem queda extra). 100 = queda total.
   * Ideia do stallkit (MIT).
   */
  curva: number;
}

export const DEFAULT_RENDER_STATE: RenderState = {
  zoom: 100,
  offX: 0,
  offY: 0,
  opacity: 100,
  light: 50,
  shade: 75,
  sat: 100,
  split: false,
  splitPoint: 50,
  use: [true, true],
  showMasks: false,
  compare: false,
  realismo: 100,
  curva: 0,
};

/** Arte carregada, amostrada em pixels (máx. 4096x2048). */
export interface ArtPixels {
  data: Uint8ClampedArray;
  w: number;
  h: number;
}

/** Mapas derivados da foto original (1x por template). */
export interface SceneMaps {
  lumMap: HTMLCanvasElement | null;
  specMap: HTMLCanvasElement | null;
  edgeColors: { left: [number, number, number]; right: [number, number, number] }[];
  grainPattern: CanvasPattern | null;
  ready: boolean;
}

/** Tamanhos de exportação (16:9 do Wrap V2 + formatos sociais). */
export interface ExportSize {
  label: string;
  w: number;
  h: number;
}

export const EXPORT_SIZES_16_9: ExportSize[] = [
  { label: "Ultra HD · 3840 × 2160", w: 3840, h: 2160 },
  { label: "Full HD · 1920 × 1080", w: 1920, h: 1080 },
  { label: "Alta qualidade · 2048 × 1152", w: 2048, h: 1152 },
];

export const EXPORT_SIZES_SOCIAL: ExportSize[] = [
  { label: "Feed · 1080 × 1350", w: 1080, h: 1350 },
  { label: "Story / Reels · 1080 × 1920", w: 1080, h: 1920 },
  { label: "Paisagem · 1920 × 1080", w: 1920, h: 1080 },
  { label: "Quadrado · 1080 × 1080", w: 1080, h: 1080 },
];

/** Tamanhos de exportação para cenas retrato 4:5 (mesma proporção da cena). */
export const EXPORT_SIZES_4_5: ExportSize[] = [
  { label: "Retrato 2x · 2160 × 2700", w: 2160, h: 2700 },
  { label: "Retrato · 1080 × 1350", w: 1080, h: 1350 },
  { label: "Retrato leve · 864 × 1080", w: 864, h: 1080 },
];
