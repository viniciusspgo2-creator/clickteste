/** Validation for imported .cgdesign files (untrusted JSON, processed only locally).
 * A file that renders is not necessarily a safe or well-formed editor document.
 */
import type {DesignDocument} from './design';
const kinds=new Set(['text','image','rect','circle']);
const roles=new Set(['template','background','mockup','content','foreground']);
const numeric=(n:unknown,min:number,max:number)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
const isRecord=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);
const short=(s:unknown,max:number)=>typeof s==='string'&&s.length<=max;
const mediaUrl=(value:unknown,type:'image'|'video')=>{
 if(!short(value,34_000_000))return false;
 const s=value as string;
 if(/^(https:\/\/|blob:)/i.test(s))return true;
 if(type==='video')return /^data:video\/mp4;base64,/i.test(s);
 if(/^data:image\/(png|jpeg|webp|gif|bmp|avif);base64,/i.test(s))return true;
 // Bundled vector backgrounds are embedded as SVG data URIs.
 if(/^data:image\/svg\+xml[,;]/i.test(s)){
  let raw=s.slice(19);
  try{raw=decodeURIComponent(raw);}catch{return false;}
  return !/<\s*(script|foreignObject|iframe|image|use|animate|set)\b|\bon\w+\s*=|javascript\s*:|\b(href|src)\s*=|<!DOCTYPE|<!ENTITY|@import|url\s*\(\s*https?:/i.test(raw);
 }
 return false;
};
const named=(v:unknown)=>short(v,250);
/** Throws a user-readable error; never executes content or sends it to the server. */
export function validateProjectDocument(input:unknown):asserts input is DesignDocument{
 if(!isRecord(input)||!numeric(input.width,100,8192)||!numeric(input.height,100,8192)||!short(input.background,64)||!Array.isArray(input.nodes)||input.nodes.length>1000)throw new Error('Projeto com dimensões ou estrutura incompatíveis.');
 if(input.background!=='transparent'&&!/^#[0-9a-fA-F]{3,8}$/.test(input.background as string))throw new Error('Cor de fundo inválida.');
 const ids=new Set<string>();
 for(const [index,n] of input.nodes.entries()){
  if(!isRecord(n)||!named(n.id)||!(n.id as string)||ids.has(n.id as string)||!kinds.has(n.kind as string))throw new Error(`Elemento ${index+1} inválido.`);
  ids.add(n.id as string);
  for(const key of ['x','y','angle'])if(!numeric(n[key],-65536,65536))throw new Error(`Geometria inválida no elemento ${index+1}.`);
  for(const key of ['w','h'])if(!numeric(n[key],0.01,16384))throw new Error(`Tamanho inválido no elemento ${index+1}.`);
  if(!numeric(n.opacity,0,1))throw new Error(`Transparência inválida no elemento ${index+1}.`);
  if(n.role!==undefined&&!roles.has(n.role as string))throw new Error('Tipo de camada inválido.');
  if(n.visible!==undefined&&typeof n.visible!=='boolean')throw new Error('Visibilidade de camada inválida.');
  if(n.locked!==undefined&&typeof n.locked!=='boolean')throw new Error('Bloqueio de camada inválido.');
  if(n.kind==='image'&&!mediaUrl(n.src,'image'))throw new Error(`Imagem insegura ou inválida no elemento ${index+1}.`);
  if(n.kind==='text'&&!short(n.text,20000))throw new Error(`Texto muito longo no elemento ${index+1}.`);
  for(const key of ['font','layerName','fill','tint','stroke','shadowColor'])if(n[key]!==undefined&&!short(n[key],250))throw new Error(`Atributo inválido: ${key}.`);
  if(n.maskSrc!==undefined&&!mediaUrl(n.maskSrc,'image'))throw new Error('Máscara inválida.');
  if(n.crop!==undefined){if(!isRecord(n.crop)||!['left','right','top','bottom'].every(k=>numeric((n.crop as Record<string,unknown>)[k],0,.99)))throw new Error('Recorte inválido.');}
  if(n.keyframes!==undefined){if(!Array.isArray(n.keyframes)||n.keyframes.length>300)throw new Error('Animação inválida.');for(const frame of n.keyframes){if(!isRecord(frame)||!numeric(frame.time,0,600)||!numeric(frame.x,-65536,65536)||!numeric(frame.y,-65536,65536)||!numeric(frame.w,.01,16384)||!numeric(frame.h,.01,16384)||!numeric(frame.angle,-65536,65536)||!numeric(frame.opacity,0,1))throw new Error('Keyframe inválido.');}}
 }
 if(input.video!==undefined){const video=input.video;if(!isRecord(video)||!mediaUrl(video.src,'video')||!named(video.name)||!numeric(video.start,0,86400)||(video.end!==undefined&&!numeric(video.end,0,86400))||(video.fit!==undefined&&!['cover','contain'].includes(String(video.fit))))throw new Error('Vídeo inválido.');}
 if(input.smartTemplate!==undefined){const smart=input.smartTemplate;if(!isRecord(smart)||!isRecord(smart.slot)||!['x','y','w','h'].every(k=>numeric((smart.slot as Record<string,unknown>)[k],0,8192))||(smart.maskSrc!==undefined&&!mediaUrl(smart.maskSrc,'image')))throw new Error('Encaixe de template inválido.');}
}
