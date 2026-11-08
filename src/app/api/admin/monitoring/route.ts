import {NextResponse} from 'next/server';
import {z} from 'zod';
import {randomUUID} from 'node:crypto';
import {db} from '@/lib/db';
import {requireAdmin} from '@/lib/admin-auth';
import {accessPlan} from '@/lib/premium-session';
import {monitoringEnabled,ONLINE_WINDOW_MS,sameOriginMutation} from '@/lib/studio-access-options';
export const runtime='nodejs';
const headers={'Cache-Control':'no-store'};
const fail=(error:string,status:number)=>NextResponse.json({ok:false,error},{status,headers});
export async function GET(req:Request){
 if(!requireAdmin(req))return fail('Não autorizado.',401);
 if(!monitoringEnabled())return NextResponse.json({ok:true,enabled:false,rows:[]},{headers});
 try{
  const now=new Date();
  const rows=await db.studioPresence.findMany({orderBy:{lastSeenAt:'desc'},take:500,include:{code:{include:{uses:{select:{deviceId:true,sessionHash:true,sessionExpiresAt:true}}}}}});
  const result=rows.map(p=>{
   const c=p.code,session=c.accessMode==='individual'?(c.browserHash===p.browserHash?c:null):c.uses.find(u=>u.deviceId===p.browserHash);
   const expired=!!c.expiresAt&&c.expiresAt<=now,blocked=!!p.blockedAt||!c.active;
   const valid=!!session?.sessionHash&&!!session.sessionExpiresAt&&session.sessionExpiresAt>now&&!expired&&!blocked&&!p.endedAt;
   const online=valid&&now.getTime()-p.lastSeenAt.getTime()<=ONLINE_WINDOW_MS;
   return {id:p.id,clientName:c.clientName||'Cliente legado',codeSuffix:c.code.slice(-4),plan:accessPlan(c.clientType),mode:c.accessMode,sharedUsers:c.uses.length,browser:p.browserLabel,page:p.page,lastSeenAt:p.lastSeenAt.toISOString(),lastActiveAt:p.lastActiveAt?.toISOString()??null,expiresAt:c.expiresAt?.toISOString()??null,sessionExpiresAt:session?.sessionExpiresAt?.toISOString()??null,state:blocked?'blocked':expired?'expired':online?'online':valid?'session':'offline',recentActivity:online&&!!p.lastActiveAt&&now.getTime()-p.lastActiveAt.getTime()<120000,deviceBlocked:!!p.blockedAt,codeBlocked:!c.active};
  });
  return NextResponse.json({ok:true,enabled:true,rows:result,updatedAt:now.toISOString(),onlineWindowSeconds:ONLINE_WINDOW_MS/1000,truncated:rows.length===500},{headers});
 }catch{return fail('Monitoramento indisponível. Os dados não foram carregados.',503);}
}
const patch=z.object({presenceId:z.string().min(1).max(128),action:z.enum(['block_device','unblock_device','end_session','block_code'])}).strict();
export async function PATCH(req:Request){
 if(!sameOriginMutation(req))return fail('Origem inválida.',403);
 if(!requireAdmin(req))return fail('Não autorizado.',401);
 if(!monitoringEnabled())return fail('Monitoramento desativado.',404);
 try{
  const text=await req.text();if(text.length>2048)return fail('Requisição muito grande.',413);
  const parsed=patch.safeParse(JSON.parse(text));if(!parsed.success)return fail('Selecione uma ação válida.',400);
  const {presenceId,action}=parsed.data;
  const status=await db.$transaction(async tx=>{
   const p=await tx.studioPresence.findUnique({where:{id:presenceId}});if(!p)return 404;
   await tx.$queryRaw`SELECT id FROM "AccessCode" WHERE id=${p.codeId} FOR UPDATE`;
   const code=await tx.accessCode.findUnique({where:{id:p.codeId}});if(!code)return 404;
   const now=new Date();
   if(action==='block_code'){
    await tx.accessCode.update({where:{id:code.id},data:{active:false,sessionHash:null,sessionExpiresAt:null}});
    await tx.accessCodeUse.updateMany({where:{codeId:code.id},data:{sessionHash:null,sessionExpiresAt:null}});
    await tx.studioPresence.updateMany({where:{codeId:code.id},data:{endedAt:now}});
    await tx.studioLibraryLink.updateMany({where:{codeId:code.id},data:{adminBlocked:true}});
   }else{
    await tx.studioPresence.update({where:{id:p.id},data:action==='unblock_device'?{blockedAt:null}:{...(action==='block_device'?{blockedAt:now}:{}),endedAt:now}});
    if(action!=='unblock_device'){
     if(code.accessMode==='individual')await tx.accessCode.updateMany({where:{id:code.id,browserHash:p.browserHash},data:{sessionHash:null,sessionExpiresAt:null}});
     else await tx.accessCodeUse.updateMany({where:{codeId:code.id,deviceId:p.browserHash},data:{sessionHash:null,sessionExpiresAt:null}});
    }
   }
   // Audit contains no token or code; timestamped key cannot overwrite another action.
   await tx.siteConfig.create({data:{key:'studio-access-audit:'+randomUUID(),value:JSON.stringify({actor:'admin-master',action,presenceId,codeId:code.id,at:now.toISOString()})}});
   return 200;
  });
  return status===404?fail('Acesso não encontrado.',404):NextResponse.json({ok:true},{headers});
 }catch{return fail('Não foi possível atualizar o acesso.',503);}
}
