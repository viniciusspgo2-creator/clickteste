import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const fn = read('src/components/tools/mockup/lib/freehand-rotation.ts');
const freehandRotation = (start,dx,dy,options)=>{
  const radiansPerPixel=Math.PI/180*(options.fine?0.12:0.5);
  return {x:start.x+dy*radiansPerPixel,y:start.y-(options.roll?0:dx)*radiansPerPixel,z:start.z+(options.roll?dx:0)*radiansPerPixel};
};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
test('freehand rotation: yaw/pitch, roll and fine gestures are independent',()=>{
  const a={x:0.1,y:-0.4,z:0.2};
  const normal=freehandRotation(a,180,90,{fine:false,roll:false});
  close(normal.x,a.x+Math.PI/4);close(normal.y,a.y-Math.PI/2);close(normal.z,a.z);
  const roll=freehandRotation(a,180,90,{fine:false,roll:true});
  close(roll.y,a.y);close(roll.z,a.z+Math.PI/2);
  const fine=freehandRotation(a,180,90,{fine:true,roll:false});
  assert.ok(fine.x-a.x<normal.x-a.x);
  assert.match(fn,/export function freehandRotation/);
});
test('execute the actual freehand rotation module in Node 22 (no mock math)',()=>{
  const script = `import { freehandRotation } from './src/components/tools/mockup/lib/freehand-rotation.ts'; console.log(JSON.stringify(freehandRotation({x:0,y:0,z:0},180,90,{fine:false,roll:false})));`;
  const result=spawnSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',script],{cwd:root,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const r=JSON.parse(result.stdout.trim());
  close(r.x,Math.PI/4);close(r.y,-Math.PI/2);close(r.z,0);
});
test('circular bottom print uses depth separation, polygon offset and mip filters',()=>{
  const geometry=read('src/components/tools/mockup/scene/mug-geometry.ts');
  const mug=read('src/components/tools/mockup/scene/mug.tsx');
  assert.match(geometry,/MUG\.footH - 0\.04 \* t \* t - 0\.018/);
  assert.match(mug,/result\.polygonOffset = true/);
  assert.match(mug,/t\.minFilter = THREE\.LinearMipmapLinearFilter/);
  assert.match(mug,/basePrint \/>/);
});
test('gesture keeps pointer ownership, cancellation and atomic commit handling',()=>{
  const mug=read('src/components/tools/mockup/scene/mug.tsx');
  assert.match(mug,/beginTransform\("rotate-free", pointerId\)/);
  assert.match(mug,/freehandRotation\(item\.rotation/);
  assert.match(mug,/gesture\.current\?\.kind === "rotate-free"/);
  assert.match(mug,/commitObjectTransforms\(updates\)/);
  assert.match(mug,/cancelInteraction\(\)/);
});
test('shadow controls affect only ground catcher and contact shadow render, not the ink shader',()=>{
  const studio=read('src/components/tools/mockup/scene/studio.tsx');
  const shade=read('src/components/tools/mockup/ui/shadow-presets.tsx');
  assert.match(studio,/function ShadowCatcher\(\)/);
  assert.match(studio,/shadowMaterial transparent opacity=\{Math\.min/);
  assert.match(studio,/MUG_CONTACT_LAYER/);
  assert.match(shade,/st\.patch\("light",\{shadowOpacity:p\.opacity,softness:p\.softness\}\)/);
  assert.match(shade,/st\.patch\("bg",\{contactShadow:true,castShadow:true\}\)/);
  assert.ok(!shade.includes('reflection') && !shade.includes('clearcoat'));
});
test('presets and manual controls are accessible in product and scene tabs',()=>{
  const workspace=read('src/components/tools/mockup/ui/workspace.tsx');
  const pose=read('src/components/tools/mockup/ui/pose-controls.tsx');
  assert.match(workspace,/<PoseControls \/>/);
  assert.match(workspace,/<ShadowPresets \/>/);
  assert.match(pose,/\["Deitada",90,0\]/);
  assert.match(pose,/"rotate"/);
  assert.match(pose,/"move"/);
  assert.match(pose,/Inclinar para frente/);
});
