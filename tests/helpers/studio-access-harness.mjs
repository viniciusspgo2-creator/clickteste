import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const root=process.cwd(),require=createRequire(path.join(root,'package.json'));
export const toolRequire=process.env.STUDIO_TEST_TOOLS?createRequire(path.join(process.env.STUDIO_TEST_TOOLS,'package.json')):require;
export async function startStudioAccessHarness(){
 const {default:EmbeddedPostgres}=await import(pathToFileURL(toolRequire.resolve('embedded-postgres')).href);
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'studio-access-qa-')),password=randomBytes(24).toString('hex');
 const reservation=http.createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));const port=reservation.address().port;await new Promise(r=>reservation.close(r));
 const pg=new EmbeddedPostgres({databaseDir:dir+'/data',user:'studio_qa',password,port,persistent:false,postgresFlags:['-h','127.0.0.1'],onLog:()=>{},onError:()=>{}});
 await pg.initialise();await pg.start();await pg.createDatabase('studio_access_qa');
 const client=pg.getPgClient('studio_access_qa','127.0.0.1');await client.connect();
 await client.query(await fs.readFile('tests/fixtures/studio-access/baseline.sql','utf8'));
 const {PrismaClient}=require('@prisma/client'),url=`postgresql://studio_qa:${password}@127.0.0.1:${port}/studio_access_qa`;
 if(new URL(url).hostname!=='127.0.0.1'||!url.endsWith('/studio_access_qa'))throw Error('Isolated DB guard');
 const db=new PrismaClient({datasources:{db:{url}}}),ts=require('typescript'),cache=new Map();
 const env={NODE_ENV:'production',ADMIN_SECRET:randomBytes(32).toString('hex'),STUDIO_LIBRARY_WEBHOOK_SECRET:randomBytes(32).toString('hex')};
 function load(name){
  const p=path.resolve(root,name);if(cache.has(p))return cache.get(p).exports;
  const module={exports:{}};cache.set(p,module);
  const context={module,exports:module.exports,require(id){if(id==='server-only')return {};if(id==='@/lib/db')return {db};if(id.startsWith('@/'))return load('src/'+id.slice(2)+'.ts');if(id.startsWith('.'))return load(path.resolve(path.dirname(p),id+'.ts'));return require(id);},process:{env},Buffer,Request,Response,URL,TextDecoder,TextEncoder,Blob,File,Headers,console,setTimeout,clearTimeout,crypto:globalThis.crypto};
  const source=require('node:fs').readFileSync(p,'utf8'),js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  vm.runInNewContext(js,context,{filename:p});return module.exports;
 }
 const routes={
  '/api/access/validate':load('src/app/api/access/validate/route.ts'),
  '/api/access/session':load('src/app/api/access/session/route.ts'),
  '/api/access/presence':load('src/app/api/access/presence/route.ts'),
  '/api/admin/login':load('src/app/api/admin/login/route.ts'),
  '/api/admin/codes':load('src/app/api/admin/codes/route.ts'),
  '/api/admin/overview':load('src/app/api/admin/overview/route.ts'),
  '/api/admin/monitoring':load('src/app/api/admin/monitoring/route.ts'),
  '/api/integrations/library/entitlements':load('src/app/api/integrations/library/entitlements/route.ts'),
 };
 const admin=load('src/lib/admin-auth.ts'),qaPassword='QA-'+randomBytes(16).toString('hex'),hash=admin.hashPassword(qaPassword);
 await db.siteConfig.create({data:{key:'admin_pass_hash',value:hash}});
 const adminCookie='cg_admin='+admin.createAdminToken();
 async function call(route,{method='GET',body,cookie,token,headers={}}={}){
  const request=new Request('http://127.0.0.1'+route,{method,headers:{...(cookie?{cookie}:{}),...(token?{Authorization:'Bearer '+token}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers},...(body!==undefined?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});
  const response=await routes[new URL(request.url).pathname][method](request),data=await response.clone().json();
  return {status:response.status,data,response,cookies:response.headers.getSetCookie().map(c=>c.split(';')[0])};
 }
 async function applyExtension(){try{await client.query(await fs.readFile('prisma/reviewed/studio-access-additive.sql','utf8'));}catch(e){await client.query('ROLLBACK');throw e;}}
 let server;
 return {root,dir,db,client,env,load,call,admin,adminCookie,qaPassword,applyExtension,
 async serve(output){
  server=http.createServer(async(req,res)=>{try{
   const url=new URL(req.url,'http://127.0.0.1'),api=routes[url.pathname];
   if(api){const chunks=[];for await(const c of req)chunks.push(c);const body=Buffer.concat(chunks);const request=new Request('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,...(body.length?{body}: {})});const response=api[req.method]?await api[req.method](request):new Response('',{status:405});res.statusCode=response.status;for(const [k,v] of response.headers)if(k!=='set-cookie')res.setHeader(k,v);if(response.headers.getSetCookie().length)res.setHeader('Set-Cookie',response.headers.getSetCookie());res.end(Buffer.from(await response.arrayBuffer()));return;}
   if(url.pathname.startsWith('/api/')){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true,items:[],stats:{total:0,hoje:0,ultimos7:0,ultimos30:0,sessoes7:0,topPaginas:[],serie:[]}}));return;}
   if(url.pathname.startsWith('/cg-home/')){const data=await fs.readFile(root+'/public'+url.pathname);res.setHeader('Content-Type','image/webp');res.end(data);return;}
   const file=/^\/(bundle\.(js|css)|global.css)$/.test(url.pathname)?output+url.pathname:output+'/index.html';res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(await fs.readFile(file));
  }catch{res.statusCode=500;res.end('Test harness request failed');}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));return 'http://127.0.0.1:'+server.address().port;
 },async close(){if(server)await new Promise(r=>server.close(r));await db.$disconnect();await client.end();await pg.stop();}};
}
export function mergeCookies(...groups){const map=new Map();for(const group of groups){for(const c of Array.isArray(group)?group:group.split('; ')){const i=c.indexOf('=');if(i>=0)map.set(c.slice(0,i),c.slice(i+1));}}return [...map].map(([k,v])=>k+'='+v).join('; ');}
