'use client';
import {useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,Search,Plus,BookOpen,ArrowUpRight} from 'lucide-react';
import './creative.css';
import {filterStudioScenes,studioScenes,studioSceneCategories} from '@/lib/creative/studio-scenes';
import {StudioConcierge} from '@/components/creative/studio-concierge';
import {usePlatformLanguage} from '@/components/platform/language-provider';
const PAGE_SIZE=24;
export function TemplateGallery(){
 const {t}=usePlatformLanguage();
 const [showAgent,setShowAgent]=useState(false);
 const [q,setQ]=useState(''),[category,setCategory]=useState(''),[page,setPage]=useState(1);
 const filtered=filterStudioScenes(q,category),pages=Math.ceil(filtered.length/PAGE_SIZE);
 const items=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
 return <div className="cr-gallery"><div className="cr-gallery-head">
  <Link href="/" className="cr-gallery-back"><ArrowLeft size={18}/> Voltar às ferramentas</Link>
  <span>CLICK & GRUDA / STUDIO TEMPLATES</span><h1>{t('Um cenário para cada ideia')}<span>.</span></h1>
  <p>Escolha um cenário para apresentar seu mockup. No editor, ajuste a caneca e acrescente textos, sua logo e outros elementos ao criativo.</p>
  <div className="cr-gallery-actions"><div className="cr-search"><Search size={17}/><input aria-label="Buscar cenários" placeholder="Buscar cafés, aniversário, neon..." value={q} onChange={e=>{setQ(e.target.value);setPage(1)}}/></div>
   <Link href="/editor-artes" className="cr-gallery-new"><Plus size={17}/> Criar do zero</Link>
   <button type="button" className="cr-gallery-new" onClick={()=>setShowAgent(true)}><BookOpen size={17}/> Guia de canecas</button>
  </div></div>
  <div className="cr-gallery-body"><div className="cr-gallery-filter" role="group" aria-label="Categorias de cenários">
   <button type="button" aria-pressed={!category} className={!category?'active':''} onClick={()=>{setCategory('');setPage(1)}}>{t('Todos')}</button>
   {studioSceneCategories.map(c=><button type="button" key={c} aria-pressed={category===c} className={category===c?'active':''} onClick={()=>{setCategory(c);setPage(1)}}>{c}</button>)}
   <span aria-live="polite">{filtered.length} de {studioScenes.length} cenários</span>
  </div>
  <p className="cr-gallery-subtitle">CENÁRIOS PARA SEUS MOCKUPS</p>
  <p className="cr-scene-help">Envie sua caneca do Studio 3D para o editor ou importe um PNG com fundo transparente. O cenário é uma imagem de fundo; textos e logo são adicionados separadamente no editor.</p>
  {items.length===0&&<div className="cr-gallery-empty"><h2>Nenhum cenário encontrado.</h2><p>Tente outro termo ou escolha outra categoria.</p><button type="button" onClick={()=>{setQ('');setCategory('');setPage(1)}}>Ver todos os cenários</button></div>}
  <div className="cr-gallery-grid">{items.map(scene=>{
   const href=`/editor-artes/editor?scene=${scene.id}&from=mockup`;
   return <article className="cr-gallery-card" key={scene.id}>
    <Link href={href} className="cr-gallery-thumbnail" aria-label={`Usar cenário ${scene.name}`}><img src={scene.preview} width={scene.width} height={scene.height} alt={scene.name} loading="lazy" decoding="async"/></Link>
    <div className="cr-gallery-description"><div><strong>{scene.name}</strong><small>{scene.width} × {scene.height} px · Fundo de cenário</small></div><Link href={href} aria-label={`Abrir ${scene.name} no editor`} title="Usar cenário no editor"><ArrowUpRight size={18}/></Link></div>
   </article>;
  })}</div>
  {pages>1&&<nav className="cr-gallery-pagination" aria-label="Páginas de cenários"><button type="button" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>{t('Anterior')}</button><span>{t('Página')} {page} / {pages}</span><button type="button" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>{t('Próxima')}</button></nav>}
  </div>{showAgent&&<StudioConcierge area="templates" onClose={()=>setShowAgent(false)}/>}</div>;
}
