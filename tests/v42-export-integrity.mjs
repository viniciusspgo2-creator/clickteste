import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url),ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
function transpiled(name,stubs={}) {
  const file=resolve(root,name),source=readFileSync(file,'utf8');
  const compiled=ts.transpileModule(source,{fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,strict:true}});
  const mod={exports:{}};
  new Function('module','exports','require',compiled.outputText)(mod,mod.exports,name=>{
    if(['./layer-effects','./vector-shapes','./vector-path'].includes(name))return transpiled(`src/lib/creative/${name.slice(2)}.ts`);
    if(Object.prototype.hasOwnProperty.call(stubs,name))return stubs[name];
    throw new Error('Unexpected test dependency: '+name);
  });
  return mod.exports;
}
const cache=()=>transpiled('src/lib/creative/effect-cache.ts');
test('LRU never exceeds pixel budget, evicts oldest, and refreshes on read',()=>{
 const {PixelBoundedCache}=cache();const c=new PixelBoundedCache(100,3);
 c.put('a','A',40);c.put('b','B',40);assert.equal(c.pixelCount,80);
 assert.equal(c.get('a'),'A');c.put('c','C',30);
 assert.equal(c.get('b'),undefined);assert.equal(c.pixelCount,70);
 c.put('d','D',200);assert.equal(c.get('d'),undefined);assert.equal(c.pixelCount,70);
 c.put('a','A2',20);assert.equal(c.pixelCount,50);assert.equal(c.get('a'),'A2');
 c.clear();assert.equal(c.pixelCount,0);assert.equal(c.size,0);
});
test('Cache key reacts to source, mask, tint, geometry and crop; never contains base64',()=>{
 const {effectKey}=cache();const base={src:'data:image/png;base64,'+'A'.repeat(1e4),maskSrc:'data:image/png;base64,BBBB',tint:'#ff1234',w:100,h:100,sx:0,sy:0,sw:200,sh:100};
 const key=effectKey(base);assert.ok(key.length<100);assert.notEqual(effectKey({...base,tint:'#00abcd'}),key);
 assert.notEqual(effectKey({...base,maskSrc:'data:image/png;base64,CCCC'}),key);
 assert.notEqual(effectKey({...base,sw:190}),key);assert.notEqual(effectKey({...base,w:110}),key);
 assert.notEqual(effectKey({...base,src:'different'}),key);
});
test('PNG/JPEG/WebP export refuses incomplete visible images and masks',async()=>{
 const effect=cache();
 class FakeImage {
  naturalWidth=32;naturalHeight=32;
  set src(s){queueMicrotask(()=>{if(s.includes('broken'))this.onerror?.();else this.onload?.();});}
  removeAttribute(){}
 }
 const oldImage=globalThis.Image;globalThis.Image=FakeImage;
 try{
  const design=transpiled('src/lib/creative/design.ts',{'./typefaces':{ensureDesignFonts:async()=>{}},'./animation':{animateDesignNode:n=>n},'./effect-cache':effect,'./export-transform':transpiled('src/lib/creative/export-transform.ts'),'./async-image-load':transpiled('src/lib/creative/async-image-load.ts'),'./image-export-integrity':{assertExportBlobFormat:async()=>{},addPngDpiMetadata:async blob=>blob}});
  const node=(src,maskSrc,visible=true)=>({id:'x',kind:'image',role:'mockup',layerName:'Caneca 325ml',src,maskSrc,visible,x:0,y:0,w:32,h:32,angle:0,opacity:1});
  await design.assertDesignAssetsReady({nodes:[node('good','also-good')]});
  await assert.rejects(design.assertDesignAssetsReady({nodes:[node('broken-image')]}),/imagem.*Caneca 325ml/);
  await assert.rejects(design.assertDesignAssetsReady({nodes:[node('good','broken-mask')]}),/máscara.*Caneca 325ml/);
  await design.assertDesignAssetsReady({nodes:[node('broken-hidden',undefined,false)]});
 }finally{globalThis.Image=oldImage;}
});
test('Strict mode applies to static and animated video layers, while preview remains tolerant',()=>{
 const design=readFileSync(resolve(root,'src/lib/creative/design.ts'),'utf8');
 const video=readFileSync(resolve(root,'src/lib/creative/video-templates.ts'),'utf8');
 assert.match(design,/await assertDesignAssetsReady\(doc\);await waitForFontLayout\(\)/);
 assert.match(design,/if\(options\?\.strict\)throw new Error/);
 assert.match(video,/await assertDesignAssetsReady\(doc\)/);
 assert.match(video,/i\/fps,\{strict:true\}/);
});

test('MP4 H.264: tentativa de perfil alternativo quando o primeiro não é suportado',async()=>{
 const saved=globalThis.VideoEncoder;
 const attempted=[];
 globalThis.VideoEncoder={isConfigSupported:async config=>{
  attempted.push(config.codec);
  assert.deepEqual(config.avc,{format:'avc'});
  if(config.codec==='avc1.42001f')return {supported:false,config:undefined};
  return {supported:true,config};
 }};
 try{
  const video=transpiled('src/lib/creative/video-templates.ts',{'mp4-muxer':{},'./mp4-integrity':{inspectRenderedMp4:()=>({})},'./design':{}});
  const result=await video.chooseH264Config(1280,720,24);
  assert.equal(result.codec,'avc1.4d001f');
  assert.deepEqual(attempted,['avc1.42001f','avc1.4d001f']);
  assert.deepEqual(result.avc,{format:'avc'});
  assert.ok(result.bitrate>=1_800_000&&result.bitrate<=4_000_000);
 }finally{globalThis.VideoEncoder=saved;}
});
test('Acabamento foto realista oferece refletância controlada sem alterar o padrão de sublimação',()=>{
 const {CERAMIC_FINISHES,DEFAULT_CERAMIC_FINISH}=transpiled('src/components/tools/mockup/lib/ceramic-finishes.ts');
 const ids=CERAMIC_FINISHES.map(f=>f.id);
 assert.equal(new Set(ids).size,ids.length);
 const photo=CERAMIC_FINISHES.find(f=>f.id==='photo');
 assert.ok(photo&&photo.values.roughness>=0.1&&photo.values.glazeStrength<1);
 assert.equal(DEFAULT_CERAMIC_FINISH,CERAMIC_FINISHES.find(f=>f.id==='sublimation').values);
});
