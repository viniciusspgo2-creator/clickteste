"use client";
import { useCallback,useEffect,useMemo,useRef,useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Undo2, Redo2, ImagePlus, Type, Shapes, Layers3, Trash2, Copy, ChevronUp, ChevronDown, Download, SlidersHorizontal, Search, Upload, RectangleHorizontal, Circle, Sparkles, FolderOpen, Save, WandSparkles, X, Plus, Maximize, FlipHorizontal2, FlipVertical2, Crop, LockKeyhole, Users, Eye, EyeOff, Lock, Unlock, Layers2, RotateCcw, BookOpen, Sticker, Shapes as ObjectsIcon, Paintbrush, Pipette, RotateCw, ShieldCheck, History, AlertTriangle, Scissors, ClipboardPaste, Eraser, PenTool } from 'lucide-react';
import { asDataUrl,blankDocument,clearDesignRenderCache,drawDesign,exportDesign,formats,imageFor,saveBlob,uid,type DesignDocument,type DesignNode,type ExportFormat } from '@/lib/creative/design';
import { readHandoff } from '@/lib/creative/handoff';
import {detachAutomaticSmartMask,replaceFlatScene,canCommitAsyncTemplate} from '@/lib/creative/template-transition';
import {validateProjectDocument} from '@/lib/creative/validate-project';
import {canApplyLoadedProject,inspectProjectMedia} from '@/lib/creative/project-media-check';
import {DraftWriteQueue} from '@/lib/creative/draft-write-queue';
import {DocumentSession} from '@/lib/creative/document-session';
import {createPortableProjectBlob,makePortableDocument,hasTemporaryMedia} from '@/lib/creative/portable-project';
import {builtInPresets,makeBuiltInPreset,type PresetId} from '@/lib/creative/presets';
import {resizeFromCorner,type Corner} from '@/lib/creative/geometry';
import {reorderNodes,mirrorNode,canSelectOnCanvas,type LayerMove} from '@/lib/creative/node-actions';
import {backgroundKits,backgroundSvg} from '@/lib/creative/backgrounds';
import {StudioConcierge} from '@/components/creative/studio-concierge';
import {FontLibrary} from '@/components/creative/font-library';
import {StockLibrary} from '@/components/creative/stock-library';
import {loadCuratedTypeface,isCuratedTypeface,ensureDesignFonts,typefaces,installedTypefaces} from '@/lib/creative/typefaces';
import {readLocalAsset} from '@/lib/creative/user-uploads';
import {checkRasterQuality} from '@/lib/creative/image-quality';
import {checkBeforeExport,type PrintMessage} from '@/lib/creative/print-check';
import {importPdfEditable,inspectPdfPageCount} from '@/lib/creative/pdf-layers';
import {importPsdLayers} from '@/lib/creative/psd-import';
import {importSmartTemplate,fitMockupIntoSlot} from '@/lib/creative/smart-templates';
import {motionPreset,withMotionPoint,type MotionPreset} from '@/lib/creative/animation';
import {loadBrowserFonts,type LocalTypeface} from '@/lib/creative/browser-fonts';
import {saveCreativeProject,readCreativeProject,listCreativeProjects,deleteCreativeProject,deleteAutomaticDraft,LOCAL_DRAFT_ID,type SavedCreativeProject} from '@/lib/creative/browser-projects';
import {usePlatformLanguage} from '@/components/platform/language-provider';
import './creative.css';

type Asset={id:string;kind:string;name:string;category:string;mimeType:string;url:string;tags?:string[]};
type Panel='templates'|'layers'|'elements'|'personagens'|'texts'|'backgrounds'|'uploads'|'icons'|'objects'|'effects';
type Gesture={kind:'move'|'resize'|'rotate'|'bezier'|'erase';corner?:Corner;bezierPoint?:'s'|'c1'|'c2'|'e';erasePoints?:{x:number;y:number}[];id:string;x:number;y:number;initial:DesignNode;before:DesignDocument;rotationOrigin?:number};
type EditorTab={id:string;title:string;history:DesignDocument[];step:number;selected:string|null;saved:DesignDocument};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const initials=(name:string)=>name.split(' ').slice(0,2).map(x=>x[0]).join('').toUpperCase();
const pngCategories=['Personagens','Alfabetos','Ilustrações','Avulsos','PNGs'] as const;
const backgroundPresets=['#141112','#080808','#ffffff','#f4eee6','#e96d18','#1b2838','#d5d1c7','#f6bac9','#285141','transparent'];

