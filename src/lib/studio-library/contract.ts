import {z} from 'zod';
import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
export const LIBRARY_PATH='/api/integrations/library/entitlements';
export const TRIAL_MS=7*86400000;
export class LibraryRequestError extends Error{constructor(message:string,public status=400){super(message);}}
const input=z.object({eventId:z.string().uuid(),version:z.number().int().positive().max(2147483647),libraryUserId:z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),name:z.string().trim().min(1).max(120),entitlement:z.enum(['TRIAL','MEMBER','REVOKED']),revocationReason:z.enum(['ADMIN_REVOKED','ACCOUNT_BLOCKED','REFUND','CHARGEBACK']).optional(),registeredAt:z.string().datetime({offset:true}),trialEndsAt:z.string().datetime({offset:true}).optional()}).strict();
export function parseLibraryEvent(raw:string,now=Date.now()){
 let json:unknown;try{json=JSON.parse(raw);}catch{throw new LibraryRequestError('JSON inválido.');}
 const parsed=input.safeParse(json);if(!parsed.success)throw new LibraryRequestError('Evento inválido.');
 const event=parsed.data;
 if(event.entitlement==='REVOKED'&&!event.revocationReason)throw new LibraryRequestError('Informe o motivo administrativo ou financeiro da revogação.');
 if(event.entitlement!=='REVOKED'&&event.revocationReason)throw new LibraryRequestError('Motivo de revogação fora de um evento de revogação.');
 const registeredAt=new Date(event.registeredAt),trialEndsAt=new Date(registeredAt.getTime()+TRIAL_MS);
 if(registeredAt.getTime()>now+300000)throw new LibraryRequestError('Data de cadastro futura.');
 if(event.entitlement==='TRIAL'&&!event.trialEndsAt)throw new LibraryRequestError('Informe o fim do teste.');
 if(event.trialEndsAt&&Date.parse(event.trialEndsAt)!==trialEndsAt.getTime())throw new LibraryRequestError('O teste termina sete dias após o cadastro.');
 const canonical={...event,registeredAt:registeredAt.toISOString(),trialEndsAt:trialEndsAt.toISOString()};
 return {...canonical,bodyHash:createHash('sha256').update(JSON.stringify(canonical)).digest('hex')};
}
export type LibraryEvent=ReturnType<typeof parseLibraryEvent>;
export function validLibrarySignature(req:Request,raw:string,secret:string,now=Date.now()){
 const stamp=req.headers.get('x-library-timestamp')||'',signature=req.headers.get('x-library-signature')||'';
 if(req.method!=='POST'||new URL(req.url).pathname!==LIBRARY_PATH||new URL(req.url).search||!/^\d{10}$/.test(stamp)||!/^v1=[a-f0-9]{64}$/.test(signature))return false;
 if(Math.abs(now-Number(stamp)*1000)>300000)return false;
 const expected='v1='+createHmac('sha256',secret).update(`POST\n${LIBRARY_PATH}\n${stamp}\n${raw}`).digest('hex');
 return timingSafeEqual(Buffer.from(signature),Buffer.from(expected));
}
