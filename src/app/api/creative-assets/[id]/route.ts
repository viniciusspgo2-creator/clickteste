import {checkPremiumSession} from '@/lib/premium-session';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { r2Request } from '@/lib/creative/r2';
export const runtime='nodejs';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
  try {if(!(await checkPremiumSession(req)).ok)return new Response(JSON.stringify({ok:false,error:'Acesso não autorizado.'}),{status:401,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store'}});}catch{return new Response(null,{status:503});}
  const {id}=await params;
  if(!/^[a-zA-Z0-9_-]{1,80}$/.test(id))return new NextResponse(null,{status:404});
  const asset=await db.creativeAsset.findUnique({where:{id},select:{storageKey:true,mimeType:true,status:true}}).catch(()=>null);
  if(!asset || (asset.status!=='published'&&!requireAdmin(req))) return new NextResponse('Não encontrado',{status:404});
  try{
    const range=asset.mimeType==='video/mp4' ? req.headers.get('range')||undefined:undefined;
    const fromR2=await r2Request('GET',asset.storageKey,undefined,undefined,range);
    if(!fromR2.body) return new NextResponse('Sem conteúdo',{status:502});
    return new NextResponse(fromR2.body, {status:fromR2.status,headers:{
      'Content-Type':asset.mimeType,
      ...(asset.mimeType==='video/mp4'?{'Accept-Ranges':'bytes'}:{}),
      ...(fromR2.headers.get('content-range')?{'Content-Range':fromR2.headers.get('content-range')!}:{}),
      ...(fromR2.headers.get('content-length')?{'Content-Length':fromR2.headers.get('content-length')!}:{}),
      'X-Content-Type-Options':'nosniff',
      'Cross-Origin-Resource-Policy':'same-origin',
      'Vary':'Cookie, Authorization',
      'Cache-Control':asset.status==='published'?'private, no-store':'private, no-store',
      ...(asset.mimeType==='image/svg+xml'?{'Content-Security-Policy':"sandbox; default-src 'none'; style-src 'unsafe-inline'"}:{}),
      ...(asset.mimeType==='application/json'?{'Content-Disposition':'attachment'}:{}),
    }});
  }catch{return new NextResponse('Arquivo indisponível',{status:502});}
}
