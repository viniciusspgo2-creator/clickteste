'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {AlertCircle,Bookmark,Check,Clock3,FolderOpen,Image as ImageIcon,LoaderCircle,Search,ShieldCheck,Sparkles,Star,Type,RefreshCw,ArrowLeft,ImagePlus} from 'lucide-react';
import {BACKGROUND_STYLES,PALETTES,LIBRARY_CATEGORIES,LIBRARY_TABS,STATIC_MANIFEST,libraryManifest,libraryMatch,type LibraryCategory,type LibraryItem,type LibraryTab} from '@/lib/creative/library-manifest';
import {loadApprovedTablerCatalog,loadLibraryImage,previewLibraryAsset} from '@/lib/creative/library-load';
import {ENABLE_ICONS_TAB} from '@/lib/creative/editor-flags';
import type {StockIcon} from '@/lib/creative/stock-icons';

type ViewTab=LibraryTab|'Favoritos'|'Recentes';
type Props={backgroundsOnly?:boolean;onOpenBackgrounds?:()=>void;color:string;onColorChange:(color:string)=>void;width:number;height:number;onInsertImage:(dataUrl:string)=>Promise<void>;onApplyBackground:(dataUrl:string)=>Promise<void>;onInsertText:(text:string)=>void;onOpenModels:()=>void};
const FAVORITES_KEY='cg:editor:library-favorites-v1';
const RECENTS_KEY='cg:editor:library-recents-v1';
const VIEWS:ViewTab[]=[...LIBRARY_TABS,'Favoritos','Recentes'];
const rowHeight=198;
function safeStoredIds(key:string):string[]{
 try{const data=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(data)?data.filter((v):v is string=>typeof v==='string').slice(0,90):[];}catch{return []}
}
function Thumb({item,color,strokeWidth}:{item:LibraryItem;color:string;strokeWidth:number}){
 const [src,setSrc]=useState('');const [error,setError]=useState(false);
 useEffect(()=>{
  let active=true;setSrc('');setError(false);
  if(item.formato==='TEXTO')return;
  void previewLibraryAsset(item,color,600,272,strokeWidth).then(value=>{if(active)setSrc(value);}).catch(()=>{if(active)setError(true);});
  return()=>{active=false};
 },[item,color,strokeWidth]);
 if(item.formato==='TEXTO')return <span className="cr-curated-quote" aria-hidden="true">Aa</span>;
 if(error)return <span className="cr-curated-broken" aria-label="Prévia indisponível"><AlertCircle size={19}/></span>;
 if(!src)return <LoaderCircle className="cr-curated-spin" size={21} aria-label="Carregando prévia"/>;
 return <img loading="lazy" alt="" src={src} onError={()=>setError(true)}/>;
}
export function CuratedLibrary({backgroundsOnly=false,onOpenBackgrounds,color,onColorChange,width,height,onInsertImage,onApplyBackground,onInsertText,onOpenModels}:Props){
 const [tab,setTab]=useState<ViewTab>(backgroundsOnly?'Fundos e Padrões':'Stickers');
 const [category,setCategory]=useState<LibraryCategory|'Todas'>('Todas');
 const [query,setQuery]=useState('');
 const [collection,setCollection]=useState('Todas');
 const [style,setStyle]=useState('Todos');
 const [palette,setPalette]=useState('Todas');
 const [fileFilter,setFileFilter]=useState<'Todos'|'SVG'|'PNG'|'WEBP'|'TEXTO'>('Todos');
 const [viewportHeight,setViewportHeight]=useState(460);
 const [strokeWidth,setStrokeWidth]=useState(24);
 const [catalog,setCatalog]=useState<StockIcon[]>([]);
 const [loading,setLoading]=useState(true);
 const [fallback,setFallback]=useState(false);
 const [retryCatalog,setRetryCatalog]=useState(0);
 const [busy,setBusy]=useState<string|null>(null);
 const [message,setMessage]=useState('');
 const [favorites,setFavorites]=useState<string[]>([]);
 const [recents,setRecents]=useState<string[]>([]);
 const [storageReady,setStorageReady]=useState(false);
 const [scrollTop,setScrollTop]=useState(0);
 const [clientWidth,setClientWidth]=useState(252);
 const listRef=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{setFavorites(safeStoredIds(FAVORITES_KEY));setRecents(safeStoredIds(RECENTS_KEY));setStorageReady(true);},[]);
 useEffect(()=>{if(!storageReady)return;try{localStorage.setItem(FAVORITES_KEY,JSON.stringify(favorites));}catch{/* Navegador com armazenamento bloqueado */}},[favorites,storageReady]);
 useEffect(()=>{if(!storageReady)return;try{localStorage.setItem(RECENTS_KEY,JSON.stringify(recents));}catch{/* Navegador com armazenamento bloqueado */}},[recents,storageReady]);
 useEffect(()=>{let live=true;setLoading(true);setFallback(false);
  void loadApprovedTablerCatalog().then(icons=>{if(!live)return;setCatalog(icons);setFallback(ENABLE_ICONS_TAB&&icons.length<1000);}).catch(()=>{if(live){setFallback(true);setMessage('Não foi possível carregar a seleção ampliada. Os itens básicos continuam disponíveis.');}}).finally(()=>{if(live)setLoading(false)});
  return()=>{live=false};
 },[retryCatalog]);
 useEffect(()=>{const node=listRef.current;if(!node)return;const measure=()=>{setClientWidth(node.clientWidth||252);setViewportHeight(node.clientHeight||460);};measure();
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;observer?.observe(node);return()=>observer?.disconnect();},[]);
 const manifest=useMemo(()=>catalog.length?libraryManifest(catalog):STATIC_MANIFEST,[catalog]);
 const itemById=useMemo(()=>new Map(manifest.map(item=>[item.id,item])),[manifest]);
 const favoriteSet=useMemo(()=>new Set(favorites),[favorites]);
 const recentPositions=useMemo(()=>new Map(recents.map((id,i)=>[id,i])),[recents]);
 const collections=useMemo(()=>{
  const items=tab==='Favoritos'?favorites.map(id=>itemById.get(id)).filter(Boolean):tab==='Recentes'?recents.map(id=>itemById.get(id)).filter(Boolean):manifest.filter(i=>i.aba===tab);
  const counts=new Map<string,number>();for(const item of items){if(item?.colecao)counts.set(item.colecao,(counts.get(item.colecao)||0)+1);}
  return [...counts.entries()].sort(([a],[b])=>a.localeCompare(b,'pt-BR'));
 },[tab,favorites,recents,itemById,manifest]);
 const filtered=useMemo(()=>{
  let items:LibraryItem[];
  if(tab==='Favoritos')items=favorites.map(id=>itemById.get(id)).filter((i):i is LibraryItem=>Boolean(i));
  else if(tab==='Recentes')items=recents.map(id=>itemById.get(id)).filter((i):i is LibraryItem=>Boolean(i));
  else items=manifest.filter(i=>i.aba===tab);
  if(tab==='Recentes')items=items.sort((a,b)=>(recentPositions.get(a.id)??Infinity)-(recentPositions.get(b.id)??Infinity));
  return items.filter(item=>(collection==='Todas'||item.colecao===collection)&&(category==='Todas'||item.categoria===category)&&(fileFilter==='Todos'||item.formato===fileFilter)&&(tab!=='Fundos e Padrões'||((style==='Todos'||item.estilo===style)&&(palette==='Todas'||item.paleta===palette)))&&libraryMatch(item,query));
 },[tab,favorites,recents,manifest,itemById,category,query,recentPositions,fileFilter,style,palette,collection]);
 const resetScroll=()=>{setScrollTop(0);if(listRef.current)listRef.current.scrollTop=0;};
 const setView=(value:ViewTab)=>{setTab(value);setCollection('Todas');setCategory('Todas');setFileFilter('Todos');setStyle('Todos');setPalette('Todas');setMessage('');resetScroll()};
 const choose=async(item:LibraryItem)=>{
  if(busy)return;setBusy(item.id);setMessage('');
  try{
   if(item.formato==='TEXTO')onInsertText(item.arquivo.substring(5));
   else {const src=await loadLibraryImage(item,color,width,height,strokeWidth);
    if(item.aba==='Fundos e Padrões')await onApplyBackground(src);
    else await onInsertImage(src);
   }
   setRecents(previous=>[item.id,...previous.filter(x=>x!==item.id)].slice(0,40));
  }catch(e){setMessage(e instanceof Error?e.message:'Não foi possível inserir o elemento. Tente novamente.');}
  finally{setBusy(null);}
 };
 const toggleFavorite=(id:string)=>setFavorites(previous=>previous.includes(id)?previous.filter(x=>x!==id):[id,...previous].slice(0,90));
 const showCollections=!backgroundsOnly&&tab!=='Favoritos'&&tab!=='Recentes'&&collection==='Todas'&&!query.trim()&&category==='Todas'&&fileFilter==='Todos'&&collections.length>1;
 const cols=Math.max(1,Math.floor((clientWidth-8)/112));
 const rows=Math.ceil(filtered.length/cols);
 const startRow=Math.max(0,Math.floor(scrollTop/rowHeight)-2);
 const endRow=Math.min(rows,startRow+Math.ceil(viewportHeight/rowHeight)+6);
 const visible=filtered.slice(startRow*cols,endRow*cols);
 return <section className="cr-curated" aria-label="Biblioteca curada de artes">
  <div className="cr-curated-intro"><Sparkles size={18}/><div><strong>Biblioteca criativa</strong><small>Peças selecionadas para personalizar canecas</small></div></div>
  {!backgroundsOnly&&<div className="cr-library-navigation" aria-label="Seções da biblioteca">
   <label><span className="sr-only">Tipo de conteúdo</span><select aria-label="Tipo de conteúdo" value={tab} onChange={e=>setView(e.target.value as ViewTab)}>{VIEWS.filter(view=>backgroundsOnly?view==='Fundos e Padrões':view!=='Fundos e Padrões').map(view=><option key={view} value={view}>{view==='Stickers'?'Ilustrações e adesivos':view==='Modelos'?'Modelos editáveis':view}</option>)}</select></label>
   {!backgroundsOnly&&<><button type="button" aria-label="Favoritos da biblioteca" title="Favoritos" aria-pressed={tab==='Favoritos'} onClick={()=>setView('Favoritos')}><Bookmark size={16}/></button><button type="button" aria-label="Recentes da biblioteca" title="Usados recentemente" aria-pressed={tab==='Recentes'} onClick={()=>setView('Recentes')}><Clock3 size={16}/></button></>}
  </div>}
  {collection!=='Todas'&&<div className="cr-library-collection-path"><button type="button" onClick={()=>{setCollection('Todas');resetScroll();}} aria-label="Voltar para todas as coleções"><ArrowLeft size={13}/> Coleções</button><span aria-hidden="true">/</span><strong title={collection}>{collection}</strong></div>}
  <label className="cr-curated-search"><Search size={17}/><span className="sr-only">Pesquisar itens da biblioteca</span><input value={query} onChange={e=>{setQuery(e.target.value);resetScroll()}} placeholder="Buscar nesta seção..."/></label>
  {!backgroundsOnly&&collections.length>0&&(collection!=='Todas'||Boolean(query.trim()))&&<label className="cr-curated-collection">Coleção<select aria-label="Coleção da biblioteca" value={collection} onChange={e=>{setCollection(e.target.value);resetScroll();}}><option value="Todas">Todas as coleções</option>{collections.map(([name,count])=><option key={name} value={name}>{name} ({count})</option>)}</select></label>}
  {tab==='Fundos e Padrões'&&<div className="cr-curated-background-filters"><label>Estilo do fundo<select aria-label="Estilo do fundo" value={style} onChange={e=>{setStyle(e.target.value);resetScroll()}}><option value="Todos">Todos os estilos</option>{BACKGROUND_STYLES.map(value=><option key={value}>{value}</option>)}</select></label><label>Paleta de cores<select aria-label="Paleta de cores" value={palette} onChange={e=>{setPalette(e.target.value);resetScroll()}}><option value="Todas">Todas as paletas</option>{PALETTES.map(([name])=><option key={name}>{name}</option>)}</select></label></div>}
  <details className="cr-curated-advanced"><summary>Filtros · ocasião, formato e cor</summary>
  <div className="cr-curated-categories" aria-label="Filtrar por ocasião"><button type="button" aria-pressed={category==='Todas'} className={category==='Todas'?'active':''} onClick={()=>{setCategory('Todas');resetScroll()}}>Todas</button>{LIBRARY_CATEGORIES.map(cat=><button type="button" key={cat} aria-pressed={category===cat} className={category===cat?'active':''} onClick={()=>{setCategory(cat);resetScroll()}}>{cat}</button>)}</div>
  {(tab==='Stickers'||tab==='Elementos'||tab==='Formas'||tab==='Molduras e Faixas')&&<div className="cr-curated-controls"><label>Cor do vetor <input type="color" value={color} onChange={e=>onColorChange(e.target.value)} aria-label="Escolher cor dos vetores"/></label>{(tab==='Formas'||tab==='Molduras e Faixas')&&<label>Espessura <input type="range" min={4} max={64} value={strokeWidth} onChange={e=>setStrokeWidth(Number(e.target.value))} aria-label="Espessura do contorno"/><output>{strokeWidth}px</output></label>}</div>}
  <div className="cr-curated-filters"><label htmlFor="cr-library-format">Tipo de ativo</label><select id="cr-library-format" value={fileFilter} onChange={e=>{setFileFilter(e.target.value as typeof fileFilter);resetScroll()}}><option value="Todos">Todos os tipos</option><option value="SVG">SVG · vetores</option><option value="PNG">PNG · imagens transparentes</option><option value="WEBP">WebP · elementos enviados</option><option value="TEXTO">Texto editável</option></select></div>
  </details>
  <div className="cr-curated-summary" aria-live="polite"><span>{loading?'Preparando catálogo…':showCollections?`${collections.length} coleções · ${filtered.length.toLocaleString('pt-BR')} itens`:`${filtered.length.toLocaleString('pt-BR')} itens nesta seleção`}</span><span>SVG · PNG · WebP · texto</span></div>
  {fallback&&<div className="cr-curated-warning" role="status"><AlertCircle size={15}/><span>Catálogo ampliado indisponível. Mostrando itens locais.</span><button type="button" aria-label="Tentar carregar catálogo novamente" title="Tentar novamente" onClick={()=>setRetryCatalog(n=>n+1)}><RefreshCw size={15}/></button></div>}
  {tab==='Modelos'&&<button type="button" className="cr-curated-existing" onClick={onOpenModels}><FolderOpen size={21}/><span><strong>Abrir modelos do Studio</strong><small>Utilize os layouts editáveis já disponíveis no editor</small></span></button>}
  {message&&<div className="cr-curated-error" role="alert"><AlertCircle size={17}/><span>{message}</span><button type="button" onClick={()=>setMessage('')}>Fechar</button></div>}
  <div ref={listRef} className="cr-curated-viewport" role="region" aria-label="Itens disponíveis" aria-busy={loading} onScroll={e=>setScrollTop(e.currentTarget.scrollTop)}>
   {loading&&<div className="cr-curated-skeleton-grid" aria-label="Carregando itens" role="status">{Array.from({length:10},(_,i)=><div className="cr-curated-skeleton" key={i}><span/><small/></div>)}</div>}
   {!loading&&showCollections&&<div className="cr-collection-grid">{collections.map(([name,count])=>{const cover=manifest.find(item=>item.aba===tab&&item.colecao===name);return <button type="button" className="cr-collection-card" key={name} onClick={()=>{setCollection(name);resetScroll();}}>{cover&&<span className="cr-collection-cover"><Thumb item={cover} color={color} strokeWidth={strokeWidth}/></span>}<strong>{name}</strong><small>{count} itens</small></button>;})}</div>}
   {!loading&&!filtered.length&&<div className="cr-curated-empty"><ImageIcon size={28}/><strong>{query?'Nenhum resultado para esta busca':tab==='Favoritos'?'Nenhum favorito ainda':tab==='Recentes'?'Nenhum item usado recentemente':'Nenhum elemento nesta categoria'}</strong><p>{query?'Experimente “mãe”, “flor” ou “presente”.':tab==='Favoritos'?'Toque na estrela de um item para guardar aqui.':tab==='Recentes'?'Ao aplicar um item na arte, ele aparecerá aqui.':'Escolha outra ocasião ou seção.'}</p><button onClick={()=>{setQuery('');setCollection('Todas');setCategory('Todas');setFileFilter('Todos');setStyle('Todos');setPalette('Todas');resetScroll()}}>Limpar filtros</button></div>}
   {!loading&&!showCollections&&Boolean(filtered.length)&&<div className="cr-curated-virtual-space" style={{height:rows*rowHeight}}>
    {visible.map((item,i)=>{const absoluteIndex=startRow*cols+i,row=Math.floor(absoluteIndex/cols),column=absoluteIndex%cols;
     return <div className="cr-curated-slot" key={item.id} style={{top:row*rowHeight,left:`${100*column/cols}%`,width:`${100/cols}%`}}>
      <div className="cr-curated-card"><button className="cr-curated-add" type="button" disabled={busy!==null} title={`Adicionar ${item.nome}`} onClick={()=>void choose(item)}>
       <span className={`cr-curated-thumb ${(item.formato==='PNG'||item.formato==='WEBP')?'cr-curated-light':''}`}><Thumb item={item} color={color} strokeWidth={strokeWidth}/>{busy===item.id&&<span className="cr-curated-loading"><LoaderCircle size={22} className="cr-curated-spin"/></span>}</span>
       <span className="cr-curated-name" title={[item.nome,item.colecao,item.impressao?(item.impressao.vetorial?'SVG vetorial · curvas preservadas':`PNG sem perdas · ${item.impressao.largura} × ${item.impressao.altura} px`):''].filter(Boolean).join(' · ')}>{item.nome}</span>{item.impressao&&<small className="cr-curated-print-quality">{item.impressao.vetorial?'SVG vetorial':`${item.impressao.largura} × ${item.impressao.altura} px`}</small>}
      </button><button type="button" className={`cr-curated-favorite ${favoriteSet.has(item.id)?'active':''}`} aria-label={favoriteSet.has(item.id)?`Remover ${item.nome} dos favoritos`:`Salvar ${item.nome} nos favoritos`} aria-pressed={favoriteSet.has(item.id)} onClick={()=>toggleFavorite(item.id)} title="Favoritos">{favoriteSet.has(item.id)?<Check size={13}/>:<Star size={13}/>}</button></div>
     </div>;
    })}
   </div>}
  </div>
  {!backgroundsOnly&&onOpenBackgrounds&&<button className="cr-library-background-link" type="button" onClick={onOpenBackgrounds}><ImagePlus size={14}/> Fundos e padrões → aba Fundos</button>}
  <footer className="cr-curated-footer"><ShieldCheck size={14}/><span>Acervo local e elementos enviados · favoritos neste navegador</span></footer>
 </section>;
}
