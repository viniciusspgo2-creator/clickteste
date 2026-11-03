'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {X,Megaphone} from 'lucide-react';
import {announcementInput,dismissedNotice,noticeDismissalKey,type Announcement} from '@/lib/announcements/input';

/** Comunicados para áreas públicas e editores, sem bloquear o fluxo nem pedir autenticação. */
export function PlatformAnnouncements(){
 const pathname=usePathname();
 const [items,setItems]=useState<Announcement[]>([]);
 const [closed,setClosed]=useState<string[]>([]);
 const [ready,setReady]=useState(false);
 const [quiet,setQuiet]=useState(false);
 useEffect(()=>{
  let active=true;
  const controller=new AbortController();
  const load=async()=>{try{
   const response=await fetch('/api/public-announcements',{cache:'no-store',signal:controller.signal});
   if(!response.ok)return;
   const data:unknown=await response.json();
   if(!data||typeof data!=='object'||!('items' in data)||!Array.isArray(data.items))return;
   if(active)setItems(data.items.filter((item:unknown)=>{
    if(!item||typeof item!=='object'||!('id' in item)||!('revision' in item))return false;
    return announcementInput.safeParse(item).success;
   }) as Announcement[]);
  }catch{/* Avisos são opcionais, editor funciona offline. */}};
  const timer=window.setTimeout(()=>{if(active){setReady(true);setQuiet(true);}},6000);
  const interval=window.setInterval(()=>{void load();},120_000);
  void load();
  return()=>{active=false;controller.abort();clearTimeout(timer);clearInterval(interval);};
 },[]);
 // O Studio tem anúncios próprios com autorização premium; o Admin não exibe anúncios públicos.
 if(pathname?.startsWith('/admin')||pathname?.includes('/mockup-caneca-3d/studio'))return null;
 if(!ready||!quiet)return null;
 const notice=items.find(n=>{
  const now=Date.now();if(n.status!=='active'||n.audience!=='all'||(n.startsAt&&Date.parse(n.startsAt)>now)||(n.endsAt&&Date.parse(n.endsAt)<=now))return false;
  const key=noticeDismissalKey(n);if(closed.includes(key))return false;
  try{return !dismissedNotice(n,localStorage.getItem(key));}catch{return true;}
 });
 if(!notice)return null;
 const dismiss=()=>{
  const key=noticeDismissalKey(notice);setClosed(previous=>[...previous,key]);
  if(notice.repeat==='always')return;
  try{localStorage.setItem(key,notice.repeat==='once'?'closed':new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date()));}catch{}
 };
 return <aside className="cg-public-announcement" aria-label="Comunicado Click & Gruda" role="status">
  <div className="cg-public-announcement-head"><span><Megaphone size={19}/>{notice.type==='warning'?'Atenção':'Click & Gruda'}</span><button type="button" aria-label="Fechar comunicado" onClick={dismiss}><X size={18}/></button></div>
  <strong>{notice.title}</strong><p>{notice.message}</p>
  {notice.imageUrl&&<img src={notice.imageUrl} alt={notice.title} loading="lazy"/>}
  {notice.buttonUrl&&notice.buttonText&&<a href={notice.buttonUrl} target="_blank" rel="noopener noreferrer">{notice.buttonText}</a>}
 </aside>;
}
