/* Referências da cena para uso fora do Canvas (exportadores) */

import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import type { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import type { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import type { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { isEditorOverlay } from "./object-interaction";

export const studioRefs: {
  gl?: THREE.WebGLRenderer;
  scene?: THREE.Scene;
  camera?: THREE.PerspectiveCamera;
  controls?: OrbitControlsImpl | null;
  composer?: EffectComposer | null;
  renderPass?: RenderPass | null;
  gradePass?: ShaderPass | null;
  bloomPass?: UnrealBloomPass | null;
  /** true durante qualquer render offscreen (float parado, sombras estáveis) */
  exporting?: boolean;
  /** true quando o render offscreen é com fundo transparente */
  exportTransparent?: boolean;
  /**
   * Frames restantes de "refresh" da folha da arte após uma exportação.
   * Exportações pesadas podem derrubar/restaurar o contexto WebGL (GPU
   * fraca/driver); o needsUpdate disparado contra o contexto morto se perde.
   * Redesenhar por alguns frames garante que o primeiro frame com contexto
   * realmente vivo re-sobe a textura — a caneca nunca fica branca.
   */
  artRefreshFrames?: number;
} = {};

/** grupo que contém todas as canecas (hero + acompanhantes) */
export function mugsGroup(scene: THREE.Scene): THREE.Object3D | null {
  return (
    scene.getObjectByName("mockup-mugs") ??
    scene.getObjectByName("mockup-mug") ??
    null
  );
}

/**
 * Fixa as canecas flutuantes na pose de descanso (durante exportações
 * estáticas a animação de flutuar fica parada).
 */
export function settleFloaters(scene: THREE.Scene): void {
  scene.traverse((o) => {
    if (o.name === "mug-entrance") {
      o.position.set(0, 0, 0);
      o.rotation.set(0, 0, 0);
      o.scale.setScalar(1);
    }
    if (
      o.name === "mug-float" &&
      typeof (o.userData as { baseY?: number }).baseY === "number"
    ) {
      o.position.y = (o.userData as { baseY: number }).baseY;
    }
  });
}

/** Bounds of visible pieces only. Gizmos and hidden objects never influence export framing. */
export function visibleMugBounds(scene: THREE.Scene): THREE.Box3 {
  const group = mugsGroup(scene);
  // React may request framing before the next WebGL render updates parents.
  // Child bounds must use the newly committed object transforms immediately.
  group?.updateWorldMatrix(true, true);
  const box = new THREE.Box3();
  group?.traverse((o) => {
    if (!(o as THREE.Mesh).isMesh || o.name === "selection-outline") return;
    let p: THREE.Object3D | null = o;
    while (p) {
      if (!p.visible || isEditorOverlay(p)) return;
      p = p.parent;
    }
    box.union(new THREE.Box3().setFromObject(o));
  });
  return box;
}
