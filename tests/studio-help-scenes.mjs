import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import Module,{createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
Module._extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
const {findStudioHelp,STUDIO_HELP_TOPICS,STUDIO_GUIDE_STEPS}=require('../src/lib/creative/studio-help.ts');
const catalog=JSON.parse(fs.readFileSync(new URL('../src/components/tools/mockup/lib/panorama-catalog.json',import.meta.url)));
const {buildModel}=require('../src/components/tools/mockup/scene/model-geometry.ts');
const {GroundedSkybox}=await import('three/examples/jsm/objects/GroundedSkybox.js');
const THREE=require('three');
test('Studio-specific questions open the correct guide instead of Editor instructions',()=>{
 for(const [question,id] of [['quero as canecas mais para frente','close-up'],['Qual a altura ideal na mesa?','surface'],['O cenário ficou estampado na caneca','preview-on-print'],['qual tamanho e DPI usar?','dpi'],['quero ver a prévia do vídeo ao vivo','video-preview'],['a arte está borrada','quality'],['duas canecas com artes diferentes','multiple']])
  assert.equal(findStudioHelp(question)?.id,id,question);
 for(const topic of STUDIO_HELP_TOPICS)assert.equal(findStudioHelp(topic.title)?.id,topic.id,topic.title);
 assert.equal(STUDIO_GUIDE_STEPS.length,12);
 assert.equal(new Set(STUDIO_GUIDE_STEPS.map(s=>s.id)).size,12);
 for(const step of STUDIO_GUIDE_STEPS)assert.ok(step.tips.length>=4&&step.check.length>40);
});
test('Curated environments have provenance, CC0 license, independent previews and bounded HDR downloads',()=>{
 assert.equal(catalog.length,24);assert.equal(new Set(catalog.map(s=>s.id)).size,24);
 for(const scene of catalog){
  assert.equal(scene.license,'CC0-1.0');assert.ok(scene.authors.length>0);
  assert.equal(new URL(scene.source).origin,'https://polyhaven.com');
  assert.equal(new URL(scene.hdr).origin,'https://dl.polyhaven.org');
  assert.ok(scene.bytes>0&&scene.bytes<=32*1024*1024);
  assert.ok(scene.lightBytes>0&&scene.lightBytes<scene.bytes);
 }
});
test('The actual ground-projection geometry has a support plane at zero and contains a real mug',()=>{
 const texture=new THREE.Texture(),sky=new GroundedSkybox(texture,45,1200,32);sky.position.y=44.97;
 sky.updateMatrixWorld();sky.geometry.computeBoundingBox();
 const box=new THREE.Box3().setFromObject(sky),model=buildModel('classic');
 assert.ok(Math.abs(box.min.y)<.1);assert.ok(box.max.y>1000);
 assert.ok(model.body.boundingBox.max.y<45);
 sky.geometry.dispose();sky.material.dispose();texture.dispose();model.body.dispose();model.handle.dispose();model.basePrint.dispose();
});

test('Motion preview preserves the chosen camera target and restores poses without changing saved artwork',()=>{
 const group=new THREE.Group(),mug=new THREE.Group();mug.name='mug-float';mug.rotation.y=.7;group.add(mug);
 const scene=new THREE.Scene();scene.add(group);
 const target=new THREE.Vector3(3,6,0),camera=new THREE.PerspectiveCamera(24,1,.1,4000);camera.position.set(10,14,67);camera.lookAt(target);camera.zoom=1.4;camera.updateProjectionMatrix();
 const state={mug:{variant:'white'},exportSettings:{framing:'current'}};
 let rendered,ended=0;
 const frame={beginFrames:()=>({scene,gl:{domElement:{}}}),fitCamera:()=>camera.clone(),sceneCenter:()=>new THREE.Vector3(0,4.75,0),renderFrame:(_session,cam)=>{rendered=cam.clone();},endFrames:()=>{ended++;},applyWatermark:()=>{},setMugOverride:()=>{},ExportError:Error};
 const file=new URL('../src/components/tools/mockup/exporters/video-exporter.ts',import.meta.url);
 const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const mod={exports:{}};
 new Function('module','exports','require',compiled)(mod,mod.exports,id=>{
  if(id==='three')return THREE;
  if(id==='./frame-capture')return frame;
  if(id==='../scene/studio-refs')return {mugsGroup:()=>group,studioRefs:{controls:{target}}};
  if(id==='../state/store')return {useMockupStore:{getState:()=>state}};
  if(['mp4-muxer','gifenc','./alpha-video-encoder'].includes(id))return {};
  throw new Error(id);
 });
 const canvas={getContext:()=>({clearRect(){},drawImage(){}})};
 const preview=mod.exports.createMotionPreview(canvas,{w:320,h:320},{anim:'giro',duration:3,fps:24});
 preview.render(0);
 assert.ok(rendered.position.distanceTo(camera.position)<1e-9);
 assert.ok(rendered.getWorldDirection(new THREE.Vector3()).distanceTo(target.clone().sub(camera.position).normalize())<1e-9);
 assert.equal(rendered.zoom,1.4);
 preview.render(.25);assert.notEqual(mug.rotation.y,.7);
 preview.stop();preview.stop();assert.equal(mug.rotation.y,.7);assert.equal(ended,1);
 assert.deepEqual(state,{mug:{variant:'white'},exportSettings:{framing:'current'}});
});
