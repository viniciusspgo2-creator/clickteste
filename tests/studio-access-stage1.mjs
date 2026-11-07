import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {randomUUID,createHmac,createHash} from 'node:crypto';
import {startStudioAccessHarness,mergeCookies} from './helpers/studio-access-harness.mjs';
const h=await startStudioAccessHarness();let checks=0;
const eq=(a,b)=>{assert.equal(a,b);checks++;},hash=s=>createHash('sha256').update(s).digest('hex');
const until=days=>new Date(Date.now()+days*86400000),endpoint='/api/integrations/library/entitlements';
const member=async(name,extra={})=>h.db.accessCode.create({data:{code:'QA-'+randomUUID().slice(0,12).toUpperCase(),clientName:name,clientType:'library',...extra}});
const validate=async(code,cookie,remember=true)=>h.call('/api/access/validate',{method:'POST',cookie,body:{code,remember}});
async function deliver(event,options={}){const raw=JSON.stringify(event),stamp=String(Math.floor(Date.now()/1000)),signature='v1='+createHmac('sha256',h.env.STUDIO_LIBRARY_WEBHOOK_SECRET).update(`POST\n${endpoint}\n${stamp}\n${raw}`).digest('hex');return h.call(endpoint,{method:'POST',body:raw,headers:{'x-library-timestamp':stamp,'x-library-signature':signature,...options}});}
try{
 const legacy=await member('Legacy', {browserHash:hash('a'.repeat(64)),sessionHash:hash('b'.repeat(64)),sessionExpiresAt:until(1)});
 await h.db.accessCodeUse.create({data:{codeId:legacy.id,deviceId:hash('a'.repeat(64))}});
 await h.db.siteConfig.create({data:{key:'qa-existing-seo',value:'{"title":"Preserved"}'}});
 const snapshot=async()=>({codes:await h.db.accessCode.findMany({orderBy:{id:'asc'}}),uses:await h.db.accessCodeUse.findMany({orderBy:{id:'asc'}}),config:await h.db.siteConfig.findMany({orderBy:{key:'asc'}})});
 const oldSnapshot=await snapshot();
 const before={code:await h.db.accessCode.findUnique({where:{id:legacy.id}}),config:await h.db.siteConfig.findMany()};
 eq((await h.call('/api/access/session',{cookie:h.adminCookie})).data.plan,'Admin Master');
 eq((await h.call('/api/access/session',{cookie:'cg_studio_browser='+'a'.repeat(64),token:'b'.repeat(64)})).data.ok,true);
 eq((await h.call('/api/admin/monitoring',{cookie:h.adminCookie})).data.enabled,false);
 eq((await deliver({})).status,404);
 await h.applyExtension();
 assert.deepEqual(await snapshot(),oldSnapshot);checks++;
 assert.deepEqual({code:await h.db.accessCode.findUnique({where:{id:legacy.id}}),config:await h.db.siteConfig.findMany()},before);checks++;
 h.env.STUDIO_PERSISTENT_SESSIONS='1';h.env.STUDIO_MONITORING_ENABLED='1';
 const trial=await member('Trial',{clientType:'library_trial',expiresAt:until(7)}),login=await validate(trial.code);
 eq(login.data.ok,true);eq(login.data.cookieSession,true);eq(login.data.sessionToken,undefined);
 let cookies=mergeCookies(login.cookies);
 const saved=await h.db.accessCode.findUnique({where:{id:trial.id}});eq(saved.sessionExpiresAt.getTime(),trial.expiresAt.getTime());
 assert.ok(login.response.headers.getSetCookie().some(c=>c.startsWith('cg_studio_access=p.')&&c.includes('HttpOnly')&&c.includes('SameSite=strict')));checks++;
 // A new tab/restarted browser has cookies, without sessionStorage or a bearer token.
 eq((await h.call('/api/access/session',{cookie:cookies})).data.ok,true);
 const stable=saved.sessionHash;
 const claims=await Promise.all(Array.from({length:6},()=>h.call('/api/access/session',{method:'POST',cookie:cookies})));
 assert.ok(claims.every(c=>c.data.ok));checks++;eq((await h.db.accessCode.findUnique({where:{id:trial.id}})).sessionHash,stable);
 // An old tab's stale bearer cannot override the shared, valid cookie.
 eq((await h.call('/api/access/session',{cookie:cookies,token:'f'.repeat(64)})).data.ok,true);
 eq((await validate(trial.code)).data.reason,'browser');
 await h.db.accessCode.update({where:{id:trial.id},data:{expiresAt:new Date(Date.now()-1)}});
 eq((await h.call('/api/access/session',{cookie:cookies})).data.reason,'expired');
 eq((await h.call('/api/access/session',{cookie:h.adminCookie})).data.plan,'Admin Master');
 await h.db.accessCode.update({where:{id:trial.id},data:{expiresAt:until(7)}});
 const beat=await h.call('/api/access/presence',{method:'POST',cookie:cookies,body:{page:'editor',active:true}});eq(beat.status,200);
 eq((await h.call('/api/admin/monitoring')).status,401);
 let monitor=await h.call('/api/admin/monitoring',{cookie:h.adminCookie}),row=monitor.data.rows.find(r=>r.clientName==='Trial');eq(row.state,'online');eq(row.page,'editor');
 const serialized=JSON.stringify(monitor.data);assert.ok(!serialized.includes(stable)&&!serialized.includes(trial.code)&&!serialized.includes(saved.browserHash));checks++;
 eq((await h.call('/api/admin/monitoring',{method:'PATCH',cookie:h.adminCookie,body:{presenceId:row.id,action:'block_device'}})).status,200);
 eq((await h.call('/api/access/session',{cookie:cookies})).data.ok,false);
 eq((await validate(trial.code,cookies)).data.reason,'blocked');
 await h.call('/api/admin/monitoring',{method:'PATCH',cookie:h.adminCookie,body:{presenceId:row.id,action:'unblock_device'}});
 eq((await h.call('/api/access/session',{cookie:cookies})).data.ok,false); // unblock does not resurrect a revoked session
 const relog=await validate(trial.code,cookies);eq(relog.data.ok,true);cookies=mergeCookies(cookies,relog.cookies);
 eq((await h.call('/api/access/session',{method:'DELETE',cookie:cookies})).data.ok,true);
 eq((await h.call('/api/access/session',{cookie:cookies})).data.ok,false);
 // Remembered-member renewal is bounded and keeps the same credential/browser binding.
 const renewCode=await member('Renew'),renewLogin=await validate(renewCode.code),renewCookies=mergeCookies(renewLogin.cookies);
 let renewalRow=await h.db.accessCode.findUnique({where:{id:renewCode.id}});const renewalToken=renewalRow.sessionHash;
 await h.db.accessCode.update({where:{id:renewCode.id},data:{sessionExpiresAt:until(1)}});
 eq((await h.call('/api/access/session',{method:'POST',cookie:renewCookies})).data.ok,true);
 renewalRow=await h.db.accessCode.findUnique({where:{id:renewCode.id}});assert.ok(renewalRow.sessionExpiresAt.getTime()>Date.now()+29*86400000);checks++;eq(renewalRow.sessionHash,renewalToken);
 const forgetCode=await member('Do not remember'),forget=await validate(forgetCode.code,undefined,false);
 assert.ok(forget.response.headers.getSetCookie().some(c=>c.startsWith('cg_studio_access=s.')&&!c.includes('Expires=')));checks++;
 eq(forget.data.sessionToken,undefined);
 // A shared-code block must target only the selected browser and survive reactivation.
 const shared=await member('Shared',{accessMode:'universal',maxUses:2}),a=await validate(shared.code),b=await validate(shared.code),ca=mergeCookies(a.cookies),cb=mergeCookies(b.cookies);
 await h.call('/api/access/presence',{method:'POST',cookie:ca,body:{page:'studio',active:true}});await h.call('/api/access/presence',{method:'POST',cookie:cb,body:{page:'studio',active:false}});
 monitor=await h.call('/api/admin/monitoring',{cookie:h.adminCookie});const sharedRows=monitor.data.rows.filter(r=>r.clientName==='Shared');eq(sharedRows.length,2);
 await h.call('/api/admin/monitoring',{method:'PATCH',cookie:h.adminCookie,body:{presenceId:sharedRows[0].id,action:'block_device'}});
 const sharedAccess=await Promise.all([h.call('/api/access/session',{cookie:ca}),h.call('/api/access/session',{cookie:cb})]);eq(sharedAccess.filter(r=>r.data.ok).length,1);
 await h.call('/api/admin/monitoring',{method:'PATCH',cookie:h.adminCookie,body:{presenceId:sharedRows[1].id,action:'block_code'}});
 eq((await h.call('/api/access/session',{cookie:ca})).data.ok,false);eq((await h.call('/api/access/session',{cookie:cb})).data.ok,false);
 // Authenticated server-to-server integration. No admin token grants API access.
 h.env.STUDIO_LIBRARY_INTEGRATION_ENABLED='1';
 eq((await h.call(endpoint,{method:'POST',cookie:h.adminCookie,body:{}})).status,401);
 const registeredAt=new Date(Date.now()-2*86400000).toISOString(),trialEndsAt=new Date(Date.parse(registeredAt)+7*86400000).toISOString();
 const event={eventId:randomUUID(),version:1,libraryUserId:'qa-library-user',name:'QA Library',entitlement:'TRIAL',registeredAt,trialEndsAt};
 const responses=await Promise.all(Array.from({length:8},()=>deliver(event)));assert.ok(responses.every(r=>r.status===200));checks++;eq(new Set(responses.map(r=>r.data.code)).size,1);eq(await h.db.studioIntegrationEvent.count(),1);eq(await h.db.studioLibraryLink.count(),1);
 const original=responses[0].data;eq(original.expiresAt,trialEndsAt);
 eq(original.active,true); // Registered two days ago: the Library 24h window is over, Studio still has five days.
 eq((await deliver({...event,eventId:randomUUID(),version:9,entitlement:'REVOKED'})).status,400);
 eq((await deliver({...event,eventId:randomUUID(),version:9,entitlement:'REVOKED',revocationReason:'LIBRARY_TRIAL_EXPIRED'})).status,400);
 eq((await deliver({...event,name:'Changed',trialEndsAt:new Date(Date.parse(trialEndsAt)+1000).toISOString()})).status,400);
 eq((await deliver({...event,name:'Conflicting event'})).status,409);
 const one=await validate(original.code);let cc=mergeCookies(one.cookies);const linkedBefore=await h.db.accessCode.findUnique({where:{code:original.code}});
 const upgrade={...event,eventId:randomUUID(),version:2,entitlement:'MEMBER'};const paid=await deliver(upgrade);eq(paid.data.code,original.code);eq(paid.data.expiresAt,null);
 const linkedAfter=await h.db.accessCode.findUnique({where:{code:original.code}});eq(linkedAfter.browserHash,linkedBefore.browserHash);eq(linkedAfter.sessionHash,linkedBefore.sessionHash);
 eq((await deliver(event)).data.entitlement,'MEMBER');
 eq((await h.call('/api/access/session',{cookie:cc})).data.plan,'Biblioteca Click Gruda');
 const definitive=await h.call('/api/access/session',{method:'POST',cookie:cc});eq(definitive.data.plan,'Biblioteca Click Gruda');eq(definitive.data.expiresAt,null);
 assert.ok((await h.db.accessCode.findUnique({where:{code:original.code}})).sessionExpiresAt.getTime()>Date.now()+29*86400000);checks++;
 // A manual admin block cannot be undone by an automatic grant.
 await h.call('/api/admin/codes',{method:'PATCH',cookie:h.adminCookie,body:{code:original.code,active:false}});
 const grantedAgain=await deliver({...upgrade,eventId:randomUUID(),version:3});eq(grantedAgain.data.active,false);eq(grantedAgain.data.adminBlocked,true);
 eq((await h.call('/api/access/session',{cookie:cc})).data.ok,false);
 const late={...event,eventId:randomUUID(),libraryUserId:'late-user',registeredAt:new Date(Date.now()-10*86400000).toISOString(),trialEndsAt:new Date(Date.now()-3*86400000).toISOString()};
 // Ensure exact 7-day interval independent of successive Date.now calls.
 late.trialEndsAt=new Date(Date.parse(late.registeredAt)+7*86400000).toISOString();const lateResponse=await deliver(late);eq(lateResponse.status,200);eq(lateResponse.data.active,false);
 eq((await validate(lateResponse.data.code)).data.reason,'expired');
 const future={...event,eventId:randomUUID(),libraryUserId:'future-user',registeredAt:until(2).toISOString(),trialEndsAt:until(9).toISOString()};eq((await deliver(future)).status,400);
 eq((await deliver({...event,eventId:randomUUID(),libraryUserId:'fresh'}, {'x-library-signature':'v1='+'0'.repeat(64)})).status,401);
 // Tampering, stale signatures, unsafe origins and forbidden fields never grant access.
 eq((await deliver({...event,eventId:randomUUID(),libraryUserId:'unsafe-role',role:'ADMIN'})).status,400);
 eq((await deliver({...event,eventId:randomUUID(),libraryUserId:'stale-time'},{'x-library-timestamp':'1000000000'})).status,401);
 eq((await h.call('/api/admin/monitoring',{method:'PATCH',cookie:h.adminCookie,headers:{origin:'https://attacker.example'},body:{presenceId:row.id,action:'block_code'}})).status,403);
 eq((await h.call('/api/access/session',{method:'DELETE',cookie:cc,headers:{origin:'https://attacker.example'}})).status,403);
 const v3={...event,eventId:randomUUID(),libraryUserId:'out-of-order',version:3,entitlement:'MEMBER'};
 eq((await deliver(v3)).data.entitlement,'MEMBER');
 const older=await deliver({...v3,eventId:randomUUID(),version:1,entitlement:'TRIAL'});eq(older.data.stale,true);eq(older.data.entitlement,'MEMBER');
 const revoked=await deliver({...v3,eventId:randomUUID(),version:4,entitlement:'REVOKED',revocationReason:'ADMIN_REVOKED'});eq(revoked.data.active,false);
 eq((await deliver({...v3,eventId:randomUUID(),version:2})).data.active,false);
 const secret=h.env.STUDIO_LIBRARY_WEBHOOK_SECRET;h.env.STUDIO_LIBRARY_WEBHOOK_SECRET=h.env.ADMIN_SECRET;eq((await deliver(event)).status,503);h.env.STUDIO_LIBRARY_WEBHOOK_SECRET=secret;
 eq((await h.db.siteConfig.findUnique({where:{key:'admin_pass_hash'}})).value,before.config.find(c=>c.key==='admin_pass_hash').value);eq(h.admin.verifyAdminToken(h.adminCookie.slice('cg_admin='.length)),true);
 console.log(`PASS ${checks} checks: additive schema preserves legacy/master, remembered cookies, tab concurrency, expiry, presence, per-device/shared revocation, HMAC, event concurrency, same-code upgrade, retries and admin blocks. All DB operations used the isolated PostgreSQL.`);
}finally{await h.close();}
