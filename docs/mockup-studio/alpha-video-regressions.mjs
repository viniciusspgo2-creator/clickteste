// Requer Playwright/Chromium e FFmpeg/ffprobe (com libvpx-vp9).
// node docs/mockup-studio/alpha-video-regressions.mjs
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, writeFile, mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';

const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const dir = await mkdtemp(join(tmpdir(), 'clicktools-alpha-'));
const modules = {};
for (const name of ['alpha-video-encoder', 'alpha-webm-muxer']) {
  const source = await readFile(new URL(`../../src/components/tools/mockup/exporters/${name}.ts`, import.meta.url), 'utf8');
  modules[`/${name}.js`] = ts.transpileModule(source, {
    compilerOptions: {target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020},
  }).outputText.replace('"./alpha-webm-muxer"', '"./alpha-webm-muxer.js"');
}
const server = createServer((req, res) => {
  res.setHeader('Content-Type', req.url.endsWith('.js') ? 'text/javascript' : 'text/html');
  res.end(modules[req.url] || '<!doctype html><title>Teste ALFA</title>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}),
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const encoded = await page.evaluate(async () => {
    const {createAlphaVideoEncoder} = await import('/alpha-video-encoder.js');
    const {AlphaWebMMuxer} = await import('/alpha-webm-muxer.js');
    // Incompletos devem ser rejeitados mesmo se tiverem AlphaMode.
    const incomplete = new AlphaWebMMuxer(96, 64, 24);
    incomplete.addChunk('color', new EncodedVideoChunk({type: 'key', timestamp: 0, data: new Uint8Array([1])}));
    let incompleteRejected = false;
    try { incomplete.finalize(1); } catch { incompleteRejected = true; }
    const canvas = document.createElement('canvas');
    canvas.width = 96; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const encoder = await createAlphaVideoEncoder(96, 64, 24);
    let blob;
    try {
      for (let i = 0; i < 60; i++) {
        ctx.clearRect(0, 0, 96, 64);
        ctx.fillStyle = 'red'; ctx.fillRect(16 + i % 4, 16, 24, 24);
        ctx.fillStyle = 'rgba(0,0,255,0.5)'; ctx.fillRect(56, 16, 24, 24);
        await encoder.encode(canvas, Math.round(i * 1e6 / 24), i % 48 === 0);
      }
      blob = await encoder.finalize(60);
    } finally { encoder.close(); }

    // Valida também composição e busca no decoder HTML do navegador.
    const video = document.createElement('video');
    const url = URL.createObjectURL(blob);
    video.src = url;
    await new Promise((resolve, reject) => {video.onloadeddata = resolve; video.onerror = reject;});
    const samples = [];
    for (const time of [0.1, 2.1]) {
      video.currentTime = time;
      await new Promise(resolve => {video.onseeked = resolve;});
      ctx.clearRect(0, 0, 96, 64); ctx.drawImage(video, 0, 0);
      samples.push([ctx.getImageData(2,2,1,1).data[3], ctx.getImageData(28,28,1,1).data[3], ctx.getImageData(64,28,1,1).data[3]]);
    }
    URL.revokeObjectURL(url);
    const original = VideoEncoder.isConfigSupported;
    let unsupportedRejected = false;
    try {
      VideoEncoder.isConfigSupported = async () => ({supported: false});
      await createAlphaVideoEncoder(96,64,24);
    } catch (e) {unsupportedRejected = e.message.includes('não suporta');}
    finally {VideoEncoder.isConfigSupported = original;}
    return {bytes: Array.from(new Uint8Array(await blob.arrayBuffer())), samples, incompleteRejected, unsupportedRejected};
  });
  assert.ok(encoded.incompleteRejected, 'Recusa frame sem máscara');
  assert.ok(encoded.unsupportedRejected, 'Não produz fallback opaco');
  for (const [clear, opaque, half] of encoded.samples) {
    assert.ok(clear <= 2, `Navegador: fundo ${clear}`);
    assert.ok(opaque >= 253, `Navegador: peça ${opaque}`);
    assert.ok(Math.abs(half - 128) <= 3, `Navegador: semitransparência ${half}`);
  }
  const file = join(dir, 'alpha.webm');
  await writeFile(file, new Uint8Array(encoded.bytes));
  const probe = JSON.parse(execFileSync('ffprobe', ['-v','error','-count_frames','-show_streams','-show_format','-of','json',file], {encoding:'utf8'}));
  assert.equal(probe.streams[0].tags.alpha_mode, '1');
  assert.equal(Number(probe.streams[0].nb_read_frames), 60);
  assert.ok(Math.abs(Number(probe.format.duration) - 2.5) < .01);
  const rgba = execFileSync('ffmpeg', ['-v','error','-c:v','libvpx-vp9','-i',file,'-frames:v','1','-f','rawvideo','-pix_fmt','rgba','pipe:1']);
  const sample = (x,y) => [...rgba.subarray((y*96+x)*4,(y*96+x)*4+4)];
  assert.ok(sample(2,2)[3] <= 2);
  assert.ok(sample(28,28)[3] >= 253);
  assert.ok(Math.abs(sample(64,28)[3] - 128) <= 3);
  assert.ok(sample(28,28)[0] > 245, 'Mantém cor da região opaca');
  assert.ok(sample(28,28)[1] < 5, 'Mantém a matriz de cor correta');
  assert.ok(sample(64,28)[2] > 245, 'Mantém cor sem premultiplicar em preto');
  assert.ok(sample(64,28)[1] < 5, 'Mantém a cor da região semitransparente');
  console.log(JSON.stringify({passed:true, frames:60, seconds:probe.format.duration, colorSpace:{matrix:probe.streams[0].color_space,range:probe.streams[0].color_range,transfer:probe.streams[0].color_transfer}, browserAlpha:encoded.samples, ffmpegRGBA:[sample(2,2),sample(28,28),sample(64,28)], bytes:encoded.bytes.length},null,2));
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
  await rm(dir,{recursive:true,force:true});
}
