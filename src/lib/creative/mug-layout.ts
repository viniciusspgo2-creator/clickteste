import type {DesignDocument,DesignNode} from './design';
import {visualBounds} from './precision';
export function isMugDocument(doc:Pick<DesignDocument,'width'|'height'>){return doc.width===2480&&doc.height===1122||doc.width===2244&&doc.height===1004;}
export function centerOnMugFace(node:DesignNode,doc:Pick<DesignDocument,'width'|'height'>,face:'left'|'right'){
 return {x:doc.width*(face==='left'?.25:.75)-node.w/2,y:(doc.height-node.h)/2};
}
/** Same orientation and scale; mirroring here would invert names and phrases. */
export function oppositeMugFace(node:DesignNode,doc:Pick<DesignDocument,'width'|'height'>):{x:number;y:number}{
 const half=doc.width/2,bounds=visualBounds(node);
 if(bounds.w>half-20)throw Error('O elemento é largo demais para caber nas duas faces. Reduza a largura antes de duplicar.');
 if(bounds.x<0||bounds.y<0||bounds.x+bounds.w>doc.width||bounds.y+bounds.h>doc.height)throw Error('Posicione o elemento dentro da página antes de duplicar.');
 const offset=node.x+node.w/2<half?half:-half;
 const x=node.x+offset;
 const moved=visualBounds({...node,x});
 if(moved.x<0||moved.x+moved.w>doc.width||moved.y<0||moved.y+moved.h>doc.height)throw Error('Posicione o elemento dentro de uma face antes de criar a cópia no outro lado.');
 return {x,y:node.y};
}
export function resizeMeasuredNode(node:DesignNode,axis:'w'|'h',value:number):Partial<DesignNode>{
 if(!Number.isFinite(value)||value<=0)throw Error('Informe uma medida maior que zero.');
 const proportional=node.kind==='text'||node.kind==='image'||node.aspectLock!==false;
 if(!proportional)return {[axis]:Math.max(10,Math.min(8192,value))};
 const factor=Math.max(10/Math.min(node.w,node.h),Math.min(value/node[axis],8192/Math.max(node.w,node.h)));
 const patch:Partial<DesignNode>={w:node.w*factor,h:node.h*factor};
 if(node.kind==='text')for(const key of ['size','curve','wave','tracking','strokeWidth','depth'] as const){
  if(node[key]!==undefined)patch[key]=node[key]!*factor;
 }
 return patch;
}
