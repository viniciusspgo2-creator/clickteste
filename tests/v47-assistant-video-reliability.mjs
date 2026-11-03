import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
function load(file,stubs={}){
 const path=resolve(root,file);const output=ts.transpileModule(readFileSync(path,'utf8'),{fileName:path,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,strict:true}});
 assert.deepEqual(output.diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error)??[],[]);
 const module={exports:{}};
 new Function('module','exports','require',output.outputText)(module,module.exports,id=>{if(id in stubs)return stubs[id];throw Error('dependência não permitida: '+id)});
 return module.exports;
}
const videoPath='src/lib/creative/video-templates.ts';
const video=()=>load(videoPath,{'mp4-muxer':{},'./design':{}});

test('H.264: configura saída AVC em vez de Annex B, com perfil baseline alternativo',async()=>{
 const before=globalThis.VideoEncoder;const calls=[];
 globalThis.VideoEncoder={isConfigSupported:async config=>{calls.push(config);return {supported:calls.length>1,config};}};
 try{
  const config=await video().chooseH264Config(1280,720);
  assert.equal(calls[0].codec,'avc1.42001e');assert.equal(calls[1].codec,'avc1.42001f');
  assert.deepEqual(config.avc,{format:'avc'});
  assert.ok(config.bitrate>0);
 }finally{globalThis.VideoEncoder=before;}
});

test('MP4: não entrega arquivo se encoder emitir menos quadros que o necessário',async()=>{
 const original={VideoEncoder:globalThis.VideoEncoder,VideoFrame:globalThis.VideoFrame,document:globalThis.document};
 let closed=false,finalized=false;
 class FakeVideo extends EventTarget{
  readyState=3;videoWidth=320;videoHeight=180;duration=.125;seeking=false;muted=true;preload='auto';playsInline=true;
  _time=0;get currentTime(){return this._time}set currentTime(value){this._time=value;this.seeking=true;queueMicrotask(()=>{this.seeking=false;this.dispatchEvent(new Event('seeked'))});}
  removeAttribute(){}load(){}
 }
 const imageContext={fillRect(){},drawImage(){},getImageData(){return new Uint8Array(4)}};
 const fakeCanvas=()=>({width:0,height:0,getContext:()=>imageContext});
 globalThis.document={createElement:(tag)=>tag==='video'?new FakeVideo():fakeCanvas()};
 globalThis.VideoFrame=class{constructor(){this.timestamp=0;}close(){}};
 globalThis.VideoEncoder=class{
  static async isConfigSupported(config){return {supported:true,config}};
  state='unconfigured';encodeQueueSize=0;
  constructor({output}){this.output=output;this.calls=0;}
  configure(){this.state='configured'}
  encode(){this.calls++;if(this.calls===1)this.output({},{})}
  async flush(){}close(){closed=true;this.state='closed'}
 };
 const muxer={ArrayBufferTarget:class{buffer=new Uint8Array(256).buffer},Muxer:class{addVideoChunk(){}finalize(){finalized=true}}};
 try{
  const engine=load(videoPath,{'mp4-muxer':muxer,'./design':{assertDesignAssetsReady:async()=>{},drawDesign:async()=>{}}});
  const design={width:800,height:450,background:'#fff',nodes:[],video:{src:'data:video/mp4;base64,YQ==',start:0,end:.125}};
  await assert.rejects(engine.renderMp4Template(design),/incompleta.*1 de 3 quadros/);
  assert.equal(closed,true);assert.equal(finalized,false);
 }finally{for(const [k,v] of Object.entries(original))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
});

test('Assistente: requisições anteriores são canceladas e ações são limitadas por módulo',()=>{
 const source=readFileSync(resolve(root,'src/components/creative/studio-concierge.tsx'),'utf8');
 assert.match(source,/requestRef\.current\.controller\?\.abort\(\)/);
 assert.match(source,/const current=\(\)=>requestRef\.current\.version===version&&!controller\.signal\.aborted/);
 assert.match(source,/setPending\(null\);setConversation/);
 assert.match(source,/actionAllowed\(area,info\.action\)/);
 assert.match(source,/const actionsByArea:Record<Area,readonly Action\[]>/);
 assert.match(source,/if\(aiAvailable===false\)/);
 assert.match(source,/generalHelp\[language\]/);
});

test('MP4: timeout ou cancelamento interrompem flush travado sem concluir exportação',async()=>{
 const engine=video();const encoder={flush:()=>new Promise(()=>{})};
 await assert.rejects(engine.flushVideoEncoder(encoder,undefined,25),/tempo limite/);
 const cancel=new AbortController();const pending=engine.flushVideoEncoder(encoder,cancel.signal,250);
 cancel.abort();
 await assert.rejects(pending,e=>e.name==='AbortError');
 await assert.rejects(engine.flushVideoEncoder(encoder,new AbortController().signal,0),/Tempo limite inválido/);
});
