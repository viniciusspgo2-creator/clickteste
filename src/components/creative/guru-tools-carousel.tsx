'use client';

import {useEffect, useRef, useState} from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {guruBrands} from '@/lib/editor-resources';

export function BrandIcon({domain, size=27}: {domain:string; name:string; size?:number}) {
  // Google's favicon service returns the service's actual public favicon, not an AI approximation.
  return <span className="ew-brand-icon" aria-hidden="true">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`} alt="" width={size} height={size} loading="lazy" referrerPolicy="no-referrer"/>
  </span>;
}

export function GuruToolsCarousel({compact=false}: {compact?:boolean}) {
  const scroller=useRef<HTMLDivElement>(null);
  const [paused,setPaused]=useState(false);
  const [motion,setMotion]=useState(true);
  useEffect(()=>{
    const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setMotion(!mq.matches);
    update();mq.addEventListener('change',update);
    return()=>mq.removeEventListener('change',update);
  },[]);
  const shift=(direction:number)=>{
    const node=scroller.current;
    if(!node)return;
    const amount=compact?160:196;
    if(direction>0&&node.scrollLeft+node.clientWidth>=node.scrollWidth-8){node.scrollTo({left:0,behavior:'smooth'});return;}
    if(direction<0&&node.scrollLeft<=8){node.scrollTo({left:node.scrollWidth,behavior:'smooth'});return;}
    node.scrollBy({left:amount*direction,behavior:'smooth'});
  };
  useEffect(()=>{
    if(paused||!motion)return;
    const id=window.setInterval(()=>{
      if(document.hidden)return;
      const el=scroller.current;
      if(!el)return;
      if(el.scrollLeft+el.clientWidth>=el.scrollWidth-5)el.scrollTo({left:0,behavior:'smooth'});
      else el.scrollBy({left:compact?160:196,behavior:'smooth'});
    },3600);
    return()=>window.clearInterval(id);
  },[paused,motion,compact]);
  return <div className={`ew-guru-carousel${compact?' ew-guru-carousel--compact':''}`} onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setPaused(false);}}>
    <button type="button" className="ew-carousel-arrow" onClick={()=>shift(-1)} aria-label="Ver ferramentas anteriores"><ChevronLeft size={21}/></button>
    <div className="ew-carousel-window" ref={scroller} aria-label="Exemplos de ferramentas que podem integrar o catálogo da Ferramentas Guru">
      {guruBrands.map(tool=><div className="ew-tool-logo" key={tool.name} title={tool.name}><BrandIcon name={tool.name} domain={tool.domain} size={31}/><span>{tool.name}</span></div>)}
    </div>
    <button type="button" className="ew-carousel-arrow" onClick={()=>shift(1)} aria-label="Ver próximas ferramentas"><ChevronRight size={21}/></button>
  </div>;
}
