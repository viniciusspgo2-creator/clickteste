/* eslint-disable react-hooks/immutability -- Three.js GPU handles and transforms intentionally use the engine's imperative API. */
"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { TransformControls } from "@react-three/drei";
import type { TransformControls as TransformControlsImpl } from "three-stdlib";
import {
  useMockupStore,
  type ArtState,
  type MugState,
  type CompanionMug,
} from "../state/store";
import { renderBaseArt } from "../lib/base-art-canvas";
import { createCeramicMaterial } from "./ceramic-material";
import { buildModel, supportHeight } from "./model-geometry";
import { getArtImage } from "../lib/art-registry";
import {
  makeArtTexture,
  renderArtCanvas,
  canvasHeightFor,
  renderMetalMask,
} from "../lib/art-canvas";
import { NEUTRAL_ADJUSTMENTS } from "../lib/art-adjustments";
import { MUG, FLOAT_LIFT, PEDESTAL_H, PLATE_H, detectMobile } from "../lib/config";
import { studioRefs } from "./studio-refs";
import { dragPlane, planarDragDelta, pointerOnPlane, uniformScaleFromGizmo } from "./object-interaction";
import { MUG_CONTACT_LAYER } from "./scene-layout";
import { freehandRotation } from "../lib/freehand-rotation";

// Selection updates may replace a group's userData during a drag. Keep the
// animation pause outside React props so it survives that render.
const transformingObjects = new WeakSet<THREE.Object3D>();
// A canvas has one editing gesture, even when a second finger hits another mug.
const pointerOwners = new WeakMap<HTMLCanvasElement, { id: string; pointerId: number }>();

type ObjectPose = {
  id: string;
  node: THREE.Object3D;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  posY: number;
};
type TransformGesture = {
  kind: "move" | "gizmo" | "rotate-free";
  tool: "move" | "rotate" | "scale";
  pointerId?: number;
  items: ObjectPose[];
  primary: ObjectPose;
  plane?: THREE.Plane;
  anchor?: THREE.Vector3;
  startClientX?: number;
  startClientY?: number;
  controls: typeof studioRefs.controls;
  controlsEnabled: boolean;
  cursor: string;
};
type ArtGesture = {
  x: number; y: number; art: ArtState; pointerId: number;
  controls: typeof studioRefs.controls; controlsEnabled: boolean; cursor: string;
};


