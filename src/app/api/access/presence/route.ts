import {NextResponse} from 'next/server';
import {readJsonBody,RequestBodyError} from '@/lib/security/request-body';
import {z} from 'zod';
import {db} from '@/lib/db';
import {resolvePremiumSession} from '@/lib/premium-session';
import {monitoringEnabled,sameOriginMutation} from '@/lib/studio-access-options';
export const runtime='nodejs';
const input=z.object({page:z.enum(['studio','editor','cenarios','templates']),active:z.boolean()}).strict();
const headers={'Cache-Control':'no-store'};
function label(ua:string){const browser=/Edg\//.test(ua)?'Edge':/Firefox\//.test(ua)?'Firefox':/Chrome\//.test(ua)?'Chrome':/Safari\//.test(ua)?'Safari':'Navegador';const os=/Android/.test(ua)?'Android':/iPhone|iPad/.test(ua)?'iOS':/Windows/.test(ua)?'Windows':/Macintosh/.test(ua)?'macOS':/Linux/.test(ua)?'Linux':'';return [browser,os].filter(Boolean).join(' · ');}
export async function POST(req:Request){
 if(!monitoringEnabled())return NextResponse.json({ok:false,reason:'disabled'},{status:404,headers});
 if(!sameOriginMutation(req))return NextResponse.json({ok:false},{status:403,headers});
 if(Number(req.headers.get('content-length')||0)>2048)return NextResponse.json({ok:false},{status:413,headers});
 try{
  const {access,identity}=await resolvePremiumSession(req);
  if(!access.ok)return NextResponse.json({ok:false},{status:401,headers});
  if(!identity)return NextResponse.json({ok:true},{headers}); // Never track the admin as a customer.
  const parsed=input.safeParse(await readJsonBody(req,2048));if(!parsed.success)return NextResponse.json({ok:false},{status:400,headers});
  const now=new Date();
  const ok=await db.$transaction(async tx=>{
   await tx.$queryRaw`SELECT id FROM "AccessCode" WHERE id=${identity.codeId} FOR UPDATE`;
   const code=await tx.accessCode.findUnique({where:{id:identity.codeId}});
   if(!code?.active||(code.expiresAt&&code.expiresAt<=now))return false;
   const use=identity.accessMode==='universal'?await tx.accessCodeUse.findUnique({where:{codeId_deviceId:{codeId:code.id,deviceId:identity.browserHash}}}):null;
   const session=identity.accessMode==='individual'?code:use;
   if(!session||session.sessionHash!==identity.sessionHash||!session.sessionExpiresAt||session.sessionExpiresAt<=now)return false;
   const where={codeId_browserHash:{codeId:code.id,browserHash:identity.browserHash}};
   const existing=await tx.studioPresence.findUnique({where});
   if(existing?.blockedAt)return false;
   if(existing&&now.getTime()-existing.lastSeenAt.getTime()<15000)return true;
   const data={lastSeenAt:now,...(parsed.data.active?{lastActiveAt:now}:{}),page:parsed.data.page,browserLabel:label(req.headers.get('user-agent')||''),endedAt:null};
   await tx.studioPresence.upsert({where,create:{codeId:code.id,browserHash:identity.browserHash,...data},update:data});return true;
  });
  return NextResponse.json({ok},{status:ok?200:401,headers});
 }catch(error){return NextResponse.json({ok:false},{status:error instanceof RequestBodyError?error.status:503,headers});}
}
