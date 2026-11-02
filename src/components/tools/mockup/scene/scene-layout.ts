import { MUG_FULL_R } from "../lib/config";

/** Only ceramic meshes belong to the contact-depth pass, never another shadow plane. */
export const MUG_CONTACT_LAYER = 7;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 4000;
export const MAX_CAMERA_DISTANCE = 1500;

export function cameraFarFor(distance: number, sceneRadius: number) {
  return Math.max(CAMERA_FAR, distance + sceneRadius * 2 + 50);
}

type Piece = { posX?: number; posZ?: number; scale?: number; hidden?: boolean };

/** An off-centre principal and every companion contribute to the shadow area. */
export function sceneFootprint(hero: Piece, companions: Piece[]) {
  const visible = [hero, ...companions].filter(piece => !piece.hidden);
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const piece of visible) {
    const radius = MUG_FULL_R * (piece.scale ?? 1) + 2;
    const x = piece.posX ?? 0, z = piece.posZ ?? 0;
    minX = Math.min(minX, x - radius); maxX = Math.max(maxX, x + radius);
    minZ = Math.min(minZ, z - radius); maxZ = Math.max(maxZ, z + radius);
  }
  if (!visible.length) return { x: 0, z: 0, width: 18, depth: 18, extent: 13 };
  const width = Math.max(18, maxX - minX), depth = Math.max(18, maxZ - minZ);
  return { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2, width, depth,
    extent: Math.max(13, Math.hypot(width, depth) / 2) };
}
