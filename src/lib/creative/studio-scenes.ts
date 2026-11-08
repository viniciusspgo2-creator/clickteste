import catalog from './studio-scenes.json';
import {uid,type DesignDocument,type DesignNode} from './design';
import {detachAutomaticSmartMask} from './template-transition';

export const studioScenes=catalog;
export type StudioScene=typeof catalog[number];
export const studioSceneCategories=Array.from(new Set(catalog.map(scene=>scene.category)));
export function findStudioScene(id:string|null){return catalog.find(scene=>scene.id===id);}
export function filterStudioScenes(query:string,category:string){
 const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const terms=normalize(query).trim().split(/\s+/).filter(Boolean);
 return catalog.filter(scene=>(!category||scene.category===category)&&terms.every(term=>normalize(`${scene.name} ${scene.category}`).includes(term)));
}

/** The supplied images are flat backgrounds. Mugs, logos and text stay independent. */
export function composeStudioScene(current:DesignDocument,scene:StudioScene,src:string):DesignDocument{
 const {width,height}=scene;
 const slot={x:width*.12,y:height*.56,w:width*.76,h:height*.38};
 const keep=detachAutomaticSmartMask(current).filter(n=>!['background','template','foreground'].includes(n.role||''));
 const mugs=keep.filter(n=>n.role==='mockup');
 const bounds=mugs.map(n=>{const a=n.angle*Math.PI/180,w=Math.abs(n.w*Math.cos(a))+Math.abs(n.h*Math.sin(a)),h=Math.abs(n.w*Math.sin(a))+Math.abs(n.h*Math.cos(a));return {x:n.x+n.w/2-w/2,y:n.y+n.h/2-h/2,w,h};});
 const left=Math.min(...bounds.map(n=>n.x)),top=Math.min(...bounds.map(n=>n.y));
 const groupW=Math.max(...bounds.map(n=>n.x+n.w))-left,groupH=Math.max(...bounds.map(n=>n.y+n.h))-top;
 const mugScale=mugs.length?Math.min(slot.w/groupW,slot.h/groupH):1;
 const scaleNode=(n:DesignNode,f:number,x:number,y:number):DesignNode=>({...n,x,y,w:n.w*f,h:n.h*f,
  ...Object.fromEntries(['size','shadow','shadowX','shadowY','blur','strokeWidth','curve','wave','tracking','depth'].filter(key=>typeof n[key as keyof DesignNode]==='number').map(key=>[key,(n[key as keyof DesignNode] as number)*f]))});
 const factor=Math.min(width/current.width,height/current.height);
 const nodes=keep.map(n=>n.role==='mockup'?
  scaleNode(n,mugScale,slot.x+(slot.w-groupW*mugScale)/2+(n.x-left)*mugScale,slot.y+(slot.h-groupH*mugScale)/2+(n.y-top)*mugScale):
  scaleNode(n,factor,(width-current.width*factor)/2+n.x*factor,(height-current.height*factor)/2+n.y*factor));
 return {width,height,background:'#ffffff',smartTemplate:{slot},nodes:[
  {id:uid(),kind:'image',role:'background',layerName:scene.name,src,x:0,y:0,w:width,h:height,angle:0,opacity:1,locked:true,aspectLock:true},...nodes,
 ]};
}
