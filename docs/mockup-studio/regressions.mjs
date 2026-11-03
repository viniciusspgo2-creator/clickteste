import fs from "node:fs";
import Module from "node:module";
import { createRequire } from "node:module";
import test from "node:test";
import assert from "node:assert/strict";
const root = new URL("../../", import.meta.url).pathname.replace(/\/$/, "");
const require = createRequire(root + "/package.json");
const ts = require("typescript");
Module._extensions[".ts"] = (mod, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  });
  mod._compile(result.outputText, filename);
};
const { useMockupStore: store } = require(
  root + "/src/components/tools/mockup/state/store.ts",
);
const { adjustPixels } = require(
  root + "/src/components/tools/mockup/lib/art-adjustments.ts",
);
const { resolvePrintArea, PRINT_TOP_MAX, CIRC_CM } = require(
  root + "/src/components/tools/mockup/lib/config.ts",
);
const { buildModel, supportHeight, MODELS } = require(
  root + "/src/components/tools/mockup/scene/model-geometry.ts",
);
const THREE = require("three");
test("full-height full-wrap default plus legacy press mode", () => {
  store.getState().resetAll();
  const area = resolvePrintArea(store.getState().art);
  assert.equal(area.printBottom, 0);
  assert.equal(area.printTop, PRINT_TOP_MAX);
  assert.equal(area.arcCm, CIRC_CM);
  assert.ok(
    Math.abs(resolvePrintArea({ areaMode: "padrao" }).heightCm - 8.7) < 0.001,
  );
});
test("neutral image adjustments preserve every RGBA byte", () => {
  const pixels = new Uint8ClampedArray([
    0, 0, 0, 0, 19, 128, 254, 255, 255, 64, 8, 128,
  ]);
  const original = pixels.slice();
  adjustPixels(pixels, 3, 1, {});
  assert.deepEqual(pixels, original);
});
test("color changes preserve alpha and sharpening leaves flat fields unchanged", () => {
  const p = new Uint8ClampedArray(9 * 4).fill(100);
  for (let i = 3; i < p.length; i += 4) p[i] = 128;
  const o = p.slice();
  adjustPixels(p, 3, 3, { sharpness: 0.7 });
  assert.deepEqual(p, o);
  adjustPixels(p, 3, 3, { brightness: 0.5, temperature: 0.3 });
  assert.ok(p[0] > 100);
  for (let i = 3; i < p.length; i += 4) assert.equal(p[i], 128);
});
test("clone separates the full piece including handle and keeps artwork independent", () => {
  store.getState().resetAll();
  const s = store.getState();
  s.select("hero");
  s.duplicateSelected();
  const c = store.getState().companions[0];
  assert.ok(Math.hypot(c.posX - s.mug.posX, c.posZ - s.mug.posZ) >= 14);
  s.patchObjectArt(c.id, { text: "Independent" });
  assert.notEqual(store.getState().art.text, "Independent");
});
test("locks prevent transforms and artwork edits", () => {
  const c = store.getState().companions[0];
  const s = store.getState();
  s.patchObject(c.id, { locked: true });
  s.patchObject(c.id, { posX: 90 });
  s.patchObjectArt(c.id, { text: "blocked" });
  const current = store.getState().companions[0];
  assert.equal(current.posX, c.posX);
  assert.notEqual(current.art.text, "blocked");
  s.patchObject(c.id, { locked: false });
});
test("undo redo retain objects and layer order", () => {
  const s = store.getState();
  s.select("hero");
  const before = store.getState().companions.length;
  s.duplicateSelected();
  const id = store.getState().companions.at(-1).id;
  s.undo();
  assert.equal(store.getState().companions.length, before);
  s.redo();
  assert.equal(store.getState().companions.length, before + 1);
  assert.ok(store.getState().layerOrder.includes(id));
});
test("all composition presets produce expected counts with finite transforms", () => {
  for (const [k, count] of Object.entries({
    solo: 1,
    pair: 2,
    trio: 3,
    row: 4,
    fan: 3,
    stack: 2,
    gift: 2,
  })) {
    store.getState().compose(k);
    const s = store.getState();
    assert.equal(s.companions.length + 1, count);
    for (const c of s.companions)
      assert.ok(Number.isFinite(c.posX + c.posZ + c.scale));
  }
});
test("all six mug geometries have finite normals UVs and safe support in every orientation", () => {
  for (const model of MODELS) {
    const m = buildModel(model.id);
    for (const a of [
      m.body.attributes.position,
      m.body.attributes.normal,
      m.body.attributes.uv,
    ])
      for (const value of a.array) assert.ok(Number.isFinite(value), model.id);
    for (const x of [0, Math.PI / 2, Math.PI]) {
      const h = supportHeight(
        m.body,
        m.handle,
        new THREE.Euler(x, 0.5, 0.2),
        m.def.hasHandle,
      );
      assert.ok(Number.isFinite(h) && h > 0, model.id);
    }
    m.body.dispose();
    m.handle.dispose();
  }
});

