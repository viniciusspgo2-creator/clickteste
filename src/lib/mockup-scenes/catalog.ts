import type { SceneBackground, SceneModel } from "./types";

export const BUILTIN_MODELS: SceneModel[] = [
  {
    id: "porcelain-right",
    name: "Clássica · alça à direita",
    category: "Porcelana branca",
    imageUrl: "/mockup-scenes/models/right-base.png",
    thumbnailUrl: "/mockup-scenes/thumbs/right.png",
    preview: {
      imageUrl: "/mockup-scenes/previews/right-base.png",
      uvUrl: "/mockup-scenes/previews/right-uv.png",
      glossUrl: "/mockup-scenes/previews/right-gloss.png",
      width: 1024,
      height: 1024,
    },
    width: 4096,
    height: 4096,
    mapping: {
      kind: "uv",
      uvUrl: "/mockup-scenes/models/right-uv.png",
      glossUrl: "/mockup-scenes/models/right-gloss.png",
      uCenter: 0.75,
    },
  },
  {
    id: "porcelain-left",
    name: "Clássica · alça à esquerda",
    category: "Porcelana branca",
    imageUrl: "/mockup-scenes/models/left-base.png",
    thumbnailUrl: "/mockup-scenes/thumbs/left.png",
    preview: {
      imageUrl: "/mockup-scenes/previews/left-base.png",
      uvUrl: "/mockup-scenes/previews/left-uv.png",
      glossUrl: "/mockup-scenes/previews/left-gloss.png",
      width: 1024,
      height: 1024,
    },
    width: 4096,
    height: 4096,
    mapping: {
      kind: "uv",
      uvUrl: "/mockup-scenes/models/left-uv.png",
      glossUrl: "/mockup-scenes/models/left-gloss.png",
      uCenter: 0.25,
    },
  },
  {
    id: "porcelain-perspective",
    name: "Clássica · perspectiva",
    category: "Porcelana branca",
    imageUrl: "/mockup-scenes/models/three-quarter-base.png",
    thumbnailUrl: "/mockup-scenes/thumbs/three-quarter.png",
    preview: {
      imageUrl: "/mockup-scenes/previews/three-quarter-base.png",
      uvUrl: "/mockup-scenes/previews/three-quarter-uv.png",
      glossUrl: "/mockup-scenes/previews/three-quarter-gloss.png",
      width: 1024,
      height: 1024,
    },
    width: 4096,
    height: 4096,
    mapping: {
      kind: "uv",
      uvUrl: "/mockup-scenes/models/three-quarter-uv.png",
      glossUrl: "/mockup-scenes/models/three-quarter-gloss.png",
      uCenter: 0.66,
    },
  },
];

const backgrounds = [
  ["01-madeira-nogueira", "Madeira nogueira", "Madeiras"],
  ["02-carvalho", "Carvalho natural", "Madeiras"],
  ["03-rustica", "Madeira rústica", "Madeiras"],
  ["04-marmore-branco", "Mármore branco", "Pedras"],
  ["05-marmore-preto", "Mármore preto", "Pedras"],
  ["06-travertino", "Travertino", "Pedras"],
  ["07-cozinha-clara", "Cozinha clara", "Ambientes"],
  ["08-cozinha-verde", "Cozinha verde", "Ambientes"],
  ["09-cozinha-industrial", "Cozinha industrial", "Ambientes"],
  ["10-escritorio", "Escritório", "Ambientes"],
  ["11-home-office", "Home office", "Ambientes"],
  ["12-executivo", "Executivo", "Ambientes"],
  ["13-cafe-manha", "Café da manhã", "Café"],
  ["14-cafeteria", "Cafeteria", "Café"],
  ["15-varanda", "Varanda", "Ambientes"],
  ["16-studio-creme", "Studio creme", "Studio"],
  ["17-studio-laranja", "Studio laranja", "Studio"],
  ["18-studio-grafite", "Studio grafite", "Studio"],
  ["19-natal-verde", "Natal verde", "Natal"],
  ["20-natal-neve", "Natal na neve", "Natal"],
  ["21-natal-rustico", "Natal rústico", "Natal"],
  ["22-maes-rosa", "Mães · rosa", "Dia das Mães"],
  ["23-maes-lavanda", "Mães · lavanda", "Dia das Mães"],
  ["24-maes-natural", "Mães · natural", "Dia das Mães"],
  ["25-namorados", "Namorados", "Dia dos Namorados"],
  ["26-namorados-rosa", "Namorados · rosa", "Dia dos Namorados"],
  ["27-pais", "Dia dos Pais", "Dia dos Pais"],
  ["28-pais-azul", "Pais · azul", "Dia dos Pais"],
  ["29-pascoa", "Páscoa", "Páscoa"],
  ["30-black-friday", "Black Friday", "Black Friday"],
];
export const BUILTIN_BACKGROUNDS: SceneBackground[] = backgrounds.map(
  ([id, name, category]) => ({
    id,
    name,
    category,
    imageUrl: `/mockup/backgrounds/${id}.jpg`,
    thumbnailUrl: `/mockup-scenes/thumbs/${id}.jpg`,
    width: 1536,
    height: 1024,
  }),
);

export type Composition = {
  id: string;
  name: string;
  description: string;
  items: readonly (readonly [string, number, number, number])[];
};
export const COMPOSITIONS: readonly Composition[] = [
  {
    id: "solo",
    name: "Solo",
    description: "Uma peça em destaque",
    items: [["porcelain-right", 0.5, 0.56, 0.64]],
  },
  {
    id: "duo",
    name: "Dupla",
    description: "Duas peças, duas artes",
    items: [
      ["porcelain-left", 0.32, 0.56, 0.51],
      ["porcelain-right", 0.69, 0.56, 0.51],
    ],
  },
  {
    id: "stack",
    name: "Empilhadas",
    description: "Uma sobre a outra",
    items: [
      ["porcelain-left", 0.5, 0.71, 0.46],
      ["porcelain-right", 0.5, 0.405, 0.46],
    ],
  },
  {
    id: "trio",
    name: "Trio",
    description: "Três peças lado a lado",
    items: [
      ["porcelain-left", 0.23, 0.57, 0.39],
      ["porcelain-perspective", 0.5, 0.57, 0.39],
      ["porcelain-right", 0.77, 0.57, 0.39],
    ],
  },
  {
    id: "pyramid",
    name: "Pirâmide",
    description: "Um conjunto de três",
    items: [
      ["porcelain-left", 0.33, 0.7, 0.46],
      ["porcelain-right", 0.68, 0.7, 0.46],
      ["porcelain-perspective", 0.5, 0.39, 0.46],
    ],
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Profundidade em duas peças",
    items: [
      ["porcelain-left", 0.67, 0.44, 0.43],
      ["porcelain-right", 0.38, 0.64, 0.64],
    ],
  },
] as const;
