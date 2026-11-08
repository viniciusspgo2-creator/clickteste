import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
const source=file=>readFileSync(resolve(root,file),'utf8');
function moduleFor(file,stubs={}){
 const output=ts.transpileModule(source(file),{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,strict:true}});
 assert.equal((output.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,'Syntax '+file);
 const m={exports:{}};
 new Function('module','exports','require',output.outputText)(m,m.exports,name=>{
  if(name in stubs)return stubs[name];throw Error('Unexpected runtime dependency '+name);
 });
 return m.exports;
}
const sh=()=>moduleFor('src/components/tools/mockup/lib/shadow-pose.ts');
const doc=(nodes,width=2480,height=1122)=>({width,height,background:'#fff',nodes});
const node=(props={})=>({id:'x',kind:'image',x:0,y:0,w:2480,h:1122,angle:0,opacity:1,src:'data:image/png;base64,AA==',...props});
test('sombra da caneca vertical permanece compacta, deitada acompanha a pose',()=>{
 const {projectedShadowPose}=sh();
 const upright=projectedShadowPose(0,0,0); assert.equal(upright.stretch,1);assert.equal(upright.flatness,0);
 const horizontal=projectedShadowPose(90,0,0);
 assert.ok(horizontal.stretch>2);assert.ok(horizontal.flatness>.999);
 const alongX=projectedShadowPose(0,90,0);
 assert.ok(alongX.stretch>2);assert.ok(Math.abs(alongX.angle-horizontal.angle)>1);
 const turned=projectedShadowPose(90,0,90);
 assert.ok(Number.isFinite(turned.angle));assert.ok(turned.stretch>=1);
 assert.deepEqual(projectedShadowPose(NaN,Infinity,-Infinity),upright);
});
test('avaliação de imagens mede pixels efetivos após ampliar/recortar sem ler rede',async()=>{
 const {effectiveRasterDpi,checkRasterQuality}=moduleFor('src/lib/creative/image-quality.ts');
 const full=node();
 assert.ok(Math.abs(effectiveRasterDpi(full,{width:2480,height:1122})-300)<2);
 const poor=effectiveRasterDpi(full,{width:350,height:150});assert.ok(poor<50);
 const cropped=effectiveRasterDpi(node({crop:{left:.25,right:.25,top:0,bottom:0}}),{width:2480,height:1122});assert.ok(cropped<300);
 const seen=[];
 const checks=await checkRasterQuality(doc([full]),async src=>{seen.push(src);return {width:350,height:150};});
 assert.equal(seen.length,1);assert.ok(checks.some(x=>x.kind==='warning'&&x.message.includes('140 DPI')));
 const skipped=await checkRasterQuality(doc([node({visible:false}),node({src:'data:image/svg+xml,%3Csvg%3E'})]),async()=>{throw Error('Should not load')});
 assert.equal(skipped.length,0);
 assert.deepEqual(await checkRasterQuality(doc([full],1080,1350),async()=>{throw Error('Should not load')}),[]);
});
test('área segura detecta texto girado e protege texto sem rotação',()=>{
 const {checkBeforeExport,rotatedBounds}=moduleFor('src/lib/creative/print-check.ts');
 const base={id:'text',kind:'text',x:900,y:120,w:720,h:90,angle:0,opacity:1,text:'Café com amor',size:70};
 const regular=checkBeforeExport(doc([base]));assert.ok(regular.some(x=>x.kind==='success'));
 const rotated={...base,angle:90};
 const box=rotatedBounds(rotated);assert.ok(box.top<0);
 const msgs=checkBeforeExport(doc([rotated]));
 assert.ok(msgs.some(x=>x.kind==='warning'&&x.message.includes('área visível')));
});
test('template permite reencaixe repetido sem distorcer e sem perder máscara',()=>{
 const {fitMockupIntoSlot}=moduleFor('src/lib/creative/smart-templates.ts',{'./template-archive':{},'./design':{uid:()=> 'test'}});
 const before=node({x:50,y:80,w:400,h:200,angle:45,role:'mockup',shadow:18});
 const slot={x:600,y:200,w:300,h:500};
 const fit=fitMockupIntoSlot(before,slot,'data:image/png;base64,AA==');
 assert.equal(fit.w/fit.h,2);assert.equal(fit.x,600);assert.equal(fit.y,375);assert.equal(fit.angle,0);
 assert.equal(fit.shadow,13.5);assert.equal(fit.maskSrc,'data:image/png;base64,AA==');
 assert.equal(before.maskSrc,undefined);assert.equal(before.angle,45);
 assert.throws(()=>fitMockupIntoSlot(before,{...slot,w:0}),/inválidas/);
});
test('UI liga avisos de raster, botão de reencaixe e sombra projetada',()=>{
 const e=source('src/components/creative/creative-editor.tsx');
 const studio=source('src/components/tools/mockup/scene/studio.tsx');
 assert.match(e,/checkRasterQuality\(doc,/);
 assert.match(e,/fitMockupIntoSlot\(active,/);
 assert.match(e,/Reencaixar caneca/);
 assert.match(studio,/projectedShadowPose\(m\.tiltX/);
 assert.match(studio,/pose\.stretch/);
});
