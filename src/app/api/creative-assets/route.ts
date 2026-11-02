import { NextResponse } from 'next/server';
import { listAssets,serializeAsset,assetSelect } from '@/lib/creative/assets';
import {db} from '@/lib/db';
export const runtime='nodejs';
export async function GET(req:Request){
  try {const params=new URL(req.url).searchParams;const assetId=params.get('assetId');if(assetId){const asset=await db.creativeAsset.findFirst({where:{id:assetId,status:'published'},select:assetSelect});return NextResponse.json(asset?{ok:true,asset:serializeAsset(asset)}:{ok:false,error:'Material não encontrado'},{status:asset?200:404});}return NextResponse.json({ok:true,...await listAssets(params)}, {headers:{'Cache-Control':'no-store'}});}
  catch{return NextResponse.json({ok:false,error:'Catálogo temporariamente indisponível.'},{status:503});}
}
