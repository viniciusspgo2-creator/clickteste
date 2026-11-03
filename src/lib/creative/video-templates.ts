/** Client-side MP4/H.264 compositor. The original video's audio is not retained.
 * Static overlay runs are prerendered; only animated layers are redrawn per frame.
 * 20s / 720p / 24fps limit protects client memory on lower-end computers.
 */
import {Muxer,ArrayBufferTarget} from 'mp4-muxer';
import {drawDesign,type DesignDocument,type DesignNode} from './design';
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
const abortIfNeeded=(signal?:AbortSignal)=>{if(signal?.aborted)throw new DOMException('Exportação cancelada','AbortError')};
function reducedDocument(doc:DesignDocument,width:number,height:number):DesignDocument{
 const x=width/doc.width,y=height/doc.height;const avg=(x+y)/2;
 const nodes:DesignNode[]=doc.nodes.map(n=>({...n,x:n.x*x,y:n.y*y,w:n.w*x,h:n.h*y,
  size:n.size?n.size*avg:undefined,shadow:n.shadow?n.shadow*avg:undefined,
  shadowX:n.shadowX?n.shadowX*x:undefined,shadowY:n.shadowY?n.shadowY*y:undefined,
  blur:n.blur?n.blur*avg:undefined,strokeWidth:n.strokeWidth?n.strokeWidth*avg:undefined,
  curve:n.curve?n.curve*avg:undefined,wave:n.wave?n.wave*avg:undefined,
  tracking:n.tracking?n.tracking*avg:undefined,depth:n.depth?n.depth*avg:undefined,
  keyframes:n.keyframes?.map(frame=>({...frame,x:frame.x*x,y:frame.y*y,w:frame.w*x,h:frame.h*y}))
 }));
 return {width,height,background:'transparent',nodes};
}
type RenderRun={animated:boolean;nodes:DesignNode[];canvas:HTMLCanvasElement};
async function renderRuns(doc:DesignDocument):Promise<RenderRun[]>{
 const runs:RenderRun[]=[];
 for(const node of doc.nodes){
  const animated=!!node.keyframes?.length;const previous=runs.at(-1);
  if(previous&&!animated&&!previous.animated){previous.nodes.push(node);continue;}
  const canvas=document.createElement('canvas');runs.push({animated,nodes:[node],canvas});
 }
 // Avoid allocating dozens of full-resolution canvases for very complex projects.
 if(runs.length>36)return [{animated:true,nodes:doc.nodes,canvas:document.createElement('canvas')}];
 await Promise.all(runs.filter(run=>!run.animated).map(async run=>drawDesign(run.canvas,{...doc,nodes:run.nodes})));
 return runs;
}
export async function renderMp4Template(doc:DesignDocument,onProgress?:(n:number)=>void,signal?:AbortSignal):Promise<Blob>{
 if(!doc.video?.src)throw new Error('Nenhum MP4 no documento');
 if(typeof VideoEncoder==='undefined'||typeof VideoFrame==='undefined')throw new Error('Este navegador não suporta exportação MP4. Use Chrome/Edge atualizado em HTTPS.');
 if(!Number.isFinite(doc.width)||!Number.isFinite(doc.height)||doc.width<100||doc.height<100)throw new Error('Tamanho de projeto inválido');
 const w=Math.max(2,Math.floor(Math.min(1280,doc.width)*(Math.min(1,720/doc.height))/2)*2);
 const h=Math.max(2,Math.floor(w*doc.height/doc.width/2)*2);
 const fps=24,video=document.createElement('video');video.crossOrigin='anonymous';video.muted=true;video.preload='auto';video.playsInline=true;video.src=doc.video.src;
 let encoder:VideoEncoder|undefined;
 try{
  abortIfNeeded(signal);await loadVideo(video);
  const start=Math.max(0,Math.min(doc.video.start??0,Math.max(0,video.duration-.1)));
  const end=Math.min(video.duration,doc.video.end??video.duration,start+20);
  if(!Number.isFinite(end)||end<=start)throw new Error('Defina um intervalo válido de vídeo.');
  const supported=await VideoEncoder.isConfigSupported({codec:'avc1.42001f',width:w,height:h,framerate:fps,bitrate:2_500_000});
  if(!supported.supported)throw new Error('Seu navegador não tem codificador H.264 compatível.');
  const outputDoc=reducedDocument(doc,w,h);const runs=await renderRuns(outputDoc);
  const stage=document.createElement('canvas');stage.width=w;stage.height=h;
  const ctx=stage.getContext('2d',{alpha:false});if(!ctx)throw new Error('Canvas de vídeo indisponível');
  const target=new ArrayBufferTarget();const muxer=new Muxer({target,video:{codec:'avc',width:w,height:h,frameRate:fps},fastStart:'in-memory'});
  let encodingError:Error|undefined;
  encoder=new VideoEncoder({output:(chunk,metadata)=>muxer.addVideoChunk(chunk,metadata),error:(e)=>{encodingError=new Error(e.message)}});
  encoder.configure(supported.config);
  const frames=Math.ceil((end-start)*fps);
  for(let i=0;i<frames;i++){
   abortIfNeeded(signal);if(encodingError)throw encodingError;
   await seek(video,Math.min(end-.0001,start+i/fps));
   ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);
   const scale=Math.max(w/video.videoWidth,h/video.videoHeight),sw=video.videoWidth*scale,sh=video.videoHeight*scale;
   ctx.drawImage(video,(w-sw)/2,(h-sh)/2,sw,sh);
   for(const run of runs){
    if(run.animated)await drawDesign(run.canvas,{...outputDoc,nodes:run.nodes},i/fps);
    ctx.drawImage(run.canvas,0,0,w,h);
   }
   const frame=new VideoFrame(stage,{timestamp:Math.round(i*1e6/fps),duration:Math.round(1e6/fps)});
   encoder.encode(frame,{keyFrame:i%fps===0});frame.close();
   if(i%8===0)onProgress?.(Math.round((i+1)/frames*100));
   if(encoder.encodeQueueSize>4)await encoder.flush();
  }
  await encoder.flush();if(encodingError)throw encodingError;abortIfNeeded(signal);
  muxer.finalize();onProgress?.(100);
  return new Blob([target.buffer as ArrayBuffer],{type:'video/mp4'});
 }finally{encoder?.close();video.removeAttribute('src');video.load();}
}
