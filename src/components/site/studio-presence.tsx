'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
export function StudioPresence({enabled}:{enabled:boolean}){
 const path=usePathname();
 useEffect(()=>{
  if(!enabled)return;
  let lastActivity=Date.now(),pending=false;
  const controller=new AbortController();
  const activity=()=>{lastActivity=Date.now();};
  const page=path.startsWith('/editor-artes')?'editor':path.startsWith('/mockup-cenarios')?'cenarios':path.includes('templates')?'templates':'studio';
  const beat=async()=>{if(pending||document.hidden)return;pending=true;try{let token:string|null=null;try{token=sessionStorage.getItem('cg_studio_session');}catch{/* Cookie authentication remains available. */}await fetch('/api/access/presence',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({page,active:Date.now()-lastActivity<120000})});}catch{/* Presence is optional and must not interrupt editing. */}finally{pending=false;}};
  void beat();const timer=setInterval(()=>void beat(),30000);
  window.addEventListener('pointerdown',activity,true);window.addEventListener('keydown',activity,true);window.addEventListener('wheel',activity,{passive:true});window.addEventListener('focus',beat);document.addEventListener('visibilitychange',beat);
  return()=>{controller.abort();clearInterval(timer);window.removeEventListener('pointerdown',activity,true);window.removeEventListener('keydown',activity,true);window.removeEventListener('wheel',activity);window.removeEventListener('focus',beat);document.removeEventListener('visibilitychange',beat);};
 },[enabled,path]);
 return null;
}
