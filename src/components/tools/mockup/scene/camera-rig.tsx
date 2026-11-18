/* ============================================================
   Câmera: lente configurável, OrbitControls com inércia,
   presets com transição animada, foco por duplo clique / tecla F.
   ============================================================ */

"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useMockupStore } from "../state/store";
import { lensToFov } from "../lib/config";
import { mugsGroup, studioRefs, visibleMugBounds } from "./studio-refs";
import { fitBoundsToView, framingBounds, interpolateCameraView } from "./framing";
import { frameNdcBounds, clampNdcToFrame, FRAME_MUG_RADIUS } from "./bg-image";
import { CAMERA_NEAR, CAMERA_FAR, MAX_CAMERA_DISTANCE, cameraFarFor, sceneFootprint } from "./scene-layout";

type Anim = {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  t0: number;
  dur: number;
};

/** bus de foco (duplo clique na caneca / tecla F) */
let focusHandler: ((point: THREE.Vector3 | null) => void) | null = null;
export function focusOn(point: THREE.Vector3 | null) {
  focusHandler?.(point);
}

const MUG_CENTER = new THREE.Vector3(0, 4.75, 0);
const transitionDuration = (ms: number) =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms;
const MUG_RADIUS = 7.6; // bounding aproximado com alça

/** aplica a lente na câmera three (mutação intencional do objeto 3D) */
function applyLens(camera: THREE.PerspectiveCamera, lensMm: number) {
  camera.fov = lensToFov(lensMm);
  camera.near = CAMERA_NEAR;
  camera.far = CAMERA_FAR;
  camera.updateProjectionMatrix();
}

function ensureFarPlane(camera: THREE.PerspectiveCamera, far: number) {
  if (Math.abs(camera.far - far) > 0.01) {
    camera.far = far;
    camera.updateProjectionMatrix();
  }
}

/** Descarta o movimento residual do arraste antes de centralizar ou trocar a vista. */
function settleControls(controls: OrbitControlsImpl) {
  const damping = controls.enableDamping;
  controls.enableDamping = false;
  controls.update();
  controls.enableDamping = damping;
}