export function CreativeEditor(){
 const {t,language}=usePlatformLanguage();
 const [history,setHistory]=useState<DesignDocument[]>([blankDocument()]);
 const [activeTabId,setActiveTabId]=useState('tab-1');
 const activeTabRef=useRef('tab-1');
 const editorTabsRef=useRef<EditorTab[]>([]);
 const [,setTabRevision]=useState(0);
 const clipboardRef=useRef<{node:DesignNode;width:number;height:number}|null>(null);
 const [clipboardReady,setClipboardReady]=useState(false);
 const [eraserMode,setEraserMode]=useState(false);
 const [eraserSize,setEraserSize]=useState(55);
 const [step,setStep]=useState(0);
 const stateRef=useRef({history,step});
 if(!editorTabsRef.current.length)editorTabsRef.current=[{id:'tab-1',title:'Arte 1',history,step:0,selected:null,saved:history[0]}];
 // Última composição que teve um backup local ou rascunho concluído de verdade.
 const savedDocumentRef=useRef<DesignDocument>(history[0]);
 // Um pedido mais recente invalida qualquer carregamento de template ainda pendente.
 const templateRequestRef=useRef(0);
 const projectLoadRef=useRef(0);
 const assetsRequestRef=useRef(0);
 const autoDraftQueueRef=useRef<DraftWriteQueue>(new DraftWriteQueue());
 // Cancels late media/font imports when a different document has been opened.
 const documentSessionRef=useRef<DocumentSession>(new DocumentSession());
 const doc=history[step];
 const [selected,setSelected]=useState<string|null>(null);
 const [panel,setPanel]=useState<Panel>('templates');
 const [assets,setAssets]=useState<Asset[]>([]),[assetTotal,setAssetTotal]=useState(0);
 const [assetsLoading,setAssetsLoading]=useState(false),[assetsError,setAssetsError]=useState(false);
 const [assetPage,setAssetPage]=useState(1),[assetQuery,setAssetQuery]=useState('');
 const [pngCategory,setPngCategory]=useState<(typeof pngCategories)[number]>('Personagens');
 const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);
 const [exportOpen,setExportOpen]=useState(false);const [format,setFormat]=useState<ExportFormat>('png');const [scale,setScale]=useState(1);
 const [mirrorPrint,setMirrorPrint]=useState(false);
 const [zoom,setZoom]=useState(1);const [fontRevision,setFontRevision]=useState(0);
 const [assetColor,setAssetColor]=useState('#fa842c');
 const [localFonts,setLocalFonts]=useState<LocalTypeface[]>([]);
 const [guides,setGuides]=useState(true);const [showAgent,setShowAgent]=useState(false);
 const [resetOpen,setResetOpen]=useState(false),[historyOpen,setHistoryOpen]=useState(false);
 const [localProjects,setLocalProjects]=useState<SavedCreativeProject[]>([]),[draftReady,setDraftReady]=useState(false);
 const [videoProgress,setVideoProgress]=useState<number|null>(null);
 const [videoPreset,setVideoPreset]=useState<'hd'|'fullhd'>('hd');
 const [videoChecking,setVideoChecking]=useState(false);
 const [videoDiagnostic,setVideoDiagnostic]=useState<string|null>(null);
 const [videoFps,setVideoFps]=useState<24|30>(24);
 const videoAbort=useRef<AbortController|null>(null);
 const videoCheckAbort=useRef<AbortController|null>(null);
 useEffect(()=>()=>videoCheckAbort.current?.abort(),[]);
 useEffect(()=>{videoCheckAbort.current?.abort();setVideoDiagnostic(null);setVideoChecking(false)},[doc.video?.src,doc.video?.start,doc.video?.end]);
 const [previewSecond,setPreviewSecond]=useState(0);
 const [eyedropper,setEyedropper]=useState<'background'|'element'|null>(null);
 const [sceneDragId,setSceneDragId]=useState<string|null>(null);

 const videoRef=useRef<HTMLVideoElement>(null);
 const canvasRef=useRef<HTMLCanvasElement>(null),zoneRef=useRef<HTMLDivElement>(null),fileRef=useRef<HTMLInputElement>(null),projectRef=useRef<HTMLInputElement>(null),maskRef=useRef<HTMLInputElement>(null);
 const gesture=useRef<Gesture|null>(null);
 const renderId=useRef(0);
 const active=doc.nodes.find(n=>n.id===selected)||null;
 const printChecks=useMemo(()=>checkBeforeExport(doc),[doc]);
 const [qualityChecks,setQualityChecks]=useState<PrintMessage[]>([]);
 const [checkingQuality,setCheckingQuality]=useState(false);
 useEffect(()=>{
  if(!exportOpen)return;
  let cancelled=false;
  setQualityChecks([]);setCheckingQuality(true);
  void checkRasterQuality(doc,async src=>{
   const image=await imageFor(src);
   return {width:image.naturalWidth,height:image.naturalHeight};
  }).then(items=>{if(!cancelled)setQualityChecks(items);}).catch(()=>{if(!cancelled)setQualityChecks([{kind:'warning',message:'Não foi possível avaliar a qualidade das imagens.'}]);})
   .finally(()=>{if(!cancelled)setCheckingQuality(false);});
  return()=>{cancelled=true;};
 },[exportOpen,doc]);
 const kind=panel==='templates'?'template':panel==='elements'||panel==='personagens'?'element':panel==='backgrounds'?'background':null;
 const update=useCallback((f:(d:DesignDocument)=>DesignDocument)=>{
  const prior=stateRef.current;
  const next=[...prior.history.slice(0,prior.step+1),f(prior.history[prior.step])];
  stateRef.current={history:next,step:next.length-1};
  setHistory(next);setStep(next.length-1);
 },[]);
 const patch=useCallback((id:string,p:Partial<DesignNode>)=>update(d=>({...d,nodes:d.nodes.map(n=>n.id===id&&!n.locked?{...n,...p}:n)})),[update]);
 const put=(node:DesignNode)=>{update(d=>({...d,nodes:[...d.nodes,node]}));setSelected(node.id);};
 const addText=(value='Seu texto aqui')=>{const n:DesignNode={id:uid(),kind:'text',aspectLock:true,x:doc.width*.1,y:doc.height*.39,w:doc.width*.8,h:150,angle:0,opacity:1,text:value,font:'Arial',size:Math.round(doc.width*.065),bold:true,fill:'#ffffff',shadow:0};put(n);};
 const addShape=(kind:'rect'|'circle')=>{put({id:uid(),kind,x:doc.width*.25,y:doc.height*.36,w:doc.width*.5,h:doc.width*.35,angle:0,opacity:1,fill:'#ff8525',radius:24,shadow:6});};
 const addBezier=()=>put({id:uid(),kind:'bezier',x:doc.width*.25,y:doc.height*.28,w:doc.width*.5,h:doc.height*.45,angle:0,opacity:1,fill:'#ff8a30',stroke:'#ff8a30',strokeWidth:16,shadow:0,bezier:{sx:0,sy:1,c1x:.25,c1y:0,c2x:.75,c2y:1,ex:1,ey:0}});
 const addImage=useCallback(async(src:string,preselect=true,role:'content'|'mockup'='content',expectedSession?:number)=>{
  const session=expectedSession??documentSessionRef.current.capture();
  if(!documentSessionRef.current.isCurrent(session))return;
  try{const image=await imageFor(src);
   if(!documentSessionRef.current.isCurrent(session))return;
   const id=uid();
   update(d=>{const slot=role==='mockup'?d.smartTemplate?.slot:undefined;
    const f=slot?Math.min(slot.w/image.naturalWidth,slot.h/image.naturalHeight):Math.min(1,d.width*.72/image.naturalWidth,d.height*.8/image.naturalHeight);
    const w=image.naturalWidth*f,h=image.naturalHeight*f;
    const n:DesignNode={id,kind:'image',role,aspectLock:true,src,x:slot?slot.x+(slot.w-w)/2:(d.width-w)/2,y:slot?slot.y+(slot.h-h)/2:(d.height-h)/2,w,h,maskSrc:slot?d.smartTemplate?.maskSrc:undefined,maskMode:slot?d.smartTemplate?.maskMode:undefined,maskInvert:slot?d.smartTemplate?.maskInvert:undefined,maskSpace:slot?'canvas':undefined,angle:0,opacity:1,shadow:role==='mockup'?0:12,brightness:100,contrast:100,saturation:100};
    return {...d,nodes:[...d.nodes,n]};});if(preselect)setSelected(id);
  }catch(e){if(documentSessionRef.current.isCurrent(session))setNotice(e instanceof Error?e.message:'Não foi possível abrir o arquivo.');}
 },[update]);
 const applyTemplate=useCallback(async(src:string,role:'template'|'background'='template')=>{
   const captured=stateRef.current.history[stateRef.current.step];
   const request=++templateRequestRef.current;
   try{const image=await imageFor(src);
    if(!canCommitAsyncTemplate(request,templateRequestRef.current,captured,stateRef.current.history[stateRef.current.step])){
     if(request===templateRequestRef.current)setNotice('A arte foi modificada enquanto o fundo carregava. Selecione-o novamente para preservar seu trabalho.');
     return;
    }
    update(d=>{const factor=Math.max(d.width/image.naturalWidth,d.height/image.naturalHeight);
     const w=image.naturalWidth*factor,h=image.naturalHeight*factor;
     const n:DesignNode={id:uid(),kind:'image',role,aspectLock:true,src,x:(d.width-w)/2,y:(d.height-h)/2,w,h,angle:0,opacity:1};
     return replaceFlatScene(d,n);});setSelected(null);setNotice('Cenário aplicado. Mockup e elementos pessoais preservados.');
   }catch{if(request===templateRequestRef.current)setNotice('Não foi possível carregar o template.');}
 },[update]);
 const commitSmartTemplate=(request:number,captured:DesignDocument,result:Awaited<ReturnType<typeof importSmartTemplate>>)=>{
  if(!canCommitAsyncTemplate(request,templateRequestRef.current,captured,stateRef.current.history[stateRef.current.step])){
   if(request===templateRequestRef.current)setNotice('A arte mudou durante a importação. Selecione o template novamente para preservar suas alterações.');
   return false;
  }
  documentSessionRef.current.replace();
  update(()=>result.document);setSelected(null);setPanel('layers');setNotice(result.warning);
  return true;
 };
 const applyPreset=(preset:PresetId)=>{++templateRequestRef.current;documentSessionRef.current.replace();const base=makeBuiltInPreset(preset);update(d=>{
   const keep=detachAutomaticSmartMask(d).filter(n=>n.role!=='template'&&n.role!=='background'&&n.role!=='foreground');
   // O layout troca. O mockup e os elementos do usuário são mantidos e adaptados à nova tela.
   const f=Math.min(base.width/d.width,base.height/d.height);const ox=(base.width-d.width*f)/2,oy=(base.height-d.height*f)/2;
   const adapted=keep.map(n=>({...n,x:n.x*f+ox,y:n.y*f+oy,w:n.w*f,h:n.h*f,size:n.size?Math.max(8,n.size*f):undefined,shadow:n.shadow?Math.max(1,n.shadow*f):n.shadow}));
   return {...base,nodes:[...base.nodes,...adapted]};});setSelected(null);setNotice('Layout trocado. Sua caneca e seus elementos foram preservados.');};
 const importLocalFonts=async(files:FileList|null)=>{
  if(!files?.length)return;setBusy(true);
  try{const {fonts,skipped}=await loadBrowserFonts(files);setLocalFonts(before=>[...new Map([...before,...fonts].map(f=>[f.name,f])).values()]);setFontRevision(v=>v+1);
   setNotice(`${fonts.length} fontes carregadas somente neste navegador.${skipped?` ${skipped} arquivos ignorados ou inválidos.`:''} Mantenha os originais para importar novamente.`);
  }catch(e){setNotice(e instanceof Error?e.message:'Não foi possível ler estas fontes.');}finally{setBusy(false)}
 };
 const chooseFont=async(name:string,asset?:Pick<Asset,'id'|'name'|'url'>)=>{
  const session=documentSessionRef.current.capture();
  const targetId=active?.kind==='text'?active.id:null;
  try{
   if(asset){const face=new FontFace(asset.name,`url("${asset.url}")`);await face.load();document.fonts.add(face);}
   else if(isCuratedTypeface(name))await loadCuratedTypeface(name);
   if(!documentSessionRef.current.isCurrent(session))return;
   if(targetId){
    // A fonte pertence ao texto selecionado quando a importação começou.
    if(!stateRef.current.history[stateRef.current.step].nodes.some(n=>n.id===targetId&&n.kind==='text'))return;
    patch(targetId,{font:name});
   }else{addText('Sua frase especial');const selectedId=stateRef.current.history[stateRef.current.step].nodes.at(-1)?.id;if(selectedId)patch(selectedId,{font:name});}
   setNotice(`Fonte ${name} selecionada para sua arte.`);
  }catch{if(documentSessionRef.current.isCurrent(session))setNotice('Não foi possível carregar essa fonte. Confira sua conexão e o arquivo.');}
 };
 const setVideoTemplate=(src:string,name:string)=>{
  update(d=>({...d,background:'transparent',video:{src,name,start:0}}));
  setPreviewSecond(0);setNotice('MP4 aberto. Use a linha do tempo para animar cada elemento. Exportação H.264 local, até 20 segundos, sem áudio.');
 };
 const useAsset=(a:Asset)=>{
  if(a.mimeType==='application/x-clickgruda-template'){
   const captured=stateRef.current.history[stateRef.current.step];
   const request=++templateRequestRef.current;
   void fetch(a.url).then(async r=>{
    if(!r.ok)throw Error('Pacote não encontrado');
    const file=new File([await r.blob()],`${a.name}.cgtemplate`);
    return importSmartTemplate(file,captured);
   }).then(template=>{commitSmartTemplate(request,captured,template);})
    .catch(()=>{if(request===templateRequestRef.current)setNotice('Não foi possível abrir o template inteligente.');});return;
  }
  if(a.mimeType.startsWith('video/')){setVideoTemplate(a.url,a.name);return;}
  if(a.kind==='animation'){setNotice('Animações JSON estão no acervo. A edição e exportação animada não fazem parte desta fase.');return;}
  if(a.kind==='background'){
   void applyTemplate(a.url,'background');
  }else if(a.kind==='template'){
   // Template: preenche o documento por baixo de textos e do mockup existente.
   void applyTemplate(a.url);
  }else if(a.kind==='font'){
   setNotice('Fontes cadastradas são carregadas automaticamente quando publicadas.');
  }else void addImage(a.url);
 };
 const loadAssets=useCallback(async(page:number,append=false)=>{
  const request=++assetsRequestRef.current;
  if(!kind){setAssets([]);setAssetTotal(0);setAssetsLoading(false);setAssetsError(false);return;}
  setAssetsLoading(true);setAssetsError(false);
  try{const q=new URLSearchParams({kind,page:String(page),q:assetQuery});if(panel==='personagens')q.set('category',pngCategory);const res=await fetch(`/api/creative-assets?${q}`,{cache:'no-store'});
   const data=await res.json();if(request!==assetsRequestRef.current)return;
   if(!data.ok)throw new Error(data.error);
   setAssets(prev=>append?[...prev,...data.items]:data.items);setAssetTotal(data.total);setAssetPage(page);setAssetsError(false);
  }catch{if(request===assetsRequestRef.current){setAssets([]);setAssetTotal(0);setNotice('Biblioteca administrativa indisponível; seus arquivos locais continuam funcionando.');setAssetsError(true);}}
  finally{if(request===assetsRequestRef.current)setAssetsLoading(false);}
 },[kind,assetQuery,panel,pngCategory]);
 useEffect(()=>{void loadAssets(1);},[loadAssets]);
 useEffect(()=>{
  const seq=++renderId.current;const canvas=canvasRef.current;if(!canvas)return;
  const work=document.createElement('canvas');
  void drawDesign(work,doc,doc.video?previewSecond:undefined).then(()=>{
   if(seq!==renderId.current)return;
   if(canvas.width!==work.width)canvas.width=work.width;
   if(canvas.height!==work.height)canvas.height=work.height;
   // PNGs/PSDs contêm transparência: drawImage sozinho mantém os pixels da prévia anterior.
  const visibleCtx=canvas.getContext('2d');
  if(visibleCtx){visibleCtx.clearRect(0,0,canvas.width,canvas.height);visibleCtx.drawImage(work,0,0);}
  }).catch(()=>{if(seq===renderId.current)setNotice('Não foi possível renderizar um dos elementos.');});
  return()=>{renderId.current++};
 },[doc,fontRevision,previewSecond,activeTabId]);
 // Handoff: dados binários ficam exclusivamente no IndexedDB do navegador.
 useEffect(()=>{let mounted=true;let initialSession=documentSessionRef.current.capture();void (async()=>{
  try{
   const params=new URLSearchParams(window.location.search);
   const preset=params.get('preset');
   if(preset&&builtInPresets.some(p=>p.id===preset)){
    const d=makeBuiltInPreset(preset as PresetId);
    documentSessionRef.current.replace();
    initialSession=documentSessionRef.current.capture();
    stateRef.current={history:[d],step:0};savedDocumentRef.current=d;setHistory([d]);setStep(0);
   }
   const handoff=params.get('from')==='mockup'?await readHandoff():null;
   // Handoff and links to templates win over the last automatic draft.
   if(!handoff&&!preset&&!params.has('asset')&&mounted){
    const captured=stateRef.current.history[stateRef.current.step],request=projectLoadRef.current;
    try{
     const saved=await readCreativeProject(LOCAL_DRAFT_ID);
     if(saved&&Date.now()-saved.updatedAt<14*24*3600000){
      validateProjectDocument(saved.document);
      if(hasTemporaryMedia(saved.document))throw new Error('O rascunho contém mídias temporárias que não podem ser restauradas.');
      const issues=await inspectProjectMedia(saved.document);
      if(mounted&&canApplyLoadedProject(request,projectLoadRef.current,captured,stateRef.current.history[stateRef.current.step])){
       const broken=issues.filter(issue=>issue.severity==='error');
       if(broken.length)setNotice(`Rascunho automático não restaurado: ${broken.map(issue=>issue.name).join(', ')}. A arte atual foi preservada.`);
       else{
        const d=saved.document;
        documentSessionRef.current.replace();
        stateRef.current={history:[d],step:0};savedDocumentRef.current=d;setHistory([d]);setStep(0);
        setNotice(issues.length?'Rascunho restaurado, mas o vídeo precisa ser reimportado.':'Rascunho deste navegador restaurado.');
       }
      }
     }
    }catch{if(mounted&&canApplyLoadedProject(request,projectLoadRef.current,captured,stateRef.current.history[stateRef.current.step]))setNotice('O rascunho antigo não pôde ser recuperado. A arte atual foi preservada.');}
   }
   if(handoff&&mounted&&documentSessionRef.current.isCurrent(initialSession)){const data=await asDataUrl(handoff);if(mounted&&documentSessionRef.current.isCurrent(initialSession)){
    documentSessionRef.current.replace();
    update(d=>({...d,width:1080,height:1350,background:'#141112'}));await addImage(data,true,'mockup');setPanel('templates');
    // Remove o gatilho da URL para não sobrescrever um rascunho após recarregar.
    params.delete('from');const query=params.toString();
    window.history.replaceState(window.history.state,'',window.location.pathname+(query?'?'+query:'')+window.location.hash);
   }}
  }
  catch{if(mounted)setNotice('Não foi possível recuperar o mockup do Studio. Tente enviar novamente.');}
  const id=new URLSearchParams(window.location.search).get('asset');
  if(id&&mounted){try{const res=await fetch(`/api/creative-assets?assetId=${encodeURIComponent(id)}`);const json=await res.json();if(json.ok&&json.asset?.kind==='template')useAsset(json.asset);}catch{}}
  if(mounted)setDraftReady(true);
 })();return()=>{mounted=false};
 // only once on mount; addImage uses initial document size
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 // Rascunho local temporário, sem requisições à API. Navegador pode apagar dados automaticamente.
 useEffect(()=>{if(!draftReady||hasTemporaryMedia(doc)||activeTabId!=='tab-1')return;const snapshot=doc;const timer=window.setTimeout(()=>{
   void autoDraftQueueRef.current.save(
    ()=>stateRef.current.history[stateRef.current.step]===snapshot,
    async()=>{await saveCreativeProject(snapshot,'Rascunho automático',LOCAL_DRAFT_ID);},
   ).then(committed=>{
    if(committed)savedDocumentRef.current=snapshot;
   }).catch(()=>{/* Quota indisponível: o usuário ainda pode exportar .cgdesign */});
  },4500);return()=>clearTimeout(timer);},[doc,draftReady,activeTabId]);
 // O navegador decide como exibir o aviso. Jamais armazena uma arte sem o usuário saber.
 useEffect(()=>{const beforeUnload=(event:BeforeUnloadEvent)=>{
  const current=stateRef.current.history[stateRef.current.step];
  const unsaved=editorTabsRef.current.some(tab=>{
   const document=tab.id===activeTabRef.current?current:tab.history[tab.step];
   const saved=tab.id===activeTabRef.current?savedDocumentRef.current:tab.saved;
   return document!==saved&&(document.nodes.length>0||Boolean(document.video)||Boolean(document.smartTemplate));
  });
  if(unsaved){event.preventDefault();event.returnValue='';}
 };window.addEventListener('beforeunload',beforeUnload);return()=>window.removeEventListener('beforeunload',beforeUnload);},[]);
 const confirmLeaveEditor=()=>{
  const current=stateRef.current.history[stateRef.current.step];
  const otherPending=editorTabsRef.current.some(tab=>tab.id!==activeTabRef.current&&tab.history[tab.step]!==tab.saved&&tab.history[tab.step].nodes.length>0);
  return !otherPending&&(current===savedDocumentRef.current||(!current.nodes.length&&!current.video&&!current.smartTemplate))||window.confirm('Existem alterações ainda não salvas em uma das abas. Exporte cada arte como .cgdesign antes de sair. Deseja sair mesmo assim?');
 };
 // Catálogo administrativo: o arquivo binário é carregado apenas ao escolher a fonte.
 const [fontAssets,setFontAssets]=useState<Asset[]>([]);
 useEffect(()=>{void fetch('/api/creative-assets?kind=font').then(r=>r.json()).then(d=>setFontAssets((d.items||[]) as Asset[])).catch(()=>{});},[]);
 const addedAdminFonts=useRef(new Set<string>());
 useEffect(()=>{const names=new Set(doc.nodes.filter(x=>x.kind==='text').map(x=>x.font));
  const needed=fontAssets.filter(a=>names.has(a.name)&&!addedAdminFonts.current.has(a.id));
  for(const a of needed){addedAdminFonts.current.add(a.id);void (async()=>{try{const face=new FontFace(a.name,`url("${a.url}")`);await face.load();document.fonts.add(face);setFontRevision(v=>v+1);}catch{addedAdminFonts.current.delete(a.id);}})();}
 },[doc.nodes,fontAssets]);
 const snapshotCurrentTab=()=>{
  const tab=editorTabsRef.current.find(item=>item.id===activeTabRef.current);
  if(tab){tab.history=stateRef.current.history;tab.step=stateRef.current.step;tab.selected=selected;tab.saved=savedDocumentRef.current;}
 };
 const switchEditorTab=(id:string)=>{
  if(id===activeTabRef.current||gesture.current)return;
  snapshotCurrentTab();const destination=editorTabsRef.current.find(tab=>tab.id===id);if(!destination)return;
  ++projectLoadRef.current;++templateRequestRef.current;documentSessionRef.current.replace();
  activeTabRef.current=id;stateRef.current={history:destination.history,step:destination.step};savedDocumentRef.current=destination.saved;
  setHistory(destination.history);setStep(destination.step);setSelected(destination.selected);setEraserMode(false);setSceneDragId(null);setPreviewSecond(0);setActiveTabId(id);
 };
 const newEditorTab=()=>{
  if(editorTabsRef.current.length>=2){setNotice('Limite de duas abas para manter o editor leve.');return;}
  snapshotCurrentTab();const empty=blankDocument();const tab:EditorTab={id:'tab-2',title:'Arte 2',history:[empty],step:0,selected:null,saved:empty};
  editorTabsRef.current.push(tab);setTabRevision(v=>v+1);
  ++projectLoadRef.current;++templateRequestRef.current;documentSessionRef.current.replace();
  activeTabRef.current=tab.id;stateRef.current={history:tab.history,step:0};savedDocumentRef.current=empty;
  setHistory(tab.history);setStep(0);setSelected(null);setEraserMode(false);setSceneDragId(null);setActiveTabId(tab.id);setPanel('uploads');
  setNotice('Segunda aba criada. Importe um PSD ou projeto aqui; copie com Ctrl+C e cole na outra aba com Ctrl+V. Salve cada aba separadamente em .cgdesign.');
 };
 const closeEditorTab=(id:string)=>{
  if(id==='tab-1')return;
  const tab=editorTabsRef.current.find(item=>item.id===id);if(!tab)return;
  const working=id===activeTabRef.current?stateRef.current.history[stateRef.current.step]:tab.history[tab.step];
  const saved=id===activeTabRef.current?savedDocumentRef.current:tab.saved;
  if(working!==saved&&working.nodes.length&&!window.confirm('Esta aba possui alterações ainda não salvas. Fechá-la descartará essa composição. Continuar?'))return;
  if(id===activeTabRef.current)switchEditorTab('tab-1');
  editorTabsRef.current=editorTabsRef.current.filter(t=>t.id!==id);setTabRevision(v=>v+1);
 };
 const copySelected=()=>{
  if(!active){setNotice('Selecione um elemento para copiar.');return;}
  clipboardRef.current={node:{...active},width:doc.width,height:doc.height};setClipboardReady(true);
  setNotice('Elemento copiado. Mude para a outra aba e use Ctrl+V ou Colar.');
 };
 const pasteSelected=()=>{
  const copy=clipboardRef.current;if(!copy){setNotice('Nenhum elemento foi copiado nesta sessão.');return;}
  const factor=Math.min(doc.width/copy.width,doc.height/copy.height,2);
  const original=copy.node;
  const sourceCenterX=(original.x+original.w/2)/copy.width,sourceCenterY=(original.y+original.h/2)/copy.height;
  const w=original.w*factor,h=original.h*factor;
  const node:DesignNode={...original,id:uid(),role:'content',locked:false,x:sourceCenterX*doc.width-w/2+15,y:sourceCenterY*doc.height-h/2+15,w,h,layerName:original.layerName?`${original.layerName} (cópia)`:undefined};
  put(node);setNotice('Elemento colado como camada independente.');
 };
 const cutSelected=()=>{if(!active||active.locked)return;copySelected();remove();};
 const imageLocalPoint=(p:{x:number;y:number},n:DesignNode)=>{
  const cx=n.x+n.w/2,cy=n.y+n.h/2,a=-n.angle*Math.PI/180,dx=p.x-cx,dy=p.y-cy;
  const localX=dx*Math.cos(a)-dy*Math.sin(a),localY=dx*Math.sin(a)+dy*Math.cos(a);
  return {x:clamp((n.flipX?-localX:localX)/n.w+.5,-.5,1.5),y:clamp((n.flipY?-localY:localY)/n.h+.5,-.5,1.5)};
 };
 const cursorPoint=(evt:React.PointerEvent<HTMLElement>)=>{
  const canvas=canvasRef.current;if(!canvas)return {x:0,y:0};
  const r=canvas.getBoundingClientRect();return {x:(evt.clientX-r.left)*doc.width/r.width,y:(evt.clientY-r.top)*doc.height/r.height};
 };
 const startCorner=(evt:React.PointerEvent<HTMLButtonElement>,corner:Corner,n:DesignNode)=>{
  evt.stopPropagation();evt.preventDefault();if(evt.button!==0||n.locked)return;
  const p=cursorPoint(evt);gesture.current={kind:'resize',corner,id:n.id,x:p.x,y:p.y,initial:{...n},before:doc};
  evt.currentTarget.setPointerCapture(evt.pointerId);
 };
 const startRotate=(evt:React.PointerEvent<HTMLButtonElement>,n:DesignNode)=>{
  evt.stopPropagation();evt.preventDefault();if(evt.button!==0||n.locked)return;
  const p=cursorPoint(evt),cx=n.x+n.w/2,cy=n.y+n.h/2;
  gesture.current={kind:'rotate',id:n.id,x:p.x,y:p.y,rotationOrigin:Math.atan2(p.y-cy,p.x-cx),initial:{...n},before:doc};
  evt.currentTarget.setPointerCapture(evt.pointerId);
 };
 const startBezierPoint=(evt:React.PointerEvent<HTMLButtonElement>,point:'s'|'c1'|'c2'|'e',node:DesignNode)=>{
  evt.preventDefault();evt.stopPropagation();if(node.locked)return;
  const p=cursorPoint(evt);gesture.current={kind:'bezier',bezierPoint:point,id:node.id,x:p.x,y:p.y,initial:{...node},before:doc};
  evt.currentTarget.setPointerCapture(evt.pointerId);
 };
 const hit=(x:number,y:number)=>doc.nodes.slice().reverse().find(n=>{
  const cx=n.x+n.w/2,cy=n.y+n.h/2,a=-n.angle*Math.PI/180;
  const dx=x-cx,dy=y-cy,lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a);
  return (canSelectOnCanvas(n)||(sceneDragId===n.id&&n.visible!==false&&!n.locked))&&Math.abs(lx)<n.w/2+12&&Math.abs(ly)<n.h/2+12;
 });
 const down=(evt:React.PointerEvent<HTMLCanvasElement>)=>{
  if(evt.button!==0)return;const p=cursorPoint(evt);
  if(eyedropper){const ctx=canvasRef.current?.getContext('2d',{willReadFrequently:true});if(!ctx)return;const data=ctx.getImageData(Math.round(p.x),Math.round(p.y),1,1).data;if(data[3]<10){setNotice('Selecione uma área com cor para capturar.');return;}const hex='#'+Array.from(data.slice(0,3)).map(v=>v.toString(16).padStart(2,'0')).join('');applyColor(hex,eyedropper);setEyedropper(null);return;}
  if(eraserMode){
   if(!active||active.kind!=='image'||active.locked){setNotice('Selecione uma imagem desbloqueada para usar a borracha.');return;}
   const point=imageLocalPoint(p,active);gesture.current={kind:'erase',id:active.id,x:p.x,y:p.y,initial:{...active},before:doc,erasePoints:[point]};
   evt.currentTarget.setPointerCapture(evt.pointerId);return;
  }
  const n=hit(p.x,p.y);setSelected(n?.id||null);
  if(n&&!n.locked){gesture.current={kind:'move',id:n.id,x:p.x,y:p.y,initial:{...n},before:doc};
   evt.currentTarget.setPointerCapture(evt.pointerId);}
 };
 const move=(evt:React.PointerEvent<HTMLElement>)=>{
  const g=gesture.current;if(!g)return;const p=cursorPoint(evt),dx=p.x-g.x,dy=p.y-g.y;
  const cx=g.initial.x+g.initial.w/2,cy=g.initial.y+g.initial.h/2;
  const resized=g.kind==='resize'?resizeFromCorner(g.initial,g.corner||'se',dx,dy,g.initial.kind==='image'||g.initial.kind==='text'||g.initial.aspectLock!==false):null;
  // Tipografia não pode ser deformada: o corpo da fonte acompanha a escala uniforme.
  const textResize=resized&&g.initial.kind==='text'?{
   size:Math.max(8,(g.initial.size||72)*(resized.w/g.initial.w)),
   curve:(g.initial.curve||0)*(resized.w/g.initial.w),
   wave:(g.initial.wave||0)*(resized.w/g.initial.w),
   tracking:(g.initial.tracking||0)*(resized.w/g.initial.w),
   strokeWidth:(g.initial.strokeWidth||0)*(resized.w/g.initial.w),
   depth:(g.initial.depth||0)*(resized.w/g.initial.w),
  }:{};
  let attrs:Partial<DesignNode>;
  if(g.kind==='move')attrs={x:g.initial.x+dx,y:g.initial.y+dy};
  else if(g.kind==='rotate')attrs={angle:Math.round((g.initial.angle+(Math.atan2(p.y-cy,p.x-cx)-(g.rotationOrigin||0))*180/Math.PI+540)%360-180)};
  else if(g.kind==='bezier'){
   const b=g.initial.bezier||{sx:0,sy:1,c1x:.3,c1y:0,c2x:.7,c2y:1,ex:1,ey:0};
   const a=-g.initial.angle*Math.PI/180,localDx=dx*Math.cos(a)-dy*Math.sin(a),localDy=dx*Math.sin(a)+dy*Math.cos(a);
   const key=g.bezierPoint||'c1';attrs={bezier:{...b,[`${key}x`]:clamp(b[`${key}x` as keyof typeof b]+localDx/g.initial.w,-.5,1.5),[`${key}y`]:clamp(b[`${key}y` as keyof typeof b]+localDy/g.initial.h,-.5,1.5)}};
  }else if(g.kind==='erase'){
   const point=imageLocalPoint(p,g.initial),points=g.erasePoints||[];
   if(points.length<600&&(points.length===0||Math.hypot(point.x-points[points.length-1].x,point.y-points[points.length-1].y)>.001))points.push(point);
   const previous=g.initial.eraserStrokes||[];attrs={eraserStrokes:[...previous.slice(-59),{size:eraserSize,points:[...points]}]};
  }else attrs={...resized,...textResize};
  // O arraste tem uma única etapa no histórico, mesmo com centenas de pointermoves.
  const current=stateRef.current;
  const next=current.history.map((d,i)=>i!==current.step?d:{...d,nodes:d.nodes.map(n=>n.id===g.id?{...n,...attrs}:n)});
  stateRef.current={history:next,step:current.step};setHistory(next);
 };
 const up=()=>{const g=gesture.current;if(!g)return;gesture.current=null;
  const current=stateRef.current;
  const result=current.history[current.step];
  let committed=result;
  if(g.kind==='erase'&&result===g.before){
   const previous=g.initial.eraserStrokes||[];
   committed={...result,nodes:result.nodes.map(n=>n.id===g.id?{...n,eraserStrokes:[...previous.slice(-59),{size:eraserSize,points:g.erasePoints||[{x:.5,y:.5}]}]}:n)};
  }
  if(committed===g.before)return;
  const next=[...current.history.slice(0,current.step),g.before,committed];
  stateRef.current={history:next,step:next.length-1};setHistory(next);setStep(next.length-1);
 };
 const undo=()=>{const state=stateRef.current;const newStep=Math.max(0,state.step-1);stateRef.current={...state,step:newStep};setStep(newStep);setSelected(null)};
 const redo=()=>{const state=stateRef.current;const newStep=Math.min(state.history.length-1,state.step+1);stateRef.current={...state,step:newStep};setStep(newStep);setSelected(null)};
 const resetDocument=()=>{++projectLoadRef.current;documentSessionRef.current.replace();setBusy(false);clearDesignRenderCache();const next=blankDocument();stateRef.current={history:[next],step:0};savedDocumentRef.current=next;setHistory([next]);setStep(0);setSelected(null);setSceneDragId(null);setPanel('backgrounds');setGuides(true);setEyedropper(null);setResetOpen(false);if(activeTabRef.current==='tab-1')void autoDraftQueueRef.current.reset(deleteAutomaticDraft).catch(()=>{setNotice('Arte reiniciada, mas não foi possível apagar o rascunho antigo do navegador.');});setNotice('Projeto reiniciado. Arquivos salvos anteriormente no seu navegador continuam disponíveis em Histórico local.');};
 const refreshLocalProjects=async()=>{try{setLocalProjects((await listCreativeProjects()).filter(p=>p.id!==LOCAL_DRAFT_ID));}catch{setNotice('O histórico local deste navegador está indisponível.');}};
 const openHistory=()=>{setHistoryOpen(true);void refreshLocalProjects()};
 const saveLocal=async()=>{try{const snapshot=hasTemporaryMedia(doc)?await makePortableDocument(doc):doc;const project=await saveCreativeProject(snapshot,`Arte de caneca · ${new Date().toLocaleDateString('pt-BR')}`);if(stateRef.current.history[stateRef.current.step]===doc)savedDocumentRef.current=doc;setNotice('Projeto salvo no navegador. Salve também um .cgdesign para ter uma cópia segura.');}catch(e){setNotice(e instanceof Error?e.message:'Não foi possível salvar no navegador.');}};
 const restoreLocal=async(id:string)=>{
  const captured=stateRef.current.history[stateRef.current.step],request=++projectLoadRef.current;
  setBusy(true);
  try{
   const project=await readCreativeProject(id);if(!project)return;
   const d=project.document;validateProjectDocument(d);
   const issues=await inspectProjectMedia(d);
   if(!canApplyLoadedProject(request,projectLoadRef.current,captured,stateRef.current.history[stateRef.current.step])){setNotice('A composição mudou durante a recuperação. Abra o projeto novamente para não perder suas alterações.');return;}
   const broken=issues.filter(i=>i.severity==='error');
   if(broken.length)throw new Error(`O projeto contém mídias inacessíveis: ${broken.map(i=>i.name).join(', ')}. Reimporte os arquivos antes de continuar.`);
   ++templateRequestRef.current;
   documentSessionRef.current.replace();
   void autoDraftQueueRef.current.reset(deleteAutomaticDraft).catch(()=>{});
   stateRef.current={history:[d],step:0};savedDocumentRef.current=d;setHistory([d]);setStep(0);setSelected(null);setHistoryOpen(false);
   setNotice(issues.length?'Projeto recuperado, mas o vídeo precisa ser reimportado para pré-visualização.':'Projeto do histórico local recuperado.');
  }catch(e){if(request===projectLoadRef.current)setNotice(e instanceof Error?e.message:'Não foi possível recuperar este projeto.');}
  finally{if(request===projectLoadRef.current)setBusy(false);}
 };
 const applyColor=(color:string,target:'background'|'element')=>{if(target==='background')update(d=>({...d,background:color}));else if(active)patch(active.id,active.kind==='image'?{tint:color}:{fill:color});};
 const pickScreenColor=async(target:'background'|'element')=>{
  try{const C=(window as typeof window & {EyeDropper?:new()=>{open:()=>Promise<{sRGBHex:string}>}}).EyeDropper;
    if(C){const sampled=await new C().open();applyColor(sampled.sRGBHex,target);return;}
  }catch{return;}
  setEyedropper(target);setNotice('Clique em um ponto colorido dentro da arte para capturar a cor. Esc cancela.');
 };
 const cropImage=async()=>{
  if(!active||active.kind!=='image'||!active.src||active.locked)return;
  const node=active,session=documentSessionRef.current.capture();
  try{const img=await imageFor(node.src);if(!documentSessionRef.current.isCurrent(session))return;
   const c=node.crop||{left:0,top:0,right:0,bottom:0};
   let sx=img.naturalWidth*c.left,sy=img.naturalHeight*c.top;
   let sw=img.naturalWidth*(1-c.left-c.right),sh=img.naturalHeight*(1-c.top-c.bottom);
   const targetRatio=node.w/node.h,ratio=sw/sh;
   if(ratio>targetRatio){const fitW=sh*targetRatio;sx+=(sw-fitW)/2;sw=fitW;}else{const fitH=sw/targetRatio;sy+=(sh-fitH)/2;sh=fitH;}
   const out=document.createElement('canvas');out.width=Math.max(1,Math.round(sw));out.height=Math.max(1,Math.round(sh));
   out.getContext('2d')?.drawImage(img,sx,sy,sw,sh,0,0,out.width,out.height);
   if(stateRef.current.history[stateRef.current.step].nodes.some(n=>n.id===node.id))patch(node.id,{src:out.toDataURL('image/png'),crop:undefined});
   setNotice('Recorte aplicado. Ctrl+Z recupera a imagem anterior.');
  }catch{setNotice('Não foi possível recortar a imagem selecionada.');}
 };
 const duplicate=()=>{if(!active||active.locked)return;put({...active,id:uid(),x:active.x+36,y:active.y+36});};
 const remove=()=>{if(!selected||active?.locked)return;update(d=>({...d,nodes:d.nodes.filter(n=>n.id!==selected)}));setSelected(null);};
 const layer=(mode:LayerMove)=>{
  if(!active||active.locked)return;
  update(d=>({...d,nodes:reorderNodes(d.nodes,active.id,mode)}));
 };
 const toggleLayer=(id:string,property:'locked'|'visible')=>update(d=>({...d,nodes:d.nodes.map(n=>n.id!==id?n:{...n,[property]:property==='visible'?n.visible===false:!n.locked})}));
 const moveLayerById=(id:string,mode:LayerMove)=>update(d=>({...d,nodes:reorderNodes(d.nodes,id,mode)}));
 const layerLabel=(node:DesignNode,index:number)=>node.layerName||({mockup:'Caneca / Mockup',foreground:'Primeiro plano',background:'Fundo',template:'Template',content:'Elemento'}[node.role||'content'])+` ${index+1}`;
 const mirror=(direction:'horizontal'|'vertical')=>{
  if(!active||active.locked)return;
  const mirrored=mirrorNode(active,direction);
  patch(active.id,direction==='horizontal'?{flipX:mirrored.flipX}:{flipY:mirrored.flipY});
 };
 useEffect(()=>{const key=(e:KeyboardEvent)=>{
  if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||e.target instanceof HTMLSelectElement)return;
  if(e.key==='Escape'){setEyedropper(null);setResetOpen(false);setHistoryOpen(false);return;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey)redo();else undo();}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo();}
  if(e.key==='Delete'||e.key==='Backspace')remove();
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){e.preventDefault();duplicate();}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='c'){e.preventDefault();copySelected();}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='x'){e.preventDefault();cutSelected();}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='v'){e.preventDefault();pasteSelected();}
 };window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
 // callbacks intentionally track the latest state
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[doc,step,selected,history]);
 const loadLayeredDocument=(next:DesignDocument,info:string,expectedSession:number)=>{
  if(!documentSessionRef.current.isCurrent(expectedSession))return false;
  const current=stateRef.current.history[stateRef.current.step];
  if(current.nodes.length&&!window.confirm('A importação substituirá a composição atual. Você poderá desfazer com Ctrl+Z. Continuar?'))return false;
  if(!documentSessionRef.current.isCurrent(expectedSession))return false;
  documentSessionRef.current.replace();
  update(()=>next);setSelected(null);setNotice(info);
  return true;
 };
 const readMask=async(file?:File)=>{if(!file||!active||active.kind!=='image')return;
  const session=documentSessionRef.current.capture();const targetId=active.id;
  try{const src=await readLocalAsset(file);
   if(!documentSessionRef.current.isCurrent(session))return;
   const target=stateRef.current.history[stateRef.current.step].nodes.find(n=>n.id===targetId&&n.kind==='image');
   if(!target)return;
   patch(targetId,{maskSrc:src,maskMode:target.maskMode||'luminance',maskInvert:target.maskInvert??false,maskSpace:'element'});setNotice('Máscara aplicada localmente. Escolha o modo branco/preto ou transparência nos controles do objeto.');}
  catch(e){if(documentSessionRef.current.isCurrent(session))setNotice(e instanceof Error?e.message:'Máscara inválida');}
  finally{if(maskRef.current)maskRef.current.value='';}
 };
 const upload=async(files:FileList|null)=>{
  if(!files?.length)return;
  let session=documentSessionRef.current.capture();
  setBusy(true);try{
   for(const file of Array.from(files).slice(0,8)){
    if(!documentSessionRef.current.isCurrent(session))break;
    if(/\.pdf$/i.test(file.name)){
     // Conta páginas sem renderizar a primeira em alta resolução desnecessariamente.
     const pages=await inspectPdfPageCount(file);
     let page=1;
     if(pages>1){const answer=window.prompt(`PDF com ${pages} páginas. Qual página deseja editar? (1–${pages})`, '1');
      if(answer===null)continue;
      page=Number(answer);
      if(!Number.isInteger(page)||page<1||page>pages)throw new Error('Número de página PDF inválido');
     }
     const extracted=await importPdfEditable(file,page);
     if(loadLayeredDocument(extracted.document,`PDF: ${extracted.count} trechos de texto separados. ${extracted.warning}`,session))session=documentSessionRef.current.capture();
    }else if(/\.psd$/i.test(file.name)){
     const extracted=await importPsdLayers(file);
     if(loadLayeredDocument(extracted.document,`PSD: ${extracted.count} camadas raster móveis. ${extracted.warning}`,session))session=documentSessionRef.current.capture();
    }else if(/\.cgtemplate$/i.test(file.name)){
     const captured=stateRef.current.history[stateRef.current.step];
     const request=++templateRequestRef.current;
     const template=await importSmartTemplate(file,captured);
     commitSmartTemplate(request,captured,template);
    }else if(/\.mp4$/i.test(file.name)){
     if(file.size>30*1024*1024)throw new Error('Vídeo acima de 30 MB; otimize o MP4 antes de importar.');
     const src=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Vídeo inválido'));reader.readAsDataURL(file)});
     if(documentSessionRef.current.isCurrent(session))setVideoTemplate(src,file.name);
    }else{const src=await readLocalAsset(file);await addImage(src,true,'content',session);}
   }
  }catch(e){if(documentSessionRef.current.isCurrent(session))setNotice(e instanceof Error?e.message:'Falha ao importar arquivo');}finally{setBusy(false);if(fileRef.current)fileRef.current.value='';}
 };
 const checkVideoCompatibility=async()=>{
  if(!doc.video)return;
  videoCheckAbort.current?.abort();
  const controller=new AbortController();videoCheckAbort.current=controller;
  setVideoChecking(true);setVideoDiagnostic(null);
  try{
   const {probeVideoExport}=await import('@/lib/creative/video-templates');
   const result=await probeVideoExport(doc,controller.signal,{preset:videoPreset,fps:videoFps});
   if(controller.signal.aborted)return;
   const details=`${result.width} × ${result.height}, ${result.fps} fps, ${result.codec}. ${result.sourceWidth} × ${result.sourceHeight}; ${(result.end-result.start).toFixed(1)} s (${result.frameCount} ${language==='en'?'frames':language==='es'?'fotogramas':'quadros'}).`;
   setVideoDiagnostic(`${t('Compatibilidade inicial confirmada')}: ${details} ${t('A exportação completa depende também da memória e do hardware.')}`);
  }catch(e){if(!controller.signal.aborted)setVideoDiagnostic(`${t('Verificação não passou')}: ${e instanceof Error?e.message:t('Falha desconhecida')}`)}
  finally{if(videoCheckAbort.current===controller){videoCheckAbort.current=null;setVideoChecking(false)}}
 };
 const doVideoExport=async()=>{
  if(!doc.video)return;
  setBusy(true);setVideoProgress(0);videoAbort.current=new AbortController();
  try{const {inspectVideoExport,renderMp4Template}=await import('@/lib/creative/video-templates');
   const settings=inspectVideoExport(doc,videoFps,videoPreset);
   setNotice(`Preparando MP4 ${settings.width} × ${settings.height} · ${settings.fps} fps · máximo de ${settings.maxDuration}s · sem áudio. Exportação local no navegador.`);
   const blob=await renderMp4Template(doc,setVideoProgress,videoAbort.current.signal,{preset:videoPreset,fps:videoFps});saveBlob(blob,`click-gruda-template-${settings.width}x${settings.height}-${settings.fps}fps.mp4`);setExportOpen(false);
  }catch(e){setNotice(e instanceof Error?e.message:'Não foi possível exportar o MP4');}finally{videoAbort.current=null;setBusy(false);setVideoProgress(null)}
 };
 const doExport=async()=>{
  setBusy(true);try{const blob=await exportDesign(doc,format,scale,mirrorPrint);saveBlob(blob,`click-gruda-criativo-${doc.width*scale}x${doc.height*scale}${mirrorPrint?'-espelhado':''}.${format==='jpeg'?'jpg':format}`);setExportOpen(false);}
  catch(e){setNotice(e instanceof Error?e.message:'Erro ao exportar');}finally{setBusy(false);}
 };
 const saveProject=async()=>{setBusy(true);try{const blob=await createPortableProjectBlob(doc);saveBlob(blob,'meu-projeto-clickgruda.cgdesign');if(stateRef.current.history[stateRef.current.step]===doc)savedDocumentRef.current=doc;setNotice('Backup portátil gerado neste navegador, com imagens e vídeos incorporados.');}catch(e){setNotice(e instanceof Error?e.message:'Não foi possível criar o backup portátil.');}finally{setBusy(false);}};
 const readProject=async(file?:File)=>{
  if(!file)return;
  const current=stateRef.current.history[stateRef.current.step];
  if((current.nodes.length>0||current.video||current.smartTemplate)&&!window.confirm('Abrir outro projeto substituirá sua arte atual. Exporte um .cgdesign se quiser preservá-la. Continuar?')){if(projectRef.current)projectRef.current.value='';return;}
  const captured=current,request=++projectLoadRef.current;
  setBusy(true);
  try{
   if(file.size>45*1024*1024)throw new Error('Projeto excede 45 MB');
   const json=JSON.parse(await file.text());
   if(json.format!=='cgdesign'||json.version!==1||!json.document||!Array.isArray(json.document.nodes))throw new Error('Arquivo de projeto incompatível');
   const d=json.document as DesignDocument;
   validateProjectDocument(d);
   if(hasTemporaryMedia(d))throw new Error('Este .cgdesign contém referências temporárias de outra sessão. Reimporte as mídias originais ou abra um backup portátil atualizado.');
   const issues=await inspectProjectMedia(d);
   if(!canApplyLoadedProject(request,projectLoadRef.current,captured,stateRef.current.history[stateRef.current.step])){setNotice('A arte mudou durante a importação. Selecione novamente o arquivo para preservar seu trabalho.');return;}
   const broken=issues.filter(i=>i.severity==='error');
   if(broken.length)throw new Error(`Não foi possível abrir: ${broken.map(i=>i.name).join(', ')}. O projeto atual foi preservado.`);
   ++templateRequestRef.current;
   documentSessionRef.current.replace();
   void autoDraftQueueRef.current.reset(deleteAutomaticDraft).catch(()=>{});
   stateRef.current={history:[d],step:0};savedDocumentRef.current=d;setHistory([d]);setStep(0);setSelected(null);
   setNotice(issues.length?'Projeto aberto. O vídeo não pôde ser pré-visualizado neste navegador.':'Projeto carregado localmente.');
  }catch(e){if(request===projectLoadRef.current)setNotice(e instanceof Error?e.message:'Não foi possível abrir o projeto.');}
  finally{if(request===projectLoadRef.current)setBusy(false);if(projectRef.current)projectRef.current.value='';}
 };
 const resize=useCallback(()=>{const el=zoneRef.current;if(!el)return;const width=el.clientWidth-40,height=el.clientHeight-40;
  setZoom(Math.min(1.25,Math.max(.08,Math.min(width/doc.width,height/doc.height))));},[doc.width,doc.height]);
 useEffect(()=>{resize();const observer=new ResizeObserver(resize);if(zoneRef.current)observer.observe(zoneRef.current);return()=>observer.disconnect();},[resize]);
 return <div className="cg-creative">
  <header className="cr-head"><Link href="/" className="cr-mark" onClick={e=>{if(!confirmLeaveEditor())e.preventDefault();}}><ArrowLeft size={17}/><span>Click <b>&</b> Gruda</span></Link><span className="cr-separator"/><div className="cr-head-title"><strong>STUDIO CLICK <span className="cr-brand-small">/ EDITOR 2D</span></strong><small><span className="cr-status-dot"/>{draftReady?'Rascunho local · salve seu projeto':'Recuperando rascunho local'}</small></div>
   <div className="cr-head-actions"><button onClick={()=>setShowAgent(v=>!v)} title="Assistente de sublimação"><BookOpen size={16}/> Ajuda</button><button onClick={undo} disabled={step===0} title="Desfazer (Ctrl+Z) · sem limite fixo de etapas enquanto a aba permanecer aberta"><Undo2 size={18}/></button><button onClick={redo} disabled={step>=history.length-1} title="Refazer (Ctrl+Y)"><Redo2 size={18}/></button><span className="cr-separator"/>
    {hasTemporaryMedia(doc)&&<span role="status" title="Mídia temporária no navegador: faça um backup .cgdesign para preservá-la. O rascunho automático não inclui vídeos blob:." style={{fontSize:11,color:'#ffb868',maxWidth:160}}>Mídia temporária · faça backup</span>}
    <button onClick={()=>setResetOpen(true)} className="cr-reset-action" title="Reinicia a arte com confirmação"><RotateCcw size={16}/><span>{t('Resetar projeto')}</span></button><button onClick={openHistory}><History size={16}/><span>{t('Histórico local')}</span></button><button onClick={()=>void saveLocal()} title="Salvar temporariamente neste navegador"><Save size={16}/><span>{t('Salvar no navegador')}</span></button><button onClick={()=>projectRef.current?.click()}><FolderOpen size={16}/><span>{t('Abrir projeto')}</span></button><button onClick={()=>void saveProject()} disabled={busy} title="Criar backup portátil com os arquivos do projeto"><Download size={16}/><span>.cgdesign</span></button><button className="cr-primary" onClick={()=>setExportOpen(true)}><Download size={17}/> Exportar</button>{doc.video&&<button title="Configurar e exportar MP4 H.264 local (720p ou Full HD; até 20 segundos e sem áudio)" onClick={()=>setExportOpen(true)} disabled={busy}><Download size={16}/> {videoProgress!==null?`${videoProgress}%`:'MP4'}</button>}{videoProgress!==null&&<button onClick={()=>videoAbort.current?.abort()} title="Interromper renderização do vídeo">Cancelar MP4</button>}</div>
  </header>
  <div className="cr-editor-tabs" role="tablist" aria-label="Artes abertas">
   {editorTabsRef.current.map(tab=><div className="cr-editor-tab-wrap" key={tab.id}>
    <button role="tab" aria-selected={activeTabId===tab.id} className={`cr-editor-tab ${activeTabId===tab.id?'active':''}`} onClick={()=>switchEditorTab(tab.id)}><Layers2 size={15}/>{tab.title}<small>{tab.id===activeTabId?doc.nodes.length:tab.history[tab.step].nodes.length} camadas</small></button>
    {tab.id!=='tab-1'&&<button className="cr-tab-close" aria-label="Fechar segunda aba" title="Fechar segunda aba" onClick={()=>closeEditorTab(tab.id)}><X size={15}/></button>}
   </div>)}
   {clipboardReady&&<button className="cr-new-tab" onClick={pasteSelected} title="Colar elemento copiado na aba atual"><ClipboardPaste size={15}/> Colar</button>}
   {editorTabsRef.current.length<2&&<button className="cr-new-tab" onClick={newEditorTab} title="Abrir segunda arte (máximo duas abas)"><Plus size={16}/> Nova aba</button>}
   <span className="cr-tab-hint">{clipboardReady?'Ctrl+C / Ctrl+V entre abas':'Máximo de 2 abas para melhor desempenho'}</span>
  </div>
  <div className="cr-shell"><nav className="cr-rail" aria-label="Ferramentas">
   {([['templates','Layouts',Layers3],['layers','Camadas',Layers2],['elements','Elementos',Shapes],['personagens','Acervo PNG',Users],['texts','Textos',Type],['backgrounds','Fundos',ImagePlus],['uploads','Uploads',Upload],['icons','Ícones',Sticker],['objects','Objetos',ObjectsIcon],['effects','Efeitos',Sparkles]] as const).map(([id,label,Icon])=><button key={id} aria-current={panel===id?'page':undefined} onClick={()=>setPanel(id)}><Icon size={21}/><small>{t(label)}</small></button>)}
  </nav><aside className="cr-left"><details className="cr-responsive-panel" open><summary className="cr-responsive-summary">Acervo e ferramentas</summary><div className="cr-panel-head"><h2>{t(panel==='templates'?'Templates':panel==='layers'?'Camadas':panel==='elements'?'Elementos':panel==='texts'?'Tipografia':panel==='backgrounds'?'Fundos':panel==='personagens'?'Acervo PNG':panel==='icons'?'Biblioteca de Ícones':panel==='objects'?'Objetos Vetoriais':panel==='effects'?'Filtros & Efeitos':'Seus arquivos')}</h2><span>{t('CRIAR COM LIBERDADE')}</span></div>
   {kind&&<><div className="cr-search"><Search size={16}/><input placeholder="Buscar no acervo..." value={assetQuery} onChange={e=>setAssetQuery(e.target.value)}/></div>
    {panel==='templates'&&<><div className="cr-feature" role="note"><Sparkles size={18}/><div><strong>{t('Comece por um layout')}</strong><p>{t('Escolha um dos 4 layouts editáveis ou use templates publicados pelo admin.')}</p></div></div>
    <div className="cr-feature" role="note"><Layers3 size={18}/><div><strong>Template inteligente · máscaras e profundidade</strong><p>Importe um pacote .cgtemplate pela aba Uploads ou experimente o modelo demonstrativo. Sua caneca permanece independente.</p><button type="button" className="cr-primary" onClick={()=>{const captured=stateRef.current.history[stateRef.current.step];const request=++templateRequestRef.current;void fetch('/templates/template-inteligente-demonstracao.cgtemplate').then(async r=>{if(!r.ok)throw Error('Template indisponível');return importSmartTemplate(new File([await r.blob()],'demonstracao.cgtemplate'),captured)}).then(a=>{commitSmartTemplate(request,captured,a)}).catch(()=>{if(request===templateRequestRef.current)setNotice('Não foi possível abrir a demonstração.')});}}>Experimentar template com máscara</button></div></div><p className="cr-section-label">{t('LAYOUTS EDITÁVEIS INCLUSOS')}</p><div className="cr-preset-list">{builtInPresets.map(p=><button key={p.id} onClick={()=>applyPreset(p.id)}><span className={`cr-preset-thumb ${p.id}`}>{p.name}</span><span><strong>{p.name}</strong><small>{p.description}</small></span></button>)}</div></>}
    {panel==='backgrounds'&&<><p className="cr-section-label">{t('FUNDOS PRONTOS SEM TEXTO · PARA SUBLIMAÇÃO')}</p><div className="cr-background-grid">{backgroundKits.map(b=><button key={b.id} title={b.name} onClick={()=>void applyTemplate(backgroundSvg(b.id,doc.width,doc.height),'background')}><span style={{background:`linear-gradient(130deg,${b.a},${b.b} 68%,${b.c})`}}/><small>{b.name}</small></button>)}</div><p className="cr-section-label">{t('CORES & TRANSPARÊNCIA')}</p><div className="cr-background-custom"><label>{t('Cor do fundo')} <input type="color" value={doc.background==='transparent'?'#ffffff':doc.background} onChange={e=>update(d=>({...d,background:e.target.value}))}/></label><button type="button" onClick={()=>void pickScreenColor('background')}><Pipette size={16}/> {t('Conta-gotas')}</button></div><div className="cr-colors">{backgroundPresets.map(c=><button key={c} title={c} aria-label={`Fundo ${c}`} onClick={()=>update(d=>({...d,background:c}))} className={doc.background===c?'active':''} style={{background:c==='transparent'?'conic-gradient(#eee 25%,#ccc 0 50%,#eee 0 75%,#ccc 0) 0 0/20px 20px':c}}/>)}</div></>}
    {panel==='personagens'&&<div className="cr-png-intro"><span className="cr-png-eyebrow">BIBLIOTECA ILUSTRADA</span><strong>Seu próximo detalhe está aqui.</strong><p>Explore personagens, alfabetos, ilustrações e PNGs publicados no acervo.</p><div className="cr-category-tabs cr-png-categories" role="group" aria-label="Categorias do Acervo PNG">{pngCategories.map(category=><button type="button" key={category} aria-pressed={pngCategory===category} className={pngCategory===category?'active':''} onClick={()=>setPngCategory(category)}>{category}</button>)}</div></div>}<p className="cr-section-label">{t('ACERVO ADMINISTRATIVO')} · {assetTotal} ITENS</p><div className="cr-assets" aria-busy={assetsLoading}>{assetsLoading&&<div className="cr-skeleton-grid" role="status" aria-label="Carregando materiais do acervo">{Array.from({length:6},(_,i)=><div key={i} className="cr-skeleton-item"><span/><small/></div>)}</div>}{!assetsLoading&&!assetsError&&assets.map(a=><button key={a.id} title={a.name} onClick={()=>useAsset(a)} className="cr-asset">{a.mimeType.startsWith('image/')?<img src={a.url} alt="" loading="lazy"/>:<div className="cr-asset-generic">{initials(a.name)}</div>}<span>{a.name}</span></button>)}
    {assetsError&&<div className="cr-empty cr-library-empty"><AlertTriangle size={28}/><strong>Não foi possível abrir o acervo</strong><span>Confira sua conexão e tente novamente. Seus arquivos locais continuam disponíveis.</span><button type="button" className="cr-outlined" onClick={()=>void loadAssets(1)}>Tentar novamente</button></div>}{!assetsLoading&&!assetsError&&!assets.length&&<div className="cr-empty cr-library-empty"><ImagePlus size={28}/><strong>{assetQuery?'Nenhum resultado para sua busca':'Ainda não há materiais nesta categoria'}</strong><span>{assetQuery?'Tente outro termo de pesquisa.':'Novos materiais publicados no catálogo aparecerão aqui automaticamente. Você também pode importar seus próprios arquivos em Uploads.'}</span></div>}
    </div>{!assetsLoading&&!assetsError&&assets.length<assetTotal&&<button className="cr-outlined" onClick={()=>void loadAssets(assetPage+1,true)}>{t('Carregar mais')}</button>}</>}
   {panel==='layers'&&<div className="cr-layer-panel">
    <div className="cr-feature"><Layers2 size={18}/><div><strong>{t('Camadas da composição')}</strong><p>{t('Selecione a caneca, o primeiro plano ou o fundo. Olho: ocultar sem apagar. Cadeado: proteger contra alterações.')}</p></div></div>
    <div className="cr-layer-list" role="list" aria-label="Camadas da composição (frente para trás)">
     {doc.nodes.length===0&&<div className="cr-empty">Adicione uma caneca, texto, fundo ou personagem para começar.</div>}
     {[...doc.nodes].reverse().map((node,reverseIndex)=><div role="listitem" className={`cr-layer-item ${selected===node.id?'active':''} ${node.visible===false?'hidden-layer':''}`} key={node.id}>
      <button type="button" className="cr-layer-select" aria-pressed={selected===node.id} title="Selecionar esta camada" onClick={()=>{setSelected(node.id);setSceneDragId(null)}}><span>{node.kind==='text'?'T':node.kind==='image'?'◧':'▣'}</span><strong>{layerLabel(node,doc.nodes.length-reverseIndex-1)}</strong><small>{node.role==='mockup'?'Mockup':node.kind==='text'?'Texto':node.role==='foreground'?'Primeiro plano':node.role==='background'?'Fundo':node.kind==='image'?'Imagem':'Forma'}</small></button>
      <div className="cr-layer-tools">
       <button type="button" aria-label={node.visible===false?'Mostrar camada':'Ocultar camada'} title={node.visible===false?'Mostrar':'Ocultar'} onClick={()=>toggleLayer(node.id,'visible')}>{node.visible===false?<EyeOff size={15}/>:<Eye size={15}/>}</button>
       <button type="button" aria-label={node.locked?'Desbloquear camada':'Bloquear camada'} title={node.locked?'Desbloquear':'Bloquear'} onClick={()=>toggleLayer(node.id,'locked')}>{node.locked?<Lock size={15}/>:<Unlock size={15}/>}</button>
       <button type="button" aria-label="Subir uma camada" title="Subir" disabled={reverseIndex===0} onClick={()=>moveLayerById(node.id,'forward')}><ChevronUp size={15}/></button>
       <button type="button" aria-label="Descer uma camada" title="Descer" disabled={reverseIndex===doc.nodes.length-1} onClick={()=>moveLayerById(node.id,'backward')}><ChevronDown size={15}/></button>
      </div>
     </div>)}
    </div>
    {active&&['foreground','background'].includes(active.role||'')&&!active.locked&&active.visible!==false&&<button type="button" className={`cr-scene-drag ${sceneDragId===active.id?'active':''}`} onClick={()=>setSceneDragId(v=>v===active.id?null:active.id)}>{sceneDragId===active.id?'Concluir movimento do cenário':'Mover esta camada de cenário no palco'}</button>}
    <p className="cr-helper">{t('Camadas ocultas não aparecem na exportação. Selecione fundo e primeiro plano aqui, mesmo quando ocuparem a tela inteira.')}</p>
   </div>}
   {panel==='texts'&&<><div className="cr-text-shortcuts"><button onClick={()=>addText('Seu título aqui')}>+ Título</button><button onClick={()=>addText('Feliz aniversário')}>+ Mensagem</button></div><FontLibrary assets={fontAssets} localFonts={localFonts} onImport={files=>void importLocalFonts(files)} onChoose={(name,asset)=>void chooseFont(name,asset)}/></>}
   {panel==='elements'&&<div className="cr-shapes"><button onClick={()=>addShape('rect')}><RectangleHorizontal size={32}/>Retângulo</button><button onClick={()=>addShape('circle')}><Circle size={32}/>Elipse</button><button onClick={addBezier}><PenTool size={32}/>Curva Bézier</button></div>}
   {panel==='icons'&&<><div className="cr-asset-color"><span>{t('COR DOS ÍCONES')}</span><input type="color" value={assetColor} onChange={e=>setAssetColor(e.target.value)}/></div><StockLibrary kind="icons" color={assetColor} add={src=>addImage(src)}/></>}
   {panel==='objects'&&<><div className="cr-asset-color"><span>{t('COR DOS OBJETOS')}</span><input type="color" value={assetColor} onChange={e=>setAssetColor(e.target.value)}/></div><StockLibrary kind="objects" color={assetColor} add={src=>addImage(src)}/></>}
   {panel==='effects'&&<div className="cr-effect-presets"><p className="cr-helper">Selecione uma imagem ou texto. Os efeitos serão aplicados no elemento escolhido, sem alterar o arquivo original.</p>{[
    {name:'Foto nítida', description:'Contraste e saturação equilibrados', properties:{brightness:103,contrast:113,saturation:108,blur:0,grayscale:0,sepia:0}},
    {name:'Vibrante', description:'Cores fortes para estampas',properties:{brightness:106,contrast:117,saturation:145,blur:0,grayscale:0,sepia:0}},
    {name:'Vintage', description:'Tom quente com toque retrô',properties:{brightness:100,contrast:97,saturation:90,sepia:38,hue:-7}},
    {name:'Preto & branco', description:'Monocromático com alto contraste',properties:{brightness:106,contrast:120,saturation:0,grayscale:100,sepia:0}},
    {name:'Sombra premium',description:'Profundidade suave e deslocamento',properties:{shadow:45,shadowX:10,shadowY:23,shadowColor:'#161016'}},
    {name:'Sombra intensa',description:'Destaque visual para objetos',properties:{shadow:74,shadowX:15,shadowY:32,shadowColor:'#050505'}},
    {name:'Resetar efeitos',description:'Voltar ao acabamento neutro',properties:{brightness:100,contrast:100,saturation:100,blur:0,grayscale:0,sepia:0,hue:0,shadow:0,shadowX:0,shadowY:0}}
   ].map(p=><button key={p.name} disabled={!active} onClick={()=>active&&patch(active.id,p.properties)}><Sparkles size={16}/><span><strong>{p.name}</strong><small>{p.description}</small></span></button>)}</div>}
   {panel==='personagens'&&<p className="cr-helper"><ShieldCheck size={16}/>Para organizar seus PNGs, publique-os no Admin como <b>Elementos</b> nas categorias Personagens, Alfabetos, Ilustrações, Avulsos ou PNGs. Utilize somente arquivos com direito de uso.</p>}
   {panel==='uploads'&&<div className="cr-upload"><ImagePlus size={28}/><h3>{t('Seus arquivos, seu navegador')}</h3><p className="cr-privacy-note"><ShieldCheck size={18}/> PRIVACIDADE: o upload NÃO vai para o servidor. Sua composição fica temporariamente no navegador até você exportar ou apagar; o navegador pode limpar o armazenamento sem aviso.</p><p>PNG, JPEG/JFIF, SVG, WebP, AVIF, BMP, GIF (primeiro quadro), PDF com extração aproximada de textos, PSD RGB/8 bits com camadas raster, template inteligente .cgtemplate e vídeo MP4 (até 30 MB). Todo arquivo permanece neste navegador.</p><button className="cr-primary" onClick={()=>fileRef.current?.click()}><Plus size={16}/>{t('Adicionar imagens')}</button><small>PDF e PSD têm limitações: efeitos e fontes podem não ser reproduzidos. Antes de imprimir, confira cada camada.</small></div>}
  </details></aside>
  <main className="cr-canvas-shell"><div className="cr-canvas-top"><div><span className="cr-dot"/> Editor de Sublimação de Canecas <span className="cr-micro">{doc.width} × {doc.height} px</span></div><div className="cr-canvas-actions">{doc.video&&<><span title="Segundos de início para o MP4">Início <input type="number" min={0} max={600} step={.5} style={{width:62}} value={doc.video.start} onChange={e=>update(d=>({...d,video:d.video?{...d.video,start:Math.max(0,Number(e.target.value))}:undefined}))}/></span><span title="Segundo final opcional; até 20 segundos de exportação">Fim <input type="number" min={0} max={600} step={.5} style={{width:62}} value={doc.video.end??0} onChange={e=>update(d=>({...d,video:d.video?{...d.video,end:Number(e.target.value)||undefined}:undefined}))}/></span><label title="Como enquadrar o vídeo no template" style={{display:'inline-flex',alignItems:'center',gap:6}}>Enquadramento <select aria-label="Enquadramento do vídeo" value={doc.video.fit||'cover'} onChange={e=>update(d=>({...d,video:d.video?{...d.video,fit:e.target.value as 'cover'|'contain'}:undefined}))}><option value="cover">Preencher (cortar bordas)</option><option value="contain">Mostrar inteiro</option></select></label><button onClick={()=>update(d=>({...d,video:undefined,background:'#ffffff'}))}>Remover vídeo</button></>}<select aria-label="Formato do documento" value={`${doc.width}x${doc.height}`} onChange={e=>{const f=formats.find(f=>`${f.w}x${f.h}`===e.target.value);if(f)update(d=>({...d,width:f.w,height:f.h}));}}>{formats.map(f=><option key={f.label} value={`${f.w}x${f.h}`}>{f.label}</option>)}</select><button onClick={()=>setGuides(v=>!v)} title="Mostrar/ocultar área segura (não sai na exportação)" className="cr-guides-pulse" aria-pressed={guides}><Eye size={16}/> Guias</button><button onClick={resize} title="Encaixar na tela"><Maximize size={16}/></button></div></div>
   {doc.video&&<div className="cr-motion-timeline"><span>LINHA DO TEMPO</span><button type="button" onClick={()=>{if(!videoRef.current)return;if(videoRef.current.paused)void videoRef.current.play();else videoRef.current.pause();}} aria-label="Reproduzir ou pausar vídeo">▶ / II</button><input aria-label="Posição do vídeo em segundos" type="range" min={0} max={Math.min(20,Math.max(.5,(doc.video.end??20)-(doc.video.start||0)))} step={.1} value={Math.min(previewSecond,Math.min(20,Math.max(.5,(doc.video.end??20)-(doc.video.start||0))))} onChange={e=>{const second=Number(e.target.value);setPreviewSecond(second);if(videoRef.current){videoRef.current.pause();videoRef.current.currentTime=(doc.video?.start||0)+second;}}}/><output>{previewSecond.toFixed(1)}s</output><small>Selecione um objeto para animar posição, escala e opacidade.</small></div>}
   <div className="cr-canvas-zone" ref={zoneRef}><div className="cr-stage" style={{width:doc.width*zoom,height:doc.height*zoom}}>{doc.video&&<video ref={videoRef} key={doc.video.src} className="cr-video-preview" style={{objectFit:doc.video.fit==='contain'?'contain':'cover',background:'#ffffff'}} src={doc.video.src} autoPlay muted loop playsInline preload="metadata" onLoadedMetadata={e=>{const start=doc.video?.start||0;if(start>0&&start<e.currentTarget.duration)e.currentTarget.currentTime=start;}} onTimeUpdate={e=>{const el=e.currentTarget;const start=doc.video?.start||0;const end=Math.min(el.duration,doc.video?.end??el.duration,start+20);if(end>start&&el.currentTime>=end){el.currentTime=Math.min(start,Math.max(0,el.duration-.1));return;}setPreviewSecond(Math.max(0,el.currentTime-start));}}/>}
    <canvas ref={canvasRef} style={{width:'100%',height:'100%',cursor:eraserMode?'crosshair':'grab'}} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} aria-label="Tela de criação: selecione, arraste e redimensione os elementos pelo canto inferior direito"/>
    {guides&&doc.width===2480&&doc.height===1122&&<div className="cr-print-guides" aria-hidden="true" style={{left:Math.round((doc.width-2244)/2)*zoom,top:Math.round((doc.height-1004)/2)*zoom,width:2244*zoom,height:1004*zoom}}><span>ÁREA VISÍVEL · 19 × 8,5 cm</span></div>}
    {active&&active.visible!==false&&!active.locked&&<div className="cr-selection" style={{left:active.x*zoom,top:active.y*zoom,width:active.w*zoom,height:active.h*zoom,transform:`rotate(${active.angle}deg)`}}>{(['nw','ne','sw','se'] as Corner[]).map(c=><button key={c} type="button" className={`cr-handle cr-handle-${c}`} aria-label={`Redimensionar ${c} com proporção preservada`} title="Arraste para diminuir ou aumentar mantendo as proporções" onPointerDown={e=>startCorner(e,c,active)} onPointerMove={move} onPointerUp={up} onPointerCancel={up}/>)}<button type="button" className="cr-rotate-handle" title="Arraste para girar livremente" aria-label="Girar objeto com o mouse" onPointerDown={e=>startRotate(e,active)} onPointerMove={move} onPointerUp={up} onPointerCancel={up}><RotateCw size={17}/></button>
    {active.kind==='bezier'&&Object.entries({s:[active.bezier?.sx??0,active.bezier?.sy??1],c1:[active.bezier?.c1x??.25,active.bezier?.c1y??0],c2:[active.bezier?.c2x??.75,active.bezier?.c2y??1],e:[active.bezier?.ex??1,active.bezier?.ey??0]}).map(([key,pos])=><button key={key} type="button" className="cr-bezier-handle" style={{left:`${pos[0]*100}%`,top:`${pos[1]*100}%`}} title={`Mover ponto ${key} da curva Bézier`} aria-label={`Mover ponto Bézier ${key}`} onPointerDown={e=>startBezierPoint(e,key as 's'|'c1'|'c2'|'e',active)} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>{key}</button>)}
   </div>}
   </div></div><div className="cr-bottom"><span>{eyedropper?'CONTA-GOTAS ATIVO · clique em uma cor na tela (Esc cancela)':'Arraste cantos para redimensionar · alça circular para girar · Ctrl+Z desfaz'}</span><span>Visualização {Math.round(zoom*100)}%</span></div>
  </main>
  <aside className="cr-inspector"><details className="cr-responsive-panel" open><summary className="cr-responsive-summary">Propriedades da arte</summary><div className="cr-panel-head"><h2>{t('Propriedades')}</h2><span>{t('AJUSTES DE PRECISÃO')}</span></div>
  {!active?<div className="cr-hint"><WandSparkles size={26}/><h3>{t('Personalize cada detalhe')}</h3><p>{t('Clique em um elemento na arte para ajustar tamanho, posição, cores, efeitos e sombras.')}</p><p>{t('Para começar, adicione um texto, imagem ou template no painel esquerdo.')}</p></div>:<div className="cr-properties">
   <div className="cr-edit-actions"><button onClick={copySelected} title="Copiar elemento selecionado para outra aba"><Copy size={14}/> Copiar</button><button onClick={cutSelected} disabled={!!active.locked} title="Recortar camada para colar"><Scissors size={14}/> Recortar</button><button onClick={pasteSelected} disabled={!clipboardReady} title="Colar camada copiada"><ClipboardPaste size={14}/> Colar</button><button onClick={remove} disabled={!!active.locked} title="Apagar camada"><Trash2 size={14}/> Apagar</button></div><div className="cr-selected-bar"><span>{active.kind==='text'?'Texto':active.kind==='image'?'Imagem':'Forma'}</span><div><button title={active.locked?"Desbloquear camada":"Bloquear camada"} onClick={()=>toggleLayer(active.id,'locked')}>{active.locked?<Lock size={16}/>:<Unlock size={16}/>}</button><button title="Duplicar" disabled={!!active.locked} onClick={duplicate}><Copy size={16}/></button><button title="Excluir" disabled={!!active.locked} onClick={remove}><Trash2 size={16}/></button></div></div>
   {active.role==='mockup'&&doc.smartTemplate?.slot&&<div className="cr-feature" role="group" aria-label="Encaixe inteligente da caneca"><div><strong>{t('Encaixe inteligente')}</strong><p>{t('Recupere a posição e a proporção da caneca neste cenário, mantendo a máscara de primeiro plano.')}</p><button type="button" className="cr-primary" disabled={!!active.locked} onClick={()=>{if(!doc.smartTemplate?.slot)return;const fitted=fitMockupIntoSlot(active,doc.smartTemplate.slot,doc.smartTemplate.maskSrc,1,doc.smartTemplate.maskMode,doc.smartTemplate.maskInvert);patch(active.id,fitted);setNotice(t('Caneca reenquadrada no template.'));}}><Maximize size={15}/>{t('Reencaixar caneca')}</button><div className="cr-fit-scale-options" role="group" aria-label="Escala da caneca no encaixe">{([0.9,1,1.1] as const).map(f=><button key={f} type="button" disabled={!!active.locked} title="Ajustar a caneca proporcionalmente" onClick={()=>{if(!doc.smartTemplate?.slot)return;const fitted=fitMockupIntoSlot(active,doc.smartTemplate.slot,doc.smartTemplate.maskSrc,f,doc.smartTemplate.maskMode,doc.smartTemplate.maskInvert);patch(active.id,fitted);setNotice(`Caneca enquadrada em ${Math.round(f*100)}%, sem achatar.`);}}>{Math.round(f*100)}%</button>)}</div></div></div>}
   {active.locked&&<div className="cr-layer-lock-notice"><Lock size={15}/> Camada protegida. Desbloqueie pelo cadeado acima ou na aba Camadas.</div>}
   <fieldset className="cr-properties-fields" disabled={!!active.locked}>
   <details className="cr-property-group" open><summary>Camadas e alinhamento</summary><section className="cr-arrange" aria-label="Organização dos elementos"><p className="cr-section-label">{t('Ordem dos objetos').toUpperCase()}</p>
   <div className="cr-arrange-grid"><button type="button" onClick={()=>layer('front')} disabled={doc.nodes.at(-1)?.id===active.id} title="Colocar à frente de todos os elementos"><ChevronUp size={16}/> {t('Trazer à frente')}</button>
   <button type="button" onClick={()=>layer('forward')} disabled={doc.nodes.at(-1)?.id===active.id} title="Avançar uma camada"><ChevronUp size={16}/> {t('Subir 1 camada')}</button>
   <button type="button" onClick={()=>layer('backward')} disabled={doc.nodes[0]?.id===active.id} title="Recuar uma camada"><ChevronDown size={16}/> {t('Descer 1 camada')}</button>
   <button type="button" onClick={()=>layer('back')} disabled={doc.nodes[0]?.id===active.id} title="Enviar atrás de todos os elementos"><ChevronDown size={16}/> {t('Enviar para trás')}</button></div>
   <p className="cr-section-label">{t('Espelhar o elemento').toUpperCase()}</p><div className="cr-arrange-grid"><button type="button" aria-pressed={!!active.flipX} onClick={()=>mirror('horizontal')}><FlipHorizontal2 size={16}/> {t('Horizontal')}</button><button type="button" aria-pressed={!!active.flipY} onClick={()=>mirror('vertical')}><FlipVertical2 size={16}/> {t('Vertical')}</button></div></section></details>
   {active.kind==='text'&&<details className="cr-property-group" open><summary>Texto e fonte</summary><label>{t('Conteúdo').toUpperCase()}<textarea rows={3} value={active.text||''} onChange={e=>patch(active.id,{text:e.target.value})}/></label><label>{t('Fonte').toUpperCase()}<select value={active.font||'Arial'} onChange={e=>{const a=fontAssets.find(x=>x.name===e.target.value);void chooseFont(e.target.value,a);}}>{['Arial','Georgia','Verdana','Trebuchet MS','Times New Roman',...typefaces.map(t=>t.name),...installedTypefaces.map(t=>t.name),...fontAssets.map(a=>a.name),...localFonts.map(a=>a.name)].map(f=><option key={f}>{f}</option>)}</select></label><div className="cr-2col"><label>{t('Tamanho').toUpperCase()}<input type="number" min={8} max={600} value={active.size||72} onChange={e=>patch(active.id,{size:clamp(Number(e.target.value),8,600)})}/></label><label>{t('Alinhar').toUpperCase()}<select value={active.align||'center'} onChange={e=>patch(active.id,{align:e.target.value as CanvasTextAlign})}><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select></label></div><div className="cr-inline"><button className={active.bold?'active':''} onClick={()=>patch(active.id,{bold:!active.bold})}><b>B</b></button><button className={active.italic?'active':''} onClick={()=>patch(active.id,{italic:!active.italic})}><i>I</i></button></div></details>}
   {(active.kind==='text'||active.kind==='circle'||active.kind==='rect')&&<label>COR<div className="cr-colorinput"><input type="color" value={active.fill||'#ff8424'} onChange={e=>patch(active.id,{fill:e.target.value})}/><input value={active.fill||'#ff8424'} onChange={e=>patch(active.id,{fill:e.target.value})}/></div><button type="button" className="cr-pick-mini" onClick={()=>void pickScreenColor('element')}><Pipette size={15}/> {t('Conta-gotas')}</button></label>}
   {(active.kind==='text'||active.kind==='image'||active.kind==='circle'||active.kind==='rect'||active.kind==='bezier')&&<div className="cr-gradient-controls"><p className="cr-section-label">CORES & DEGRADÊ</p><label>ESTILO<select value={active.gradient?.kind||'solid'} onChange={e=>patch(active.id,e.target.value==='solid'?{gradient:undefined}:{gradient:{kind:e.target.value as 'linear'|'radial',from:active.gradient?.from||active.fill||'#ff8a30',to:active.gradient?.to||'#ffffff',angle:active.gradient?.angle??0}})}><option value="solid">Cor sólida / original</option><option value="linear">Degradê linear</option><option value="radial">Degradê radial</option></select></label>{active.gradient&&<><div className="cr-2col"><label>COR INICIAL<input type="color" value={active.gradient.from} onChange={e=>patch(active.id,{gradient:{...active.gradient!,from:e.target.value}})}/></label><label>COR FINAL<input type="color" value={active.gradient.to} onChange={e=>patch(active.id,{gradient:{...active.gradient!,to:e.target.value}})}/></label></div>{active.gradient.kind==='linear'&&<Range label="Ângulo do degradê" value={active.gradient.angle} min={-180} max={180} unit="°" change={v=>patch(active.id,{gradient:{...active.gradient!,angle:v}})}/>}<small>{active.kind==='image'?'Degradê aplicado à silhueta. Desative para manter as cores da fotografia.':'O degradê será mantido no PNG exportado.'}</small></>}</div>}
   {active.kind==='image'&&<div className="cr-tint"><label>RECOLORIR ÍCONE / SVG MONOCROMÁTICO<input type="color" value={active.tint||'#ff8828'} onChange={e=>patch(active.id,{tint:e.target.value})}/></label><button onClick={()=>void pickScreenColor('element')}><Pipette size={14}/> Capturar cor</button><button onClick={()=>patch(active.id,{tint:undefined})}>{t('Original')}</button><small>{t('A coloração altera toda a silhueta. Para fotos, mantenha a cor original.')}</small></div>}
   <details className="cr-property-group" open><summary>Posição e tamanho</summary><div className="cr-2col"><label>{t('Posição X').toUpperCase()}<input type="number" value={Math.round(active.x)} onChange={e=>patch(active.id,{x:Number(e.target.value)})}/></label><label>{t('Posição Y').toUpperCase()}<input type="number" value={Math.round(active.y)} onChange={e=>patch(active.id,{y:Number(e.target.value)})}/></label><label>{t('Largura').toUpperCase()}<input type="number" min={10} value={Math.round(active.w)} onChange={e=>{const w=clamp(Number(e.target.value),10,8192),ratio=w/active.w;patch(active.id,active.kind==='image'||active.kind==='text'||active.aspectLock?{w,h:w*active.h/active.w,...(active.kind==='text'?{size:Math.max(8,(active.size||72)*ratio)}:{})}:{w});}}/></label><label>{t('Altura').toUpperCase()}<input type="number" min={10} value={Math.round(active.h)} onChange={e=>{const h=clamp(Number(e.target.value),10,8192),ratio=h/active.h;patch(active.id,active.kind==='image'||active.kind==='text'||active.aspectLock?{h,w:h*active.w/active.h,...(active.kind==='text'?{size:Math.max(8,(active.size||72)*ratio)}:{})}:{h});}}/></label></div>
   </details>
   {(active.kind==='text'||active.kind==='image')&&<p className="cr-helper"><LockKeyhole size={14}/> Proporção protegida: arraste os 4 cantos sem distorcer {active.kind==='text'?'as letras':'a imagem'}.</p>}{active.kind==='image'&&<><div className="cr-inline"><button type="button" onClick={()=>maskRef.current?.click()}><Crop size={14}/> Máscara de imagem</button><button type="button" onClick={()=>patch(active.id,{maskSrc:undefined,maskMode:undefined,maskInvert:undefined,maskSpace:undefined})}>{t('Limpar máscara')}</button></div>{active.maskSrc&&<label className="cr-mask-mode">{t('Tipo de máscara')}<select value={active.maskMode||'luminance'} onChange={e=>patch(active.id,{maskMode:e.target.value as 'luminance'|'alpha'})}><option value="luminance">{t('Preto e branco · branco revela')}</option><option value="alpha">{t('Transparência do PNG · opaco revela')}</option></select><span className="cr-inline"><input aria-label="Inverter máscara" type="checkbox" checked={!!active.maskInvert} onChange={e=>patch(active.id,{maskInvert:e.target.checked})}/> {t('Inverter área visível')}</span></label>}<p className="cr-helper">{t('Máscara não destrutiva: escolha preto/branco ou transparência do PNG. Ideal para mãos e objetos na frente da caneca.')}</p><div className="cr-image-tools"><button className="cr-tool-button" type="button" onClick={()=>void cropImage()}><Crop size={15}/> Aplicar recorte</button><button className={eraserMode?'cr-tool-button active':'cr-tool-button'} type="button" aria-pressed={eraserMode} onClick={()=>setEraserMode(v=>!v)}><Eraser size={15}/> {eraserMode?'Concluir borracha':'Borracha livre'}</button></div>{eraserMode&&<><Range label="Diâmetro da borracha" value={eraserSize} min={5} max={250} unit="px" change={setEraserSize}/><p className="cr-helper">Desenhe na imagem para apagar áreas sem afetar outras camadas. Ctrl+Z desfaz.</p></>}{!!active.eraserStrokes?.length&&<button className="cr-tool-button" onClick={()=>patch(active.id,{eraserStrokes:undefined})}>Restaurar áreas apagadas</button>}<div className="cr-inline"><button onClick={()=>patch(active.id,{crop:undefined})}><RotateCcw size={14}/> Limpar recorte</button></div><p className="cr-section-label"><Crop size={14}/> RECORTE SEM PERDER O ORIGINAL</p>{(['left','right','top','bottom'] as const).map(k=><Range key={k} label={{left:'Esquerda',right:'Direita',top:'Superior',bottom:'Inferior'}[k]} value={Math.round((active.crop?.[k]||0)*100)} min={0} max={90} unit="%" change={v=>{const c={left:active.crop?.left||0,right:active.crop?.right||0,top:active.crop?.top||0,bottom:active.crop?.bottom||0};c[k]=Math.min(v/100,.95-c[({left:'right',right:'left',top:'bottom',bottom:'top'} as const)[k]]);patch(active.id,{crop:c});}}/>)}</>}
   {active.kind==='bezier'&&<div className="cr-bezier-controls"><p className="cr-section-label">CURVA BÉZIER · QUATRO PONTOS</p><p className="cr-helper">Arraste os pontos amarelos da curva para controlar início, fim e duas alças. A cor é aplicada ao traço.</p><label>COR DA CURVA<input type="color" value={active.stroke||'#ff8a30'} onChange={e=>patch(active.id,{stroke:e.target.value,fill:e.target.value})}/></label><Range label="Espessura" value={active.strokeWidth||12} min={1} max={80} unit="px" change={v=>patch(active.id,{strokeWidth:v})}/></div>}
   {doc.video&&<section className="cr-motion-editor"><p className="cr-section-label"><Sparkles size={14}/> ANIMAÇÃO DO ELEMENTO</p><small>Os efeitos serão vistos na prévia e no MP4 exportado. Não alteram sua estampa original.</small><div className="cr-motion-presets">{([['fade','Aparecer'],['slide-left','Entrar esquerda'],['slide-right','Entrar direita'],['zoom','Zoom suave'],['spin','Giro'],['none','Sem animação']] as [MotionPreset,string][]).map(([key,title])=><button type="button" key={key} onClick={()=>patch(active.id,{keyframes:motionPreset(active,key,Math.min(3,Math.max(.5,(doc.video?.end??20)-(doc.video?.start||0))))})}>{title}</button>)}</div><div className="cr-inline"><button type="button" onClick={()=>patch(active.id,{keyframes:withMotionPoint(active,previewSecond).keyframes})}>Marcar posição em {previewSecond.toFixed(1)}s</button><button type="button" onClick={()=>patch(active.id,{keyframes:undefined})}>Limpar animação</button></div><small>{active.keyframes?.length||0} posições marcadas · Animação entre quadros com transição suave.</small></section>}
   <details className="cr-property-group" open><summary>Aparência e sombras</summary><p className="cr-section-label"><SlidersHorizontal size={14}/> EFEITOS E ACABAMENTOS</p><div className="cr-shadow-actions"><button type="button" onClick={()=>patch(active.id,{shadow:0,shadowX:0,shadowY:0})}>{t('Sem sombra')}</button><button type="button" onClick={()=>patch(active.id,{shadow:18,shadowX:5,shadowY:13,shadowColor:'#242020'})}>{t('Suave')}</button><button type="button" onClick={()=>patch(active.id,{shadow:46,shadowX:11,shadowY:28,shadowColor:'#181414'})}>{t('Realista')}</button></div>
   <Range label={t('Rotação')} value={active.angle} min={-180} max={180} unit="°" change={v=>patch(active.id,{angle:v})}/>
   <Range label={t('Opacidade')} value={Math.round(active.opacity*100)} min={0} max={100} unit="%" change={v=>patch(active.id,{opacity:v/100})}/>
   <Range label="Sombra" value={active.shadow||0} min={0} max={110} unit="px" change={v=>patch(active.id,{shadow:v})}/><div className="cr-colorinput"><label>Cor da sombra<input type="color" value={active.shadowColor?.startsWith('#')?active.shadowColor:'#161016'} onChange={e=>patch(active.id,{shadowColor:e.target.value})}/></label></div><Range label="Sombra X" value={active.shadowX||0} min={-120} max={120} unit="px" change={v=>patch(active.id,{shadowX:v})}/><Range label="Sombra Y" value={active.shadowY??Math.round((active.shadow||0)*.4)} min={-120} max={120} unit="px" change={v=>patch(active.id,{shadowY:v})}/></details>
   {active.kind==='text'&&<details className="cr-property-group" open><summary>Tipografia avançada</summary><p className="cr-section-label"><Sparkles size={14}/> TIPOGRAFIA AVANÇADA</p><Range label={t('Curvatura')} value={active.curve||0} min={-260} max={260} unit="px" change={v=>patch(active.id,{curve:v})}/><Range label={t('Ondulação')} value={active.wave||0} min={-90} max={90} unit="px" change={v=>patch(active.id,{wave:v})}/><Range label={t('Profundidade 3D')} value={active.depth||0} min={0} max={22} unit="" change={v=>patch(active.id,{depth:v})}/><Range label={t('Espaço entre letras')} value={active.tracking||0} min={-12} max={45} unit="px" change={v=>patch(active.id,{tracking:v})}/><Range label={t('Contorno')} value={active.strokeWidth||0} min={0} max={25} unit="px" change={v=>patch(active.id,{strokeWidth:v,stroke:active.stroke||'#121212'})}/><label>Cor do contorno<input type="color" value={active.stroke||'#121212'} onChange={e=>patch(active.id,{stroke:e.target.value})}/></label></details>}
   {active.kind==='image'&&<details className="cr-property-group" open><summary>Filtros da imagem</summary><Range label={t('Brilho')} value={active.brightness??100} min={20} max={200} unit="%" change={v=>patch(active.id,{brightness:v})}/><Range label={t('Contraste')} value={active.contrast??100} min={20} max={200} unit="%" change={v=>patch(active.id,{contrast:v})}/><Range label={t('Saturação')} value={active.saturation??100} min={0} max={200} unit="%" change={v=>patch(active.id,{saturation:v})}/><Range label={t('Desfoque')} value={active.blur||0} min={0} max={30} unit="px" change={v=>patch(active.id,{blur:v})}/><Range label={t('Cinza')} value={active.grayscale||0} min={0} max={100} unit="%" change={v=>patch(active.id,{grayscale:v})}/><Range label={t('Sépia')} value={active.sepia||0} min={0} max={100} unit="%" change={v=>patch(active.id,{sepia:v})}/><Range label={t('Matiz')} value={active.hue||0} min={-180} max={180} unit="°" change={v=>patch(active.id,{hue:v})}/><Range label={t('Perspectiva / Inclinação')} value={active.skew||0} min={-35} max={35} unit="°" change={v=>patch(active.id,{skew:v})}/></details>}
  </fieldset></div>}
  </details></aside></div>
  <input ref={fileRef} type="file" hidden multiple accept="image/png,image/jpeg,image/svg+xml,image/webp,image/avif,image/bmp,image/gif,application/pdf,video/mp4,.jpg,.jpeg,.jfif,.jfi,.jif,.png,.svg,.webp,.avif,.bmp,.gif,.pdf,.psd,.cgtemplate,.mp4" onChange={e=>void upload(e.currentTarget.files)}/>
  <input ref={maskRef} type="file" hidden accept=".png,.webp,.jpg,.jpeg,.svg" onChange={e=>void readMask(e.currentTarget.files?.[0])}/>
  <input ref={projectRef} type="file" hidden accept=".cgdesign,application/json" onChange={e=>void readProject(e.currentTarget.files?.[0])}/>
  {showAgent&&<StudioConcierge area="editor" onClose={()=>setShowAgent(false)} onAction={a=>{if(a==='backgrounds'||a==='templates'||a==='texts'||a==='elements'||a==='personagens'||a==='uploads'){setPanel(a);return true;}if(a==='guides'){setGuides(true);return true;}if(a==='export'){setExportOpen(true);return true;}return false;}}/>}
  {notice&&<div className="cr-notice" role="status"><AlertTriangle size={18} aria-hidden="true"/><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Fechar"><X size={16}/></button></div>}
  {resetOpen&&<div className="cr-backdrop" onClick={()=>setResetOpen(false)}><div role="alertdialog" aria-modal="true" aria-labelledby="cr-reset-title" className="cr-dialog" onClick={e=>e.stopPropagation()}><div className="cr-dialog-header"><div><small>RESETAR PROJETO</small><h2 id="cr-reset-title">{t('Começar uma nova arte?')}</h2></div><button onClick={()=>setResetOpen(false)} aria-label="Fechar"><X size={19}/></button></div><p><AlertTriangle size={17} className="inline-block text-orange-400 mr-2"/>{t('Os elementos, os fundos e o histórico de desfazer desta composição serão limpos. Arquivos exportados e projetos salvos anteriormente no navegador não serão apagados.')}</p><div className="cr-dialog-footer"><button onClick={()=>setResetOpen(false)}>{t('Cancelar')}</button><button className="cr-primary" onClick={resetDocument}><RotateCcw size={17}/>{t('Resetar projeto')}</button></div></div></div>}
  {historyOpen&&<div className="cr-backdrop" onClick={()=>setHistoryOpen(false)}><div role="dialog" aria-modal="true" aria-label="Histórico de projetos locais" className="cr-dialog cr-history-dialog" onClick={e=>e.stopPropagation()}><div className="cr-dialog-header"><div><small>SEU NAVEGADOR</small><h2>{t('Histórico local')}</h2></div><button onClick={()=>setHistoryOpen(false)} aria-label="Fechar"><X size={19}/></button></div><p>{t('O histórico fica temporariamente neste dispositivo, por até 14 dias, sujeito à limpeza automática do navegador. Nenhum arquivo é enviado ao servidor. Exporte .cgdesign para ter um backup confiável.')}</p><button className="cr-primary" onClick={()=>void saveLocal()}><Save size={16}/> Salvar composição atual</button><div className="cr-history-list">{localProjects.length?localProjects.map(project=><div key={project.id} className="cr-history-item"><div><strong>{project.name}</strong><small>{new Date(project.updatedAt).toLocaleString('pt-BR')} · {project.document.width} × {project.document.height}</small></div><button onClick={()=>{if(window.confirm('Abrir este projeto? A composição atual será substituída.'))void restoreLocal(project.id)}}>Abrir</button><button title="Excluir este projeto local" aria-label="Excluir projeto local" onClick={()=>{if(window.confirm('Excluir este arquivo do histórico deste navegador?'))void deleteCreativeProject(project.id).then(refreshLocalProjects)}}><Trash2 size={15}/></button></div>):<p>Nenhum projeto salvo manualmente neste navegador.</p>}</div><div className="cr-dialog-footer"><button onClick={()=>setHistoryOpen(false)}>Fechar</button></div></div></div>}
  {exportOpen&&<div className="cr-backdrop" onClick={()=>setExportOpen(false)}><div className="cr-dialog" role="dialog" aria-modal="true" aria-label="Exportar criativo" onClick={e=>e.stopPropagation()}><div className="cr-dialog-header"><div><small>EXPORTAR</small><h2>Sua arte pronta para impressão ou divulgação.</h2></div><button onClick={()=>setExportOpen(false)} aria-label="Fechar"><X size={20}/></button></div><p>Para imprimir na caneca, use 21 × 9,5 cm em PNG, escala 100%, com 2480 × 1122 pixels e metadados de 300 DPI. Nenhuma arte é enviada ao servidor.</p><div className="cr-print-check" role="status"><strong>VERIFICAÇÃO ANTES DE EXPORTAR</strong>{[...printChecks.filter(entry=>entry.kind!=='success'||(!checkingQuality&&!qualityChecks.some(q=>q.kind==='warning'))),...qualityChecks].map((entry,i)=><p key={i} className={`cr-print-message ${entry.kind}`}>{entry.kind==='warning'?<AlertTriangle size={14}/>:<ShieldCheck size={14}/>}<span>{entry.message}</span></p>)}{checkingQuality&&<p className="cr-print-message info">Conferindo a resolução das imagens no navegador…</p>}</div>{doc.video&&<section className="cr-mp4-options" aria-label="Configurações do vídeo MP4"><p><strong>VÍDEO MP4 · H.264</strong></p><p>Exportação local, sem áudio, até 20 segundos. O modo Full HD é opcional, exige mais processamento e não aumenta o detalhe de vídeos de baixa resolução.</p><label>QUALIDADE<select aria-label="Qualidade MP4" value={videoPreset} disabled={videoProgress!==null} onChange={e=>{setVideoPreset(e.target.value as 'hd'|'fullhd');setVideoDiagnostic(null)}}><option value="hd">HD 720p · recomendado</option><option value="fullhd">Full HD 1080p · qualidade superior</option></select></label><label>FLUIDEZ<select aria-label="Quadros por segundo MP4" value={videoFps} disabled={videoProgress!==null} onChange={e=>{setVideoFps(Number(e.target.value) as 24|30);setVideoDiagnostic(null)}}><option value={24}>24 fps · mais leve</option><option value={30}>30 fps · mais fluido</option></select></label><p role="status">Saída prevista: {Math.max(2,Math.floor(doc.width*Math.min(1,(videoPreset==='fullhd'?1920:1280)/doc.width,(videoPreset==='fullhd'?1080:720)/doc.height)/2)*2)} × {Math.max(2,Math.floor(doc.height*Math.min(1,(videoPreset==='fullhd'?1920:1280)/doc.width,(videoPreset==='fullhd'?1080:720)/doc.height)/2)*2)} · {videoFps} fps.</p><button type="button" disabled={busy||videoChecking} onClick={()=>void checkVideoCompatibility()} title="Testa o codec H.264 e a leitura do primeiro quadro sem iniciar a exportação">{videoChecking?t('Verificando vídeo…'):t('Testar compatibilidade do MP4')}</button>{videoDiagnostic&&<p role="status" aria-live="polite" className="cr-video-diagnostic">{videoDiagnostic}</p>}<div className="cr-dialog-footer"><button className="cr-primary" disabled={busy||videoChecking} onClick={()=>void doVideoExport()}><Download size={17}/>{videoProgress!==null?`Exportando ${videoProgress}%`:'Exportar MP4'}</button>{videoProgress!==null&&<button type="button" onClick={()=>videoAbort.current?.abort()}>Cancelar MP4</button>}</div></section>}<label>FORMATO<select value={format} onChange={e=>setFormat(e.target.value as ExportFormat)}><option value="png">PNG · Transparência</option><option value="jpeg">JPEG · Arquivo leve</option><option value="webp">WebP · Otimizado</option></select></label><label>RESOLUÇÃO<select value={scale} onChange={e=>setScale(Number(e.target.value))}><option value={.5}>50% · {Math.round(doc.width*.5)} × {Math.round(doc.height*.5)}</option><option value={1}>100% · {doc.width} × {doc.height}</option><option value={2}>200% · {doc.width*2} × {doc.height*2}</option></select></label><label className="cr-mirror-print"><input type="checkbox" checked={mirrorPrint} onChange={e=>setMirrorPrint(e.target.checked)}/><span><strong>Espelhar horizontalmente só na exportação</strong><small>Para transferência térmica quando necessário. Não ative se o software ou a impressora já espelha a arte. A prévia e o projeto continuam normais.</small></span></label><div className="cr-dialog-footer"><button onClick={()=>setExportOpen(false)}>Cancelar</button><button className="cr-primary" disabled={busy} onClick={()=>void doExport()}><Download size={17}/>{busy?'Preparando imagem...':'Exportar composição'}</button></div></div></div>}
 </div>;
}
function Range({label,value,min,max,unit,change}:{label:string;value:number;min:number;max:number;unit:string;change:(v:number)=>void}){
 // O campo numérico mantém o rascunho de digitação até confirmar; o slider usa o valor real do documento.
 const [draft,setDraft]=useState(String(value));
 useEffect(()=>{setDraft(String(value));},[value]);
 const commit=(raw:string)=>{
  const parsed=Number(raw);
  if(raw.trim()!==''&&Number.isFinite(parsed))change(Math.max(min,Math.min(max,parsed)));
  else setDraft(String(value));
 };
 const progress=max===min?0:Math.max(0,Math.min(100,((value-min)/(max-min))*100));
 return <div className="cr-range" role="group" aria-label={label}>
  <div className="cr-range-header"><label htmlFor={`cr-slider-${label.replace(/[^a-zA-Z0-9]/g,'-')}`}><strong>{label}</strong></label><div className="cr-range-value"><input type="number" aria-label={`${label} em ${unit||'unidades'}`} min={min} max={max} step={1} value={draft} onChange={e=>setDraft(e.target.value)} onBlur={e=>commit(e.currentTarget.value)} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/><span>{unit}</span></div></div>
  <input id={`cr-slider-${label.replace(/[^a-zA-Z0-9]/g,'-')}`} aria-label={label} type="range" min={min} max={max} value={value} style={{'--cr-range-progress':`${progress}%`} as React.CSSProperties} onChange={e=>change(Number(e.target.value))}/>
 </div>;
}
