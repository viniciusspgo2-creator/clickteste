import fs from 'node:fs';
import Module, {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import test from 'node:test';
const require = createRequire(import.meta.url), ts = require('typescript');
Module._extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,file);
const THREE=require('three');
const {sceneFootprint,CAMERA_FAR,MAX_CAMERA_DISTANCE,MUG_CONTACT_LAYER,cameraFarFor}=require('../src/components/tools/mockup/scene/scene-layout.ts');
const {interpolateCameraView,fitBoundsToView}=require('../src/components/tools/mockup/scene/framing.ts');
const {visibleMugBounds}=require('../src/components/tools/mockup/scene/studio-refs.ts');
const {DEFAULT_CERAMIC_FINISH,migrateCeramicFinish}=require('../src/components/tools/mockup/lib/ceramic-finishes.ts');
const {createSoftboxTexture}=require('../src/components/tools/mockup/scene/softbox.ts');
const {useMockupStore:store}=require('../src/components/tools/mockup/state/store.ts');

test('off-centre principal and every visible companion remain inside the contact-shadow area',()=>{
 const hero={posX:-140,posZ:90,scale:3}, companions=[{posX:148,posZ:-130,scale:2},{posX:999,posZ:999,scale:3,hidden:true}];
 const a=sceneFootprint(hero,companions);
 for(const p of [hero,companions[0]]) {
  assert.ok(Math.abs(p.posX-a.x)+p.scale*5<a.width/2);
  assert.ok(Math.abs(p.posZ-a.z)+p.scale*5<a.depth/2);
 }
 assert.ok(a.width>280);assert.ok(a.depth>220);assert.ok(a.width<400);
 const caster=new THREE.Mesh();caster.layers.enable(MUG_CONTACT_LAYER);
 const plane=new THREE.Mesh();const camera=new THREE.OrthographicCamera();camera.layers.set(MUG_CONTACT_LAYER);
 assert.equal(camera.layers.test(caster.layers),true);
 assert.equal(camera.layers.test(plane.layers),false,'shadow planes cannot cast into another contact map');
});

test('editor helper meshes never change framing or make real pieces disappear',()=>{
 const scene=new THREE.Scene(), group=new THREE.Group();group.name='mockup-mugs';scene.add(group);
 const piece=new THREE.Group();piece.name='mug-float';piece.position.set(18,5,0);group.add(piece);
 const mug=new THREE.Mesh(new THREE.BoxGeometry(8,10,8));piece.add(mug);
 const expected=visibleMugBounds(scene).clone();
 const helper=new THREE.Group();helper.name='studio-gizmo';group.add(helper);
 const huge=new THREE.Mesh(new THREE.PlaneGeometry(1000000,1000000));helper.add(huge);
 assert.ok(visibleMugBounds(scene).equals(expected));
 mug.geometry.dispose();huge.geometry.dispose();
});

test('opposite camera views orbit around the scene and never cross its centre or the floor',()=>{
 const target=new THREE.Vector3(0,5,0), front=new THREE.Vector3(0,16,110), back=new THREE.Vector3(0,16,-110);
 for(let t=0;t<=1;t+=0.05) {
  const view=interpolateCameraView(front,target,back,target,t);
  assert.ok(view.pos.distanceTo(view.target)>100);
  assert.ok(view.pos.y>target.y);
  assert.ok(Number.isFinite(view.pos.length()));
 }
 const midpoint=interpolateCameraView(front,target,back,target,.5);
 assert.ok(Math.abs(midpoint.pos.x)>100,'halfway through a front/back transition the camera is beside the group');
});

