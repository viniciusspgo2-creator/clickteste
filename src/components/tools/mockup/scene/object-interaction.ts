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
  const hit = pointerOnPlane(clientX, clientY, rect, cam, plane);
  // Perto do horizonte o raio fica quase paralelo ao plano horizontal: o
  // ponto explode para centenas de unidades (ou não existe) e o clamp
  // devolvia a caneca teleportada sem mudar nada. Nesse caso reconstrói
  // num plano perpendicular à vista passando pelo centro atual — o raio
  // nunca é paralelo a ele, e o ponto fica sempre perto da caneca.
  if (hit && hit.distanceTo(cam.position) <= dist * 2) return hit;
  const dir = new THREE.Vector3();
  cam.getWorldDirection(dir);
  const viewPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(dir, center);
  return pointerOnPlane(clientX, clientY, rect, cam, viewPlane) ?? center;
}

/** Prende a ALTURA do centro da peça dentro do quadro (a peça não sai
 * pela borda de cima nem de baixo ao subir/descer). Devolve a altura
 * mundial permitida, mantendo x/z: projeta o centro, prende o NDC e volta
 * pelo mesmo raio da câmera — sem passar pelo plano horizontal, que só
 * vale para o arraste no chão. */
export function clampCenterYToFrame(
  center: THREE.Vector3,
  camera: THREE.Camera,
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">,
  radius: number,
): number {
  const cam = camera as THREE.PerspectiveCamera;
  const frame = frameNdcBounds(cam);
  if (!frame || !rect.width || !rect.height) return center.y;
  const v = center.clone().project(cam);
  const dist = Math.max(cam.position.distanceTo(center), 0.01);
  const zoomF = cam.zoom || 1;
  const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
  const halfH = (radius / dist) * zoomF / tanV;
  const halfW = halfH / (cam.aspect || 1);
  const { x: cx, y: cy } = clampNdcToFrame(v.x, v.y, frame, halfW, halfH);
  if (Math.abs(cy - v.y) < 0.0005) return center.y;
  // Ponto no mesmo raio da câmera, na direção do NDC preso.
  const dir = new THREE.Vector3(cx, cy, 0.5).unproject(cam).sub(cam.position).normalize();
  return cam.position.y + dir.y * dist;
}

export interface ContactPiece { posX: number; posZ: number; rotationY: number; scale: number }

/** Encurta um delta de arraste para a peça parar quando encostar noutra,
 * em vez de atravessá-la por acidente. Se já estiver encostando ou
 * sobreposta, não trava a saída. `minDist` é o minDistBetween do store
 * (distância mínima com a alça, por rotação e escala). */
export function limitDeltaByContact(
  moving: ContactPiece,
  others: readonly ContactPiece[],
  delta: PlanarPosition,
  minDist: (a: ContactPiece, b: ContactPiece) => number,
): PlanarPosition {
  let t = 1;
  for (const o of others) {
    const dx0 = moving.posX - o.posX, dz0 = moving.posZ - o.posZ;
    const d0 = Math.hypot(dx0, dz0);
    const need = minDist(moving, o);
    if (d0 <= need) continue; // já encostando/sobreposta: não trava a saída
    // |p0 + t·d − q| = need → t de entrada no círculo de contato.
    const a = delta.x * delta.x + delta.z * delta.z;
    if (a < 1e-12) continue;
    const b = 2 * (dx0 * delta.x + dz0 * delta.z);
    const c = dx0 * dx0 + dz0 * dz0 - need * need;
    const disc = b * b - 4 * a * c;
    if (disc < 0) continue;
    const tHit = (-b - Math.sqrt(disc)) / (2 * a);
    if (tHit >= 0 && tHit < t) t = Math.max(0, tHit);
  }
  return { x: delta.x * t, z: delta.z * t };
}
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
