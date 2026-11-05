'use client';
import {rulerTicks,type RulerUnit} from '@/lib/creative/precision';

export function CanvasRulers({width,height,zoom,unit}:{width:number;height:number;zoom:number;unit:RulerUnit}){
 return <div className="cr-rulers" aria-label={`Réguas em ${unit==='mm'?'milímetros a 300 DPI':'pixels'}`}>
  <span className="cr-ruler-origin" aria-hidden="true">{unit}</span>
  <svg className="cr-ruler-horizontal" width={width*zoom} height={24} aria-hidden="true">
   {rulerTicks(width,zoom,unit).map((tick,i)=><g key={i}><line x1={tick.position} x2={tick.position} y1={tick.major?14:20} y2={24}/>{tick.major&&<text x={tick.position+3} y={10}>{tick.value}</text>}</g>)}
  </svg>
  <svg className="cr-ruler-vertical" width={24} height={height*zoom} aria-hidden="true">
   {rulerTicks(height,zoom,unit).map((tick,i)=><g key={i}><line x1={tick.major?14:20} x2={24} y1={tick.position} y2={tick.position}/>{tick.major&&<text transform={`translate(9 ${tick.position+3}) rotate(-90)`} textAnchor="end">{tick.value}</text>}</g>)}
  </svg>
 </div>;
}
