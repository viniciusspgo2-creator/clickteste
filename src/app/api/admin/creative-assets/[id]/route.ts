import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { r2Request } from '@/lib/creative/r2';
const err=(error:string,status=400)=>NextResponse.json({ok:false,error},{status});
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 if(!requireAdmin(req))return err('Não autorizado',401);
 const {id}=await params;
 try{const value=await req.json();const data:{name?:string;category?:string;tags?:string;status?:string;order?:number}={};
 if(typeof value.name==='string')data.name=value.name.trim().slice(0,120);
 if(typeof value.category==='string')data.category=value.category.trim().slice(0,80);
 if(Array.isArray(value.tags))data.tags=JSON.stringify(value.tags.filter((x:unknown)=>typeof x==='string').slice(0,20));
 if(['draft','published','archived'].includes(value.status))data.status=value.status;
 if(Number.isSafeInteger(value.order))data.order=Math.max(-100000,Math.min(100000,value.order));
 await db.creativeAsset.update({where:{id},data});return NextResponse.json({ok:true});
 }catch{return err('Não foi possível atualizar',400)}
}
export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){
 if(!requireAdmin(req))return err('Não autorizado',401);
 const {id}=await params;
 const asset=await db.creativeAsset.findUnique({where:{id}});
 if(!asset)return err('Arquivo não encontrado',404);
 try{await r2Request('DELETE',asset.storageKey);await db.creativeAsset.delete({where:{id}});return NextResponse.json({ok:true});}
 catch{return err('Falha na exclusão. O registro foi preservado para nova tentativa.',503)}
}
