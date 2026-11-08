import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const modules=new Map();
function load(name){
 if(modules.has(name))return modules.get(name);
 const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(`src/lib/creative/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require(id){return load(id.slice(2));}});
 modules.set(name,module.exports);return module.exports;
}
const {findContactFootprint,pinGroundedNode,pinGroundedDocument,naturalGrounding,groundingTargets}=load('grounding');
const n={id:'mug',kind:'image',role:'mockup',src:'mug.png',x:100,y:100,w:200,h:300,angle:0,opacity:1,grounding:{...naturalGrounding,pin:{surface:.8,contactX:.5,contactY:.9}}};
function contactY(node){const pin=node.grounding.pin,a=node.angle*Math.PI/180,dx=(pin.contactX-.5)*node.w*(node.flipX?-1:1),dy=(pin.contactY-.5+node.grounding.offset)*node.h*(node.flipY?-1:1);return node.y+node.h/2+dx*Math.sin(a)+dy*Math.cos(a);}
test('Transparent margins and faint captured shadows do not become the mug foot',()=>{
 const w=100,h=100,data=new Uint8ClampedArray(w*h*4);
 for(let y=10;y<80;y++)for(let x=20;x<70;x++)data[(y*w+x)*4+3]=255;
 for(let x=0;x<w;x++)data[(95*w+x)*4+3]=30;
 data[(99*w+99)*4+3]=255;
 const base=findContactFootprint(data,w,h);
 assert.equal(base.bottom,.8);assert.equal(base.left,.2);assert.equal(base.right,.7);
 assert.equal(findContactFootprint(new Uint8ClampedArray(w*h*4),w,h),null);
});
test('Pinned mugs stay on the plane after moving, scaling, rotating and scene size changes',()=>{
 for(const attrs of [{y:700},{w:400,h:600},{angle:25},{flipY:true},{flipX:true,angle:-40}]){
  const result=pinGroundedNode({...n,...attrs},1000);assert.ok(Math.abs(contactY(result)-800)<1e-8);
 }
 const result=pinGroundedNode(n,2000);assert.ok(Math.abs(contactY(result)-1600)<1e-8);
 assert.equal(pinGroundedNode({...n,locked:true},1000).y,n.y);
 const released={...n,grounding:{...naturalGrounding}};assert.equal(pinGroundedNode(released,1000),released);
});
test('One click targets the selected image or all available mugs and respects hidden/locked layers',()=>{
 const nodes=[n,{...n,id:'second'}, {...n,id:'locked',locked:true},{...n,id:'hidden',visible:false},{...n,id:'background',role:'background'}];
 assert.deepEqual(Array.from(groundingTargets(nodes,null),n=>n.id),['mug','second']);
 assert.deepEqual(Array.from(groundingTargets(nodes,'second'),n=>n.id),['second']);
 assert.equal(groundingTargets(nodes,'locked').length,0);
 const doc={width:1000,height:1000,background:'#fff',nodes};const result=pinGroundedDocument(doc);
 assert.equal(doc.nodes[0].y,100);assert.equal(result.nodes.length,5);assert.equal(result.nodes[0].id,n.id);
 assert.ok(Math.abs(contactY(result.nodes[0])-800)<1e-8);
});

test('Applying shadows or pinning at the current position never guesses a template height',()=>{
 const {groundingAtCurrentPosition}=load('grounding'),contact={left:.18,right:.72,bottom:.88};
 for(const angle of [0,30,-40])for(const flipX of [false,true]){
  const source={...n,angle,flipX,skew:10,y:170};
  const copy=JSON.stringify(source),shadow=groundingAtCurrentPosition(source,1000,contact);
  assert.equal(shadow.pin,undefined);assert.equal(pinGroundedNode({...source,grounding:shadow},1000).y,source.y);
  const pin=groundingAtCurrentPosition(source,1000,contact,true);
  assert.ok(Math.abs(pinGroundedNode({...source,grounding:pin},1000).y-source.y)<1e-8);
  assert.equal(JSON.stringify(source),copy);
 }
});
test('Contact shading follows a curved alpha edge instead of a broad oval footprint',()=>{
 const {contactContour}=load('grounding'),w=100,h=100,pixels=new Uint8ClampedArray(w*h*4);
 for(let x=20;x<80;x++)for(let y=20;y<=80-Math.round(Math.pow((x-50)/30,2)*8);y++)pixels[(y*w+x)*4+3]=255;
 const base=findContactFootprint(pixels,w,h),band=contactContour(pixels,w,h,base);
 for(let x=0;x<w;x++){
  let count=0;for(let y=0;y<h;y++)if(band[(y*w+x)*4+3]){count++;assert.ok(pixels[(y*w+x)*4+3]>0);}
  assert.ok(count<=3);if(x<20||x>=80)assert.equal(count,0);
 }
 assert.ok(band[(80*w+50)*4+3]>0);assert.equal(band[(82*w+50)*4+3],0);
});
