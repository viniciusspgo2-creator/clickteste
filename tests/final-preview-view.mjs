import fs from "node:fs";
import Module, { createRequire } from "node:module";
import test from "node:test";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url), ts = require("typescript");
Module._extensions[".ts"] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
const { fitPreview, constrainPreview, zoomPreview } = require("../src/components/tools/mockup/lib/preview-view.ts");
const image = { width: 4000, height: 3000 }, area = { width: 1000, height: 700 };

test("fit shows the entire export, including portrait and mobile views, without enlarging small files", () => {
  for (const source of [image, { width: 1080, height: 1920 }, { width: 8192, height: 8192 }]) {
    for (const viewport of [area, { width: 300, height: 230 }]) {
      const v = fitPreview(source, viewport);
      assert.ok(source.width * v.scale <= viewport.width);
      assert.ok(source.height * v.scale <= viewport.height);
      assert.equal(Math.abs(v.x), 0); assert.equal(Math.abs(v.y), 0);
    }
  }
  assert.equal(fitPreview({ width: 50, height: 30 }, area).scale, 1);
});
test("100 percent means one image pixel per CSS pixel, not the fitted scale", () => {
  const full = zoomPreview(fitPreview(image, area), 1, { x: 0, y: 0 }, image, area);
  assert.equal(full.scale, 1);
  assert.ok(full.scale > fitPreview(image, area).scale);
});
test("zoom keeps the pixel beneath the mouse or pinch anchor in place", () => {
  const old = { scale: 1, x: 50, y: -30 }, anchor = { x: 120, y: -80 };
  const v = zoomPreview(old, 2, anchor, image, area);
  assert.equal((anchor.x - old.x) / old.scale, (anchor.x - v.x) / v.scale);
  assert.equal((anchor.y - old.y) / old.scale, (anchor.y - v.y) / v.scale);
});
test("pan stays inside the image and recenters content smaller than the viewport", () => {
  const v = constrainPreview({ scale: 1, x: 100000, y: -100000 }, image, area);
  assert.ok(v.x < image.width / 2); assert.ok(v.y > -image.height / 2);
  const fit = constrainPreview({ scale: 0.01, x: 1000, y: -1000 }, image, area);
  assert.equal(Math.abs(fit.x), 0); assert.equal(Math.abs(fit.y), 0);
});
test("zoom is bounded and malformed numeric input never produces NaN or Infinity", () => {
  for (const value of [-Infinity, -100, 0, Infinity, NaN, 100]) {
    const v = constrainPreview({ scale: value, x: Infinity, y: NaN }, image, area);
    assert.ok(v.scale >= 0.01 && v.scale <= 8);
    assert.ok(Object.values(v).every(Number.isFinite));
  }
});
test("fit can be repeated after zoom and rotation/resize without mutating the export dimensions", () => {
  const original = { ...image };
  const initial = fitPreview(image, area);
  zoomPreview(initial, 4, { x: 12, y: 30 }, image, area);
  assert.deepEqual(fitPreview(image, area), initial);
  assert.deepEqual(image, original);
  const portraitArea = { width: 390, height: 600 };
  assert.notDeepEqual(fitPreview(image, portraitArea), initial);
});
