import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
function load(path,stubs={}){
 const filename=resolve(root,path),source=readFileSync(filename,'utf8');
 const result=ts.transpileModule(source,{fileName:filename,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,strict:true}});
 assert.deepEqual((result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error),[]);
 const fixtureModule={exports:{}};new Function('require','module','exports',result.outputText)(key=>{
  if(Object.hasOwn(stubs,key))return stubs[key];throw Error(`Unexpected dependency ${key}`);
 },fixtureModule,fixtureModule.exports);
 return fixtureModule.exports;
}
const video=()=>load('src/lib/creative/video-templates.ts',{'mp4-muxer':{},'./mp4-integrity':{inspectRenderedMp4:()=>({})},'./design':{}});
const smart=()=>load('src/lib/creative/smart-templates.ts',{jszip:{},'./design':{uid:()=> 'mock-id'}});
const doc={width:1920,height:1080,nodes:[{id:'t1',keyframes:[{t:0}],visible:true},{id:'t2',keyframes:[{t:0}],visible:false}],video:{src:'data:video/mp4;base64,xxx',start:0,end:7}};
test('Preflight MP4: conserva resolução 720p, informa fps e conta apenas animações visíveis',()=>{
 const result=video().inspectVideoExport(doc);
 assert.deepEqual(result,{width:1280,height:720,fps:24,maxDuration:20,hasAudio:false,animatedNodes:1});
});
test('Preflight rejeita vídeo ausente, linha do tempo invertida e canvas gigante',()=>{
 const inspect=video().inspectVideoExport;
 for(const invalid of [{...doc,video:undefined},{...doc,video:{src:'v',start:9,end:2}},{...doc,width:10000}])assert.throws(()=>inspect(invalid));
});
test('Preflight mantém resolução de retrato dentro de 1280×720',()=>{
 const {width,height}=video().inspectVideoExport({...doc,width:1080,height:1350});
 assert.ok(width>0&&height>0&&height<=720&&width<=1280);
});
test('Smart templates aceitam assinaturas de PNG, JPEG e WebP',()=>{
 const validate=smart().validateTemplateImageSignature;
 const png=Uint8Array.from([137,80,78,71,13,10,26,10,0]);
 const jpg=Uint8Array.from([255,216,255,224,0]);
 const webp=Uint8Array.from([...Buffer.from('RIFF'),0,0,0,0,...Buffer.from('WEBP')]);
 assert.doesNotThrow(()=>validate(png,'bg.png'));
 assert.doesNotThrow(()=>validate(jpg,'photo.jpeg'));
 assert.doesNotThrow(()=>validate(webp,'foreground.webp'));
});
test('Smart templates bloqueiam SVG/HTML disfarçados de imagem',()=>{
 const validate=smart().validateTemplateImageSignature;
 assert.throws(()=>validate(Buffer.from('<svg onload="evil()"/>'),'mask.png'),/não corresponde/);
 assert.throws(()=>validate(Buffer.from('<script>alert(1)</script>'),'scene.webp'),/não corresponde/);
 assert.throws(()=>validate(Uint8Array.from([137,80,78,71]),'pic.svg'),/não permitido/);
});
test('Ajuste de template coloca máscara em coordenadas do cenário, sem mudar máscara autoral anterior',()=>{
 const fit=smart().fitMockupIntoSlot;
 const mug={id:'m',w:100,h:200,x:0,y:0,maskSrc:'manual.png',maskMode:'alpha',maskSpace:'element'};
 const slot={x:20,y:40,w:120,h:300};
 const withTemplate=fit(mug,slot,'scene-mask.png',1,'luminance',false);
 assert.equal(withTemplate.maskSpace,'canvas');
 assert.equal(withTemplate.maskSrc,'scene-mask.png');
 const without=fit(mug,slot);
 assert.equal(without.maskSpace,'element');
 assert.equal(without.maskSrc,'manual.png');
});
test('Cache distingue posição de máscara ancorada no cenário',()=>{
 const effect=load('src/lib/creative/effect-cache.ts').effectKey;
 const base={src:'a',maskSrc:'m',maskSpace:'canvas',w:100,h:100,sx:0,sy:0,sw:100,sh:100,maskX:.1,maskY:.2,maskW:.3,maskH:.4};
 assert.notEqual(effect(base),effect({...base,maskX:.2}));
 assert.notEqual(effect(base),effect({...base,maskSpace:'element'}));
});
