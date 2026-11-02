"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { CircleArrowUp, RotateCcw, RotateCw, Focus, Info } from "lucide-react";
import * as THREE from "three";
import { useMockupStore } from "../state/store";
import { loadArtFile, removeArtImage } from "../lib/art-registry";
import { studioRefs } from "../scene/studio-refs";
import { baseArtTransform, normalizeBocaoAngle, bocaoPointerAngleDeg, bocaoDragRotation } from "../lib/base-art";
import { renderBaseArt } from "../lib/base-art-canvas";
import { Section, SliderRow } from "./controls";

export function BaseArtPanel() {
  const st = useMockupStore(), id = st.selectedIds[0] ?? "hero";
  const mug = id === "hero" ? st.mug : st.companions.find(c => c.id === id);
  const art = id === "hero" ? st.art : st.companions.find(c => c.id === id)?.art ?? st.art;
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false), [viewing, setViewing] = useState(false);
  const sequence = useRef(0);
  const preview = useRef<HTMLCanvasElement>(null);
  const gesture = useRef<{ pointer: number; angle: number; rotation: number } | null>(null);
  const previous = useRef<{ pos: [number,number,number]; target: [number,number,number]; zoom: number; rotating: boolean } | null>(null);
  // Guard against a file finishing loading after this panel closes.
  useEffect(() => () => { sequence.current += 1; }, []);
  const patch = (p: Partial<typeof art>) => st.patchObjectArt(id, p);
  const t = baseArtTransform(art);
  const angle = normalizeBocaoAngle(art.baseRotation);
  const disabled = !mug || mug.locked || busy;

  useEffect(() => {
    const canvas = preview.current;
    if (!canvas || !mug || !art.baseImageId) return;
    const rendered = renderBaseArt(art, mug, 320);
    if (!rendered) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(rendered, 0, 0, canvas.width, canvas.height);
  }, [art.baseImageId, art.baseScale, art.baseOffsetX, art.baseOffsetY, mug?.baseColor, mug?.bodyColor, mug]);

  function restoreInspection() {
    const original = previous.current;
    if (!original) return;
    previous.current = null;
    const s = useMockupStore.getState();
    s.setZoom(original.zoom);
    s.applyCameraPreset({ pos: original.pos, target: original.target });
    s.patch("camera", { autoRotate: original.rotating });
  }
  // Inspection changes only the camera, never the mug pose, its art or undo history.
  useEffect(() => () => { restoreInspection(); }, [id]);
  useEffect(() => { setViewing(false); setMessage(""); }, [id]);
  useEffect(() => {
    if (st.exportOpen && previous.current) {
      restoreInspection();
      setViewing(false);
    }
  }, [st.exportOpen]);
  useEffect(() => {
    if (!art.baseImageId && previous.current) {
      restoreInspection();
      setViewing(false);
    }
  }, [art.baseImageId]);

  async function upload(file: File) {
    const request = ++sequence.current, target = id;
    setBusy(true);
    try {
      const entry = await loadArtFile(file), current = useMockupStore.getState();
      const piece = target === "hero" ? current.mug : current.companions.find(c => c.id === target);
      if (request !== sequence.current || !piece || piece.locked) { removeArtImage(entry.id); return; }
      current.patchObjectArt(target, { baseImageId: entry.id });
      setMessage("Bocão aplicado à peça. Ajuste o giro e confira no 3D.");
    } catch(e) { setMessage(e instanceof Error ? e.message : "Não foi possível abrir a imagem."); }
    finally { if (request === sequence.current) setBusy(false); }
  }

  function inspect() {
    const s = useMockupStore.getState(), camera = studioRefs.camera, controls = studioRefs.controls;
    if (!camera || !controls || !mug || mug.locked) return;
    if (previous.current) {
      restoreInspection();
      setViewing(false);
      return;
    }
    const baseMeshes: THREE.Object3D[] = [];
    studioRefs.scene?.traverse(o => {
      if (o.name === "mug-base-print" && o.userData.objectId === id) baseMeshes.push(o);
    });
    const print = baseMeshes[0];
    if (!print) {
      setMessage("A base ainda não está pronta no palco 3D. Confira se a peça está visível.");
      return;
    }
    print.updateWorldMatrix(true, false);
    const normal = new THREE.Vector3(0, -1, 0).applyQuaternion(print.getWorldQuaternion(new THREE.Quaternion())).normalize();
    if (normal.y < -0.35) {
      setMessage("Para enxergar o fundo sem modificar sua composição, primeiro deite ou incline a caneca e tente novamente.");
      return;
    }
    const target = print.getWorldPosition(new THREE.Vector3());
    const direction = normal.clone();
    // Camera.up is Y: avoid exact vertical look-at to keep the frame stable.
    if (Math.abs(direction.y) > 0.96) direction.add(new THREE.Vector3(0.06, 0, 0.05)).normalize();
    const distance = 7.5 * mug.scale / Math.sin(THREE.MathUtils.degToRad(camera.fov) / 2);
    const position = target.clone().addScaledVector(direction, distance);
    previous.current = {
      pos: camera.position.toArray() as [number,number,number],
      target: controls.target.toArray() as [number,number,number],
      zoom: s.zoom, rotating: s.camera.autoRotate,
    };
    s.patch("camera", { autoRotate: false });
    s.setZoom(100);
    s.applyCameraPreset({pos: position.toArray(), target: target.toArray()});
    setMessage("Inspeção da base: só a câmera mudou. A pose da caneca foi preservada.");
    setViewing(true);
  }

  const pointerAngle = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return bocaoPointerAngleDeg(e.clientX, e.clientY, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };
  function startTurning(e: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || !art.baseImageId || e.button !== 0 || !e.isPrimary) return;
    e.preventDefault();
    gesture.current = { pointer: e.pointerId, angle: pointerAngle(e), rotation: angle };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function keepTurning(e: ReactPointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    if (!start || start.pointer !== e.pointerId || disabled) return;
    const next = bocaoDragRotation(start.rotation, start.angle, pointerAngle(e));
    useMockupStore.getState().patchObjectArt(id, {baseRotation: next});
  }
  function stopTurning(e: ReactPointerEvent<HTMLDivElement>) {
    if (gesture.current?.pointer !== e.pointerId) return;
    gesture.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }

  return <Section title="Arte da base — Bocão" icon={CircleArrowUp} defaultOpen>
    <p className="cg-hint">Envie a arte da parte de baixo da caneca. O giro, o tamanho e a posição são independentes da estampa lateral.</p>
    <fieldset disabled={disabled} className="space-y-3">
      <label className="cg-file-label">{busy ? "Abrindo imagem…" : art.baseImageId ? "Trocar imagem do Bocão" : "Enviar imagem do Bocão"}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif" onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f);e.target.value="";}} /></label>
      {art.baseImageId && <div className="cg-bocao-guide"><Info /><span>Se a boca parecer torta ou cortada, ajuste primeiro o <strong>giro</strong>, depois o <strong>tamanho</strong>. Use o palco 3D para conferir a direção em relação ao desenho lateral.</span></div>}
      <button type="button" className="cg-secondary" onClick={inspect} disabled={!art.baseImageId}>{viewing ? "Voltar ao enquadramento anterior" : "Enquadrar a base no 3D sem mover a caneca"}</button>
      {art.baseImageId && <>
        <div className="cg-bocao-preview-wrap">
          <p className="cg-bocao-caption"><strong>Gire diretamente aqui</strong><span>{Math.round(angle) % 360}° / 360°</span></p>
          <span className="cg-bocao-front-label" aria-hidden="true">Frente da caneca</span>
          <div className="cg-bocao-wheel" role="slider" tabIndex={disabled ? -1 : 0} aria-label="Girar Bocão livremente" aria-valuemin={0} aria-valuemax={359} aria-valuenow={Math.floor(angle)} aria-valuetext={`${Math.round(angle) % 360} graus`} aria-disabled={disabled} onPointerDown={startTurning} onPointerMove={keepTurning} onPointerUp={stopTurning} onPointerCancel={stopTurning} onLostPointerCapture={e=>{if(gesture.current?.pointer === e.pointerId) gesture.current = null;}} onKeyDown={e=>{if(disabled)return; if(e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault();patch({baseRotation:normalizeBocaoAngle(angle-1)}); } else if(e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault();patch({baseRotation:normalizeBocaoAngle(angle+1)}); } else if(e.key === "Home") { e.preventDefault();patch({baseRotation:0}); }}}>
            <div className="cg-bocao-wheel-art" style={{transform:`rotate(${angle}deg)`}}><canvas ref={preview} width={320} height={320} aria-hidden="true" /></div>
            <span className="cg-bocao-wheel-indicator" aria-hidden="true" />
          </div>
          <small>A marca superior representa a frente da peça quando ela está na pose padrão. Arraste o círculo e confirme a orientação na caneca 3D, especialmente se estiver inclinada.</small>
        </div>
        <SliderRow label="Giro completo do Bocão" value={angle} min={0} max={359} step={1} defaultValue={0} format={v=>`${Math.round(v)}°`} onChange={baseRotation=>patch({baseRotation:normalizeBocaoAngle(baseRotation)})}/>
        <div className="cg-bocao-turn-buttons">
          <button type="button" onClick={()=>patch({baseRotation:normalizeBocaoAngle(angle-90)})}><RotateCcw /> −90°</button>
          <button type="button" onClick={()=>patch({baseRotation:normalizeBocaoAngle(angle-1)})}>−1°</button>
          <button type="button" onClick={()=>patch({baseRotation:normalizeBocaoAngle(angle+1)})}>+1°</button>
          <button type="button" onClick={()=>patch({baseRotation:normalizeBocaoAngle(angle+90)})}><RotateCw /> +90°</button>
        </div>
        <SliderRow label="Tamanho da boca" value={t.scale} min={0.1} max={3} step={0.01} defaultValue={1} format={v=>`${Math.round(v*100)}%`} onChange={baseScale=>patch({baseScale})}/>
        <details className="cg-bocao-fine-controls"><summary>A boca não está centralizada? Ajustar posição</summary>
          <SliderRow label="Mover para os lados" value={t.x} min={-1} max={1} step={0.01} defaultValue={0} onChange={baseOffsetX=>patch({baseOffsetX})}/>
          <SliderRow label="Mover para cima / baixo" value={t.y} min={-1} max={1} step={0.01} defaultValue={0} onChange={baseOffsetY=>patch({baseOffsetY})}/>
        </details>
        <div className="cg-pills"><button type="button" onClick={()=>patch({baseOffsetX:0,baseOffsetY:0})}><Focus /> Centralizar</button><button type="button" onClick={()=>patch({baseScale:1,baseOffsetX:0,baseOffsetY:0,baseRotation:0})}>Restaurar ajustes</button><button type="button" onClick={()=>patch({baseImageId:null})}>Remover imagem</button></div>
      </>}
    </fieldset><p role="status" className="cg-hint">{message}</p>
  </Section>;
}
