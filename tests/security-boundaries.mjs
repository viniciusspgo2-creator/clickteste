import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {zipSync,strToU8} from 'fflate';
const require=createRequire(import.meta.url),ts=require('typescript');
function load(path){const module={exports:{}};new Function('module','exports','require',ts.transpileModule(readFileSync(new URL('../'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(module,module.exports,require);return module.exports;}
const {unpackTemplateArchive}=load('src/lib/creative/template-archive.ts');
const {readBodyBytes,readJsonBody}=load('src/lib/security/request-body.ts');
test('Existing intelligent template passes directory, byte-budget and CRC checks',()=>{
 const bytes=readFileSync(new URL('../public/templates/template-inteligente-demonstracao.cgtemplate',import.meta.url));
 const files=unpackTemplateArchive(bytes),manifest=JSON.parse(new TextDecoder().decode(files.get('manifest.json')));
 assert.equal(manifest.format,'clickgruda-smart-template');for(const key of ['background','foreground','mask','shadow'])if(manifest[key])assert.ok(files.has(manifest[key]));
});
test('Traversal, undeclared content, oversized expansion and falsified ZIP sizes fail before import',()=>{
 assert.throws(()=>unpackTemplateArchive(zipSync({'manifest.json':strToU8('{}'),'../payload.png':strToU8('x')})),/limites/);
 const bomb=zipSync({'manifest.json':strToU8('{}'),'payload.png':new Uint8Array(13*1024*1024)});
 assert.throws(()=>unpackTemplateArchive(bomb),/limites/);
 const view=new DataView(bomb.buffer,bomb.byteOffset,bomb.byteLength);for(let i=0;i<bomb.length-46;i++)if(view.getUint32(i,true)===0x02014b50){const n=view.getUint16(i+28,true);if(new TextDecoder().decode(bomb.subarray(i+46,i+46+n))==='payload.png')view.setUint32(i+24,1,true);}
 assert.throws(()=>unpackTemplateArchive(bomb),/limites/);
});
test('Actual bytes beat spoofed Content-Length; stalled and aborted streams are cancelled',async()=>{
 const req=new Request('https://studio.example/api',{method:'POST',headers:{'Content-Type':'application/json','Content-Length':'1'},body:JSON.stringify({value:'x'.repeat(100)})});
 await assert.rejects(()=>readJsonBody(req,32),e=>e.status===413);
 let cancelled=false;const body=new ReadableStream({cancel(){cancelled=true;}});const pending=new Request('https://studio.example/api',{method:'POST',body,duplex:'half'});
 await assert.rejects(()=>readBodyBytes(pending,32,25),e=>e.status===408);assert.equal(cancelled,true);
 const abort=new AbortController();abort.abort();const stopped=new Request('https://studio.example/api',{method:'POST',body:'{}',signal:abort.signal});await assert.rejects(()=>readBodyBytes(stopped,32),e=>e.status===408);
});