test('all supported zoom distances and wide multi-mug views stay in front of the far clip plane',()=>{
 const bounds=new THREE.Box3(new THREE.Vector3(-175,0,-175),new THREE.Vector3(175,35,175));
 for(const aspect of [.4,1,2]) for(const dir of [new THREE.Vector3(0,.14,1),new THREE.Vector3(1,.42,.5),new THREE.Vector3(.01,1,.06)]) {
  const fit=fitBoundsToView(bounds,dir,16,aspect);
  const camera=new THREE.PerspectiveCamera(16,aspect,.1,cameraFarFor(fit.pos.distanceTo(fit.target),bounds.getBoundingSphere(new THREE.Sphere()).radius));camera.position.copy(fit.pos);camera.lookAt(fit.target);camera.updateMatrixWorld(true);
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]) {
   const p=new THREE.Vector3(x,y,z).project(camera);
   assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1&&p.z<1&&p.z>-1,JSON.stringify({aspect,p}));
  }
 }
 assert.ok(CAMERA_FAR>MAX_CAMERA_DISTANCE+500);
});

test('three mugs retain independent artwork, rotation and identities when composition changes',()=>{
 store.getState().resetAll();store.getState().compose('pair');
 const second=store.getState().companions[0].id;
 store.getState().setArtImage({objectId:'hero',imageId:'left-art',name:'left.png',width:2000,height:1000});
 store.getState().setArtImage({objectId:second,imageId:'right-art',name:'right.png',width:1000,height:1000});
 store.getState().patchObject(second,{rotationY:177});
 assert.equal(store.getState().art.imageId,'left-art');assert.equal(store.getState().companions[0].art.imageId,'right-art');
 assert.notEqual(store.getState().mug.rotationY,177);
 store.getState().compose('trio');
 assert.equal(store.getState().companions[0].id,second);assert.equal(store.getState().companions[0].art.imageId,'right-art');
 assert.equal(store.getState().art.imageId,'left-art');
 store.getState().copyArtToAll(second);
 assert.equal(store.getState().art.imageId,'right-art');assert.equal(store.getState().companions[1].art.imageId,'right-art');
 assert.notStrictEqual(store.getState().art,store.getState().companions[0].art);
 store.getState().patchObjectArt(second,{offsetX:.3});assert.notEqual(store.getState().art.offsetX,.3);
 store.getState().resetAll();
});

test('softbox has feathered edges and the new preset preserves a polished coat without the old strong gain',()=>{
 const texture=createSoftboxTexture();const {width,height,data}=texture.image;
 const at=(x,y)=>data[(y*width+x)*4];
 assert.equal(at(0,height/2),0);assert.equal(at(width-1,height/2),0);
 assert.ok(at(width/2,height/2)>240);assert.ok(at(5,height/2)>0&&at(5,height/2)<at(20,height/2));
 assert.ok(DEFAULT_CERAMIC_FINISH.clearcoat>=.9);
 assert.ok(DEFAULT_CERAMIC_FINISH.glazeStrength>0&&DEFAULT_CERAMIC_FINISH.glazeStrength<1.45);
 assert.ok(DEFAULT_CERAMIC_FINISH.reflection>0&&DEFAULT_CERAMIC_FINISH.reflection<1.25);
 assert.ok(DEFAULT_CERAMIC_FINISH.clearcoatRoughness>.025);
 texture.dispose();
});

test('previous default is softened on project restore while custom and high-gloss finishes remain unchanged',()=>{
 const old={roughness:.055,clearcoat:1,clearcoatRoughness:.025,specularIntensity:1,reflection:1.25,glazeStrength:1.45};
 assert.deepEqual(migrateCeramicFinish(old),DEFAULT_CERAMIC_FINISH);
 const custom={...old,glazeStrength:2.2};assert.strictEqual(migrateCeramicFinish(custom),custom);
 store.getState().resetAll();store.getState().hydrate({mug:old});
 assert.equal(store.getState().mug.glazeStrength,1);store.getState().resetAll();
});

const {buildHandleGeometry}=require('../src/components/tools/mockup/scene/mug-geometry.ts');
const {buildModel,supportHeight,MODELS}=require('../src/components/tools/mockup/scene/model-geometry.ts');
const {MUG}=require('../src/components/tools/mockup/lib/config.ts');

