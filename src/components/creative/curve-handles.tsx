'use client';
import type {PointerEvent} from 'react';
import type {DesignNode} from '@/lib/creative/design';
export function LegacyCurveHandles({node,start,move,end}:{node:DesignNode;start:(event:PointerEvent<HTMLButtonElement>,point:string)=>void;move:(event:PointerEvent<HTMLButtonElement>)=>void;end:()=>void}){
 const b=node.bezier;const handles=[['s',b?.sx??0,b?.sy??1],['c1',b?.c1x??.3,b?.c1y??0],['c2',b?.c2x??.7,b?.c2y??1],['e',b?.ex??1,b?.ey??0]] as const;
 return <>{handles.map(([key,x,y])=><button type="button" key={key} className="cr-bezier-handle" style={{left:`${x*100}%`,top:`${y*100}%`}} aria-label={`Mover ponto Bézier ${key}`} onPointerDown={e=>start(e,key)} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>{key}</button>)}</>;
}
