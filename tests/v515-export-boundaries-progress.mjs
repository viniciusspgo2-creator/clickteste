import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
function isolated(file,stubs={}){
 const abs=resolve(root,file);
 const build=ts.transpileModule(readFileSync(abs,'utf8'),{fileName:abs,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,strict:true}});
 assert.deepEqual((build.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error),[]);
 const fixtureModule={exports:{}};
 new Function('module','exports','require',build.outputText)(fixtureModule,fixtureModule.exports,id=>{
  if(Object.hasOwn(stubs,id))return stubs[id];
  throw new Error(`Import inesperado no teste: ${id}`);
 });
 return fixtureModule.exports;
}
const images=isolated('src/lib/creative/image-export-integrity.ts');
const video=isolated('src/lib/creative/video-templates.ts',{'mp4-muxer':{},'./design':{},'./mp4-integrity':{}});
function blob(bytes,type){return new Blob([bytes],{type});}
const pngHeader=Buffer.from([137,80,78,71,13,10,26,10]);
const pngTail=Buffer.from([0,0,0,0,73,69,78,68,174,66,96,130]);
const ihdr=Buffer.alloc(25);ihdr.writeUInt32BE(13,0);ihdr.write('IHDR',4,'ascii');
const png=Buffer.concat([pngHeader,ihdr,pngTail]);
function webp(chunkName='VP8 ',length=8){
 const content=Buffer.alloc(12+8+length+(length&1));
 content.write('RIFF',0,'ascii');content.writeUInt32LE(content.length-8,4);content.write('WEBP',8,'ascii');
 content.write(chunkName,12,'ascii');content.writeUInt32LE(length,16);
 return content;
}
test('V5.15: PNG com IEND completo e JPEG/WebP com finais válidos passam',async()=>{
 await images.assertExportBlobFormat(blob(png,'image/png'),'png');
 await images.assertExportBlobFormat(blob(Buffer.from([255,216,255,224,0,16,0,1,2,3,255,217]),'image/jpeg'),'jpeg');
 await images.assertExportBlobFormat(blob(webp(),'image/webp'),'webp');
 await images.assertExportBlobFormat(blob(webp('VP8L',5),'image/webp'),'webp');
 await images.assertExportBlobFormat(blob(webp('VP8X',10),'image/webp'),'webp');
});
test('V5.15: PNG com IEND ausente ou alterado não é baixado',async()=>{
 await assert.rejects(images.assertExportBlobFormat(blob(png.subarray(0,-1),'image/png'),'png'),/incompleto|finalização/);
 const changed=Buffer.from(png);changed[changed.length-1]^=1;
 await assert.rejects(images.assertExportBlobFormat(blob(changed,'image/png'),'png'),/finalização/);
});
test('V5.15: PNG com assinatura correta mas IHDR adulterado é rejeitado',async()=>{
 const changed=Buffer.from(png);changed.writeUInt32BE(99,8);
 await assert.rejects(images.assertExportBlobFormat(blob(changed,'image/png'),'png'),/IHDR/);
});
test('V5.15: JPEG sem EOI é rejeitado, mesmo com cabeçalho certo',async()=>{
 await assert.rejects(images.assertExportBlobFormat(blob(Buffer.from([255,216,255,224,0,16,0,1,2,3,4,5]),'image/jpeg'),'jpeg'),/JPEG.*incompleto/);
});
test('V5.15: WebP truncado mantém assinatura, mas falha no tamanho RIFF',async()=>{
 const file=webp();await assert.rejects(images.assertExportBlobFormat(blob(file.subarray(0,-1),'image/webp'),'webp'),/WebP.*tamanho/);
});
test('V5.15: WebP com RIFF adulterado e chunk que ultrapassa arquivo falha',async()=>{
 const altered=webp();altered.writeUInt32LE(altered.length+20,4);
 await assert.rejects(images.assertExportBlobFormat(blob(altered,'image/webp'),'webp'),/WebP.*tamanho/);
 const oversized=webp();oversized.writeUInt32LE(10000,16);
 await assert.rejects(images.assertExportBlobFormat(blob(oversized,'image/webp'),'webp'),/WebP.*tamanho/);
});
test('V5.15: WebP com payload sem imagem é rejeitado',async()=>{
 await assert.rejects(images.assertExportBlobFormat(blob(webp('XXXX'),'image/webp'),'webp'),/WebP.*estrutura|WebP.*tamanho/);
});
test('V5.15: falha de MIME continua priorizada antes da verificação estrutural',async()=>{
 await assert.rejects(images.assertExportBlobFormat(blob(png,'image/jpeg'),'jpeg'),/PNG em vez de JPEG/);
});
test('V5.15: progresso de poucos quadros não marca 100 antes da inspeção MP4',()=>{
 assert.equal(video.safeVideoProgress(1,1),99);
 assert.equal(video.safeVideoProgress(1,2),50);
 assert.equal(video.safeVideoProgress(2,2),99);
 assert.equal(video.safeVideoProgress(9,9),99);
 assert.equal(video.safeVideoProgress(0,1),0);
});
test('V5.15: progresso de exportações longas permanece limitado a 99',()=>{
 assert.equal(video.safeVideoProgress(479,480),99);
 assert.equal(video.safeVideoProgress(480,480),99);
 assert.throws(()=>video.safeVideoProgress(3,2),/inválido/);
 assert.throws(()=>video.safeVideoProgress(1,0),/inválido/);
});
test('V5.15: implementação reserva marco de 100 após o validador, não no loop',()=>{
 const source=readFileSync(resolve(root,'src/lib/creative/video-templates.ts'),'utf8');
 const loop=source.indexOf('safeVideoProgress(i+1,frames)');
 const checked=source.indexOf('inspectRenderedMp4(target.buffer as ArrayBuffer');
 const complete=source.indexOf('onProgress?.(100)',checked);
 assert.ok(loop>0&&checked>loop&&complete>checked);
});
