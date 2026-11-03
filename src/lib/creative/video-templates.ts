/** Client-side MP4/H.264 compositor. The original video's audio is not retained.
 * Static overlay runs are prerendered; only animated layers are redrawn per frame.
 * 20s / 720p / 24fps limit protects client memory on lower-end computers.
 */
import {Muxer,ArrayBufferTarget} from 'mp4-muxer';
import {assertDesignAssetsReady,drawDesign,type DesignDocument,type DesignNode} from './design';
/** Wait for the decoded video data with a finite timeout and cancellation.
 * Some mobile devices emit neither `loadeddata` nor `seeked` after a codec error.
 */
const canceled = () => new DOMException('Exportação cancelada', 'AbortError');
function waitForVideoEvent(
 video:HTMLVideoElement,success:string,signal:AbortSignal|undefined,
 timeoutMs:number,errorMessage:string,trigger?:()=>void,ready?:()=>boolean,
):Promise<void>{
 return new Promise<void>((resolve,reject)=>{
  let settled=false;let timer:ReturnType<typeof setTimeout>|undefined;
  const finish=(error?:Error)=>{
   if(settled)return;settled=true;if(timer!==undefined)clearTimeout(timer);
   video.removeEventListener(success,onSuccess);
   video.removeEventListener('error',onError);
   signal?.removeEventListener('abort',onAbort);
   if(error)reject(error);else resolve();
  };
  const onSuccess=()=>finish();
  const onError=()=>finish(new Error(errorMessage));
  const onAbort=()=>finish(canceled());
  if(signal?.aborted){reject(canceled());return;}
  video.addEventListener(success,onSuccess);
  video.addEventListener('error',onError);
  signal?.addEventListener('abort',onAbort,{once:true});
  timer=setTimeout(()=>finish(new Error(`${errorMessage} Tempo limite excedido.`)),timeoutMs);
  try{trigger?.();if(ready?.())finish();}catch(error){finish(error instanceof Error?error:new Error(errorMessage));}
 });
}
export function waitForVideoData(video:HTMLVideoElement,signal?:AbortSignal,timeoutMs=15000):Promise<void>{
 if(signal?.aborted)return Promise.reject(canceled());
 if(video.readyState>=2)return Promise.resolve();
 return waitForVideoEvent(video,'loadeddata',signal,timeoutMs,
  'Não foi possível decodificar o vídeo.',undefined,()=>video.readyState>=2);
}
export function seekVideoFrame(video:HTMLVideoElement,time:number,signal?:AbortSignal,timeoutMs=10000):Promise<void>{
 if(signal?.aborted)return Promise.reject(canceled());
 if(!Number.isFinite(time)||time<0)return Promise.reject(new Error('Tempo do vídeo inválido.'));
 if(Math.abs(video.currentTime-time)<.005&&!video.seeking&&video.readyState>=2)return Promise.resolve();
 return waitForVideoEvent(video,'seeked',signal,timeoutMs,
  'Não foi possível acessar o quadro do vídeo.',()=>{video.currentTime=time;},
  ()=>Math.abs(video.currentTime-time)<.005&&!video.seeking&&video.readyState>=2);
}
const abortIfNeeded=(signal?:AbortSignal)=>{if(signal?.aborted)throw new DOMException('Exportação cancelada','AbortError')};
/** No hardware stalls: cancel/timeout a pending flush without saving a truncated MP4. */
export function flushVideoEncoder(encoder:VideoEncoder,signal?:AbortSignal,timeoutMs=20000):Promise<void>{
 if(signal?.aborted)return Promise.reject(canceled());
 if(!Number.isFinite(timeoutMs)||timeoutMs<1)return Promise.reject(new Error('Tempo limite inválido para codificação.'));
 return new Promise<void>((resolve,reject)=>{
  let finished=false;
  const done=(error?:Error)=>{
   if(finished)return;finished=true;clearTimeout(timer);signal?.removeEventListener('abort',onAbort);
   if(error)reject(error);else resolve();
  };
  const onAbort=()=>done(canceled());
  const timer=setTimeout(()=>done(new Error('O codificador de vídeo não respondeu dentro do tempo limite. A exportação foi interrompida sem salvar arquivo parcial.')),timeoutMs);
  signal?.addEventListener('abort',onAbort,{once:true});
  Promise.resolve().then(()=>encoder.flush()).then(()=>done(),error=>done(error instanceof Error?error:new Error('Falha ao finalizar o codificador de vídeo.')));
 });
}
/** Preserve the complete resolution budget in both landscape and portrait output.
 * The previous expression accidentally produced 852x480 for a 1920x1080 scene.
 */
