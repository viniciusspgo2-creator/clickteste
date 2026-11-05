import {paintLayerEffect,type LayerEffect} from './layer-effects';
import {vectorShapePath} from './vector-shapes';
import {drawEditablePath,lineStyle,type EditablePoint} from './vector-path';
import {ensureDesignFonts,waitForFontLayout} from './typefaces';
import {animateDesignNode,type MotionPoint} from './animation';
import {PixelBoundedCache,effectKey,clearAssetTokens} from './effect-cache';
import {drawOutputWithMirror} from './export-transform';
import {loadImageWithTimeout} from './async-image-load';
import {assertExportBlobFormat, addPngDpiMetadata} from './image-export-integrity';
import type {DesignGuide} from './guides';
/** Editor local: documento, desenho e exportação. Nada do usuário é enviado ao servidor. */
export type NodeKind='text'|'image'|'rect'|'circle'|'bezier';
export type ColorGradient={kind:'linear'|'radial';from:string;to:string;angle:number};
export type BezierPoints={sx:number;sy:number;c1x:number;c1y:number;c2x:number;c2y:number;ex:number;ey:number};
export type EraserStroke={size:number;points:{x:number;y:number}[]};
export type DesignNode={id:string;kind:NodeKind;x:number;y:number;w:number;h:number;angle:number;opacity:number;
 effectKind?:LayerEffect;effectIntensity?:number;effectColor?:string;
 shapeId?:string;shapePoints?:number;pathPoints?:EditablePoint[];pathClosed?:boolean;lineCap?:CanvasLineCap;lineJoin?:CanvasLineJoin;dashStyle?:'solid'|'dashed'|'dotted';dashSpacing?:number;
 role?:'template'|'background'|'mockup'|'content'|'foreground';layerName?:string;maskSrc?:string;maskMode?:'luminance'|'alpha';maskInvert?:boolean;maskSpace?:'element'|'canvas';locked?:boolean;visible?:boolean;aspectLock?:boolean;
 text?:string;src?:string;fill?:string;tint?:string;gradient?:ColorGradient;bezier?:BezierPoints;eraserStrokes?:EraserStroke[];font?:string;size?:number;bold?:boolean;italic?:boolean;align?:CanvasTextAlign;
 shadow?:number;shadowColor?:string;shadowX?:number;shadowY?:number;blur?:number;brightness?:number;contrast?:number;saturation?:number;
 grayscale?:number;sepia?:number;hue?:number;radius?:number;stroke?:string;strokeWidth?:number;
 curve?:number;wave?:number;depth?:number;tracking?:number;lineSpacing?:number;skew?:number;
 flipX?:boolean;flipY?:boolean;crop?:{left:number;top:number;right:number;bottom:number};keyframes?:MotionPoint[];
};
export type DesignDocument={width:number;height:number;background:string;nodes:DesignNode[];guides?:DesignGuide[];video?:{src:string;name:string;start:number;end?:number;fit?:'cover'|'contain'};smartTemplate?:{slot:{x:number;y:number;w:number;h:number};maskSrc?:string;maskMode?:'luminance'|'alpha';maskInvert?:boolean}};
export type ExportFormat='png'|'jpeg'|'webp'|'pdf';
export const formats=[{label:'Caneca 21 × 9,5 cm · 300 DPI',w:2480,h:1122},{label:'Área visível 19 × 8,5 cm · 300 DPI',w:2244,h:1004},{label:'Divulgação Instagram 1080 × 1350',w:1080,h:1350},{label:'Post quadrado 1080 × 1080',w:1080,h:1080},{label:'Story / Reels 1080 × 1920',w:1080,h:1920},{label:'Horizontal HD',w:1920,h:1080}] as const;
export const uid=()=>crypto.randomUUID();
export const blankDocument=():DesignDocument=>({width:2480,height:1122,background:'#ffffff',nodes:[]});
const images=new Map<string,Promise<HTMLImageElement>>();
// Shared only between local renders; a 14-million-pixel budget is about 56 MB in RGBA.
const rasterEffectCache=new PixelBoundedCache<HTMLCanvasElement>();
export function imageFor(src:string){
 const cached=images.get(src);if(cached)return cached;
 const loading=loadImageWithTimeout(src);
 images.set(src,loading);
 // A failed request can be retried. If the cache was reset while it was
 // pending, never remove a newer successful request for the same URL.
 void loading.catch(()=>{if(images.get(src)===loading)images.delete(src);});
 return loading;
}
export function invalidateImage(src:string){images.delete(src)}
/** Free local image and mask buffers when a project is reset. Saved projects are untouched. */
export function clearDesignRenderCache(){images.clear();rasterEffectCache.clear();clearAssetTokens();}
const limit=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function nodeFill(ctx:CanvasRenderingContext2D,n:DesignNode):string|CanvasGradient{
 const g=n.gradient;if(!g)return n.fill||'#ff831f';
 const from=/^#[0-9a-f]{6}$/i.test(g.from)?g.from:'#ff8a30';
 const to=/^#[0-9a-f]{6}$/i.test(g.to)?g.to:'#ffffff';
 if(g.kind==='radial'){
  const r=Math.max(1,Math.hypot(n.w,n.h)/2);const gradient=ctx.createRadialGradient(0,0,0,0,0,r);
  gradient.addColorStop(0,from);gradient.addColorStop(1,to);return gradient;
 }
 const a=g.angle*Math.PI/180,dx=Math.cos(a)*n.w/2,dy=Math.sin(a)*n.h/2;
 const gradient=ctx.createLinearGradient(-dx,-dy,dx,dy);
 gradient.addColorStop(0,from);gradient.addColorStop(1,to);return gradient;
}
function drawText(ctx:CanvasRenderingContext2D,n:DesignNode){
 const lines=(n.text||'').split('\n').slice(0,30),align=n.align||'center',tracking=n.tracking||0;
 const fontFamily=(n.font||'Arial').replace(/["\\]/g,'');
 const font=(sz:number)=>`${n.italic?'italic ':''}${n.bold?'800':'500'} ${sz}px "${fontFamily}", Arial, sans-serif`;
 // Ajusta o tamanho TIPOGRÁFICO (não comprime os glifos na horizontal).
 const requested=n.size||72;ctx.font=font(requested);
 const naturalWidth=Math.max(1,...lines.map(line=>ctx.measureText(line).width+Math.max(0,Array.from(line).length-1)*tracking));
 const size=requested*Math.min(1,n.w/naturalWidth),lineHeight=size*(n.lineSpacing||1.18);
 ctx.font=font(size);
 ctx.textBaseline='middle';const textFill=nodeFill(ctx,n);ctx.fillStyle=textFill;ctx.lineJoin='round';
 const drawGlyph=(glyph:string,x:number,y:number,angle:number)=>{
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.textAlign='center';
  const depth=limit(n.depth||0,0,22);
  if(depth){ctx.save();ctx.shadowBlur=0;ctx.fillStyle='#17100c';for(let d=depth;d>0;d-=2)ctx.fillText(glyph,d*.65,d*.8);ctx.restore();}
  ctx.fillStyle=textFill;
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
 const fontLoad=ensureDesignFonts(renderedNodes.filter(x=>x.kind==='text').map(x=>x.font||''));
 if(options?.strict)await fontLoad;else await fontLoad.catch(()=>{});
 if(canvas.width!==doc.width)canvas.width=doc.width;if(canvas.height!==doc.height)canvas.height=doc.height;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas indisponível');
 ctx.clearRect(0,0,doc.width,doc.height);
 if(doc.background!=='transparent'){ctx.fillStyle=doc.background;ctx.fillRect(0,0,doc.width,doc.height);}
 await Promise.all(renderedNodes.filter(n=>n.kind==='image'&&n.src).map(n=>imageFor(n.src!).catch(()=>null)));
 for(const n of renderedNodes){
  if(n.effectKind){
   // Bound intermediate pixel buffers on very large alternate documents.
   const resolution=Math.min(1,Math.sqrt(8_000_000/(doc.width*doc.height)));
   const scaled={...n,x:n.x*resolution,y:n.y*resolution,w:n.w*resolution,h:n.h*resolution,size:n.size===undefined?undefined:n.size*resolution,strokeWidth:n.strokeWidth===undefined?undefined:n.strokeWidth*resolution,radius:n.radius===undefined?undefined:n.radius*resolution,curve:n.curve===undefined?undefined:n.curve*resolution,wave:n.wave===undefined?undefined:n.wave*resolution,tracking:n.tracking===undefined?undefined:n.tracking*resolution};
   const layer=document.createElement('canvas');
   await drawDesign(layer,{...doc,width:Math.max(1,Math.round(doc.width*resolution)),height:Math.max(1,Math.round(doc.height*resolution)),background:'transparent',nodes:[{...scaled,effectKind:undefined,opacity:1,shadow:0}]},undefined,options);
   const effect=document.createElement('canvas');effect.width=layer.width;effect.height=layer.height;
   paintLayerEffect(effect.getContext('2d')!,layer,scaled);ctx.save();ctx.globalAlpha=n.opacity;ctx.drawImage(effect,0,0,doc.width,doc.height);ctx.restore();layer.width=layer.height=effect.width=effect.height=1;continue;
  }

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
   const gradient=!!n.gradient;
   const erasing=!!n.eraserStrokes?.length;
   let shouldComposite=gradient||erasing;
   if(tint||n.maskSrc)shouldComposite=true;
   if(shouldComposite){
    // Composição isolada: recoloração E máscara podem coexistir no mesmo elemento.
    // Nunca aplicamos o efeito aos demais objetos ou às camadas abaixo.
    const tw=Math.max(1,Math.min(4096,Math.ceil(n.w))),th=Math.max(1,Math.min(4096,Math.ceil(n.h)));
    // Masking an MP4 overlay previously allocated and recolored a new full-size
    // canvas every frame. Reuse the effect while source/crop/dimensions agree.
    const key=effectKey({src:n.src,maskSrc:n.maskSrc,maskMode:n.maskMode,maskInvert:n.maskInvert,maskSpace:n.maskSpace,
     maskX:n.maskSpace==='canvas'?n.x/doc.width:undefined,maskY:n.maskSpace==='canvas'?n.y/doc.height:undefined,
     maskW:n.maskSpace==='canvas'?n.w/doc.width:undefined,maskH:n.maskSpace==='canvas'?n.h/doc.height:undefined,
     tint:n.tint,gradient:n.gradient?JSON.stringify(n.gradient):undefined,erase:n.eraserStrokes?JSON.stringify(n.eraserStrokes):undefined,w:tw,h:th,sx,sy,sw,sh});
    let layer=rasterEffectCache.get(key);
    if(!layer){
     layer=document.createElement('canvas');layer.width=tw;layer.height=th;
     const lc=layer.getContext('2d',{willReadFrequently:!!n.maskSrc});if(!lc)throw new Error('Canvas de efeito indisponível');
     lc.drawImage(img,sx,sy,sw,sh,0,0,tw,th);
     if(tint||gradient){
      lc.globalCompositeOperation='source-in';
      if(gradient){lc.save();lc.translate(tw/2,th/2);lc.scale(tw/Math.max(n.w,1),th/Math.max(n.h,1));lc.fillStyle=nodeFill(lc,n);lc.fillRect(-n.w/2,-n.h/2,n.w,n.h);lc.restore();}
      else{lc.fillStyle=n.tint!;lc.fillRect(0,0,tw,th);}
      lc.globalCompositeOperation='source-over';
     }
     if(n.maskSrc){
      const m=await imageFor(n.maskSrc);
      const colors=lc.getImageData(0,0,tw,th);
      lc.clearRect(0,0,tw,th);
      if(n.maskSpace==='canvas'){
       // Smart-template masks are authored over the whole scene (e.g. hands in
       // front of the mug), not over the bounds of the mug image. Align them
       // in scene coordinates rather than stretching the whole mask over it.
       const ratioX=tw/Math.max(1,n.w),ratioY=th/Math.max(1,n.h);
       lc.drawImage(m,-n.x*ratioX,-n.y*ratioY,doc.width*ratioX,doc.height*ratioY);
      }else lc.drawImage(m,0,0,tw,th);
      const mask=lc.getImageData(0,0,tw,th);
      for(let i=0;i<colors.data.length;i+=4){
       // PNG transparente: o alfa define a máscara, independentemente da cor do pixel.
       // PNG preto e branco: a luminância define a máscara, modulada pelo alfa.
       const amount=n.maskMode==='alpha' ? 1 :
        (mask.data[i]*.2126+mask.data[i+1]*.7152+mask.data[i+2]*.0722)/255;
       const visibility=amount*mask.data[i+3]/255;
       colors.data[i+3]=Math.round(colors.data[i+3]*(n.maskInvert?1-visibility:visibility));
      }
      lc.putImageData(colors,0,0);
     }
     if(erasing){
      lc.save();lc.globalCompositeOperation='destination-out';lc.lineCap='round';lc.lineJoin='round';
      for(const stroke of n.eraserStrokes||[]){if(!stroke.points.length)continue;
       const scaleX=tw/Math.max(n.w,1),scaleY=th/Math.max(n.h,1);
       lc.beginPath();lc.lineWidth=Math.max(2,stroke.size*scaleX);lc.moveTo(stroke.points[0].x*tw,stroke.points[0].y*th);
       if(stroke.points.length===1)lc.lineTo(stroke.points[0].x*tw+.01,stroke.points[0].y*th+.01);
       for(const pt of stroke.points.slice(1))lc.lineTo(pt.x*tw,pt.y*th);
       lc.stroke();
      }
      lc.restore();
     }
     rasterEffectCache.put(key,layer,tw*th);
    }
    ctx.drawImage(layer,-n.w/2,-n.h/2,n.w,n.h);
   }else ctx.drawImage(img,sx,sy,sw,sh,-n.w/2,-n.h/2,n.w,n.h);
  }catch(error){if(options?.strict)throw new Error(`Falha ao renderizar a camada “${n.layerName||n.role||n.kind}”: ${error instanceof Error?error.message:'imagem inválida'}`);}}
  if(n.shapeId){
   const path=new Path2D();path.addPath(new Path2D(vectorShapePath(n.shapeId,n.shapePoints)),new DOMMatrix([n.w/1000,0,0,n.h/1000,-n.w/2,-n.h/2]));
   lineStyle(ctx,n);ctx.fillStyle=nodeFill(ctx,n);ctx.fill(path,'evenodd');if(n.strokeWidth&&n.stroke){ctx.lineWidth=n.strokeWidth;ctx.strokeStyle=n.stroke;ctx.stroke(path);}
  }
  else if(n.kind==='rect'||n.kind==='circle'){
   ctx.beginPath();if(n.kind==='circle')ctx.ellipse(0,0,Math.max(1,n.w/2),Math.max(1,n.h/2),0,0,Math.PI*2);
   else ctx.roundRect(-n.w/2,-n.h/2,n.w,n.h,Math.min(n.radius||0,n.w/2,n.h/2));
   ctx.fillStyle=nodeFill(ctx,n);ctx.fill();if(n.strokeWidth&&n.stroke){ctx.lineWidth=n.strokeWidth;ctx.strokeStyle=n.stroke;ctx.stroke();}
  }
  if(n.kind==='bezier'){
   drawEditablePath(ctx,n);lineStyle(ctx,n);
   if(n.pathClosed){ctx.fillStyle=nodeFill(ctx,n);ctx.fill();}
   ctx.lineWidth=Math.max(.5,n.strokeWidth===0&&!n.pathPoints?12:n.strokeWidth??12);ctx.strokeStyle=n.gradient?nodeFill(ctx,n):n.stroke||n.fill||'#ff8a30';ctx.stroke();
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
export async function exportDesign(doc:DesignDocument,format:ExportFormat,scale:number,mirrorHorizontal=false):Promise<Blob>{
 const w=Math.round(doc.width*scale),h=Math.round(doc.height*scale);
 if(w>8192||h>8192||w*h>35_000_000)throw new Error('Resolução acima do limite seguro de exportação.');
 await assertDesignAssetsReady(doc);await waitForFontLayout();const base=document.createElement('canvas');await drawDesign(base,doc,undefined,{strict:true});
 const out=document.createElement('canvas');out.width=w;out.height=h;
 const ctx=out.getContext('2d');if(!ctx)throw new Error('Canvas indisponível');
 if(format==='jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);}
 drawOutputWithMirror(ctx,base,w,h,mirrorHorizontal);
 const blob=await new Promise<Blob>((resolve,reject)=>out.toBlob(b=>b?resolve(b):reject(new Error('Não foi possível gerar o arquivo.')),`image/${format==='pdf'?'png':format}`,0.94));
 // Alguns navegadores devolvem PNG mesmo quando WebP/JPEG foi solicitado.
 // Verifique os bytes reais antes de gravar com a extensão escolhida.
 await assertExportBlobFormat(blob,format==='pdf'?'png':format);
 if(format==='pdf'){const {PDFDocument}=await import('pdf-lib');const pdf=await PDFDocument.create();const image=await pdf.embedPng(await blob.arrayBuffer());const page=pdf.addPage([doc.width*72/300,doc.height*72/300]);page.drawImage(image,{x:0,y:0,width:page.getWidth(),height:page.getHeight()});pdf.setTitle('Studio Click · arte para impressão');pdf.setSubject('Composição raster em tamanho físico a 300 DPI na escala 100%');const bytes=await pdf.save();return new Blob([new Uint8Array(bytes).buffer],{type:'application/pdf'});}
 // Inclui pHYs com resolução física de 300 DPI nas estampas de caneca (escala 100%).
 return format==='png'&&scale===1&&((doc.width===2480&&doc.height===1122)||(doc.width===2244&&doc.height===1004))?await addPngDpiMetadata(blob,300):blob;
}
export function saveBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60_000);}

