import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { kinds,listAssets,serializeAsset } from '@/lib/creative/assets';
import { r2Request } from '@/lib/creative/r2';
import { classifyFont } from '@/lib/creative/font-coverage';
export const runtime='nodejs';
const ERR=(message:string,status=400)=>NextResponse.json({ok:false,error:message},{status});
const MIME:Record<string,string>={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',svg:'image/svg+xml',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf',json:'application/json',mp4:'video/mp4',cgtemplate:'application/x-clickgruda-template'};
function validate(bytes:Buffer,ext:string){
  const start=bytes.subarray(0,16).toString('hex');
  const text=(ext==='svg'||ext==='json')?bytes.toString('utf8'):'';
  if(ext==='png') return start.startsWith('89504e470d0a1a0a');
  if(['jpg','jpeg'].includes(ext)) return start.startsWith('ffd8ff');
  if(ext==='webp')return bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
  if(ext==='mp4')return bytes.toString('ascii',4,8)==='ftyp';
  if(ext==='cgtemplate')return bytes.toString('binary',0,4)==='PK\u0003\u0004';
  if(ext==='woff')return bytes.toString('ascii',0,4)==='wOFF';
  if(ext==='woff2')return bytes.toString('ascii',0,4)==='wOF2';
  if(ext==='ttf')return start.startsWith('00010000');
  if(ext==='otf')return bytes.toString('ascii',0,4)==='OTTO';
  if(ext==='json'){try{const data=JSON.parse(text);return data&&typeof data==='object'&&Number.isFinite(data.fr)&&Array.isArray(data.layers)&&data.layers.length<2000;}catch{return false;}}
  if(ext==='svg')return /^\s*(?:<\?xml[^>]*>\s*)?<svg[\s>]/i.test(text) && !/<\s*(?:script|foreignObject|iframe|object|embed|image)\b|\bon\w+\s*=|(?:href|src)\s*=\s*['"]?\s*(?:https?:|data:|javascript:)|<!ENTITY|<!DOCTYPE|<\?xml-stylesheet/i.test(text);
  return false;
}
export async function GET(req:Request){if(!requireAdmin(req))return ERR('Não autorizado',401);
  try{return NextResponse.json({ok:true,...await listAssets(new URL(req.url).searchParams,true)});}catch{return ERR('Falha ao listar biblioteca',503)}
}
export async function POST(req:Request){
  if(!requireAdmin(req))return ERR('Não autorizado',401);
  if(Number(req.headers.get('content-length')||0)>4*1024*1024+65536)return ERR('Máximo de 4 MB por arquivo',413);
  try{
    const form=await req.formData();const file=form.get('file');const kind=String(form.get('kind')||'');
    if(!(file instanceof File)||!kinds.includes(kind as (typeof kinds)[number]))return ERR('Arquivo ou tipo inválido');
    const name=String(form.get('name')||file.name).trim().slice(0,120);
    const category=String(form.get('category')||'Geral').trim().slice(0,80)||'Geral';
    const tags=String(form.get('tags')||'').split(',').map(x=>x.trim().slice(0,40)).filter(Boolean).slice(0,20);
    const status=form.get('status')==='draft'?'draft':'published';
    if(kind==='font'&&form.get('rightsConfirmed')!=='yes')return ERR('Confirme a licença que permite distribuir essa fonte aos usuários da plataforma.');
    if(!name||file.size<8||file.size>4*1024*1024)return ERR('Nome vazio ou arquivo fora do limite de 4 MB.');
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    if(!MIME[ext])return ERR('Formato não suportado.');
    if(kind==='font'&&!['woff','woff2','ttf','otf'].includes(ext))return ERR('Fontes devem ser WOFF, WOFF2, TTF ou OTF.');
    if(kind==='animation'&&ext!=='json')return ERR('Animações devem ser Lottie JSON.');
    if(kind==='template'&&!['png','jpg','jpeg','webp','mp4','cgtemplate'].includes(ext))return ERR('Templates devem ser imagens, MP4 ou pacote .cgtemplate.');
    if(['element','background'].includes(kind)&&!['png','jpg','jpeg','webp','svg'].includes(ext))return ERR('Use imagens estáticas ou SVG.');
    const bytes=Buffer.from(await file.arrayBuffer());
    if(!validate(bytes,ext))return ERR('Arquivo inválido, inseguro ou incompatível com o formato.');
    if(ext==='cgtemplate'){
      const JSZip=(await import('jszip')).default;
      const zip=await JSZip.loadAsync(bytes,{checkCRC32:true});
      const list=Object.keys(zip.files);if(list.length>12||!zip.file('manifest.json'))return ERR('Template inteligente inválido: manifest.json ausente ou muitos arquivos.');
      if(list.some(path=>path.startsWith('/')||path.includes('..')||(!path.endsWith('/')&&!/^[-_\w./ ]+\.(png|jpe?g|webp|json)$/i.test(path))))return ERR('Template contém arquivos incompatíveis.');
      const json=JSON.parse(await zip.file('manifest.json')!.async('text'));
      if(json.format!=='clickgruda-smart-template'||json.version!==1||!Number.isFinite(json.width)||!Number.isFinite(json.height)||json.width>4096||json.height>4096||json.width<100||json.height<100)return ERR('Manifest de template inteligente inválido.');
      for(const field of ['background','foreground','mask','shadow'])if(json[field]&&!zip.file(json[field]))return ERR(`Arquivo ausente no template: ${field}`);
    }
    if(kind==='font'){const coverage=classifyFont(bytes,ext);tags.push(coverage.status);if(coverage.missing)tags.push('faltando-'+coverage.missing.slice(0,18));}
    const key=`creative/${kind}/${randomUUID()}.${ext}`;
    await r2Request('PUT',key,bytes,MIME[ext]);
    try{const asset=await db.creativeAsset.create({data:{name,kind,category,tags:JSON.stringify(tags),status,storageKey:key,mimeType:MIME[ext],bytes:bytes.length},select:{id:true,kind:true,name:true,category:true,tags:true,status:true,order:true,mimeType:true,bytes:true,createdAt:true,updatedAt:true}});
      return NextResponse.json({ok:true,asset:serializeAsset(asset)},{status:201});
    }catch(e){await r2Request('DELETE',key).catch(()=>{});throw e;}
  }catch(e){return ERR(e instanceof Error?e.message:'Não foi possível salvar arquivo',503);}
}
