"use client";

import { Lightbulb, Sparkles } from "lucide-react";
import { useMockupStore } from "../state/store";
import { Section, SliderRow, ToggleRow } from "./controls";

const presets = [
  { label: "Suave", opacity: 0.28, softness: 0.8 },
  { label: "Natural", opacity: 0.62, softness: 0.55 },
  { label: "Marcada", opacity: 0.88, softness: 0.25 },
] as const;

export function ShadowPresets() {
  const st = useMockupStore();
  return <Section title="Sombra na mesa / cenário" icon={Lightbulb} defaultOpen>
    <p className="cg-hint" style={{ margin: 0 }}>Ajusta a sombra projetada no cenário, sem mudar a cor, a arte ou o verniz da caneca.</p>
    <button type="button" className="cg-shadow-elite" onClick={()=>{
      st.patch('bg',{contactShadow:true,castShadow:true,floatAnim:false});
      st.patch('light',{shadowOpacity:.82,softness:.33,shadowColor:'#201a18',envIntensity:1.12});
    }}><Sparkles size={17}/> Foto Elite · sombra de contato definida</button>
    <div className="cg-pose-presets" role="group" aria-label="Estilos de sombra">
      {presets.map(p=><button type="button" key={p.label}
        aria-pressed={Math.abs((st.light.shadowOpacity ?? 0.44)-p.opacity)<0.005 && Math.abs(st.light.softness-p.softness)<0.005}
        onClick={()=>{st.patch("bg",{contactShadow:true,castShadow:true});st.patch("light",{shadowOpacity:p.opacity,softness:p.softness});}}>{p.label}</button>)}
    </div>
    <SliderRow label="Intensidade da sombra no chão" value={(st.light.shadowOpacity ?? 0.44)*100} min={0} max={100} step={1}
      onChange={v=>st.patch("light",{shadowOpacity:v/100})} format={v=>`${Math.round(v)}%`} defaultValue={44}/>
    <SliderRow label="Borda suave" value={st.light.softness*100} min={0} max={100} step={1}
      onChange={v=>st.patch("light",{softness:v/100})} format={v=>`${Math.round(v)}%`}/>
    <ToggleRow label="Mostrar sombra de contato" checked={st.bg.contactShadow} onChange={contactShadow=>st.patch("bg",{contactShadow})}/>
    <ToggleRow label="Mostrar sombra projetada" checked={st.bg.castShadow} onChange={castShadow=>st.patch("bg",{castShadow})}/>
    <p className="cg-pose-tip">Em fundos fotográficos, a posição aparente da mesa depende da perspectiva da foto. Ajuste a altura e o enquadramento da caneca para aproximar a sombra da superfície.</p>
  </Section>;
}
