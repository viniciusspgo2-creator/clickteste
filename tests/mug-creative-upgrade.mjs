/** Executar: node --test tests/mug-creative-upgrade.mjs (após npm ci). */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const root=path.resolve(import.meta.dirname,'..');
function src(file){return fs.readFileSync(path.join(root,file),'utf8')}
function loadPure(file){const code=ts.transpileModule(src(file),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const m={exports:{}};const fn=new Function('exports','module','require',code);fn(m.exports,m,()=>{throw Error('Unexpected dependency')});return m.exports;}
test('geometria: 4 cantos redimensionam imagens sem distorção',()=>{
 const {resizeFromCorner}=loadPure('src/lib/creative/geometry.ts');
 const start={x:120,y:90,w:800,h:400,angle:0};
 for(const corner of ['nw','ne','sw','se']){
  const sX=corner.endsWith('w')?-1:1, sY=corner.startsWith('n')?-1:1;
  const r=resizeFromCorner(start,corner,sX*-110,sY*-55,true);
  assert.ok(r.w>0&&r.h>0);
  assert.ok(Math.abs(r.w/r.h-2)<1e-9,`ratio changed at ${corner}`);
  assert.ok(r.w<start.w,`did not shrink at ${corner}`);
 }
});
test('geometria: tamanho mínimo e giro não geram números inválidos',()=>{
 const {resizeFromCorner}=loadPure('src/lib/creative/geometry.ts');
 for(const angle of [0,45,90,-60,180]){
  const r=resizeFromCorner({x:100,y:80,w:200,h:300,angle},'se',-500,-550,true);
  assert.ok(Object.values(r).every(Number.isFinite));assert.ok(r.w>=24&&r.h>=24);
 }
});
test('fundos para canecas: formatos válidos e sem textos',()=>{
 const {backgroundKits,backgroundSvg}=loadPure('src/lib/creative/backgrounds.ts');
 assert.ok(backgroundKits.length>=10);
 for(const kit of backgroundKits){const uri=backgroundSvg(kit.id,2480,1122);const svg=decodeURIComponent(uri.split(',')[1]);assert.match(svg,/<svg /);assert.match(svg,/2480/);assert.doesNotMatch(svg,/<text[\s>]/i);}
});
test('editor: layout preserva a caneca e tem alças de redimensionamento reais',()=>{
 const ed=src('src/components/creative/creative-editor.tsx');
 assert.match(ed,/nodes\.filter\(n=>n\.role!=='template'/);assert.match(ed,/cr-handle/);
 assert.match(ed,/resizeFromCorner/);assert.match(ed,/aspectLock:true/);
 assert.match(ed,/backgroundKits/);assert.ok(ed.includes("addImage(data,true,'mockup')"));
 assert.doesNotMatch(ed,/LOGOS & MASCOTES ORIGINAIS/);
});
test('saída física: exportação PNG especifica metadados 300 DPI',()=>{
 const output=src('src/lib/creative/design.ts');assert.match(output,/withPngDpi/);assert.match(output,/300/);
});
test('TypeScript TSX: todos os arquivos alterados são sintaticamente válidos',()=>{
 for(const file of ['src/components/creative/creative-editor.tsx','src/components/creative/studio-concierge.tsx','src/components/creative/template-gallery.tsx','src/components/tools/mockup/ui/workspace.tsx','src/components/tools/mockup/ui/shadow-presets.tsx','src/components/admin/creative-assets-panel.tsx','src/lib/creative/design.ts','src/lib/creative/backgrounds.ts','src/lib/creative/geometry.ts']){
  const out=ts.transpileModule(src(file),{fileName:file,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}});
  const errors=(out.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
  assert.equal(errors.length,0,`${file}: ${errors.map(e=>ts.flattenDiagnosticMessageText(e.messageText,' ')).join('; ')}`);
 }
});
