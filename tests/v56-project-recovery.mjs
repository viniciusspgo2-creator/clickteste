import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const require=createRequire(import.meta.url),ts=require('typescript');
const file=resolve(root,'src/lib/creative/project-media-check.ts');
const transpiled=ts.transpileModule(readFileSync(file,'utf8'),{
 fileName:file,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,strict:true}
});
assert.deepEqual(transpiled.diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error)||[],[]);
const mod={exports:{}};
new Function('module','exports','require',transpiled.outputText)(mod,mod.exports,dep=>{if(dep==='./async-image-load')return {loadImageWithTimeout:async()=>({naturalWidth:1,naturalHeight:1})};throw Error(`unexpected runtime import: ${dep}`)});
const {inspectProjectMedia,canApplyLoadedProject}=mod.exports;
const document=()=>({width:2480,height:1122,background:'#fff',nodes:[]});
const node=(id,src,maskSrc)=>({id,kind:'image',x:0,y:0,w:200,h:100,angle:0,opacity:1,src,maskSrc});

test('V5.6: duplicate image and mask source is checked once and reported per affected layer',async()=>{
 const d={...document(),nodes:[node('a','good.png','broken-mask.png'),node('b','good.png','broken-mask.png')]};
 const calls=[];
 const issues=await inspectProjectMedia(d,{image:async url=>{calls.push(url);if(url.includes('broken'))throw Error('fail')},video:async()=>{throw Error('unexpected')}});
 assert.deepEqual(calls.sort(),['broken-mask.png','good.png']);
 assert.equal(issues.length,2);
 assert.ok(issues.every(i=>i.kind==='mask'&&i.severity==='error'));
 assert.deepEqual(issues.map(i=>i.name),['Camada 1','Camada 2']);
});
test('V5.6: invalid video is a warning; broken image is an error',async()=>{
 const d={...document(),nodes:[node('a','broken.png')],video:{src:'video.mp4',name:'Meu clipe',start:0}};
 const issues=await inspectProjectMedia(d,{image:async()=>{throw Error('broken image')},video:async()=>{throw Error('unsupported video')}});
 assert.deepEqual(issues.map(i=>i.severity),['error','warning']);
 assert.equal(issues[1].name,'Meu clipe');
});
test('V5.6: template mask failure has a meaningful name',async()=>{
 const d={...document(),smartTemplate:{slot:{x:0,y:0,w:5,h:5},maskSrc:'missing-mask'}};
 const issues=await inspectProjectMedia(d,{image:async()=>{throw Error('missing')},video:async()=>{}});
 assert.deepEqual(issues,[{kind:'mask',name:'Máscara do template',severity:'error'}]);
});
test('V5.6: independent concurrent decodes are bounded at three',async()=>{
 const d={...document(),nodes:Array.from({length:11},(_,i)=>node(`id${i}`,`image-${i}`))};
 let active=0,peak=0;
 await inspectProjectMedia(d,{image:async()=>{active++;peak=Math.max(peak,active);await new Promise(resolve=>setTimeout(resolve,2));active--;},video:async()=>{}});
 assert.equal(peak,3);
});
test('V5.6: latest import wins, and an intervening edit blocks stale data',()=>{
 const a=document(),b={...a,nodes:[node('a','a.png')]};
 assert.equal(canApplyLoadedProject(1,2,a,a),false);
 assert.equal(canApplyLoadedProject(2,2,a,b),false);
 assert.equal(canApplyLoadedProject(2,2,a,a),true);
});
test('V5.6: editor preflights before replacing a composition; all paths preserve old work on failure',()=>{
 const src=readFileSync(resolve(root,'src/components/creative/creative-editor.tsx'),'utf8');
 assert.match(src,/const issues=await inspectProjectMedia\(d\)/);
 assert.match(src,/const broken=issues\.filter\(i=>i\.severity==='error'\)/);
 assert.match(src,/canApplyLoadedProject\(request,projectLoadRef\.current,captured,stateRef\.current/);
 assert.match(src,/Abrir outro projeto substituirá sua arte atual/);
 assert.match(src,/const resetDocument=\(\)=>\{\+\+projectLoadRef\.current/);
 const importSegment=src.slice(src.indexOf(' const readProject=async'),src.indexOf(' const resize=useCallback'));
 assert.ok(importSegment.indexOf('inspectProjectMedia(d)')<importSegment.indexOf('stateRef.current={history:[d]'));
});
test('V5.6: failed media notices are bounded in large documents',async()=>{
 const d={...document(),nodes:Array.from({length:20},(_,i)=>node(`id${i}`,`broken-${i}.png`))};
 const issues=await inspectProjectMedia(d,{image:async()=>{throw Error('fail')},video:async()=>{}});
 assert.equal(issues.length,4);
 assert.ok(issues.every(i=>i.severity==='error'));
});
test('V5.6: navigating away warns only while the current document differs from last saved snapshot',()=>{
 const src=readFileSync(resolve(root,'src/components/creative/creative-editor.tsx'),'utf8');
 assert.match(src,/savedDocumentRef=useRef<DesignDocument>/);
 assert.match(src,/window\.addEventListener\('beforeunload',beforeUnload\)/);
 assert.match(src,/onClick=\{e=>\{if\(!confirmLeaveEditor\(\)\)e\.preventDefault\(\);\}\}/);
 assert.match(src,/savedDocumentRef\.current=snapshot/);
 assert.match(src,/savedDocumentRef\.current=d/);
 assert.match(src,/savedDocumentRef\.current=next/);
 assert.match(src,/\+\+projectLoadRef\.current;documentSessionRef\.current\.replace\(\);setBusy\(false\)/);
});
