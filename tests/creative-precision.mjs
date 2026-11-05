import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(name){
 const context={exports:{},require:specifier=>{
  if(specifier==='./background-catalog.json')return {default:JSON.parse(fs.readFileSync('src/lib/creative/background-catalog.json','utf8'))};
  if(specifier==='./uploaded-library.json')return {default:JSON.parse(fs.readFileSync('src/lib/creative/uploaded-library.json','utf8'))};
  if(specifier==='./precision')return load('precision');
  if(specifier==='./bundled-library.json')return JSON.parse(fs.readFileSync('src/lib/creative/bundled-library.json','utf8'));
  throw Error(`Unexpected dependency: ${specifier}`);
 }};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(`src/lib/creative/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
 return context.exports;
}
const precision=load('precision'),manifest=load('library-manifest');
const node={id:'one',kind:'rect',x:100,y:150,w:200,h:80,angle:0,opacity:1};
const doc={width:1000,height:500,nodes:[node]};
test('Official root-object indexes parse correctly and local search labels survive loading',()=>{
 const stock=load('stock-icons');
 const index={heart:{category:'Love',tags:['love','valentine'],styles:{outline:{}}},'filled-only':{styles:{filled:{}}}};
 assert.equal(stock.parseTablerIndex(index).length,1);
 assert.ok(stock.parseTablerIndex(index)[0].label.includes('valentine'));
 const catalog=JSON.parse(fs.readFileSync('public/creative-library/tabler-catalog.json','utf8'));
 const parsed=stock.parseTablerIndex(catalog);
 assert.equal(parsed[0].label,catalog[0].label);
 assert.equal(manifest.libraryManifest(parsed).length,2081+manifest.UPLOADED_ITEMS.length+manifest.EXPANDED_BACKGROUND_ITEMS.length);
 assert.equal(stock.parseTablerIndex(null).length,0);
});
test('Keyboard moves in document pixels, with fine and accelerated steps',()=>{
 assert.equal(precision.nudgeDelta('ArrowLeft').x,-1);
 assert.equal(precision.nudgeDelta('ArrowDown',true).y,10);
 assert.equal(precision.nudgeDelta('ArrowUp',false,true).y,-.1);
 assert.equal(precision.nudgeDelta('Enter'),null);
});
test('Alignment respects rotated visual edges, including off-page objects',()=>{
 const rotated={...node,angle:90};
 const left={...rotated,...precision.alignToPage(rotated,doc,'left')};
 const bottom={...rotated,...precision.alignToPage(rotated,doc,'bottom')};
 assert.ok(Math.abs(precision.visualBounds(left).x)<1e-8);
 const b=precision.visualBounds(bottom);assert.ok(Math.abs(b.y+b.h-doc.height)<1e-8);
 assert.equal(precision.alignToPage(node,doc,'center').x,400);
 assert.equal(precision.alignToPage(node,doc,'middle').y,210);
 assert.equal(node.x,100);
});
test('Snapping chooses the nearest edge and keeps a six-screen-pixel threshold',()=>{
 const moving={...node,x:397,y:145};
 const snapped=precision.snapPosition(moving,doc,1);
 assert.equal(snapped.x,400);assert.equal(snapped.guideX,500);
 const target={...node,id:'target',x:760,y:200};
 const near={...node,x:554,y:50};
 const objectSnap=precision.snapPosition(near,{...doc,nodes:[near,target]},1);
 assert.equal(objectSnap.x+near.w,760);
 const hiddenSnap=precision.snapPosition(near,{...doc,nodes:[near,{...target,visible:false}]},1);
 assert.equal(hiddenSnap.x,near.x);
 assert.equal(precision.snapPosition({...node,x:390},doc,.5).x,400);
 assert.equal(precision.snapPosition({...node,x:390},doc,1).x,390);
});
test('Ruler millimeters use 300 DPI and major labels remain legible at all zooms',()=>{
 for(const zoom of [.08,.2,1,3])for(const unit of ['mm','px']){
  const ticks=precision.rulerTicks(2480,zoom,unit),majors=ticks.filter(t=>t.major);
  assert.ok(ticks.length<1000);assert.equal(ticks[0].position,0);
  if(majors.length>1)assert.ok(majors[1].position-majors[0].position>=63.9);
  for(const tick of ticks)assert.ok(tick.position<=2480*zoom+1e-6);
 }
 assert.ok(Math.abs(precision.PRINT_PX_PER_MM*210-2480.31496)<.001);
});
test('Every bundled asset resolves locally and licenses ship alongside it',()=>{
 const bundled=JSON.parse(fs.readFileSync('src/lib/creative/bundled-library.json','utf8'));
 const catalog=JSON.parse(fs.readFileSync('public/creative-library/tabler-catalog.json','utf8'));
 assert.equal(catalog.length,1600);
 const all=manifest.libraryManifest(catalog),ids=new Set();
 assert.equal(all.length,2081+manifest.UPLOADED_ITEMS.length+manifest.EXPANDED_BACKGROUND_ITEMS.length);
 for(const item of all){
  assert.ok(!ids.has(item.id));ids.add(item.id);
  if(/^(native|background|pattern|kawaii|text):/.test(item.arquivo))continue;
  assert.ok(bundled[item.id],`${item.id} missing from local bundle`);
  const file=fs.readFileSync(`public/creative-library/${bundled[item.id]}`);
  if(item.formato==='PNG')assert.equal(file.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  else if(item.formato==='WEBP'){assert.equal(file.subarray(0,4).toString(),'RIFF');assert.equal(file.subarray(8,12).toString(),'WEBP');}
  else assert.match(file.toString(),/<svg[\s>]/);
 }
 for(const license of ['Tabler','Fluent','Noto','Lucide','Phosphor'])assert.ok(fs.statSync(`public/creative-library/LICENSE-${license}.txt`).size>500);
});
test('Original kawaii illustrations render as standalone safe SVGs',()=>{
 const kawaii=load('library-kawaii');
 assert.equal(manifest.KAWAII_ITEMS.length,24);
 for(const item of manifest.KAWAII_ITEMS){
  const uri=kawaii.kawaiiSvg(item.arquivo,'#123456'),svg=decodeURIComponent(uri.split(',')[1]);
  assert.match(svg,/viewBox="0 0 800 800"/);assert.ok(svg.includes('#123456'));
  assert.doesNotMatch(svg,/<script|foreignObject|href=|MAIN/);
 }
});

test('Mug face placement and duplication preserve scale and never mirror the artwork',()=>{
 const mug=load('mug-layout'),page={width:2480,height:1122};
 const left={...node,...mug.centerOnMugFace(node,page,'left')};
 const right={...left,...mug.oppositeMugFace(left,page)};
 assert.equal(right.x-left.x,page.width/2);assert.equal(right.y,left.y);assert.equal(right.w,left.w);
 assert.equal(mug.centerOnMugFace(node,page,'right').x+node.w/2,page.width*.75);
 assert.throws(()=>mug.oppositeMugFace({...node,w:1500},page));
 assert.throws(()=>mug.oppositeMugFace({...node,x:2500},page));
 assert.equal(mug.isMugDocument(page),true);assert.equal(mug.isMugDocument({width:1080,height:1920}),false);
});
test('Measured resize keeps text effects proportional and supports unlocked shapes',()=>{
 const mug=load('mug-layout'),text={...node,kind:'text',size:20,tracking:2,curve:30};
 const resized=mug.resizeMeasuredNode(text,'w',300);
 assert.equal(resized.h,120);assert.equal(resized.size,30);assert.equal(resized.tracking,3);assert.equal(resized.curve,45);
 const free=mug.resizeMeasuredNode({...node,aspectLock:false},'h',400);assert.equal(free.h,400);assert.equal(free.w,undefined);
 assert.throws(()=>mug.resizeMeasuredNode(node,'w',NaN));assert.throws(()=>mug.resizeMeasuredNode(node,'w',-1));
});
