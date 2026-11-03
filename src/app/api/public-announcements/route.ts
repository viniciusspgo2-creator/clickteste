import {NextResponse} from 'next/server';
import {listAnnouncements} from '@/lib/announcements/server';
import {isNoticeVisible} from '@/lib/announcements/input';
import {STUDIO_ANNOUNCEMENTS_ENABLED} from '@/lib/features';

/** Avisos públicos publicados pelo Admin. Rascunhos e avisos de clientes não saem nesta rota. */
export async function GET(){
 if(!STUDIO_ANNOUNCEMENTS_ENABLED)return NextResponse.json({ok:true,items:[]},{headers:{'Cache-Control':'no-store'}});
 try{
  const items=(await listAnnouncements())
   .filter(a=>a.audience==='all'&&isNoticeVisible(a,'standalone'))
   .sort((a,b)=>b.priority-a.priority||b.revision.localeCompare(a.revision))
   .slice(0,10);
  return NextResponse.json({ok:true,items},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({ok:false,items:[]},{status:503,headers:{'Cache-Control':'no-store'}});}
}
