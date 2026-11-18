"use client";

import { Coffee, ImagePlus, LockKeyhole, Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import { useMockupStore } from "../state/store";
import { SliderRow } from "./controls";
import { studioRefs } from "../scene/studio-refs";

export function PieceEditor({ onUpload }: { onUpload: () => void }) {
  const st = useMockupStore();
  const pieces = [{ ...st.mug, id: "hero", art: st.art }, ...st.companions];
  const id = st.selectedIds[0] ?? "hero";
  const piece = pieces.find(p => p.id === id);
  const playing = st.camera.autoRotate && st.camera.spinIds?.length === 1 && st.camera.spinIds[0] === id;
  const degrees = (value: number) => ((value % 360) + 360) % 360;
  function turn(value: number) {
    st.patch("camera", { autoRotate: false });
    st.patchObject(id, { rotationY: degrees(value) });
  }
  function increment(delta: number) {
    let visible = piece?.rotationY ?? 0;
    studioRefs.scene?.traverse(o => {
      if (o.name === "mug-float" && o.userData.objectId === id) visible = -o.rotation.y * 180 / Math.PI;
    });
    turn(visible + delta);
  }
  return <section className="cg-piece-editor" aria-label="Escolher e editar caneca">
    <div className="cg-piece-heading"><Coffee /><strong>Qual caneca você quer editar?</strong></div>
    <div className="cg-piece-list" role="group" aria-label="Canecas da cena">
      {pieces.map((p, i) => <button type="button" key={p.id} aria-pressed={id === p.id}
        aria-label={`Selecionar Caneca ${String(i + 1).padStart(2, "0")}`}
        onClick={() => { st.patch("camera", { autoRotate: false }); st.select(p.id); }}>
        <span className="cg-piece-number">{String(i + 1).padStart(2, "0")}</span>
        <span><strong>{p.name || `Caneca ${i + 1}`}</strong><small>{p.hidden ? "Oculta · abra Camadas" : p.art?.imageId ? "Arte própria aplicada" : "Sem arte · selecione e envie"}</small></span>
        {p.locked && <LockKeyhole aria-label="Bloqueada" />}
      </button>)}
    </div>
    {piece && <>
      <button type="button" className="cg-piece-upload" disabled={!!piece.locked || !!piece.hidden} onClick={onUpload}>
        <ImagePlus /><span>{piece.art?.imageId ? "Trocar" : "Adicionar"} arte desta caneca</span>
      </button>
      <fieldset disabled={!!piece.locked || !!piece.hidden}>
        <SliderRow label="Girar somente esta caneca" min={0} max={360} step={1}
          value={Math.round(degrees(piece.rotationY))} format={v => `${v}°`} onChange={turn} />
        <div className="cg-piece-turns">
          <button type="button" aria-label="Girar caneca selecionada menos 45 graus" onClick={() => increment(-45)}><RotateCcw />−45°</button>
          <button type="button" aria-label="Girar caneca selecionada mais 45 graus" onClick={() => increment(45)}><RotateCw />+45°</button>
          <button type="button" aria-pressed={!!playing} onClick={() => {
            st.patch("camera", { autoRotate: !playing, spinIds: [id] });
            if (!playing) st.frameAll();
          }}>{playing ? <Pause /> : <Play />}{playing ? "Pausar peça" : "Girar esta"}</button>
        </div>
      </fieldset>
      {pieces.length > 1 && <button type="button" className="cg-piece-copy" disabled={!piece.art?.imageId}
        onClick={() => st.copyArtToAll(id)}>Copiar esta arte para todas as canecas</button>}
      <p>Cada peça tem sua própria arte e rotação. Selecionar aqui não altera as outras canecas.</p>
    </>}
  </section>;
}

export function PieceSwitcher({ onUpload }: { onUpload: () => void }) {
  const st = useMockupStore();
  if (!st.companions.length) return null;
  const pieces = [{ ...st.mug, id: "hero" }, ...st.companions];
  const active = st.selectedIds[0] ?? "hero";
  const selected = pieces.find(p => p.id === active);
  return <div className="cg-piece-switcher">
    <label><Coffee /><span>Editar</span><select aria-label="Selecionar caneca para editar" value={active}
      onChange={e => { st.patch("camera", { autoRotate: false }); st.select(e.target.value); }}>
      {pieces.map((p, i) => <option key={p.id} value={p.id}>{p.name || `Caneca ${i + 1}`}</option>)}
    </select></label>
    <button type="button" onClick={onUpload} disabled={!selected || !!selected.locked || !!selected.hidden}
      aria-label="Adicionar arte à caneca selecionada"><ImagePlus />Arte</button>
  </div>;
}
