import {createHmac,timingSafeEqual,randomBytes} from 'node:crypto'
import {db} from '@/lib/db'
export const runtime='nodejs'
const path='/api/integrations/portal-admin'
const headers={'Cache-Control':'no-store'}
type Command={action:string;userId?:string;allow?:boolean;expiresAt?:string|null;mode?:string;code?:string;clientName?:string;days?:number}
export async function POST(req:Request){
 const secret=process.env.UNIFIED_SSO_SECRET
 if(!secret||secret.length<32)return Response.json({error:'Integração indisponível.'},{status:503,headers})
 const stamp=req.headers.get('x-portal-timestamp')||'',signature=req.headers.get('x-portal-signature')||''
 if(!/^\d{10}$/.test(stamp)||Math.abs(Date.now()-Number(stamp)*1000)>90000||!/^v1=[a-f0-9]{64}$/.test(signature))return Response.json({error:'Sem autorização.'},{status:401,headers})
 const raw=await req.text()
 if(Buffer.byteLength(raw,'utf8')>8192)return Response.json({error:'Solicitação grande.'},{status:413,headers})
 const expected='v1='+createHmac('sha256',secret).update(`POST\n${path}\n${stamp}\n${raw}`).digest('hex')
 const a=Buffer.from(signature),b=Buffer.from(expected)
 if(a.length!==b.length||!timingSafeEqual(a,b))return Response.json({error:'Sem autorização.'},{status:401,headers})
 let body:Command
 try{body=JSON.parse(raw)}catch{return Response.json({error:'Solicitação inválida.'},{status:400,headers})}
 if(body.action==='overview'){
  const [active,codes,linked,scenes,assets]=await Promise.all([
   db.accessCode.count({where:{active:true}}),
   db.accessCode.findMany({where:{libraryLink:null},take:100,orderBy:{createdAt:'desc'},select:{code:true,clientName:true,clientType:true,active:true,expiresAt:true,createdAt:true}}),
   db.studioLibraryLink.count(),db.mockupSceneItem.count(),db.creativeAsset.count(),
  ])
  return Response.json({ok:true,active,linked,scenes,assets,codes:codes.map(c=>({...c,expiresAt:c.expiresAt?.toISOString(),createdAt:c.createdAt.toISOString()}))},{headers})
 }
 if(body.action==='sync-user'){
  if(typeof body.userId!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(body.userId)||typeof body.allow!=='boolean')return Response.json({error:'Conta inválida.'},{status:400,headers})
  if(body.expiresAt&&(!Number.isFinite(Date.parse(body.expiresAt))||Date.parse(body.expiresAt)<=Date.now()))return Response.json({error:'Data inválida.'},{status:400,headers})
  const link=await db.studioLibraryLink.findUnique({where:{externalUserId:body.userId}})
  if(!link)return Response.json({ok:true,linked:false},{headers})
  await db.$transaction(async tx=>{
   await tx.$queryRaw`SELECT id FROM "AccessCode" WHERE id=${link.codeId} FOR UPDATE`
   await tx.accessCode.update({where:{id:link.codeId},data:{active:body.allow,expiresAt:body.allow?(body.expiresAt?new Date(body.expiresAt):null):new Date(0),...(!body.allow?{sessionHash:null,sessionExpiresAt:null}:{} )}})
   if(body.mode==='grant')await tx.studioLibraryLink.update({where:{id:link.id},data:{adminBlocked:false}})
  })
  return Response.json({ok:true,linked:true},{headers})
 }
 if(body.action==='legacy-create'){
  const name=String(body.clientName||'').trim().slice(0,100)
  const days=Number(body.days)
  if(name.length<2||!Number.isInteger(days)||days<1||days>365)return Response.json({error:'Informe nome e validade entre 1 e 365 dias.'},{status:400,headers})
  const code='CG-'+randomBytes(6).toString('hex').toUpperCase(),expiresAt=new Date(Date.now()+days*86400000)
  await db.accessCode.create({data:{code,clientName:name,clientType:'standalone',active:true,expiresAt,accessMode:'individual',maxUses:1}})
  return Response.json({ok:true,code,expiresAt:expiresAt.toISOString()},{headers})
 }
 if(body.action==='legacy-revoke'){
  if(typeof body.code!=='string'||!/^[-A-Z0-9]{4,32}$/.test(body.code))return Response.json({error:'Código inválido.'},{status:400,headers})
  const code=await db.accessCode.findUnique({where:{code:body.code},include:{libraryLink:true}})
  if(!code||code.libraryLink)return Response.json({error:'Código não encontrado ou gerenciado pela Biblioteca.'},{status:400,headers})
  await db.accessCode.update({where:{id:code.id},data:{active:false,sessionHash:null,sessionExpiresAt:null}})
  return Response.json({ok:true},{headers})
 }
 return Response.json({error:'Ação desconhecida.'},{status:400,headers})
}
