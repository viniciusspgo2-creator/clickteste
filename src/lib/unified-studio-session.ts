import 'server-only'
import {randomBytes} from 'node:crypto'
import {db} from '@/lib/db'
import {hashToken,newToken} from '@/lib/premium-session'
import {sessionDeadline} from '@/lib/studio-access-options'

type Identity = {id:string;name:string;registeredAt:string;tool:'3d'|'2d'|'editor';kind:string;expiresAt:string|null;override:string;maxSessions?:number|null}
/** Cria o vínculo automaticamente, mantendo o código antigo no banco para compatibilidade. */
/** Teste do Studio/Editor/2D: 3 dias desde o cadastro (conta grátis). */
const STUDIO_TRIAL_MS = 3 * 86400000
const SHARED_MAX_USES_CAP = 500
export async function establishUnifiedStudioSession(user:Identity,browser:string){
 const now=new Date(),browserHash=hashToken(browser),sessionToken=newToken()
 const trialDeadline=new Date(Date.parse(user.registeredAt)+STUDIO_TRIAL_MS)
 const endsAt=user.expiresAt?new Date(user.expiresAt):null
 if(endsAt&&endsAt<=now)throw Error('expired')
 // Conta universal só-Studio (kind STUDIO): vários aparelhos ao mesmo tempo num
 // único login. O código vira "universal" e cada navegador ganha sua própria
 // vaga (AccessCodeUse), em vez de sobrescrever a sessão do anterior.
 const shared=user.kind==='STUDIO'
 const maxUses=shared?Math.max(1,Math.min(SHARED_MAX_USES_CAP,user.maxSessions||10)):1
 const result=await db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT 1::int FROM pg_advisory_xact_lock(hashtextextended(${`unified-studio:${user.id}`},0))`
  let link=await tx.studioLibraryLink.findUnique({where:{externalUserId:user.id},include:{code:true}})
  const accessExpiry=user.kind==='TRIAL'?trialDeadline:endsAt
  if(accessExpiry&&accessExpiry<=now)throw Error('expired')
  if(!link){
   const code=await tx.accessCode.create({data:{code:'CG-'+randomBytes(12).toString('hex').toUpperCase(),clientName:user.name.slice(0,120),clientType:user.kind==='TRIAL'?'library_trial':'library',accessMode:shared?'universal':'individual',maxUses,active:true,expiresAt:accessExpiry}})
   link=await tx.studioLibraryLink.create({data:{externalUserId:user.id,codeId:code.id,registeredAt:new Date(user.registeredAt),trialEndsAt:trialDeadline,state:user.kind==='TRIAL'?'TRIAL':'MEMBER',version:0},include:{code:true}})
  }
  if(link.adminBlocked&&user.override!=='grant')throw Error('blocked')
  const expiry=user.kind==='TRIAL'?trialDeadline:accessExpiry
  const sessionExpiresAt=sessionDeadline(now,expiry,false)
  if(shared){
   // Universal: o código não fica preso a um navegador; cada navegador ocupa
   // uma vaga. Sem vaga livre para um navegador novo, o acesso é negado.
   const current=await tx.accessCodeUse.findUnique({where:{codeId_deviceId:{codeId:link.codeId,deviceId:browserHash}}})
   if(!current){
    // Conta só as vagas ainda válidas (sessão não expirada); vaga expirada volta ao estoque.
    const used=await tx.accessCodeUse.count({where:{codeId:link.codeId,OR:[{sessionExpiresAt:null},{sessionExpiresAt:{gt:now}}]}})
    if(used>=maxUses)throw Error('full')
   }
   await tx.accessCode.update({where:{id:link.codeId},data:{clientName:user.name.slice(0,120),clientType:'library',active:true,expiresAt:expiry,accessMode:'universal',maxUses}})
   await tx.accessCodeUse.upsert({where:{codeId_deviceId:{codeId:link.codeId,deviceId:browserHash}},create:{codeId:link.codeId,deviceId:browserHash,sessionHash:hashToken(sessionToken),sessionExpiresAt},update:{usedAt:now,sessionHash:hashToken(sessionToken),sessionExpiresAt}})
  } else {
   const updated=await tx.accessCode.update({where:{id:link.codeId},data:{clientName:user.name.slice(0,120),clientType:user.kind==='TRIAL'?'library_trial':'library',active:true,expiresAt:expiry,browserHash,sessionHash:hashToken(sessionToken),sessionExpiresAt}})
   await tx.accessCodeUse.upsert({where:{codeId_deviceId:{codeId:link.codeId,deviceId:browserHash}},create:{codeId:link.codeId,deviceId:browserHash},update:{usedAt:now}})
   if(link.adminBlocked&&user.override==='grant')await tx.studioLibraryLink.update({where:{id:link.id},data:{adminBlocked:false}})
   return {plan:updated.clientType,sessionExpiresAt}
  }
  if(link.adminBlocked&&user.override==='grant')await tx.studioLibraryLink.update({where:{id:link.id},data:{adminBlocked:false}})
  return {plan:'library',sessionExpiresAt}
 })
 return {...result,sessionToken,browser}
}
