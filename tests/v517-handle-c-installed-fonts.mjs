import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url), ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
function load(path,stubs={}) {
 const source=readFileSync(resolve(root,path),'utf8');
 const transpiled=ts.transpileModule(source,{fileName:path,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,strict:true}});
 assert.equal((transpiled.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,`${path} has syntax errors`);
 const module={exports:{}};
 new Function('module','exports','require',transpiled.outputText)(module,module.exports,id=>{
  if(Object.hasOwn(stubs,id))return stubs[id];
  throw Error(`Unexpected import: ${id}`);
 });
 return module.exports;
}
const {installedTypefaces}=load('src/lib/creative/installed-fonts.ts');
const fontRuntime=load('src/lib/creative/typefaces.ts',{'./installed-fonts':{installedTypefaces}});
const {referenceHandleSection}=load('src/components/tools/mockup/lib/reference-handle-section.ts');
const {LIVE_SUB_HANDLE_POINTS}=load('src/components/tools/mockup/lib/reference-handle-profile.ts');

test('V5.17: supplied RAR fonts are present as bundled, unique and loadable faces',()=>{
 assert.ok(installedTypefaces.length>=580,`Only ${installedTypefaces.length} faces`);
 assert.equal(new Set(installedTypefaces.map(f=>f.name)).size,installedTypefaces.length);
 let total=0;
 for(const face of installedTypefaces){
  assert.match(face.name,/^Coleção · /);
  assert.ok(face.url.startsWith('/fonts/clickgruda-collection/'));
  assert.ok(['complete','partial','none'].includes(face.category));
  assert.ok(fontRuntime.isCuratedTypeface(face.name));
  const full=resolve(root,'public'+face.url);
  assert.ok(existsSync(full),`Missing ${face.url}`);
  assert.ok(statSync(full).size>=1000,`Empty font ${face.url}`);
  const header=readFileSync(full).subarray(0,4).toString('latin1');
  assert.ok(['OTTO','wOFF','wOF2','\x00\x01\x00\x00','true'].includes(header),`Unexpected signature: ${header} at ${face.url}`);
  total+=statSync(full).size;
 }
 assert.ok(total>35_000_000&&total<90_000_000);
});

test('V5.17: lazy loading, cache, and failure/retry use the exact installed face',async()=>{
 const originalDoc=globalThis.document,originalFace=globalThis.FontFace;
 let created=0,added=0,shouldFail=false;
 const installed=installedTypefaces[0];
 try{
  globalThis.FontFace=class {
   constructor(name,url,opts){created++;assert.equal(name,installed.name);assert.ok(url.includes(installed.url));assert.equal(opts.weight,'400');}
   load(){return shouldFail?Promise.reject(Error('offline')):Promise.resolve(this);}
  };
  globalThis.document={fonts:{add(){added++;}}};
  assert.equal(created,0,'Font downloaded before selection');
  await Promise.all([fontRuntime.loadCuratedTypeface(installed.name),fontRuntime.loadCuratedTypeface(installed.name)]);
  assert.equal(created,1);assert.equal(added,1);
  const second=installedTypefaces[1];
  globalThis.FontFace=class {
   constructor(name){assert.equal(name,second.name);created++;}
   load(){return shouldFail?Promise.reject(Error('offline')):Promise.resolve(this);}
  };
  shouldFail=true;
  await assert.rejects(fontRuntime.loadCuratedTypeface(second.name,100),/Não foi possível carregar/);
  shouldFail=false;
  await fontRuntime.loadCuratedTypeface(second.name,100);
  assert.equal(added,2,'Failed font must not be added');
 } finally {
  globalThis.document=originalDoc;globalThis.FontFace=originalFace;
 }
});

test('V5.17: C handle is thicker, shaped continuously, with flush inside-wall roots',()=>{
 assert.equal(LIVE_SUB_HANDLE_POINTS.length,16);
 const first=LIVE_SUB_HANDLE_POINTS[0],last=LIVE_SUB_HANDLE_POINTS.at(-1);
 assert.ok(first[1]>7.5&&first[1]<8);
 assert.ok(last[1]>2&&last[1]<2.4);
 assert.ok(Math.abs(first[2])<4.1&&Math.abs(last[2])<4.1);
 const halfThickness=0.42*1.06*referenceHandleSection(0).thickness;
 assert.ok(Math.abs(first[2])+halfThickness<4.1);
 assert.ok(LIVE_SUB_HANDLE_POINTS.some(([_,y,z])=>y<5.5&&y>4&&z < -7.45));
 for(let i=0;i<=100;i++){
  const t=i/100, s=referenceHandleSection(t);
  assert.ok(s.width>0.78&&s.width<1.1);
  assert.ok(s.thickness>0.78&&s.thickness<1.1);
  assert.ok(Math.abs(s.width-referenceHandleSection(1-t).width)<1e-10);
 }
 const geom=readFileSync(resolve(root,'src/components/tools/mockup/scene/mug-geometry.ts'),'utf8');
 assert.match(geom,/style === 'livesub' \? 0\.42/);
 assert.match(geom,/style === 'livesub' \? referenceHandleSection\(t\)/);
 assert.match(readFileSync(resolve(root,'src/components/tools/mockup/state/store.ts'),'utf8'),/handleStyle: "livesub"/);
});

test('V5.17: font picker, editor select, design export and docs are wired to installed collection',()=>{
 const picker=readFileSync(resolve(root,'src/components/creative/font-library.tsx'),'utf8');
 const editor=readFileSync(resolve(root,'src/components/creative/creative-editor.tsx'),'utf8');
 const design=readFileSync(resolve(root,'src/lib/creative/design.ts'),'utf8');
 assert.match(picker,/FONTES DA SUA COLEÇÃO/);
 assert.match(picker,/bundled\.slice\(0,installedLimit\)/);
 assert.match(picker,/loadCuratedTypeface\(font.name\)/);
 assert.match(editor,/installedTypefaces\.map\(t=>t.name\)/);
 assert.match(design,/ensureDesignFonts/);
 assert.ok(existsSync(resolve(root,'docs/FONTES-COLECAO-INSTALADA.csv')));
});
