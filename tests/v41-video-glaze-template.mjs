import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
const source=p=>readFileSync(resolve(root,p),'utf8');
function load(p,stubs={}){
 const result=ts.transpileModule(source(p),{fileName:p,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,strict:true}});
 const errors=(result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
 assert.equal(errors.length,0,'Syntax: '+p);
 const mod={exports:{}};
 new Function('module','exports','require',result.outputText)(mod,mod.exports,name=>{
  if(Object.prototype.hasOwnProperty.call(stubs,name))return stubs[name];
  throw new Error('Unexpected dependency '+name);
 });
 return mod.exports;
}
const video=()=>load('src/lib/creative/video-templates.ts',{'mp4-muxer':{},'./mp4-integrity':{inspectRenderedMp4:()=>({})},'./design':{}});
const template=()=>load('src/lib/creative/smart-templates.ts',{'./template-archive':{},'./design':{uid:()=> 'generated-id'}});
const mockup={id:'one',kind:'image',x:80,y:30,w:800,h:400,angle:24,opacity:1,role:'mockup'};
const slot={x:300,y:100,w:500,h:400};
test('720p real para um vídeo horizontal e limites corretos para retrato',()=>{
 const {videoOutputSize}=video();
 assert.deepEqual(videoOutputSize(1920,1080),{width:1280,height:720});
 assert.deepEqual(videoOutputSize(3840,2160),{width:1280,height:720});
 assert.deepEqual(videoOutputSize(1080,1350),{width:576,height:720});
 assert.deepEqual(videoOutputSize(1080,1080),{width:720,height:720});
 assert.deepEqual(videoOutputSize(640,360),{width:640,height:360});
 assert.throws(()=>videoOutputSize(0,400),/inválidas/);
});
test('MP4 cover e contain: proporções preservadas; nenhum vídeo achatado',()=>{
 const {videoFrameBounds}=video();
 const full=videoFrameBounds(1920,1080,720,720,'contain');
 assert.deepEqual(full,{x:0,y:157.5,width:720,height:405});
 const crop=videoFrameBounds(1920,1080,720,720,'cover');
 assert.deepEqual(crop,{x:-280,y:0,width:1280,height:720});
 assert.ok(Math.abs(crop.width/crop.height-16/9)<1e-6);
 assert.throws(()=>videoFrameBounds(-1,80,720,720),/inválidas/);
});
test('reencaixe proporcional da caneca em 90%, 100% e 110%, sem destruir máscara',()=>{
 const {fitMockupIntoSlot}=template();
 const mask='data:image/png;base64,AA==';
 for(const f of [.9,1,1.1]){
  const out=fitMockupIntoSlot(mockup,slot,mask,f);
  assert.ok(Math.abs(out.w/out.h-2)<1e-8);
  assert.ok(Math.abs(out.x+out.w/2-(slot.x+slot.w/2))<1e-8);
  assert.ok(Math.abs(out.y+out.h/2-(slot.y+slot.h/2))<1e-8);
  assert.equal(out.maskSrc,mask);
  assert.equal(out.angle,0);
 }
 assert.equal(mockup.maskSrc,undefined);
 assert.throws(()=>fitMockupIntoSlot(mockup,slot,mask,Infinity),/inválida/);
 assert.throws(()=>fitMockupIntoSlot(mockup,slot,mask,2),/inválida/);
});
test('UI, schema e renderer aceitam fit e previsualização do mesmo enquadramento',()=>{
 const d=source('src/lib/creative/design.ts');
 const val=source('src/lib/creative/validate-project.ts');
 const e=source('src/components/creative/creative-editor.tsx');
 const renderer=source('src/lib/creative/video-templates.ts');
 assert.match(d,/fit\?:'cover'\|'contain'/);
 assert.match(val,/\['cover','contain'\]/);
 assert.match(e,/Enquadramento do vídeo/);
 assert.match(e,/doc\.video\.fit==='contain'/);
 assert.match(e,/onLoadedMetadata/);
 assert.match(renderer,/videoFrameBounds\(video\.videoWidth,video\.videoHeight,w,h,(?:source|doc\.video)\.fit/);
});
test('Studio 3D integra alça calibrada e contato com duas penumbras leves',()=>{
 const geometry=source('src/components/tools/mockup/scene/mug-geometry.ts');
 const studio=source('src/components/tools/mockup/scene/studio.tsx');
 assert.match(geometry,/livesub: (?:\[|LIVE_SUB_HANDLE_POINTS\.map)/);
 assert.match(geometry,/style === 'livesub' \? 0\.46/);
 assert.match(studio,/name="mug-contact-penumbra"/);
 assert.match(studio,/opacity \* 0\.34/);
 assert.match(studio,/name="float-shadow"/);
});
test('Agente informa disponibilidade sem revelar credenciais e sem executar ações remotamente',()=>{
 const endpoint=source('src/app/api/creative-assistant/route.ts');
 const widget=source('src/components/creative/studio-concierge.tsx');
 assert.match(endpoint,/export function GET\(/);
 assert.match(endpoint,/aiEnabled:Boolean\(process\.env\.OPENAI_API_KEY\)/);
 assert.doesNotMatch(endpoint,/return NextResponse\.json\(\{[^}]*apiKey/);
 assert.match(widget,/setAiAvailable/);
 assert.match(widget,/Ações exigem confirmação/);
});
