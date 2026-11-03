import fs from "node:fs";
import Module, { createRequire } from "node:module";
import test from "node:test";
import assert from "node:assert/strict";
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
const {
  hexToHsv,
  hsvToHex,
  ceramicColorPatch,
  normalizeHexColor,
} = require("../src/components/tools/mockup/lib/ceramic-colors.ts");
const {
  useMockupStore: store,
} = require("../src/components/tools/mockup/state/store.ts");

test("the free picker covers RGB colors without quantization loss and keeps hue at white/black", () => {
  const steps = [0, 1, 31, 127, 128, 254, 255];
  for (const r of steps)
    for (const g of steps)
      for (const b of steps) {
        const color =
          "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
        assert.equal(hsvToHex(hexToHsv(color)), color);
      }
  assert.equal(hexToHsv("#ffffff", 217).h, 217);
  assert.equal(hexToHsv("#000000", 81).h, 81);
  for (const [h, color] of [
    [0, "#ff0000"],
    [60, "#ffff00"],
    [120, "#00ff00"],
    [180, "#00ffff"],
    [240, "#0000ff"],
    [300, "#ff00ff"],
    [360, "#ff0000"],
  ])
    assert.equal(hsvToHex({ h, s: 1, v: 1 }), color);
  assert.equal(normalizeHexColor(" 7B2CBF "), "#7b2cbf");
  assert.equal(normalizeHexColor("#1"), null);
  assert.equal(normalizeHexColor("red"), null);
  assert.equal(normalizeHexColor("#ffzz12"), null);
});

test("body, handle and interior edits stay independent, preserve the art and survive project restoration", () => {
  store.getState().resetAll();
  store.getState().compose("pair");
  const other = store.getState().companions[0].id;
  store
    .getState()
    .setArtImage({
      objectId: "hero",
      imageId: "unchanged-art",
      name: "photo.png",
      width: 1500,
      height: 2000,
    });
  const before = structuredClone(store.getState().mug),
    art = store.getState().art,
    companion = structuredClone(store.getState().companions[0]);
  store
    .getState()
    .patchObject("hero", ceramicColorPatch("interior", "#7b2cbf"));
  assert.equal(store.getState().mug.interiorColor, "#7b2cbf");
  assert.equal(store.getState().mug.bodyColor, before.bodyColor);
  assert.equal(store.getState().mug.handleColor, before.handleColor);
  assert.equal(store.getState().mug.baseColor, before.baseColor);
  assert.equal(store.getState().art, art);
  store.getState().patchObject("hero", ceramicColorPatch("body", "#19a87b"));
  store.getState().patchObject("hero", ceramicColorPatch("handle", "#f89830"));
  assert.equal(store.getState().mug.interiorColor, "#7b2cbf");
  assert.equal(store.getState().mug.bodyColor, "#19a87b");
  assert.equal(store.getState().mug.handleColor, "#f89830");
  assert.deepEqual(store.getState().companions[0], companion);
  const saved = JSON.parse(
    JSON.stringify({
      mug: store.getState().mug,
      companions: store.getState().companions,
      art: store.getState().art,
    }),
  );
  store.getState().resetAll();
  store.getState().hydrate(saved);
  assert.equal(store.getState().mug.interiorColor, "#7b2cbf");
  assert.equal(store.getState().mug.bodyColor, "#19a87b");
  assert.equal(store.getState().mug.handleColor, "#f89830");
  assert.equal(store.getState().art.imageId, "unchanged-art");
  store.getState().patchObject(other, ceramicColorPatch("interior", "#4268a1"));
  assert.equal(store.getState().mug.interiorColor, "#7b2cbf");
  assert.equal(store.getState().companions[0].interiorColor, "#4268a1");
  store.getState().resetAll();
});

test("whole-mug coloring still includes the base, while locked pieces and incomplete HEX cannot be recolored", () => {
  store.getState().resetAll();
  store.getState().patchObject("hero", ceramicColorPatch("all", "#556677"));
  let m = store.getState().mug;
  for (const key of ["bodyColor", "handleColor", "interiorColor", "baseColor"])
    assert.equal(m[key], "#556677");
  assert.equal(m.variant, "accent");
  store.getState().patchObject("hero", { locked: true });
  store
    .getState()
    .patchObject("hero", ceramicColorPatch("interior", "#ff0000"));
  assert.equal(store.getState().mug.interiorColor, "#556677");
  assert.deepEqual(ceramicColorPatch("all", "#1"), {});
  assert.deepEqual(ceramicColorPatch("body", "invalid"), {});
  store.getState().resetAll();
});
