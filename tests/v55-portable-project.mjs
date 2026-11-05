import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
function load(file,stubs={}){
 const abs=resolve(root,file);
 const result=ts.transpileModule(readFileSync(abs,'utf8'),{
  fileName:abs,reportDiagnostics:true,
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,strict:true},
 });
 assert.deepEqual((result.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error),[]);
 const mod={exports:{}};
 new Function('module','exports','require',result.outputText)(mod,mod.exports,dep=>{
  if(['./layer-effects','./vector-shapes'].includes(dep))return load(`src/lib/creative/${dep.slice(2)}.ts`);
  if(Object.hasOwn(stubs,dep))return stubs[dep];
  throw Error(`Unexpected module dependency: ${dep}`);
 });
 return mod.exports;
}
const validation=load('src/lib/creative/validate-project.ts');
const portable=load('src/lib/creative/portable-project.ts',{'./validate-project':validation});
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';
const mp4='data:video/mp4;base64,AAAAHGZ0eXBpc29t';
const image=(id,src,maskSrc)=>({id,kind:'image',role:'mockup',src,maskSrc,
 x:0,y:0,w:200,h:150,angle:0,opacity:1});
const base=()=>({width:800,height:400,background:'#ffffff',nodes:[]});

test('V5.5: portable backup embeds local image, mask, and video; original stays untouched',async()=>{
 const doc={...base(),nodes:[image('mug','blob:local-mug','blob:local-mask')],
  video:{src:'blob:local-video',name:'clip.mp4',start:0,fit:'cover'},
  smartTemplate:{slot:{x:0,y:0,w:200,h:150},maskSrc:'blob:local-mask'}};
 const queried=[];
 const embedded=await portable.makePortableDocument(doc,async(url,kind)=>{
  queried.push([url,kind]);return kind==='video'?mp4:png;
 });
 assert.equal(queried.length,3,'same mask must be imported only once');
 assert.equal(embedded.nodes[0].src,png);
 assert.equal(embedded.nodes[0].maskSrc,png);
 assert.equal(embedded.smartTemplate.maskSrc,png);
 assert.equal(embedded.video.src,mp4);
 assert.equal(doc.nodes[0].src,'blob:local-mug');
 assert.equal(doc.video.src,'blob:local-video');
 assert.equal(portable.hasTemporaryMedia(doc),true);
 assert.equal(portable.hasTemporaryMedia(embedded),false);
 const blob=await portable.createPortableProjectBlob(doc,async(_,kind)=>kind==='video'?mp4:png);
 const parsed=JSON.parse(await blob.text());
 assert.equal(parsed.format,'cgdesign');
 assert.equal(parsed.version,1);
 assert.equal(parsed.document.video.src,mp4);
 assert.equal(parsed.document.nodes[0].src,png);
 assert.equal(blob.type,'application/json');
});
test('V5.5: remote media is embedded for portability, while already-embedded data stays untouched',async()=>{
 const doc={...base(),nodes:[image('a','https://example.org/asset.png'),image('b',png)]};
 const calls=[];
 const result=await portable.makePortableDocument(doc,async(url,kind)=>{calls.push(url);assert.equal(kind,'image');return png});
 assert.deepEqual(calls,['https://example.org/asset.png']);
 assert.ok(result.nodes.every(n=>n.src===png));
});
test('V5.5: broken or incompatible media aborts backup instead of creating broken .cgdesign',async()=>{
 const doc={...base(),nodes:[image('a','blob:unavailable')]};
 await assert.rejects(()=>portable.createPortableProjectBlob(doc,async()=>{throw Error('not found')}),/not found/);
 await assert.rejects(()=>portable.makePortableDocument(doc,async()=>mp4),/incorporada/);
});
test('V5.5: no network when document consists exclusively of inline data',async()=>{
 const doc={...base(),nodes:[image('a',png,png)],video:{src:mp4,name:'video',start:0}};
 const result=await portable.makePortableDocument(doc,async()=>{throw Error('unexpected network')});
 assert.deepEqual(result, {...doc, nodes:doc.nodes.map(n=>({...n})),video:{...doc.video},smartTemplate:undefined});
 assert.equal(portable.hasTemporaryMedia(doc),false);
});
test('V5.5: editor downloads portable backup and does not silently auto-save volatile video pointers',()=>{
 const editor=readFileSync(resolve(root,'src/components/creative/creative-editor.tsx'),'utf8');
 assert.match(editor,/await createPortableProjectBlob\(doc\)/);
 assert.match(editor,/saveCreativeProject\(snapshot,/);
 assert.match(editor,/hasTemporaryMedia\(doc\)\?await makePortableDocument\(doc\)/);
 assert.match(editor,/!draftReady\|\|hasTemporaryMedia\(doc\)/);
 assert.match(editor,/Este \.cgdesign contém referências temporárias/);
 assert.doesNotMatch(editor,/new Blob\(\[JSON\.stringify\(\{format:'cgdesign'/);
});
test('V5.5: encoded SVG is decoded before security checks on imported projects',()=>{
 const safeSvg='<svg xmlns="http://www.w3.org/2000/svg"><rect width="5" height="5" fill="orange"/></svg>';
 const unsafeSvg='<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
 const make=svg=>({...base(),nodes:[image('vector',`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`)]});
 assert.doesNotThrow(()=>validation.validateProjectDocument(make(safeSvg)));
 assert.throws(()=>validation.validateProjectDocument(make(unsafeSvg)),/insegura/);
 assert.throws(()=>validation.validateProjectDocument(make('<svg><image href="https://evil.example/track.png"/></svg>')),/insegura/);
});
