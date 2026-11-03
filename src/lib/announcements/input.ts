import { z } from 'zod';
export function safeNoticeUrl(value: string): boolean {
  if (!value) return true;
  if (/[\u0000-\u0020\\]/.test(value)) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try { const u=new URL(value); return u.protocol==='https:' && !u.username && !u.password; } catch { return false; }
}
const url=z.string().trim().max(1500).refine(safeNoticeUrl,'Use um caminho do site ou URL HTTPS válida.').default('');
const date=z.union([z.string().datetime({offset:true}),z.literal('')]).default('');
export const announcementInput=z.object({
 title:z.string().trim().min(1).max(120), message:z.string().trim().min(1).max(3000),
 type:z.enum(['info','success','warning']).default('info'), imageUrl:url,
 buttonText:z.string().trim().max(60).default(''),buttonUrl:url,
 startsAt:date, endsAt:date, audience:z.enum(['all','library','standalone']).default('all'),
 priority:z.number().int().min(0).max(100).default(0), repeat:z.enum(['once','daily','always']).default('once'),
 status:z.enum(['draft','active','ended']).default('draft'),
}).superRefine((v,ctx)=>{
 if(v.startsAt&&v.endsAt&&new Date(v.endsAt)<=new Date(v.startsAt))ctx.addIssue({code:'custom',message:'O fim precisa ser posterior ao início.'});
 if(!!v.buttonText!==!!v.buttonUrl)ctx.addIssue({code:'custom',message:'Informe texto e URL do botão juntos.'});
});
export type AnnouncementData=z.infer<typeof announcementInput>;
export type Announcement=AnnouncementData & {id:string;revision:string};
export function isNoticeVisible(n:Announcement,audience:'library'|'standalone'|'admin',now=Date.now()) {
 return n.status==='active' && (!n.startsAt || Date.parse(n.startsAt)<=now) && (!n.endsAt || Date.parse(n.endsAt)>now) && (n.audience==='all'||audience==='admin'||n.audience===audience);
}
export function noticeDismissalKey(n:Announcement) { return `cg-notice:${n.id}:${n.revision}`; }
export function dismissedNotice(n:Announcement,value:string|null,now=new Date()) {
 if(n.repeat==='always') return false;
 if(n.repeat==='once') return value==='closed';
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(now);
 return value===today;
}
