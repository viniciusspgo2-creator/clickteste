import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
function transpiled(path,stubs={}){
 const input=readFileSync(resolve(root,path),'utf8');
 const output=ts.transpileModule(input,{fileName:path,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,strict:true}});
 assert.deepEqual((output.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error),[]);
 const mod={exports:{}};
 new Function('module','exports','require',output.outputText)(mod,mod.exports,id=>{
  if(Object.hasOwn(stubs,id))return stubs[id];
  throw new Error(`Import de teste inesperado: ${id}`);
 });
 return mod.exports;
}
const fonts=transpiled('src/lib/creative/typefaces.ts');
const originalDocument=globalThis.document;
function withFakeDocument({stylesheet='success',load='success',ready=Promise.resolve()}={}){
 const links=[];
 globalThis.document={
  createElement(tag){assert.equal(tag,'link');const link={removed:false,remove(){this.removed=true;},onload:null,onerror:null};return link;},
  head:{appendChild(link){links.push(link);if(stylesheet==='success')queueMicrotask(()=>link.onload?.());else if(stylesheet==='error')queueMicrotask(()=>link.onerror?.());}},
  fonts:{ready,load:()=>load==='pending'?new Promise(()=>{}):load==='empty'?Promise.resolve([]):load==='error'?Promise.reject(new Error('font error')):Promise.resolve([{family:'Loaded'}])}
 };
 return links;
}
try{
 test('V5.11: uma fonte carregada com sucesso é compartilhada entre chamadas',async()=>{
  const links=withFakeDocument();
  const a=fonts.loadCuratedTypeface('Inter',80),b=fonts.loadCuratedTypeface('Inter',80);
  assert.equal(a,b);await Promise.all([a,b]);assert.equal(links.length,1);assert.equal(links[0].removed,false);
 });
 test('V5.11: CSS que não responde termina com erro, desmonta link e permite retry',async()=>{
  const links=withFakeDocument({stylesheet:'pending'});
  await assert.rejects(fonts.loadCuratedTypeface('Manrope',12),/demorou demais/);
  assert.equal(links[0].removed,true);
  const newLinks=withFakeDocument();await fonts.loadCuratedTypeface('Manrope',80);
  assert.equal(newLinks.length,1);
 });
 test('V5.11: font-face que não termina de carregar também encerra no prazo',async()=>{
  const links=withFakeDocument({load:'pending'});
  await assert.rejects(fonts.loadCuratedTypeface('Montserrat',10),/demorou demais/);
  assert.equal(links[0].removed,true);
 });
 test('V5.11: fallback de fonte ausente não é confundido com fonte carregada',async()=>{
  withFakeDocument({load:'empty'});
  await assert.rejects(fonts.loadCuratedTypeface('Poppins',100),/não está disponível/);
 });
 test('V5.11: erro explícito ao baixar a folha de estilos, com liberação do recurso',async()=>{
  const links=withFakeDocument({stylesheet:'error'});
  await assert.rejects(fonts.loadCuratedTypeface('Outfit',60),/Não foi possível baixar/);
  assert.equal(links[0].removed,true);
 });
 test('V5.11: fontes globais travadas não bloqueiam exportação indefinidamente',async()=>{
  withFakeDocument({ready:new Promise(()=>{})});
  await assert.rejects(fonts.waitForFontLayout(10),/não terminaram de carregar/);
 });
 test('V5.11: fontes globais prontas liberam exportação',async()=>{
  withFakeDocument();await fonts.waitForFontLayout(20);
  await assert.rejects(fonts.waitForFontLayout(0),/Tempo limite/);
 });
 test('V5.11: exportação strict recusa fonte indisponível; prévia continua tolerante',async()=>{
  const effect={PixelBoundedCache:class {clear(){}},effectKey:()=>'',clearAssetTokens:()=>{}};
  const design=transpiled('src/lib/creative/design.ts',{
   './typefaces':{ensureDesignFonts:async()=>{throw new Error('Fonte indisponível')},waitForFontLayout:async()=>{}},
   './animation':{animateDesignNode:node=>node},
   './effect-cache':effect,'./async-image-load':{},'./export-transform':{drawOutputWithMirror:()=>{}},'./image-export-integrity':{assertExportBlobFormat:async()=>{},addPngDpiMetadata:async blob=>blob}
  });
  const ctx={clearRect(){},save(){},restore(){},translate(){},rotate(){},scale(){},measureText(t){return {width:t.length*8}},fillText(){},strokeText(){}};
  const canvas={width:500,height:500,getContext:()=>ctx};
  const doc={width:500,height:500,background:'transparent',nodes:[{id:'txt',kind:'text',x:0,y:0,w:300,h:80,angle:0,opacity:1,text:'Café',font:'Poppins',size:32}]};
  await assert.rejects(design.drawDesign(canvas,doc,undefined,{strict:true}),/Fonte indisponível/);
  await design.drawDesign(canvas,doc);
 });
 const video=transpiled('src/lib/creative/video-templates.ts',{'mp4-muxer':{},'./mp4-integrity':{},'./design':{}});
 test('V5.11: início de MP4 fora da duração real agora é rejeitado (não altera o clipe)',()=>{
  assert.throws(()=>video.resolveVideoInterval({start:12},5),/ultrapassa a duração/);
  assert.throws(()=>video.resolveVideoInterval({start:5},5),/ultrapassa a duração/);
 });
 test('V5.11: duração de exportação permanece limitada a 20 segundos',()=>{
  assert.deepEqual(video.resolveVideoInterval({start:10,end:75},100),{start:10,end:30});
  assert.deepEqual(video.resolveVideoInterval({start:2,end:50},5),{start:2,end:5});
 });
 test('V5.11: vídeo curto funciona; intervalo invertido não funciona',()=>{
  assert.deepEqual(video.resolveVideoInterval({start:0,end:1},.08),{start:0,end:.08});
  assert.throws(()=>video.resolveVideoInterval({start:3,end:2},10),/intervalo válido/);
 });
}finally{
 process.on('beforeExit',()=>{if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument;});
}
