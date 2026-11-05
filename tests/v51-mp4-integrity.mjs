import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
function transpiled(file,stubs={}){
 const absolute=resolve(root,file);
 const output=ts.transpileModule(readFileSync(absolute,'utf8'),{fileName:absolute,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,strict:true}});
 assert.deepEqual((output.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error),[]);
 const fixtureModule={exports:{}};
 new Function('module','exports','require',output.outputText)(fixtureModule,fixtureModule.exports,id=>{if(Object.hasOwn(stubs,id))return stubs[id];throw Error(`Unmapped dependency ${id}`)});
 return fixtureModule.exports;
}
const inspector=transpiled('src/lib/creative/mp4-integrity.ts').inspectRenderedMp4;
const bytes=readFileSync(resolve(root,'tests/fixtures/smoke-h264.mp4'));
const source=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
const valid={width:320,height:180,frames:24};
test('V5.1: inspeciona MP4 H.264 real, sem depender do servidor ou ffmpeg em produção',()=>{
 assert.deepEqual(inspector(source,valid),{...valid,codec:'avc1',bytes:bytes.length});
});
test('V5.1: também valida MP4 Full HD 1080p/30fps de referência',()=>{
 const sample=readFileSync(resolve(root,'tests/fixtures/smoke-1080p-h264.mp4'));
 const data=sample.buffer.slice(sample.byteOffset,sample.byteOffset+sample.byteLength);
 assert.deepEqual(inspector(data,{width:1920,height:1080,frames:30}),{width:1920,height:1080,frames:30,codec:'avc1',bytes:sample.length});
});
test('V5.1: rejeita MP4 truncado, bytes inválidos, resolução e contagem incorreta de quadros',()=>{
 assert.throws(()=>inspector(source.slice(0,200),valid),/truncada|incompleta/);
 assert.throws(()=>inspector(new ArrayBuffer(0),valid),/vazio|incompleto/);
 assert.throws(()=>inspector(source,{...valid,width:360}),/resolução inesperada/);
 assert.throws(()=>inspector(source,{...valid,frames:25}),/quadros incompletos/);
});
test('V5.1: uma caixa MP4 que aponta para fora do arquivo nunca é aceita',()=>{
 const copy=source.slice(0);new DataView(copy).setUint32(0,0xffffffff);
 assert.throws(()=>inspector(copy,valid),/truncada|inválido/);
});
test('V5.1: compositor valida arquivo final antes de oferecer download e pré-testa imagens/máscaras',()=>{
 const source=readFileSync(resolve(root,'src/lib/creative/video-templates.ts'),'utf8');
 assert.match(source,/inspectRenderedMp4\(target\.buffer as ArrayBuffer,\{width:w,height:h,frames\}\)/);
 assert.match(source,/await assertDesignAssetsReady\(doc\);[\s\S]*?const video=document\.createElement\('video'\)/);
});
test('V5.1: o preflight interrompe antes de decodificar o vídeo quando encontra imagem quebrada',async()=>{
 const originals={VideoEncoder:globalThis.VideoEncoder,VideoFrame:globalThis.VideoFrame,document:globalThis.document};
 let videoCreated=false;
 globalThis.VideoEncoder={isConfigSupported:async config=>({supported:true,config})};globalThis.VideoFrame=class{};
 globalThis.document={createElement(){videoCreated=true;throw Error('video should not be created')}};
 try{
  const engine=transpiled('src/lib/creative/video-templates.ts',{
   'mp4-muxer':{},'./mp4-integrity':{inspectRenderedMp4:()=>({})},
   './design':{assertDesignAssetsReady:async()=>{throw Error('Camada inválida na exportação')}}
  });
  await assert.rejects(engine.probeVideoExport({width:1080,height:1350,nodes:[{kind:'image'}],video:{src:'data:video/mp4;base64,AAAA',start:0}}),/Camada inválida/);
  assert.equal(videoCreated,false);
 }finally{for(const [k,v] of Object.entries(originals))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
});
