import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript');}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const root=path.resolve(import.meta.dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const moduleOf=(file)=>{
 const result=ts.transpileModule(read(file),{fileName:file,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 assert.equal((result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
 const fixtureModule={exports:{}};
 new Function('module','exports','require',result.outputText)(fixtureModule,fixtureModule.exports,()=>({}));
 return fixtureModule.exports;
};
test('Novo espelhamento de exportação somente altera transformação do arquivo final',()=>{
 const {drawOutputWithMirror}=moduleOf('src/lib/creative/export-transform.ts');
 const operations=[];
 const ctx={save(){operations.push('save')},translate(...v){operations.push(['translate',...v])},scale(...v){operations.push(['scale',...v])},drawImage(...v){operations.push(['drawImage',...v.slice(1)])},restore(){operations.push('restore')}};
 drawOutputWithMirror(ctx,{},2480,1122,true);
 assert.deepEqual(operations,['save',['translate',2480,0],['scale',-1,1],['drawImage',0,0,2480,1122],'restore']);
 operations.length=0;drawOutputWithMirror(ctx,{},2480,1122,false);
 assert.deepEqual(operations,[['drawImage',0,0,2480,1122]]);
});
test('Editor oferece opção de espelhamento na exportação, desligada por padrão',()=>{
 const s=read('src/components/creative/creative-editor.tsx');
 assert.match(s,/\[mirrorPrint,setMirrorPrint\]=useState\(false\)/);
 assert.match(s,/exportDesign\(doc,format,scale,mirrorPrint\)/);
 assert.match(s,/type="checkbox" checked=\{mirrorPrint\}/);
 assert.match(s,/Não ative se o software ou a impressora já espelha a arte/);
});
test('PSD preserva camadas ocultas no editor e limita pixels cumulativos',()=>{
 const s=read('src/lib/creative/psd-import.ts');
 assert.match(s,/visible:!layer.hidden/);
 assert.match(s,/45_000_000/);
 assert.doesNotMatch(s,/if\(layer.hidden\|\|/);
 assert.match(s,/Você pode|você pode/);
});
test('PDF lê contagem de páginas antes de rasterizar e não rasura texto girado',()=>{
 const pdf=read('src/lib/creative/pdf-layers.ts'),ui=read('src/components/creative/creative-editor.tsx');
 assert.match(pdf,/export async function inspectPdfPageCount\(/);
 assert.match(pdf,/Math.abs\(n.angle\)>1\.5/);
 assert.ok(ui.indexOf('const pages=await inspectPdfPageCount(file)')<ui.indexOf('const extracted=await importPdfEditable(file,page)'));
});
test('Módulos da rodada passam na análise de sintaxe TypeScript',()=>{
 for(const file of ['src/lib/creative/export-transform.ts','src/lib/creative/design.ts','src/lib/creative/pdf-layers.ts','src/lib/creative/psd-import.ts','src/components/creative/creative-editor.tsx']){
  const result=ts.transpileModule(read(file),{fileName:file,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});
  assert.equal((result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,`Syntax error: ${file}`);
 }
});
