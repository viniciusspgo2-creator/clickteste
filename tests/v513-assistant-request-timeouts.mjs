import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
function load(path,stubs={}){
 const input=readFileSync(resolve(root,path),'utf8');
 const result=ts.transpileModule(input,{fileName:path,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,strict:true}});
 assert.equal((result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
 const module={exports:{}};
 new Function('module','exports','require',result.outputText)(module,module.exports,name=>{
  if(Object.hasOwn(stubs,name))return stubs[name];
  throw new Error(`Import não simulado: ${name}`);
 });
 return module.exports;
}
const reader=load('src/lib/creative/assistant-request.ts');
function streamingRequest(stream,{signal,headers={}}={}){
 return new Request('https://clickteste.vercel.app/api/creative-assistant',{
  method:'POST',headers:{'content-type':'application/json',...headers},body:stream,duplex:'half',signal,
 });
}
const utf8=text=>new TextEncoder().encode(text);
const stallStream=(first,record)=>new ReadableStream({
 start(controller){controller.enqueue(utf8(first));},
 cancel(){record.canceled=true;},
});
test('V5.13: corpo JSON fragmentado é aceito dentro do limite de bytes',async()=>{
 const stream=new ReadableStream({start(c){c.enqueue(utf8('{"question":"Como '));c.enqueue(utf8('exportar?"}'));c.close();}});
 assert.deepEqual(await reader.readAssistantBody(streamingRequest(stream),100,100),{question:'Como exportar?'});
});
test('V5.13: envio travado termina no prazo e libera a leitura',async()=>{
 const record={canceled:false};
 const started=Date.now();
 await assert.rejects(reader.readAssistantBody(streamingRequest(stallStream('{"question":',record)),4096,20),err=>{
  assert.equal(err.status,408);assert.match(err.message,/tempo limite/);return true;
 });
 assert.ok(Date.now()-started<1500);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(record.canceled,true);
});
test('V5.13: encerramento da conexão cancela o corpo sem esperar timeout',async()=>{
 const controller=new AbortController();
 const record={canceled:false};
 const request=streamingRequest(stallStream('{"question":',record),{signal:controller.signal});
 const promise=reader.readAssistantBody(request,4096,5_000);
 setTimeout(()=>controller.abort(),15);
 await assert.rejects(promise,err=>{assert.equal(err.status,408);return true;});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(record.canceled,true);
});
test('V5.13: request cancelada antes do começo não tenta ler o corpo',async()=>{
 const controller=new AbortController();controller.abort();
 const request=new Request('https://clickteste.vercel.app',{method:'POST',headers:{'content-type':'application/json'},body:'{}',signal:controller.signal});
 await assert.rejects(reader.readAssistantBody(request),err=>err.status===408);
});
test('V5.13: corpo chunked maior que limite é rejeitado e leitura cancelada',async()=>{
 const record={canceled:false};
 await assert.rejects(reader.readAssistantBody(streamingRequest(stallStream('x'.repeat(101),record)),100,200),err=>err.status===413);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(record.canceled,true);
});
test('V5.13: valida tamanho declarado, tipo, JSON inválido e limite inválido',async()=>{
 const make=(body,headers={})=>new Request('https://clickteste.vercel.app',{method:'POST',headers:{'content-type':'application/json',...headers},body});
 await assert.rejects(reader.readAssistantBody(make('{}',{'content-length':'200'}),100),err=>err.status===413);
 await assert.rejects(reader.readAssistantBody(make('{}',{'content-type':'text/plain'})),err=>err.status===415);
 await assert.rejects(reader.readAssistantBody(make('{broken')),err=>err.status===400);
 await assert.rejects(reader.readAssistantBody(make('{}'),0),err=>err.status===400);
});
// Integration: a stalled upload must return HTTP 408 without touching the AI provider.
const history=load('src/lib/creative/assistant-history.ts');
const provider=load('src/lib/creative/provider-response.ts');
const route=load('src/app/api/creative-assistant/route.ts',{
 'next/server':{NextResponse:{json(body,init={}){return new Response(JSON.stringify(body),{status:init.status||200,headers:{'content-type':'application/json',...init.headers}});}}},
 '@/lib/creative/assistant-request':reader,
 '@/lib/creative/assistant-history':history,
 '@/lib/creative/provider-response':provider,
});
test('V5.13: endpoint devolve HTTP 408 sem chamar IA se cliente não terminar a pergunta',async()=>{
 const oldKey=process.env.OPENAI_API_KEY,oldFetch=globalThis.fetch;
 process.env.OPENAI_API_KEY='TEST_ONLY_NOT_SECRET';
 globalThis.fetch=()=>{throw Error('Não deveria consultar o provedor');};
 const record={canceled:false};
 const controller=new AbortController();
 const request=streamingRequest(stallStream('{"question":',record),{signal:controller.signal,headers:{origin:'https://clickteste.vercel.app','x-forwarded-for':'192.0.2.229'}});
 Object.defineProperty(request,'nextUrl',{value:new URL(request.url)});
 try{
  const result=route.POST(request);
  setTimeout(()=>controller.abort(),15);
  const response=await result;
  assert.equal(response.status,408);assert.equal((await response.json()).ok,false);
 }finally{
  globalThis.fetch=oldFetch;
  if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;
 }
});
