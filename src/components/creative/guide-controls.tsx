'use client';
import {useEffect,useState} from 'react';
import {Lock,Unlock,Trash2,Plus,X,Eye,EyeOff} from 'lucide-react';
import {PRINT_PX_PER_MM,type RulerUnit} from '@/lib/creative/precision';
import {MAX_GUIDES,type DesignGuide} from '@/lib/creative/guides';
type Props={guides:DesignGuide[];selected:string|null;unit:RulerUnit;width:number;height:number;visible:boolean;onSelect:(id:string)=>void;onChange:(guides:DesignGuide[])=>void;onVisible:(value:boolean)=>void;onClose:()=>void};
export function GuideControls({guides,selected,unit,width,height,visible,onSelect,onChange,onVisible,onClose}:Props){
 const active=guides.find(g=>g.id===selected);
 const add=(axis:'x'|'y')=>{if(guides.length>=MAX_GUIDES)return;const guide={id:crypto.randomUUID(),axis,position:(axis==='x'?width:height)/2};onChange([...guides,guide]);onSelect(guide.id);onVisible(true);};
 const allLocked=guides.length>0&&guides.every(g=>g.locked);
 return <section className="cr-guide-controls" aria-label="Configurações das guias livres">
  <div className="cr-guide-controls-head"><div><strong>Guias livres</strong><small>Puxe das réguas. Arraste para fora da arte para apagar.</small></div><button type="button" aria-label="Fechar configurações das guias" onClick={onClose}><X size={16}/></button></div>
  <div className="cr-guide-control-actions"><button type="button" disabled={guides.length>=MAX_GUIDES} onClick={()=>add('x')}><Plus size={14}/> Vertical</button><button type="button" disabled={guides.length>=MAX_GUIDES} onClick={()=>add('y')}><Plus size={14}/> Horizontal</button><button type="button" onClick={()=>onVisible(!visible)} aria-pressed={visible}>{visible?<Eye size={14}/>:<EyeOff size={14}/>} {visible?'Ocultar linhas':'Mostrar linhas'}</button><button type="button" disabled={!guides.length} onClick={()=>onChange(guides.map(g=>({...g,locked:!allLocked})))}>{allLocked?<Unlock size={14}/>:<Lock size={14}/>} {allLocked?'Destravar todas':'Travar todas'}</button><button type="button" disabled={!guides.length} onClick={()=>onChange([])}><Trash2 size={14}/> Limpar guias</button></div>
  {guides.length>0?<div className="cr-guide-fields"><label>Guia<select aria-label="Guia selecionada" value={active?.id||''} onChange={e=>onSelect(e.target.value)}><option value="" disabled>Selecione uma linha</option>{guides.map((g,i)=><option key={g.id} value={g.id}>{i+1}. {g.axis==='x'?'Vertical':'Horizontal'} · {(g.position/(unit==='mm'?PRINT_PX_PER_MM:1)).toFixed(2)} {unit}{g.locked?' · travada':''}</option>)}</select></label>{active&&<><GuidePosition guide={active} unit={unit} max={active.axis==='x'?width:height} onChange={position=>onChange(guides.map(g=>g.id===active.id?{...g,position}:g))}/><button type="button" aria-label={active.locked?'Destravar guia selecionada':'Travar guia selecionada'} onClick={()=>onChange(guides.map(g=>g.id===active.id?{...g,locked:!g.locked}:g))}>{active.locked?<Lock size={16}/>:<Unlock size={16}/>}</button><button type="button" aria-label="Apagar guia selecionada" disabled={active.locked} onClick={()=>onChange(guides.filter(g=>g.id!==active.id))}><Trash2 size={16}/></button></>}</div>:<p>Nenhuma guia criada. Arraste da régua de cima ou da lateral, ou use os botões acima.</p>}
  <small>As linhas ajudam no alinhamento e ficam no .cgdesign. Não aparecem no PNG, JPEG ou vídeo.</small>
 </section>;
}
function GuidePosition({guide,unit,max,onChange}:{guide:DesignGuide;unit:RulerUnit;max:number;onChange:(position:number)=>void}){
 const factor=unit==='mm'?PRINT_PX_PER_MM:1;
 const [draft,setDraft]=useState(String(Number((guide.position/factor).toFixed(3))));
 useEffect(()=>setDraft(String(Number((guide.position/factor).toFixed(3)))),[guide.position,guide.id,factor]);
 const commit=()=>{const n=Number(draft)*factor;if(draft.trim()&&Number.isFinite(n)&&n>=0&&n<=max){if(Math.abs(n-guide.position)>.01)onChange(n);}else setDraft(String(Number((guide.position/factor).toFixed(3))));};
 return <label>Posição ({unit})<input type="number" aria-label="Posição da guia" min={0} max={max/factor} step="0.1" value={draft} disabled={guide.locked} onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label>;
}
