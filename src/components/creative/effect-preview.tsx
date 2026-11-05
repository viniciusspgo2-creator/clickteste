'use client';
import {useEffect,useRef,useState} from 'react';
import {drawDesign} from '@/lib/creative/design';
import type {LayerEffect} from '@/lib/creative/layer-effects';
const previews=new Map<LayerEffect,string>();
/** Preview and exported artwork share the same renderer and effect implementation. */
export function EffectPreview({effect}:{effect:LayerEffect}){
 const host=useRef<HTMLSpanElement>(null),[src,setSrc]=useState('');
 useEffect(()=>{let live=true;const el=host.current;if(!el)return;const observer=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))return;observer.disconnect();const cached=previews.get(effect);if(cached){setSrc(cached);return;}const canvas=document.createElement('canvas');void drawDesign(canvas,{width:160,height:100,background:'#181820',nodes:[{id:'preview',kind:'text',x:30,y:20,w:100,h:55,angle:0,opacity:1,text:'Aa',font:'Arial',size:44,fill:'#ff8a30',effectKind:effect,effectIntensity:65,effectColor:'#ff8a30'}]},undefined,{strict:true}).then(()=>{const url=canvas.toDataURL('image/png');previews.set(effect,url);if(live)setSrc(url);canvas.width=canvas.height=1;}).catch(()=>{});},{rootMargin:'60px'});observer.observe(el);return()=>{live=false;observer.disconnect()};},[effect]);
 return <span ref={host} className="cr-effect-preview">{src?<img src={src} alt=""/>:<span aria-label="Carregando prévia do efeito">Aa</span>}</span>;
}
