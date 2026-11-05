import type {DesignDocument, DesignNode} from './design';

export type Alignment='left'|'center'|'right'|'top'|'middle'|'bottom';
export type RulerUnit='mm'|'px';
export const PRINT_PX_PER_MM=300/25.4;

/** Visual bounds of rotated objects, in document pixels (not screen pixels). */
export function visualBounds(node:Pick<DesignNode,'x'|'y'|'w'|'h'|'angle'>){
 const a=node.angle*Math.PI/180;
 const w=Math.abs(node.w*Math.cos(a))+Math.abs(node.h*Math.sin(a));
 const h=Math.abs(node.w*Math.sin(a))+Math.abs(node.h*Math.cos(a));
 return {x:node.x+(node.w-w)/2,y:node.y+(node.h-h)/2,w,h};
}
export function alignToPage(node:DesignNode,doc:Pick<DesignDocument,'width'|'height'>,alignment:Alignment){
 const b=visualBounds(node);
 if(alignment==='left')return {x:node.x-b.x};
 if(alignment==='right')return {x:node.x+doc.width-b.x-b.w};
 if(alignment==='center')return {x:(doc.width-node.w)/2};
 if(alignment==='top')return {y:node.y-b.y};
 if(alignment==='bottom')return {y:node.y+doc.height-b.y-b.h};
 return {y:(doc.height-node.h)/2};
}
export function nudgeDelta(key:string,shift=false,alt=false){
 const amount=alt?.1:shift?10:1;
 switch(key){
  case 'ArrowLeft':return {x:-amount,y:0};
  case 'ArrowRight':return {x:amount,y:0};
  case 'ArrowUp':return {x:0,y:-amount};
  case 'ArrowDown':return {x:0,y:amount};
  default:return null;
 }
}
/** Nearest edge/center match; tolerance stays constant as the canvas zooms. */
export function snapPosition(node:DesignNode,doc:DesignDocument,zoom:number){
 const b=visualBounds(node),threshold=6/Math.max(.08,zoom);
 const xs=[0,doc.width/2,doc.width],ys=[0,doc.height/2,doc.height];
 for(const other of doc.nodes){
  if(other.id===node.id||other.visible===false||other.role==='background'||other.role==='foreground'||other.role==='template')continue;
  const bounds=visualBounds(other);
  xs.push(bounds.x,bounds.x+bounds.w/2,bounds.x+bounds.w);
  ys.push(bounds.y,bounds.y+bounds.h/2,bounds.y+bounds.h);
 }
 const nearest=(values:number[],anchors:number[])=>{
  let best:{offset:number;guide:number}|undefined;
  for(const guide of values)for(const anchor of anchors){
   const offset=guide-anchor;
   if(Math.abs(offset)<=threshold&&(!best||Math.abs(offset)<Math.abs(best.offset)))best={offset,guide};
  }
  return best;
 };
 const x=nearest(xs,[b.x,b.x+b.w/2,b.x+b.w]),y=nearest(ys,[b.y,b.y+b.h/2,b.y+b.h]);
 return {x:node.x+(x?.offset||0),y:node.y+(y?.offset||0),guideX:x?.guide,guideY:y?.guide};
}
/** Adaptive major ticks avoid overlapping labels at every zoom level. */
export function rulerTicks(length:number,zoom:number,unit:RulerUnit){
 const factor=unit==='mm'?PRINT_PX_PER_MM:1;
 const desired=64/(Math.max(.01,zoom)*factor);
 const magnitude=10**Math.floor(Math.log10(desired));
 const major=([1,2,5,10].find(n=>n*magnitude>=desired)||10)*magnitude;
 const step=major/5,count=Math.min(1000,Math.floor(length/(factor*step)));
 return Array.from({length:count+1},(_,i)=>({position:i*step*factor*zoom,value:Number((i*step).toFixed(3)),major:i%5===0}));
}
