import {checkPremiumSession} from '@/lib/premium-session';
import { NextResponse } from 'next/server';
import { listAssets,serializeAsset,assetSelect } from '@/lib/creative/assets';
import {db} from '@/lib/db';
export const runtime='nodejs';
const headers={'Cache-Control':'private, no-store','Vary':'Cookie, Authorization','Cross-Origin-Resource-Policy':'same-origin'};
export async function GET(req:Request){
  try {if(!(await checkPremiumSession(req)).ok)return new Response(JSON.stringify({ok:false,error:'Acesso não autorizado.'}),{status:401,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store'}});}catch{return new Response(null,{status:503});}
  try {const params=new URL(req.url).searchParams;const assetId=params.get('assetId');if(assetId){if(!/^[a-zA-Z0-9_-]{1,80}$/.test(assetId))return NextResponse.json({ok:false,error:'Material não encontrado'},{status:404,headers});const asset=await db.creativeAsset.findFirst({where:{id:assetId,status:'published'},select:assetSelect});return NextResponse.json(asset?{ok:true,asset:serializeAsset(asset)}:{ok:false,error:'Material não encontrado'},{status:asset?200:404,headers});}return NextResponse.json({ok:true,...await listAssets(params)}, {headers});}
  catch{return NextResponse.json({ok:false,error:'Catálogo temporariamente indisponível.'},{status:503});}
}
