import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url), ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
function load(name) {
  const file=resolve(root,name);
  const {outputText, diagnostics=[]}=ts.transpileModule(readFileSync(file,'utf8'),{
    fileName:file,reportDiagnostics:true,
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,strict:true}
  });
  assert.deepEqual(diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error),[]);
  const m={exports:{}};
  new Function('module','exports','require',outputText)(m,m.exports,dep=>{throw Error('Unexpected dependency '+dep);});
  return m.exports;
}
const {contactShadowRenderBudget,contactShadowSceneKey}=load('src/components/tools/mockup/lib/contact-shadow-policy.ts');
const {LIVE_SUB_HANDLE_POINTS}=load('src/components/tools/mockup/lib/reference-handle-profile.ts');
const {referenceHandleSection}=load('src/components/tools/mockup/lib/reference-handle-section.ts');
const hero={model:'classic',handleStyle:'livesub',scale:1,rotationY:0,tiltX:0,tiltZ:0};
const light={preset:'soft',rotation:0,shadowOpacity:0.5,softness:0.5};
test('V5.2: shadows static capture twice, animation and object tools update live',()=>{
  assert.deepEqual(contactShadowRenderBudget({autoRotate:false,tool:'select',mobile:false}),{frames:2,resolution:1024,dynamic:false});
  for(const tool of ['move','rotate','scale']) {
    const budget=contactShadowRenderBudget({autoRotate:false,tool,mobile:false});
    assert.equal(budget.dynamic,true); assert.equal(budget.frames,Infinity); assert.equal(budget.resolution,768);
  }
  assert.equal(contactShadowRenderBudget({autoRotate:true,tool:'select',mobile:true}).resolution,320);
  assert.equal(contactShadowRenderBudget({autoRotate:false,tool:'select',mobile:true}).resolution,384);
});
test('V5.2: pose and light changes invalidate static shadow capture',()=>{
  const key=contactShadowSceneKey(hero,[],light,'continuo');
  assert.notEqual(contactShadowSceneKey({...hero,rotationY:33},[],light,'continuo'),key);
  assert.notEqual(contactShadowSceneKey({...hero,tiltZ:45},[],light,'continuo'),key);
  assert.notEqual(contactShadowSceneKey({...hero,scale:0.8},[],light,'continuo'),key);
  assert.notEqual(contactShadowSceneKey({...hero,handleStyle:'rounded'},[],light,'continuo'),key);
  assert.notEqual(contactShadowSceneKey(hero,[{id:'second',posX:5}],light,'continuo'),key);
  assert.notEqual(contactShadowSceneKey(hero,[],{...light,rotation:25},'continuo'),key);
  assert.notEqual(contactShadowSceneKey(hero,[],{...light,temperature:600},'continuo'),key);
  assert.notEqual(contactShadowSceneKey(hero,[],{...light,hdriId:'hdri-custom'},'continuo'),key);
  assert.notEqual(contactShadowSceneKey(hero,[],{...light,softness:.7},'continuo'),key);
  assert.notEqual(contactShadowSceneKey(hero,[],light,'pedestal'),key);
  assert.equal(contactShadowSceneKey(hero,[],light,'continuo'),key);
});
test('V5.2: the shadow snapshot does not include artwork uploads',()=>{
  const key=contactShadowSceneKey({...hero, imageId:'data:image/png;base64,secret'},[],light,'continuo');
  assert.ok(!key.includes('secret'));
  assert.ok(key.length<400);
});
test('V5.2: calibrated reference handle roots embed in 4.1 cm body radius',()=>{
  assert.equal(LIVE_SUB_HANDLE_POINTS.length,16);
  const upper=LIVE_SUB_HANDLE_POINTS[0],lower=LIVE_SUB_HANDLE_POINTS.at(-1);
  assert.ok(upper[1]/9.55>.80 && upper[1]/9.55<.85);
  assert.ok(lower[1]/9.55>.16 && lower[1]/9.55<.22);
  for(const p of [upper,lower]) {
    const rootHalfDepth=.42*1.06*referenceHandleSection(0).thickness;
    assert.ok(Math.abs(p[2])-rootHalfDepth > 3.35);
    assert.ok(Math.abs(p[2])+rootHalfDepth < 4.1,'root exterior edge must remain inside ceramic');
  }
  assert.ok(LIVE_SUB_HANDLE_POINTS.some(p=>Math.abs(p[2])>7.4));
});
test('V5.2: molded ceramic handle section grows smoothly without a root bulge',()=>{
  const ws=[0,.01,.03,.06,.10,.15,.22,.5].map(t=>referenceHandleSection(t).width);
  assert.ok(ws.every(v=>Number.isFinite(v)&&v>.30&&v<1.20));
  for(let i=1;i<ws.length;i++) assert.ok(ws[i]>=ws[i-1]-1e-10);
  for(const t of [0,.04,.13,.25,.49,1]){
    assert.ok(Math.abs(referenceHandleSection(t).width-referenceHandleSection(1-t).width)<1e-8);
  }
});
test('V5.2: scene rendering uses snapshot key and dynamic budget; other styles remain supported',()=>{
  const scene=readFileSync(resolve(root,'src/components/tools/mockup/scene/studio.tsx'),'utf8');
  const geom=readFileSync(resolve(root,'src/components/tools/mockup/scene/mug-geometry.ts'),'utf8');
  assert.match(scene,/contactShadowRenderBudget\(/);
  assert.match(scene,/contactShadowSceneKey\(/);
  assert.match(scene,/frames=\{budget\.frames\}/);
  assert.match(scene,/key=\{`contact-sharp-/);
  assert.match(geom,/LIVE_SUB_HANDLE_POINTS\.map/);
  assert.match(geom,/ROUNDED_HANDLE_POINTS/);
  assert.match(geom,/HANDLE_POINTS/);
});
