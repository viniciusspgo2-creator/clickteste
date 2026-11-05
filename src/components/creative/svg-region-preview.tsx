'use client';
import {createElement,useId,useMemo,type ReactNode} from 'react';
import type {SvgPaint} from '@/lib/creative/editable-svg';

/** Only receives the rebuilt, sanitized source returned by inspectSvg.
 * React creates known SVG nodes; no innerHTML or imported event handlers.
 */
export function SvgRegionPreview({source,paints,selected,onSelect}:{source:string;paints:SvgPaint[];selected:string;onSelect:(key:string)=>void}){
 const prefix=useId().replace(/[^a-z0-9]/gi,'')+'-';
 const drawing=useMemo(()=>{
  const doc=new DOMParser().parseFromString(source,'image/svg+xml');
  const all=Array.from(doc.getElementsByTagName('*'));
  const indexes=new Map(all.map((element,index)=>[element,index]));
  const selectable=new Map<number,SvgPaint>();
  for(const paint of paints)if(paint.attribute!=='stop-color'&&(!selectable.has(paint.index)||paint.attribute==='fill'))selectable.set(paint.index,paint);
  const selectedPaint=paints.find(p=>p.key===selected);
  const box=(doc.documentElement.getAttribute('viewBox')||'0 0 800 800').split(/[\s,]+/).map(Number);
  const convert=(node:Element):ReactNode=>{
   const index=indexes.get(node)!,props:Record<string,unknown>={key:index};
   for(const attribute of Array.from(node.attributes)){
    const name=attribute.name==='xml:space'?'xmlSpace':attribute.name.startsWith('data-')||attribute.name.startsWith('aria-')?attribute.name:attribute.name.replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());
    let value=attribute.value;
    if(attribute.name==='id')value=prefix+value;
    value=value.replace(/url\(\s*['"]?#([\w:.-]+)['"]?\s*\)/g,(_,id)=>`url(#${prefix}${id})`);
    props[name]=value;
   }
   const paint=selectable.get(index);
   if(paint)props['data-svg-part']=paint.key;
   if(selectedPaint?.index===index&&selectedPaint.attribute!=='stop-color'){
    props.stroke='#ed2693';props.strokeOpacity=1;props.strokeWidth=Math.max(box[2],box[3])/80;
   }
   if(node===doc.documentElement){props.width='100%';props.height='100%';props.preserveAspectRatio='xMidYMid meet';}
   const children=Array.from(node.childNodes).flatMap((child):ReactNode[]=>child instanceof Element?[convert(child)]:child.nodeType===Node.TEXT_NODE&&['text','tspan','title','desc'].includes(node.localName)?[child.textContent]:[]);
   return createElement(node.localName,props,...children);
  };
  return convert(doc.documentElement);
 },[source,paints,selected,prefix]);
 return <div className="cr-svg-part-preview cr-svg-click-preview" role="group" aria-label="Prévia interativa: clique numa parte do desenho" onClick={event=>{
  const target=event.target instanceof Element?event.target.closest('[data-svg-part]'):null;
  const key=target?.getAttribute('data-svg-part');if(key)onSelect(key);
 }}>{drawing}</div>;
}
