"use client";
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { createMotionPreview, VIDEO_RESOLUTIONS } from "../exporters/video-exporter";
import { useMockupStore, type VideoState } from "../state/store";
import { studioRefs } from "../scene/studio-refs";

export function MotionPreview({ video, framing, enabled, stopRef }: {video:VideoState;framing?:string;enabled:boolean;stopRef:MutableRefObject<(()=>void)|null>}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const [playing,setPlaying]=useState(true);
  const [error,setError]=useState("");
  const [restart,setRestart]=useState(0);
  const [ready,setReady]=useState(false);
  const open=useMockupStore(s=>s.exportOpen);
  const zoom=useMockupStore(s=>s.zoom);
  const bg=useMockupStore(s=>s.bg);
  const wm=useMockupStore(s=>s.watermark);
  const resolution=VIDEO_RESOLUTIONS[video.res]??VIDEO_RESOLUTIONS.sq1080;
  useEffect(()=>{
    if(!open||!enabled||!playing||!canvas.current)return;
    let cancelled=false, animation=0, timer:ReturnType<typeof setTimeout>;
    let preview:ReturnType<typeof createMotionPreview>|undefined;
    const stop=()=>{cancelled=true;clearTimeout(timer);cancelAnimationFrame(animation);preview?.stop();preview=undefined;};
    stopRef.current=stop;
    setReady(false);setError("");
    const start=()=>{
      if(cancelled||!useMockupStore.getState().exportOpen)return;
      // A preceding draft/session can still be finishing its asynchronous encode.
      if(studioRefs.exporting){timer=setTimeout(start,80);return;}
      try{
        preview=createMotionPreview(canvas.current!,resolution,{...video,quality:'fast'});
        const began=performance.now();let last=-Infinity;
        const draw=(now:number)=>{
          if(cancelled)return;
          try{
            if(now-last>=1000/15){preview!.render(((now-began)/(video.duration*1000))%1);last=now;setReady(true);}
            animation=requestAnimationFrame(draw);
          }catch(e){stop();setError(e instanceof Error?e.message:'Não foi possível reproduzir.');}
        };
        animation=requestAnimationFrame(draw);
      }catch(e){stop();setError(e instanceof Error?e.message:'A prévia está indisponível.');}
    };
    timer=setTimeout(start,200);
    return ()=>{stop();if(stopRef.current===stop)stopRef.current=null;};
  },[open,enabled,playing,restart,video.anim,video.duration,video.res,video.transparent,video.direction,video.turns,framing,zoom,bg,wm,resolution,stopRef]);
  return <div className="cg-export-preview cg-motion-preview">
    <div className="cg-export-preview-title"><strong>Prévia em movimento</strong><span>{resolution.w} × {resolution.h} px na saída</span></div>
    <div className="cg-export-preview-surface">
      <canvas ref={canvas} aria-label="Prévia animada do vídeo" role="img" style={{opacity:ready?1:0}}/>
      {!ready&&!error&&<p>{enabled?(playing?'Preparando a prévia…':'Reproduza para conferir o movimento.'):'Gerando o arquivo final…'}</p>}
      {error&&<p role="status">{error}</p>}
    </div>
    <div className="cg-motion-controls"><button type="button" disabled={!enabled} aria-pressed={playing} onClick={()=>setPlaying(value=>!value)}>{playing?<Pause size={15}/>:<Play size={15}/>} {playing?'Pausar prévia':'Reproduzir prévia'}</button><button type="button" disabled={!enabled} onClick={()=>{setPlaying(true);setRestart(n=>n+1);}}><RotateCcw size={15}/>Recomeçar</button></div>
    <p className="cg-motion-caption">A prévia acompanha suas escolhas de movimento, direção, duração e fundo. A prévia é mais leve; o arquivo final usa a resolução e a fluidez escolhidas.</p>
  </div>;
}
