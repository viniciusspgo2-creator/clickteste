import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
const absolute=resolve(root,'src/lib/creative/mp4-integrity.ts');
const output=ts.transpileModule(readFileSync(absolute,'utf8'),{fileName:absolute,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,strict:true}});
assert.deepEqual((output.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error),[]);
const mod={exports:{}};
new Function('module','exports',output.outputText)(mod,mod.exports);
const inspect=mod.exports.inspectRenderedMp4;
const fixture=readFileSync(resolve(root,'tests/fixtures/smoke-h264.mp4'));
const source=fixture.buffer.slice(fixture.byteOffset,fixture.byteOffset+fixture.byteLength);
const expected={width:320,height:180,frames:24};
function corrupt(boxName,position,mutate){
 const altered=source.slice(0),bytes=new Uint8Array(altered);
 const offset=bytes.findIndex((_,i)=>i+4<=bytes.length&&bytes[i]===boxName.charCodeAt(0)&&bytes[i+1]===boxName.charCodeAt(1)&&bytes[i+2]===boxName.charCodeAt(2)&&bytes[i+3]===boxName.charCodeAt(3));
 assert.ok(offset>4,`fixture sem ${boxName}`);
 const view=new DataView(altered);
 mutate(view,offset+position);
 return altered;
}
test('V5.9: os 24 quadros H.264 reais têm offsets e tamanhos válidos dentro de mdat',()=>{
 assert.deepEqual(inspect(source,expected),{...expected,codec:'avc1',bytes:fixture.length});
});
test('V5.9: também aceita MP4 legítimo com moov no final, não apenas faststart',()=>{
 const bytes=readFileSync(resolve(root,'tests/fixtures/smoke-moov-last-h264.mp4'));
 const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
 assert.ok(bytes.indexOf(Buffer.from('moov'))>bytes.indexOf(Buffer.from('mdat')));
 assert.deepEqual(inspect(buffer,expected),{...expected,codec:'avc1',bytes:bytes.length});
});
test('V5.9: rejeita tamanho adulterado de quadro, mesmo com frameCount correto',()=>{
 const altered=corrupt('stsz',16,(v,p)=>v.setUint32(p,0xffffffff));
 assert.throws(()=>inspect(altered,expected),/área de dados mdat|incompleto/);
});
test('V5.9: rejeita chunk apontando para o cabeçalho em vez de mdat',()=>{
 const altered=corrupt('stco',12,(v,p)=>v.setUint32(p,32));
 assert.throws(()=>inspect(altered,expected),/fora da área de dados mdat/);
});
test('V5.9: rejeita chunks que cobrem menos quadros que o declarado',()=>{
 const altered=corrupt('stsc',16,(v,p)=>v.setUint32(p,1));
 assert.throws(()=>inspect(altered,expected),/sem offsets para todos os quadros/);
});
test('V5.9: rejeita mapa de chunks incompatível com a tabela de offsets',()=>{
 const altered=corrupt('stsc',12,(v,p)=>v.setUint32(p,2));
 assert.throws(()=>inspect(altered,expected),/primeiro chunk inválido|mapa de chunks inválido/);
});
test('V5.9: exportador executa uma inspeção final, não duas',()=>{
 const source=readFileSync(resolve(root,'src/lib/creative/video-templates.ts'),'utf8');
 assert.equal(source.match(/inspectRenderedMp4\(target\.buffer as ArrayBuffer,\{width:w,height:h,frames\}\)/g)?.length,1);
});

test('V5.9: interface só recebe progresso 100% depois da validação dos bytes do MP4',()=>{
 const src=readFileSync(resolve(root,'src/lib/creative/video-templates.ts'),'utf8');
 const finalized=src.indexOf('muxer.finalize()');
 const validated=src.indexOf('inspectRenderedMp4(target.buffer as ArrayBuffer');
 const success=src.indexOf('onProgress?.(100)',validated);
 assert.ok(finalized>0&&validated>finalized&&success>validated);
});
