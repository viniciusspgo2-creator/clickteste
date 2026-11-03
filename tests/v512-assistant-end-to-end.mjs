import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
const root=resolve(import.meta.dirname,'..');
function load(path,stubs={}){
 const input=readFileSync(resolve(root,path),'utf8');
 const output=ts.transpileModule(input,{fileName:path,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,strict:true}});
 assert.deepEqual((output.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error),[]);
 const module={exports:{}};
 new Function('module','exports','require',output.outputText)(module,module.exports,id=>{
  if(Object.hasOwn(stubs,id))return stubs[id];
  throw new Error(`Import não simulado: ${id}`);
 });
 return module.exports;
}
const provider=load('src/lib/creative/provider-response.ts');
const json=(obj,headers={})=>new Response(JSON.stringify(obj),{headers:{'content-type':'application/json',...headers}});

test('V5.12: resposta de IA completa, mesmo repartida em vários chunks, é lida corretamente',async()=>{
 const payload={choices:[{message:{content:JSON.stringify({reply:'Posso ajudar.',action:'export'})}}]};
 const encoded=new TextEncoder().encode(JSON.stringify(payload));
 const stream=new ReadableStream({start(c){c.enqueue(encoded.subarray(0,17));c.enqueue(encoded.subarray(17));c.close();}});
 const result=await provider.readAssistantProviderResponse(new Response(stream),new AbortController().signal);
 assert.deepEqual(result,payload);
});
test('V5.12: cabeçalho que declara resposta maior que o limite é rejeitado',async()=>{
 await assert.rejects(provider.readAssistantProviderResponse(json({}, {'content-length':'999999'}),new AbortController().signal,100),/limite/);
});
test('V5.12: limite vale também para respostas chunked sem content-length',async()=>{
 const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(80));c.enqueue(new Uint8Array(80));c.close();}});
 await assert.rejects(provider.readAssistantProviderResponse(new Response(stream),new AbortController().signal,100),/limite/);
});
test('V5.12: corpo da IA que responde parcialmente e para é cancelável sem ficar preso',async()=>{
 let canceled=false;
 const stream=new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('{"choices":'));},cancel(){canceled=true;}});
 const controller=new AbortController();const started=Date.now();
 const promise=provider.readAssistantProviderResponse(new Response(stream),controller.signal);
 setTimeout(()=>controller.abort(),15);
 await assert.rejects(promise,/tempo limite/);
 assert.ok(Date.now()-started<2000);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(canceled,true);
});
test('V5.12: JSON inválido e UTF-8 malformado são rejeitados',async()=>{
 await assert.rejects(provider.readAssistantProviderResponse(new Response('{broken'),new AbortController().signal),/JSON inválido/);
 const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array([0xc3,0x28]));c.close();}});
 await assert.rejects(provider.readAssistantProviderResponse(new Response(stream),new AbortController().signal),/JSON inválido/);
});
test('V5.12: valida limites, ausência de corpo e cancelamento prévio',async()=>{
 await assert.rejects(provider.readAssistantProviderResponse(json({}),new AbortController().signal,0),/Limite/);
 await assert.rejects(provider.readAssistantProviderResponse(new Response(null),new AbortController().signal),/não retornou/);
 const controller=new AbortController();controller.abort();
 await assert.rejects(provider.readAssistantProviderResponse(json({}),controller.signal),/interrompida/);
});

const reqReader=load('src/lib/creative/assistant-request.ts');
const history=load('src/lib/creative/assistant-history.ts');
const route=load('src/app/api/creative-assistant/route.ts',{
 'next/server':{NextResponse:{json(body,init={}){return new Response(JSON.stringify(body),{status:init.status||200,headers:{'Content-Type':'application/json',...init.headers}});}}},
 '@/lib/creative/assistant-request':reqReader,
 '@/lib/creative/assistant-history':history,
 '@/lib/creative/provider-response':provider,
});
const makeRequest=(body,ip='192.0.2.222')=>{
 const url='https://clickteste.vercel.app/api/creative-assistant';
 const req=new Request(url,{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://clickteste.vercel.app','x-forwarded-for':ip},body:JSON.stringify(body)});
 Object.defineProperty(req,'nextUrl',{value:new URL(url)});
 return req;
};

test('V5.12: endpoint aceita somente ações existentes na área e não recebe mídia do usuário',async()=>{
 const originalFetch=globalThis.fetch,originalKey=process.env.OPENAI_API_KEY;
 process.env.OPENAI_API_KEY='TEST_ONLY_NOT_A_SECRET';
 let sent;
 globalThis.fetch=async(_url,options)=>{
  sent=JSON.parse(options.body);
  assert.equal(options.signal.aborted,false);
  return json({choices:[{message:{content:JSON.stringify({reply:'Abra a área de produto.',action:'models',label:'Abrir produto'})}}]});
 };
 try{
  const response=await route.POST(makeRequest({question:'Onde encontro modelos?',area:'editor',locale:'pt',history:['anterior','outra'],ignoredProject:{image:'sensitive'}}));
  assert.equal(response.status,200);
  const data=await response.json();assert.equal(data.ok,true);assert.equal(data.action,null);
  assert.equal(sent.messages[1].role,'user');
  const context=JSON.parse(sent.messages[1].content);
  assert.deepEqual(Object.keys(context).sort(),['area','locale','previousQuestions','question']);
  assert.deepEqual(context.previousQuestions,['anterior','outra']);
  assert.equal(JSON.stringify(sent).includes('sensitive'),false);
 }finally{globalThis.fetch=originalFetch;if(originalKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=originalKey;}
});
test('V5.12: o endpoint recusa resposta upstream excessiva com fallback seguro',async()=>{
 const originalFetch=globalThis.fetch,originalKey=process.env.OPENAI_API_KEY;
 process.env.OPENAI_API_KEY='TEST_ONLY_NOT_A_SECRET';
 globalThis.fetch=async()=>new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(17000));c.close();}}),{status:200});
 try{
  const response=await route.POST(makeRequest({question:'Como exportar?',area:'editor'},'192.0.2.223'));
  assert.equal(response.status,503);assert.equal((await response.json()).reason,'unavailable');
 }finally{globalThis.fetch=originalFetch;if(originalKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=originalKey;}
});
test('V5.12: cliente cancela chamadas travadas sem deixar resposta antiga ou spinner preso',()=>{
 const code=readFileSync(resolve(root,'src/components/creative/studio-concierge.tsx'),'utf8');
 assert.match(code,/setTimeout\(\(\)=>controller\.abort\(\),20_000\)/);
 assert.match(code,/setTimeout\(\(\)=>controller\.abort\(\),6_000\)/);
 assert.match(code,/const latest=\(\)=>requestRef\.current\.version===version/);
 assert.match(code,/finally\{clearTimeout\(deadline\);if\(latest\(\)\)\{requestRef\.current\.controller=null;setIsAnswering\(false\);\}\}/);
 assert.match(code,/if\(controller\.signal\.aborted\)throw new Error/);
});
