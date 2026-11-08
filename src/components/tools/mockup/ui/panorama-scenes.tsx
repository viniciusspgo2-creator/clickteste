"use client";
import { useEffect, useRef, useState } from "react";
import { Globe2, Search, Loader2 } from "lucide-react";
import { PANORAMA_SCENES, loadPanoramaEnvironment } from "../lib/panorama-scenes";
import { useMockupStore } from "../state/store";
import { SliderRow } from "./controls";

export function PanoramaScenes({ notify }: {notify:(message:string)=>void}) {
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("Todos");
  const [loading,setLoading]=useState<string|null>(null);
  const request=useRef(0);
  const bg=useMockupStore(s=>s.bg);
  useEffect(()=>()=>{request.current++;},[]);
  const scenes=PANORAMA_SCENES.filter(scene=>(category==="Todos"||scene.category===category)&&`${scene.label} ${scene.category}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  return <div className="cg-panorama-library">
    <div className="cg-panorama-heading"><Globe2 size={18}/><div><strong>Ambientes reais em 360°</strong><p>O espaço acompanha a câmera e ilumina a porcelana.</p></div></div>
    <label className="cg-scene-search"><Search size={15}/><input aria-label="Buscar ambiente 360 graus" placeholder="Estúdio, Natal, natureza…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
    <select className="cg-background-filter" aria-label="Categoria de ambientes 360 graus" value={category} onChange={e=>setCategory(e.target.value)}>{["Todos",...new Set(PANORAMA_SCENES.map(s=>s.category))].map(c=><option key={c}>{c}</option>)}</select>
    <p className="cg-hint">{scenes.length} ambientes · carregados somente ao escolher.</p>
    <div className="cg-background-grid">
      {scenes.map(scene=><button type="button" className="cg-panorama-card" key={scene.id} aria-pressed={bg.panorama&&bg.panoramaScene===scene.id} aria-label={`Aplicar ambiente ${scene.label}`}
        onClick={async()=>{const version=++request.current;setLoading(scene.id);try{const id=await loadPanoramaEnvironment(scene);if(version!==request.current)return;const s=useMockupStore.getState();s.patch('light',{hdriId:id,rotation:0,preset:'suave',intensity:.85,envIntensity:.45,keyStrength:.7,fillStrength:.6,rimStrength:.4,ambientStrength:.8,temperature:0});s.patch('bg',{type:'studio-white',panorama:true,panoramaScene:scene.id,panoramaHeight:45,panoramaRotation:0,imageId:null,floor:'continuo',floatAnim:false});notify(`Ambiente ${scene.label} aplicado. Sua estampa foi preservada.`);}catch(error){if(version===request.current)notify(error instanceof Error?error.message:'Não foi possível carregar o ambiente.');}finally{if(version===request.current)setLoading(null);}}}>
        <img src={scene.preview} alt="" loading="lazy" draggable={false}/><strong>{scene.label}</strong><small>{loading===scene.id?<><Loader2 size={12} className="animate-spin"/>Carregando…</>:scene.category}</small>
      </button>)}
    </div>
    {scenes.length===0&&<p className="cg-hint">Nenhum ambiente encontrado. Tente outra busca.</p>}
    {bg.panorama&&<div className="cg-panorama-adjustments">
      <SliderRow label="Girar ambiente 360°" min={-180} max={180} step={1} value={bg.panoramaRotation??0} onChange={panoramaRotation=>{const s=useMockupStore.getState();s.patch('bg',{panoramaRotation});s.patch('light',{rotation:panoramaRotation});}} format={v=>`${Math.round(v)}°`}/>
      <SliderRow label="Perspectiva da superfície" min={10} max={120} step={1} value={bg.panoramaHeight??45} onChange={panoramaHeight=>useMockupStore.getState().patch('bg',{panoramaHeight})}/>
      <p className="cg-hint">Ajuste a superfície para combinar com a base da caneca. Para aproximação, use Enquadramento e proximidade.</p>
    </div>}
    <p className="cg-scene-credit">Ambientes de <a href="https://polyhaven.com/hdris" target="_blank" rel="noopener noreferrer">Poly Haven</a> · <a href="https://polyhaven.com/license" target="_blank" rel="noopener noreferrer">CC0</a>. Requer internet no primeiro carregamento. O ambiente escolhido acompanha seu projeto salvo.</p>
  </div>;
}