test("hydration preserves valid saved order and drops unknown ids", () => {
  store.getState().compose("pair");
  const s = store.getState();
  const id = s.companions[0].id;
  s.hydrate({
    companions: s.companions,
    layerOrder: [id, "unknown", "hero", id],
  });
  assert.deepEqual(store.getState().layerOrder, [id, "hero"]);
});

const { visibleMugBounds } = require(
  root + "/src/components/tools/mockup/scene/studio-refs.ts",
);
test("framing updates parent transforms before a new render", () => {
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  group.name = "mockup-mugs";
  scene.add(group);
  const object = new THREE.Group();
  group.add(object);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
  object.add(mesh);
  scene.updateMatrixWorld(true);
  object.position.x = 15;
  const box = visibleMugBounds(scene);
  assert.equal(box.min.x, 14);
  assert.equal(box.max.x, 16);
  mesh.geometry.dispose();
});

test("old unsupported containers are migrated to classic on load", () => {
  store.getState().hydrate({ mug: { model: "squeeze" } });
  assert.equal(store.getState().mug.model, "classic");
});
test("20 second video preference loads unchanged", () => {
  store.getState().hydrate({ video: { duration: 20 } });
  assert.equal(store.getState().video.duration, 20);
});
test("reset keeps uploaded artwork only when requested", () => {
  store
    .getState()
    .setArtImage({
      imageId: "demo",
      name: "print.png",
      width: 800,
      height: 600,
    });
  store.getState().resetAll(true);
  assert.equal(store.getState().art.imageId, "demo");
  store.getState().resetAll(false);
  assert.equal(store.getState().art.imageId, null);
});

