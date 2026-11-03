import * as THREE from "three";
import { visibleMugBounds } from "./studio-refs";

/** Orbit between views instead of travelling through the objects along a chord. */
export function interpolateCameraView(fromPos: THREE.Vector3, fromTarget: THREE.Vector3,
  toPos: THREE.Vector3, toTarget: THREE.Vector3, progress: number) {
  const t = THREE.MathUtils.clamp(progress, 0, 1);
  const start = new THREE.Spherical().setFromVector3(fromPos.clone().sub(fromTarget));
  const end = new THREE.Spherical().setFromVector3(toPos.clone().sub(toTarget));
  const delta = Math.atan2(Math.sin(end.theta - start.theta), Math.cos(end.theta - start.theta));
  const target = fromTarget.clone().lerp(toTarget, t);
  const spherical = new THREE.Spherical(
    THREE.MathUtils.lerp(Math.max(0.1, start.radius), Math.max(0.1, end.radius), t),
    THREE.MathUtils.clamp(THREE.MathUtils.lerp(start.phi, end.phi, t), 0.02, Math.PI / 2 - 0.01),
    start.theta + delta * t,
  );
  return { pos: new THREE.Vector3().setFromSpherical(spherical).add(target), target };
}

/** Enquadra a caixa projetada, considerando perspectiva e o formato do canvas. */
export function fitBoundsToView(
  bounds: THREE.Box3,
  direction: THREE.Vector3,
  verticalFov: number,
  aspect: number,
  padding = 1.24,
): { pos: THREE.Vector3; target: THREE.Vector3 } {
  const target = bounds.getCenter(new THREE.Vector3());
  const dir = direction.clone().normalize();
  if (dir.lengthSq() === 0) dir.set(0, 0.14, 1).normalize();
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir);
  if (right.lengthSq() < 1e-8) right.set(1, 0, 0);
  right.normalize();
  const up = new THREE.Vector3().crossVectors(dir, right).normalize();
  const tanV = Math.tan(THREE.MathUtils.degToRad(verticalFov) / 2);
  const tanH = tanV * Math.max(0.05, aspect);
  let distance = 6.5;
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        const point = new THREE.Vector3(x, y, z).sub(target);
        distance = Math.max(distance, point.dot(dir) + padding * Math.max(
          Math.abs(point.dot(right)) / tanH, Math.abs(point.dot(up)) / tanV,
        ));
      }
  return { target, pos: target.clone().addScaledVector(dir, distance) };
}

/** Uma reserva para as alças evita recortes durante o giro de várias peças. */
export function framingBounds(scene: THREE.Scene, spinSafe = false): THREE.Box3 {
  const bounds = visibleMugBounds(scene);
  if (!spinSafe) return bounds;
  scene.traverse(object => {
    if (object.name !== "mug-float" || !object.visible) return;
    const center = object.getWorldPosition(new THREE.Vector3());
    const box = new THREE.Box3();
    let radius = 0;
    // Mede os cantos ANTES de criar a caixa mundial. A diagonal da caixa já
    // girada varia com a pose e deslocava o centro ao pausar o giro.
    // Linhas de seleção e gizmos também não entram no enquadramento.
    object.traverse(child => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || !mesh.visible) return;
      mesh.geometry.computeBoundingBox();
      const local = mesh.geometry.boundingBox!;
      for (const x of [local.min.x, local.max.x])
        for (const y of [local.min.y, local.max.y])
          for (const z of [local.min.z, local.max.z]) {
            const point = new THREE.Vector3(x, y, z).applyMatrix4(mesh.matrixWorld);
            box.expandByPoint(point);
            radius = Math.max(radius, Math.hypot(point.x - center.x, point.z - center.z));
          }
    });
    if (box.isEmpty()) return;
    bounds.expandByPoint(new THREE.Vector3(center.x - radius, box.min.y, center.z - radius));
    bounds.expandByPoint(new THREE.Vector3(center.x + radius, box.max.y, center.z + radius));
  });
  return bounds;
}
