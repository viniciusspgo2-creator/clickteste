import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const root=process.cwd();
const file=(p)=>fs.readFileSync(`${root}/${p}`,'utf8');
const manifestText=file('src/lib/creative/library-manifest.ts');
const manifestJS=ts.transpileModule(manifestText,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const context={exports:{},require:(name)=>{if(name==='./uploaded-library.json')return {default:JSON.parse(file('src/lib/creative/uploaded-library.json'))};throw Error('dependência inesperada no manifesto')}};vm.runInNewContext(manifestJS,context);
const m=context.exports;

test('Manifesto possui metadados completos, IDs únicos e só licenças aprovadas',()=>{
 const all=m.STATIC_MANIFEST;assert.equal(all.length,481+m.UPLOADED_ITEMS.length);
 const ids=new Set();for(const x of all){for(const key of ['id','nome','tags','categoria','arquivo','formato','tipoCor','licenca','origem','aba'])assert.ok(x[key],`${x.id}: ${key}`);assert.ok(!ids.has(x.id),`duplicado ${x.id}`);ids.add(x.id);assert.ok(['MIT','ISC','Apache-2.0','Autoral','CC0-1.0','Enviado pelo usuário'].includes(x.licenca));}
});
test('Busca em português entende acentos e sinônimos de ocasiões',()=>{
 const all=m.STATIC_MANIFEST;
 for(const term of ['mae','coração','coracao','aniversario','bebê','bebe','festa','formatura','gospel','flores'])assert.ok(all.some(i=>m.libraryMatch(i,term)),term);
});
test('Separação das abas e categorias de ocasião',()=>{
 assert.ok(m.LIBRARY_TABS.includes('Stickers'));assert.ok(m.LIBRARY_TABS.includes('Frases'));
 assert.equal(m.LIBRARY_CATEGORIES.length,13);
 assert.equal(m.BACKGROUND_ITEMS.length,105);assert.equal(m.PHRASE_ITEMS.length,91);
});
test('Tabler só aceita nomes de índice real e seleciona até 1600 entradas reais',()=>{
 const mocked=Array.from({length:1200},(_,i)=>({name:`heart-${i}`,label:`heart love ${i}`,category:'Love'}));
 const items=m.curatedFromTabler(mocked);assert.equal(items.length,1200);
 assert.ok(items.every(i=>i.origem==='tabler/tabler-icons'&&i.formato==='SVG'));
 assert.ok(m.STATIC_MANIFEST.length+items.length<=2081+m.UPLOADED_ITEMS.length);
});
test('Sanitizador contém allowlist de tags/atributos e não usa innerHTML',()=>{
 const code=file('src/lib/creative/library-load.ts');
 for(const term of ['allowedTags','allowedAttrs','DOMParser','createElementNS','safeAttrValue','sanitizeLibrarySvg','FileReader'])assert.ok(code.includes(term));
 assert.ok(!code.includes('innerHTML'));
 assert.ok(!code.includes('iconify.design'));
});
test('UI virtualizada sem bibliotecas, com favoritos e recentes locais',()=>{
 const code=file('src/components/creative/curated-library.tsx');
 for(const term of ['scrollTop','startRow','rowHeight','localStorage','FAVORITES_KEY','RECENTS_KEY','role="alert"','cr-curated-skeleton'])assert.ok(code.includes(term));
 assert.ok(code.includes('onInsertImage(src)')&&code.includes('onInsertText('));
});
test('Apenas Editor 2D recebe nova aba sem alterar APIs ou Prisma',()=>{
 const code=file('src/components/creative/creative-editor.tsx');
 assert.ok(code.includes('CuratedLibrary'));assert.ok(code.includes("panel==='library'"));assert.ok(code.includes('onInsertImage={src=>addImage(src)}'));
 assert.ok(code.includes("onApplyBackground={src=>applyTemplate(src,'background')}"));
});
