'use client';
import {useEffect,useRef,useState,type PointerEvent as ReactPointerEvent,type RefObject} from 'react';
import {rulerTicks,PRINT_PX_PER_MM,type RulerUnit} from '@/lib/creative/precision';
import {guideInPage,guidePosition,snapGuide,type DesignGuide} from '@/lib/creative/guides';
import type {DesignDocument} from '@/lib/creative/design';

type Props={document:DesignDocument;zoom:number;unit:RulerUnit;showRulers:boolean;showGuides:boolean;selected:string|null;canvas:RefObject<HTMLCanvasElement|null>;onSelect:(id:string)=>void;onEdit:()=>void;onCommit:(id:string,guide:DesignGuide|null,before:DesignDocument)=>void;onInteraction:(active:boolean)=>void};
export function CanvasRulers({document:doc,zoom,unit,showRulers,showGuides,selected,canvas,onSelect,onEdit,onCommit,onInteraction}:Props){
 const {width,height}=doc;
 const drag=useRef<{guide:DesignGuide;before:DesignDocument;existing:boolean;offset:number;moved:boolean}|null>(null);
 const [draft,setDraft]=useState<DesignGuide|null>(null);
 const cancel=()=>{drag.current=null;setDraft(null);onInteraction(false);};
 useEffect(()=>{
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&drag.current){event.preventDefault();event.stopImmediatePropagation();drag.current=null;setDraft(null);onInteraction(false);}};
  const blur=()=>{drag.current=null;setDraft(null);onInteraction(false);};
  window.addEventListener('keydown',escape,true);
  window.addEventListener('blur',blur);
  return()=>{window.removeEventListener('keydown',escape,true);window.removeEventListener('blur',blur);onInteraction(false);};
 },[onInteraction]);
 const position=(event:ReactPointerEvent<Element>,axis:'x'|'y')=>{
  const rect=canvas.current?.getBoundingClientRect();if(!rect)return 0;
  const value=guidePosition(axis,event.clientX,event.clientY,rect,width,height);
  return value;
 };
 const begin=(event:ReactPointerEvent<Element>,axis:'x'|'y',guide?:DesignGuide)=>{
  if(event.button!==0||guide?.locked||!guide&&(doc.guides?.length||0)>=100)return;
  event.preventDefault();event.stopPropagation();
  const next=guide||{id:crypto.randomUUID(),axis,position:position(event,axis)};
  drag.current={guide:next,before:doc,existing:!!guide,offset:guide?guide.position-position(event,axis):0,moved:false};setDraft(next);onSelect(next.id);onInteraction(true);event.currentTarget.setPointerCapture(event.pointerId);
 };
 const move=(event:ReactPointerEvent<Element>)=>{const current=drag.current;if(!current)return;event.preventDefault();const raw=position(event,current.guide.axis)+current.offset;const guide={...current.guide,position:event.altKey?raw:snapGuide(raw,current.guide.axis,width,height,zoom)};drag.current={...current,guide,moved:true};setDraft(guide);};
 const finish=(event:ReactPointerEvent<Element>)=>{
  const current=drag.current;if(!current)return;
  const raw=position(event,current.guide.axis)+current.offset;
  const guide=current.existing&&!current.moved?current.guide:{...current.guide,position:event.altKey?raw:snapGuide(raw,current.guide.axis,width,height,zoom)};
  drag.current=null;setDraft(null);onInteraction(false);
  const inside=guideInPage(guide,width,height);
  if(inside||current.existing)onCommit(guide.id,inside?guide:null,current.before);
 };
 const interaction={onPointerMove:move,onPointerUp:finish,onPointerCancel:cancel,onLostPointerCapture:cancel};
 const all=(doc.guides||[]).map(guide=>draft?.id===guide.id?draft:guide);
 if(draft&&!all.some(g=>g.id===draft.id))all.push(draft);
 // Keep the captured handle mounted while it is outside the page; removing it
 // early would cancel pointer capture before pointerup can delete the guide.
 const displayed=all.filter(guide=>guide.id===draft?.id||guideInPage(guide,width,height));
 const label=(guide:DesignGuide)=>`${guide.axis==='x'?'Vertical':'Horizontal'} · ${(guide.position/(unit==='mm'?PRINT_PX_PER_MM:1)).toFixed(unit==='mm'?2:1)} ${unit}`;
 const addCentered=(axis:'x'|'y')=>{if((doc.guides?.length||0)>=100)return;const guide={id:crypto.randomUUID(),axis,position:(axis==='x'?width:height)/2};onSelect(guide.id);onCommit(guide.id,guide,doc);};
 return <>
  {showRulers&&<div className="cr-rulers" aria-label={`Réguas em ${unit==='mm'?'milímetros a 300 DPI':'pixels'}`}>
   <span className="cr-ruler-origin" aria-hidden="true">{unit}</span>
   <svg role="button" tabIndex={0} aria-label="Puxar guia horizontal da régua superior" className="cr-ruler-horizontal" width={width*zoom} height={24} onPointerDown={e=>begin(e,'y')} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();addCentered('y');}}} {...interaction}>
    <title>Arraste para baixo para criar uma guia horizontal</title>{rulerTicks(width,zoom,unit).map((tick,i)=><g key={i}><line x1={tick.position} x2={tick.position} y1={tick.major?14:20} y2={24}/>{tick.major&&<text x={tick.position+3} y={10}>{tick.value}</text>}</g>)}
   </svg>
   <svg role="button" tabIndex={0} aria-label="Puxar guia vertical da régua lateral" className="cr-ruler-vertical" width={24} height={height*zoom} onPointerDown={e=>begin(e,'x')} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();addCentered('x');}}} {...interaction}>
    <title>Arraste para a direita para criar uma guia vertical</title>{rulerTicks(height,zoom,unit).map((tick,i)=><g key={i}><line x1={tick.major?14:20} x2={24} y1={tick.position} y2={tick.position}/>{tick.major&&<text transform={`translate(9 ${tick.position+3}) rotate(-90)`} textAnchor="end">{tick.value}</text>}</g>)}
   </svg>
  </div>}
  {showGuides&&<div className="cr-manual-guides" aria-label="Guias livres da arte">{displayed.map(guide=><button type="button" key={guide.id} data-guide-id={guide.id} data-guide-axis={guide.axis} data-guide-position={guide.position} className={`cr-manual-guide cr-manual-guide-${guide.axis} ${selected===guide.id?'selected':''} ${guide.locked?'locked':''}`} style={guide.axis==='x'?{left:guide.position*zoom}:{top:guide.position*zoom}} aria-label={`Guia ${label(guide)}${guide.locked?' · bloqueada':''}`} aria-pressed={selected===guide.id} title={`${label(guide)} · ${guide.locked?'Desbloqueie no painel de guias':'Arraste para mover; solte fora da arte para remover; clique duplo para editar'}`} onFocus={()=>onSelect(guide.id)} onPointerDown={e=>begin(e,guide.axis,guide)} onDoubleClick={onEdit} {...interaction}><span className="cr-guide-coordinate">{label(guide)}{guide.locked?' · 🔒':''}</span></button>)}</div>}
  {draft&&<div className="cr-guide-drag-value" role="status">{label(draft)} · {guideInPage(draft,width,height)?'Solte para posicionar':'Solte fora para descartar'}</div>}
 </>;
}
