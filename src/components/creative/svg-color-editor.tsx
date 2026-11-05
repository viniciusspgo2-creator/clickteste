'use client';
import {useMemo,useState} from 'react';
import {Palette,Download} from 'lucide-react';
import {inspectSvg,recolorSvg,svgSource,type SvgPaint} from '@/lib/creative/editable-svg';
import {saveBlob} from '@/lib/creative/design';
import {SvgRegionPreview} from './svg-region-preview';

export function SvgColorEditor({src,onChange,globalColor=false}:{src:string;onChange:(src:string)=>void;globalColor?:boolean}){
 const [mode,setMode]=useState<'part'|'color'>('part');
 const [selected,setSelected]=useState('');
 const [query,setQuery]=useState('');
 const [error,setError]=useState('');
 const inspected=useMemo(()=>{try{return inspectSvg(src);}catch{return null;}},[src]);
 if(!inspected)return null;
 const paints=mode==='part'?inspected.paints:inspected.paints.filter((p,i,all)=>all.findIndex(v=>v.color===p.color&&v.alpha===p.alpha)===i);
 const filtered=paints.filter(p=>p.label.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
 const current=filtered.find(p=>p.key===selected)||filtered[0];
 const change=(paint:SvgPaint,color:string)=>{
  try{onChange(recolorSvg(src,paint.key,color,mode));setError('');}catch(e){setError(e instanceof Error?e.message:'Não foi possível trocar a cor.');}
 };
 const download=()=>{const source=svgSource(src);if(source)saveBlob(new Blob([source],{type:'image/svg+xml'}),'elemento-personalizado.svg');};
 return <details className="cr-property-group cr-svg-editor" open><summary><Palette size={16}/> Cores do SVG</summary>
  <p className="cr-property-description">Escolha uma parte para trocar só a camiseta, o cabelo ou outro detalhe. Os nomes dependem de como o SVG foi criado.</p>
  <div className="cr-svg-modes" role="group" aria-label="Modo de recolorir SVG"><button type="button" aria-pressed={mode==='part'} onClick={()=>{setMode('part');setSelected('');}}>Por parte</button><button type="button" aria-pressed={mode==='color'} onClick={()=>{setMode('color');setSelected('');}}>Por cor</button></div>
  <p className="cr-helper">{mode==='part'?'Cada preenchimento ou contorno pode ser alterado separadamente.':'Troca todas as partes com a mesma cor e transparência.'}</p>
  {paints.length>12&&<label>Buscar parte<input aria-label="Buscar parte do SVG" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nome da parte…"/></label>}
  {filtered.length>0?<>
   <label>{mode==='part'?'Parte do desenho':'Cor do desenho'}<select aria-label="Parte do SVG" value={current?.key||''} onChange={e=>setSelected(e.target.value)}>{filtered.map((paint,i)=><option key={paint.key} value={paint.key}>{mode==='part'?`${i+1}. ${paint.label}`:`${paint.color.toUpperCase()} · ${inspected.paints.filter(p=>p.color===paint.color&&p.alpha===paint.alpha).length} partes`}</option>)}</select></label>
   {current&&<><SvgRegionPreview source={inspected.source} paints={inspected.paints} selected={mode==='part'?current.key:''} onSelect={key=>{setMode('part');setSelected(key);setQuery('');}}/><small className="cr-helper">Clique na região do desenho para selecioná-la. O contorno rosa aparece só nesta prévia.</small><label className="cr-svg-color-label">Nova cor<div className="cr-svg-color-row"><input aria-label="Nova cor da parte do SVG" type="color" value={current.color} onChange={e=>change(current,e.target.value)}/><span>{current.color.toUpperCase()}{current.alpha<1?' · transparência preservada':''}</span></div></label></>}
   <div className="cr-svg-swatches" aria-label="Cores presentes no desenho">{paints.slice(0,48).map((paint,i)=><button key={paint.key} type="button" title={`${paint.label} · ${paint.color}`} aria-label={`Selecionar ${paint.label} ${i+1}`} aria-pressed={current?.key===paint.key} style={{backgroundColor:paint.color}} onClick={()=>{setSelected(paint.key);setQuery('');}}/>)}</div>
  </>:<p className="cr-helper">{query?'Nenhuma parte encontrada.':'Este SVG não possui preenchimentos ou contornos sólidos editáveis.'}</p>}
  {error&&<p role="alert">{error}</p>}
  {globalColor&&<p className="cr-helper">Ao trocar uma parte, a recoloração global da imagem será removida para mostrar as cores individuais.</p>}
  <button className="cr-outlined" type="button" onClick={download}><Download size={14}/> Baixar SVG personalizado</button>
  <p className="cr-helper">Ctrl+Z desfaz. As cores permanecem editáveis ao salvar o projeto .cgdesign. Imagens PNG/JPG dentro de um SVG não viram partes vetoriais.</p>
 </details>;
}
