import fs from "node:fs";
import Module, { createRequire } from "node:module";
import assert from "node:assert/strict";
import test from "node:test";
const require = createRequire(import.meta.url),
  ts = require("typescript");
Module._extensions[".ts"] = (m, f) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(f, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    f,
  );
const THREE = require("three");
const {
  HANDLE_STYLES,
  normalizeHandleStyle,
} = require("../src/components/tools/mockup/lib/handle-styles.ts");
const {
  buildHandleGeometry,
} = require("../src/components/tools/mockup/scene/mug-geometry.ts");
const {
  buildModel,
  supportHeight,
  MODELS,
} = require("../src/components/tools/mockup/scene/model-geometry.ts");
const {
  useMockupStore: store,
} = require("../src/components/tools/mockup/state/store.ts");
const { sceneSize } = require("../src/lib/mockup-scenes/types.ts");
const {
  surfaceSchema,
  catalogInput,
  validatePublication,
} = require("../src/lib/mockup-scenes/validation.ts");
const {
  surfacePoint,
  surfaceAspect,
} = require("../src/lib/mockup-scenes/render.ts");

test("reference handles have finite continuous surfaces, distinct silhouettes and physically supported poses", () => {
  const boxes = [];
  for (const { id } of HANDLE_STYLES) {
    const g = buildHandleGeometry(id),
      p = g.getAttribute("position"),
      n = g.getAttribute("normal");
    for (let i = 0; i < p.count; i++) {
      assert.ok(Number.isFinite(p.getX(i) + p.getY(i) + p.getZ(i)));
      const len = new THREE.Vector3().fromBufferAttribute(n, i).length();
      assert.ok(len > 0.98 && len < 1.02, `${id}: unit surface normals`);
    }
    boxes.push(
      g.boundingBox
        .getSize(new THREE.Vector3())
        .toArray()
        .map((x) => x.toFixed(2))
        .join(","),
    );
    if (id === "spoon")
      assert.ok(g.boundingBox.max.y > 9.55, "spoon bowl extends above the rim");
    if (id === "heart" || id === "heart-asymmetric")
      assert.ok(
        g.boundingBox.min.z < -8,
        "heart silhouette has a broad outer lobe",
      );
    g.dispose();
    for (const def of MODELS) {
      const m = buildModel(def.id, id);
      for (const angles of [
        [0, 0, 0],
        [0.5, 1, 0.3],
        [0, 0, Math.PI],
      ]) {
        const e = new THREE.Euler(...angles),
          q = new THREE.Quaternion().setFromEuler(e),
          h = supportHeight(m.body, m.handle, e, true);
        let min = Infinity;
        for (const geometry of [m.body, m.handle]) {
          const pos = geometry.getAttribute("position");
          for (let i = 0; i < pos.count; i++) {
            const v = new THREE.Vector3().fromBufferAttribute(pos, i);
            v.y -= 9.55 / 2;
            v.applyQuaternion(q);
            min = Math.min(min, v.y + h);
          }
        }
        assert.ok(
          Math.abs(min) < 1e-5,
          `${def.id}/${id} must stay on the floor`,
        );
      }
      m.body.dispose();
      m.handle.dispose();
      m.basePrint.dispose();
    }
  }
  assert.equal(new Set(boxes).size, HANDLE_STYLES.length);
});

test("every reference handle survives project hydration, duplication and independent piece selection", () => {
  for (const { id } of HANDLE_STYLES) {
    store.getState().resetAll();
    store.getState().compose("pair");
    const other = store.getState().companions[0].id;
    store.getState().patchObject(other, { handleStyle: id });
    const saved = JSON.parse(
      JSON.stringify({
        mug: store.getState().mug,
        companions: store.getState().companions,
      }),
    );
    store.getState().resetAll();
    store.getState().hydrate(saved);
    assert.equal(store.getState().companions[0].handleStyle, id);
    assert.equal(store.getState().mug.handleStyle, "classic");
    store.getState().select(other);
    store.getState().duplicateSelected();
    assert.equal(store.getState().companions[1].handleStyle, id);
  }
  assert.equal(normalizeHandleStyle("missing-from-an-old-project"), "classic");
  store.getState().resetAll();
});

test("static export dimensions preserve each supported aspect and cylindrical fitting preserves physical image proportions", () => {
  assert.deepEqual(sceneSize("square", 3000), { width: 3000, height: 3000 });
  assert.deepEqual(sceneSize("portrait", 3000), { width: 2400, height: 3000 });
  assert.deepEqual(sceneSize("landscape", 3000), { width: 3000, height: 2000 });
  const s = {
    topLeft: [0.2, 0.1],
    topRight: [0.8, 0.1],
    bottomLeft: [0.2, 0.8],
    bottomRight: [0.8, 0.8],
    curvature: 0.07,
  };
  assert.deepEqual(surfacePoint(s, 0, 0), s.topLeft);
  assert.ok(
    surfacePoint(s, 1, 0).every((v, i) => Math.abs(v - s.topRight[i]) < 1e-10),
  );
  assert.ok(Math.abs(surfacePoint(s, 0.5, 0)[1] - 0.17) < 1e-8);
  assert.ok(
    surfacePoint(s, 0.25, 0.5)[0] < 0.35,
    "cylinder edges compress the pattern",
  );
  assert.ok(
    Math.abs(surfaceAspect(s, 2000, 1000) / surfaceAspect(s, 1000, 1000) - 2) <
      1e-8,
    "model aspect participates in the art fit",
  );
});

test("invalid preparation and unprepared publication are rejected; seasonal metadata stays bounded", () => {
  const valid = {
    topLeft: [0.2, 0.1],
    topRight: [0.8, 0.1],
    bottomLeft: [0.2, 0.8],
    bottomRight: [0.8, 0.8],
    curvature: 0.07,
  };
  assert.ok(surfaceSchema.safeParse(valid).success);
  assert.ok(
    !surfaceSchema.safeParse({ ...valid, bottomRight: [0.1, 0.8] }).success,
  );
  assert.ok(!surfaceSchema.safeParse({ ...valid, curvature: 3 }).success);
  assert.throws(() => validatePublication("model", "published", null));
  assert.doesNotThrow(() => validatePublication("model", "draft", null));
  assert.doesNotThrow(() =>
    validatePublication("background", "published", null),
  );
  assert.doesNotThrow(() => validatePublication("model", "published", valid));
  assert.equal(
    catalogInput.parse({
      name: " Natal ",
      category: " Sazonais ",
      tags: [" presente "],
      status: "draft",
    }).name,
    "Natal",
  );
  assert.ok(
    !catalogInput.safeParse({ name: "n", category: "x", status: "published" })
      .success,
  );
});
