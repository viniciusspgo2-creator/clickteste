"use client";

import { useState } from "react";
import * as THREE from "three";
import { Box, CircleArrowUp, Coffee, Focus, Hand, ImagePlus, Move, Pause, Play, RotateCcw, ScanFace } from "lucide-react";
import { useMockupStore, type ArtState } from "../state/store";
import { studioRefs } from "../scene/studio-refs";
import { MUG, lensToFov } from "../lib/config";
import { fitBoundsToView, framingBounds } from "../scene/framing";
import { Section, SliderRow } from "./controls";
import { CERAMIC_PARTS, ceramicColorPatch, type CeramicPart } from "../lib/ceramic-colors";
import { FreeColorPicker } from "./free-color-picker";

const VIEWS = [
  { id: "front", label: "Frente", icon: ScanFace, dir: [0, 0.06, 1] },
  { id: "handle", label: "Lateral / Alça", icon: Coffee, dir: [1, 0.1, -0.35] },
  { id: "back", label: "Costas", icon: RotateCcw, dir: [0, 0.06, -1] },
  { id: "perspective", label: "Perspectiva 3D", icon: Box, dir: [1, 0.42, 0.5] },
  { id: "top", label: "Topo / Interior", icon: CircleArrowUp, dir: [0.01, 1, 0.06] },
] as const;

export function QuickCameraBar() {
  const rotating = useMockupStore(s => s.camera.autoRotate && !s.camera.spinIds?.length);
  const panning = useMockupStore(s => s.tool === "pan");
  const moving = useMockupStore(s => s.tool === "move");
  const count = useMockupStore(s => s.companions.filter(c => !c.hidden).length + (s.mug.hidden ? 0 : 1));
  function showView(id: typeof VIEWS[number]["id"]) {
    const st = useMockupStore.getState();
    const selectedId = st.selectedIds[0] ?? "hero";
    const mug = selectedId === "hero" ? st.mug : st.companions.find(c => c.id === selectedId);
    if (!mug) return;
    const view = VIEWS.find(v => v.id === id)!;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(
      THREE.MathUtils.degToRad(mug.tiltX ?? 0),
      THREE.MathUtils.degToRad(-mug.rotationY),
      THREE.MathUtils.degToRad(mug.tiltZ ?? 0),
    ));
    let object: THREE.Object3D | undefined;
    studioRefs.scene?.traverse(o => {
      if (o.name === "mug-float" && o.userData.objectId === selectedId) object = o;
    });
    if (st.camera.autoRotate && object) q.copy(object.quaternion);
    // Focus is relative to the selected piece, even after moving/rotating it.
    const target = object?.getWorldPosition(new THREE.Vector3()) ??
      new THREE.Vector3(mug.posX ?? 0, MUG.height / 2 * mug.scale + (mug.posY ?? 0), mug.posZ ?? 0);
    const size = studioRefs.gl?.getSize(new THREE.Vector2()) ?? new THREE.Vector2(600, 600);
    const halfFov = THREE.MathUtils.degToRad(lensToFov(st.camera.lens)) / 2;
    const hHalf = Math.atan(Math.tan(halfFov) * size.x / Math.max(1, size.y));
    const distance = 7.8 * mug.scale / Math.sin(Math.min(halfFov, hHalf));
    const direction = new THREE.Vector3(...view.dir).applyQuaternion(q).normalize();
    let pos = target.clone().addScaledVector(direction, distance);
    if (studioRefs.scene) {
      // Include the actual handle, spoon and body rather than assuming a
      // fixed radius around the body centre for a single piece.
      const bounds = framingBounds(studioRefs.scene, count > 1);
      if (!bounds.isEmpty()) {
        const viewFit = fitBoundsToView(bounds,
          count > 1 ? new THREE.Vector3(...view.dir) : direction,
          lensToFov(st.camera.lens), size.x / Math.max(1, size.y));
        target.copy(viewFit.target); pos = viewFit.pos;
      }
    }
    st.patch("camera", { autoRotate: false });
    st.setZoom(100);
    st.applyCameraPreset({ pos: pos.toArray(), target: target.toArray() });
  }
  return (
    <div className="cg-quick-camera" role="group" aria-label="Atalhos da câmera 3D">
      <div className="cg-scene-actions">
      <button type="button" className="cg-spin-button" aria-pressed={rotating}
        onClick={() => {
          const st = useMockupStore.getState();
          st.patch("camera", { autoRotate: !rotating, spinIds: null });
          if (!rotating && count > 1) st.frameAll();
        }}>
        {rotating ? <Pause /> : <Play />}
        {rotating ? "Pausar giro" : count > 1 ? "Girar todas 360°" : "Girar 360°"}
      </button>
      {count > 1 && <button type="button" className="cg-pan-button" aria-pressed={moving}
        title="Selecione uma caneca e arraste o corpo da peça. G ativa Mover; Alt suspende o encaixe."
        onClick={() => { const st = useMockupStore.getState(); st.patch("camera", { autoRotate: false }); st.setTool(moving ? "select" : "move"); }}>
        <Move /><span>Mover caneca</span>
      </button>}
      <button type="button" className="cg-pan-button" aria-pressed={panning}
        title="Arraste a cena para os lados ou para cima e para baixo. Centralizar recupera o enquadramento."
        onClick={() => useMockupStore.getState().setTool(panning ? "select" : "pan")}>
        <Hand /><span>{panning ? "Movendo cenário" : "Mover cenário"}</span>
      </button>
      </div>
      <div className="cg-view-buttons">
        {VIEWS.map(view => <button key={view.id} type="button" onClick={() => showView(view.id)} title={view.label}>
          <view.icon /><span>{view.label}</span>
        </button>)}
        <button type="button" onClick={() => {
          const st = useMockupStore.getState();
          st.setZoom(100); st.frameAll();
        }} title="Centralizar todas as peças no enquadramento">
          <Focus /><span>Centralizar</span>
        </button>
      </div>
    </div>
  );
}

