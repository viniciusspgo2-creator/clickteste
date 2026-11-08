import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import sharp from 'sharp';
const catalog=JSON.parse(fs.readFileSync('src/lib/creative/studio-scenes.json','utf8'));
let serial=0;
const modules=new Map();
function load(name){
 if(modules.has(name))return modules.get(name);
 const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(`src/lib/creative/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{
  module,exports:module.exports,require(id){if(id==='./design')return {uid:()=>`scene-test-${++serial}`};if(id.endsWith('.json'))return catalog;return load(id.slice(2));}
 });modules.set(name,module.exports);return module.exports;
}
const {composeStudioScene,filterStudioScenes,findStudioScene}=load('studio-scenes');
const mug=(id,x)=>({id,kind:'image',role:'mockup',src:'data:image/png;base64,AA==',x,y:200,w:180,h:260,angle:0,opacity:1,shadow:12});
const original={width:1080,height:1350,background:'#000',nodes:[mug('front',200),mug('back',450),{id:'logo',kind:'image',role:'content',src:'logo',x:50,y:40,w:100,h:50,angle:0,opacity:1},{id:'text',kind:'text',text:'Minha marca',x:30,y:40,w:300,h:100,size:40,angle:0,opacity:1}]};
test('All 112 supplied scenes have decodable originals and small previews matching the catalog',async()=>{
 assert.equal(catalog.length,112);assert.equal(new Set(catalog.map(s=>s.id)).size,112);
 for(const scene of catalog){
  const original=await sharp(`public${scene.src}`).metadata(),preview=await sharp(`public${scene.preview}`).metadata();
  assert.equal(original.width,scene.width);assert.equal(original.height,scene.height);assert.equal(original.format,'webp');assert.ok(preview.width<=420);assert.equal(preview.format,'webp');
 }
});
test('Category/search includes accented labels and unknown IDs cannot select arbitrary URLs',()=>{
 assert.ok(filterStudioScenes('cafes','').length>0);assert.equal(filterStudioScenes('inexistente','').length,0);
 assert.ok(filterStudioScenes('','Aniversário').every(s=>s.category==='Aniversário'));
 assert.equal(findStudioScene('../../elsewhere'),undefined);
});
test('Scene replaces the old backdrop and fits independent mugs without changing their relative scale',()=>{
 const before=JSON.stringify(original),scene=catalog[0],result=composeStudioScene(original,scene,'data:image/webp;base64,AA==');
 assert.equal(JSON.stringify(original),before);assert.equal(result.width,scene.width);assert.equal(result.height,scene.height);
 assert.equal(result.nodes[0].role,'background');assert.equal(result.nodes[0].locked,true);
 const mugs=result.nodes.filter(n=>n.role==='mockup'),slot=result.smartTemplate.slot;
 assert.equal(mugs.length,2);assert.equal(mugs[0].id,'front');assert.equal(mugs[1].id,'back');
 for(const mug of mugs){assert.ok(Math.abs(mug.w/mug.h-180/260)<1e-8);assert.ok(mug.x>=slot.x-1e-8&&mug.x+mug.w<=slot.x+slot.w+1e-8);assert.ok(mug.y>=slot.y-1e-8&&mug.y+mug.h<=slot.y+slot.h+1e-8);assert.ok(Math.abs(mug.shadow/mug.w-12/180)<1e-8);}
 assert.equal(result.nodes.find(n=>n.id==='text').text,'Minha marca');assert.equal(result.nodes.find(n=>n.id==='logo').src,'logo');
});
test('Switching a smart scene clears its automatic mask and foreground but preserves user layers',()=>{
 const current={...original,smartTemplate:{maskSrc:'old-mask',slot:{x:0,y:0,w:100,h:100}},nodes:[{id:'old',kind:'image',role:'background'},{id:'fg',kind:'image',role:'foreground'},...original.nodes.map(n=>n.role==='mockup'?{...n,maskSrc:'old-mask',maskSpace:'canvas'}:n)]};
 const result=composeStudioScene(current,catalog[1],'new-scene');
 assert.ok(!result.nodes.some(n=>n.id==='old'||n.id==='fg'));assert.ok(result.nodes.filter(n=>n.role==='mockup').every(n=>!n.maskSrc));assert.equal(result.smartTemplate.maskSrc,undefined);
});
test('An empty scene keeps an insertion slot for a later mug and uses native image proportions',()=>{
 const result=composeStudioScene({...original,nodes:[]},catalog[2],'scene');
 assert.equal(result.nodes.length,1);assert.ok(result.smartTemplate.slot.w>0);assert.equal(result.nodes[0].w/result.nodes[0].h,catalog[2].width/catalog[2].height);
});

test('Changing photographic scenes preserves arrangement and drops an old table pin',()=>{
 const grounding={strength:.8,softness:.5,direction:.4,length:.2,offset:0,pin:{surface:.99,contactX:.5,contactY:.9}};
 const prior={width:1000,height:1250,background:'#fff',smartTemplate:{sceneId:'cenario-001',slot:{x:120,y:700,w:760,h:475}},nodes:[{...mug('one',140),y:450,grounding},{...mug('two',470),y:550,grounding}]};
 const scene={...catalog[1],width:1000,height:1250};
 const result=composeStudioScene(prior,scene,'new-scene');
 for(const old of prior.nodes){const next=result.nodes.find(n=>n.id===old.id);assert.equal(next.x,old.x);assert.equal(next.y,old.y);assert.equal(next.w,old.w);assert.equal(next.h,old.h);assert.equal(next.grounding.pin,undefined);assert.equal(old.grounding.pin.surface,.99);}
 assert.equal(result.smartTemplate.sceneId,scene.id);
});
