import {NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {db} from '@/lib/db';
import {requireAdmin} from '@/lib/admin-auth';
import {announcementInput} from '@/lib/announcements/input';
import {listAnnouncements,NOTICE_PREFIX,validNoticeOrigin} from '@/lib/announcements/server';
export const runtime='nodejs';
const fail=(error:string,status=400)=>NextResponse.json({ok:false,error},{status});
export async function GET(req:Request) {
 if(!requireAdmin(req))return fail('Não autorizado.',401);
 try{return NextResponse.json({ok:true,items:await listAnnouncements()},{headers:{'Cache-Control':'no-store'}});}catch{return fail('Não foi possível carregar os comunicados.',503);}
}
export async function POST(req:Request) {
 if(!requireAdmin(req))return fail('Não autorizado.',401);
 if(!validNoticeOrigin(req))return fail('Origem não autorizada.',403);
 try {
  if(Number(req.headers.get('content-length'))>12000)return fail('Conteúdo muito grande.',413);
  const text=await req.text();if(text.length>12000)return fail('Conteúdo muito grande.',413);
  const body=JSON.parse(text),parsed=announcementInput.safeParse(body);
  if(!parsed.success)return fail(parsed.error.issues.map(i=>i.message).join(' '));
  const id=body.id??randomUUID();if(typeof id!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id))return fail('Identificador inválido.');
  const key=NOTICE_PREFIX+id,value=JSON.stringify(parsed.data);
  if(body.id) {
   if(typeof body.revision!=='string')return fail('Recarregue o comunicado antes de editar.',409);
   const revision=new Date(body.revision);if(!Number.isFinite(revision.getTime()))return fail('Versão inválida.');
   const result=await db.siteConfig.updateMany({where:{key,updatedAt:revision},data:{value}});
   if(!result.count)return fail('Este comunicado mudou. Recarregue a lista.',409);
  }else{
   if((await listAnnouncements()).length>=200)return fail('Limite de 200 comunicados atingido.');
   await db.siteConfig.create({data:{key,value}});
  }
  return NextResponse.json({ok:true,id});
 }catch{return fail('Não foi possível salvar. Confira os dados e tente novamente.');}
}
