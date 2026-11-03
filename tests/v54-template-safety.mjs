import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
function load(file){
 const abs=resolve(root,file);
 const transpiled=ts.transpileModule(readFileSync(abs,'utf8'),{
  fileName:abs,reportDiagnostics:true,
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,strict:true},
 });
 assert.deepEqual((transpiled.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error),[]);
 const module={exports:{}};
 new Function('module','exports','require',transpiled.outputText)(module,module.exports,dependency=>{throw Error(`Unexpected dependency ${dependency}`)});
 return module.exports;
}
const {canCommitAsyncTemplate,replaceFlatScene,detachAutomaticSmartMask}=load('src/lib/creative/template-transition.ts');
test('V5.4: older template finishing after newer choice cannot overwrite artwork',()=>{
 const initial={width:800,height:400,background:'#fff',nodes:[]};
 assert.equal(canCommitAsyncTemplate(1,2,initial,initial),false);
 assert.equal(canCommitAsyncTemplate(2,2,initial,initial),true);
});
test('V5.4: edits during template loading invalidate the capture',()=>{
 const initial={width:800,height:400,background:'#fff',nodes:[]};
 const edited={...initial,nodes:[{id:'user-text',kind:'text'}]};
 assert.equal(canCommitAsyncTemplate(5,5,initial,edited),false);
 assert.equal(canCommitAsyncTemplate(5,5,initial,initial),true);
});
test('V5.4: ordinary background clears ONLY template automatic masks, keeps custom masks',()=>{
 const auto={id:'mug-auto',kind:'image',role:'mockup',src:'mug',maskSrc:'old-scene',maskMode:'alpha',maskSpace:'canvas'};
 const custom={id:'mug-custom',kind:'image',role:'mockup',src:'mug2',maskSrc:'user-mask',maskMode:'luminance',maskSpace:'element'};
 const previous={width:800,height:400,background:'#fff',smartTemplate:{slot:{x:1,y:1,w:2,h:2},maskSrc:'old-scene'},nodes:[
 {id:'old-background',kind:'image',role:'background'},
 {id:'old-overlay',kind:'image',role:'foreground'},
 auto,custom,{id:'user-text',kind:'text',role:'content'}
 ]};
 const fresh={id:'new-background',kind:'image',role:'background'};
 const result=replaceFlatScene(previous,fresh);
 assert.equal(result.smartTemplate,undefined);
 assert.deepEqual(result.nodes.map(n=>n.id),['new-background','mug-auto','mug-custom','user-text']);
 assert.equal(result.nodes[1].maskSrc,undefined);
 assert.equal(result.nodes[1].maskMode,undefined);
 assert.equal(result.nodes[2].maskSrc,'user-mask');
 assert.equal(result.nodes[2].maskSpace,'element');
 assert.ok(previous.nodes[2].maskSrc,'old doc stays intact for undo');
});
test('V5.4: template loader guards admin, local and demonstration imports',()=>{
 const source=readFileSync(resolve(root,'src/components/creative/creative-editor.tsx'),'utf8');
 assert.match(source,/const commitSmartTemplate=/);
 assert.match(source,/canCommitAsyncTemplate\(request,templateRequestRef\.current,captured,stateRef\.current/);
 assert.match(source,/commitSmartTemplate\(request,captured,template\)/);
 assert.match(source,/commitSmartTemplate\(request,captured,a\)/);
 assert.match(source,/\+\+templateRequestRef\.current;const base=makeBuiltInPreset/);
 assert.doesNotMatch(source,/isStillCurrentDocument\(/);
});
test('V5.4: GitHub pipeline runs tests, generates Prisma Client and checks types before build',()=>{
 const yaml=readFileSync(resolve(root,'.github/workflows/verify-clickgruda.yml'),'utf8');
 assert.match(yaml,/npm ci --no-audit --no-fund/);
 assert.match(yaml,/npm run verify:creative/);
 assert.match(yaml,/npx prisma generate/);
 assert.match(yaml,/npx tsc --noEmit/);
 assert.match(yaml,/npm run build/);
 assert.doesNotMatch(yaml,/db push|migrate dev|migrate deploy/);
});
