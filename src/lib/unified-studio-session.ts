import 'server-only'
import {randomBytes} from 'node:crypto'
import {db} from '@/lib/db'
import {hashToken,newToken} from '@/lib/premium-session'
import {sessionDeadline} from '@/lib/studio-access-options'

type Identity = {id:string;name:string;registeredAt:string;tool:'3d'|'2d'|'editor';kind:string;expiresAt:string|null;override:string}
/** Cria o vínculo automaticamente, mantendo o código antigo no banco para compatibilidade. */
/** Teste do Studio/Editor/2D: 3 dias desde o cadastro (conta grátis). */
const STUDIO_TRIAL_MS = 3 * 86400000
export async function establishUnifiedStudioSession(user:Identity,browser:string){
 const now=new Date(),browserHash=hashToken(browser),sessionToken=newToken()
 const trialDeadline=new Date(Date.parse(user.registeredAt)+STUDIO_TRIAL_MS)
 const endsAt=user.expiresAt?new Date(user.expiresAt):null
 if(endsAt&&endsAt<=now)throw Error('expired')
 const result=await db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT 1::int FROM pg_advisory_xact_lock(hashtextextended(${`unified-studio:${user.id}`},0))`
  let link=await tx.studioLibraryLink.findUnique({where:{externalUserId:user.id},include:{code:true}})
  const accessExpiry=user.kind==='TRIAL'?trialDeadline:endsAt
  if(accessExpiry&&accessExpiry<=now)throw Error('expired')
  if(!link){
   const code=await tx.accessCode.create({data:{code:'CG-'+randomBytes(12).toString('hex').toUpperCase(),clientName:user.name.slice(0,120),clientType:user.kind==='TRIAL'?'library_trial':'library',accessMode:'individual',maxUses:1,active:true,expiresAt:accessExpiry}})
   link=await tx.studioLibraryLink.create({data:{externalUserId:user.id,codeId:code.id,registeredAt:new Date(user.registeredAt),trialEndsAt:trialDeadline,state:user.kind==='TRIAL'?'TRIAL':'MEMBER',version:0},include:{code:true}})
  }
  if(link.adminBlocked&&user.override!=='grant')throw Error('blocked')
  const expiry=user.kind==='TRIAL'?trialDeadline:accessExpiry
  const sessionExpiresAt=sessionDeadline(now,expiry,false)
  const updated=await tx.accessCode.update({where:{id:link.codeId},data:{clientName:user.name.slice(0,120),clientType:user.kind==='TRIAL'?'library_trial':'library',active:true,expiresAt:expiry,browserHash,sessionHash:hashToken(sessionToken),sessionExpiresAt}})
  if(link.adminBlocked&&user.override==='grant')await tx.studioLibraryLink.update({where:{id:link.id},data:{adminBlocked:false}})
  await tx.accessCodeUse.upsert({where:{codeId_deviceId:{codeId:link.codeId,deviceId:browserHash}},create:{codeId:link.codeId,deviceId:browserHash},update:{usedAt:now}})
  return {plan:updated.clientType,sessionExpiresAt}
 })
 return {...result,sessionToken,browser}
}
