import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
const file=resolve(root,'src/lib/creative/image-export-integrity.ts');
const source=readFileSync(file,'utf8');
function load(){
 const compiled=ts.transpileModule(source,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,strict:true}});
 assert.deepEqual((compiled.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error),[]);
 const module={exports:{}};
 new Function('module','exports',compiled.outputText)(module,module.exports);
 return module.exports;
}
const {addPngDpiToBytes,addPngDpiMetadata}=load();
function crc32(bytes){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^(crc&1?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function chunk(type,payload=new Uint8Array()){
 const data=new Uint8Array(12+payload.length),view=new DataView(data.buffer);
 view.setUint32(0,payload.length);data.set(Buffer.from(type,'ascii'),4);data.set(payload,8);
 view.setUint32(data.length-4,crc32(data.subarray(4,data.length-4)));return data;
}
function pngFixture(){
 const header=new Uint8Array(13),view=new DataView(header.buffer);view.setUint32(0,1);view.setUint32(4,1);header[8]=8;header[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.from(chunk('IHDR',header)),Buffer.from(chunk('IDAT',Buffer.from([1,2,3]))),Buffer.from(chunk('IEND'))]);
}
test('V5.16: Blob de PNG 300 DPI usa ArrayBuffer próprio, sem passar Uint8Array<ArrayBufferLike> como BlobPart',()=>{
 assert.doesNotMatch(source,/new Blob\(\[modified\]/);
 assert.match(source,/new ArrayBuffer\(modified\.byteLength\)/);
 assert.match(source,/new Uint8Array\(owned\)\.set\(modified\)/);
 assert.match(source,/new Blob\(\[owned\]/);
});
test('V5.16: conversão preserva bytes 300 DPI exatamente sem mudar a imagem original',async()=>{
 const sourcePng=pngFixture();const expected=addPngDpiToBytes(sourcePng,300);
 const wrapped=await addPngDpiMetadata(new Blob([sourcePng],{type:'image/png'}),300);
 assert.equal(wrapped.type,'image/png');
 assert.deepEqual(Buffer.from(await wrapped.arrayBuffer()),Buffer.from(expected));
 assert.deepEqual(sourcePng,pngFixture());
});
test('V5.16: saída em ArrayBuffer é consistente com entradas em fatias de memória não exclusivas',async()=>{
 const before=pngFixture(),larger=Buffer.concat([Buffer.from('abcd'),before,Buffer.from('abcd')]);
 const view=larger.subarray(4,4+before.length);
 const wrapped=await addPngDpiMetadata(new Blob([view],{type:'image/png'}),300);
 assert.deepEqual(Buffer.from(await wrapped.arrayBuffer()),Buffer.from(addPngDpiToBytes(before,300)));
});