function CeramicMaterial({ texture, mug, metalMask, color, basePrint = false }: {
  texture?: THREE.Texture;
  mug: MugState;
  metalMask?: THREE.Texture;
  color?: THREE.ColorRepresentation;
  basePrint?: boolean;
}) {
  const material = useMemo(() => {
    const result = createCeramicMaterial(mug, { map: texture, metalMask, color });
    if (basePrint) {
      // Depth-only offset for the removable bottom print; preserve the
      // ceramic shader, gloss, color and lighting on every surface.
      result.polygonOffset = true;
      result.polygonOffsetFactor = -1;
      result.polygonOffsetUnits = -3;
    }
    return result;
  }, [texture, metalMask, color, basePrint, mug.roughness, mug.clearcoat, mug.reflection, mug.faithfulColor,
      mug.clearcoatRoughness, mug.specularIntensity, mug.glazeStrength]);
  useEffect(() => () => material.dispose(), [material]);
  return <primitive object={material} attach="material" />;
}
function MugObject({
  id,
  mug,
  art,
  showArt = true,
  spinClock,
}: {
  id: string;
  mug: MugState;
  art: ArtState;
  showArt?: boolean;
  spinClock: RefObject<number>;
}) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const floor = useMockupStore((s) => s.bg.floor);
  const float = useMockupStore((s) => s.bg.floatAnim);
  const selected = useMockupStore((s) => s.selectedIds.includes(id));
  const primarySelected = useMockupStore((s) => s.selectedIds[0] === id);
  const tool = useMockupStore((s) => s.tool);
  const snap = useMockupStore((s) => s.snapEnabled);
  const compare = useMockupStore((s) => s.compareArt);
  const [object, setObject] = useState<THREE.Group | null>(null);
  const spinStart = useRef(0);
  const spinBase = useRef<number | null>(null);
  const spinStateRotation = useRef(mug.rotationY);
  const sceneCamera = useMockupStore(s => s.camera);
  const entryGroup = useRef<THREE.Group>(null);
  const dragArt = useRef<ArtGesture | null>(null);
  const gesture = useRef<TransformGesture | null>(null);
  const gizmo = useRef<TransformControlsImpl>(null);
  const controlsBeforePointer = useRef(true);
  const downPointer = useRef(0);
  const attachGizmo = useCallback((control: TransformControlsImpl | null) => {
    gizmo.current = control;
    // Drei's name prop belongs to its empty children group. Name the actual
    // primitive too so captureSceneState can hide it from PNG/video exports.
    if (control) control.name = "studio-gizmo";
  }, []);
  const initialized = useRef(false);
  const entranceStart = useRef<number | null>(null);
  const model = useMemo(() => buildModel(mug.model, mug.handleStyle), [mug.model, mug.handleStyle]);
  useEffect(
    () => () => {
      model.body.dispose();
      model.handle.dispose();
      model.basePrint.dispose();
    },
    [model],
  );
  const outline = useMemo(
    () =>
      new THREE.EdgesGeometry(
        new THREE.BoxGeometry(
          8.5,
          model.def.height,
          model.def.hasHandle ? 11.3 : 8.5,
        ),
      ),
    [model],
  );
  useEffect(() => () => outline.dispose(), [outline]);
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = detectMobile() ? 1536 : 2560;
    c.height = canvasHeightFor(c.width, undefined, mug.model);
    return c;
  }, [mug.model]);
  const texture = useMemo(
    () => makeArtTexture(canvas, gl.capabilities.getMaxAnisotropy()),
    [canvas, gl],
  );
  const metalMask = useMemo(() => {
    if (!art.metallic) return undefined;
    const c = document.createElement("canvas");
    c.width = canvas.width;
    c.height = canvas.height;
    renderMetalMask(c, art);
    const texture = new THREE.CanvasTexture(c);
    texture.wrapS = THREE.RepeatWrapping;
    texture.colorSpace = THREE.NoColorSpace;
    return texture;
  }, [art, canvas]);
  useEffect(() => () => metalMask?.dispose(), [metalMask]);
  const baseTexture = useMemo(() => {
    const c = renderBaseArt(art, mug);
    if (!c) return null;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    // Filter a high-contrast circular print when viewed farther away or obliquely.
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return t;
  }, [art.baseImageId, art.baseScale, art.baseOffsetX, art.baseOffsetY, mug.baseColor, mug.bodyColor, gl]);
  useEffect(() => () => baseTexture?.dispose(), [baseTexture]);
  const effective = useMemo(
    () => ({
      ...art,
      ...(compare ? NEUTRAL_ADJUSTMENTS : {}),
      ...(!showArt ? { imageId: null, text: "" } : {}),
    }),
    [art, compare, showArt],
  );
  useEffect(() => {
    renderArtCanvas(canvas, effective, mug);
    texture.needsUpdate = true;
  }, [canvas, effective, mug, texture]);
  useEffect(() => {
    const restored = () => {
      renderArtCanvas(canvas, effective, mug);
      texture.needsUpdate = true;
    };
    gl.domElement.addEventListener("webglcontextrestored", restored);
    return () =>
      gl.domElement.removeEventListener("webglcontextrestored", restored);
  }, [gl, canvas, texture, effective, mug]);
  useEffect(() => () => texture.dispose(), [texture]);
  const rotation = useMemo(
    () =>
      new THREE.Euler(
        THREE.MathUtils.degToRad(mug.tiltX ?? 0),
        THREE.MathUtils.degToRad(-mug.rotationY),
        THREE.MathUtils.degToRad(mug.tiltZ ?? 0),
      ),
    [mug.tiltX, mug.rotationY, mug.tiltZ],
  );
  const support = useMemo(
    () =>
      supportHeight(model.body, model.handle, rotation, model.def.hasHandle) *
      mug.scale,
    [model, rotation, mug.scale],
  );
  const base =
    (floor === "pedestal"
      ? PEDESTAL_H
      : floor.startsWith("base-")
        ? PLATE_H
        : floor === "flutuante"
          ? FLOAT_LIFT
          : 0) + (mug.posY ?? 0);
  useFrame(({ clock }) => {
    if (!object) return;
    if (transformingObjects.has(object)) {
      spinBase.current = null;
    } else if (!studioRefs.exporting) {
      if (sceneCamera.autoRotate && !mug.locked && (!sceneCamera.spinIds?.length || sceneCamera.spinIds.includes(id))) {
        const phase = spinClock.current / Math.max(3, sceneCamera.secondsPerTurn ?? 8);
        const travel = sceneCamera.direction === "pingpong"
          ? (1 - Math.cos(phase * Math.PI * 2)) * Math.PI
          : phase * Math.PI * 2 * (sceneCamera.direction === "left" ? -1 : 1);
        if (spinBase.current === null || spinStateRotation.current !== mug.rotationY) {
          spinBase.current = object.rotation.y;
          spinStart.current = travel;
          spinStateRotation.current = mug.rotationY;
        }
        object.rotation.y = spinBase.current - (travel - spinStart.current);
      } else if (spinBase.current !== null) {
        // Pause is a real pause: retain the visible pose and persist it once.
        // The next play starts from this angle instead of jumping to the start.
        const paused = THREE.MathUtils.euclideanModulo(-THREE.MathUtils.radToDeg(object.rotation.y), 360);
        spinBase.current = null;
        // A manual turn made while pausing takes precedence over the animation.
        if (spinStateRotation.current === mug.rotationY)
          useMockupStore.getState().patchObject(id, { rotationY: paused });
      }
    }
    if (!initialized.current) {
      initialized.current = true;
      entranceStart.current = clock.elapsedTime;
    }
    if (entryGroup.current) {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const t =
        reduced || studioRefs.exporting
          ? 1
          : Math.min(
              1,
              (clock.elapsedTime - (entranceStart.current ?? 0)) / 1.25,
            );
      const e = 1 - Math.pow(1 - t, 3);
      entryGroup.current.position.y = (1 - e) * 5;
      entryGroup.current.rotation.y = (1 - e) * -0.75;
      entryGroup.current.scale.setScalar(0.82 + 0.18 * e);
    }
    if (
      !studioRefs.exporting &&
      floor === "flutuante" &&
      float &&
      tool === "select" &&
      !transformingObjects.has(object)
    )
      object.position.y =
        base + support + Math.sin(clock.elapsedTime * 1.35) * 0.18;
    if (studioRefs.artRefreshFrames && !studioRefs.exporting) {
      renderArtCanvas(canvas, effective, mug);
      texture.needsUpdate = true;
      if (id === "hero") studioRefs.artRefreshFrames--;
    }
  });
  const finishTransform = useCallback((commit: boolean) => {
    const active = gesture.current;
    if (!active) return;
    gesture.current = null;
    if (pointerOwners.get(gl.domElement)?.id === id) pointerOwners.delete(gl.domElement);
    const updates: Record<string, Partial<MugState>> = {};
    for (const item of active.items) {
      if (commit) {
        const changed = !item.node.position.equals(item.position) ||
          !item.node.rotation.equals(item.rotation) || !item.node.scale.equals(item.scale);
        if (changed) updates[item.id] = {
          posX: item.node.position.x,
          posZ: item.node.position.z,
          posY: item.posY + item.node.position.y - item.position.y,
          tiltX: THREE.MathUtils.radToDeg(item.node.rotation.x),
          rotationY: -THREE.MathUtils.radToDeg(item.node.rotation.y),
          tiltZ: THREE.MathUtils.radToDeg(item.node.rotation.z),
          scale: item.node.scale.x,
        };
      } else {
        item.node.position.copy(item.position);
        item.node.rotation.copy(item.rotation);
        item.node.scale.copy(item.scale);
      }
      transformingObjects.delete(item.node);
    }
    if (Object.keys(updates).length) useMockupStore.getState().commitObjectTransforms(updates);
    if (active.controls) active.controls.enabled = active.controlsEnabled;
    // Drei emits dragging-changed after mouseUp and unconditionally enables
    // OrbitControls. Restore the actual pre-gesture value after that event.
    if (active.kind === "gizmo") queueMicrotask(() => {
      if (active.controls) active.controls.enabled = active.controlsEnabled;
    });
    gl.domElement.style.cursor = active.cursor;
    if (active.pointerId !== undefined && gl.domElement.hasPointerCapture(active.pointerId)) {
      gl.domElement.releasePointerCapture(active.pointerId);
    }
  }, [gl, id]);
  const finishArt = useCallback((cancel = false) => {
    const active = dragArt.current;
    if (!active) return;
    dragArt.current = null;
    if (pointerOwners.get(gl.domElement)?.id === id) pointerOwners.delete(gl.domElement);
    if (cancel) useMockupStore.getState().patchObjectArt(id, {
      offsetX: active.art.offsetX, offsetY: active.art.offsetY,
    });
    if (active.controls) active.controls.enabled = active.controlsEnabled;
    gl.domElement.style.cursor = active.cursor;
    if (gl.domElement.hasPointerCapture(active.pointerId)) gl.domElement.releasePointerCapture(active.pointerId);
  }, [gl, id]);
  const cancelInteraction = useCallback(() => {
    const cancelGizmo = gesture.current?.kind === "gizmo";
    if (cancelGizmo) gizmo.current?.reset();
    finishTransform(false);
    finishArt(true);
    if (cancelGizmo) {
      // Normal pointer-up also clears the library's private dragging/axis state
      // and document listener. All cancellation paths use this same cleanup.
      gl.domElement.ownerDocument.dispatchEvent(new PointerEvent("pointerup", { button: 0 }));
    }
  }, [gl, finishTransform, finishArt]);
  const beginTransform = (kind: TransformGesture["kind"], pointerId = downPointer.current) => {
    if (gesture.current || dragArt.current || pointerOwners.has(gl.domElement)) return null;
    const st = useMockupStore.getState();
    const items: ObjectPose[] = [];
    scene.traverse(node => {
      if (node.name !== "mug-float") return;
      const objectId = node.userData.objectId as string;
      const state = objectId === "hero" ? st.mug : st.companions.find(c => c.id === objectId);
      if (!st.selectedIds.includes(objectId) || !state || state.locked || state.hidden) return;
      items.push({ id: objectId, node, position: node.position.clone(), rotation: node.rotation.clone(),
        scale: node.scale.clone(), posY: state.posY ?? 0 });
    });
    const primary = items.find(item => item.id === id);
    if (!primary) return null;
    const active: TransformGesture = {
      kind, tool: st.tool as TransformGesture["tool"], pointerId, items, primary,
      controls: studioRefs.controls, controlsEnabled: controlsBeforePointer.current,
      cursor: gl.domElement.style.cursor,
    };
    gesture.current = active;
    pointerOwners.set(gl.domElement, { id, pointerId });
    for (const item of items) transformingObjects.add(item.node);
    if (active.controls) active.controls.enabled = false;
    gl.domElement.style.cursor = "grabbing";
    return active;
  };
  const startPointer = (e: ThreeEvent<PointerEvent>) => {
    if (tool === "pan" || e.button !== 0) return;
    e.stopPropagation();
    // A second pointer cannot replace the original pointer's saved camera state.
    if (gesture.current || dragArt.current || pointerOwners.has(gl.domElement)) return;
    const st = useMockupStore.getState();
    const additive = e.shiftKey || e.ctrlKey || e.metaKey;
    // Keep a group selected while dragging one of its members. Modifier clicks
    // only change selection; they never unexpectedly start moving the group.
    if (additive) { st.select(id, true); return; }
    if (!st.selectedIds.includes(id)) st.select(id);
    if (mug.locked || mug.hidden) return;
    const point = e.point.clone();
    const ray = e.ray.clone();
    const { pointerId, clientX, clientY } = e;
    // R3F and TransformControls both listen on the same canvas. Let its native
    // picker claim the event first when a gizmo overlaps the mug silhouette.
    // Direct body dragging starts only if no gizmo claimed that pointer-down.
    queueMicrotask(() => {
      if (gesture.current || dragArt.current || pointerOwners.has(gl.domElement)) return;
      if (tool === "move") {
        const plane = dragPlane(point);
        const anchor = ray.intersectPlane(plane, new THREE.Vector3());
        if (!anchor) return;
        const active = beginTransform("move", pointerId);
        if (!active) return;
        active.plane = plane;
        active.anchor = anchor;
        gl.domElement.setPointerCapture(pointerId);
      } else if (tool === "rotate") {
        // Clicking the gizmo keeps its precise 3-axis controls. Dragging the
        // porcelain itself offers a simpler, unrestricted freehand gesture.
        const active = beginTransform("rotate-free", pointerId);
        if (!active) return;
        active.startClientX = clientX;
        active.startClientY = clientY;
        gl.domElement.setPointerCapture(pointerId);
      } else if (tool === "art") {
        pointerOwners.set(gl.domElement, { id, pointerId });
        dragArt.current = { x: clientX, y: clientY, art, pointerId,
          controls: studioRefs.controls, controlsEnabled: controlsBeforePointer.current,
          cursor: gl.domElement.style.cursor };
        gl.domElement.setPointerCapture(pointerId);
        if (studioRefs.controls) studioRefs.controls.enabled = false;
        gl.domElement.style.cursor = "grabbing";
      }
    });
  };
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const active = gesture.current;
      if (active?.kind === "move" && e.pointerId === active.pointerId && active.plane && active.anchor) {
        const point = pointerOnPlane(e.clientX, e.clientY, gl.domElement.getBoundingClientRect(), camera, active.plane);
        if (!point) return;
        e.preventDefault();
        const delta = planarDragDelta(active.primary.position, active.anchor, point,
          active.items.map(item => item.position), useMockupStore.getState().snapEnabled && !e.altKey);
        for (const item of active.items) {
          item.node.position.x = item.position.x + delta.x;
          item.node.position.z = item.position.z + delta.z;
        }
      }
      if (active?.kind === "rotate-free" && active.pointerId === e.pointerId &&
          active.startClientX !== undefined && active.startClientY !== undefined) {
        e.preventDefault();
        const dx = e.clientX - active.startClientX;
        const dy = e.clientY - active.startClientY;
        for (const item of active.items) {
          // Alt = roll (Z), normal gesture = yaw (Y) and pitch (X).
          // Fine mode and unlimited revolutions share the same pure transform.
          const r = freehandRotation(item.rotation, dx, dy,
            { fine: e.shiftKey, roll: e.altKey });
          item.node.rotation.set(r.x, r.y, r.z, "XYZ");
        }
      }
      const artDrag = dragArt.current;
      if (!artDrag || artDrag.pointerId !== e.pointerId) return;
      useMockupStore.getState().patchObjectArt(id, {
        offsetX: artDrag.art.offsetX + (e.clientX - artDrag.x) / 500,
        offsetY: artDrag.art.offsetY - (e.clientY - artDrag.y) / 250,
      });
    };
    const end = (e: PointerEvent) => {
      if ((gesture.current?.kind === "move" || gesture.current?.kind === "rotate-free") &&
          gesture.current.pointerId === e.pointerId) finishTransform(true);
      if (dragArt.current?.pointerId === e.pointerId) finishArt();
    };
    const cancelPointer = (e: PointerEvent) => {
      const owner = pointerOwners.get(gl.domElement);
      if (owner && owner.pointerId !== e.pointerId) return;
      cancelInteraction();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (gesture.current || dragArt.current)) {
        e.preventDefault();
        cancelInteraction();
      }
    };
    const canvas = gl.domElement;
    const captureControls = (e: PointerEvent) => {
      const owner = pointerOwners.get(canvas);
      if (owner) {
        if (owner.pointerId !== e.pointerId) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
        return;
      }
      controlsBeforePointer.current = studioRefs.controls?.enabled ?? true;
      downPointer.current = e.pointerId;
    };
    canvas.addEventListener("pointerdown", captureControls, true);
    canvas.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", cancelPointer);
    canvas.addEventListener("lostpointercapture", cancelPointer);
    window.addEventListener("blur", cancelInteraction);
    window.addEventListener("keydown", key);
    return () => {
      canvas.removeEventListener("pointerdown", captureControls, true);
      canvas.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      canvas.removeEventListener("pointercancel", cancelPointer);
      canvas.removeEventListener("lostpointercapture", cancelPointer);
      window.removeEventListener("blur", cancelInteraction);
      window.removeEventListener("keydown", key);
      cancelInteraction();
    };
  }, [gl, camera, id, finishTransform, finishArt, cancelInteraction]);
  // Switching tools or locking/deleting the selected object cancels an unfinished
  // gesture, restoring both the pose and the camera's original enabled state.
  useEffect(() => {
    if (mug.locked || mug.hidden || gesture.current && gesture.current.tool !== tool || dragArt.current && tool !== "art") {
      cancelInteraction();
    }
  }, [tool, mug.locked, mug.hidden, cancelInteraction]);
  const handle = mug.handleColor ?? (mug.variant === "white" ? "#ffffff" : mug.accentColor);
  return (
    <>
      <group
        ref={setObject}
        name="mug-float"
        visible={!mug.hidden}
        position={[mug.posX ?? 0, base + support, mug.posZ ?? 0]}
        rotation={rotation}
        scale={mug.scale}
        userData={{ baseY: base + support, objectId: id }}
        onPointerDown={startPointer}
        onDoubleClick={(e) => {
          e.stopPropagation();
          useMockupStore.getState().requestFocus();
        }}
      >
        {selected && tool !== "select" && !mug.hidden && !mug.locked && (
          <lineSegments
            name="selection-outline"
            geometry={outline}
            position={[
              0,
              model.def.height / 2 - MUG.height / 2,
              model.def.hasHandle ? -1.2 : 0,
            ]}
          >
            <lineBasicMaterial
              color="#ff8654"
              transparent
              opacity={0.25}
              depthTest={false}
            />
          </lineSegments>
        )}
        <group ref={entryGroup} name="mug-entrance">
          <group position={[0, -MUG.height / 2, 0]}>
            <mesh
              geometry={model.body}
              castShadow
              receiveShadow
              name={id === "hero" ? "mug-body" : "mug-body-comp"}
              userData={{ objectId: id }}
              onUpdate={mesh => mesh.layers.enable(MUG_CONTACT_LAYER)}
            >
              <CeramicMaterial
                texture={texture}
                mug={mug}
                metalMask={metalMask}
              />
            </mesh>
            {baseTexture && (
              <mesh geometry={model.basePrint} rotation={[0, ((art.baseRotation ?? 0) * Math.PI) / 180, 0]}
                receiveShadow name="mug-base-print" userData={{ objectId: id }}>
                <CeramicMaterial texture={baseTexture} mug={mug} basePrint />
              </mesh>
            )}
            {model.def.hasHandle && (
              <mesh geometry={model.handle} castShadow receiveShadow name="mug-handle" userData={{ objectId: id }}
                onUpdate={mesh => mesh.layers.enable(MUG_CONTACT_LAYER)}>
                <CeramicMaterial color={handle} mug={mug} />
              </mesh>
            )}

          </group>
        </group>
      </group>
      {object &&
        primarySelected &&
        !mug.hidden &&
        !mug.locked &&
        ["move", "rotate", "scale"].includes(tool) && (
          <TransformControls
            object={object}
            mode={
              tool === "move"
                ? "translate"
                : tool === "rotate"
                  ? "rotate"
                  : "scale"
            }
            size={0.8}
            name="studio-gizmo"
            translationSnap={snap ? 0.5 : undefined}
            rotationSnap={snap ? Math.PI / 12 : undefined}
            scaleSnap={snap ? 0.05 : undefined}
            ref={attachGizmo}
            space="world"
            onMouseDown={() => { beginTransform("gizmo"); }}
            onObjectChange={() => {
              const active = gesture.current;
              if (!active || active.kind !== "gizmo") return;
              if (active.tool === "move") {
                const delta = planarDragDelta(active.primary.position, { x: 0, z: 0 },
                  { x: object.position.x - active.primary.position.x, z: object.position.z - active.primary.position.z },
                  active.items.map(item => item.position), false);
                const dy = object.position.y - active.primary.position.y;
                for (const item of active.items) item.node.position.set(
                  item.position.x + delta.x, item.position.y + dy, item.position.z + delta.z);
              } else if (active.tool === "scale") {
                object.scale.setScalar(uniformScaleFromGizmo(object.scale, active.primary.scale));
              }
            }}
            onMouseUp={() => { finishTransform(true); }}
          />
        )}
    </>
  );
}
export function Mug() {
  const art = useMockupStore((s) => s.art),
    mug = useMockupStore((s) => s.mug),
    companions = useMockupStore((s) => s.companions);
  // Um relógio compartilhado mantém todas as canecas no mesmo ritmo,
  // inclusive no vai e volta; exportações não avançam esse relógio.
  const spinClock = useRef(0);
  const rotating = useMockupStore(s => s.camera.autoRotate);
  useFrame((_, delta) => {
    if (studioRefs.exporting) return;
    spinClock.current = rotating ? spinClock.current + delta : 0;
  }, -1); // Antes de TODAS as peças, mesmo das montadas depois da principal.
  return (
    <group name="mockup-mugs">
      <MugObject id="hero" mug={mug} art={art} spinClock={spinClock} />
      {companions.map((c) => (
        <MugObject
          key={c.id}
          id={c.id}
          spinClock={spinClock}
          mug={
            {
              ...mug,
              ...c,
              model: c.model ?? mug.model,
              tiltX: c.tiltX ?? 0,
              tiltZ: c.tiltZ ?? 0,
              posY: c.posY ?? 0,
              hidden: c.hidden ?? false,
              locked: c.locked ?? false,
            } as MugState
          }
          art={c.art ?? art}
          showArt={c.showArt}
        />
      ))}
    </group>
  );
}
