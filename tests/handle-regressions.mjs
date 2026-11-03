import fs from "node:fs";
import Module, { createRequire } from "node:module";
import assert from "node:assert/strict";
import test from "node:test";

const require = createRequire(import.meta.url), ts = require("typescript");
Module._extensions[".ts"] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, f);
const THREE = require("three");
const { HANDLE_STYLES } = require("../src/components/tools/mockup/lib/handle-styles.ts");
const { buildModel, MODELS } = require("../src/components/tools/mockup/scene/model-geometry.ts");
const { profileRadius } = require("../src/components/tools/mockup/scene/mug-geometry.ts");
const { createCeramicMaterial } = require("../src/components/tools/mockup/scene/ceramic-material.ts");
const { DEFAULT_CERAMIC_FINISH } = require("../src/components/tools/mockup/lib/ceramic-finishes.ts");
const { MUG } = require("../src/components/tools/mockup/lib/config.ts");
const { fitBoundsToView } = require("../src/components/tools/mockup/scene/framing.ts");

function wallAt(model, p, i, height) {
  const y = p.getY(i) * MUG.height / height;
  const angle = Math.atan2(p.getZ(i), p.getX(i));
  const scale = model === "square"
    ? 0.88 / (Math.abs(Math.cos(angle)) ** 6 + Math.abs(Math.sin(angle)) ** 6) ** (1 / 6)
    : 1;
  const rimY = MUG.height - (MUG.topOuterR - MUG.innerR) / 2;
  const outer = profileRadius(model, (y - MUG.baseBevel) / (rimY - MUG.baseBevel)) * scale;
  return { y, radius: Math.hypot(p.getX(i), p.getZ(i)), outer, inner: outer - (MUG.topOuterR - MUG.innerR) * scale };
}
function dispose(model) { model.body.dispose(); model.handle.dispose(); model.basePrint.dispose(); }

test("oval starts white and its ceramic material preserves the selected pigment without a metal tint", () => {
  assert.equal(HANDLE_STYLES.find(s => s.id === "oval-gold").color, "#ffffff");
  for (const color of ["#ffffff", "#19a87b", "#3366cc", "#f67587", "#000000"]) {
    const mat = createCeramicMaterial({ ...DEFAULT_CERAMIC_FINISH, faithfulColor: true }, { color });
    assert.equal("#" + mat.color.getHexString(), color);
    assert.equal(mat.metalness, 0);
    assert.equal(mat.metalnessMap, null);
    mat.dispose();
  }
});

test("the complete spoon bowl and stem clear the body of every supported mug", () => {
  for (const { id } of MODELS) {
    const model = buildModel(id, "spoon"), p = model.handle.getAttribute("position");
    const start = model.handle.userData.spoonVertexStart;
    assert.ok(start > 5900 && start < p.count);
    let nearest = Infinity;
    for (let i = start; i < p.count; i++) {
      const { y, radius, outer } = wallAt(id, p, i, model.def.height);
      if (y > 0 && y < MUG.height) nearest = Math.min(nearest, radius - outer);
    }
    assert.ok(nearest > 0.1, `${id}: spoon clearance ${nearest.toFixed(4)} cm`);
    dispose(model);
  }
});

test("both heart roots and all reference handle end rings stay buried in the ceramic wall", () => {
  for (const { id } of MODELS) for (const style of ["heart", "heart-asymmetric", "spoon", "oval-gold"]) {
    const model = buildModel(id, style), p = model.handle.getAttribute("position");
    for (const start of [0, 144 * 41]) for (let j = 0; j < 41; j++) {
      const { radius, outer, inner } = wallAt(id, p, start + j, model.def.height);
      assert.ok(radius < outer - 0.04, `${id}/${style}: exposed root at ${start + j}`);
      assert.ok(radius > inner + 0.04, `${id}/${style}: root penetrates the inner wall`);
    }
    // A triangle fan closes each end, including the lower heart attachment.
    const index = model.handle.getIndex();
    for (const center of [145 * 41, 145 * 41 + 1]) {
      let faces = 0;
      for (let i = 0; i < index.count; i += 3)
        if ([index.getX(i), index.getX(i + 1), index.getX(i + 2)].includes(center)) faces++;
      assert.equal(faces, 40, `${id}/${style}: incomplete end cap`);
    }
    dispose(model);
  }
});

test("actual body and reference handle bounds fit lateral, top and perspective views on narrow canvases", () => {
  for (const style of ["spoon", "heart", "heart-asymmetric", "oval-gold"]) {
    const model = buildModel("classic", style);
    const box = model.body.boundingBox.clone().union(model.handle.boundingBox);
    for (const aspect of [0.4, 0.96, 1.5]) for (const dir of [
      new THREE.Vector3(1, 0.1, -0.35), new THREE.Vector3(1, 0.42, 0.5), new THREE.Vector3(0.01, 1, 0.06),
    ]) {
      const fit = fitBoundsToView(box, dir, 16, aspect);
      const camera = new THREE.PerspectiveCamera(16, aspect, 0.1, 1000);
      camera.position.copy(fit.pos); camera.lookAt(fit.target); camera.updateMatrixWorld(true);
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
        const p = new THREE.Vector3(x, y, z).project(camera);
        assert.ok(Math.abs(p.x) < 0.95 && Math.abs(p.y) < 0.95, `${style}: clipped at aspect ${aspect}`);
      }
    }
    dispose(model);
  }
});
