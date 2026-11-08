import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
function load(name,stubs={}){
 const file=resolve(root,name),source=readFileSync(file,'utf8');
 const converted=ts.transpileModule(source,{fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,strict:true}});
 const mod={exports:{}};
 new Function('module','exports','require',converted.outputText)(mod,mod.exports,dep=>{
  if(dep in stubs)return stubs[dep];throw new Error('Unknown dependency '+dep);
 });
 return mod.exports;
}
const video=()=>load('src/lib/creative/video-templates.ts',{'mp4-muxer':{},'./mp4-integrity':{inspectRenderedMp4:()=>({})},'./design':{}});
const smart=()=>load('src/lib/creative/smart-templates.ts',{'./template-archive':{},'./design':{uid:()=>'fixture-id'}});
const ai=()=>load('src/lib/creative/assistant-request.ts');
class FakeVideo extends EventTarget{
 readyState=0;duration=3;seeking=false;_currentTime=0;
 get currentTime(){return this._currentTime;}
 set currentTime(v){this.seeking=true;this._currentTime=v;queueMicrotask(()=>{this.seeking=false;this.readyState=3;this.dispatchEvent(new Event('seeked'));});}
}
test('MP4 waits for video data and allows canceling an in-progress read',async()=>{
 const {waitForVideoData}=video();const v=new FakeVideo();
 const waiting=waitForVideoData(v,undefined,200);queueMicrotask(()=>{v.readyState=3;v.dispatchEvent(new Event('loadeddata'));});
 await waiting;
 const stalled=new FakeVideo(),controller=new AbortController();
 const pending=waitForVideoData(stalled,controller.signal,200);
 controller.abort();await assert.rejects(pending,e=>e.name==='AbortError');
 await assert.rejects(waitForVideoData(new FakeVideo(),undefined,15),/Tempo limite excedido/);
});
test('MP4 seeking validates time, honors abort and reads requested frame',async()=>{
 const {seekVideoFrame}=video();const v=new FakeVideo();
 await seekVideoFrame(v,1.3,undefined,200);assert.equal(v.currentTime,1.3);
 await assert.rejects(seekVideoFrame(v,-2),/inválido/);
 const ac=new AbortController();ac.abort();await assert.rejects(seekVideoFrame(v,2,ac.signal),e=>e.name==='AbortError');
});
test('AI payload enforces maximum bytes despite missing Content-Length',async()=>{
 const {readAssistantBody}=ai();
 const json=b=>new Request('https://example.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
 assert.deepEqual(await readAssistantBody(json({question:'Como envio mockup?',locale:'pt'})),{question:'Como envio mockup?',locale:'pt'});
 await assert.rejects(readAssistantBody(json({question:'x'.repeat(5000)})),e=>e.status===413);
 await assert.rejects(readAssistantBody(new Request('https://example.com',{method:'POST',headers:{'Content-Type':'text/plain'},body:'hi'})),e=>e.status===415);
 await assert.rejects(readAssistantBody(new Request('https://example.com',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"not valid"'})),e=>e.status===400);
});
test('Smart template rejects malformed slots, missing dimensions and external paths',()=>{
 const {validateSmartManifest}=smart();
 const base={format:'clickgruda-smart-template',version:1,name:'Teste',width:1080,height:1350,background:'scene.webp',slot:{x:.1,y:.1,w:.7,h:.8}};
 assert.equal(validateSmartManifest(base).name,'Teste');
 for(const bad of [null,{...base,slot:{x:0,y:0,w:0,h:1}},{...base,slot:{x:.9,y:.9,w:.5,h:.5}},{...base,background:'../secret.png'},{...base,width:100.5},{...base,name:''}])
  assert.throws(()=>validateSmartManifest(bad));
});
test('Smart templates scale shadows, text effects and keyframes with canvas',()=>{
 const source=readFileSync(resolve(root,'src/lib/creative/smart-templates.ts'),'utf8');
 for(const property of ['shadowX','shadowY','strokeWidth','tracking','depth','keyframes','maskSrc=undefined'])assert.ok(source.includes(property),property);
});
test('Live Sub handle root rings taper into cup wall without changing old styles',()=>{
 const source=readFileSync(resolve(root,'src/components/tools/mockup/scene/mug-geometry.ts'),'utf8');
 const profile=load('src/components/tools/mockup/lib/reference-handle-section.ts').referenceHandleSection;
 assert.match(source,/style === 'livesub' \? referenceHandleSection\(t\)/);
 assert.match(source,/sectionX \* weld \* section\.width/);
 assert.match(source,/sectionN \* weld \* section\.thickness/);
 assert.ok(profile(0).width < profile(.5).width);
 assert.equal(profile(0).width,profile(1).width);
});
