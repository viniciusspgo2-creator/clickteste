/**
 * Studio Click Mockup 2D — catálogo de cenas (port do Wrap V2).
 * As fotos base são arquivos em /public/studio-mockup-2d/scenes/ (extraídas
 * do HTML original, sem recriar a cena). A calibração de cada caneca é em
 * coordenadas do espaço de referência 2048x1152.
 */
import type { MockupTemplate } from "./types";

export const STUDIO_MOCKUP_2D_TEMPLATES: MockupTemplate[] = [
  {
    id: "gamer-2-canecas",
    nome: "Template 01 — Gamer (frente / trás)",
    base: "/studio-mockup-2d/scenes/gamer-2-canecas.jpg",
    exportName: "mockup-gamer-2-canecas.png",
    mugs: [
      {
        id: 1,
        nome: "Caneca 1",
        cor: "#ff3b30",
        cx: 732,
        R: 216,
        topC: 430,
        topRy: 30,
        botC: 940,
        botRy: 35,
        xLeft: 516,
        xRight: 952,
        lip: 6,
        foot: 1.5,
      },
      {
        id: 2,
        nome: "Caneca 2",
        cor: "#00e5ff",
        cx: 1353,
        R: 177,
        topC: 373,
        topRy: 22,
        botC: 792,
        botRy: 31,
        xLeft: 1177,
        xRight: 1537,
        lip: 6,
        foot: 1.5,
      },
    ],
  },
  {
    id: "gamer-par-alcas-opostas",
    nome: "Template 02 — Gamer (par, alças opostas)",
    base: "/studio-mockup-2d/scenes/gamer-par-alcas-opostas.jpg",
    exportName: "mockup-gamer-par-alcas-opostas.png",
    mugs: [
      {
        id: 1,
        nome: "Caneca 1",
        cor: "#ff3b30",
        cx: 761,
        R: 201,
        topC: 409,
        topRy: 21,
        botC: 892,
        botRy: 33,
        xLeft: 560,
        xRight: 970,
        lip: 6,
        foot: 1.5,
      },
      {
        id: 2,
        nome: "Caneca 2",
        cor: "#00e5ff",
        cx: 1245,
        R: 195,
        topC: 402,
        topRy: 20,
        botC: 882,
        botRy: 31,
        xLeft: 1049,
        xRight: 1448,
        lip: 6,
        foot: 1.5,
      },
    ],
  },
];

export const STUDIO_MOCKUP_2D_DEMO_ART = "/studio-mockup-2d/demo-art-21x9-5cm.png";
export const STUDIO_MOCKUP_2D_DEMO_ART_NAME = "arte-demonstracao.png (21 × 9,5 cm)";
