"use client";
import { useCallback,useEffect,useMemo,useRef,useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Undo2, Redo2, ImagePlus, Type, Shapes, Layers3, Trash2, Copy, ChevronUp, ChevronDown, Download, SlidersHorizontal, Search, Upload, RectangleHorizontal, Circle, Sparkles, FolderOpen, Save, WandSparkles, X, Plus, Maximize, FlipHorizontal2, Crop, LockKeyhole, UnlockKeyhole, Users, Eye, RotateCcw, BookOpen } from 'lucide-react';
import { asDataUrl,blankDocument,drawDesign,exportDesign,formats,imageFor,saveBlob,uid,type DesignDocument,type DesignNode,type ExportFormat } from '@/lib/creative/design';
import { readHandoff } from '@/lib/creative/handoff';
import {builtInPresets,makeBuiltInPreset,type PresetId} from '@/lib/creative/presets';
import {resizeFromCorner,type Corner} from '@/lib/creative/geometry';
import {backgroundKits,backgroundSvg} from '@/lib/creative/backgrounds';
import {StudioConcierge} from '@/components/creative/studio-concierge';
import './creative.css';

type Asset={id:string;kind:string;name:string;category:string;mimeType:string;url:string};
type Panel='templates'|'elements'|'personagens'|'texts'|'backgrounds'|'uploads';
type Gesture={kind:'move'|'resize';corner?:Corner;id:string;x:number;y:number;initial:DesignNode;before:DesignDocument};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const initials=(name:string)=>name.split(' ').slice(0,2).map(x=>x[0]).join('').toUpperCase();
const backgroundPresets=['#141112','#080808','#ffffff','#f4eee6','#e96d18','#1b2838','#d5d1c7','#f6bac9','#285141','transparent'];