export function QuickArtControls({ active, art, locked }: { active: string; art: ArtState; locked: boolean }) {
  const patch = (value: Partial<ArtState>) => { const st = useMockupStore.getState(); st.setCompare(false); st.patchObjectArt(active, value); };
  const align = (mode: "center" | "front" | "back" | "wrap") => {
    if (mode === "center") { patch({ offsetX: 0, offsetY: 0 }); return; }
    if (mode === "wrap") {
      patch({ areaMode: "forno", scale: 1, offsetX: 0, offsetY: 0, rotation: 0, repeat: 1, fit: "cover" });
    } else {
      patch({ areaMode: "forno", scale: 0.4, offsetX: mode === "front" ? 0 : 0.5,
        offsetY: 0, rotation: 0, repeat: 1, fit: "contain" });
    }
  };
  return (
    <Section title="Sua arte na caneca" icon={ImagePlus} defaultOpen>
      <p className="cg-quick-hint">Escolha onde a estampa aparece e ajuste seu tamanho.</p>
      <div className="cg-art-align">
        <button type="button" disabled={locked} onClick={() => align("center")}><Focus />Centrar arte</button>
        <button type="button" disabled={locked} onClick={() => align("front")}>Frente</button>
        <button type="button" disabled={locked} onClick={() => align("back")}>Costas</button>
        <button type="button" disabled={locked} onClick={() => align("wrap")}>360° completo</button>
      </div>
      <div className="cg-fit-options" role="group" aria-label="Encaixe da imagem">
        <button type="button" aria-pressed={art.fit === "contain"} disabled={locked} onClick={() => patch({ fit: "contain" })}>Mostrar inteira</button>
        <button type="button" aria-pressed={art.fit === "cover"} disabled={locked} onClick={() => patch({ fit: "cover" })}>Preencher área</button>
      </div>
      <p className="cg-fit-note">{art.fit === "cover" ? "Preencher pode cortar as bordas. Confira a estampa na prévia." : "Mostrar inteira mantém a proporção sem cortar a imagem."}</p>
      <SliderRow label="Tamanho da arte" value={Math.round(art.scale * 100)}
        min={10} max={Math.max(300, Math.round(art.scale * 100))} step={1} defaultValue={100} disabled={locked}
        format={v => `${v}% da área de impressão`}
        onChange={v => patch({ scale: v / 100 })} />
      {art.scale > 1 && <p className="cg-quick-hint">Ampliação: {Math.round(art.scale * 100)}%. Confira as bordas e a resolução da arte no assistente.</p>}
    </Section>
  );
}

const COLORS = [
  ["Branca", "#ffffff"], ["Preta", "#17171b"], ["Vermelha", "#d72638"],
  ["Azul", "#225bc4"], ["Verde", "#167e58"], ["Rosa", "#ee8cb1"], ["Amarela", "#f4c52f"],
] as const;
export function CeramicPalette({ active }: { active: string }) {
  const [part, setPart] = useState<CeramicPart>("all");
  const st = useMockupStore();
  const mug = active === "hero" ? st.mug : st.companions.find(c => c.id === active);
  if (!mug) return null;
  const resolved = { ...st.mug, ...mug };
  const fallback = resolved.variant === "white" ? "#ffffff" : resolved.accentColor;
  const color = part === "handle" ? resolved.handleColor ?? fallback : part === "interior" ? resolved.interiorColor ?? fallback : resolved.bodyColor ?? "#ffffff";
  const currentPart = CERAMIC_PARTS.find(item => item.id === part)!;
  const chooseColor = (hex: string) => st.patchObject(active, ceramicColorPatch(part, hex));
  return (
    <Section title="Cores da caneca" icon={Coffee} defaultOpen>
      <div className="cg-palette-tabs" role="group" aria-label="Parte da caneca para colorir">
        {CERAMIC_PARTS.map(item => <button type="button" key={item.id} aria-pressed={part === item.id} onClick={() => setPart(item.id)}>{item.label}</button>)}
      </div>
      <div className="cg-color-swatches" role="group" aria-label={currentPart.colorLabel}>
        {COLORS.map(([label, hex]) => <button key={hex} type="button" title={label}
          aria-label={`${currentPart.name} ${label.toLowerCase()}`}
          aria-pressed={color?.toLowerCase() === hex} disabled={!!mug.locked}
          style={{ "--swatch": hex } as React.CSSProperties}
          onClick={() => chooseColor(hex)} />)}
      </div>
      <FreeColorPicker key={`${active}:${part}`} label={currentPart.colorLabel} value={color ?? "#ffffff"} onChange={chooseColor} disabled={!!mug.locked} />
      <p className="cg-quick-hint">Ajuste corpo, alça ou interior separadamente. A cor da cerâmica não recolore a arte enviada.</p>
    </Section>
  );
}
