import * as THREE from "three";
import { clampNdcToFrame, frameNdcBounds } from "./bg-image";

/** Physical scene bounds, in centimetres; manual placement never resolves collisions. */
export const POSITION_LIMIT = 150;
export const MIN_OBJECT_SCALE = 0.2;
export const MAX_OBJECT_SCALE = 3;
export interface PlanarPosition { x: number; z: number }

/** Trava o centro da caneca dentro do quadro do cenário (em NDC): projeta
 * o centro, prende nas bordas do quadro (descontando o raio da caneca) e
 * volta para o plano horizontal na altura do centro. Sem cenário
 * enquadrado, devolve o centro como está. */
export function clampCenterToFrame(
  center: THREE.Vector3,
  camera: THREE.Camera,
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">,
  radius: number,
): THREE.Vector3 {
  const cam = camera as THREE.PerspectiveCamera;
  const frame = frameNdcBounds(cam);
  if (!frame || !rect.width || !rect.height) return center;
  const v = center.clone().project(cam);
  const dist = Math.max(cam.position.distanceTo(center), 0.01);
  const zoomF = cam.zoom || 1;
  const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
  const halfH = (radius / dist) * zoomF / tanV;
  const halfW = halfH / (cam.aspect || 1);
  // clampNdcToFrame nunca inverte a faixa: se a caneca for maior que o
  // quadro num eixo, o centro fica no meio desse eixo.
  const { x: cx, y: cy } = clampNdcToFrame(v.x, v.y, frame, halfW, halfH);
  if (Math.abs(cx - v.x) < 0.0005 && Math.abs(cy - v.y) < 0.0005) return center;
  const clientX = rect.left + ((cx + 1) / 2) * rect.width;
  const clientY = rect.top + ((1 - cy) / 2) * rect.height;
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -center.y);
  return pointerOnPlane(clientX, clientY, rect, cam, plane) ?? center;
}

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
