import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {accessCredential,browserToken,hashToken,newToken,resolvePremiumSession,type StudioIdentity} from '@/lib/premium-session';
import {persistentSessionsEnabled,monitoringEnabled,sameOriginMutation,sessionDeadline} from '@/lib/studio-access-options';
import {clearStudioCookie,writeStudioCookie} from '@/lib/studio-session-cookie';
export const runtime='nodejs';
const headers={'Cache-Control':'no-store'};
function codeConditions(i:StudioIdentity,now:Date){return {id:i.codeId,browserHash:i.browserHash,accessMode:'individual',sessionHash:i.sessionHash,sessionExpiresAt:{gt:now},active:true,OR:[{expiresAt:null},{expiresAt:{gt:now}}]};}
function slotConditions(i:StudioIdentity,now:Date){return {codeId:i.codeId,deviceId:i.browserHash,sessionHash:i.sessionHash,sessionExpiresAt:{gt:now},code:{accessMode:'universal',active:true,OR:[{expiresAt:null},{expiresAt:{gt:now}}]}};}
async function session(req:Request,claim:boolean){
 try{
  const {access,identity}=await resolvePremiumSession(req);
  const capabilities={rememberBrowser:persistentSessionsEnabled(),monitoring:monitoringEnabled()};
  if(!access.ok||!identity)return NextResponse.json({...access,capabilities},{headers});
  const now=new Date(),credential=accessCredential(req)!;
  if(persistentSessionsEnabled()){
   let until=identity.sessionExpiresAt;
   if(claim&&identity.remember&&until.getTime()-now.getTime()<15*86400000){
    until=sessionDeadline(now,identity.expiresAt,true);
    const data={sessionExpiresAt:until};
    const updated=identity.accessMode==='individual'
     ?await db.accessCode.updateMany({where:codeConditions(identity,now),data})
     :await db.accessCodeUse.updateMany({where:slotConditions(identity,now),data});
    if(!updated.count)return NextResponse.json({ok:false,reason:'session',capabilities},{headers});
   }
   const response=NextResponse.json({...access,cookieSession:true,capabilities},{headers});
   if(claim)writeStudioCookie(response,req,credential.token,identity.remember,until);
   return response;
  }
  // Preserve legacy bearer rotation when the new session feature is disabled.
  if(!claim)return NextResponse.json({...access,capabilities},{headers});
  const sessionToken=newToken(),data={sessionHash:hashToken(sessionToken)};
  const updated=identity.accessMode==='individual'
   ?await db.accessCode.updateMany({where:codeConditions(identity,now),data})
   :await db.accessCodeUse.updateMany({where:slotConditions(identity,now),data});
  const response=NextResponse.json(updated.count?{...access,sessionToken,capabilities}:{ok:false,reason:'session',capabilities},{headers});
  if(updated.count)writeStudioCookie(response,req,sessionToken,false,identity.sessionExpiresAt);
  return response;
 }catch{return NextResponse.json({ok:false,reason:'network'},{status:503,headers});}
}
export async function GET(req:Request){return session(req,false);}
export async function POST(req:Request){if(!sameOriginMutation(req))return NextResponse.json({ok:false,reason:'invalid'},{status:403,headers});return session(req,true);}
export async function DELETE(req:Request){
 if(!sameOriginMutation(req))return NextResponse.json({ok:false,reason:'invalid'},{status:403,headers});
 try{
  const browser=browserToken(req),credential=accessCredential(req);
  if(browser&&credential){
   const browserHash=hashToken(browser),sessionHash=hashToken(credential.token);
   await db.$transaction([
    db.accessCode.updateMany({where:{browserHash,sessionHash},data:{sessionHash:null,sessionExpiresAt:null}}),
    db.accessCodeUse.updateMany({where:{deviceId:browserHash,sessionHash},data:{sessionHash:null,sessionExpiresAt:null}}),
   ]);
   // Presence is optional; logging out must still work if its table is unavailable.
   if(monitoringEnabled())await db.studioPresence.updateMany({where:{browserHash},data:{endedAt:new Date()}}).catch(()=>{});
  }
  const response=NextResponse.json({ok:true},{headers});clearStudioCookie(response,req);return response;
 }catch{return NextResponse.json({ok:false,reason:'network'},{status:503,headers});}
}
