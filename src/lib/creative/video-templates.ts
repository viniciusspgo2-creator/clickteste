/** Browser-only MP4 export of a video background and editable static overlays.
 * Uses installed mp4-muxer (MIT) + WebCodecs H.264. No original audio is retained.
 * Max 20s / 720p / 24fps for reliable memory/performance; clients never upload files.
 */
import {Muxer,ArrayBufferTarget} from 'mp4-muxer';
import {drawDesign,type DesignDocument} from './design';
const loadVideo=(video:HTMLVideoElement)=>new Promise<void>((resolve,reject)=>{
 if(video.readyState>=2)return resolve();const clean=()=>{video.removeEventListener('loadeddata',ok);video.removeEventListener('error',fail)};
 const ok=()=>{clean();resolve()},fail=()=>{clean();reject(new Error('Vídeo não pôde ser aberto'))};
 video.addEventListener('loadeddata',ok,{once:true});video.addEventListener('error',fail,{once:true});
});
async function seek(video:HTMLVideoElement,t:number){
 if(Math.abs(video.currentTime-t)<.01&&video.readyState>=2)return;
 await new Promise<void>((resolve,reject)=>{const on=()=>{cleanup();resolve()},bad=()=>{cleanup();reject(new Error('Não foi possível acessar o quadro do vídeo'))};
  const cleanup=()=>{video.removeEventListener('seeked',on);video.removeEventListener('error',bad)};
  video.addEventListener('seeked',on,{once:true});video.addEventListener('error',bad,{once:true});video.currentTime=t;
 });
}
export async function renderMp4Template(doc:DesignDocument,onProgress?:(n:number)=>void):Promise<Blob>{
 if(!doc.video?.src)throw new Error('Nenhum MP4 no documento');
 if(typeof VideoEncoder==='undefined'||typeof VideoFrame==='undefined')throw new Error('Este navegador não suporta exportação MP4. Use Chrome/Edge atualizado em HTTPS.');
 const w=Math.max(2,Math.floor(Math.min(1280,doc.width)*(Math.min(1,720/doc.height))/2)*2);
 const h=Math.max(2,Math.floor(w*doc.height/doc.width/2)*2);
 const fps=24,video=document.createElement('video');video.crossOrigin='anonymous';video.muted=true;video.preload='auto';video.playsInline=true;video.src=doc.video.src;
 let encoder:VideoEncoder|undefined;
 try{
  await loadVideo(video);const start=Math.max(0,Math.min(doc.video.start??0,Math.max(0,video.duration-.1)));
  const end=Math.min(video.duration,doc.video.end??video.duration,start+20);
  if(!Number.isFinite(end)||end<=start)throw new Error('Defina um intervalo válido de vídeo.');
  const supported=await VideoEncoder.isConfigSupported({codec:'avc1.42001f',width:w,height:h,framerate:fps,bitrate:2_500_000});
  if(!supported.supported)throw new Error('Seu navegador não tem codificador H.264 compatível.');
  const overlay=document.createElement('canvas');await drawDesign(overlay,{...doc,background:'transparent',video:undefined});
  const stage=document.createElement('canvas');stage.width=w;stage.height=h;const ctx=stage.getContext('2d',{alpha:false});if(!ctx)throw new Error('Canvas de vídeo indisponível');
  const target=new ArrayBufferTarget();const muxer=new Muxer({target,video:{codec:'avc',width:w,height:h,frameRate:fps},fastStart:'in-memory'});
  let encodingError:Error|undefined;
  encoder=new VideoEncoder({output:(chunk,metadata)=>muxer.addVideoChunk(chunk,metadata),error:(e)=>{encodingError=new Error(e.message)}});
  encoder.configure(supported.config);
  const frames=Math.ceil((end-start)*fps);
  for(let i=0;i<frames;i++){
   if(encodingError)throw encodingError;
   await seek(video,Math.min(end-.0001,start+i/fps));
   ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
   // Cover crop: original aspect ratio is preserved, no flattening/stretching.
   const s=Math.max(w/video.videoWidth,h/video.videoHeight),sw=video.videoWidth*s,sh=video.videoHeight*s;
   ctx.drawImage(video,(w-sw)/2,(h-sh)/2,sw,sh);
   ctx.drawImage(overlay,0,0,w,h);
   const frame=new VideoFrame(stage,{timestamp:Math.round(i*1e6/fps),duration:Math.round(1e6/fps)});
   encoder.encode(frame,{keyFrame:i%fps===0});frame.close();
   if(i%8===0)onProgress?.(Math.round((i+1)/frames*100));
   if(encoder.encodeQueueSize>4)await encoder.flush();
  }
  await encoder.flush();if(encodingError)throw encodingError;muxer.finalize();onProgress?.(100);
  return new Blob([target.buffer as ArrayBuffer],{type:'video/mp4'});
 }finally{encoder?.close();video.removeAttribute('src');video.load()}
}
