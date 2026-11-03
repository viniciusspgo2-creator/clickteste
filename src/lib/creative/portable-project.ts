/** Export a self-contained .cgdesign rather than persisting short-lived blob: URLs.
 * Browser media is read locally; this module does not upload project files.
 */
import type {DesignDocument} from './design';
import {validateProjectDocument} from './validate-project';

const MAX_SINGLE_MEDIA_BYTES=24*1024*1024;
const MAX_PROJECT_BYTES=43*1024*1024; // Imported .cgdesign files are capped at 45 MiB.
export type MediaKind='image'|'video';
export type MediaResolver=(url:string,kind:MediaKind)=>Promise<string>;

export function hasTemporaryMedia(doc:DesignDocument):boolean{
 return Boolean(doc.video?.src?.startsWith('blob:')||doc.nodes.some(n=>n.src?.startsWith('blob:')||n.maskSrc?.startsWith('blob:'))||doc.smartTemplate?.maskSrc?.startsWith('blob:'));
}

function dataUrl(blob:Blob):Promise<string>{
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>resolve(String(reader.result));
  reader.onerror=()=>reject(new Error('Não foi possível incorporar um arquivo ao backup local.'));
  reader.readAsDataURL(blob);
 });
}

async function readLocalMedia(url:string,kind:MediaKind):Promise<string>{
 let response:Response;
 try{response=await fetch(url,{credentials:'omit',mode:'cors'});}
 catch{throw new Error('Não foi possível acessar uma mídia do projeto. Faça upload novamente antes de salvar o backup.');}
 if(!response.ok)throw new Error(`Uma mídia do projeto está indisponível (${response.status}). Faça upload novamente antes de salvar.`);
 const declared=Number(response.headers.get('content-length'));
 if(Number.isFinite(declared)&&declared>MAX_SINGLE_MEDIA_BYTES)throw new Error('Uma mídia excede 24 MB. Reduza o arquivo antes de criar o backup.');
 const blob=await response.blob();
 if(blob.size>MAX_SINGLE_MEDIA_BYTES)throw new Error('Uma mídia excede 24 MB. Reduza o arquivo antes de criar o backup.');
 const allowed=kind==='video'?/^video\/mp4$/i:/^image\/(png|jpeg|webp|gif|bmp|avif|svg\+xml)$/i;
 if(!allowed.test(blob.type))throw new Error('O formato da mídia não é compatível com o backup portátil. Exporte ou converta a mídia e importe novamente.');
 return dataUrl(blob);
}

/** Materialize every blob/HTTPS image, mask and video into the downloaded backup.
 * An error aborts the backup; never return JSON with broken source references.
 * The optional resolver exists for deterministic tests and offline browser fixtures.
 */
export async function makePortableDocument(doc:DesignDocument,resolveMedia:MediaResolver=readLocalMedia):Promise<DesignDocument>{
 validateProjectDocument(doc);
 const materialized=new Map<string,Promise<string>>();
 const portable=async(url:string|undefined,kind:MediaKind):Promise<string|undefined>=>{
  if(!url||(!url.startsWith('blob:')&&!url.startsWith('https://')))return url;
  const key=`${kind}:${url}`;
  if(!materialized.has(key))materialized.set(key,resolveMedia(url,kind));
  const result=await materialized.get(key)!;
  const prefix=kind==='video'?/^data:video\/mp4;base64,/i:/^data:image\/(png|jpeg|webp|gif|bmp|avif);base64,|^data:image\/svg\+xml[,;]/i;
  if(typeof result!=='string'||!prefix.test(result))throw new Error('Uma mídia não pôde ser incorporada como arquivo local válido.');
  return result;
 };
 const nodes=[] as DesignDocument['nodes'];
 for(const node of doc.nodes){
  const clone={...node};
  if(node.src)clone.src=await portable(node.src,'image');
  if(node.maskSrc)clone.maskSrc=await portable(node.maskSrc,'image');
  nodes.push(clone);
 }
 const video=doc.video?{...doc.video,src:(await portable(doc.video.src,'video'))!}:undefined;
 const smartTemplate=doc.smartTemplate?{...doc.smartTemplate,maskSrc:await portable(doc.smartTemplate.maskSrc,'image')}:undefined;
 const result:DesignDocument={...doc,nodes,video,smartTemplate};
 validateProjectDocument(result);
 return result;
}

export async function createPortableProjectBlob(doc:DesignDocument,resolveMedia?:MediaResolver):Promise<Blob>{
 const portable=await makePortableDocument(doc,resolveMedia);
 const bytes=new TextEncoder().encode(JSON.stringify({format:'cgdesign',version:1,document:portable}));
 if(bytes.byteLength>MAX_PROJECT_BYTES)throw new Error('Backup acima de 43 MB. Reduza o vídeo ou as imagens antes de salvar. O projeto atual não foi modificado.');
 return new Blob([bytes],{type:'application/json'});
}