const { MUG } = require(root + "/src/components/tools/mockup/lib/config.ts");
const { createCeramicMaterial } = require(
  root + "/src/components/tools/mockup/scene/ceramic-material.ts",
);
const { withPngDpi } = require(
  root + "/src/components/tools/mockup/exporters/png-dpi.ts",
);
test("classic 325 ml has an exact straight 8.2 cm wall and 9.55 cm total height", () => {
  const m = buildModel("classic"),
    p = m.body.attributes.position;
  assert.ok(Math.abs(m.body.boundingBox.max.y - 9.55) < 1e-5);
  assert.ok(Math.abs(m.body.boundingBox.min.y) < 1e-6);
  const wall = [];
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i),
      r = Math.hypot(p.getX(i), p.getZ(i));
    if (y > 0.3 && y < 9.3 && r > 3.9) wall.push(r);
  }
  assert.ok(wall.length > 100);
  assert.ok(Math.max(...wall) - Math.min(...wall) < 1e-5, "no taper");
  assert.ok(wall.every((r) => Math.abs(r - 4.1) < 1e-5));
  m.body.dispose();
  m.handle.dispose();
  m.basePrint.dispose();
});
test("classic lip is continuously rounded with the specified wall thickness", () => {
  const m = buildModel("classic"),
    p = m.body.attributes.position;
  const radius = (4.1 - 3.725) / 2,
    cy = 9.55 - radius,
    points = [];
  for (let i = 0; i < p.count; i++)
    if (Math.abs(p.getX(i)) < 1e-7 && p.getZ(i) > 0 && p.getY(i) >= cy - 1e-6) {
      points.push([Math.hypot(p.getX(i), p.getZ(i)), p.getY(i)]);
    }
  assert.ok(points.length >= 33);
  for (const [r, y] of points)
    assert.ok(Math.abs(Math.hypot(r - (4.1 - radius), y - cy) - radius) < 1e-5);
  assert.ok(Math.abs((4.1 - 3.725) * 10 - 3.75) < 1e-8);
  m.body.dispose();
  m.handle.dispose();
  m.basePrint.dispose();
});
test("underside has a 4 mm support ring, a 1.8 mm recess, and an outward facing bottom print", () => {
  const m = buildModel("classic"),
    p = m.body.attributes.position,
    ring = [];
  let centerY;
  for (let i = 0; i < p.count; i++) {
    const r = Math.hypot(p.getX(i), p.getZ(i));
    if (p.getY(i) < 1e-7) ring.push(r);
    if (r < 1e-7 && p.getY(i) < 0.3) centerY = p.getY(i);
  }
  assert.ok(Math.abs(Math.max(...ring) - Math.min(...ring) - 0.4) < 1e-5);
  assert.ok(Math.abs(centerY - 0.18) < 1e-6);
  const n = m.basePrint.attributes.normal;
  assert.ok(n.getY(200) < -0.9);
  m.body.dispose();
  m.handle.dispose();
  m.basePrint.dispose();
});
test("handle welds widen smoothly without entering the ceramic cavity", () => {
  const m = buildModel("classic"),
    p = m.handle.attributes.position;
  let end = 0,
    middle = 0;
  for (let i = 0; i < p.count; i++) {
    assert.ok(
      Math.hypot(p.getX(i), p.getZ(i)) >= MUG.innerR,
      "handle must not pierce interior",
    );
    if (i < 41) end = Math.max(end, Math.abs(p.getX(i)));
    if (i >= 72 * 41 && i < 73 * 41)
      middle = Math.max(middle, Math.abs(p.getX(i)));
  }
  assert.ok(
    end > middle * 1.5,
    "welds must widen rather than taper into the body",
  );
  for (const v of m.handle.attributes.normal.array)
    assert.ok(Number.isFinite(v));
  m.body.dispose();
  m.handle.dispose();
  m.basePrint.dispose();
});
test("body and handle share one ceramic PBR recipe and the same fidelity shader", () => {
  store.getState().resetAll();
  const mug = store.getState().mug;
  const texture = new THREE.Texture();
  const body = createCeramicMaterial(mug, { map: texture });
  const handle = createCeramicMaterial(mug, { color: "#ffffff" });
  for (const key of [
    "roughness",
    "metalness",
    "clearcoat",
    "clearcoatRoughness",
    "ior",
    "specularIntensity",
    "envMapIntensity",
    "toneMapped",
  ])
    assert.equal(body[key], handle[key], key);
  assert.equal(body.roughness, 0.085);
  assert.equal(body.ior, 1.52);
  assert.equal(body.specularIntensity, 0.85);
  assert.equal(body.aoMap, null);
  assert.equal(handle.aoMap, null);
  const shader = () => ({
    uniforms: {},
    fragmentShader: "#include <opaque_fragment>",
  });
  const a = shader(),
    b = shader();
  body.onBeforeCompile(a);
  handle.onBeforeCompile(b);
  assert.equal(a.fragmentShader, b.fragmentShader);
  assert.ok(a.fragmentShader.includes("ceramicReflection"));
  body.dispose();
  handle.dispose();
  texture.dispose();
});
test("PNG print metadata contains real 300 DPI without changing IDAT image data", async () => {
  const original = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==",
    "base64",
  );
  const output = new Uint8Array(
    await (
      await withPngDpi(new Blob([original], { type: "image/png" }), 300)
    ).arrayBuffer(),
  );
  function chunks(data) {
    const list = [];
    const v = new DataView(data.buffer, data.byteOffset, data.byteLength);
    for (let i = 8; i < data.length; ) {
      const n = v.getUint32(i),
        type = String.fromCharCode(...data.subarray(i + 4, i + 8));
      list.push({ type, data: data.slice(i + 8, i + 8 + n) });
      i += n + 12;
    }
    return list;
  }
  const before = chunks(original),
    after = chunks(output),
    physical = after.filter((c) => c.type === "pHYs");
  assert.equal(physical.length, 1);
  const v = new DataView(physical[0].data.buffer);
  assert.equal(v.getUint32(0), 11811);
  assert.equal(v.getUint32(4), 11811);
  assert.equal(physical[0].data[8], 1);
  assert.deepEqual(
    after.find((c) => c.type === "IDAT").data,
    new Uint8Array(before.find((c) => c.type === "IDAT").data),
  );
});

