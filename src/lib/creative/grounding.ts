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
/** Optional pinning must capture the current foot, never guess a table from a template rectangle. */
export function groundingAtCurrentPosition(node:DesignNode,height:number,contact:Footprint,pin=false):Grounding{
 const settings={...(node.grounding||naturalGrounding),pin:undefined} as Grounding;
 if(pin){
  const contactX=(contact.left+contact.right)/2,contactY=contact.bottom;
  const dx=(contactX-.5)*node.w*(node.flipX?-1:1),dy=(contactY-.5+settings.offset)*node.h*(node.flipY?-1:1);
  const a=node.angle*Math.PI/180,skew=Math.tan(Math.max(-40,Math.min(40,node.skew||0))*Math.PI/180);
  const surface=(node.y+node.h/2+(dx+skew*dy)*Math.sin(a)+dy*Math.cos(a))/height;
  if(surface<0||surface>1)throw new Error('Posicione a base dentro da arte antes de prender à mesa.');
  settings.pin={surface,contactX,contactY};
 }
 return settings;
}
/** A narrow band follows the real alpha contour instead of inventing an oval base. */
export function contactContour(data:Uint8ClampedArray,width:number,height:number,base:Footprint):Uint8ClampedArray{
 const output=new Uint8ClampedArray(data.length),minimum=Math.max(0,Math.floor((base.bottom-.14)*height));
 for(let x=0;x<width;x++){
  let bottom=-1;
  for(let y=Math.min(height-1,Math.ceil(base.bottom*height));y>=minimum;y--)if(data[(y*width+x)*4+3]>=96){bottom=y;break;}
  if(bottom<0)continue;
  for(let y=Math.max(minimum,bottom-2);y<=bottom;y++){
   const i=(y*width+x)*4;output[i]=14;output[i+1]=10;output[i+2]=8;output[i+3]=data[i+3];
  }
 }
 return output;
}
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
type Silhouette={mask:HTMLCanvasElement;contact:HTMLCanvasElement;footprint:Footprint|null};
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
  const pixels=mc.getImageData(0,0,192,192),footprint=findContactFootprint(pixels.data,192,192);
  const contact=document.createElement('canvas');contact.width=192;contact.height=192;
  const cc=contact.getContext('2d');if(!cc)return;
  if(footprint){const band=cc.createImageData(192,192);band.data.set(contactContour(pixels.data,192,192,footprint));cc.putImageData(band,0,0);}
  mc.globalCompositeOperation='source-in';mc.fillStyle='#17120f';mc.fillRect(0,0,192,192);
  silhouette={mask,contact,footprint};cache.put(key,silhouette,2*192*192);
 }
 const base=silhouette.footprint;if(!base)return;
 const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
 const strength=clamp(settings.strength,0,1),softness=clamp(settings.softness,0,1);
 const baseY=(base.bottom-.5+clamp(settings.offset,-.2,.2))*node.h;
 const centerX=((base.left+base.right)/2-.5)*node.w;
 ctx.save();ctx.filter='none';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;ctx.shadowColor='transparent';
 // The foot follows the mug transform, while contact shadows stay flat on the table.
 const matrix=ctx.getTransform();
 ctx.setTransform(1,0,0,1,matrix.a*centerX+matrix.c*baseY+matrix.e,matrix.b*centerX+matrix.d*baseY+matrix.f);
 // A flattened silhouette falls away from the contact point across the table.
 ctx.save();ctx.globalAlpha*=strength*.28;
 ctx.filter=`blur(${node.w*(.008+softness*.025)}px)`;
 const length=clamp(settings.length,.05,.5);
 ctx.transform(1,0,-clamp(settings.direction,-1,1)*length*.85,length,0,0);
 ctx.rotate(node.angle*Math.PI/180);ctx.scale(node.flipX?-1:1,node.flipY?-1:1);
 if(node.skew)ctx.transform(1,0,Math.tan(clamp(node.skew,-40,40)*Math.PI/180),1,0,0);
 ctx.drawImage(silhouette.mask,-node.w/2-centerX,-node.h/2-baseY,node.w,node.h);ctx.restore();
 // Restore the mug's transform for a thin contour shadow, hidden beneath its actual pixels.
 ctx.setTransform(matrix);ctx.globalAlpha*=strength*.8;
 ctx.filter=`blur(${Math.max(.6,node.w*(.003+softness*.006))}px)`;
 ctx.drawImage(silhouette.contact,-node.w/2,-node.h/2+node.h*(.002+softness*.002),node.w,node.h);
 ctx.restore();
}
