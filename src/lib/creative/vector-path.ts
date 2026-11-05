import type {DesignNode} from './design';
export type EditablePoint={x:number;y:number;inX?:number;inY?:number;outX?:number;outY?:number;smooth?:boolean};
export function editablePoints(n:DesignNode):EditablePoint[]{const b=n.bezier||{sx:0,sy:1,c1x:.3,c1y:0,c2x:.7,c2y:1,ex:1,ey:0};return n.pathPoints||[{x:b.sx,y:b.sy,outX:b.c1x,outY:b.c1y,smooth:true},{x:b.ex,y:b.ey,inX:b.c2x,inY:b.c2y,smooth:true}];}
export function drawEditablePath(ctx:CanvasRenderingContext2D,n:DesignNode){
 ctx.beginPath();
 const points=editablePoints(n),px=(v:number)=>(v-.5)*n.w,py=(v:number)=>(v-.5)*n.h;if(points.length<2)return;
 ctx.beginPath();ctx.moveTo(px(points[0].x),py(points[0].y));
 const segment=(a:EditablePoint,b:EditablePoint)=>{if(a.outX!==undefined||b.inX!==undefined)ctx.bezierCurveTo(px(a.outX??a.x),py(a.outY??a.y),px(b.inX??b.x),py(b.inY??b.y),px(b.x),py(b.y));else ctx.lineTo(px(b.x),py(b.y));};
 for(let i=1;i<points.length;i++)segment(points[i-1],points[i]);if(n.pathClosed){segment(points[points.length-1],points[0]);ctx.closePath();}
}
export function lineStyle(ctx:CanvasRenderingContext2D,n:DesignNode){ctx.lineCap=n.lineCap||'round';ctx.lineJoin=n.lineJoin||'round';const gap=n.dashSpacing??2;ctx.setLineDash(n.dashStyle==='dashed'?[Math.max(.5,n.strokeWidth||1)*3,Math.max(.5,n.strokeWidth||1)*gap]:n.dashStyle==='dotted'?[.1,Math.max(.5,n.strokeWidth||1)*gap]:[]);}
