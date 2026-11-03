import {STUDIO_ANNOUNCEMENTS_ENABLED} from '@/lib/features';
import {NextResponse} from 'next/server';
import {checkPremiumSession} from '@/lib/premium-session';
import {listAnnouncements} from '@/lib/announcements/server';
import {isNoticeVisible} from '@/lib/announcements/input';
export async function GET(req:Request) {
 if(!STUDIO_ANNOUNCEMENTS_ENABLED)return NextResponse.json({ok:true,items:[]});
 try {
  const session=await checkPremiumSession(req);
  if(!session.ok)return NextResponse.json({ok:false,items:[]},{status:401});
  const audience=session.plan==='Admin Master'?'admin':session.plan==='Biblioteca Click Gruda'?'library':'standalone';
  const items=(await listAnnouncements()).filter(n=>isNoticeVisible(n,audience)).sort((a,b)=>b.priority-a.priority||b.revision.localeCompare(a.revision));
  return NextResponse.json({ok:true,items},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({ok:false,items:[]},{status:503});}
}
