/** Operações puras para o editor. Handles preservam a proporção de imagens por padrão. */
export type Corner='nw'|'ne'|'sw'|'se';
export type Bounds={x:number;y:number;w:number;h:number;angle:number};
export function resizeFromCorner(initial:Bounds,corner:Corner,dx:number,dy:number,keepRatio=true,min=24):Bounds{
 const a=initial.angle*Math.PI/180;
 const localX=dx*Math.cos(a)+dy*Math.sin(a);
 const localY=-dx*Math.sin(a)+dy*Math.cos(a);
 const sx=corner.endsWith('w')?-1:1;
 const sy=corner.startsWith('n')?-1:1;
 let w=Math.max(min,initial.w+sx*localX);
 let h=Math.max(min,initial.h+sy*localY);
 if(keepRatio){
  const factorX=w/initial.w,factorY=h/initial.h;
  const factor=Math.max(min/initial.w,min/initial.h,Math.abs(factorX-1)>=Math.abs(factorY-1)?factorX:factorY);
  w=initial.w*factor;h=initial.h*factor;
 }
 // O centro desloca-se metade da variação da aresta móvel, inclusive com rotação.
 const cxLocal=sx*(w-initial.w)/2;
 const cyLocal=sy*(h-initial.h)/2;
 const cx=cxLocal*Math.cos(a)-cyLocal*Math.sin(a);
 const cy=cxLocal*Math.sin(a)+cyLocal*Math.cos(a);
 const oldCenterX=initial.x+initial.w/2,oldCenterY=initial.y+initial.h/2;
 return {x:oldCenterX+cx-w/2,y:oldCenterY+cy-h/2,w,h,angle:initial.angle};
}
