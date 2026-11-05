 'use client';
import {useMemo,useState} from 'react';
import dynamic from 'next/dynamic';
import {stockObjects,objectDataUrl} from '@/lib/creative/stock-objects';
import {ENABLE_ICONS_TAB} from '@/lib/creative/editor-flags';
const LegacyIcons=dynamic(()=>import('./legacy-icon-library').then(m=>m.LegacyIconLibrary));
export function StockLibrary({kind,add,color='#ff9235'}:{kind:'icons'|'objects';add:(src:string)=>Promise<void>;color?:string}){
 const [query,setQuery]=useState(''),[category,setCategory]=useState('Todos');
 const filtered=useMemo(()=>stockObjects.filter(o=>(category==='Todos'||o.category===category)&&`${o.name} ${o.category}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))),[query,category]);
 if(kind==='icons')return ENABLE_ICONS_TAB?<LegacyIcons kind="icons" add={add} color={color}/>:null;
 return <div className="cr-stock-library"><input aria-label="Buscar objetos" placeholder="Buscar objetos..." value={query} onChange={e=>setQuery(e.target.value)}/><div className="cr-category-tabs">{['Todos',...new Set(stockObjects.map(o=>o.category))].map(c=><button key={c} onClick={()=>setCategory(c)} aria-pressed={c===category}>{c}</button>)}</div><p className="cr-helper">{filtered.length} objetos decorativos · ajuste cores e tamanho após inserir.</p><div className="cr-stock-grid">{filtered.map(o=><button key={o.id} title={o.name} onClick={()=>void add(objectDataUrl(o.id,color))}><img src={objectDataUrl(o.id,color)} alt="" loading="lazy"/><span>{o.name}</span></button>)}</div></div>;
}
