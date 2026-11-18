import * as THREE from "three";

/** Physical scene bounds, in centimetres; manual placement never resolves collisions. */
export const POSITION_LIMIT = 150;
export const MIN_OBJECT_SCALE = 0.2;
export const MAX_OBJECT_SCALE = 3;
export interface PlanarPosition { x: number; z: number }

/** One shared delta keeps a selected group together, including at the scene bounds. */
export function planarDragDelta(
  origin: PlanarPosition,
  start: PlanarPosition,
  current: PlanarPosition,
  positions: readonly PlanarPosition[],
  snap: boolean,
): PlanarPosition {
  if (![origin.x, origin.z, start.x, start.z, current.x, current.z].every(Number.isFinite)) {
    return { x: 0, z: 0 };
  }
  const step = snap ? 0.5 : 0;
  const snapped = (value: number) => step ? Math.round(value / step) * step : value;
  const x = snapped(origin.x + current.x - start.x) - origin.x;
  const z = snapped(origin.z + current.z - start.z) - origin.z;
  const safe = positions.filter(p => Number.isFinite(p.x) && Number.isFinite(p.z));
  const all = safe.length ? safe : [origin];
  return {
    x: THREE.MathUtils.clamp(x, -POSITION_LIMIT - Math.min(...all.map(p => p.x)), POSITION_LIMIT - Math.max(...all.map(p => p.x))),
    z: THREE.MathUtils.clamp(z, -POSITION_LIMIT - Math.min(...all.map(p => p.z)), POSITION_LIMIT - Math.max(...all.map(p => p.z))),
  };
}

/** A fixed plane prevents jumps caused by repeatedly raycasting the moving surface. */
export function dragPlane(point: THREE.Vector3): THREE.Plane {
  return new THREE.Plane(new THREE.Vector3(0, 1, 0), -point.y);
}

export function pointerOnPlane(
  clientX: number,
  clientY: number,
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">,
  camera: THREE.Camera,
  plane: THREE.Plane,
): THREE.Vector3 | null {
  if (!rect.width || !rect.height) return null;
  const pointer = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1,
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
  return hit && [hit.x, hit.y, hit.z].every(Number.isFinite) ? hit : null;
}

/** Scale gizmos can change one axis; mugs always retain their physical proportions. */
export function uniformScaleFromGizmo(
  current: THREE.Vector3,
  initial: THREE.Vector3,
): number {
  const differences = ["x", "y", "z"] as const;
  const axis = differences.reduce((largest, value) =>
    Math.abs(current[value] - initial[value]) > Math.abs(current[largest] - initial[largest]) ? value : largest,
  "x");
  const next = current[axis];
  return THREE.MathUtils.clamp(Number.isFinite(next) ? next : initial.x, MIN_OBJECT_SCALE, MAX_OBJECT_SCALE);
}

/** Detect the real Three controls root as well as named/legacy editor helpers. */
export function isEditorOverlay(object: THREE.Object3D): boolean {
  return (object as THREE.Object3D & { isTransformControls?: boolean }).isTransformControls === true ||
    ["studio-gizmo", "selection-outline"].includes(object.name) ||
    ["TransformControlsRoot", "TransformControlsGizmo", "TransformControlsPlane"].includes(object.type);
}
