export type DesignGuide={id:string;axis:'x'|'y';position:number;locked?:boolean};
export const MAX_GUIDES=100;
/** Coordinates are stored in document pixels, independent of zoom and scrolling. */
export function guidePosition(axis:'x'|'y',clientX:number,clientY:number,rect:{left:number;top:number;width:number;height:number},width:number,height:number){
 const value=axis==='x'?(clientX-rect.left)*width/rect.width:(clientY-rect.top)*height/rect.height;
 return Math.round(value*1000)/1000;
}
export function guideInPage(guide:DesignGuide,width:number,height:number){return Number.isFinite(guide.position)&&guide.position>=0&&guide.position<=(guide.axis==='x'?width:height);}
export function snapGuide(position:number,axis:'x'|'y',width:number,height:number,zoom:number){
 const size=axis==='x'?width:height,center=size/2;
 return Math.abs(position-center)<=6/Math.max(.08,zoom)?center:position;
}
