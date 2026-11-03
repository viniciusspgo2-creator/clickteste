"use client";
import {useEffect,useState} from 'react';
import {X} from 'lucide-react';
import {useMockupStore} from '../state/store';
import {announcementInput,dismissedNotice,noticeDismissalKey,type Announcement} from '@/lib/announcements/input';
export function StudioAnnouncements({suspended=false}:{suspended?:boolean}) {
 const blocked=useMockupStore(s=>s.exportOpen||s.projectsOpen||s.tool!=='select');
 const [items,setItems]=useState<Announcement[]>([]),[closed,setClosed]=useState<string[]>([]),[quiet,setQuiet]=useState(false);
 useEffect(()=>{
  let active=true,loading=false,quietTimer:ReturnType<typeof setTimeout>;
  const controller=new AbortController();
  const interaction=(event?:Event)=>{if(event?.target instanceof Element && event.target.closest('[data-studio-notice]'))return;setQuiet(false);clearTimeout(quietTimer);quietTimer=setTimeout(()=>{if(active)setQuiet(true);},4000);};
  async function load(){if(loading||document.hidden)return;loading=true;try{
   const token=sessionStorage.getItem('cg_studio_session');
   const r=await fetch('/api/announcements',{signal:controller.signal,headers:token?{Authorization:`Bearer ${token}`}:{}});
   if(!r.ok)return;const j=await r.json();
   if(active&&Array.isArray(j.items))setItems(j.items.filter((n:Announcement)=>announcementInput.safeParse(n).success&&typeof n.id==='string'&&typeof n.revision==='string'));
  }catch{/* Optional notices must never block editing. */}finally{loading=false;}}
  interaction();void load();const timer=setInterval(()=>{void load();},60000);
  window.addEventListener('focus',load);window.addEventListener('pointerdown',interaction,true);window.addEventListener('keydown',interaction,true);
  return()=>{active=false;controller.abort();clearInterval(timer);clearTimeout(quietTimer);window.removeEventListener('focus',load);window.removeEventListener('pointerdown',interaction,true);window.removeEventListener('keydown',interaction,true);};
 },[]);
 const notice=items.find(n=>{
  const now=Date.now();if((n.endsAt&&Date.parse(n.endsAt)<=now)||(n.startsAt&&Date.parse(n.startsAt)>now))return false;
  const key=noticeDismissalKey(n);if(closed.includes(key))return false;
  try{return !dismissedNotice(n,localStorage.getItem(key));}catch{return true;}
 });
 if(!notice||blocked||suspended||!quiet)return null;
 function dismiss(){if(!notice)return;const key=noticeDismissalKey(notice);setClosed(v=>[...v,key]);try{if(notice.repeat!=='always')localStorage.setItem(key,notice.repeat==='once'?'closed':new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date()));}catch{/* Dismissal still lasts for this visit. */}}
 return <aside data-studio-notice aria-label="Comunicado do Studio" className="fixed right-3 top-20 z-40 w-[min(360px,calc(100vw-24px))] rounded-xl border border-orange-300 bg-white p-4 text-neutral-900 shadow-xl space-y-2"><div className="flex justify-between gap-3"><strong>{notice.type==='warning'?'Atenção: ':''}{notice.title}</strong><button type="button" aria-label="Fechar comunicado" onClick={dismiss} className="min-w-11 min-h-11 flex items-center justify-center rounded border"><X className="h-4 w-4"/></button></div><p className="whitespace-pre-wrap text-sm">{notice.message}</p>{notice.imageUrl&&<img src={notice.imageUrl} alt={notice.title} className="max-h-40 w-full object-contain"/>}{notice.buttonUrl&&<a href={notice.buttonUrl} target="_blank" rel="noopener noreferrer" className="inline-block rounded bg-orange-600 text-white px-3 py-3 text-sm font-semibold">{notice.buttonText} ↗</a>}</aside>;
}
