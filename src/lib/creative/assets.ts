import 'server-only';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';
export const kinds = ['template','element','background','font','animation'] as const;
export type AssetKind = typeof kinds[number];
export const assetSelect = {id:true,kind:true,name:true,category:true,tags:true,status:true,order:true,mimeType:true,bytes:true,createdAt:true,updatedAt:true} as const;
export function serializeAsset(a:{id:string;tags:string;[key:string]:unknown}) {
  let tags:string[]=[];
  try {const parsed=JSON.parse(a.tags);if(Array.isArray(parsed)) tags=parsed.filter((t):t is string=>typeof t==='string');}catch{}
  return {...a,tags,url:`/api/creative-assets/${a.id}`};
}
export async function listAssets(params:URLSearchParams,admin=false){
  const requestedKind=params.get('kind');
  const kind=kinds.includes(requestedKind as AssetKind)?requestedKind:undefined;
  const q=(params.get('q')||'').slice(0,100).trim();
  const category=(params.get('category')||'').slice(0,80);
  const page=Math.max(1, Math.min(100000,parseInt(params.get('page')||'1',10)||1));
  const perPage=36;
  const where:Prisma.CreativeAssetWhereInput={
    ...(kind?{kind}:{}),...(admin?{}:{status:'published'}),...(category?{category}:{}),
    ...(q?{OR:[{name:{contains:q,mode:'insensitive'}},{category:{contains:q,mode:'insensitive'}},{tags:{contains:q,mode:'insensitive'}}]}:{})
  };
  const [rows,total] = await Promise.all([
    db.creativeAsset.findMany({where,select:assetSelect,skip:(page-1)*perPage,take:perPage,orderBy:[{order:'asc'},{createdAt:'desc'}]}),
    db.creativeAsset.count({where})
  ]);
  return {items:rows.map(serializeAsset),total,page,pages:Math.ceil(total/perPage)};
}