test("full-height artwork reaches the external lip apex and foot, with a clean interior", () => {
  const { V_INT, V_EXT, texV } = require(
    root + "/src/components/tools/mockup/lib/config.ts",
  );
  const m = buildModel("classic"),
    p = m.body.attributes.position,
    uv = m.body.attributes.uv,
    index = m.body.index;
  const rimY = MUG.height - (MUG.topOuterR - MUG.innerR) / 2;
  let printedFoot = 0,
    cleanLip = 0,
    printedApex = 0;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i),
      r = Math.hypot(p.getX(i), p.getZ(i)),
      v = uv.getY(i);
    const lipMidR = (MUG.topOuterR + MUG.innerR) / 2;
    if (y > rimY + 1e-5 && r < lipMidR - 1e-5) {
      assert.ok(Math.abs(v - V_INT) < 1e-6);
      cleanLip++;
    }
    if (y > MUG.height - 1e-5 && Math.abs(v - texV(MUG.height)) < 1e-6)
      printedApex++;
    if (y < 0.001 && r > 3.8 && Math.abs(v - texV(0)) < 1e-6) printedFoot++;
    if (y < 0.001 && r < 3.8)
      assert.ok(Math.abs(v - V_EXT) < 1e-6, "support ring remains unprinted");
  }
  // Every non-degenerate triangle belongs to exactly one UV region.
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3();
  for (let i = 0; i < index.count; i += 3) {
    const ids = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
    a.fromBufferAttribute(p, ids[0]);
    b.fromBufferAttribute(p, ids[1]);
    c.fromBufferAttribute(p, ids[2]);
    if (b.sub(a).cross(c.sub(a)).lengthSq() < 1e-12) continue;
    const regions = ids.map((k) =>
      Math.abs(uv.getY(k) - V_INT) < 1e-6
        ? "interior"
        : Math.abs(uv.getY(k) - V_EXT) < 1e-6
          ? "base"
          : "print",
    );
    assert.equal(
      new Set(regions).size,
      1,
      "UV transition must not stretch ink across a rim triangle",
    );
  }
  assert.ok(printedFoot > 250);
  assert.ok(cleanLip > 250);
  assert.ok(printedApex > 250, "artwork reaches 100% of the outer height");
  m.body.dispose();
  m.handle.dispose();
  m.basePrint.dispose();
});

