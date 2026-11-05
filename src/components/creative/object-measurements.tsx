'use client';
import {useEffect,useState} from 'react';
import {PRINT_PX_PER_MM} from '@/lib/creative/precision';
import {resizeMeasuredNode} from '@/lib/creative/mug-layout';
import type {DesignNode} from '@/lib/creative/design';

export function ObjectMeasurements({node,onChange}:{node:DesignNode;onChange:(patch:Partial<DesignNode>)=>void}){
 const [unit,setUnit]=useState<'px'|'mm'>('px');
 const [error,setError]=useState('');
 const divisor=unit==='mm'?PRINT_PX_PER_MM:1;
 const resize=(axis:'w'|'h',value:number)=>{try{onChange(resizeMeasuredNode(node,axis,value*divisor));setError('');}catch(e){setError(e instanceof Error?e.message:'Medida inválida.');}};
 return <>
  <label>Unidade das medidas<select aria-label="Unidade das medidas" value={unit} onChange={e=>setUnit(e.target.value as 'px'|'mm')}><option value="px">Pixels</option><option value="mm">Milímetros · impressão a 300 DPI</option></select></label>
  <div className="cr-2col"><Measurement label="Posição X" unit={unit} value={node.x/divisor} change={value=>onChange({x:value*divisor})}/><Measurement label="Posição Y" unit={unit} value={node.y/divisor} change={value=>onChange({y:value*divisor})}/><Measurement label="Largura" unit={unit} value={node.w/divisor} change={value=>resize('w',value)}/><Measurement label="Altura" unit={unit} value={node.h/divisor} change={value=>resize('h',value)}/></div>
  {node.kind!=='text'&&node.kind!=='image'&&<label className="cr-proportion-option"><input type="checkbox" checked={node.aspectLock!==false} onChange={e=>onChange({aspectLock:e.target.checked})}/> Manter proporção</label>}
  <p className="cr-helper">{unit==='mm'?'Medidas físicas calculadas a 300 DPI; imprima em tamanho real, sem ajustar à página.':'Medidas em pixels da arte.'}{node.kind==='image'||node.kind==='text'?' Proporção protegida.':''}</p>
  {error&&<p role="alert">{error}</p>}
 </>;
}
function Measurement({label,unit,value,change}:{label:string;unit:string;value:number;change:(n:number)=>void}){
 const rounded=()=>String(Math.round(value*1000)/1000);
 const [draft,setDraft]=useState(rounded);
 useEffect(()=>setDraft(String(Math.round(value*1000)/1000)),[value]);
 const commit=()=>{const n=Number(draft);if(draft.trim()&&Number.isFinite(n)&&n>=-32768&&n<=32768){if(Math.abs(n-value)>.00051)change(n);}else setDraft(rounded());};
 return <label>{label} <span className="cr-field-unit">{unit}</span><input type="number" aria-label={label} step="0.1" value={draft} onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label>;
}
