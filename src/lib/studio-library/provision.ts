import {randomBytes} from 'node:crypto';
import {db} from '@/lib/db';
import {LibraryRequestError,type LibraryEvent} from './contract';

export async function provisionLibraryAccess(event:LibraryEvent){
 return db.$transaction(async tx=>{
  // Same lock order for every delivery, across all server instances.
  await tx.$queryRaw`SELECT 1::int FROM pg_advisory_xact_lock(hashtextextended(${`studio-library-event:${event.eventId}`},0))`;
  await tx.$queryRaw`SELECT 1::int FROM pg_advisory_xact_lock(hashtextextended(${`studio-library-user:${event.libraryUserId}`},0))`;
  const receipt=await tx.studioIntegrationEvent.findUnique({where:{eventId:event.eventId}});
  const versionReceipt=await tx.studioIntegrationEvent.findUnique({where:{externalUserId_version:{externalUserId:event.libraryUserId,version:event.version}}});
  if((receipt&&receipt.bodyHash!==event.bodyHash)||(versionReceipt&&versionReceipt.bodyHash!==event.bodyHash))throw new LibraryRequestError('Identificador ou versão já utilizado por outro evento.',409);
  let link=await tx.studioLibraryLink.findUnique({where:{externalUserId:event.libraryUserId},include:{code:true}});
  const reply=(current:NonNullable<typeof link>)=>({ok:true,code:current.code.code,libraryUserId:current.externalUserId,version:current.version,entitlement:current.state,registeredAt:current.registeredAt.toISOString(),trialEndsAt:current.trialEndsAt.toISOString(),expiresAt:current.code.expiresAt?.toISOString()??null,active:current.code.active&&(!current.code.expiresAt||current.code.expiresAt>new Date()),adminBlocked:current.adminBlocked});
  if(receipt||versionReceipt){if(!link)throw new LibraryRequestError('Vínculo indisponível.',409);return {...reply(link),duplicate:true};}
  if(link&&link.registeredAt.getTime()!==Date.parse(event.registeredAt))throw new LibraryRequestError('A data original do cadastro não pode ser alterada.',409);
  await tx.studioIntegrationEvent.create({data:{eventId:event.eventId,externalUserId:event.libraryUserId,version:event.version,bodyHash:event.bodyHash}});
  if(link&&event.version<link.version)return {...reply(link),stale:true};
  const registeredAt=new Date(event.registeredAt),trialEndsAt=new Date(event.trialEndsAt),state=event.entitlement;
  if(!link){
   const code=await tx.accessCode.create({data:{code:'CG-'+randomBytes(12).toString('hex').toUpperCase(),clientName:event.name,clientType:state==='MEMBER'?'library':'library_trial',accessMode:'individual',maxUses:1,active:state!=='REVOKED',expiresAt:state==='MEMBER'?null:trialEndsAt}});
   link=await tx.studioLibraryLink.create({data:{externalUserId:event.libraryUserId,codeId:code.id,registeredAt,trialEndsAt,state,version:event.version},include:{code:true}});
  }else{
   await tx.$queryRaw`SELECT id FROM "AccessCode" WHERE id=${link.codeId} FOR UPDATE`;
   const code=await tx.accessCode.findUniqueOrThrow({where:{id:link.codeId}});
   // Preserve an operator's revocation. Payment does not override a manual block.
   const adminBlocked=link.adminBlocked||(!code.active&&link.state!=='REVOKED');
   await tx.accessCode.update({where:{id:code.id},data:{clientName:event.name,clientType:state==='MEMBER'?'library':'library_trial',active:!adminBlocked&&state!=='REVOKED',expiresAt:state==='MEMBER'?null:trialEndsAt,...(state==='REVOKED'?{sessionHash:null,sessionExpiresAt:null}:{})}});
   link=await tx.studioLibraryLink.update({where:{id:link.id},data:{state,version:event.version,adminBlocked},include:{code:true}});
  }
  return {...reply(link),duplicate:false};
 },{maxWait:5000,timeout:10000});
}
