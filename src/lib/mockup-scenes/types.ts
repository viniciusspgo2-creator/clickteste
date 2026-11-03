/** Independent from Studio 3D. Coordinates are fractions of the image/canvas. */
export type Point = [number, number];
export type Surface = {
  topLeft: Point;
  topRight: Point;
  bottomLeft: Point;
  bottomRight: Point;
  curvature: number;
};
export type SceneModel = {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  thumbnailUrl?: string;
  preview?: {
    imageUrl: string;
    uvUrl: string;
    glossUrl: string;
    width: number;
    height: number;
  };
  width: number;
  height: number;
  mapping:
    | { kind: "uv"; uvUrl: string; glossUrl?: string; uCenter: number }
    | { kind: "cylinder"; surface: Surface };
};
export type SceneBackground = {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
};
export type CatalogKind = "background" | "model";
export type CatalogItem = {
  id: string;
  kind: CatalogKind;
  name: string;
  category: string;
  tags: string[];
  status: "draft" | "published" | "archived";
  imageUrl: string;
  width: number;
  height: number;
  surface: Surface | null;
  updatedAt: string;
};
export type Artwork = {
  src: string;
  name: string;
  width: number;
  height: number;
};
export type ArtPlacement = {
  fit: "contain" | "cover";
  zoom: number;
  x: number;
  y: number;
  mode: "front" | "wrap";
};
export type Piece = {
  id: string;
  modelId: string;
  x: number;
  y: number;
  width: number;
  art: Artwork | null;
  placement: ArtPlacement;
  shadow: number;
  locked: boolean;
  hidden: boolean;
};
export type SceneDocument = {
  pieces: Piece[];
  background: {
    src: string | null;
    color: string;
    fit: "cover" | "contain";
    x: number;
    y: number;
  };
  logo: {
    image: Artwork;
    x: number;
    y: number;
    width: number;
    opacity: number;
    locked: boolean;
  } | null;
  aspect: "square" | "portrait" | "landscape";
};
export const DEFAULT_PLACEMENT: ArtPlacement = {
  fit: "contain",
  zoom: 1,
  x: 0,
  y: 0,
  mode: "front",
};
export const DEFAULT_SURFACE: Surface = {
  topLeft: [0.22, 0.25],
  topRight: [0.7, 0.25],
  bottomLeft: [0.22, 0.82],
  bottomRight: [0.7, 0.82],
  curvature: 0.07,
};
export const ASPECTS = {
  square: [1, 1],
  portrait: [4, 5],
  landscape: [3, 2],
} as const;

export function sceneSize(aspect: SceneDocument["aspect"], edge: number) {
  const [w, h] = ASPECTS[aspect];
  return {
    width: Math.round((edge * w) / Math.max(w, h)),
    height: Math.round((edge * h) / Math.max(w, h)),
  };
}
