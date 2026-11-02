import fs from 'node:fs'; import Module,{createRequire} from 'node:module'; import test from 'node:test'; import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),ts=require('typescript');
Module._extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
const {baseArtTransform,normalizeBocaoAngle}=require('../src/components/tools/mockup/lib/base-art.ts');
test('Bocão: free rotation wraps 360° and retains legacy negative angles',()=>{assert.equal(normalizeBocaoAngle(0),0);assert.equal(normalizeBocaoAngle(360),0);assert.equal(normalizeBocaoAngle(720),0);assert.equal(normalizeBocaoAngle(-90),270);assert.equal(normalizeBocaoAngle(15),15);assert.equal(normalizeBocaoAngle(NaN),0);});
const {useMockupStore:s}=require('../src/components/tools/mockup/state/store.ts');
test('old projects retain centered base at original scale',()=>assert.deepEqual(baseArtTransform({baseRotation:12}),{scale:1,x:0,y:0}));
test('base controls clamp malformed saved values',()=>{assert.deepEqual(baseArtTransform({baseScale:Infinity,baseOffsetX:4,baseOffsetY:-5}),{scale:1,x:1,y:-1});});
test('base editing stays independent, supports undo and survives hydration',()=>{
 s.getState().resetAll();s.getState().compose('pair');const id=s.getState().companions[0].id;
 const original=s.getState().art;
 s.getState().patchObjectArt(id,{baseImageId:'base-test',baseRotation:23,baseScale:1.5,baseOffsetX:0.2,baseOffsetY:-0.1});
 assert.deepEqual(s.getState().art,original);
 const saved=JSON.parse(JSON.stringify({art:s.getState().art,mug:s.getState().mug,companions:s.getState().companions}));
 s.getState().resetAll();s.getState().hydrate(saved);assert.equal(s.getState().companions[0].art.baseScale,1.5);assert.equal(s.getState().companions[0].art.baseImageId,'base-test');
 s.getState().patchObject(id,{locked:true});s.getState().patchObjectArt(id,{baseScale:2});assert.equal(s.getState().companions[0].art.baseScale,1.5);s.getState().resetAll();
});
const {renderBaseArt,baseExportSize}=require('../src/components/tools/mockup/lib/base-art-canvas.ts');
const registry=require('../src/components/tools/mockup/lib/art-registry.ts');
test('base export obeys GPU and shared memory budgets',()=>{
 assert.equal(baseExportSize(8000,512,1,false),512);
 assert.ok(baseExportSize(8000,8192,8,false)**2*8<=8000000);
 assert.ok(baseExportSize(8000,8192,1,true)<=Math.sqrt(2000000));
});
test('base canvas draws the retained source and applies only lower-art transforms',async()=>{
 const oldDocument=globalThis.document,oldBitmap=globalThis.createImageBitmap;let draw;
 globalThis.createImageBitmap=async()=>({width:1000,height:500,close(){}});
 try{
  const e=await registry.loadArtBlob(new Blob(['original'],{type:'image/png'}),'fixture.png');
  globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},drawImage(...args){draw=args;}})})};
  const art={...s.getState().art,baseImageId:e.id};const c=renderBaseArt(art,s.getState().mug,2000);
  assert.equal(c.width,2000);assert.equal(draw[0],e.source);assert.deepEqual(draw.slice(1),[0,500,2000,1000]);
  renderBaseArt({...art,baseScale:0.5,baseOffsetX:0.2},s.getState().mug,2000);assert.deepEqual(draw.slice(1),[700,750,1000,500]);
  assert.equal(e.width,1000);registry.removeArtImage(e.id);
 }finally{globalThis.document=oldDocument;globalThis.createImageBitmap=oldBitmap;}
});
