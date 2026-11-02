import fs from "node:fs";
import Module, { createRequire } from "node:module";
import test from "node:test";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url), ts = require("typescript");
Module._extensions[".ts"] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
const { analyzeArtPixels, suggestArtLayout, suggestArtTone } = require("../src/components/tools/mockup/lib/art-analysis.ts");
const { adjustPixels } = require("../src/components/tools/mockup/lib/art-adjustments.ts");
const registry = require("../src/components/tools/mockup/lib/art-registry.ts");
const { drawArtIntoArea, computeDpi } = require("../src/components/tools/mockup/lib/art-canvas.ts");
const { useMockupStore } = require("../src/components/tools/mockup/state/store.ts");

test("analysis ignores invisible RGB, detects alpha content and does not brighten pale artwork", () => {
  const p = new Uint8ClampedArray(4 * 4 * 4);
  for (let i = 0; i < p.length; i += 4) p.set([255, 0, 0, 0], i);
  for (const [x, y] of [[1, 1], [2, 1], [1, 2], [2, 2]]) p.set([240, 235, 230, 255], (y * 4 + x) * 4);
  const a = analyzeArtPixels(p, 4, 4);
  assert.equal(a.profile, "light");
  assert.equal(a.transparent, true);
  assert.equal(a.coverage, 0.25);
  assert.deepEqual(a.bounds, { x: 0.25, y: 0.25, width: 0.5, height: 0.5 });
  assert.equal(suggestArtTone(a).brightness, 0);
  assert.equal(suggestArtTone(a).vibrance, 0);
  assert.deepEqual(suggestArtLayout(2000, 1000, 2, a).fit, "contain");
});
test("fit contains portraits and transparent logos, while proportionate opaque panoramas fill", () => {
  const a = analyzeArtPixels(new Uint8ClampedArray([30, 80, 140, 255]), 1, 1);
  assert.equal(suggestArtLayout(1000, 3000, 2.2, a).fit, "contain");
  assert.equal(suggestArtLayout(2200, 1000, 2.2, a).fit, "cover");
  assert.equal(suggestArtLayout(2200, 1000, 2.2, { ...a, transparent: true }).fit, "contain");
  const logo = suggestArtLayout(1000, 1000, 2.2, { ...a, transparent: true,
    bounds: { x: 0.5, y: 0.1, width: 0.4, height: 0.4 } });
  assert.ok(logo.scale > 2 && logo.scale <= 3);
  assert.ok(logo.offsetX < 0, "off-center content on the right must move left");
  assert.ok(logo.offsetY > 0, "content near the top must move down");
  const empty = analyzeArtPixels(new Uint8ClampedArray(16), 2, 2);
  assert.equal(empty.empty, true);
  assert.equal(empty.profile, "empty");
  assert.throws(() => analyzeArtPixels(new Uint8ClampedArray(4), 0, 1), /inválida/);
});
test("PNG sharpening never reads hidden neighboring RGB into a visible edge", () => {
  const p = new Uint8ClampedArray(3 * 3 * 4);
  for (let i = 0; i < p.length; i += 4) p.set([0, 0, 0, 0], i);
  p.set([100, 120, 140, 255], 16);
  const before = p.slice();
  adjustPixels(p, 3, 3, { sharpness: 1 });
  assert.deepEqual(p, before);
  const colors = new Uint8ClampedArray([80, 120, 180, 128]);
  adjustPixels(colors, 1, 1, { brightness: 0.2, saturation: -1 });
  assert.equal(colors[0], colors[1]); assert.equal(colors[1], colors[2]);
  assert.equal(colors[3], 128);
});
test("upload and project save retain exact original bytes, format and dimensions above 8192px", async () => {
  const oldBitmap = globalThis.createImageBitmap;
  let closed = false;
  globalThis.createImageBitmap = async () => ({ width: 10000, height: 1000, close() { closed = true; } });
  try {
    const original = new Blob([new Uint8Array([12, 30, 255, 99])], { type: "image/avif" });
    const e = await registry.loadArtBlob(original, "grande.avif");
    assert.equal(e.width, 10000); assert.equal(e.naturalWidth, 10000);
    assert.equal(e.height, 1000); assert.equal(e.naturalHeight, 1000);
    assert.strictEqual(await registry.getArtBlob(e.id), original);
    assert.equal((await registry.getArtBlob(e.id)).type, "image/avif");
    assert.equal(closed, false);
    registry.removeArtImage(e.id);
    assert.equal(closed, true);
    assert.throws(() => registry.validateArtDimensions(10000, 10000), /64 megapixels/);
    assert.throws(() => registry.validateArtDimensions(NaN, 10), /dimensões/);
  } finally { globalThis.createImageBitmap = oldBitmap; }
});
test("portable image round trips preserve every supported MIME and reject active document payloads", async () => {
  const bytes = Uint8Array.from([0, 22, 255, 101, 90]);
  for (const mime of ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/avif", "image/gif", "image/bmp"]) {
    const b = registry.decodeArtDataUrl(`data:${mime};base64,${Buffer.from(bytes).toString("base64")}`);
    assert.equal(b.type, mime);
    assert.deepEqual(new Uint8Array(await b.arrayBuffer()), bytes);
  }
  assert.throws(() => registry.decodeArtDataUrl("data:text/html;base64,SGVsbG8="), /inválida/);
  assert.throws(() => registry.decodeArtDataUrl("data:image/png;base64,%%%"), /inválida/);
});
test("applying sample or uploaded artwork targets its chosen mug and respects a locked principal", () => {
  const store = useMockupStore;
  store.getState().resetAll();
  store.getState().compose("pair");
  const id = store.getState().companions[0].id;
  const originalHero = store.getState().art.imageId;
  store.getState().patchObject("hero", { locked: true });
  store.getState().patchObjectArt(id, { brightness: 0.5, fit: "stretch" });
  store.getState().setArtImage({ objectId: id, imageId: "test-companion", name: "retrato.png", width: 1000, height: 2000 });
  assert.equal(store.getState().art.imageId, originalHero);
  assert.equal(store.getState().companions[0].art.imageId, "test-companion");
  assert.equal(store.getState().companions[0].art.brightness, 0);
  assert.equal(store.getState().companions[0].art.fit, "contain");
  const history = store.getState().past.length;
  store.getState().setArtImage({ imageId: "test-locked", name: "outra.png", width: 1000, height: 1000 });
  assert.equal(store.getState().art.imageId, originalHero);
  assert.equal(store.getState().past.length, history);
  store.getState().resetAll();
});
test("filters process output-sized pixels, keep the full original and compute real cropped DPI", async () => {
  const oldBitmap = globalThis.createImageBitmap, oldDocument = globalThis.document;
  globalThis.createImageBitmap = async () => ({ width: 10000, height: 1000, close() {} });
  try {
    const e = await registry.loadArtBlob(new Blob(["original"], { type: "image/png" }), "wide.png");
    const generated = [];
    globalThis.document = { createElement() {
      const canvas = { width: 0, height: 0, getContext() { return {
        drawImage() {},
        getImageData(_x, _y, w, h) { return { data: new Uint8ClampedArray(w * h * 4).fill(100) }; },
        putImageData(data) { canvas.gradedPixel = data.data[0]; },
      }; } };
      generated.push(canvas); return canvas;
    } };
    const art = { ...useMockupStore.getState().art, imageId: e.id, fit: "contain", brightness: 0.1 };
    let drawn;
    const context = { save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, drawImage(source) { drawn = source; } };
    drawArtIntoArea(context, 1000, 100, art, 0);
    assert.equal(generated.length, 1);
    assert.equal(drawn.width, 1000); assert.equal(drawn.height, 100);
    assert.equal(drawn.gradedPixel, 110);
    assert.equal(e.source.width, 10000);
    const contained = computeDpi(art);
    const covered = computeDpi({ ...art, fit: "cover" });
    assert.ok(contained > covered * 3, "cropped panorama is enlarged substantially, so its effective DPI must decrease");
    assert.ok(Math.abs(computeDpi({ ...art, scale: 2 }) * 2 - contained) < 0.01);
    registry.removeArtImage(e.id);
  } finally { globalThis.createImageBitmap = oldBitmap; globalThis.document = oldDocument; }
});
