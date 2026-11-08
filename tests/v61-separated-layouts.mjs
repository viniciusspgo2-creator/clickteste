import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';

const require=createRequire(import.meta.url);
const ts=require('typescript');
const file=(name)=>readFileSync(new URL(`../src/${name}`,import.meta.url),'utf8');
const editor=file('components/creative/creative-editor.tsx');
const css=file('components/creative/creative.css');
const presets=file('lib/creative/presets.ts');
const source=file('lib/creative/social-presets.ts');

let sequence=0;
const mod={exports:{}};
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});
assert.equal(code.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
vm.runInNewContext(code.outputText,{exports:mod.exports,module:mod,require(path){
 if(path==='./design')return {uid:()=>`test-${++sequence}`};
 throw new Error(`Import inesperado: ${path}`);
}},{timeout:5000});
const {socialPresets,makeSocialPreset,isSocialLayoutSize}=mod.exports;

test('Modelos de divulgação separados da coleção de canecas anterior',()=>{
 assert.equal(socialPresets.length,12);
 assert.equal(socialPresets.filter(p=>p.format==='feed').length,6);
 assert.equal(socialPresets.filter(p=>p.format==='story').length,6);
 assert.equal(new Set(socialPresets.map(p=>p.id)).size,12);
 assert.match(editor,/Posts e Stories/);
 assert.match(editor,/Artes para Canecas/);
 assert.match(editor,/templateFamily==='social'/);
 assert.match(editor,/templateFamily==='mug'/);
 assert.match(presets,/const W=2480,H=1122/);
 assert.match(editor,/builtInPresets\.map/);
});

test('Cada modelo de Feed é editável e preserva 1080 × 1350',()=>{
 for(const item of socialPresets.filter(p=>p.format==='feed')){
  const doc=makeSocialPreset(item.id);
  assert.equal(doc.width,1080,item.id);assert.equal(doc.height,1350,item.id);
  assert.ok(doc.nodes.length>=7,item.id);
  assert.ok(doc.nodes.every(node=>node.role==='template'),item.id);
  assert.ok(doc.nodes.some(node=>node.kind==='text'),item.id);
  assert.ok(doc.nodes.some(node=>node.kind==='rect'),item.id);
  assert.equal(new Set(doc.nodes.map(n=>n.id)).size,doc.nodes.length,item.id);
 }
});

test('Cada modelo de Story é editável e preserva 1080 × 1920',()=>{
 for(const item of socialPresets.filter(p=>p.format==='story')){
  const doc=makeSocialPreset(item.id);
  assert.equal(doc.width,1080,item.id);assert.equal(doc.height,1920,item.id);
  assert.ok(doc.nodes.some(n=>n.kind==='text'&&n.text.includes(item.footer)),item.id);
  assert.ok(doc.nodes.every(n=>n.role==='template'),item.id);
 }
});

test('Reconhece formatos sociais sem classificar estampas de caneca como posts',()=>{
 assert.equal(isSocialLayoutSize(1080,1350),true);
 assert.equal(isSocialLayoutSize(1080,1920),true);
 assert.equal(isSocialLayoutSize(1080,1080),true);
 assert.equal(isSocialLayoutSize(2480,1122),false);
});

test('Handoff abre a coleção de Posts e Stories e mantém o mockup editável',()=>{
 assert.match(editor,/update\(\(\)=>document\);setSelected\(document.nodes\[0\]\?\.id\?\?null\);setTemplateFamily\('social'\);setSocialFormat\('feed'\)/);
 assert.match(editor,/const keep=detachAutomaticSmartMask\(d\)\.filter\(n=>n\.role!=='template'/);
 assert.match(editor,/nodes:\[\.\.\.base\.nodes,\.\.\.adapted\]/);
 assert.match(editor,/const applySocialPreset=.*makeSocialPreset\(preset\)/);
 assert.match(editor,/setTemplateFamily\(isSocialLayoutSize\(nextDoc\.width,nextDoc\.height\)\?'social':'mug'\)/);
});

test('Coleções e abas de divulgação com distinção visual e acessibilidade',()=>{
 assert.match(editor,/role="group" aria-label="Tipo de modelo"/);
 assert.match(editor,/role="group" aria-label="Formatos de divulgação"/);
 assert.match(editor,/aria-pressed=\{templateFamily==='social'\}/);
 assert.match(editor,/aria-pressed=\{socialFormat==='story'\}/);
 assert.match(css,/\.cr-layout-family button\.active/);
 assert.match(css,/\.cr-social-preset-grid/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