export function videoOutputSize(width:number,height:number,maxWidth=1280,maxHeight=720){
 if(![width,height,maxWidth,maxHeight].every(Number.isFinite)||Math.min(width,height,maxWidth,maxHeight)<=0)throw new Error('Dimensões de vídeo inválidas');
 const factor=Math.min(1,maxWidth/width,maxHeight/height);
 const even=(value:number)=>Math.max(2,Math.floor(value/2)*2);
 return {width:even(width*factor),height:even(height*factor)};
}
/** Cover fills the whole template; contain leaves letterboxing without cutting the mug. */
export function videoFrameBounds(sourceW:number,sourceH:number,outputW:number,outputH:number,fit:'cover'|'contain'='cover'){
 if(![sourceW,sourceH,outputW,outputH].every(v=>Number.isFinite(v)&&v>0))throw new Error('Dimensões do quadro inválidas');
 const ratio=fit==='contain'?Math.min(outputW/sourceW,outputH/sourceH):Math.max(outputW/sourceW,outputH/sourceH);
 const width=sourceW*ratio,height=sourceH*ratio;
 return {x:(outputW-width)/2,y:(outputH-height)/2,width,height};
}

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
/** Negotiate H.264 profiles instead of failing when a device lacks the baseline profile.
 * All profiles produce an AVC track compatible with the MP4 muxer.
 */
export async function chooseH264Config(width:number,height:number,fps=24):Promise<VideoEncoderConfig>{
 if(typeof VideoEncoder==='undefined')throw new Error('Este navegador não suporta WebCodecs.');
 const bitrate=Math.max(1_800_000,Math.min(4_000_000,Math.round(width*height*fps*.18)));
 for(const codec of ['avc1.42001e','avc1.42001f','avc1.4d001f','avc1.64001f']){
  try{
   const result=await VideoEncoder.isConfigSupported({codec,width,height,framerate:fps,bitrate,avc:{format:'avc'}});
   if(result.supported&&result.config)return {...result.config,avc:{format:'avc'}};
  }catch{/* Uma variante H.264 não é suportada; teste a próxima. */}
 }
 throw new Error('Este navegador não possui codificação H.264 compatível. Tente Chrome ou Edge atualizado.');
}
/** Fast, deterministic preflight before creating a decoder/encoder. Source media is
 * inspected separately after loadeddata (duration, CORS, frame dimensions).
 * Frame count is a cap, not a promise that the device can encode H.264. */
