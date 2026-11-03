import fs from 'node:fs';
import path from 'node:path';
import Module,{createRequire} from 'node:module';
import assert from 'node:assert/strict';
import test from 'node:test';
const require=createRequire(import.meta.url),ts=require('typescript'),root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const resolve=Module._resolveFilename,load=Module._load;
let authorized=true,records=[],failWrite=false,calls=0,countQueries=[];
const db={accessCode:{async create({data}){calls++;if(failWrite)throw new Error('write failed');records.push(data)},async createMany({data}){calls++;if(failWrite)throw new Error('write failed');records.push(...data);return{count:data.length}},count(args){calls++;countQueries.push(args);return Promise.resolve([9,6,3,1,2,5,7,4,2][countQueries.length-1]??0)}},async $transaction(ops){return Promise.all(ops)}};
Module._resolveFilename=function(request,parent,...rest){return resolve.call(this,request.startsWith('@/')?path.join(root,'src',request.slice(2)):request,parent,...rest)};
Module._load=function(request,...rest){if(request==='@/lib/db')return{db};if(request==='@/lib/admin-auth')return{requireAdmin:()=>authorized};return load.call(this,request,...rest)};
Module._extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
const {parseCodeCreation}=require('../src/lib/admin-code-input.ts');
const {codesCsv,codeStatus}=require('../src/components/admin/code-utils.ts');
const codes=require('../src/app/api/admin/codes/route.ts'),overview=require('../src/app/api/admin/overview/route.ts');
const request=body=>new Request('http://127.0.0.1/api/admin/codes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});

test('single and named-batch input preserve individual clients and valid expiry rules',()=>{
 const now=new Date('2026-10-28T12:00:00Z');
 assert.deepEqual(parseCodeCreation({clientName:' Maria ',clientType:'library'},now).names,['Maria']);
 assert.equal(parseCodeCreation({clientName:'Maria',clientType:'library'},now).expiresAt,null);
 assert.equal(parseCodeCreation({clientName:'Maria',clientType:'standalone'},now).expiresAt.getTime()-now.getTime(),86400000);
 assert.deepEqual(parseCodeCreation({clientNames:['Maria',' João '],clientType:'library'},now).names,['Maria','João']);
 assert.equal(parseCodeCreation({clientName:'Turma',clientType:'library',count:100,prefix:' minha-! '},now).names.at(-1),'Turma · 100');
 assert.equal(parseCodeCreation({clientName:'Turma',clientType:'library',prefix:' minha-! '},now).prefix,'MINHA');
});

test('invalid batches and dates are rejected before writing any codes',async()=>{
 authorized=true;records=[];calls=0;
 for(const body of [{count:0},{count:101},{count:1.5},{count:'20'},{clientNames:[]},{clientNames:['ok','']},{clientNames:Array(101).fill('Maria')},{expiresAt:'invalid'},{expiresAt:'2020-01-01'},{clientType:'admin'}]) {
  const response=await codes.POST(request({clientName:'Turma',clientType:'library',...body}));assert.equal(response.status,400);
 }
 assert.equal(calls,0);assert.equal(records.length,0);
});

test('batch creation is protected, atomic and produces independent random codes with compatible responses',async()=>{
 records=[];calls=0;authorized=false;
 assert.equal((await codes.POST(request({clientName:'Turma',clientType:'library',count:20}))).status,401);assert.equal(calls,0);
 authorized=true;
 let response=await codes.POST(request({clientName:'Maria',clientType:'library'}));let data=await response.json();assert.equal(data.created.length,1);assert.equal(data.entries[0].clientName,'Maria');
 response=await codes.POST(request({clientNames:Array.from({length:100},(_,i)=>'Cliente '+i),clientType:'library',prefix:'ART'}));data=await response.json();
 assert.equal(data.created.length,100);assert.equal(new Set(data.created).size,100);assert.ok(data.created.every(code=>/^ART-[A-F0-9]{12}$/.test(code)));assert.equal(records.length,101);assert.ok(records.every(row=>row.maxUses===1));
 failWrite=true;response=await codes.POST(request({clientName:'Outro lote',clientType:'library',count:10}));assert.equal(response.status,400);assert.equal(records.length,101,'failed atomic insert adds no subset');failWrite=false;
});

test('overview keeps authentication and returns only aggregate figures with no client or session secrets',async()=>{
 calls=0;countQueries=[];authorized=false;assert.equal((await overview.GET(new Request('http://127.0.0.1/api/admin/overview'))).status,401);assert.equal(calls,0);
 authorized=true;const response=await overview.GET(new Request('http://127.0.0.1/api/admin/overview')),data=await response.json();assert.equal(data.overview.total,9);assert.equal(data.overview.pending,3);assert.equal(data.overview.sessions,2);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(countQueries.length,9);
 assert.equal(countQueries[2].where.browserHash,null);assert.equal(countQueries[4].where.active,false);assert.ok(countQueries[8].where.sessionExpiresAt.gt instanceof Date);
 assert.ok(!JSON.stringify(data).includes('browserHash'));assert.ok(!JSON.stringify(data).includes('sessionHash'));
});

test('status boundaries and CSV quoting prevent spreadsheet formula injection and preserve client names',()=>{
 const row={code:'CG-123',clientName:'Maria',clientType:'library',active:true,bound:false,expiresAt:null,note:'',lastUsedAt:null};
 assert.equal(codeStatus(row),'pending');assert.equal(codeStatus({...row,bound:true}),'active');assert.equal(codeStatus({...row,expiresAt:'2020-01-01'}),'expired');assert.equal(codeStatus({...row,active:false,bound:true}),'revoked');
 const csv=codesCsv([{...row,clientName:'=HYPERLINK("evil")'},{...row,clientName:'João; "Artes"\nAteliê'}]);
 assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes('"\'=HYPERLINK(""evil"")"'));assert.ok(csv.includes('"João; ""Artes""\nAteliê"'));assert.ok(!csv.includes('undefined'));
});