/** bounding esférico de todas as canecas (hero + acompanhantes) */
function mugsBounding(scene: THREE.Scene | undefined): {
  center: THREE.Vector3;
  radius: number;
} {
  const group = scene ? mugsGroup(scene) : null;
  if (!group) return { center: MUG_CENTER.clone(), radius: MUG_RADIUS };
  const box = visibleMugBounds(scene!);
  if (box.isEmpty()) return { center: MUG_CENTER.clone(), radius: MUG_RADIUS };
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  return {
    center: sphere.center,
    radius: Math.max(MUG_RADIUS * 0.8, sphere.radius * 1.05),
  };
}

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const scene = useThree((s) => s.scene);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const lens = useMockupStore((s) => s.camera.lens);
  const autoRotateSpeed = useMockupStore((s) => s.camera.autoRotateSpeed);
  const presetRequest = useMockupStore((s) => s.presetRequest);
  const focusNonce = useMockupStore((s) => s.focusNonce);
  const fitNonce = useMockupStore((s) => s.fitNonce);
  const zoom = useMockupStore((s) => s.zoom);
  const tool = useMockupStore((s) => s.tool);
  const hero = useMockupStore((s) => s.mug);
  const companions = useMockupStore((s) => s.companions);
  const sceneRadius = sceneFootprint(hero, companions).extent + 50;
  const [orbitLimit, setOrbitLimit] = useState(MAX_CAMERA_DISTANCE);
  const [anim, setAnim] = useState<Anim | null>(null);
  const previousSize = useRef<string | null>(null);
  const previousFit = useRef(0);

  // hook de depuração (útil para suporte e testes)
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__mugCam = camera;
  }, [camera]);

  // registra controls + bounding para os exportadores
  useEffect(() => {
    studioRefs.controls = controlsRef.current;
    return () => {
      studioRefs.controls = undefined;
    };
  }, []);

  // lente
  useEffect(() => {
    applyLens(camera, lens);
  }, [camera, lens]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability -- Camera is a mutable Three.js engine handle.
    camera.zoom = zoom / 100;
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  // registra handler de foco
  useEffect(() => {
    focusHandler = (point) => {
      const controls = controlsRef.current;
      if (!controls) return;
      settleControls(controls);
      const target = point ? point.clone() : mugsBounding(scene).center;
      // enquadra a caneca: aproxima ao raio de enquadramento
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const dist = (mugsBounding(scene).radius / Math.sin(vFov / 2)) * 0.72;
      const dir = new THREE.Vector3()
        .subVectors(camera.position, controls.target)
        .normalize();
      const pos = target
        .clone()
        .add(
          dir.multiplyScalar(
            point
              ? Math.min(dist, camera.position.distanceTo(controls.target))
              : dist,
          ),
        );
      setAnim({
        fromPos: camera.position.clone(),
        toPos: pos,
        fromTarget: controls.target.clone(),
        toTarget: target,
        t0: performance.now(),
        dur: transitionDuration(700),
      });
    };
    return () => {
      focusHandler = null;
    };
  }, [camera, scene]);

  useEffect(() => {
    if (focusNonce) focusHandler?.(null);
  }, [focusNonce]);

  // preset de câmera
  useEffect(() => {
    if (!presetRequest) return;
    setOrbitLimit(Math.max(MAX_CAMERA_DISTANCE, camera.position.distanceTo(controlsRef.current?.target ?? MUG_CENTER) * 1.1, new THREE.Vector3(...presetRequest.pos)
      .distanceTo(new THREE.Vector3(...presetRequest.target)) * 2));
    if (controlsRef.current) settleControls(controlsRef.current);
    setAnim({
      fromPos: camera.position.clone(),
      toPos: new THREE.Vector3(...presetRequest.pos),
      fromTarget: controlsRef.current
        ? controlsRef.current.target.clone()
        : MUG_CENTER.clone(),
      toTarget: new THREE.Vector3(...presetRequest.target),
      t0: performance.now(),
      dur: transitionDuration(850),
    });
  }, [presetRequest, camera]);

  // "Enquadrar tudo": aproxima/afasta para o grupo inteiro caber no quadro
  useEffect(() => {
    const sizeKey = `${size.width}x${size.height}`;
    const resized = previousSize.current !== null && previousSize.current !== sizeKey;
    const initialMobile = previousSize.current === null && size.width < 600;
    previousSize.current = sizeKey;
    const requested = previousFit.current !== fitNonce;
    previousFit.current = fitNonce;
    if (!requested && !resized && !initialMobile) return;
    const controls = controlsRef.current;
    if (!controls) return;
    settleControls(controls);
    const st = useMockupStore.getState();
    const box = framingBounds(scene, st.companions.length > 0 || st.camera.autoRotate);
    if (box.isEmpty()) return;
    const aspect = (size.width || 1) / (size.height || 1);
    const dir = requested && st.fitDirection
      ? new THREE.Vector3(...st.fitDirection)
      : new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    // Com cenário enquadrado, o fit mira o quadro (não a viewport): a
    // caneca passa a ocupar ~80% do quadro, como no Editor 2D. O
    // afastamento é por eixo — um quadro estreito pede muito mais
    // distância na horizontal do que na vertical.
    const frame = frameNdcBounds(camera);
    const padV = frame ? 1.24 / frame.fh : 1.24;
    const padH = frame ? 1.24 / frame.fw : 1.24;
    const { pos, target } = fitBoundsToView(box, dir, camera.fov, aspect, padV, padH);
    setOrbitLimit(Math.max(MAX_CAMERA_DISTANCE, camera.position.distanceTo(controls.target) * 1.1, pos.distanceTo(target) * 2));
    setAnim({
      fromPos: camera.position.clone(),
      toPos: pos,
      fromTarget: controls.target.clone(),
      toTarget: target,
      t0: performance.now(),
      dur: transitionDuration(800),
    });
  }, [fitNonce, scene, camera, size.width, size.height]);

  // distância mínima dinâmica: com cenário enquadrado, dolly/zoom não
  // podem tirar a caneca de dentro do quadro
  const [minDistance, setMinDistance] = useState(6.5);
  const minDistanceRef = useRef(6.5);
  const frameCheckAt = useRef(0);
  const frameMugRef = useRef<{ center: THREE.Vector3; radius: number } | null>(null);

  useFrame((_, delta) => {
    if (studioRefs.exporting) return;
    const controls = controlsRef.current;
    if (!controls) return;
    if (anim) {
      const k = anim.dur === 0 ? 1 : Math.min(1, (performance.now() - anim.t0) / anim.dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; // easeInOutCubic
      const view = interpolateCameraView(anim.fromPos, anim.fromTarget, anim.toPos, anim.toTarget, e);
      camera.position.copy(view.pos);
      controls.target.copy(view.target);
      if (k >= 1) {
        setAnim(null);
      }
      controls.update();
    }
    ensureFarPlane(camera, cameraFarFor(camera.position.distanceTo(controls.target), sceneRadius));
    // --- trava do quadro do cenário ---
    // (1) distância mínima: quanto mais estreito o quadro ou maior o zoom,
    // mais longe a câmera precisa ficar para a caneca caber dentro dele.
    // (2) pan: o alvo não pode levar a caneca para fora do quadro.
    frameCheckAt.current += delta;
    if (frameCheckAt.current > 0.5) {
      frameCheckAt.current = 0;
      const fr = frameNdcBounds(camera);
      if (fr) {
        const box = visibleMugBounds(scene);
        const sphere = box.isEmpty()
          ? { center: new THREE.Vector3(0, 4.75, 0), radius: FRAME_MUG_RADIUS }
          : box.getBoundingSphere(new THREE.Sphere());
        const r = Math.max(FRAME_MUG_RADIUS, sphere.radius || 0);
        frameMugRef.current = { center: sphere.center.clone(), radius: r };
        const zoomF = (useMockupStore.getState().zoom ?? 100) / 100;
        const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
        const limit = fr.fh * Math.min(1, fr.fa);
        // margem de 2%: a caneca nunca encosta exatamente na borda do
        // quadro, onde a faixa do clamp degenera (largura zero).
        const next = Math.max(6.5, (r * zoomF) / (tanV * limit * 0.98));
        if (Math.abs(next - minDistanceRef.current) > 0.5) {
          minDistanceRef.current = next;
          setMinDistance(next);
        }
      } else {
        frameMugRef.current = null;
        if (minDistanceRef.current !== 6.5) {
          minDistanceRef.current = 6.5;
          setMinDistance(6.5);
        }
      }
    }
    const frPan = frameNdcBounds(camera);
    const mugCache = frameMugRef.current;
    if (!anim && frPan && controls && mugCache) {
      const center = mugCache.center;
      const v = center.clone().project(camera);
      const dist = Math.max(camera.position.distanceTo(center), 0.01);
      const zoomF = camera.zoom || 1;
      const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
      const halfH = (mugCache.radius / dist) * zoomF / tanV;
      const halfW = halfH / (camera.aspect || 1);
      // clampNdcToFrame nunca inverte a faixa: se a caneca for maior que
      // o quadro num eixo, o centro fica no meio desse eixo.
      const { x: ax, y: ay } = clampNdcToFrame(v.x, v.y, frPan, halfW, halfH);
      if (
        Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(dist) &&
        (Math.abs(ax - v.x) > 0.001 || Math.abs(ay - v.y) > 0.001)
      ) {
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        // Base da câmera (direita de verdade): right = dir × cima.
        // O código anterior usava cima × dir, que é a ESQUERDA da câmera —
        // a correção horizontal empurrava o alvo para o lado errado, o erro
        // dobrava a cada frame e a câmera voava para o infinito em ~0,1 s
        // (a caneca sumia e a viewport ficava bege e vazia).
        const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
        if (right.lengthSq() < 1e-8) right.set(1, 0, 0); // câmera olhando p/ baixo
        right.normalize();
        const up = new THREE.Vector3().crossVectors(right, dir).normalize();
        const tanH = tanV * (camera.aspect || 1);
        const correction = new THREE.Vector3()
          .addScaledVector(right, (v.x - ax) * tanH * dist)
          .addScaledVector(up, (v.y - ay) * tanV * dist);
        // Rede de segurança: uma correção nunca move o alvo mais que a
        // distância até a caneca num único frame, nem com valores inválidos.
        if (
          correction.lengthSq() > 0 &&
          Number.isFinite(correction.x) && Number.isFinite(correction.y) && Number.isFinite(correction.z)
        ) {
          if (correction.length() > dist) correction.setLength(dist);
          controls.target.add(correction);
        }
      }
    }
  });

  // perda de foco de contexto WebGL — nada a fazer aqui, tratado no Canvas

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan
      mouseButtons={{
        LEFT: tool === "pan" ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      screenSpacePanning
      touches={{ ONE: tool === "pan" ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      onStart={() => setAnim(null)}
      minDistance={minDistance}
      maxDistance={orbitLimit}
      maxPolarAngle={1.54}
      autoRotate={false} // o giro agora move a caneca, não a câmera
      autoRotateSpeed={autoRotateSpeed}
      target={[0, 4.7, 0]}
    />
  );
}
