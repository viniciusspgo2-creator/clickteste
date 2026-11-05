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
 const fixtureModule={exports:{}};
 new Function('module','exports','require',output.outputText)(fixtureModule,fixtureModule.exports,id=>{
  if(Object.hasOwn(stubs,id))return stubs[id];
  throw new Error(`Dependência inesperada: ${id}`);
 });
 return fixtureModule.exports;
}
const video=()=>load('src/lib/creative/video-templates.ts',{'mp4-muxer':{},'./mp4-integrity':{inspectRenderedMp4:()=>({})},'./design':{}});
const doc={width:1920,height:1080,background:'#ffffff',nodes:[],video:{src:'data:video/mp4;base64,YQ==',start:0,end:2}};

test('MP4 mantém 720p como padrão e Full HD apenas quando selecionado',()=>{
 assert.deepEqual(video().inspectVideoExport(doc),{width:1280,height:720,fps:24,maxDuration:20,hasAudio:false,animatedNodes:0});
 assert.deepEqual(video().inspectVideoExport(doc,30,'fullhd'),{width:1920,height:1080,fps:30,maxDuration:20,hasAudio:false,animatedNodes:0});
 assert.deepEqual(video().inspectVideoExport({...doc,width:1080,height:1350},24,'fullhd').width,864);
 assert.throws(()=>video().inspectVideoExport(doc,60,'fullhd'),/24 ou 30/);
 assert.throws(()=>video().inspectVideoExport(doc,24,'ultra'),/desconhecido/);
});

test('Full HD negocia Level 4.0+ em AVC e usa bitrate superior ao perfil HD',async()=>{
 const previous=globalThis.VideoEncoder;const calls=[];
 globalThis.VideoEncoder={isConfigSupported:async config=>{calls.push(config);return {supported:true,config}}};
 try{
  const hd=await video().chooseH264Config(1280,720,24);
  const fhd=await video().chooseH264Config(1920,1080,30);
  assert.equal(hd.codec,'avc1.42001f');
  assert.equal(fhd.codec,'avc1.420028');
  assert.equal(fhd.avc.format,'avc');
  assert.equal((await video().chooseH264Config(640,360,24)).codec,'avc1.42001e');
  assert.ok(fhd.bitrate>hd.bitrate);
 }finally{if(previous===undefined)delete globalThis.VideoEncoder;else globalThis.VideoEncoder=previous;}
});

test('MP4 usa configuração selecionada no muxer, quadros e nome do arquivo',async()=>{
 const original={VideoEncoder:globalThis.VideoEncoder,VideoFrame:globalThis.VideoFrame,document:globalThis.document};
 const calls={frames:[],chunks:0,finalized:0,settings:[],progress:[]};
 class FakeVideo extends EventTarget{
  readyState=3;videoWidth=640;videoHeight=360;duration=.1;seeking=false;_time=0;
  get currentTime(){return this._time}set currentTime(value){this._time=value;this.seeking=true;queueMicrotask(()=>{this.seeking=false;this.dispatchEvent(new Event('seeked'))});}
  removeAttribute(){}load(){}
 }
 const ctx={fillRect(){},drawImage(){},getImageData(){return new Uint8Array([0,0,0,255])}};
 globalThis.document={createElement:tag=>tag==='video'?new FakeVideo():{width:0,height:0,getContext:()=>ctx}};
 globalThis.VideoFrame=class {constructor(_stage,meta){calls.frames.push(meta)}close(){}};
 globalThis.VideoEncoder=class{
  static async isConfigSupported(config){return {supported:true,config}};
  state='unconfigured';encodeQueueSize=0;
  constructor({output}){this.output=output}
  configure(value){this.state='configured';calls.settings.push(value)}
  encode(){this.output({},{});calls.chunks++}
  flush(){return Promise.resolve()}
  close(){this.state='closed'}
 };
 const muxer={ArrayBufferTarget:class{buffer=new Uint8Array(384).buffer},Muxer:class{
  constructor(options){assert.equal(options.video.width,1920);assert.equal(options.video.height,1080);assert.equal(options.video.frameRate,30)}
  addVideoChunk(){}finalize(){calls.finalized++}
 }};
 try{
  const engine=load('src/lib/creative/video-templates.ts',{'mp4-muxer':muxer,'./mp4-integrity':{inspectRenderedMp4:()=>({})},'./design':{assertDesignAssetsReady:async()=>{},drawDesign:async()=>{}}});
  const result=await engine.renderMp4Template({...doc,video:{...doc.video,end:.1}},n=>calls.progress.push(n),undefined,{fps:30,preset:'fullhd'});
  assert.equal(result.type,'video/mp4');
  assert.equal(calls.frames.length,3);assert.equal(calls.chunks,3);
  assert.equal(calls.settings[0].width,1920);
  assert.equal(calls.frames[1].timestamp,33333);
  assert.equal(calls.finalized,1);
  assert.equal(calls.progress.at(-1),100);
 }finally{for(const [key,value] of Object.entries(original))if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
});

test('Editor usa a mesma seleção de qualidade no preflight e na exportação',()=>{
 const src=readFileSync(resolve(root,'src/components/creative/creative-editor.tsx'),'utf8');
 assert.match(src,/inspectVideoExport\(doc,videoFps,videoPreset\)/);
 assert.match(src,/renderMp4Template\(doc,setVideoProgress,videoAbort\.current\.signal,\{preset:videoPreset,fps:videoFps\}\)/);
 assert.match(src,/720p · recomendado/);
 assert.match(src,/Full HD 1080p/);
 assert.match(src,/click-gruda-template-\$\{settings\.width\}x\$\{settings\.height\}-\$\{settings\.fps\}fps\.mp4/);
});
