'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,ImageIcon,Search,Play,Plus,Layers3,ExternalLink} from 'lucide-react';
import './creative.css';
import {builtInPresets} from '@/lib/creative/presets';
type Asset={id:string;name:string;url:string;category:string;mimeType:string;tags:string[]};
export function TemplateGallery(){
 const [q,setQ]=useState(''),[category,setCategory]=useState(''),[page,setPage]=useState(1),[items,setItems]=useState<Asset[]>([]),[total,setTotal]=useState(0),[error,setError]=useState('');
 useEffect(()=>{let cancelled=false;
  void fetch(`/api/creative-assets?kind=template&page=${page}&q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`,{cache:'no-store'}).then(r=>r.json()).then(d=>{
    if(cancelled)return;if(!d.ok)throw Error(d.error);setItems(d.items);setTotal(d.total);setError('');
  }).catch(()=>{if(!cancelled)setError('Catálogo temporariamente indisponível.')});
  return()=>{cancelled=true};
 },[q,page,category]);
 return <div className="cr-gallery"><div className="cr-gallery-head"><Link href="/" className="cr-gallery-back"><ArrowLeft size={18}/> Voltar às ferramentas</Link><span>CLICK & GRUDA / STUDIO TEMPLATES</span><h1>Um cenário para cada ideia<span>.</span></h1><p>Explore layouts profissionais e componha suas canecas para redes sociais, vitrines e divulgação. Publique novos modelos diretamente pelo painel Admin.</p><div className="cr-gallery-actions"><div className="cr-search"><Search size={17}/><input placeholder="Buscar templates, temas, campanhas..." value={q} onChange={e=>{setQ(e.target.value);setPage(1)}}/></div><Link href="/editor-artes" className="cr-gallery-new"><Plus size={17}/> Criar do zero</Link></div></div>
  <div className="cr-gallery-body"><div className="cr-gallery-filter"><button className={!category?'active':''} onClick={()=>{setCategory('');setPage(1)}}>Todos</button>{Array.from(new Set(items.map(a=>a.category))).map(c=><button key={c} className={category===c?'active':''} onClick={()=>{setCategory(c);setPage(1)}}>{c}</button>)}<span>{total} modelos</span></div>
   <p className="cr-gallery-subtitle">LAYOUTS EDITÁVEIS DA PLATAFORMA</p><div className="cr-gallery-grid cr-gallery-builtins">{builtInPresets.map(p=><article className="cr-gallery-card" key={p.id}><Link href={`/editor-artes?preset=${p.id}`} className={`cr-preset-preview ${p.id}`}><span className="cr-preset-label">{p.name}</span><span className="cr-preset-line">CANECAS COM PERSONALIDADE</span><span className="cr-preset-base"/></Link><div className="cr-gallery-description"><div><strong>{p.name}</strong><small>{p.category} · Layout editável</small></div><Link href={`/editor-artes?preset=${p.id}`} title="Usar layout"><Plus size={18}/></Link></div></article>)}</div>
   <p className="cr-gallery-subtitle">TEMPLATES DA BIBLIOTECA ADMINISTRATIVA</p>
   {error&&<div className="cr-empty">{error}</div>}
   {!error&&items.length===0&&<div className="cr-gallery-empty"><Layers3 size={42}/><h2>Nenhum template administrativo publicado ainda.</h2><p>Importe imagens e MP4 pelo Painel Admin → Biblioteca Criativa. Os templates publicados aparecem automaticamente nesta página.</p><Link href="/editor-artes">Abrir Editor de Artes <ExternalLink size={16}/></Link></div>}
   <div className="cr-gallery-grid">{items.map(a=><article key={a.id} className="cr-gallery-card"><div className="cr-gallery-thumbnail">{a.mimeType==='video/mp4'?<video src={a.url} muted controls preload="metadata" playsInline/>:<img src={a.url} alt={`Template ${a.name}`} loading="lazy"/>}</div><div className="cr-gallery-description"><div><strong>{a.name}</strong><small>{a.category} · {a.mimeType==='video/mp4'?'MP4 · prévia':'Imagem editável'}</small></div>{a.mimeType==='video/mp4'?<span title="Vídeo: edição em fase posterior"><Play size={16}/></span>:<Link href={`/editor-artes?asset=${a.id}`} title="Usar template"><Plus size={18}/></Link>}</div></article>)}</div>
   {total>36&&<div className="cr-gallery-pagination"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Anterior</button><span>Página {page} / {Math.ceil(total/36)}</span><button disabled={page>=Math.ceil(total/36)} onClick={()=>setPage(p=>p+1)}>Próxima</button></div>}
  </div></div>;
}
