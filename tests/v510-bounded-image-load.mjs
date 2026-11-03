import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
function moduleFromTs(file,dependencyMap={}){
 const source=readFileSync(resolve(root,file),'utf8');
 const result=ts.transpileModule(source,{fileName:file,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,strict:true}});
 assert.deepEqual((result.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error),[]);
 const mod={exports:{}};
 new Function('require','module','exports',result.outputText)((name)=>{
  if(Object.hasOwn(dependencyMap,name))return dependencyMap[name];
  throw Error(`Unexpected dependency ${name} in ${file}`);
 },mod,mod.exports);
 return mod.exports;
}
const loader=moduleFromTs('src/lib/creative/async-image-load.ts');
const imageInstances=[];
class FakeImage {
 naturalWidth=0;naturalHeight=0;onload=null;onerror=null;decoding='';crossOrigin='';source='';stopped=false;
 constructor(){imageInstances.push(this)}
 set src(value){
  this.source=value;
  if(value==='ok'||value==='invalid-dimensions'||value==='late'){
   setTimeout(()=>{if(!this.stopped){this.naturalWidth=value==='invalid-dimensions'?0:400;this.naturalHeight=200;this.onload?.();}},value==='late'?35:2);
  }else if(value==='broken')setTimeout(()=>this.onerror?.(),2);
  else if(value==='throw')throw Error('invalid URL');
 }
 removeAttribute(name){if(name==='src')this.stopped=true;}
}
const previousImage=globalThis.Image;
globalThis.Image=FakeImage;
try{
 test('V5.10: load de imagem válido termina com dimensões e limpa o timeout',async()=>{
  const image=await loader.loadImageWithTimeout('ok',40);
  assert.equal(image.naturalWidth,400);
  assert.equal(image.stopped,false);
  assert.equal(image.crossOrigin,'anonymous');
 });
 test('V5.10: imagem corrompida falha, interrompe carregamento e não fica pendente',async()=>{
  await assert.rejects(loader.loadImageWithTimeout('broken',40),/Não foi possível carregar/);
  assert.equal(imageInstances.at(-1).stopped,true);
 });
 test('V5.10: imagem que nunca responde termina no timeout e libera o recurso',async()=>{
  await assert.rejects(loader.loadImageWithTimeout('hang',12),/demorou demais/);
  assert.equal(imageInstances.at(-1).stopped,true);
 });
 test('V5.10: resposta tardia após timeout não pode recuperar uma imagem abortada',async()=>{
  const promise=loader.loadImageWithTimeout('late',8);
  await assert.rejects(promise,/demorou demais/);
  await new Promise(resolve=>setTimeout(resolve,45));
  assert.equal(imageInstances.at(-1).stopped,true);
 });
 test('V5.10: imagem sem dimensões rejeitada, não entra em exportação',async()=>{
  await assert.rejects(loader.loadImageWithTimeout('invalid-dimensions',30),/dimensões válidas/);
 });
 test('V5.10: timeout inválido rejeitado sem iniciar carregamento',async()=>{
  const prior=imageInstances.length;
  await assert.rejects(loader.loadImageWithTimeout('ok',0),/Tempo limite/);
  assert.equal(imageInstances.length,prior);
 });
 test('V5.10: recuperação de projeto reutiliza o carregador com limite',async()=>{
  const source=readFileSync(resolve(root,'src/lib/creative/project-media-check.ts'),'utf8');
  assert.match(source,/loadImageWithTimeout\(url,12_000\)/);
  const media=moduleFromTs('src/lib/creative/project-media-check.ts',{'./async-image-load':loader});
  const doc={width:1080,height:1350,background:'#fff',nodes:[{id:'1',kind:'image',src:'broken',layerName:'Caneca'}, {id:'2',kind:'image',src:'ok',maskSrc:'hang',layerName:'Máscara'}]};
  const issues=await media.inspectProjectMedia(doc,{image:async src=>{await loader.loadImageWithTimeout(src,12);},video:async()=>{}});
  assert.equal(issues.some(i=>i.name==='Caneca'&&i.severity==='error'),true);
  assert.equal(issues.some(i=>i.name==='Máscara'&&i.severity==='error'),true);
 });
 test('V5.10: erro de importação anterior não descarta o cache da nova imagem',async()=>{
  let rejectFirst;let resolveSecond;let count=0;
  const design=moduleFromTs('src/lib/creative/design.ts',{
   './typefaces':{ensureDesignFonts:async()=>{}},
   './animation':{animateDesignNode:n=>n},
   './effect-cache':{PixelBoundedCache:class {clear(){}},effectKey:()=>'',clearAssetTokens:()=>{}},
   './export-transform':{drawOutputWithMirror:()=>{}},
   './image-export-integrity':{assertExportBlobFormat:async()=>{},addPngDpiMetadata:async blob=>blob},
   './async-image-load':{loadImageWithTimeout:()=>{count++;return count===1?new Promise((_,reject)=>{rejectFirst=reject;}):new Promise(resolve=>{resolveSecond=resolve;});}}
  });
  const original=design.imageFor('data:one');
  design.clearDesignRenderCache();
  const replacement=design.imageFor('data:one');
  rejectFirst(new Error('Erro tardio'));
  await assert.rejects(original,/Erro tardio/);
  assert.equal(design.imageFor('data:one'),replacement);
  resolveSecond({naturalWidth:5,naturalHeight:5});
  await replacement;
  assert.equal(count,2);
 });
} finally {
 // Tests execute asynchronously; restore after the suite has finished using the
 // top-level shared stub. Node's test files run in separate child processes.
 process.on('beforeExit',()=>{globalThis.Image=previousImage;});
}