test("Duo from the legacy panel creates a centered pair, keeps the ceramic finish and requests framing", () => {
  store.getState().resetAll();
  store.getState().patch("mug", { bodyColor: "#ff77aa", glazeStrength: 2.2 });
  store.getState().setZoom(240);
  const before = store.getState().fitNonce;
  store.getState().arrangeScene("duo");
  const s = store.getState(),
    c = s.companions[0];
  assert.equal(s.companions.length, 1);
  assert.equal(s.mug.posX, -c.posX);
  assert.equal(s.mug.posZ, c.posZ);
  assert.equal(s.mug.scale, c.scale);
  assert.equal(c.bodyColor, "#ff77aa");
  assert.equal(c.glazeStrength, 2.2);
  assert.ok(s.fitNonce > before);
  assert.equal(s.zoom, 100);
  assert.deepEqual(s.fitDirection, [0, 0.14, 1]);
});

test("distribution centers every mug and leaves full-turn clearance at larger scales", () => {
  store.getState().resetAll();
  store.getState().patch("mug", { scale: 2 });
  store.getState().compose("row");
  store.getState().spreadEvenly();
  const s = store.getState(),
    objects = [s.mug, ...s.companions].sort((a, b) => a.posX - b.posX);
  assert.equal(objects[0].posX, -objects.at(-1).posX);
  for (let i = 1; i < objects.length; i++)
    assert.ok(objects[i].posX - objects[i - 1].posX >= 30);
  assert.ok(objects.every((o) => o.posZ === 0));
});

const { fitBoundsToView } = require(
  root + "/src/components/tools/mockup/scene/framing.ts",
);
test("the entire group projects inside the canvas in landscape, square and narrow portrait views", () => {
  const box = new THREE.Box3(
    new THREE.Vector3(-24, 0, -8),
    new THREE.Vector3(24, 14, 8),
  );
  for (const aspect of [2, 1, 0.48])
    for (const dir of [
      new THREE.Vector3(0, 0.14, 1),
      new THREE.Vector3(1, 0.42, 0.5),
      new THREE.Vector3(0.01, 1, 0.06),
    ]) {
      const fit = fitBoundsToView(box, dir, 16, aspect),
        camera = new THREE.PerspectiveCamera(16, aspect, 0.1, 3000);
      camera.position.copy(fit.pos);
      camera.lookAt(fit.target);
      camera.updateMatrixWorld(true);
      for (const x of [box.min.x, box.max.x])
        for (const y of [box.min.y, box.max.y])
          for (const z of [box.min.z, box.max.z]) {
            const ndc = new THREE.Vector3(x, y, z).project(camera);
            assert.ok(
              Math.abs(ndc.x) <= 0.807 && Math.abs(ndc.y) <= 0.807,
              JSON.stringify({ aspect, ndc }),
            );
          }
    }
});

test("glossy finishes affect body and handle equally and keep legacy projects compatible", () => {
  const { CERAMIC_FINISHES, ceramicFinishValues } = require(
    root + "/src/components/tools/mockup/lib/ceramic-finishes.ts",
  );
  assert.equal(ceramicFinishValues({}).clearcoatRoughness, 0.075);
  assert.equal(ceramicFinishValues({}).glazeStrength, 1);
  for (const f of CERAMIC_FINISHES) {
    const mug = { ...store.getState().mug, ...f.values, faithfulColor: true };
    const body = createCeramicMaterial(mug, { map: new THREE.Texture() }),
      handle = createCeramicMaterial(mug, { color: "#ffffff" });
    for (const k of [
      "roughness",
      "clearcoat",
      "clearcoatRoughness",
      "specularIntensity",
      "envMapIntensity",
    ])
      assert.equal(body[k], handle[k]);
    const shader = {
      uniforms: {},
      fragmentShader: "#include <opaque_fragment>",
    };
    body.onBeforeCompile(shader);
    assert.equal(
      shader.uniforms.ceramicGlazeStrength.value,
      f.values.glazeStrength,
    );
    assert.ok(
      shader.fragmentShader.includes(
        "ceramicBase + ceramicReflection * ceramicGlazeStrength",
      ),
      "the real HDR reflection stays visible on white ceramic and dark ink",
    );
    body.map.dispose();
    body.dispose();
    handle.dispose();
  }
});

