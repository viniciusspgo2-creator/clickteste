/**
 * Confere mídias de um projeto ANTES de substituir a arte aberta.
 * A análise ocorre no navegador: nada é enviado ao backend da Click & Gruda.
 * Resultados repetidos são compartilhados e somente três recursos são decodificados
 * simultaneamente para limitar o pico de memória de projetos com muitas camadas.
 */
import type {DesignDocument} from './design';
import {loadImageWithTimeout} from './async-image-load';

export type ProjectMediaIssue={kind:'image'|'mask'|'video';name:string;severity:'error'|'warning'};
export type ProjectMediaLoaders={image:(url:string)=>Promise<void>;video:(url:string)=>Promise<void>};

export const canApplyLoadedProject=(request:number,latest:number,before:DesignDocument,current:DesignDocument)=>
 request===latest&&before===current;

const loadImage=async(url:string):Promise<void>=>{await loadImageWithTimeout(url,12_000);};

// Falha de codec impede a prévia, mas não invalida as demais camadas do projeto.
// Por isso problemas de vídeo são retornados como avisos, não como erro fatal.
const loadVideo=(url:string):Promise<void>=>new Promise((resolve,reject)=>{
 const video=document.createElement('video');video.preload='metadata';video.muted=true;
 let finished=false;
 const finish=(error?:Error)=>{if(finished)return;finished=true;clearTimeout(timeout);video.removeAttribute('src');video.load();if(error)reject(error);else resolve();};
 const timeout=setTimeout(()=>finish(new Error('Tempo limite de vídeo')),12000);
 video.onloadedmetadata=()=>finish(video.videoWidth>0&&video.videoHeight>0?undefined:new Error('Vídeo sem dimensões'));
 video.onerror=()=>finish(new Error('Vídeo indisponível ou não compatível'));
 video.src=url;video.load();
});

/** Retorna até quatro ocorrências por tipo, sem expor URLs privadas nos avisos. */
export async function inspectProjectMedia(doc:DesignDocument,loaders:ProjectMediaLoaders={image:loadImage,video:loadVideo}):Promise<ProjectMediaIssue[]>{
 const references:{src:string;name:string;kind:ProjectMediaIssue['kind']}[]=[];
 for(const [index,node] of doc.nodes.entries()){
  const name=(node.layerName||node.text?.slice(0,32)||`Camada ${index+1}`).slice(0,60);
  if(node.kind==='image'&&node.src)references.push({src:node.src,name,kind:'image'});
  if(node.maskSrc)references.push({src:node.maskSrc,name,kind:'mask'});
 }
 if(doc.smartTemplate?.maskSrc)references.push({src:doc.smartTemplate.maskSrc,name:'Máscara do template',kind:'mask'});
 if(doc.video?.src)references.push({src:doc.video.src,name:doc.video.name||'Vídeo de fundo',kind:'video'});
 const unique=[...new Map(references.map(r=>[`${r.kind==='video'?'video':'image'}:${r.src}`,r])).values()];
 const failures=new Set<string>();
 let cursor=0;
 const check=async()=>{
  while(cursor<unique.length){
   const r=unique[cursor++];
   try{await (r.kind==='video'?loaders.video:loaders.image)(r.src);}
   catch{failures.add(`${r.kind==='video'?'video':'image'}:${r.src}`);}
  }
 };
 await Promise.all(Array.from({length:Math.min(3,unique.length)},()=>check()));
 const issues:ProjectMediaIssue[]=[];
 for(const r of references){
  const key=`${r.kind==='video'?'video':'image'}:${r.src}`;
  if(failures.has(key)&&issues.filter(i=>i.kind===r.kind).length<4){
   issues.push({kind:r.kind,name:r.name,severity:r.kind==='video'?'warning':'error'});
  }
 }
 return issues;
}
