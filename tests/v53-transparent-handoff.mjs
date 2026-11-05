import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = resolve(import.meta.dirname, '..');
function load(file, stubs = {}) {
  const abs = resolve(root, file);
  const result = ts.transpileModule(readFileSync(abs,'utf8'), {
    fileName: abs, reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, strict:true },
  });
  assert.deepEqual((result.diagnostics || []).filter(d=>d.category === ts.DiagnosticCategory.Error), []);
  const fixtureModule = { exports: {} };
  new Function('module','exports','require',result.outputText)(fixtureModule,fixtureModule.exports,dep=>{
    if (Object.hasOwn(stubs,dep)) return stubs[dep];
    throw Error('unexpected import '+dep);
  });
  return fixtureModule.exports;
}
const { findVisibleAlphaBounds, trimTransparentMockup } = load('src/lib/creative/transparent-crop.ts');
function pixels(w,h,x,y,cw,ch,alpha=255){
  const p=new Uint8ClampedArray(w*h*4);
  for(let yy=y;yy<y+ch;yy++) for(let xx=x;xx<x+cw;xx++) p[(yy*w+xx)*4+3]=alpha;
  return p;
}
test('V5.3: crops the alpha bounds with a small safety margin and preserves aspect',()=>{
  const r=findVisibleAlphaBounds(pixels(200,100,70,20,40,50),200,100,{paddingFraction:.025});
  assert.deepEqual(r,{x:68,y:18,width:44,height:54});
});
test('V5.3: includes soft edge pixels and never trims the ceramic surface',()=>{
  const p=pixels(60,60,20,20,20,20,255);
  p[(19*60+21)*4+3]=3;
  const r=findVisibleAlphaBounds(p,60,60,{alphaThreshold:2,paddingFraction:0});
  assert.deepEqual(r,{x:20,y:19,width:20,height:21});
});
test('V5.3: empty image rejected and source dimensions guarded',()=>{
  assert.equal(findVisibleAlphaBounds(new Uint8ClampedArray(48),4,3),null);
  assert.throws(()=>findVisibleAlphaBounds(new Uint8ClampedArray(5),10,10),/inválidas/);
  assert.throws(()=>findVisibleAlphaBounds(new Uint8ClampedArray(0),5000,5000),/inválidas/);
});
test('V5.3: padding clamps to canvas, even on the edges',()=>{
  assert.deepEqual(findVisibleAlphaBounds(pixels(40,30,0,0,2,2),40,30,{paddingFraction:.1}),{x:0,y:0,width:3,height:3});
});
test('V5.3: Studio writes trimmed PNG to IndexedDB and does not upload',()=>{
  const panels=readFileSync(resolve(root,'src/components/tools/mockup/ui/panels.tsx'),'utf8');
  assert.match(panels,/const handoff = await trimTransparentMockup\(res\.blob\)/);
  assert.match(panels,/await writeHandoff\(handoff\.blob\)/);
  assert.match(panels,/disabled=\{busy \|\| sending\}/);
  assert.doesNotMatch(panels,/await writeHandoff\(res\.blob\)/);
  assert.match(readFileSync(resolve(root,'src/lib/creative/handoff.ts'),'utf8'),/indexedDB/);
});
test('V5.3: browser crop closes image resources and exports real PNG',()=>{
  const source=readFileSync(resolve(root,'src/lib/creative/transparent-crop.ts'),'utf8');
  assert.match(source,/bitmap\?\.close\(\)/);
  assert.match(source,/URL\.revokeObjectURL\(objectUrl\)/);
  assert.match(source,/output\.toBlob/);
  assert.match(source,/image\/png/);
});
test('V5.3: mismatched WebP MIME is rejected before download',()=>{
  const source=readFileSync(resolve(root,'src/components/tools/mockup/exporters/image-exporter.ts'),'utf8');
  assert.match(source,/if \(blob\.type !== mime\)/);
});
