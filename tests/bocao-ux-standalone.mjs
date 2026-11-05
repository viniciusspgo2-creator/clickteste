/* Fast self-contained UX contract checks. Use global TypeScript only if local deps aren't installed.
 * Full Studio tests and browser/build validation still require npm ci from the lockfile. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const root = join(fileURLToPath(new URL('..', import.meta.url)));
const ts = (()=>{ try{return require('typescript')} catch {return require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')} })();
const src=(p)=>readFileSync(join(root,p),'utf8');
function diagnostics(filename) {
 const result=ts.transpileModule(src(filename),{fileName:filename,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}});
 return result.diagnostics?.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' '))??[];
}
const libFile='src/components/tools/mockup/lib/base-art.ts';
const js=ts.transpileModule(src(libFile),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const fixtureModule={exports:{}};new Function('module','exports',js)(fixtureModule,fixtureModule.exports);
const {normalizeBocaoAngle,baseArtTransform,bocaoPointerAngleDeg,bocaoDragRotation}=fixtureModule.exports;

test('TSX/TS edits parse without syntax errors',()=>{
 for(const f of ['src/components/tools/mockup/ui/workspace.tsx','src/components/tools/mockup/ui/base-art-panel.tsx',libFile])assert.deepEqual(diagnostics(f),[],f);
});
test('full circular rotation wraps and imports legacy negatives',()=>{
 for(const [source,want] of [[0,0],[90,90],[270,270],[-90,270],[359,359],[360,0],[720,0],[-450,270]])assert.equal(normalizeBocaoAngle(source),want);
 assert.equal(normalizeBocaoAngle(NaN),0);
});
test('wheel maps top right bottom left to stable pointer angles',()=>{
 for(const [x,y,expect] of [[0,-10,-90],[10,0,0],[0,10,90],[-10,0,180]]) assert.equal(bocaoPointerAngleDeg(x,y,0,0),expect);
});
test('rotating across the atan2 seam does not suddenly jump on the mug',()=>{
 assert.equal(bocaoDragRotation(20,179,-179),22);
 assert.equal(bocaoDragRotation(20,-179,179),18);
 assert.equal(bocaoDragRotation(350,0,30),20);
 assert.equal(bocaoDragRotation(0,-90,0),90);
});
test('old base art scale/offset and safety clamps stay untouched',()=>{
 assert.deepEqual(baseArtTransform({baseRotation:-95}),{scale:1,x:0,y:0});
 assert.deepEqual(baseArtTransform({baseScale:3.7,baseOffsetX:1.8,baseOffsetY:-2}),{scale:3,x:1,y:-1});
});
test('Bocão is discoverable in essential navigation and quick shortcut',()=>{
 const ui=src('src/components/tools/mockup/ui/workspace.tsx');
 assert.match(ui,/\{ id: "base", label: "Bocão"/);
 assert.match(ui,/setTab\("base"\)/);
 assert.match(ui,/\{tab === "base" && <BaseArtPanel \/>\}/);
 assert.match(ui,/showProperties.*useState\(false\)/);
});
test('base rotation is used in the actual 3D mesh and retained by shared export capture',()=>{
 const mug=src('src/components/tools/mockup/scene/mug.tsx');
 const exp=src('src/components/tools/mockup/exporters/frame-capture.ts');
 assert.match(mug,/rotation=\{\[0, \(\(art\.baseRotation \?\? 0\) \* Math\.PI\) \/ 180, 0\]\}/);
 assert.match(exp,/renderBaseArt\(art,/);
 assert.match(mug,/renderBaseArt\(art, mug\)/);
});
test('inspection does not modify mug geometry or pose',()=>{
 const ui=src('src/components/tools/mockup/ui/base-art-panel.tsx');
 const fn=ui.split('  function inspect() {')[1].split('  const pointerAngle')[0];
 assert.ok(fn);assert.doesNotMatch(fn,/patchObject\(|tiltX|tiltZ|baseScale|baseRotation/);
 assert.match(fn,/print\.getWorldPosition/);
 assert.match(fn,/applyCameraPreset/);
});
test('editing wheel allows touch/pointer and keyboard with accessible slider',()=>{
 const ui=src('src/components/tools/mockup/ui/base-art-panel.tsx');
 assert.match(ui,/onPointerDown=\{startTurning\}/);
 assert.match(ui,/onPointerCancel=\{stopTurning\}/);
 assert.match(ui,/onKeyDown=\{e=>/);
 assert.match(ui,/aria-valuemax=\{359\}/);
 const css=src('src/components/tools/mockup/ui/workspace.css');
 assert.match(css,/\.cg-bocao-wheel\{[^}]*touch-action:none/);
});

test('inspecting never persists as an export camera preset',()=>{
 const ui=src('src/components/tools/mockup/ui/base-art-panel.tsx');
 assert.match(ui,/if \(st\.exportOpen && previous\.current\)/);
 assert.match(ui,/restoreInspection\(\)/);
});
test('rotation wheel has visible front reference and valid accessible range',()=>{
 const ui=src('src/components/tools/mockup/ui/base-art-panel.tsx');
 const css=src('src/components/tools/mockup/ui/workspace.css');
 assert.match(ui,/Frente da caneca/);
 assert.match(css,/cg-bocao-front-label/);
 assert.match(ui,/aria-valuenow=\{Math\.floor\(angle\)\}/);
 assert.match(ui,/onLostPointerCapture=/);
});
test('safe build gate does not access db push',()=>{
 const pkg=JSON.parse(src('package.json'));
 assert.doesNotMatch(pkg.scripts['build:studio-safe'],/db push|migrate/);
 assert.match(pkg.scripts['verify:studio'],/verify-studio-before-deploy/);
 const gate=src('scripts/verify-studio-before-deploy.mjs');
 assert.doesNotMatch(gate,/['"]db['"], ['"]push['"]/);
});
