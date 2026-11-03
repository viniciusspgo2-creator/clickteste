import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const require=createRequire(import.meta.url),ts=require('typescript');
function loadSession(){
 const filename=resolve(root,'src/lib/creative/document-session.ts');
 const compiled=ts.transpileModule(readFileSync(filename,'utf8'),{
  fileName:filename,reportDiagnostics:true,
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,strict:true},
 });
 assert.deepEqual(compiled.diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error)||[],[]);
 const mod={exports:{}};
 new Function('module','exports',compiled.outputText)(mod,mod.exports);
 return mod.exports.DocumentSession;
}
const DocumentSession=loadSession();
const source=readFileSync(resolve(root,'src/components/creative/creative-editor.tsx'),'utf8');
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};

test('V5.8: edits within the same document do not invalidate an in-flight image',async()=>{
 const session=new DocumentSession(),capture=session.capture(),gate=deferred();
 const artwork={nodes:[]};
 const load=gate.promise.then(src=>{if(session.isCurrent(capture))artwork.nodes.push(src)});
 artwork.nodes.push('existing text');
 gate.resolve('image A');await load;
 assert.deepEqual(artwork.nodes,['existing text','image A']);
});
test('V5.8: a reset cancels an image whose bytes decode later',async()=>{
 const session=new DocumentSession(),capture=session.capture(),gate=deferred();
 const nodes=[];
 const load=gate.promise.then(src=>{if(session.isCurrent(capture))nodes.push(src)});
 session.replace();gate.resolve('old image');await load;
 assert.deepEqual(nodes,[]);
});
test('V5.8: after opening a new project an old mask cannot be applied',async()=>{
 const session=new DocumentSession(),capture=session.capture(),gate=deferred();
 const masks=[];
 const load=gate.promise.then(src=>{if(session.isCurrent(capture))masks.push(src)});
 session.replace();gate.resolve('old mask');await load;
 assert.deepEqual(masks,[]);
});
test('V5.8: multiple generations invalidate only old imports and keep new imports',async()=>{
 const session=new DocumentSession();
 const first=session.capture();session.replace();
 const second=session.capture();session.replace();
 const third=session.capture();
 assert.equal(session.isCurrent(first),false);
 assert.equal(session.isCurrent(second),false);
 assert.equal(session.isCurrent(third),true);
 assert.equal(session.isCurrent(-1),false);
 assert.equal(session.isCurrent(Number.NaN),false);
});
test('V5.8: late font result is discarded if user switched projects',async()=>{
 const session=new DocumentSession(),capture=session.capture(),gate=deferred();
 let font='Arial';
 const load=gate.promise.then(f=>{if(session.isCurrent(capture))font=f});
 session.replace();gate.resolve('Loaded custom font');await load;
 assert.equal(font,'Arial');
});
test('V5.8: all root document replacement routes increment the session',()=>{
 const parts=[
  ['commitSmartTemplate','const applyPreset'],
  ['const applyPreset','const importLocalFonts'],
  ['const resetDocument','const refreshLocalProjects'],
  ['const restoreLocal','const applyColor'],
  ['const loadLayeredDocument','const readMask'],
  ['const readProject','const resize='],
 ];
 for(const [from,to] of parts){
  const start=source.indexOf(from),end=source.indexOf(to,start+from.length);
  assert.ok(start>=0&&end>start,`missing ${from} / ${to}`);
  assert.match(source.slice(start,end),/documentSessionRef\.current\.replace\(\)/,from);
 }
});
test('V5.8: local images, masks and MP4 imports check the original session after reading',()=>{
 const addImage=source.slice(source.indexOf(' const addImage='),source.indexOf(' const applyTemplate='));
 assert.match(addImage,/expectedSession\?:number/);
 assert.ok((addImage.match(/documentSessionRef\.current\.isCurrent\(session\)/g)||[]).length>=3);
 const readMask=source.slice(source.indexOf(' const readMask='),source.indexOf(' const upload='));
 assert.match(readMask,/const session=documentSessionRef\.current\.capture\(\)/);
 assert.match(readMask,/if\(!documentSessionRef\.current\.isCurrent\(session\)\)return/);
 assert.match(readMask,/finally\{if\(maskRef\.current\)maskRef\.current\.value='';\}/);
 const upload=source.slice(source.indexOf(' const upload='),source.indexOf(' const checkVideoCompatibility='));
 assert.match(upload,/let session=documentSessionRef\.current\.capture\(\)/);
 assert.match(upload,/if\(!documentSessionRef\.current\.isCurrent\(session\)\)break/);
 assert.match(upload,/addImage\(src,true,'content',session\)/);
 assert.match(upload,/if\(documentSessionRef\.current\.isCurrent\(session\)\)setVideoTemplate/);
});
test('V5.8: startup handoff guard also supports preset and handoff together',()=>{
 const start=source.indexOf(' // Handoff: dados binários');
 const end=source.indexOf(' // Rascunho local temporário',start);
 const segment=source.slice(start,end);
 assert.match(segment,/let initialSession=documentSessionRef\.current\.capture\(\)/);
 assert.match(segment,/initialSession=documentSessionRef\.current\.capture\(\)/);
 assert.match(segment,/if\(handoff&&mounted&&documentSessionRef\.current\.isCurrent\(initialSession\)\)/);
 assert.match(segment,/if\(mounted&&documentSessionRef\.current\.isCurrent\(initialSession\)\)/);
});
test('V5.8: stale asset-search responses cannot overwrite new query results',()=>{
 const start=source.indexOf(' const loadAssets='),end=source.indexOf(' useEffect(()=>{void loadAssets(1);}',start);
 assert.ok(start>=0&&end>start);
 const segment=source.slice(start,end);
 assert.match(segment,/const request=\+\+assetsRequestRef\.current/);
 assert.match(segment,/if\(request!==assetsRequestRef\.current\)return/);
 assert.match(segment,/if\(request===assetsRequestRef\.current\)/);
});
test('V5.8: edited TypeScript/TSX has no parser diagnostics before CI',()=>{
 for(const name of ['src/lib/creative/document-session.ts','src/components/creative/creative-editor.tsx']){
  const file=resolve(root,name),contents=readFileSync(file,'utf8');
  const node=ts.createSourceFile(file,contents,ts.ScriptTarget.Latest,true,name.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  assert.deepEqual(node.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')),[],name);
 }
});
