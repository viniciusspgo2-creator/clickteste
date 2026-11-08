import type {DesignDocument,DesignNode} from './design';
import {PixelBoundedCache} from './effect-cache';

/** Relative settings follow resizing, scene changes, copies and project exports. */
export type Grounding={strength:number;softness:number;direction:number;length:number;offset:number;pin?:{surface:number;contactX:number;contactY:number}};
export const naturalGrounding:Grounding={strength:.8,softness:.55,direction:.45,length:.22,offset:0};
export const groundingPresets={
 soft:{...naturalGrounding,strength:.5,softness:.85,length:.15},
 natural:naturalGrounding,
 strong:{...naturalGrounding,strength:1,softness:.35,length:.3},
} as const;
export function canGround(node:DesignNode){return node.kind==='image'&&!!node.src&&!['background','template','foreground'].includes(node.role||'');}
export function groundingTargets(nodes:DesignNode[],selected:string|null){
 const active=nodes.find(n=>n.id===selected);
 const candidates=active&&canGround(active)?[active]:nodes.filter(n=>n.role==='mockup'&&canGround(n));
 return candidates.filter(n=>!n.locked&&n.visible!==false);
}
/** Constrain the physical contact point, rather than the transparent PNG edge. */
export function pinGroundedNode(node:DesignNode,height:number):DesignNode{
 const pin=node.grounding?.pin;if(!pin||node.locked)return node;
 const dx=(pin.contactX-.5)*node.w*(node.flipX?-1:1);
 const dy=(pin.contactY-.5+(node.grounding?.offset||0))*node.h*(node.flipY?-1:1);
 const skew=Math.tan(Math.max(-40,Math.min(40,node.skew||0))*Math.PI/180);
 const a=node.angle*Math.PI/180;
 const y=pin.surface*height-node.h/2-(dx+skew*dy)*Math.sin(a)-dy*Math.cos(a);
 return Math.abs(y-node.y)<.0001?node:{...node,y};
}
export function pinGroundedDocument(doc:DesignDocument):DesignDocument{
 const nodes=doc.nodes.map(n=>pinGroundedNode(n,doc.height));
 return nodes.every((n,i)=>n===doc.nodes[i])?doc:{...doc,nodes};
}
type Footprint={left:number;right:number;bottom:number};
/** Ignore transparent PNG margins and faint capture shadows when locating the base. */
export function findContactFootprint(data:Uint8ClampedArray,width:number,height:number):Footprint|null{
 let bottom=-1;
 for(let y=height-1;y>=0;y--){
  let count=0;for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>=96)count++;
  if(count>=Math.max(2,width*.03)){bottom=y;break;}
 }
 if(bottom<0)return null;
 let left=width,right=-1;
 for(let y=Math.max(0,bottom-Math.max(1,Math.round(height*.035)));y<=bottom;y++)for(let x=0;x<width;x++){
  if(data[(y*width+x)*4+3]>=96){left=Math.min(left,x);right=Math.max(right,x);}
 }
 return {left:left/width,right:(right+1)/width,bottom:(bottom+1)/height};
}
type Silhouette={mask:HTMLCanvasElement;footprint:Footprint|null};
const cache=new PixelBoundedCache<Silhouette>(1_000_000,24);
export function clearGroundingCache(){cache.clear();}
/** Called in the same local transform as the image, before drawing the mug.
 * Both preview and export use this renderer, including crop, eraser and masks. */
export function drawGrounding(ctx:CanvasRenderingContext2D,node:DesignNode,source:CanvasImageSource,rect:{sx:number;sy:number;sw:number;sh:number},key:string){
 const settings=node.grounding;if(!settings||settings.strength<=0)return;
 let silhouette=cache.get(key);
 if(!silhouette){
  const mask=document.createElement('canvas');mask.width=192;mask.height=192;
  const mc=mask.getContext('2d',{willReadFrequently:true});if(!mc)return;
  mc.drawImage(source,rect.sx,rect.sy,rect.sw,rect.sh,0,0,192,192);
  const footprint=findContactFootprint(mc.getImageData(0,0,192,192).data,192,192);
  mc.globalCompositeOperation='source-in';mc.fillStyle='#17120f';mc.fillRect(0,0,192,192);
  silhouette={mask,footprint};cache.put(key,silhouette,192*192);
 }
 const base=silhouette.footprint;if(!base)return;
 const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
 const strength=clamp(settings.strength,0,1),softness=clamp(settings.softness,0,1);
 const baseY=(base.bottom-.5+clamp(settings.offset,-.2,.2))*node.h;
 const centerX=((base.left+base.right)/2-.5)*node.w,baseW=(base.right-base.left)*node.w;
 ctx.save();ctx.filter='none';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;ctx.shadowColor='transparent';
 // The foot follows the mug transform, while contact shadows stay flat on the table.
 const matrix=ctx.getTransform();
 ctx.setTransform(1,0,0,1,matrix.a*centerX+matrix.c*baseY+matrix.e,matrix.b*centerX+matrix.d*baseY+matrix.f);
 // A flattened silhouette falls away from the contact point across the table.
 ctx.save();ctx.globalAlpha*=strength*.28;
 ctx.filter=`blur(${node.w*(.008+softness*.025)}px)`;
 ctx.transform(1,0,-clamp(settings.direction,-1,1)*.65,clamp(settings.length,.05,.5),0,0);
 ctx.rotate(node.angle*Math.PI/180);ctx.scale(node.flipX?-1:1,node.flipY?-1:1);
 if(node.skew)ctx.transform(1,0,Math.tan(clamp(node.skew,-40,40)*Math.PI/180),1,0,0);
 ctx.drawImage(silhouette.mask,-node.w/2-centerX,-node.h/2-baseY,node.w,node.h);ctx.restore();
 // Two soft ellipses give a broad ambient shadow and a tight contact core.
 const ellipse=(rx:number,ry:number,opacity:number)=>{
  ctx.save();ctx.scale(Math.max(1,rx),Math.max(1,ry));
  const gradient=ctx.createRadialGradient(0,0,0,0,0,1);
  gradient.addColorStop(0,`rgba(14,10,8,${opacity*strength})`);gradient.addColorStop(.4,`rgba(14,10,8,${opacity*strength*.65})`);gradient.addColorStop(1,'rgba(14,10,8,0)');
  ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();
 };
 ellipse(baseW*.65,baseW*(.06+softness*.045),.32);
 ellipse(baseW*.51,baseW*(.018+softness*.012),.85);
 ctx.restore();
}
