"use client";

import { useEffect, useState } from "react";
import { Scan, Hand, RotateCcw } from "lucide-react";
import * as THREE from "three";
import { useMockupStore } from "../state/store";
import { studioRefs, visibleMugBounds } from "../scene/studio-refs";
import { Section, Segmented, SliderRow, ToggleRow } from "./controls";

export function SceneFraming({ compact = false }: { compact?: boolean }) {
  const zoom = useMockupStore(s => s.zoom);
  const showGuides = useMockupStore(s => s.showGuides);
  const framing = useMockupStore(s => s.exportSettings.framing ?? "safe");
  const [status, setStatus] = useState("");
  const setMode = (value: "safe" | "current") => useMockupStore.getState().setExport({ framing: value, presentationZoom: useMockupStore.getState().zoom });
  const approach = (value: number) => { useMockupStore.getState().setZoom(value); setMode("current"); };
  useEffect(() => {
    if (compact) return;
    const timer = setInterval(() => {
      const { scene, camera } = studioRefs;
      if (!scene || !camera || studioRefs.exporting) return;
      const bounds = visibleMugBounds(scene);
      if (bounds.isEmpty()) { setStatus("Mostre uma caneca para conferir a composição."); return; }
      camera.updateMatrixWorld();
      const points = [bounds.min.x, bounds.max.x].flatMap(x => [bounds.min.y, bounds.max.y].flatMap(y => [bounds.min.z, bounds.max.z].map(z => new THREE.Vector3(x,y,z).project(camera))));
      const cropped = points.some(p => p.z < -1 || p.z > 1 || Math.abs(p.x) > 1 || Math.abs(p.y) > 1);
      const small = Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y)) < .65;
      setStatus(cropped ? "Há recorte nas bordas. Afaste um pouco para mostrar as peças inteiras." : small ? "As peças estão inteiras, com bastante espaço ao redor. Aproxime se quiser mais destaque." : "As peças cabem no quadro. Confira o apoio e a sombra sobre a superfície do cenário.");
    }, 700);
    return () => clearInterval(timer);
  }, [compact]);
  const content = <>
    <Segmented label="Enquadramento da exportação" value={framing} options={[{value:"safe",label:"Automático"},{value:"current",label:"Minha aproximação"}]} onChange={setMode} />
    <SliderRow label="Aproximar a apresentação" value={zoom} min={50} max={200} step={5} onChange={approach} defaultValue={100} format={v=>`${v}%`} />
    <div className="cg-framing-presets" role="group" aria-label="Proximidade da apresentação">
      {([[85,"Mais espaço"],[115,"Destaque"],[140,"Primeiro plano"]] as const).map(([value,label])=><button type="button" key={value} onClick={()=>approach(value)}>{label}</button>)}
    </div>
    <p className="cg-hint">{framing === "safe" ? "O automático mantém o conjunto inteiro na exportação. Aproximar é opcional e ativa Minha aproximação." : "Sua aproximação será mantida ao exportar. Uma proporção diferente pode recortar as bordas: confira a prévia final."}</p>
    {!compact && <>
      <div className="cg-framing-presets"><button type="button" onClick={()=>useMockupStore.getState().setTool("pan")}><Hand size={14}/>Reposicionar no quadro</button><button type="button" onClick={()=>{const s=useMockupStore.getState();s.setZoom(100);s.frameAll();setMode("safe");}}><RotateCcw size={14}/>Restaurar enquadramento</button></div>
      <ToggleRow label="Guias para compor a apresentação" checked={showGuides} onChange={v=>useMockupStore.getState().setShowGuides(v)} />
      <p className="cg-framing-status" role="status">{status}</p>
    </>}
  </>;
  return <Section title="Enquadramento e proximidade" icon={Scan} defaultOpen={!compact}>{content}</Section>;
}
