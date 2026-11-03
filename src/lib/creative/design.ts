import {ensureDesignFonts} from './typefaces';
import {animateDesignNode,type MotionPoint} from './animation';
import {PixelBoundedCache,effectKey,clearAssetTokens} from './effect-cache';
/** Editor local: documento, desenho e exportação. Nada do usuário é enviado ao servidor. */
export type NodeKind='text'|'image'|'rect'|'circle';
export type DesignNode={id:string;kind:NodeKind;x:number;y:number;w:number;h:number;angle:number;opacity:number;
 role?:'template'|'background'|'mockup'|'content'|'foreground';layerName?:string;maskSrc?:string;locked?:boolean;visible?:boolean;aspectLock?:boolean;
 text?:string;src?:string;fill?:string;tint?:string;font?:string;size?:number;bold?:boolean;italic?:boolean;align?:CanvasTextAlign;
 shadow?:number;shadowColor?:string;shadowX?:number;shadowY?:number;blur?:number;brightness?:number;contrast?:number;saturation?:number;
 grayscale?:number;sepia?:number;hue?:number;radius?:number;stroke?:string;strokeWidth?:number;
 curve?:number;wave?:number;depth?:number;tracking?:number;lineSpacing?:number;skew?:number;
 flipX?:boolean;flipY?:boolean;crop?:{left:number;top:number;right:number;bottom:number};keyframes?:MotionPoint[];
};
export type DesignDocument={width:number;height:number;background:string;nodes:DesignNode[];video?:{src:string;name:string;start:number;end?:number;fit?:'cover'|'contain'};smartTemplate?:{slot:{x:number;y:number;w:number;h:number};maskSrc?:string}};
export type ExportFormat='png'|'jpeg'|'webp';
export const formats=[{label:'Caneca 21 × 9,5 cm · 300 DPI',w:2480,h:1122},{label:'Área visível 19 × 8,5 cm · 300 DPI',w:2244,h:1004},{label:'Divulgação Instagram 1080 × 1350',w:1080,h:1350},{label:'Post quadrado 1080 × 1080',w:1080,h:1080},{label:'Story / Reels 1080 × 1920',w:1080,h:1920},{label:'Horizontal HD',w:1920,h:1080}] as const;
export const uid=()=>crypto.randomUUID();
export const blankDocument=():DesignDocument=>({width:2480,height:1122,background:'#ffffff',nodes:[]});
const images=new Map<string,Promise<HTMLImageElement>>();
// Shared only between local renders; a 14-million-pixel budget is about 56 MB in RGBA.
const rasterEffectCache=new PixelBoundedCache<HTMLCanvasElement>();
export function imageFor(src:string){
 if(!images.has(src))images.set(src,new Promise((resolve,reject)=>{
  const img=new Image();img.decoding='async';img.crossOrigin='anonymous';img.onload=()=>resolve(img);img.onerror=()=>{images.delete(src);reject(new Error('Não foi possível carregar a imagem.'));};img.src=src;
 }));return images.get(src)!;
}
export function invalidateImage(src:string){images.delete(src)}
/** Free local image and mask buffers when a project is reset. Saved projects are untouched. */
export function clearDesignRenderCache(){images.clear();rasterEffectCache.clear();clearAssetTokens();}
const limit=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
function drawText(ctx:CanvasRenderingContext2D,n:DesignNode){
 const lines=(n.text||'').split('\n').slice(0,30),align=n.align||'center',tracking=n.tracking||0;
 const fontFamily=(n.font||'Arial').replace(/["\\]/g,'');
 const font=(sz:number)=>`${n.italic?'italic ':''}${n.bold?'800':'500'} ${sz}px "${fontFamily}", Arial, sans-serif`;
 // Ajusta o tamanho TIPOGRÁFICO (não comprime os glifos na horizontal).
 const requested=n.size||72;ctx.font=font(requested);
 const naturalWidth=Math.max(1,...lines.map(line=>ctx.measureText(line).width+Math.max(0,Array.from(line).length-1)*tracking));
 const size=requested*Math.min(1,n.w/naturalWidth),lineHeight=size*(n.lineSpacing||1.18);
 ctx.font=font(size);
 ctx.textBaseline='middle';ctx.fillStyle=n.fill||'#fff';ctx.lineJoin='round';
 const drawGlyph=(glyph:string,x:number,y:number,angle:number)=>{
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.textAlign='center';
  const depth=limit(n.depth||0,0,22);
  if(depth){ctx.save();ctx.shadowBlur=0;ctx.fillStyle='#17100c';for(let d=depth;d>0;d-=2)ctx.fillText(glyph,d*.65,d*.8);ctx.restore();}
  ctx.fillStyle=n.fill||'#fff';
  if((n.strokeWidth||0)>0&&n.stroke){ctx.strokeStyle=n.stroke;ctx.lineWidth=n.strokeWidth||1;ctx.strokeText(glyph,0,0);}
  ctx.fillText(glyph,0,0);ctx.restore();
 };
 for(let lineIndex=0;lineIndex<lines.length;lineIndex++){
  const line=lines[lineIndex],y=(lineIndex-(lines.length-1)/2)*lineHeight;
  const curve=n.curve||0,wave=n.wave||0;
  // Curvatura e ondulação são renderizadas glifo a glifo e também exportadas.
  if(!curve&&!wave&&!tracking){
   ctx.textAlign=align;const x=align==='left'?-n.w/2:align==='right'?n.w/2:0;
   const depth=limit(n.depth||0,0,22);
   if(depth){ctx.save();ctx.fillStyle='#17100c';ctx.shadowBlur=0;for(let d=depth;d>0;d-=2)ctx.fillText(line,x+d*.65,y+d*.8);ctx.restore();}
   if((n.strokeWidth||0)>0&&n.stroke){ctx.lineWidth=n.strokeWidth||1;ctx.strokeStyle=n.stroke;ctx.strokeText(line,x,y);}
   ctx.fillText(line,x,y);continue;
  }
  const letters=Array.from(line);if(!letters.length)continue;
  const widths=letters.map(ch=>ctx.measureText(ch).width+tracking);
  const naturalWidth=widths.reduce((a,b)=>a+b,0);const scale=Math.min(1,n.w/Math.max(1,naturalWidth));
  let left=-naturalWidth*scale/2;
  if(align==='left')left=-n.w/2;
  if(align==='right')left=n.w/2-naturalWidth*scale;
  let traveled=0;
  for(let i=0;i<letters.length;i++){
   const cw=widths[i]*scale,pos=left+traveled+cw/2;
   const t=letters.length>1?i/(letters.length-1):.5;
   const bend=curve*(1-Math.pow(2*t-1,2));
   const ripple=wave*Math.sin(t*Math.PI*4);
   const angle=curve?Math.atan2(-4*curve*(2*t-1),Math.max(1,naturalWidth)):0;
   drawGlyph(letters[i],pos,y-bend+ripple,angle);traveled+=cw;
  }
 }
}
/** Export preflight: never silently omit a customer image or a smart-template mask. */
export async function assertDesignAssetsReady(doc:DesignDocument):Promise<void>{
 for(const node of doc.nodes){
  if(node.visible===false)continue;
  const name=(node.layerName||node.text?.slice(0,40)||node.role||node.kind||'sem nome').slice(0,80);
  for(const [kind,src] of [['imagem',node.kind==='image'?node.src:undefined],['máscara',node.maskSrc]] as const){
   if(!src)continue;
   try{const image=await imageFor(src);if(!image.naturalWidth||!image.naturalHeight)throw new Error('dimensões inválidas');}
   catch{throw new Error(`A ${kind} da camada “${name}” não pôde ser carregada. Corrija ou remova essa camada antes de exportar.`);}
  }
 }
}
export async function drawDesign(canvas:HTMLCanvasElement,doc:DesignDocument,timeSeconds?:number,options?:{strict?:boolean}){
 const renderedNodes=(timeSeconds===undefined?doc.nodes:doc.nodes.map(n=>animateDesignNode(n,timeSeconds))).filter(n=>n.visible!==false);
 await ensureDesignFonts(renderedNodes.filter(x=>x.kind==='text').map(x=>x.font||'')).catch(()=>{});
 if(canvas.width!==doc.width)canvas.width=doc.width;if(canvas.height!==doc.height)canvas.height=doc.height;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas indisponível');
 ctx.clearRect(0,0,doc.width,doc.height);
 if(doc.background!=='transparent'){ctx.fillStyle=doc.background;ctx.fillRect(0,0,doc.width,doc.height);}
 await Promise.all(renderedNodes.filter(n=>n.kind==='image'&&n.src).map(n=>imageFor(n.src!).catch(()=>null)));
 for(const n of renderedNodes){
  ctx.save();ctx.globalAlpha=limit(n.opacity,0,1);
  ctx.translate(n.x+n.w/2,n.y+n.h/2);ctx.rotate(n.angle*Math.PI/180);
  // Espelhamento em torno do centro para textos, formas, SVG, fotos e demais elementos.
  // O estado fica no documento e é aplicado também na exportação.
  ctx.scale(n.flipX?-1:1,n.flipY?-1:1);
  if(n.skew)ctx.transform(1,0,Math.tan(limit(n.skew,-40,40)*Math.PI/180),1,0,0);
  ctx.shadowColor=n.shadowColor||'rgba(0,0,0,.74)';ctx.shadowBlur=n.shadow||0;
  ctx.shadowOffsetX=n.shadowX||0;ctx.shadowOffsetY=n.shadowY??(n.shadow||0)*.4;
  if(n.kind==='image'&&n.src){try{
   const img=await imageFor(n.src);
   const c=n.crop||{left:0,top:0,right:0,bottom:0};
   const l=limit(c.left,0,.95),r=limit(c.right,0,.95),t=limit(c.top,0,.95),b=limit(c.bottom,0,.95);
   let sx=img.naturalWidth*l,sy=img.naturalHeight*t;
   let sw=Math.max(1,img.naturalWidth*(1-Math.min(.99,l+r))),sh=Math.max(1,img.naturalHeight*(1-Math.min(.99,t+b)));
   // Sempre preencher sem achatar: um recorte assimétrico nunca distorce o objeto.
   const targetRatio=n.w/n.h,sourceRatio=sw/sh;
   if(sourceRatio>targetRatio){const fitW=sh*targetRatio;sx+=(sw-fitW)/2;sw=fitW;}
   else{const fitH=sw/targetRatio;sy+=(sh-fitH)/2;sh=fitH;}
   ctx.filter=`brightness(${n.brightness??100}%) contrast(${n.contrast??100}%) saturate(${n.saturation??100}%) blur(${n.blur||0}px) grayscale(${n.grayscale||0}%) sepia(${n.sepia||0}%) hue-rotate(${n.hue||0}deg)`;
   const tint=!!n.tint&&/^#[0-9a-fA-F]{6}$/.test(n.tint);
   if(tint||n.maskSrc){
    // Composição isolada: recoloração E máscara podem coexistir no mesmo elemento.
    // Nunca aplicamos o efeito aos demais objetos ou às camadas abaixo.
    const tw=Math.max(1,Math.min(4096,Math.ceil(n.w))),th=Math.max(1,Math.min(4096,Math.ceil(n.h)));
    // Masking an MP4 overlay previously allocated and recolored a new full-size
    // canvas every frame. Reuse the effect while source/crop/dimensions agree.
    const key=effectKey({src:n.src,maskSrc:n.maskSrc,tint:n.tint,w:tw,h:th,sx,sy,sw,sh});
    let layer=rasterEffectCache.get(key);
    if(!layer){
     layer=document.createElement('canvas');layer.width=tw;layer.height=th;
     const lc=layer.getContext('2d',{willReadFrequently:!!n.maskSrc});if(!lc)throw new Error('Canvas de efeito indisponível');
     lc.drawImage(img,sx,sy,sw,sh,0,0,tw,th);
     if(tint){lc.globalCompositeOperation='source-in';lc.fillStyle=n.tint!;lc.fillRect(0,0,tw,th);lc.globalCompositeOperation='source-over';}
     if(n.maskSrc){
      const m=await imageFor(n.maskSrc);
      const colors=lc.getImageData(0,0,tw,th);
      lc.clearRect(0,0,tw,th);lc.drawImage(m,0,0,tw,th);
      const mask=lc.getImageData(0,0,tw,th);
      for(let i=0;i<colors.data.length;i+=4){
       const amount=(mask.data[i]*.2126+mask.data[i+1]*.7152+mask.data[i+2]*.0722)/255;
       colors.data[i+3]=Math.round(colors.data[i+3]*amount*mask.data[i+3]/255);
      }
      lc.putImageData(colors,0,0);
     }
     rasterEffectCache.put(key,layer,tw*th);
    }
    ctx.drawImage(layer,-n.w/2,-n.h/2,n.w,n.h);
   }else ctx.drawImage(img,sx,sy,sw,sh,-n.w/2,-n.h/2,n.w,n.h);
  }catch(error){if(options?.strict)throw new Error(`Falha ao renderizar a camada “${n.layerName||n.role||n.kind}”: ${error instanceof Error?error.message:'imagem inválida'}`);}}
  if(n.kind==='rect'||n.kind==='circle'){
   ctx.beginPath();if(n.kind==='circle')ctx.ellipse(0,0,Math.max(1,n.w/2),Math.max(1,n.h/2),0,0,Math.PI*2);
   else ctx.roundRect(-n.w/2,-n.h/2,n.w,n.h,Math.min(n.radius||0,n.w/2,n.h/2));
   ctx.fillStyle=n.fill||'#ff831f';ctx.fill();if(n.strokeWidth&&n.stroke){ctx.lineWidth=n.strokeWidth;ctx.strokeStyle=n.stroke;ctx.stroke();}
  }
  if(n.kind==='text')drawText(ctx,n);
  ctx.restore();
 }
}
export async function asDataUrl(file:Blob,maxSide=4800):Promise<string>{
 if(file.size>24*1024*1024)throw new Error('Imagem acima de 24 MB. Reduza o arquivo.');
 const src=URL.createObjectURL(file);
 try{const image=await imageFor(src);const side=Math.max(image.naturalWidth,image.naturalHeight);
  if(!side)throw new Error('Imagem sem dimensões.');const ratio=Math.min(1,maxSide/side);
  const w=Math.max(1,Math.round(image.naturalWidth*ratio)),h=Math.max(1,Math.round(image.naturalHeight*ratio));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  canvas.getContext('2d')!.drawImage(image,0,0,w,h);return canvas.toDataURL('image/png');
 }finally{URL.revokeObjectURL(src);invalidateImage(src)}
}
export async function exportDesign(doc:DesignDocument,format:ExportFormat,scale:number):Promise<Blob>{
 const w=Math.round(doc.width*scale),h=Math.round(doc.height*scale);
 if(w>8192||h>8192||w*h>35_000_000)throw new Error('Resolução acima do limite seguro de exportação.');
 await assertDesignAssetsReady(doc);await document.fonts.ready;const base=document.createElement('canvas');await drawDesign(base,doc,undefined,{strict:true});
 const out=document.createElement('canvas');out.width=w;out.height=h;
 const ctx=out.getContext('2d');if(!ctx)throw new Error('Canvas indisponível');
 if(format==='jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);}
 ctx.imageSmoothingQuality='high';ctx.drawImage(base,0,0,w,h);
 const blob=await new Promise<Blob>((resolve,reject)=>out.toBlob(b=>b?resolve(b):reject(new Error('Não foi possível gerar o arquivo.')),`image/${format}`,0.94));
 // Inclui pHYs com resolução física de 300 DPI nas estampas de caneca (escala 100%).
 return format==='png'&&scale===1&&((doc.width===2480&&doc.height===1122)||(doc.width===2244&&doc.height===1004))?await withPngDpi(blob,300):blob;
}
export function saveBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60_000);}

/** Insere metadados PNG pHYs (pixels por metro) sem alterar os pixels ou transferir dados. */
async function withPngDpi(blob:Blob,dpi:number):Promise<Blob>{
 const bytes=new Uint8Array(await blob.arrayBuffer());
 if(bytes.length<33||bytes[0]!==137||bytes[1]!==80||bytes[2]!==78||bytes[3]!==71)return blob;
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);const meters=Math.round(dpi/0.0254);
 const chunk=new Uint8Array(21),cv=new DataView(chunk.buffer);
 cv.setUint32(0,9);chunk.set([112,72,89,115],4);cv.setUint32(8,meters);cv.setUint32(12,meters);chunk[16]=1;
 let crc=0xffffffff;for(let i=4;i<17;i++){crc^=chunk[i];for(let b=0;b<8;b++)crc=(crc>>>1)^(crc&1?0xedb88320:0);}
 cv.setUint32(17,(crc^0xffffffff)>>>0);
 // Localiza o fim do IHDR. O próprio browser gera PNGs válidos com IHDR inicial.
 if(view.getUint32(8)!==13||String.fromCharCode(...bytes.subarray(12,16))!=='IHDR')return blob;
 const end=8+12+view.getUint32(8);if(end>bytes.length)return blob;
 // Remova o pHYs nativo (quando presente) para manter um único valor coerente.
 if(end+21<=bytes.length&&view.getUint32(end)===9&&String.fromCharCode(...bytes.subarray(end+4,end+8))==='pHYs'){
  const clone=new Uint8Array(bytes);clone.set(chunk,end);return new Blob([clone],{type:'image/png'});
 }
 const merged=new Uint8Array(bytes.length+chunk.length);merged.set(bytes.subarray(0,end));merged.set(chunk,end);merged.set(bytes.subarray(end),end+chunk.length);
 return new Blob([merged],{type:'image/png'});
}
