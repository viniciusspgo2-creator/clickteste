import fs from "node:fs";
import Module, { createRequire } from "node:module";
import test from "node:test";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const ts = require("typescript");
Module._extensions[".ts"] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
const THREE = require("three");
const { planarDragDelta, dragPlane, pointerOnPlane, uniformScaleFromGizmo, isEditorOverlay } = require("../src/components/tools/mockup/scene/object-interaction.ts");
const { useMockupStore: store } = require("../src/components/tools/mockup/state/store.ts");

test("manual drag lets mugs approach each other without collision repulsion", () => {
  const left = { x: -7.5, z: 0 }, right = { x: 7.5, z: 0 };
  const delta = planarDragDelta(left, { x: 0, z: 0 }, { x: 4.123, z: -1.234 }, [left], false);
  assert.ok(Math.abs(delta.x - 4.123) < 1e-9);
  assert.ok(Math.abs(delta.z + 1.234) < 1e-9);
  assert.ok(right.x - (left.x + delta.x) < 15);
});
test("snapping rounds position to half a centimetre, and fine movement bypasses it", () => {
  const origin = { x: 0.2, z: 0.1 };
  const delta = planarDragDelta(origin, { x: 1, z: 2 }, { x: 1.42, z: 2.23 }, [origin], true);
  assert.ok(Math.abs(origin.x + delta.x - 0.5) < 1e-9);
  assert.ok(Math.abs(origin.z + delta.z - 0.5) < 1e-9);
  assert.notDeepEqual(planarDragDelta(origin, { x: 1, z: 2 }, { x: 1.42, z: 2.23 }, [origin], false), delta);
});
test("group movement preserves spacing at physical bounds and rejects invalid rays", () => {
  const items = [{ x: 140, z: -140 }, { x: 148, z: -148 }];
  const delta = planarDragDelta(items[0], { x: 0, z: 0 }, { x: 100, z: -100 }, items, false);
  assert.deepEqual(delta, { x: 2, z: -2 });
  assert.equal((items[1].x + delta.x) - (items[0].x + delta.x), 8);
  assert.deepEqual(planarDragDelta(items[0], { x: NaN, z: 0 }, { x: 0, z: 0 }, items, false), { x: 0, z: 0 });
});
test("fixed drag plane resolves correct world point from a perspective viewport", () => {
  const camera = new THREE.PerspectiveCamera(40, 2, 0.1, 1000);
  camera.position.set(10, 15, 30); camera.lookAt(0, 3, 0); camera.updateMatrixWorld(true);
  const point = new THREE.Vector3(2, 3, -1);
  const projected = point.clone().project(camera);
  const rect = { left: 60, top: 40, width: 1000, height: 500 };
  const hit = pointerOnPlane(rect.left + (projected.x + 1) / 2 * rect.width,
    rect.top + (1 - projected.y) / 2 * rect.height, rect, camera, dragPlane(point));
  assert.ok(hit.distanceTo(point) < 1e-9);
  assert.equal(pointerOnPlane(0, 0, { ...rect, width: 0 }, camera, dragPlane(point)), null);
});
test("gizmo scaling remains uniform and within supported limits", () => {
  assert.equal(uniformScaleFromGizmo(new THREE.Vector3(1, 1.6, 1), new THREE.Vector3(1, 1, 1)), 1.6);
  assert.equal(uniformScaleFromGizmo(new THREE.Vector3(1, 10, 1), new THREE.Vector3(1, 1, 1)), 3);
  assert.equal(uniformScaleFromGizmo(new THREE.Vector3(-1, 1, 1), new THREE.Vector3(1, 1, 1)), 0.2);
});
test("a two-mug gesture creates exactly one independent undo step and redo restores both", () => {
  store.getState().resetAll();
  store.getState().compose("pair");
  const start = store.getState();
  const id = start.companions[0].id;
  const before = { hero: start.mug.posX, other: start.companions[0].posX, history: start.past.length };
  store.getState().commitObjectTransforms({ hero: { posX: -3 }, [id]: { posX: 3 } });
  assert.equal(store.getState().past.length, before.history + 1);
  assert.equal(store.getState().mug.posX, -3);
  assert.equal(store.getState().companions[0].posX, 3);
  store.getState().undo();
  assert.equal(store.getState().mug.posX, before.hero);
  assert.equal(store.getState().companions[0].posX, before.other);
  store.getState().redo();
  assert.equal(store.getState().mug.posX, -3);
  assert.equal(store.getState().companions[0].posX, 3);
  // A second gesture immediately afterwards still gets its own undo step.
  store.getState().commitObjectTransforms({ hero: { posX: -2 } });
  store.getState().undo();
  assert.equal(store.getState().mug.posX, -3);
});
test("atomic transforms preserve locked/hidden objects and never invent missing pieces", () => {
  store.getState().resetAll();
  store.getState().compose("pair");
  const id = store.getState().companions[0].id;
  store.getState().patchObject(id, { locked: true });
  store.getState().patchObject("hero", { hidden: true });
  const before = store.getState();
  store.getState().commitObjectTransforms({ hero: { posX: 50 }, [id]: { posX: 50 }, absent: { posX: 50 } });
  assert.equal(store.getState().mug.posX, before.mug.posX);
  assert.equal(store.getState().companions[0].posX, before.companions[0].posX);
  assert.equal(store.getState().past.length, before.past.length);
});

test("export overlay detection hides the actual installed TransformControls root and restores it without hiding mugs", () => {
  const { TransformControls } = require("three-stdlib");
  const scene = new THREE.Scene();
  const mug = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 2), new THREE.MeshBasicMaterial());
  mug.name = "mug-body";
  scene.add(mug);
  const controls = new TransformControls(new THREE.PerspectiveCamera(), undefined);
  controls.attach(mug);
  scene.add(controls);
  // This installed version is an unnamed Object3D, not TransformControlsRoot.
  assert.equal(controls.type, "Object3D");
  assert.equal(controls.name, "");
  assert.equal(isEditorOverlay(controls), true);
  const hidden = [];
  scene.traverse(object => {
    if (object.visible && isEditorOverlay(object)) {
      object.visible = false;
      hidden.push(object);
    }
  });
  assert.equal(controls.visible, false);
  assert.equal(mug.visible, true);
  assert.ok(hidden.includes(controls));
  for (const object of hidden) object.visible = true;
  assert.equal(controls.visible, true);
  assert.equal(mug.visible, true);
  controls.detach();
  mug.geometry.dispose();
  mug.material.dispose();
});
