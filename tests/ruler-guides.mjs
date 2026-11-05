import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(name){const context={exports:{},require:s=>load(s.slice(2))};vm.runInNewContext(ts.transpileModule(fs.readFileSync(`src/lib/creative/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);return context.exports;}
const guides=load('guides'),precision=load('precision'),validate=load('validate-project').validateProjectDocument;
const node={id:'object',kind:'rect',x:163,y:83,w:200,h:60,angle:0,opacity:1};
const doc={width:1000,height:500,background:'#fff',nodes:[node],guides:[{id:'v',axis:'x',position:367,locked:true},{id:'h',axis:'y',position:147}]};
test('Guide coordinates account for zoom and the scrolled canvas rectangle',()=>{
 const rect={left:120,top:-80,width:500,height:250};
 assert.equal(guides.guidePosition('x',220,0,rect,1000,500),200);
 assert.equal(guides.guidePosition('y',0,-5,rect,1000,500),150);
 assert.equal(guides.guideInPage({axis:'x',position:-1},1000,500),false);
 assert.equal(guides.guideInPage({axis:'y',position:501},1000,500),false);
 assert.equal(guides.guideInPage({axis:'x',position:1000},1000,500),true);
 assert.equal(guides.snapGuide(498,'x',1000,500,.5),500);
});
test('Objects snap to persistent guides including locked ones; hidden guides do not attract',()=>{
 const before=JSON.stringify(doc);
 const snapped=precision.snapPosition(node,doc,1);
 assert.equal(snapped.x+node.w,367);assert.equal(snapped.y+node.h,147);
 assert.equal(snapped.guideX,367);assert.equal(snapped.guideY,147);
 const hidden=precision.snapPosition(node,doc,1,false);
 assert.equal(hidden.x,node.x);assert.equal(hidden.y,node.y);
 assert.equal(JSON.stringify(doc),before);
});
test('Guide project metadata validates and legacy documents remain accepted',()=>{
 assert.doesNotThrow(()=>validate(doc));assert.doesNotThrow(()=>validate({...doc,guides:undefined}));
 for(const bad of [null,{},Array.from({length:101},(_,i)=>({id:String(i),axis:'x',position:i})),[{id:'a',axis:'z',position:1}],[{id:'a',axis:'x',position:NaN}],[{id:'a',axis:'x',position:-1}],[{id:'a',axis:'x',position:8193}],[{id:'a',axis:'x',position:1,locked:'yes'}],[{id:'a',axis:'x',position:1},{id:'a',axis:'y',position:2}]])assert.throws(()=>validate({...doc,guides:bad}));
 assert.equal(JSON.parse(JSON.stringify(doc)).guides[0].position,367);
});
