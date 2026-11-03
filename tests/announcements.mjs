import fs from 'node:fs';import path from 'node:path';import Module,{createRequire} from 'node:module';import test from 'node:test';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),ts=require('typescript'),root=path.resolve(import.meta.dirname,'..');
let admin=true,access={ok:true,plan:'Biblioteca Click Gruda'},rows=[],writes=0;
const db={siteConfig:{findMany:async()=>rows,create:async({data})=>{writes++;rows.push({...data,updatedAt:new Date('2026-11-02T12:00:00Z')});},updateMany:async({where,data})=>{const row=rows.find(r=>r.key===where.key&&r.updatedAt.getTime()===where.updatedAt.getTime());if(!row)return{count:0};writes++;row.value=data.value;row.updatedAt=new Date();return{count:1};}}};
const resolve=Module._resolveFilename,load=Module._load;
Module._resolveFilename=function(request,parent,...rest){return resolve.call(this,request.startsWith('@/')?path.join(root,'src',request.slice(2)):request,parent,...rest);};
Module._load=function(request,...rest){if(request==='@/lib/db')return{db};if(request==='@/lib/admin-auth')return{requireAdmin:()=>admin};if(request==='@/lib/premium-session')return{checkPremiumSession:async()=>access};return load.call(this,request,...rest);};
Module._extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
const {announcementInput,safeNoticeUrl,isNoticeVisible,dismissedNotice}=require('../src/lib/announcements/input.ts');
const api=require('../src/app/api/admin/announcements/route.ts'),publicApi=require('../src/app/api/announcements/route.ts');
const request=(body,origin='http://127.0.0.1')=>new Request('http://127.0.0.1/api/admin/announcements',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)});
const data=()=>announcementInput.parse({title:'Teste',message:'Mensagem simples'});
test('dangerous URLs, excessive content and invalid schedules are rejected',()=>{
 for(const url of ['javascript:alert(1)','data:text/html,abc','//evil.test','/\\evil.test','https://user:pass@evil.test','https://x.test/\n'])assert.equal(safeNoticeUrl(url),false,url);
 for(const url of ['/ajuda','https://example.com/help',''])assert.equal(safeNoticeUrl(url),true,url);
 assert.equal(announcementInput.safeParse({title:'x',message:'x',buttonText:'Abrir',buttonUrl:'javascript:1'}).success,false);
 assert.equal(announcementInput.safeParse({title:'x',message:'x'.repeat(3001)}).success,false);
 assert.equal(announcementInput.safeParse({...data(),startsAt:'2026-11-03T00:00:00Z',endsAt:'2026-11-02T00:00:00Z'}).success,false);
});
test('audience, scheduling and expiry are enforced by the visibility policy',()=>{
 const n={...data(),id:'x',revision:'x',status:'active',audience:'library',startsAt:'2026-11-01T00:00:00Z',endsAt:'2026-11-03T00:00:00Z'},now=Date.parse('2026-11-02');
 assert.equal(isNoticeVisible(n,'library',now),true);assert.equal(isNoticeVisible(n,'standalone',now),false);assert.equal(isNoticeVisible(n,'library',now+86400000),false);assert.equal(isNoticeVisible({...n,status:'draft'},'library',now),false);
});
test('dismissal respects once, daily Sao Paulo date and repeat-each-visit policies',()=>{
 const n={...data(),id:'x',revision:'x'};assert.equal(dismissedNotice(n,'closed'),true);assert.equal(dismissedNotice({...n,repeat:'always'},'closed'),false);
 assert.equal(dismissedNotice({...n,repeat:'daily'},'2026-11-01',new Date('2026-11-02T01:00:00Z')),true);
});
test('unauthorized and cross-origin writers cannot create announcements',async()=>{
 admin=false;assert.equal((await api.POST(request(data()))).status,401);admin=true;assert.equal((await api.POST(request(data(),'https://evil.test'))).status,403);assert.equal(writes,0);
});
test('CRUD stores validated values and rejects stale concurrent editing',async()=>{
 rows=[];const created=await api.POST(request(data()));assert.equal(created.status,200);const {id}=await created.json();assert.ok(id);assert.equal(rows.length,1);
 const list=await(await api.GET(new Request('http://127.0.0.1'))).json();const item=list.items[0];
 assert.equal((await api.POST(request({...item,title:'Nova versão',revision:'2020-01-01T00:00:00Z'}))).status,409);
 assert.equal((await api.POST(request({...item,title:'Nova versão'}))).status,200);assert.equal(JSON.parse(rows[0].value).title,'Nova versão');
});
test('public API refuses anonymous access and never sends drafts or another audience',async()=>{
 access={ok:false};assert.equal((await publicApi.GET(new Request('http://127.0.0.1'))).status,401);
 access={ok:true,plan:'Biblioteca Click Gruda'};const base=data();rows=[{key:'studio-announcement:a',value:JSON.stringify({...base,status:'active',audience:'standalone'}),updatedAt:new Date()},{key:'studio-announcement:b',value:JSON.stringify({...base,status:'draft'}),updatedAt:new Date()}];
 const result=await(await publicApi.GET(new Request('http://127.0.0.1'))).json();assert.deepEqual(result.items,[]);
});
