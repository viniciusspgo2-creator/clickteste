import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
function load(file,stubs={}){
 const path=resolve(root,file);
 const output=ts.transpileModule(readFileSync(path,'utf8'),{fileName:path,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,strict:true}});
 assert.deepEqual((output.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error),[]);
 const module={exports:{}};
 new Function('module','exports','require',output.outputText)(module,module.exports,id=>{
  if(Object.hasOwn(stubs,id))return stubs[id];throw new Error(`Dependência inesperada: ${id}`);
 });
 return module.exports;
}
const engine=()=>load('src/lib/creative/video-templates.ts',{'mp4-muxer':{},'./mp4-integrity':{inspectRenderedMp4:()=>({})},'./design':{assertDesignAssetsReady:async()=>{}}});
const doc={width:1920,height:1080,background:'#fff',nodes:[],video:{src:'data:video/mp4;base64,YQ==',start:0,end:2}};

test('preflight e renderização compartilham limites de início/fim e não ultrapassam 20 segundos',()=>{
 const {resolveVideoInterval}=engine();
 assert.deepEqual(resolveVideoInterval({start:2,end:60},90),{start:2,end:22});
 assert.deepEqual(resolveVideoInterval({start:9,end:40},10),{start:9,end:10});
 assert.throws(()=>resolveVideoInterval({start:0,end:0},10),/Fim.*inválido/);
 assert.throws(()=>resolveVideoInterval({start:-1},10),/Início.*inválido/);
 assert.throws(()=>resolveVideoInterval({start:1},Infinity),/duração/);
});

test('pré-verificação real informa codec, dimensão, quantidade de quadros e limpa o vídeo',async()=>{
 const saved={VideoEncoder:globalThis.VideoEncoder,VideoFrame:globalThis.VideoFrame,document:globalThis.document};
 let cleanup=0,reads=0;
 class FakeVideo extends EventTarget {
  readyState=3;videoWidth=1280;videoHeight=720;duration=6;seeking=false;_time=0;
  get currentTime(){return this._time}set currentTime(v){this._time=v;this.seeking=true;queueMicrotask(()=>{this.seeking=false;this.dispatchEvent(new Event('seeked'))});}
  pause(){cleanup++}removeAttribute(){}load(){}
 }
 globalThis.VideoEncoder={isConfigSupported:async config=>({supported:true,config})};
 globalThis.VideoFrame=class{};
 globalThis.document={createElement(tag){return tag==='video'?new FakeVideo():{getContext:()=>({drawImage(){reads++},getImageData(){return new Uint8Array([0,0,0,255])}})}}};
 try{
  const result=await engine().probeVideoExport(doc,undefined,{preset:'fullhd',fps:30});
  assert.equal(result.width,1920);assert.equal(result.height,1080);
  assert.equal(result.frameCount,60);assert.equal(result.fps,30);
  assert.equal(result.codec,'avc1.420028');assert.equal(result.sourceWidth,1280);
  assert.equal(cleanup,1);assert.equal(reads,1);
 }finally{for(const [k,v] of Object.entries(saved))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
});

test('pré-verificação reporta CORS ou bloqueio de leitura sem gerar MP4 parcial',async()=>{
 const saved={VideoEncoder:globalThis.VideoEncoder,VideoFrame:globalThis.VideoFrame,document:globalThis.document};
 let cleaned=0;
 globalThis.VideoEncoder={isConfigSupported:async config=>({supported:true,config})};
 globalThis.VideoFrame=class{};
 globalThis.document={createElement(tag){return tag==='video'?{readyState:3,videoWidth:320,videoHeight:180,duration:4,currentTime:0,seeking:false,pause(){cleaned++},removeAttribute(){},load(){}}:{getContext:()=>({drawImage(){},getImageData(){throw Error('tainted')}})}}};
 try{
  await assert.rejects(engine().probeVideoExport(doc),/CORS/);
  assert.equal(cleaned,1);
 }finally{for(const [k,v] of Object.entries(saved))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
});

test('o botão de teste usa exatamente o preset e FPS escolhidos e não acessa o servidor',()=>{
 const editor=readFileSync(resolve(root,'src/components/creative/creative-editor.tsx'),'utf8');
 assert.match(editor,/probeVideoExport\(doc,controller\.signal,\{preset:videoPreset,fps:videoFps\}\)/);
 assert.match(editor,/Testar compatibilidade do MP4/);
 assert.match(editor,/Verificação não passou/);
 assert.match(editor,/setVideoDiagnostic\(null\)/);
 assert.match(editor,/role="status" aria-live="polite" className="cr-video-diagnostic"/);
});

test('assistente: falha do provedor ativa guia local e mostra status real sem executar ações',()=>{
 const source=readFileSync(resolve(root,'src/components/creative/studio-concierge.tsx'),'utf8');
 assert.match(source,/setProviderUnavailable\(true\)/);
 assert.match(source,/setProviderUnavailable\(false\)/);
 assert.match(source,/providerUnavailable\?'IA temporariamente indisponível · guia local ativo'/);
 assert.match(source,/actionAllowed\(area,info.action\)/);
 assert.match(source,/onAction\?\.\(pending.action\)/);
});
