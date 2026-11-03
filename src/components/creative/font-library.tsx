'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Search,CheckCircle2,AlertCircle} from 'lucide-react';
import {loadCuratedTypeface,typefaces,type CuratedTypeface} from '@/lib/creative/typefaces';
import type {LocalTypeface} from '@/lib/creative/browser-fonts';
import {usePlatformLanguage} from '@/components/platform/language-provider';
export type AdminTypeface={id:string;name:string;tags?:string[];url:string;mimeType:string};
function FontPreview({font,onChoose}:{font:CuratedTypeface;onChoose:(font:string)=>void}){
 const root=useRef<HTMLButtonElement>(null),[loaded,setLoaded]=useState(false);
 useEffect(()=>{
  const element=root.current;if(!element)return;
  const observer=new IntersectionObserver(entries=>{if(entries.some(x=>x.isIntersecting)){
   void loadCuratedTypeface(font.name).then(()=>setLoaded(true)).catch(()=>{});observer.disconnect();
  }},{rootMargin:'220px'});
  observer.observe(element);return()=>observer.disconnect();
 },[font.name]);
 return <button ref={root} className="cr-font-card" onClick={()=>onChoose(font.name)} title={`${font.name}: fonte aberta do catálogo Google Fonts`}>
  <span className="cr-font-name">{font.name}</span>
  <span className="cr-font-sample" style={{fontFamily:loaded?`'${font.name}',sans-serif`:undefined}}>{font.sample}</span>
  <small><CheckCircle2 size={13}/> Seleção recomendada para PT-BR</small>
 </button>;
}
function status(tags?:string[]){
 if(tags?.includes('pt-br-completo'))return{label:'Acentos verificados',symbol:'✓',group:0};
 if(tags?.includes('sem-acentos'))return{label:'Sem acentos',symbol:'!',group:2};
 if(tags?.includes('pt-br-parcial'))return{label:'Acentos parciais',symbol:'!',group:1};
 return{label:'Acentos não verificados',symbol:'?',group:3};
}
function AdminFontPreview({font,onChoose}:{font:AdminTypeface;onChoose:(name:string,asset:AdminTypeface)=>void}){
 const root=useRef<HTMLButtonElement>(null),[loaded,setLoaded]=useState(false);
 useEffect(()=>{const button=root.current;if(!button)return;
  let active=true;const observer=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))return;
   observer.disconnect();void (async()=>{try{const face=new FontFace(font.name,`url("${font.url}")`);await face.load();if(active){document.fonts.add(face);setLoaded(true);}}catch{/* indisponível: permanece com fallback */}})();
  },{rootMargin:'120px'});observer.observe(button);return()=>{active=false;observer.disconnect()};
 },[font.id,font.name,font.url]);
 const s=status(font.tags);
 return <button ref={root} className="cr-font-card" onClick={()=>onChoose(font.name,font)}>
  <span className="cr-font-name">{font.name}</span><span className="cr-font-sample" style={loaded?{fontFamily:`'${font.name.replace(/[\"']/g,'')}',sans-serif`}:undefined}>Caneca, coração, você, mamãe, bênção</span>
  <small className={s.group===0?'cr-status-good':s.group===3?'cr-status-unknown':'cr-status-limited'}>{s.group===0?<CheckCircle2 size={13}/>:<AlertCircle size={13}/>} {s.label}</small>
 </button>;
}
export function FontLibrary({assets,onChoose,localFonts,onImport}:{assets:AdminTypeface[];onChoose:(name:string,asset?:AdminTypeface)=>void;localFonts:LocalTypeface[];onImport:(files:FileList|null)=>void}){
 const {t}=usePlatformLanguage();
 const [query,setQuery]=useState('');
 const filtered=useMemo(()=>typefaces.filter(f=>(`${f.name} ${f.category}`).toLowerCase().includes(query.toLowerCase())),[query]);
 const admins=useMemo(()=>assets.filter(f=>f.name.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>status(a.tags).group-status(b.tags).group),[assets,query]);
 return <div className="cr-font-library">
  <div className="cr-search"><Search size={16}/><input aria-label="Buscar fontes" placeholder="Buscar por fonte ou estilo..." value={query} onChange={e=>setQuery(e.target.value)}/></div>
  <div className="cr-font-explainer"><CheckCircle2 size={16}/><span>Tipografia para canecas, com prévia em português. As Google Fonts carregam quando necessárias; acentos das fontes do Admin são auditados por arquivo quando possível.</span></div>
  <section className="cr-private-fonts"><p className="cr-section-label">{t('SUAS FONTES · USO NESTE NAVEGADOR')}</p>
   <p className="cr-helper">{t('Importe TTF, OTF, WOFF ou WOFF2, individualmente ou em ZIP. O arquivo não será enviado ao servidor. Reimporte após atualizar a página; mantenha seus originais. RAR deve ser extraído antes do uso.')}</p>
   <label className="cr-local-font-upload">+ Carregar fontes particulares<input type="file" multiple accept=".ttf,.otf,.woff,.woff2,.zip" onChange={e=>{onImport(e.target.files);e.target.value='';}} /></label>
   {localFonts.length>0&&<div className="cr-private-font-list">{[...localFonts].sort((a,b)=>status([a.status]).group-status([b.status]).group).map(f=><button className="cr-font-card" key={f.name} onClick={()=>onChoose(f.name)}><strong>{f.name.replace(/^Local · /,'')}</strong><span className="cr-font-sample" style={{fontFamily:`'${f.name.replace(/'/g,'')}',sans-serif`}}>Caneca, coração, você, mamãe, bênção</span><small>{status([f.status]).label}{f.missing?` · faltam: ${f.missing}`:''}</small></button>)}</div>}
  </section>
  <p className="cr-section-label">{t('GOOGLE FONTS · CURADORIA LIVRE')}</p>
  {(['Sans premium','Serif elegante','Display','Manuscrita'] as const).map(group=><div key={group}>
   {filtered.some(f=>f.category===group)&&<h3 className="cr-font-group">{group}</h3>}
   {filtered.filter(f=>f.category===group).map(font=><FontPreview key={font.name} font={font} onChoose={name=>onChoose(name)}/>)}
  </div>)}
  <p className="cr-section-label">FONTES DO ADMIN · {admins.length} DISPONÍVEIS</p>
  {admins.length===0?<p className="cr-helper">Publique suas fontes com licença autorizada no Admin. O catálogo identifica quais arquivos têm acentos, quais são parciais e quais não puderam ser verificados.</p>:admins.map(a=><AdminFontPreview key={a.id} font={a} onChoose={onChoose}/>)}
 </div>;
}