test("full-turn framing stays centered when equal mugs have different Y rotations and ignores selection outlines", () => {
  const { framingBounds } = require(
    root + "/src/components/tools/mockup/scene/framing.ts",
  );
  const scene = new THREE.Scene(),
    group = new THREE.Group();
  group.name = "mockup-mugs";
  scene.add(group);
  const mugs = [];
  for (const x of [-7.5, 7.5]) {
    const mug = new THREE.Group();
    mug.name = "mug-float";
    mug.position.set(x, 4.775, 0);
    group.add(mug);
    mugs.push(mug);
    mug.add(new THREE.Mesh(new THREE.BoxGeometry(8.2, 9.55, 8.2)));
    const handle = new THREE.Mesh(new THREE.BoxGeometry(2, 5, 3));
    handle.position.z = -5.7;
    mug.add(handle);
  }
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(50, 30, 50)),
  );
  outline.name = "selection-outline";
  mugs[0].add(outline);
  for (const angle of [0, 0.4, 1.7, 4.2]) {
    mugs[0].rotation.y = angle;
    mugs[1].rotation.y = angle + 1.3;
    const box = framingBounds(scene, true);
    assert.ok(
      Math.abs(box.getCenter(new THREE.Vector3()).x) < 1e-6,
      "rotation must not offset the group center",
    );
    assert.ok(box.max.x < 16, "outline must not widen the scene");
  }
  group.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
  });
});


test("per-mug reflection gain, environment rotation and exposure survive Three scene-environment overrides", () => {
  const scene = new THREE.Scene(), a = new THREE.Texture(), b = new THREE.Texture();
  scene.environment = a;
  scene.environmentIntensity = 0.6;
  scene.environmentRotation.set(0, 0.8, 0);
  const base = { ...store.getState().mug, faithfulColor: true };
  const none = createCeramicMaterial({ ...base, reflection: 0 });
  const glossy = createCeramicMaterial({ ...base, reflection: 2 });
  for (const material of [none, glossy]) {
    material.onBeforeRender(null, scene);
    assert.equal(material.envMap, a, "an explicit envMap prevents Three replacing the per-object gain");
    assert.equal(material.envMapRotation.y, 0.8);
    assert.equal(material.toneMapped, true, "global exposure must reach the faithful material too");
  }
  assert.equal(none.envMapIntensity, 0);
  assert.equal(glossy.envMapIntensity, 1.2);
  scene.environment = b;
  scene.environmentIntensity = 1.5;
  glossy.onBeforeRender(null, scene);
  assert.equal(glossy.envMap, b, "changing HDRI replaces the bound map");
  assert.equal(glossy.envMapIntensity, 3);
  none.dispose(); glossy.dispose(); a.dispose(); b.dispose();
});

test("glaze is adjustable in both faithful and physical modes and malformed saved values stay finite", () => {
  for (const faithfulColor of [true, false]) {
    for (const glazeStrength of [0, 3]) {
      const material = createCeramicMaterial({ ...store.getState().mug, faithfulColor, glazeStrength });
      const shader = { uniforms: {}, fragmentShader: "#include <opaque_fragment>" };
      material.onBeforeCompile(shader);
      assert.equal(shader.uniforms.ceramicGlazeStrength.value, glazeStrength);
      assert.ok(shader.fragmentShader.includes("ceramicReflection * ceramicGlazeStrength"));
      assert.equal(shader.fragmentShader.includes("float ceramicDiffuseGain"), faithfulColor);
      material.dispose();
    }
  }
  const invalid = createCeramicMaterial({ ...store.getState().mug, roughness: NaN,
    clearcoat: Infinity, clearcoatRoughness: -2, specularIntensity: 9, reflection: NaN });
  assert.ok(Number.isFinite(invalid.roughness));
  assert.equal(invalid.clearcoat, 1);
  assert.equal(invalid.clearcoatRoughness, 0);
  assert.equal(invalid.specularIntensity, 1);
  assert.equal(invalid.envMapIntensity, 0.9);
  invalid.dispose();
});
