/** Modelo de documento independente do visualizador 3D; sem dados de usuário no servidor. */
export type NodeKind='text'|'image'|'rect'|'circle';
export type DesignNode={id:string;kind:NodeKind;x:number;y:number;w:number;h:number;angle:number;opacity:number;
 text?:string;src?:string;fill?:string;font?:string;size?:number;bold?:boolean;italic?:boolean;align?:CanvasTextAlign;
 shadow?:number;blur?:number;brightness?:number;contrast?:number;saturation?:number;radius?:number;stroke?:string;strokeWidth?:number};
export type DesignDocument={width:number;height:number;background:string;nodes:DesignNode[]};
export type ExportFormat='png'|'jpeg'|'webp';
export const formats=[{label:'Post Instagram',w:1080,h:1350},{label:'Quadrado',w:1080,h:1080},{label:'Story / Reels',w:1080,h:1920},{label:'Estampa 21 × 9,5 cm',w:2480,h:1122},{label:'Horizontal HD',w:1920,h:1080}] as const;
export const uid=()=>crypto.randomUUID();
export const blankDocument=():DesignDocument=>({width:1080,height:1350,background:'#141112',nodes:[]});
const images=new Map<string,Promise<HTMLImageElement>>();
export function imageFor(src:string){
 if(!images.has(src)) images.set(src,new Promise((resolve,reject)=>{
  const img=new Image();img.decoding='async';img.crossOrigin='anonymous';img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Não foi possível carregar a imagem.'));img.src=src;
 }));
 return images.get(src)!;
}
export function invalidateImage(src:string){images.delete(src)}
export async function drawDesign(canvas:HTMLCanvasElement,doc:DesignDocument){
 if(canvas.width!==doc.width)canvas.width=doc.width;
 if(canvas.height!==doc.height)canvas.height=doc.height;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas indisponível');
 ctx.clearRect(0,0,doc.width,doc.height);
 if(doc.background!=='transparent'){ctx.fillStyle=doc.background;ctx.fillRect(0,0,doc.width,doc.height);}
 await Promise.all(doc.nodes.filter(n=>n.kind==='image'&&n.src).map(n=>imageFor(n.src!).catch(()=>null)));
 for(const n of doc.nodes){
  ctx.save();ctx.globalAlpha=n.opacity;ctx.translate(n.x+n.w/2,n.y+n.h/2);ctx.rotate(n.angle*Math.PI/180);
  ctx.shadowColor='rgba(0,0,0,0.74)';ctx.shadowBlur=n.shadow||0;ctx.shadowOffsetY=(n.shadow||0)*.4;
  if(n.kind==='image'&&n.src){try{
   const img=await imageFor(n.src);ctx.filter=`brightness(${n.brightness??100}%) contrast(${n.contrast??100}%) saturate(${n.saturation??100}%) blur(${n.blur??0}px)`;
   ctx.drawImage(img,-n.w/2,-n.h/2,n.w,n.h);
  }catch{/* A UI avisa ao carregar um arquivo inválido; não bloqueie os demais. */}}
  if(n.kind==='rect'||n.kind==='circle'){
   ctx.beginPath();if(n.kind==='circle')ctx.ellipse(0,0,n.w/2,n.h/2,0,0,Math.PI*2);else ctx.roundRect(-n.w/2,-n.h/2,n.w,n.h,Math.min(n.radius||0,n.w/2,n.h/2));
   ctx.fillStyle=n.fill||'#ff831f';ctx.fill();if(n.strokeWidth&&n.stroke){ctx.lineWidth=n.strokeWidth;ctx.strokeStyle=n.stroke;ctx.stroke();}
  }
  if(n.kind==='text'){
   ctx.textBaseline='middle';ctx.textAlign=n.align||'center';ctx.fillStyle=n.fill||'#fff';
   ctx.font=`${n.italic?'italic ':''}${n.bold?'800':'500'} ${n.size||72}px "${n.font||'Arial'}", sans-serif`;
   const lines=(n.text||'').split('\n').slice(0,30);
   const lineHeight=(n.size||72)*1.18;
   ctx.shadowBlur=n.shadow||0;
   const x=n.align==='left'?-n.w/2:n.align==='right'?n.w/2:0;
   for(let i=0;i<lines.length;i++){const y=(i-(lines.length-1)/2)*lineHeight;ctx.fillText(lines[i],x,y,Math.max(5,n.w));}
   if(n.strokeWidth&&n.stroke){ctx.strokeStyle=n.stroke;ctx.lineWidth=n.strokeWidth;
    for(let i=0;i<lines.length;i++)ctx.strokeText(lines[i],x,(i-(lines.length-1)/2)*lineHeight,Math.max(5,n.w));}
  }
  ctx.restore();
 }
}
export async function asDataUrl(file:Blob,maxSide=4800):Promise<string>{
 if(file.size>24*1024*1024)throw new Error('Imagem acima de 24 MB. Reduza o arquivo.');
 const src=URL.createObjectURL(file);
 try{
  const image=await imageFor(src);
  const side=Math.max(image.naturalWidth,image.naturalHeight);
  if(!side)throw new Error('Imagem sem dimensões.');
  const ratio=Math.min(1,maxSide/side);
  const w=Math.max(1,Math.round(image.naturalWidth*ratio)),h=Math.max(1,Math.round(image.naturalHeight*ratio));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  canvas.getContext('2d')!.drawImage(image,0,0,w,h);
  return canvas.toDataURL('image/png');
 }finally{URL.revokeObjectURL(src);invalidateImage(src)}
}
export async function exportDesign(doc:DesignDocument,format:ExportFormat,scale:number):Promise<Blob>{
 const w=Math.round(doc.width*scale),h=Math.round(doc.height*scale);
 if(w>8192||h>8192||w*h>35_000_000)throw new Error('Resolução acima do limite seguro de exportação.');
 await document.fonts.ready;
 const base=document.createElement('canvas');await drawDesign(base,doc);
 const out=document.createElement('canvas');out.width=w;out.height=h;
 const ctx=out.getContext('2d');if(!ctx)throw new Error('Canvas indisponível');
 if(format==='jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);}
 ctx.imageSmoothingQuality='high';ctx.drawImage(base,0,0,w,h);
 return await new Promise<Blob>((resolve,reject)=>out.toBlob(b=>b?resolve(b):reject(new Error('Não foi possível gerar o arquivo.')),`image/${format}`,0.94));
}
export function saveBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60_000);}
