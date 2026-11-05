import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {deflateSync} from 'node:zlib';
const require=createRequire(import.meta.url),ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
function importIsolated(relative){
 const abs=resolve(root,relative);
 const result=ts.transpileModule(readFileSync(abs,'utf8'),{fileName:abs,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,strict:true}});
 assert.deepEqual((result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error),[]);
 const fixtureModule={exports:{}};
 new Function('module','exports',result.outputText)(fixtureModule,fixtureModule.exports);
 return fixtureModule.exports;
}
const {detectImageSignature,assertExportBlobFormat,addPngDpiToBytes,addPngDpiMetadata}=importIsolated('src/lib/creative/image-export-integrity.ts');
function crc32(bytes){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^(crc&1?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function chunk(type,payload=Buffer.alloc(0)){
 const typeB=Buffer.from(type,'ascii'),buf=Buffer.alloc(payload.length+12);
 buf.writeUInt32BE(payload.length,0);typeB.copy(buf,4);payload.copy(buf,8);
 buf.writeUInt32BE(crc32(buf.subarray(4,8+payload.length)),buf.length-4);return buf;
}
function fixturePng(withPhysical=false){
 const header=Buffer.alloc(13);header.writeUInt32BE(1,0);header.writeUInt32BE(1,4);header[8]=8;header[9]=6;
 const pieces=[Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('sRGB',Buffer.from([0]))];
 if(withPhysical){const ph=Buffer.alloc(9);ph.writeUInt32BE(2835,0);ph.writeUInt32BE(2835,4);ph[8]=1;pieces.push(chunk('pHYs',ph));}
 pieces.push(chunk('tEXt',Buffer.from('key\0test')),
  chunk('IDAT',deflateSync(Buffer.from([0,255,90,0,255]))),chunk('IEND'));
 return Buffer.concat(pieces);
}
function parsePng(bytes){
 assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 const chunks=[];for(let i=8;i<bytes.length;){
  const n=Buffer.from(bytes.subarray(i,i+4)).readUInt32BE(0);const name=Buffer.from(bytes.subarray(i+4,i+8)).toString('ascii');
  assert.ok(n<=bytes.length-i-12);const payload=bytes.subarray(i+8,i+8+n);
  const crc=Buffer.from(bytes.subarray(i+8+n,i+12+n)).readUInt32BE(0);
  assert.equal(crc,crc32(bytes.subarray(i+4,i+8+n)),`CRC inválido para ${name}`);
  chunks.push({name,payload});i+=n+12;
 }return chunks;
}
test('V5.14: assinatura de arquivo identifica PNG/JPEG/WebP independentemente do MIME declarado',()=>{
 assert.equal(detectImageSignature(fixturePng()),'png');
 assert.equal(detectImageSignature(Buffer.from([255,216,255,224,0,16,0,0,0,0,0,0])),'jpeg');
 assert.equal(detectImageSignature(Buffer.from('RIFFxxxxWEBP','ascii')),'webp');
 assert.equal(detectImageSignature(Buffer.from('invalid image','ascii')),null);
});
test('V5.14: exportação WebP rejeita fallback PNG mesmo quando Blob.type anuncia WebP',async()=>{
 const blob=new Blob([fixturePng()],{type:'image/webp'});
 await assert.rejects(assertExportBlobFormat(blob,'webp'),/PNG em vez de WebP/);
 await assertExportBlobFormat(blob,'png');
});
test('V5.14: exportação JPEG rejeita fallback PNG e arquivo desconhecido',async()=>{
 await assert.rejects(assertExportBlobFormat(new Blob([fixturePng()],{type:'image/jpeg'}),'jpeg'),/PNG em vez de JPEG/);
 await assert.rejects(assertExportBlobFormat(new Blob([Buffer.from('not a valid image blob')]),'png'),/não reconhecido/);
 await assert.rejects(assertExportBlobFormat(new Blob([Buffer.from('bad')]),'png'),/vazia ou incompleta/);
});
test('V5.14: insere 300 DPI corretamente sem mudar pixels e demais chunks',()=>{
 const before=fixturePng();const after=addPngDpiToBytes(before,300);
 const a=parsePng(before),b=parsePng(after);
 assert.deepEqual(b.map(c=>c.name),['IHDR','pHYs','sRGB','tEXt','IDAT','IEND']);
 const dpi=b[1].payload;
 assert.equal(Buffer.from(dpi).readUInt32BE(0),11811);
 assert.equal(Buffer.from(dpi).readUInt32BE(4),11811);
 assert.equal(dpi[8],1);
 assert.deepEqual(Buffer.from(b.find(c=>c.name==='IDAT').payload),Buffer.from(a.find(c=>c.name==='IDAT').payload));
});
test('V5.14: remove pHYs antigo que aparece depois de sRGB e deixa só 300 DPI',()=>{
 const after=addPngDpiToBytes(fixturePng(true),300);const chunks=parsePng(after);
 assert.equal(chunks.filter(c=>c.name==='pHYs').length,1);
 assert.equal(Buffer.from(chunks.find(c=>c.name==='pHYs').payload).readUInt32BE(0),11811);
 assert.ok(chunks.some(c=>c.name==='sRGB'));
 assert.ok(chunks.some(c=>c.name==='tEXt'));
});
test('V5.14: regravar DPI não multiplica chunks e mantém conteúdo idêntico',()=>{
 const once=addPngDpiToBytes(fixturePng(true),300);
 const twice=addPngDpiToBytes(once,300);
 assert.deepEqual(Buffer.from(once),Buffer.from(twice));
});
test('V5.14: PNG truncado e DPI inválido geram erro sem arquivo parcialmente alterado',()=>{
 assert.throws(()=>addPngDpiToBytes(fixturePng().subarray(0,32),300),/truncado|tamanho de chunk/);
 assert.throws(()=>addPngDpiToBytes(Buffer.from('not png'),300),/não é um PNG/);
 assert.throws(()=>addPngDpiToBytes(fixturePng(),Infinity),/DPI inválido/);
});
test('V5.14: rotina Blob preserva o tipo PNG e o chunk 300 DPI',async()=>{
 const result=await addPngDpiMetadata(new Blob([fixturePng()],{type:'image/png'}),300);
 assert.equal(result.type,'image/png');
 assert.equal(parsePng(new Uint8Array(await result.arrayBuffer())).filter(c=>c.name==='pHYs').length,1);
});
test('V5.14: exportDesign integrado não baixa WebP com bytes PNG de fallback',async()=>{
 const abs=resolve(root,'src/lib/creative/design.ts');
 const compilation=ts.transpileModule(readFileSync(abs,'utf8'),{fileName:abs,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
 const fixtureModule={exports:{}};
 const stubs={
  './typefaces':{ensureDesignFonts:async()=>{},waitForFontLayout:async()=>{}},
  './animation':{animateDesignNode:n=>n},
  './effect-cache':{PixelBoundedCache:class{clear(){}},effectKey:()=>'',clearAssetTokens:()=>{}},
  './export-transform':{drawOutputWithMirror:()=>{}},
  './async-image-load':{loadImageWithTimeout:async()=>{}},
  './image-export-integrity':importIsolated('src/lib/creative/image-export-integrity.ts'),
 };
 new Function('module','exports','require',compilation.outputText)(fixtureModule,fixtureModule.exports,id=>{
  if(['./layer-effects','./vector-shapes','./vector-path'].includes(id))return importIsolated(`src/lib/creative/${id.slice(2)}.ts`);
  if(Object.hasOwn(stubs,id))return stubs[id];throw Error('unexpected dependency '+id);
 });
 const before=globalThis.document;
 const ctx={clearRect(){},fillRect(){},drawImage(){}};
 const browserCanvas={width:0,height:0,getContext:()=>ctx,toBlob(callback){callback(new Blob([fixturePng()],{type:'image/png'}));}};
 globalThis.document={createElement:()=>({...browserCanvas})};
 try{
  const doc={width:2480,height:1122,background:'#ffffff',nodes:[]};
  await assert.rejects(fixtureModule.exports.exportDesign(doc,'webp',1),/PNG em vez de WebP/);
  const png=await fixtureModule.exports.exportDesign(doc,'png',1);
  assert.equal(parsePng(new Uint8Array(await png.arrayBuffer())).filter(c=>c.name==='pHYs').length,1);
 }finally{if(before===undefined)delete globalThis.document;else globalThis.document=before;}
});
test('V5.14: Editor valida formato ANTES de adicionar DPI ou disponibilizar arquivo',()=>{
 const source=readFileSync(resolve(root,'src/lib/creative/design.ts'),'utf8');
 const i=source.indexOf('await assertExportBlobFormat(blob,');
 const j=source.indexOf('await addPngDpiMetadata(blob,300)');
 assert.ok(i>0&&j>i);
 assert.ok(!source.includes('async function withPngDpi('));
});
