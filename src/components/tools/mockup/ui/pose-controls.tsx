"use client";

import { Move, Rotate3D, SlidersHorizontal } from "lucide-react";
import { useMockupStore } from "../state/store";
import { Section, SliderRow, ToggleRow } from "./controls";

/** Beginner-first composition tools; existing three-axis gizmo remains available. */
export function PoseControls() {
  const st = useMockupStore();
  const id = st.selectedIds[0] ?? "hero";
  const mug = id === "hero" ? st.mug : st.companions.find(p => p.id === id);
  if (!mug) return null;
  const disabled = !!mug.locked || !!mug.hidden;
  const angles = (x: number, z: number) => {
    if (disabled) return;
    st.patch("camera", { autoRotate: false });
    st.patchObject(id, { tiltX: x, tiltZ: z });
  };
  return <Section title="Mover, girar e inclinar" icon={Rotate3D} defaultOpen>
    <p className="cg-hint" style={{ margin: "0 0 8px" }}>Escolha uma pose ou arraste a peça diretamente na prévia 3D. Cada caneca pode ter uma posição diferente.</p>
    <div className="cg-pose-presets" role="group" aria-label="Poses prontas da caneca">
      {([ ["Em pé",0,0], ["Deitada",90,0], ["Inclinada",20,25], ["Invertida",180,0] ] as const).map(([label,x,z]) =>
        <button type="button" key={label} disabled={disabled} onClick={() => angles(x,z)}
          aria-pressed={Math.abs((mug.tiltX ?? 0)-x)<0.1 && Math.abs((mug.tiltZ ?? 0)-z)<0.1}>
          {label}
        </button>)}
    </div>
    <div className="cg-pose-tools" role="group" aria-label="Modo de edição da caneca">
      <button type="button" disabled={disabled} aria-pressed={st.tool === "move"}
        onClick={() => { st.patch("camera", { autoRotate: false }); st.setTool("move"); }}><Move/> Mão livre · mover</button>
      <button type="button" disabled={disabled} aria-pressed={st.tool === "rotate"}
        onClick={() => { st.patch("camera", { autoRotate: false }); st.setTool("rotate"); }}><Rotate3D/> Mão livre · girar</button>
    </div>
    {st.tool === "move" && <p className="cg-pose-tip">Arraste a caneca para os lados ou profundidade. Para subir/descer, use a seta vertical do controle 3D ou ajuste a altura abaixo. Alt desativa o encaixe.</p>}
    {st.tool === "rotate" && <p className="cg-pose-tip">Arraste sobre a caneca: horizontal gira, vertical inclina. Segure <strong>Alt</strong> para torcer no eixo Z ou <strong>Shift</strong> para precisão. Os arcos coloridos permitem girar um eixo isolado.</p>}
    <SliderRow label="Inclinar para frente / trás" value={mug.tiltX ?? 0} min={-180} max={180} step={1} onChange={tiltX=>{st.patch("camera", {autoRotate:false});st.patchObject(id,{tiltX});}} disabled={disabled} defaultValue={0} format={v=>`${Math.round(v)}°`}/>
    <SliderRow label="Inclinar para os lados" value={mug.tiltZ ?? 0} min={-180} max={180} step={1} onChange={tiltZ=>{st.patch("camera", {autoRotate:false});st.patchObject(id,{tiltZ});}} disabled={disabled} defaultValue={0} format={v=>`${Math.round(v)}°`}/>
    <SliderRow label="Altura em relação ao chão" value={mug.posY ?? 0} min={-15} max={35} step={0.1} onChange={posY=>st.patchObject(id,{posY})} disabled={disabled} defaultValue={0} format={v=>`${v.toFixed(1)} cm`}/>
    <ToggleRow label="Encaixe magnético (mover)" checked={st.snapEnabled} onChange={st.setSnap} />
    <details className="cg-pose-advanced">
      <summary><SlidersHorizontal/> Posição exata e volta completa</summary>
      <p className="cg-pose-tip">Para ajustes além dos sliders, digite qualquer ângulo. Os valores são guardados no projeto.</p>
      <div className="cg-numeric-grid">
        {([ ["posX","Esquerda / direita",0.1], ["posZ","Frente / fundo",0.1], ["rotationY","Giro horizontal (°)",1], ["tiltX","Inclinação frontal (°)",1], ["tiltZ","Inclinação lateral (°)",1] ] as const).map(([field,label,step])=>
          <label key={field}>{label}<input type="number" disabled={disabled} step={step}
            value={mug[field] ?? 0}
            onChange={e=>{if(Number.isFinite(e.target.valueAsNumber)){if(field==="rotationY")st.patch("camera",{autoRotate:false});st.patchObject(id,{[field]:e.target.valueAsNumber});}}}/></label>)}
      </div>
    </details>
  </Section>;
}