test('rounded D handle is a distinct continuous native mesh with buried roots and smooth UV seam',()=>{
 const original=buildHandleGeometry(), rounded=buildHandleGeometry('rounded');
 assert.equal(rounded.index.count,144*40*6);
 const p=rounded.getAttribute('position'),n=rounded.getAttribute('normal'),uv=rounded.getAttribute('uv');
 assert.ok(rounded.boundingBox.min.y<original.boundingBox.min.y-.3);
 assert.ok(rounded.boundingBox.max.y>original.boundingBox.max.y+.1);
 for(let i=0;i<p.count;i++) {
  assert.ok(Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i)));
  assert.ok(Math.abs(new THREE.Vector3().fromBufferAttribute(n,i).length()-1)<1e-5);
  assert.ok(uv.getX(i)>=0&&uv.getX(i)<=1&&uv.getY(i)>=0&&uv.getY(i)<=1);
  assert.ok(Math.hypot(p.getX(i),p.getZ(i))<7.2);
 }
 for(const base of [0,144*41])for(let j=0;j<=40;j++) {
  const i=base+j,r=Math.hypot(p.getX(i),p.getZ(i));
  assert.ok(r>MUG.innerR+.08&&r<MUG.topOuterR,'root must sit inside the ceramic wall without entering the cavity');
 }
 for(let ring=0;ring<=144;ring++) {
  const a=ring*41,b=a+40;
  assert.ok(new THREE.Vector3().fromBufferAttribute(p,a).distanceTo(new THREE.Vector3().fromBufferAttribute(p,b))<1e-6);
  assert.ok(new THREE.Vector3().fromBufferAttribute(n,a).distanceTo(new THREE.Vector3().fromBufferAttribute(n,b))<1e-5);
 }
 original.dispose();rounded.dispose();
});

test('both native handles adapt to every body and stay above the floor in arbitrary poses',()=>{
 for(const def of MODELS)for(const style of ['classic','rounded']) {
  const model=buildModel(def.id,style);
  assert.ok(model.handle.boundingBox.min.y>0&&model.handle.boundingBox.max.y<def.height);
  for(const angles of [[0,0,0],[.4,1,.7],[Math.PI/2,0,0],[0,0,Math.PI]]) {
   const euler=new THREE.Euler(...angles),q=new THREE.Quaternion().setFromEuler(euler),height=supportHeight(model.body,model.handle,euler,true);
   let min=Infinity;
   for(const geo of [model.body,model.handle]) {
    const p=geo.getAttribute('position');
    for(let i=0;i<p.count;i++) {
     const v=new THREE.Vector3().fromBufferAttribute(p,i);v.y-=MUG.height/2;v.applyQuaternion(q);min=Math.min(min,v.y+height);
    }
   }
   assert.ok(Math.abs(min)<1e-6,`${def.id}/${style} sits exactly on the support plane`);
  }
  model.body.dispose();model.handle.dispose();model.basePrint.dispose();
 }
});

test('handle choice belongs to each piece and survives snapshot restoration and duplication',()=>{
 store.getState().resetAll();store.getState().compose('pair');
 const id=store.getState().companions[0].id;
 store.getState().patchObject(id,{handleStyle:'rounded'});
 assert.equal(store.getState().mug.handleStyle,'classic');
 const saved=JSON.parse(JSON.stringify({mug:store.getState().mug,companions:store.getState().companions}));
 store.getState().resetAll();store.getState().hydrate(saved);
 assert.equal(store.getState().companions[0].handleStyle,'rounded');
 store.getState().select(id);store.getState().duplicateSelected();
 assert.equal(store.getState().companions[1].handleStyle,'rounded');
 store.getState().resetAll();store.getState().hydrate({mug:{handleStyle:'unavailable'}});
 assert.equal(store.getState().mug.handleStyle,'classic');store.getState().resetAll();
});