export function CreativeEditor(){
 const [history,setHistory]=useState<DesignDocument[]>([blankDocument()]);
 const [step,setStep]=useState(0);
 const stateRef=useRef({history,step});
 const doc=history[step];
 const [selected,setSelected]=useState<string|null>(null);
 const [panel,setPanel]=useState<Panel>('templates');
 const [assets,setAssets]=useState<Asset[]>([]),[assetTotal,setAssetTotal]=useState(0);
 const [assetPage,setAssetPage]=useState(1),[assetQuery,setAssetQuery]=useState('');
 const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);
 const [exportOpen,setExportOpen]=useState(false);const [format,setFormat]=useState<ExportFormat>('png');const [scale,setScale]=useState(1);
 const [zoom,setZoom]=useState(1);
 const [guides,setGuides]=useState(true);const [showAgent,setShowAgent]=useState(false);
 const canvasRef=useRef<HTMLCanvasElement>(null),zoneRef=useRef<HTMLDivElement>(null),fileRef=useRef<HTMLInputElement>(null),projectRef=useRef<HTMLInputElement>(null);
 const gesture=useRef<Gesture|null>(null);
 const renderId=useRef(0);
 const active=doc.nodes.find(n=>n.id===selected)||null;
 const kind=panel==='templates'?'template':panel==='elements'||panel==='personagens'?'element':panel==='backgrounds'?'background':null;
 const update=useCallback((f:(d:DesignDocument)=>DesignDocument)=>{
  const prior=stateRef.current;
  const next=[...prior.history.slice(0,prior.step+1),f(prior.history[prior.step])].slice(-70);
  stateRef.current={history:next,step:next.length-1};
  setHistory(next);setStep(next.length-1);
 },[]);
 const patch=useCallback((id:string,p:Partial<DesignNode>)=>update(d=>({...d,nodes:d.nodes.map(n=>n.id===id?{...n,...p}:n)})),[update]);
 const put=(node:DesignNode)=>{update(d=>({...d,nodes:[...d.nodes,node]}));setSelected(node.id);};
 const addText=(value='Seu texto aqui')=>{const n:DesignNode={id:uid(),kind:'text',x:doc.width*.1,y:doc.height*.39,w:doc.width*.8,h:150,angle:0,opacity:1,text:value,font:'Arial',size:Math.round(doc.width*.065),bold:true,fill:'#ffffff',shadow:0};put(n);};
 const addShape=(kind:'rect'|'circle')=>{put({id:uid(),kind,x:doc.width*.25,y:doc.height*.36,w:doc.width*.5,h:doc.width*.35,angle:0,opacity:1,fill:'#ff8525',radius:24,shadow:6});};
 const addImage=useCallback(async(src:string,preselect=true,role:'content'|'mockup'='content')=>{
  try{const image=await imageFor(src);const id=uid();
   update(d=>{const f=Math.min(1,d.width*.72/image.naturalWidth,d.height*.8/image.naturalHeight);const w=image.naturalWidth*f,h=image.naturalHeight*f;
    const n:DesignNode={id,kind:'image',role,aspectLock:true,src,x:(d.width-w)/2,y:(d.height-h)/2,w,h,angle:0,opacity:1,shadow:role==='mockup'?35:12,brightness:100,contrast:100,saturation:100};
    return {...d,nodes:[...d.nodes,n]};});if(preselect)setSelected(id);
  }catch(e){setNotice(e instanceof Error?e.message:'Não foi possível abrir o arquivo.');}
 },[update]);
 const applyTemplate=useCallback(async(src:string,role:'template'|'background'='template')=>{
   try{const image=await imageFor(src);
    update(d=>{const factor=Math.max(d.width/image.naturalWidth,d.height/image.naturalHeight);
     const w=image.naturalWidth*factor,h=image.naturalHeight*factor;
     const n:DesignNode={id:uid(),kind:'image',role,aspectLock:true,src,x:(d.width-w)/2,y:(d.height-h)/2,w,h,angle:0,opacity:1};
     return {...d,nodes:[n,...d.nodes.filter(x=>x.role!==role)]};});setSelected(null);
   }catch{setNotice('Não foi possível carregar o template.');}
 },[update]);
 const applyPreset=(preset:PresetId)=>{const base=makeBuiltInPreset(preset);update(d=>{
   const keep=d.nodes.filter(n=>n.role!=='template'&&n.role!=='background');
   // O layout troca. O mockup e os elementos do usuário são mantidos e adaptados à nova tela.
   const f=Math.min(base.width/d.width,base.height/d.height);const ox=(base.width-d.width*f)/2,oy=(base.height-d.height*f)/2;
   const adapted=keep.map(n=>({...n,x:n.x*f+ox,y:n.y*f+oy,w:n.w*f,h:n.h*f,size:n.size?Math.max(8,n.size*f):undefined,shadow:n.shadow?Math.max(1,n.shadow*f):n.shadow}));
   return {...base,nodes:[...base.nodes,...adapted]};});setSelected(null);setNotice('Layout trocado. Sua caneca e seus elementos foram preservados.');};
 const useAsset=(a:Asset)=>{
  if(a.mimeType.startsWith('video/')){setNotice('MP4 pode ser cadastrado, mas a edição/exportação de vídeo ainda não está disponível neste editor de imagens.');return;}
  if(a.kind==='animation'){setNotice('Animações JSON estão no acervo. A edição e exportação animada não fazem parte desta fase.');return;}
  if(a.kind==='background'){
   void imageFor(a.url).then(img=>{
    void applyTemplate(a.url,'background');setNotice(`Fundo aplicado · ${img.naturalWidth} × ${img.naturalHeight}`);
   }).catch(()=>setNotice('Não foi possível aplicar fundo.'));
  }else if(a.kind==='template'){
   // Template: preenche o documento por baixo de textos e do mockup existente.
   void applyTemplate(a.url);
  }else if(a.kind==='font'){
   setNotice('Fontes cadastradas são carregadas automaticamente quando publicadas.');
  }else void addImage(a.url);
 };
 const loadAssets=useCallback(async(page:number,append=false)=>{
  if(!kind){setAssets([]);return;}
  try{const q=new URLSearchParams({kind,page:String(page),q:assetQuery});if(panel==='personagens')q.set('category','Personagens');const res=await fetch(`/api/creative-assets?${q}`,{cache:'no-store'});
   const data=await res.json();if(!data.ok)throw new Error(data.error);
   setAssets(prev=>append?[...prev,...data.items]:data.items);setAssetTotal(data.total);setAssetPage(page);
  }catch{setAssets([]);setAssetTotal(0);setNotice('Biblioteca administrativa indisponível; seus arquivos locais continuam funcionando.');}
 },[kind,assetQuery,panel]);
 useEffect(()=>{void loadAssets(1);},[loadAssets]);
 useEffect(()=>{
  const seq=++renderId.current;const canvas=canvasRef.current;if(!canvas)return;
  const work=document.createElement('canvas');
  void drawDesign(work,doc).then(()=>{
   if(seq!==renderId.current)return;
   if(canvas.width!==work.width)canvas.width=work.width;
   if(canvas.height!==work.height)canvas.height=work.height;
   canvas.getContext('2d')?.drawImage(work,0,0);
  }).catch(()=>{if(seq===renderId.current)setNotice('Não foi possível renderizar um dos elementos.');});
  return()=>{renderId.current++};
 },[doc]);
 // Handoff: dados binários ficam exclusivamente no IndexedDB do navegador.
 useEffect(()=>{let mounted=true;void (async()=>{
  try{
   const preset=new URLSearchParams(window.location.search).get('preset');
   if(preset&&builtInPresets.some(p=>p.id===preset)){
    const d=makeBuiltInPreset(preset as PresetId);
    stateRef.current={history:[d],step:0};setHistory([d]);setStep(0);
   }
   const handoff=await readHandoff();if(handoff&&mounted){const data=await asDataUrl(handoff);if(mounted){
    update(d=>({...d,width:1080,height:1350,background:'#141112'}));await addImage(data,true,'mockup');setPanel('templates');
   }}
  }
  catch{if(mounted)setNotice('Não foi possível recuperar o mockup do Studio. Tente enviar novamente.');}
  const id=new URLSearchParams(window.location.search).get('asset');
  if(id&&mounted){try{const res=await fetch(`/api/creative-assets?assetId=${encodeURIComponent(id)}`);const json=await res.json();if(json.ok&&json.asset?.kind==='template')void applyTemplate(json.asset.url);}catch{}}
 })();return()=>{mounted=false};
 // only once on mount; addImage uses initial document size
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 // Publicadas pelo admin; carregadas sob demanda no próprio navegador.
 useEffect(()=>{let disposed=false;void fetch('/api/creative-assets?kind=font').then(r=>r.json()).then(async d=>{
  for(const a of ((d.items||[]) as Asset[]).filter(x=>x.mimeType.startsWith('font/'))){
   if(disposed)break;
   try{const face=new FontFace(a.name,`url("${a.url}")`);await face.load();if(!disposed)document.fonts.add(face);}catch{/* fonte inválida não derruba editor */}
  }
 }).catch(()=>{});return()=>{disposed=true};},[]);
 const [fontAssets,setFontAssets]=useState<Asset[]>([]);
 useEffect(()=>{void fetch('/api/creative-assets?kind=font').then(r=>r.json()).then(d=>setFontAssets((d.items||[]) as Asset[])).catch(()=>{});},[]);
 const cursorPoint=(evt:React.PointerEvent<HTMLElement>)=>{
  const canvas=canvasRef.current;if(!canvas)return {x:0,y:0};
  const r=canvas.getBoundingClientRect();return {x:(evt.clientX-r.left)*doc.width/r.width,y:(evt.clientY-r.top)*doc.height/r.height};
 };
 const startCorner=(evt:React.PointerEvent<HTMLButtonElement>,corner:Corner,n:DesignNode)=>{
  evt.stopPropagation();evt.preventDefault();if(evt.button!==0)return;
  const p=cursorPoint(evt);gesture.current={kind:'resize',corner,id:n.id,x:p.x,y:p.y,initial:{...n},before:structuredClone(doc)};
  evt.currentTarget.setPointerCapture(evt.pointerId);
 };
 const hit=(x:number,y:number)=>doc.nodes.slice().reverse().find(n=>{
  const cx=n.x+n.w/2,cy=n.y+n.h/2,a=-n.angle*Math.PI/180;
  const dx=x-cx,dy=y-cy,lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a);
  return Math.abs(lx)<n.w/2+12&&Math.abs(ly)<n.h/2+12;
 });
 const down=(evt:React.PointerEvent<HTMLCanvasElement>)=>{
  if(evt.button!==0)return;const p=cursorPoint(evt);const n=hit(p.x,p.y);setSelected(n?.id||null);
  if(n){gesture.current={kind:'move',id:n.id,x:p.x,y:p.y,initial:{...n},before:structuredClone(doc)};
   evt.currentTarget.setPointerCapture(evt.pointerId);}
 };
 const move=(evt:React.PointerEvent<HTMLElement>)=>{
  const g=gesture.current;if(!g)return;const p=cursorPoint(evt),dx=p.x-g.x,dy=p.y-g.y;
  const attrs=g.kind==='move'?{x:g.initial.x+dx,y:g.initial.y+dy}:resizeFromCorner(g.initial,g.corner||'se',dx,dy,g.initial.kind==='image'||g.initial.aspectLock!==false);
  // Estado provisório: não gera 70 etapas de undo durante o arraste.
  const current=stateRef.current;
  const next=current.history.map((d,i)=>i!==current.step?d:{...d,nodes:d.nodes.map(n=>n.id===g.id?{...n,...attrs}:n)});
  stateRef.current={history:next,step:current.step};setHistory(next);
 };
 const up=()=>{const g=gesture.current;if(!g)return;gesture.current=null;
  const current=stateRef.current;
  const result=structuredClone(current.history[current.step]);
  const next=[...current.history.slice(0,current.step),g.before,result].slice(-70);
  stateRef.current={history:next,step:next.length-1};setHistory(next);setStep(next.length-1);
 };
 const undo=()=>{const state=stateRef.current;const newStep=Math.max(0,state.step-1);stateRef.current={...state,step:newStep};setStep(newStep);setSelected(null)};
 const redo=()=>{const state=stateRef.current;const newStep=Math.min(state.history.length-1,state.step+1);stateRef.current={...state,step:newStep};setStep(newStep);setSelected(null)};
 const duplicate=()=>{if(!active)return;put({...active,id:uid(),x:active.x+36,y:active.y+36});};
 const remove=()=>{if(!selected)return;update(d=>({...d,nodes:d.nodes.filter(n=>n.id!==selected)}));setSelected(null);};
 const layer=(dir:1|-1)=>{if(!active)return;update(d=>{const nodes=[...d.nodes];const i=nodes.findIndex(n=>n.id===active.id),j=clamp(i+dir,0,nodes.length-1);[nodes[i],nodes[j]]=[nodes[j],nodes[i]];return {...d,nodes};});};
 useEffect(()=>{const key=(e:KeyboardEvent)=>{
  if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||e.target instanceof HTMLSelectElement)return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey)redo();else undo();}
  if(e.key==='Delete'||e.key==='Backspace')remove();
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){e.preventDefault();duplicate();}
 };window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
 // callbacks intentionally track the latest state
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[doc,step,selected,history]);
 const upload=async(files:FileList|null)=>{
  if(!files?.length)return;
  setBusy(true);try{
   for(const file of Array.from(files).slice(0,8)){
    if(file.name.toLowerCase().endsWith('.pdf')){
     const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc='/pdf.worker.min.mjs';
     const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())});
     try{
      const pdf=await task.promise;const page=await pdf.getPage(1);const viewport=page.getViewport({scale:Math.min(3,2400/Math.max(page.view[2],page.view[3]))});
      const canvas=document.createElement('canvas');canvas.width=Math.round(viewport.width);canvas.height=Math.round(viewport.height);
      await page.render({canvas,canvasContext:canvas.getContext('2d')!,viewport}).promise;
      await addImage(canvas.toDataURL('image/png'));
      setNotice(`PDF: página 1 de ${pdf.numPages} importada como imagem. O texto do PDF original não vira camada editável nesta fase.`);
     }finally{await task.destroy();}
    }else if(/\.(png|jpe?g|webp|avif)$/i.test(file.name)){
     const src=await asDataUrl(file);await addImage(src);
    }else setNotice(`Formato não editável nesta fase: ${file.name}. PSD com camadas será incorporado em uma etapa posterior.`);
   }
  }catch(e){setNotice(e instanceof Error?e.message:'Falha ao importar arquivo');}finally{setBusy(false);if(fileRef.current)fileRef.current.value='';}
 };
 const doExport=async()=>{
  setBusy(true);try{const blob=await exportDesign(doc,format,scale);saveBlob(blob,`click-gruda-criativo-${doc.width*scale}x${doc.height*scale}.${format==='jpeg'?'jpg':format}`);setExportOpen(false);}
  catch(e){setNotice(e instanceof Error?e.message:'Erro ao exportar');}finally{setBusy(false);}
 };
 const saveProject=()=>{const blob=new Blob([JSON.stringify({format:'cgdesign',version:1,document:doc})],{type:'application/json'});saveBlob(blob,'meu-projeto-clickgruda.cgdesign');};
 const readProject=async(file?:File)=>{
  if(!file)return;try{if(file.size>45*1024*1024)throw new Error('Projeto excede 45 MB');const json=JSON.parse(await file.text());
   if(json.format!=='cgdesign'||json.version!==1||!json.document||!Array.isArray(json.document.nodes))throw new Error('Arquivo de projeto incompatível');
   const d=json.document as DesignDocument;
   if(!Number.isFinite(d.width)||!Number.isFinite(d.height)||d.width<100||d.height<100||d.width>8192||d.height>8192||d.nodes.length>1000)throw new Error('Dimensões ou camadas inválidas');
   stateRef.current={history:[d],step:0};setHistory([d]);setStep(0);setSelected(null);setNotice('Projeto carregado localmente.');
  }catch(e){setNotice(e instanceof Error?e.message:'Não foi possível abrir o projeto.');}if(projectRef.current)projectRef.current.value='';
 };
 const resize=useCallback(()=>{const el=zoneRef.current;if(!el)return;const width=el.clientWidth-40,height=el.clientHeight-40;
  setZoom(Math.min(1.25,Math.max(.08,Math.min(width/doc.width,height/doc.height))));},[doc.width,doc.height]);
 useEffect(()=>{resize();const observer=new ResizeObserver(resize);if(zoneRef.current)observer.observe(zoneRef.current);return()=>observer.disconnect();},[resize]);
 return <div className="cg-creative">
  <header className="cr-head"><Link href="/" className="cr-mark"><ArrowLeft size={17}/><span>Click <b>&</b> Gruda</span></Link><span className="cr-separator"/><div className="cr-head-title"><strong>EDITOR DE ARTES</strong><small>Exclusivo para sublimação de canecas · arquivos locais</small></div>
   <div className="cr-head-actions"><button onClick={()=>setShowAgent(v=>!v)} title="Assistente de sublimação"><BookOpen size={16}/> Ajuda</button><button onClick={undo} disabled={step===0} title="Desfazer (Ctrl+Z)"><Undo2 size={18}/></button><button onClick={redo} disabled={step>=history.length-1} title="Refazer"><Redo2 size={18}/></button><span className="cr-separator"/>
    <button onClick={()=>projectRef.current?.click()}><FolderOpen size={16}/><span>Abrir projeto</span></button><button onClick={saveProject}><Save size={16}/><span>Salvar projeto</span></button><button className="cr-primary" onClick={()=>setExportOpen(true)}><Download size={17}/> Exportar</button></div>
  </header>
  <div className="cr-shell"><nav className="cr-rail" aria-label="Ferramentas">
   {([['templates','Layouts',Layers3],['elements','Elementos',Shapes],['personagens','Personagens',Users],['texts','Textos',Type],['backgrounds','Fundos',ImagePlus],['uploads','Uploads',Upload]] as const).map(([id,label,Icon])=><button key={id} aria-current={panel===id?'page':undefined} onClick={()=>setPanel(id)}><Icon size={21}/><small>{label}</small></button>)}
  </nav><aside className="cr-left"><div className="cr-panel-head"><h2>{panel==='templates'?'Templates':panel==='elements'?'Elementos':panel==='texts'?'Tipografia':panel==='backgrounds'?'Fundos':panel==='personagens'?'Personagens & Emojis':'Seus arquivos'}</h2><span>CRIAR COM LIBERDADE</span></div>
   {kind&&<><div className="cr-search"><Search size={16}/><input placeholder="Buscar no acervo..." value={assetQuery} onChange={e=>setAssetQuery(e.target.value)}/></div>
    {panel==='templates'&&<><div className="cr-feature" role="note"><Sparkles size={18}/><div><strong>Comece por um layout</strong><p>Escolha um dos 4 layouts editáveis ou use templates publicados pelo admin.</p></div></div>
    <p className="cr-section-label">LAYOUTS EDITÁVEIS INCLUSOS</p><div className="cr-preset-list">{builtInPresets.map(p=><button key={p.id} onClick={()=>applyPreset(p.id)}><span className={`cr-preset-thumb ${p.id}`}>{p.name}</span><span><strong>{p.name}</strong><small>{p.description}</small></span></button>)}</div></>}
    {panel==='backgrounds'&&<><p className="cr-section-label">FUNDOS PRONTOS SEM TEXTO · PARA SUBLIMAÇÃO</p><div className="cr-background-grid">{backgroundKits.map(b=><button key={b.id} title={b.name} onClick={()=>void applyTemplate(backgroundSvg(b.id,doc.width,doc.height),'background')}><span style={{background:`linear-gradient(130deg,${b.a},${b.b} 68%,${b.c})`}}/><small>{b.name}</small></button>)}</div><p className="cr-section-label">CORES & TRANSPARÊNCIA</p><div className="cr-colors">{backgroundPresets.map(c=><button key={c} title={c} aria-label={`Fundo ${c}`} onClick={()=>update(d=>({...d,background:c}))} className={doc.background===c?'active':''} style={{background:c==='transparent'?'conic-gradient(#eee 25%,#ccc 0 50%,#eee 0 75%,#ccc 0) 0 0/20px 20px':c}}/>)}</div></>}
    <p className="cr-section-label">ACERVO ADMINISTRATIVO · {assetTotal} ITENS</p><div className="cr-assets">{assets.map(a=><button key={a.id} title={a.name} onClick={()=>useAsset(a)} className="cr-asset">{a.mimeType.startsWith('image/')?<img src={a.url} alt="" loading="lazy"/>:<div className="cr-asset-generic">{initials(a.name)}</div>}<span>{a.name}</span></button>)}
    {!assets.length&&<div className="cr-empty">Sem itens publicados nessa categoria. Adicione materiais pelo Painel Admin.</div>}
    </div>{assets.length<assetTotal&&<button className="cr-outlined" onClick={()=>void loadAssets(assetPage+1,true)}>Carregar mais</button>}</>}
   {panel==='texts'&&<><button className="cr-text-preset" onClick={()=>addText('Seu título aqui')}><strong>Adicionar título</strong><small>Exponha sua ideia com impacto.</small></button><button className="cr-text-preset subtitle" onClick={()=>addText('Uma descrição especial')}><strong>Adicionar subtítulo</strong><small>Texto complementar.</small></button><button className="cr-text-preset detail" onClick={()=>addText('clickgruda.com.br')}><strong>Adicionar informação</strong><small>Contato, site ou redes.</small></button></>}
   {panel==='elements'&&<div className="cr-shapes"><button onClick={()=>addShape('rect')}><RectangleHorizontal size={32}/>Retângulo</button><button onClick={()=>addShape('circle')}><Circle size={32}/>Elipse</button></div>}
   {panel==='personagens'&&<p className="cr-helper">Personagens, desenhos, cartoons, emojis e temas que você cadastrar em <b>Admin → Elementos → categoria Personagens</b> aparecem aqui. Publique somente arquivos com direito de uso na plataforma.</p>}
   {panel==='uploads'&&<div className="cr-upload"><ImagePlus size={28}/><h3>Seus arquivos, seu navegador</h3><p>PNG, JPG, WebP, AVIF e primeira página PDF. Não enviamos seus arquivos para o servidor.</p><button className="cr-primary" onClick={()=>fileRef.current?.click()}><Plus size={16}/>Adicionar imagens</button><small>Formatos PSD e PDF com camadas são recursos futuros.</small></div>}
  </aside>
  <main className="cr-canvas-shell"><div className="cr-canvas-top"><div><span className="cr-dot"/> Editor de Sublimação de Canecas <span className="cr-micro">{doc.width} × {doc.height} px</span></div><div className="cr-canvas-actions"><select aria-label="Formato do documento" value={`${doc.width}x${doc.height}`} onChange={e=>{const f=formats.find(f=>`${f.w}x${f.h}`===e.target.value);if(f)update(d=>({...d,width:f.w,height:f.h}));}}>{formats.map(f=><option key={f.label} value={`${f.w}x${f.h}`}>{f.label}</option>)}</select><button onClick={()=>setGuides(v=>!v)} title="Mostrar/ocultar área segura (não sai na exportação)" aria-pressed={guides}><Eye size={16}/> Guias</button><button onClick={resize} title="Encaixar na tela"><Maximize size={16}/></button></div></div>
   <div className="cr-canvas-zone" ref={zoneRef}><div className="cr-stage" style={{width:doc.width*zoom,height:doc.height*zoom}}>
    <canvas ref={canvasRef} style={{width:'100%',height:'100%'}} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} aria-label="Tela de criação: selecione, arraste e redimensione os elementos pelo canto inferior direito"/>
    {guides&&doc.width===2480&&doc.height===1122&&<div className="cr-print-guides" aria-hidden="true" style={{left:Math.round((doc.width-2244)/2)*zoom,top:Math.round((doc.height-1004)/2)*zoom,width:2244*zoom,height:1004*zoom}}><span>ÁREA VISÍVEL · 19 × 8,5 cm</span></div>}
    {active&&<div className="cr-selection" style={{left:active.x*zoom,top:active.y*zoom,width:active.w*zoom,height:active.h*zoom,transform:`rotate(${active.angle}deg)`}}>{(['nw','ne','sw','se'] as Corner[]).map(c=><button key={c} type="button" className={`cr-handle cr-handle-${c}`} aria-label={`Redimensionar ${c} com proporção preservada`} title="Arraste para diminuir ou aumentar mantendo as proporções" onPointerDown={e=>startCorner(e,c,active)} onPointerMove={move} onPointerUp={up} onPointerCancel={up}/>)}</div>}
   </div></div><div className="cr-bottom"><span>Arraste pelas alças dos cantos · imagens mantêm proporção · Ctrl+Z desfaz</span><span>Visualização {Math.round(zoom*100)}%</span></div>
  </main>
  <aside className="cr-inspector"><div className="cr-panel-head"><h2>Propriedades</h2><span>AJUSTES DE PRECISÃO</span></div>
  {!active?<div className="cr-hint"><WandSparkles size={26}/><h3>Personalize cada detalhe</h3><p>Clique em um elemento na arte para ajustar tamanho, posição, cores, efeitos e sombras.</p><p>Para começar, adicione um texto, imagem ou template no painel esquerdo.</p></div>:<div className="cr-properties">
   <div className="cr-selected-bar"><span>{active.kind==='text'?'Texto':active.kind==='image'?'Imagem':'Forma'}</span><div><button title="Duplicar" onClick={duplicate}><Copy size={16}/></button><button title="Mover para frente" onClick={()=>layer(1)}><ChevronUp size={16}/></button><button title="Mover para trás" onClick={()=>layer(-1)}><ChevronDown size={16}/></button><button title="Excluir" onClick={remove}><Trash2 size={16}/></button></div></div>
   {active.kind==='text'&&<><label>CONTEÚDO<textarea rows={3} value={active.text||''} onChange={e=>patch(active.id,{text:e.target.value})}/></label><label>FONTE<select value={active.font||'Arial'} onChange={e=>patch(active.id,{font:e.target.value})}>{['Arial','Georgia','Verdana','Trebuchet MS','Times New Roman',...fontAssets.map(a=>a.name)].map(f=><option key={f}>{f}</option>)}</select></label><div className="cr-2col"><label>TAMANHO<input type="number" min={8} max={600} value={active.size||72} onChange={e=>patch(active.id,{size:clamp(Number(e.target.value),8,600)})}/></label><label>ALINHAR<select value={active.align||'center'} onChange={e=>patch(active.id,{align:e.target.value as CanvasTextAlign})}><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select></label></div><div className="cr-inline"><button className={active.bold?'active':''} onClick={()=>patch(active.id,{bold:!active.bold})}><b>B</b></button><button className={active.italic?'active':''} onClick={()=>patch(active.id,{italic:!active.italic})}><i>I</i></button></div></>}
   {(active.kind==='text'||active.kind==='circle'||active.kind==='rect')&&<label>COR<div className="cr-colorinput"><input type="color" value={active.fill||'#ff8424'} onChange={e=>patch(active.id,{fill:e.target.value})}/><input value={active.fill||'#ff8424'} onChange={e=>patch(active.id,{fill:e.target.value})}/></div></label>}
   <div className="cr-2col"><label>POSIÇÃO X<input type="number" value={Math.round(active.x)} onChange={e=>patch(active.id,{x:Number(e.target.value)})}/></label><label>POSIÇÃO Y<input type="number" value={Math.round(active.y)} onChange={e=>patch(active.id,{y:Number(e.target.value)})}/></label><label>LARGURA<input type="number" min={10} value={Math.round(active.w)} onChange={e=>{const w=clamp(Number(e.target.value),10,8192);patch(active.id,active.kind==='image'||active.aspectLock?{w,h:w*active.h/active.w}:{w});}}/></label><label>ALTURA<input type="number" min={10} value={Math.round(active.h)} onChange={e=>{const h=clamp(Number(e.target.value),10,8192);patch(active.id,active.kind==='image'||active.aspectLock?{h,w:h*active.w/active.h}:{h});}}/></label></div>
   {active.kind==='image'&&<><p className="cr-helper"><LockKeyhole size={14}/> Proporção protegida: arraste os 4 cantos sem achatar a imagem.</p><div className="cr-inline"><button onClick={()=>patch(active.id,{flipX:!active.flipX})}>Espelhar horizontal</button><button onClick={()=>patch(active.id,{flipY:!active.flipY})}>Espelhar vertical</button><button onClick={()=>patch(active.id,{crop:undefined})}><RotateCcw size={14}/> Limpar recorte</button></div><p className="cr-section-label"><Crop size={14}/> RECORTE SEM PERDER O ORIGINAL</p>{(['left','right','top','bottom'] as const).map(k=><Range key={k} label={{left:'Esquerda',right:'Direita',top:'Superior',bottom:'Inferior'}[k]} value={Math.round((active.crop?.[k]||0)*100)} min={0} max={90} unit="%" change={v=>{const c={left:active.crop?.left||0,right:active.crop?.right||0,top:active.crop?.top||0,bottom:active.crop?.bottom||0};c[k]=Math.min(v/100,.95-c[({left:'right',right:'left',top:'bottom',bottom:'top'} as const)[k]]);patch(active.id,{crop:c});}}/>)}</>}
   <p className="cr-section-label"><SlidersHorizontal size={14}/> EFEITOS E ACABAMENTOS</p>
   <Range label="Rotação" value={active.angle} min={-180} max={180} unit="°" change={v=>patch(active.id,{angle:v})}/>
   <Range label="Opacidade" value={Math.round(active.opacity*100)} min={0} max={100} unit="%" change={v=>patch(active.id,{opacity:v/100})}/>
   <Range label="Sombra" value={active.shadow||0} min={0} max={110} unit="px" change={v=>patch(active.id,{shadow:v})}/><div className="cr-colorinput"><label>Cor da sombra<input type="color" value={active.shadowColor?.startsWith('#')?active.shadowColor:'#161016'} onChange={e=>patch(active.id,{shadowColor:e.target.value})}/></label></div><Range label="Sombra X" value={active.shadowX||0} min={-120} max={120} unit="px" change={v=>patch(active.id,{shadowX:v})}/><Range label="Sombra Y" value={active.shadowY??Math.round((active.shadow||0)*.4)} min={-120} max={120} unit="px" change={v=>patch(active.id,{shadowY:v})}/>
   {active.kind==='text'&&<><p className="cr-section-label"><Sparkles size={14}/> TIPOGRAFIA AVANÇADA</p><Range label="Curvatura" value={active.curve||0} min={-260} max={260} unit="px" change={v=>patch(active.id,{curve:v})}/><Range label="Ondulação" value={active.wave||0} min={-90} max={90} unit="px" change={v=>patch(active.id,{wave:v})}/><Range label="Profundidade 3D" value={active.depth||0} min={0} max={22} unit="" change={v=>patch(active.id,{depth:v})}/><Range label="Espaço entre letras" value={active.tracking||0} min={-12} max={45} unit="px" change={v=>patch(active.id,{tracking:v})}/><Range label="Contorno" value={active.strokeWidth||0} min={0} max={25} unit="px" change={v=>patch(active.id,{strokeWidth:v,stroke:active.stroke||'#121212'})}/><label>Cor do contorno<input type="color" value={active.stroke||'#121212'} onChange={e=>patch(active.id,{stroke:e.target.value})}/></label></>}
   {active.kind==='image'&&<><Range label="Brilho" value={active.brightness??100} min={20} max={200} unit="%" change={v=>patch(active.id,{brightness:v})}/><Range label="Contraste" value={active.contrast??100} min={20} max={200} unit="%" change={v=>patch(active.id,{contrast:v})}/><Range label="Saturação" value={active.saturation??100} min={0} max={200} unit="%" change={v=>patch(active.id,{saturation:v})}/><Range label="Desfoque" value={active.blur||0} min={0} max={30} unit="px" change={v=>patch(active.id,{blur:v})}/><Range label="Cinza" value={active.grayscale||0} min={0} max={100} unit="%" change={v=>patch(active.id,{grayscale:v})}/><Range label="Sépia" value={active.sepia||0} min={0} max={100} unit="%" change={v=>patch(active.id,{sepia:v})}/><Range label="Matiz" value={active.hue||0} min={-180} max={180} unit="°" change={v=>patch(active.id,{hue:v})}/><Range label="Perspectiva / Inclinação" value={active.skew||0} min={-35} max={35} unit="°" change={v=>patch(active.id,{skew:v})}/></>}
  </div>}
  </aside></div>
  <input ref={fileRef} type="file" hidden multiple accept="image/png,image/jpeg,image/webp,image/avif,application/pdf,.psd" onChange={e=>void upload(e.currentTarget.files)}/>
  <input ref={projectRef} type="file" hidden accept=".cgdesign,application/json" onChange={e=>void readProject(e.currentTarget.files?.[0])}/>
  {showAgent&&<StudioConcierge area="editor" onClose={()=>setShowAgent(false)} onAction={a=>{if(a==='backgrounds'||a==='templates'||a==='texts'||a==='elements'||a==='personagens'||a==='uploads'){setPanel(a);return true;}if(a==='guides'){setGuides(true);return true;}if(a==='export'){setExportOpen(true);return true;}return false;}}/>}
  {notice&&<div className="cr-notice" role="status"><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Fechar"><X size={16}/></button></div>}
  {exportOpen&&<div className="cr-backdrop" onClick={()=>setExportOpen(false)}><div className="cr-dialog" role="dialog" aria-modal="true" aria-label="Exportar criativo" onClick={e=>e.stopPropagation()}><div className="cr-dialog-header"><div><small>EXPORTAR</small><h2>Sua arte pronta para impressão ou divulgação.</h2></div><button onClick={()=>setExportOpen(false)} aria-label="Fechar"><X size={20}/></button></div><p>Para imprimir na caneca, use 21 × 9,5 cm em PNG, escala 100%, com 2480 × 1122 pixels e metadados de 300 DPI. Nenhuma arte é enviada ao servidor.</p><label>FORMATO<select value={format} onChange={e=>setFormat(e.target.value as ExportFormat)}><option value="png">PNG · Transparência</option><option value="jpeg">JPEG · Arquivo leve</option><option value="webp">WebP · Otimizado</option></select></label><label>RESOLUÇÃO<select value={scale} onChange={e=>setScale(Number(e.target.value))}><option value={.5}>50% · {Math.round(doc.width*.5)} × {Math.round(doc.height*.5)}</option><option value={1}>100% · {doc.width} × {doc.height}</option><option value={2}>200% · {doc.width*2} × {doc.height*2}</option></select></label><div className="cr-dialog-footer"><button onClick={()=>setExportOpen(false)}>Cancelar</button><button className="cr-primary" disabled={busy} onClick={()=>void doExport()}><Download size={17}/>{busy?'Preparando imagem...':'Exportar composição'}</button></div></div></div>}
 </div>;
}
function Range({label,value,min,max,unit,change}:{label:string;value:number;min:number;max:number;unit:string;change:(v:number)=>void}){
 return <label className="cr-range"><span><strong>{label}</strong><output>{value}{unit}</output></span><input type="range" min={min} max={max} value={value} onChange={e=>change(Number(e.target.value))}/></label>
}
