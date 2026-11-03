import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
function load(name,stubs={}){
 const filename=resolve(root,name);
 const result=ts.transpileModule(readFileSync(filename,'utf8'),{fileName:filename,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,strict:true}});
 assert.deepEqual((result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error),[]);
 const mod={exports:{}};
 new Function('module','exports','require',result.outputText)(mod,mod.exports,dep=>{
  if(dep in stubs)return stubs[dep];throw Error(`Dependência inesperada: ${dep}`);
 });
 return mod.exports;
}
const profile=load('src/components/tools/mockup/lib/reference-handle-section.ts').referenceHandleSection;
const history=load('src/lib/creative/assistant-history.ts').sanitizeAssistantHistory;
const video=load('src/lib/creative/video-templates.ts',{'mp4-muxer':{},'./mp4-integrity':{inspectRenderedMp4:()=>({})},'./design':{}});
test('Alça: seção progressiva nas junções e simetria de largura',()=>{
 assert.ok(profile(.3).width>profile(0).width);
 assert.ok(profile(.5).width>profile(.1).width);
 for(const t of [0,.05,.1,.2,.5,.8,.95,1]){
  const a=profile(t),b=profile(1-t);
  assert.ok(Math.abs(a.width-b.width)<1e-8);
  assert.ok(Math.abs(a.thickness-b.thickness)<1e-8);
  assert.ok(a.width>.3&&a.width<1.2);
 }
 assert.throws(()=>profile(NaN),/inválido/);
});
test('Assistente: últimas quatro perguntas somente, sem aceitar objetos ou trechos grandes',()=>{
 assert.deepEqual(history([' a ','b','c','d','e']),['b','c','d','e']);
 assert.deepEqual(history([' ok ',{},'x'.repeat(301),null,'nova']),['ok','nova']);
 assert.deepEqual(history(null),[]);
 const source=readFileSync(resolve(root,'src/app/api/creative-assistant/route.ts'),'utf8');
 assert.match(source,/sanitizeAssistantHistory/);
 assert.match(source,/previousQuestions/);
});
test('MP4: seek não considera quadro ainda em movimento como pronto',async()=>{
 const fake=new EventTarget();
 let t=.5;fake.readyState=3;fake.seeking=true;
 Object.defineProperty(fake,'currentTime',{get(){return t;},set(v){t=v;queueMicrotask(()=>{fake.seeking=false;fake.dispatchEvent(new Event('seeked'));});}});
 await video.seekVideoFrame(fake,.5,undefined,200);
 assert.equal(fake.seeking,false);
});
test('MP4: limpa o encoder somente se ele não estiver fechado',()=>{
 const source=readFileSync(resolve(root,'src/lib/creative/video-templates.ts'),'utf8');
 assert.match(source,/encoder\.state!=='closed'/);
 assert.match(source,/video\.removeAttribute\('src'\)/);
});