export function inspectVideoExport(doc:DesignDocument,fps=24){
 if(!doc.video?.src)throw new Error('Adicione um MP4 ao projeto antes de exportar.');
 if(!Number.isFinite(doc.width)||!Number.isFinite(doc.height)||doc.width<100||doc.height<100||doc.width>8192||doc.height>8192)
  throw new Error('Dimensões do projeto fora da faixa permitida.');
 const start=doc.video.start??0,end=doc.video.end;
 if(!Number.isFinite(start)||start<0||end!==undefined&&(!Number.isFinite(end)||end<=start))
  throw new Error('Os pontos de início e fim da linha do tempo são inválidos.');
 if(!Number.isInteger(fps)||fps<1||fps>60)throw new Error('Taxa de quadros inválida.');
 const output=videoOutputSize(doc.width,doc.height);
 if(output.width*output.height>1280*720)throw new Error('Resolução de vídeo excede o limite do Editor.');
 return {width:output.width,height:output.height,fps,maxDuration:20,hasAudio:false,animatedNodes:doc.nodes.filter(n=>n.visible!==false&&n.keyframes?.length).length};
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
 if(runs.length>12||runs.length*doc.width*doc.height>14_000_000)return [{animated:true,nodes:doc.nodes,canvas:document.createElement('canvas')}];
 await Promise.all(runs.filter(run=>!run.animated).map(async run=>drawDesign(run.canvas,{...doc,nodes:run.nodes},undefined,{strict:true})));
 return runs;
}
export async function renderMp4Template(doc:DesignDocument,onProgress?:(n:number)=>void,signal?:AbortSignal):Promise<Blob>{
 const inspection=inspectVideoExport(doc);
 if(typeof VideoEncoder==='undefined'||typeof VideoFrame==='undefined')throw new Error('Este navegador não suporta exportação MP4. Use Chrome/Edge atualizado em HTTPS.');
 await assertDesignAssetsReady(doc);
 const {width:w,height:h}=inspection;
 const fps=24,video=document.createElement('video');video.crossOrigin='anonymous';video.muted=true;video.preload='auto';video.playsInline=true;video.src=doc.video.src;
 let encoder:VideoEncoder|undefined;
 try{
  abortIfNeeded(signal);const supportedConfig=await chooseH264Config(w,h,fps);
  await waitForVideoData(video,signal);
  if(video.videoWidth<2||video.videoHeight<2)throw new Error('O MP4 não possui quadros de vídeo decodificáveis.');
  if(!Number.isFinite(video.duration)||video.duration<=0)throw new Error('A duração do vídeo não foi identificada. Utilize um MP4 completo, com duração finita.');
  if(doc.video.start!==undefined&&!Number.isFinite(doc.video.start))throw new Error('Início do vídeo inválido.');
  if(doc.video.end!==undefined&&!Number.isFinite(doc.video.end))throw new Error('Fim do vídeo inválido.');
  const start=Math.max(0,Math.min(doc.video.start??0,Math.max(0,video.duration-.1)));
  const end=Math.min(video.duration,doc.video.end??video.duration,start+20);
  if(!Number.isFinite(end)||end<=start)throw new Error('Defina um intervalo válido de vídeo.');
  const outputDoc=reducedDocument(doc,w,h);const runs=await renderRuns(outputDoc);abortIfNeeded(signal);
  const stage=document.createElement('canvas');stage.width=w;stage.height=h;
  const ctx=stage.getContext('2d',{alpha:false});if(!ctx)throw new Error('Canvas de vídeo indisponível');
  const target=new ArrayBufferTarget();const muxer=new Muxer({target,video:{codec:'avc',width:w,height:h,frameRate:fps},fastStart:'in-memory'});
  let encodingError:Error|undefined;let encodedChunks=0;
  encoder=new VideoEncoder({output:(chunk,metadata)=>{try{muxer.addVideoChunk(chunk,metadata);encodedChunks++;}catch(error){encodingError=error instanceof Error?error:new Error('Falha ao adicionar quadro no MP4');}},error:(e)=>{encodingError=new Error(e.message)}});
  encoder.configure(supportedConfig);
  const frames=Math.ceil((end-start)*fps);
  for(let i=0;i<frames;i++){
   abortIfNeeded(signal);if(encodingError)throw encodingError;
   await seekVideoFrame(video,Math.min(end-.0001,start+i/fps),signal);
   ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);
   const frameBounds=videoFrameBounds(video.videoWidth,video.videoHeight,w,h,doc.video.fit||'cover');
   try{ctx.drawImage(video,frameBounds.x,frameBounds.y,frameBounds.width,frameBounds.height);
    if(i===0)ctx.getImageData(0,0,1,1);
   }catch{throw new Error('Não foi possível ler os quadros deste MP4. Se o vídeo está hospedado fora do site, verifique o acesso CORS ou importe um arquivo local.');}
   for(const run of runs){
    if(run.animated)await drawDesign(run.canvas,{...outputDoc,nodes:run.nodes},i/fps,{strict:true});
    ctx.drawImage(run.canvas,0,0,w,h);
   }
   const frame=new VideoFrame(stage,{timestamp:Math.round(i*1e6/fps),duration:Math.round(1e6/fps)});
   encoder.encode(frame,{keyFrame:i%fps===0});frame.close();
   if(i%8===0)onProgress?.(Math.round((i+1)/frames*100));
   if(encoder.encodeQueueSize>4)await flushVideoEncoder(encoder,signal);
  }
  await flushVideoEncoder(encoder,signal);if(encodingError)throw encodingError;abortIfNeeded(signal);
  if(encodedChunks!==frames)throw new Error(`O vídeo foi codificado de forma incompleta (${encodedChunks} de ${frames} quadros). Nenhum arquivo parcial foi salvo.`);
  muxer.finalize();onProgress?.(100);
  if(!target.buffer||target.buffer.byteLength<128)throw new Error('O codificador não produziu um arquivo MP4 válido. Nenhum arquivo parcial foi salvo.');
  return new Blob([target.buffer as ArrayBuffer],{type:'video/mp4'});
 }finally{if(encoder&&encoder.state!=='closed')encoder.close();video.removeAttribute('src');video.load();}
}
