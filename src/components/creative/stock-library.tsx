'use client';
import {useMemo,useState} from 'react';
import {Search} from 'lucide-react';
import {stockIcons,tablerIconUrl,iconDataUrl} from '@/lib/creative/stock-icons';
import {stockObjects,objectDataUrl} from '@/lib/creative/stock-objects';
export function StockLibrary({kind,add,color='#ff9235'}:{kind:'icons'|'objects';add:(src:string)=>Promise<void>;color?:string}){
 const [search,setSearch]=useState(''),[category,setCategory]=useState('Todos'),[busy,setBusy]=useState<string|null>(null);
 const items=kind==='icons'?stockIcons:stockObjects;
 const groups=useMemo(()=>['Todos',...new Set(items.map(x=>x.category))],[kind]);
 const filtered=items.filter(x=>(category==='Todos'||x.category===category)&&`${x.category} ${'label'in x?x.label:x.name}`.toLowerCase().includes(search.toLowerCase()));
 const select=async(id:string)=>{setBusy(id);try{await add(kind==='icons'?await iconDataUrl(id,color):objectDataUrl(id,color));}catch(e){window.alert(e instanceof Error?e.message:'Falha ao carregar elemento.');}finally{setBusy(null);}};
 return <div className="cr-stock-library">
  <div className="cr-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Buscar ${kind==='icons'?'ícones':'objetos'}...`}/></div>
  <div className="cr-category-tabs">{groups.map(g=><button key={g} className={category===g?'active':''} onClick={()=>setCategory(g)}>{g}</button>)}</div>
  <p className="cr-helper">{kind==='icons'?'Ícones SVG Tabler · MIT · carregados sob demanda.':'Objetos decorativos vetoriais originais para estampas de canecas.'} Clique para inserir e ajuste tamanho, sombra e transparência no Editor.</p>
  <div className="cr-stock-grid">{filtered.map(item=>{
   const id=kind==='icons'?(item as typeof stockIcons[number]).name:(item as typeof stockObjects[number]).id;
   const thumb=kind==='icons'?tablerIconUrl(id):objectDataUrl(id);
   const label=kind==='icons'?(item as typeof stockIcons[number]).label:(item as typeof stockObjects[number]).name;
   return <button key={id} onClick={()=>void select(id)} disabled={busy===id} title={label}><img loading="lazy" alt="" src={thumb}/><span>{busy===id?'Carregando...':label}</span></button>;
  })}</div>
  {!filtered.length&&<p className="cr-empty">Nenhum resultado para sua busca.</p>}
 </div>;
}
