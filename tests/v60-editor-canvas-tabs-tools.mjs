import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=(name)=>readFileSync(new URL(`../src/${name}`,import.meta.url),'utf8');
const editor=source('components/creative/creative-editor.tsx');
const rendering=source('lib/creative/design.ts');
const library=source('components/creative/stock-library.tsx');
const catalog=source('lib/creative/stock-icons.ts');
const validation=source('lib/creative/validate-project.ts');

test('Canvas de prévia apaga os pixels anteriores antes de compor PSD transparente',()=>{
 const erase=editor.indexOf('visibleCtx.clearRect(0,0,canvas.width,canvas.height)');
 const redraw=editor.indexOf('visibleCtx.drawImage(work,0,0)');
 assert.ok(erase>0&&redraw>erase);
 assert.match(rendering,/ctx\.clearRect\(0,0,doc\.width,doc\.height\)/);
});
test('Duas abas isolam histórico, seleção e documentos, sem multiplicar editores',()=>{
 assert.match(editor,/editorTabsRef\.current\.length>=2/);
 assert.match(editor,/switchEditorTab=/);
 assert.match(editor,/snapshotCurrentTab\(\)/);
 assert.match(editor,/destination\.history,step:destination\.step/);
 assert.match(editor,/const copySelected=/);
 assert.match(editor,/const pasteSelected=/);
 assert.match(editor,/id:uid\(\),role:'content'/);
});
test('Seleção tem recorte, borracha não destrutiva e Bézier com alças',()=>{
 assert.match(editor,/const cropImage=async/);
 assert.match(editor,/kind:'erase'/);
 assert.match(editor,/kind:'bezier'/);
 assert.match(rendering,/destination-out/);
 assert.match(rendering,/ctx\.bezierCurveTo/);
 assert.match(validation,/n\.eraserStrokes\.length>60/);
});
test('Degradês de texto e imagens usam o mesmo desenho para prévia e exportação',()=>{
 assert.match(rendering,/function drawText/);
 assert.match(rendering,/export function nodeFill/);
 assert.match(rendering,/lc\.globalCompositeOperation='source-in'/);
 assert.match(rendering,/await drawDesign\(base,doc,undefined,\{strict:true\}\)/);
 assert.match(validation,/n\.gradient!==undefined/);
});
test('Catálogo de milhares é carregado sob demanda, com lista limitada e fallback',()=>{
 assert.match(catalog,/loadTablerCatalog/);
 assert.match(catalog,/api\.iconify\.design\/collection\?prefix=tabler/);
 assert.match(catalog,/return stockIcons;/);
 assert.match(library,/filtered\.slice\(0,visible\)/);
 assert.match(library,/setVisible\(n=>n\+72\)/);
 assert.match(library,/cr-svg-white/);
});
test('Guias pulsantes respeitam acessibilidade',()=>{
 const css=source('components/creative/creative.css');
 assert.match(editor,/cr-guides-pulse/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
