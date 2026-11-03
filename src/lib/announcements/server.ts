import {db} from '@/lib/db';
import {announcementInput,type Announcement} from './input';
export const NOTICE_PREFIX='studio-announcement:';
export async function listAnnouncements():Promise<Announcement[]> {
 const rows=await db.siteConfig.findMany({where:{key:{startsWith:NOTICE_PREFIX}},orderBy:{updatedAt:'desc'},take:200});
 return rows.flatMap(row=>{try{const value=JSON.parse(row.value), data=announcementInput.safeParse(value);
  return data.success?[{...data.data,id:row.key.slice(NOTICE_PREFIX.length),revision:row.updatedAt.toISOString()}]:[];
 }catch{return [];}});
}
export function validNoticeOrigin(req:Request) {
 const origin=req.headers.get('origin');
 return req.headers.get('sec-fetch-site')!=='cross-site' && (!origin || origin===new URL(req.url).origin);
}
