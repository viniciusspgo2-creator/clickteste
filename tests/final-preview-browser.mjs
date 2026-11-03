import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { startStudioHarness, toolRequire } from "./helpers/mockup-browser-harness.mjs";

const harness = await startStudioHarness();
const { chromium } = toolRequire("playwright");
const browser = await chromium.launch({ executablePath: process.env.STUDIO_TEST_CHROMIUM || "/usr/bin/chromium",
  headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader", "--use-angle=swiftshader"] });
let checks = 0;
const evidence = [], errors = [];
const check = message => { checks++; console.log(`PASS ${checks}: ${message}`); };
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, hasTouch: true, reducedMotion: "reduce", acceptDownloads: true });
  const page = await context.newPage();
  // Software WebGL can spend tens of seconds compiling the unchanged Studio.
  page.setDefaultTimeout(90000);
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(harness.url);
  await page.waitForFunction(() => window.studioTest?.refs.gl && window.studioTest?.refs.camera, null, { timeout: 90000 });
  await page.evaluate(async () => {
    const t = window.studioTest;
    const text = await (await fetch("/fixtures/legacy-v1.cgstudio")).text();
    await t.portable.importPortableProject(new File([text], "legacy-v1.cgstudio"));
    const s = t.store.getState();
    if (!t.art.getArtImage(s.art.imageId) || !t.art.getArtImage(s.art.baseImageId)) throw new Error("Legacy assets missing");
    s.setExportOpen(true);
  });
  check("projeto legado com arte lateral e inferior abre no Studio real");
  await page.getByRole("button", { name: "Pré-visualizar exportação", exact: true }).click();
  const open = page.getByRole("button", { name: "Ampliar prévia", exact: true });
  await open.waitFor({ timeout: 120000 });
  const snapshot = () => page.evaluate(() => {
    const t = window.studioTest, s = t.store.getState(), camera = t.refs.camera;
    return { captures: t.captures, art: s.art, mug: s.mug, companions: s.companions, light: s.light, bg: s.bg, fx: s.fx,
      cameraState: s.camera, position: camera.position.toArray(), quaternion: camera.quaternion.toArray(), zoom: camera.zoom,
      past: s.past.length, exportSettings: s.exportSettings };
  });
  const before = await snapshot();
  const original = await page.evaluate(async () => {
    const img = document.querySelector('img[alt="Pré-visualização exata da imagem que será exportada"]');
    const blob = window.studioTest.urls.get(img.src);
    return { size: blob.size, type: blob.type, hash: Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()))).map(n => n.toString(16).padStart(2, "0")).join(""), urls: window.studioTest.urls.size };
  });
  await open.click();
  const viewer = page.getByRole("dialog", { name: "Prévia final ampliada", exact: true });
  await viewer.waitFor();
  const image = viewer.getByAltText("Arquivo final exportado", { exact: true });
  await page.waitForFunction(() => { const img = document.querySelector('img[alt="Arquivo final exportado"]'); return img?.complete && img.naturalWidth > 0; });
  const sameBlob = await image.evaluate(img => {
    const inline = document.querySelector('img[alt="Pré-visualização exata da imagem que será exportada"]');
    return window.studioTest.urls.get(img.src) === window.studioTest.urls.get(inline.src);
  });
  assert.equal(sameBlob, true);
  check("ampliação usa o mesmo Blob da prévia final, sem recodificação");
  await viewer.getByRole("button", { name: "100%", exact: true }).click();
  assert.equal(Math.round((await image.boundingBox()).width), 1080);
  const surface = viewer.getByRole("region", { name: "Imagem exportada: zoom e arraste" });
  await surface.focus();
  await page.keyboard.press("+"); await page.keyboard.press("+"); await page.keyboard.press("+");
  const panBefore = await image.getAttribute("style");
  await page.keyboard.press("ArrowRight");
  assert.notEqual(await image.getAttribute("style"), panBefore);
  const box = await surface.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 50, { steps: 5 }); await page.mouse.up();
  await page.mouse.wheel(0, -120);
  for (const key of ["g", "r", "Delete", "Control+z", "Control+d", "Space"]) await page.keyboard.press(key);
  assert.deepEqual(await snapshot(), before);
  check("100%, zoom, roda, arraste e teclado não alteram a câmera, o histórico ou a cena nem geram captura");
  for (let i = 0; i < 15; i++) { await page.keyboard.press("Tab"); assert.equal(await viewer.evaluate(el => el.contains(document.activeElement)), true); }
  check("foco do teclado permanece no visualizador");
  await viewer.getByRole("button", { name: "Ajustar à tela", exact: true }).click();
  const fitted = await image.boundingBox(), viewport = await surface.boundingBox();
  assert.ok(fitted.width <= viewport.width && fitted.height <= viewport.height);
  await page.screenshot({ path: path.join(harness.output, "viewer-desktop.png"), timeout: 90000 });
  evidence.push("viewer-desktop.png");
  const downloadPromise = page.waitForEvent("download");
  await viewer.getByRole("button", { name: "Baixar esta imagem", exact: true }).click();
  const download = await downloadPromise;
  const bytes = await fs.readFile(await download.path());
  assert.equal(createHash("sha256").update(bytes).digest("hex"), original.hash);
  assert.equal(bytes.length, original.size);
  check("download do visualizador é idêntico byte a byte ao arquivo ampliado");
  await page.keyboard.press("Escape");
  await viewer.waitFor({ state: "hidden" });
  await page.waitForFunction(() => document.activeElement?.tagName === "BUTTON" && document.activeElement.textContent === "Ampliar prévia");
  assert.equal(await open.evaluate(el => el === document.activeElement), true);
  assert.equal(await page.evaluate(() => window.studioTest.store.getState().exportOpen), true);
  check("Escape fecha somente a ampliação e devolve foco ao botão de origem");
  for (let i = 0; i < 5; i++) {
    await open.click(); await viewer.getByRole("button", { name: "Fechar prévia ampliada" }).click();
  }
  await page.waitForFunction(n => window.studioTest.urls.size === n, original.urls);
  assert.deepEqual(await snapshot(), before);
  check("cinco reaberturas liberam URLs e preservam o arquivo e o estado do Studio");
  await page.setViewportSize({ width: 390, height: 844 });
  await open.click(); await image.waitFor();
  await viewer.getByRole("button", { name: "100%", exact: true }).click();
  const mobile = await surface.boundingBox(), modal = await viewer.boundingBox();
  assert.ok(modal.x >= 0 && modal.x + modal.width <= 391 && modal.y >= 0 && modal.y + modal.height <= 845);
  const cdp = await context.newCDPSession(page);
  const cx = mobile.x + mobile.width / 2, cy = mobile.y + mobile.height / 2;
  const point = (id, x, y) => ({ id, x, y, radiusX: 2, radiusY: 2, force: 1 });
  const touchBefore = await image.getAttribute("style");
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point(0, cx, cy)] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [point(0, cx + 35, cy + 25)] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert.notEqual(await image.getAttribute("style"), touchBefore);
  const zoomBefore = Number(await viewer.getByRole("slider", { name: "Zoom da imagem" }).inputValue());
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point(0, cx - 40, cy), point(1, cx + 40, cy)] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [point(0, cx - 65, cy), point(1, cx + 65, cy)] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert.ok(Number(await viewer.getByRole("slider", { name: "Zoom da imagem" }).inputValue()) > zoomBefore);
  await viewer.getByRole("button", { name: "Resetar visualização", exact: true }).click();
  await page.screenshot({ path: path.join(harness.output, "viewer-mobile.png"), timeout: 90000 });
  evidence.push("viewer-mobile.png");
  check("viewport móvel comporta modal e controles, arraste de toque e pinça reais do Chromium");
  await page.setViewportSize({ width: 844, height: 390 });
  const landscape = await viewer.boundingBox();
  assert.ok(landscape.x >= 0 && landscape.y >= 0 && landscape.height <= 391);
  await viewer.getByRole("button", { name: "Fechar prévia ampliada" }).click();
  check("mudança de orientação mantém fechamento acessível");
  const saved = await page.evaluate(async () => {
    const t = window.studioTest;
    const text = await (await fetch("/fixtures/multi-assets-v1.cgstudio")).text();
    await t.portable.importPortableProject(new File([text], "multi-assets-v1.cgstudio"));
    t.store.getState().setExportOpen(true);
    await t.projects.autosaveSession();
    t.store.getState().resetAll();
    await t.projects.restoreLastSession();
    const s = t.store.getState();
    s.setExportOpen(true);
    return { count: s.companions.length, hero: !!t.art.getArtImage(s.art.imageId),
      base: !!t.art.getArtImage(s.art.baseImageId), other: !!t.art.getArtImage(s.companions[0]?.art?.imageId),
      distinct: s.art.imageId !== s.companions[0]?.art?.imageId, hdri: !!s.light.hdriId, background: !!s.bg.imageId };
  });
  assert.deepEqual(saved, { count: 1, hero: true, base: true, other: true, distinct: true, hdri: true, background: true });
  const portableDownload = page.waitForEvent("download");
  await page.evaluate(() => window.studioTest.portable.exportPortableProject());
  const portable = JSON.parse(await fs.readFile(await (await portableDownload).path(), "utf8"));
  assert.equal(portable.version, 1); assert.equal(Object.keys(portable.assets).length, 2);
  assert.ok(portable.background && portable.environment?.data && portable.state.art.baseRotation === 15);
  check("IndexedDB e .cgstudio preservam peças distintas, arte inferior, fundo e HDRI, sem campos novos de projeto");
  assert.deepEqual(errors, []);
  await fs.writeFile(path.join(harness.output, "results.json"), JSON.stringify({ checks, evidence, errors, source: "Real Studio components and exporter; isolated host, Chromium SwiftShader, fallback system fonts; no production auth or DB", original }, null, 2));
  console.log(`Browser checks: ${checks}; evidence: ${harness.output}`);
} finally {
  await browser.close();
  await harness.close();
}
