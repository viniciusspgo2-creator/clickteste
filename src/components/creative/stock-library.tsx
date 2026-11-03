'use client';
import {useEffect,useMemo,useState} from 'react';
import {Search} from 'lucide-react';
import {stockIcons,loadTablerCatalog,tablerIconUrl,iconDataUrl,type StockIcon} from '@/lib/creative/stock-icons';
import {stockObjects,objectDataUrl} from '@/lib/creative/stock-objects';

type Item={id:string;label:string;category:string;origin:'tabler'|'original';searchText:string};
export function StockLibrary({kind,add,color='#ff9235'}:{kind:'icons'|'objects';add:(src:string)=>Promise<void>;color?:string}){
 const [search,setSearch]=useState(''),[category,setCategory]=useState('Todos'),[busy,setBusy]=useState<string|null>(null);
 const [catalog,setCatalog]=useState<StockIcon[]>(stockIcons),[catalogLoading,setCatalogLoading]=useState(true),[visible,setVisible]=useState(72);
 useEffect(()=>{let live=true;setCatalogLoading(true);void loadTablerCatalog().then(entries=>{if(live)setCatalog(entries);}).finally(()=>{if(live)setCatalogLoading(false);});return()=>{live=false};},[]);
 const items=useMemo<Item[]>(()=>{
  const originals=kind==='objects'?stockObjects.map(o=>({id:o.id,label:o.name,category:o.category,origin:'original' as const,searchText:`${o.name} ${o.category}`})):[];
  const vectors=catalog.map(icon=>({id:icon.name,label:icon.name.replace(/-/g,' '),category:icon.category,origin:'tabler' as const,searchText:`${icon.label} ${icon.category}`}));
  return [...originals,...vectors];
 },[catalog,kind]);
 const categories=useMemo(()=>['Todos',...new Set(items.map(x=>x.category))],[items]);
 const filtered=useMemo(()=>items.filter(item=>(category==='Todos'||item.category===category)&&item.searchText.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR'))),[items,category,search]);
 const displayed=filtered.slice(0,visible);
 useEffect(()=>{setVisible(72);},[kind,category,search]);
 const select=async(item:Item)=>{setBusy(`${item.origin}:${item.id}`);try{await add(item.origin==='tabler'?await iconDataUrl(item.id,color):objectDataUrl(item.id,color));}catch(e){window.alert(e instanceof Error?e.message:'Falha ao carregar elemento.');}finally{setBusy(null);}};
 return <div className="cr-stock-library">
  <div className="cr-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Buscar ${kind==='icons'?'ícones':'objetos'} entre milhares...`}/></div>
  <div className="cr-category-tabs">{categories.map(g=><button key={g} className={category===g?'active':''} onClick={()=>setCategory(g)}>{g}</button>)}</div>
  <p className="cr-helper">{kind==='icons'?'Ícones SVG Tabler · licença MIT.':'Objetos decorativos originais + catálogo vetorial Tabler · licença MIT.'} Clique para inserir e ajuste tamanho, cor, degradê e transparência. Os SVGs são carregados somente ao escolher ou visualizar cada item.</p>
  <p className="cr-stock-total" role="status">{catalogLoading?'Carregando catálogo ampliado…':`${filtered.length.toLocaleString('pt-BR')} opções disponíveis`}</p>
  <div className="cr-stock-grid" aria-busy={catalogLoading}>{catalogLoading?Array.from({length:8},(_,i)=><div className="cr-skeleton-item" key={i}><span/><small/></div>):displayed.map(item=>{
   const thumb=item.origin==='tabler'?tablerIconUrl(item.id):objectDataUrl(item.id,color),key=`${item.origin}:${item.id}`;
   return <button key={key} onClick={()=>void select(item)} disabled={busy===key} title={item.label}><img className={item.origin==='tabler'?'cr-svg-white':''} loading="lazy" alt="" src={thumb} onError={e=>{if(item.origin!=='tabler')return;const img=e.currentTarget;if(img.dataset.fallback!=='1'){img.dataset.fallback='1';img.src=tablerIconUrl(item.id,'filled');}}}/><span>{busy===key?'Carregando...':item.label}</span></button>;
  })}</div>
  {visible<filtered.length&&<button className="cr-outlined" onClick={()=>setVisible(n=>n+72)}>Carregar mais 72 · {Math.max(0,filtered.length-visible).toLocaleString('pt-BR')} restantes</button>}
  {!filtered.length&&<p className="cr-empty">Nenhum resultado para sua busca.</p>}
 </div>;
}
