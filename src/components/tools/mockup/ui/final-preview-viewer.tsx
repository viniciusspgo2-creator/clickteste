"use client";

import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Download, Maximize, Minus, Plus, RotateCcw, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { downloadBlob, type ExportResult } from "../exporters/image-exporter";
import { constrainPreview, fitPreview, MAX_PREVIEW_SCALE, MIN_PREVIEW_SCALE, zoomPreview, type PreviewSize, type PreviewView } from "../lib/preview-view";
import styles from "./final-preview-viewer.module.css";

/** Opens the existing result; intentionally has no access to the Studio store. */
export function FinalPreviewViewer({ result }: { result: ExportResult }) {
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button ref={trigger} type="button" className={styles.openButton}><Maximize />Ampliar prévia</button>
      </DialogTrigger>
      <DialogContent
        className={styles.content}
        style={{ width: "min(96vw, 1600px)", maxWidth: "calc(100vw - 16px)", height: "94dvh" }}
        showCloseButton={false}
        onKeyDown={(event) => event.stopPropagation()}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          trigger.current?.focus({ preventScroll: true });
        }}
      >
        <PreviewImage result={result} />
      </DialogContent>
    </Dialog>
  );
}

function PreviewImage({ result }: { result: ExportResult }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [view, setView] = useState<PreviewView>({ scale: 1, x: 0, y: 0 });
  const surface = useRef<HTMLDivElement>(null);
  const current = useRef(view);
  const mode = useRef<"fit" | "manual">("fit");
  const area = useRef<PreviewSize>({ width: 1, height: 1 });
  const image = useRef<PreviewSize>({ width: result.width, height: result.height });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ points: { x: number; y: number }[]; view: PreviewView } | null>(null);
  const hintId = useId();
  const zoomId = useId();
  const format = result.blob.type.replace("image/", "").toUpperCase() || "Imagem";

  // Own this URL for the entire mounted viewer, independently of the small preview.
  useEffect(() => {
    const next = URL.createObjectURL(result.blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [result.blob]);

  const apply = (next: PreviewView) => {
    const safe = constrainPreview(next, image.current, area.current);
    current.current = safe;
    setView(safe);
  };
  const fit = () => {
    mode.current = "fit";
    apply(fitPreview(image.current, area.current));
  };
  const zoom = (scale: number, anchor = { x: 0, y: 0 }) => {
    mode.current = "manual";
    apply(zoomPreview(current.current, scale, anchor, image.current, area.current));
  };

  useEffect(() => {
    const node = surface.current;
    if (!node) return;
    const resize = () => {
      area.current = { width: node.clientWidth, height: node.clientHeight };
      const next = mode.current === "fit"
        ? fitPreview(image.current, area.current)
        : constrainPreview(current.current, image.current, area.current);
      current.current = next;
      setView(next);
      // A resize/orientation change cancels a gesture with obsolete coordinates.
      pointers.current.clear();
      gesture.current = null;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = node.getBoundingClientRect();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? node.clientHeight : 1);
      const next = zoomPreview(current.current, current.current.scale * Math.exp(-Math.max(-200, Math.min(200, delta)) * 0.002),
        { x: event.clientX - rect.left - rect.width / 2, y: event.clientY - rect.top - rect.height / 2 }, image.current, area.current);
      mode.current = "manual";
      current.current = next;
      setView(next);
    };
    node.addEventListener("wheel", wheel, { passive: false });
    return () => {
      observer.disconnect();
      node.removeEventListener("wheel", wheel);
    };
  }, []);

  const beginGesture = () => {
    gesture.current = { points: [...pointers.current.values()], view: { ...current.current } };
  };
  const pointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!loaded || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    beginGesture();
  };
  const pointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    if (!start || !pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.current.values()];
    mode.current = "manual";
    if (points.length >= 2 && start.points.length >= 2) {
      const [a, b] = points, [sa, sb] = start.points;
      const initialDistance = Math.hypot(sb.x - sa.x, sb.y - sa.y);
      if (initialDistance < 1) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const anchor = { x: (sa.x + sb.x) / 2 - rect.left - rect.width / 2, y: (sa.y + sb.y) / 2 - rect.top - rect.height / 2 };
      const next = zoomPreview(start.view, start.view.scale * Math.hypot(b.x - a.x, b.y - a.y) / initialDistance, anchor, image.current, area.current);
      apply({ ...next, x: next.x + (a.x + b.x - sa.x - sb.x) / 2, y: next.y + (a.y + b.y - sa.y - sb.y) / 2 });
    } else if (points.length === 1 && start.points.length === 1) {
      apply({ ...start.view, x: start.view.x + points[0].x - start.points[0].x,
        y: start.view.y + points[0].y - start.points[0].y });
    }
  };
  const pointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    beginGesture();
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.heading}>
          <DialogTitle>Prévia final ampliada</DialogTitle>
          <DialogDescription>{result.width} × {result.height} px · {format} · {(result.blob.size / 1024 / 1024).toFixed(2)} MB. Mesmo arquivo do download, sem nova captura.</DialogDescription>
        </div>
        <DialogClose asChild><button type="button" className={styles.button} aria-label="Fechar prévia ampliada"><X /></button></DialogClose>
      </header>
      <div className={styles.toolbar} role="group" aria-label="Visualização da imagem exportada">
        <button type="button" className={styles.button} onClick={fit}>Ajustar à tela</button>
        <button type="button" className={styles.button} onClick={() => zoom(1)}>100%</button>
        <button type="button" className={styles.button} onClick={fit} title="Voltar à imagem centralizada e ajustada à tela"><RotateCcw />Resetar visualização</button>
        <div className={styles.zoom}>
          <button type="button" className={styles.button} aria-label="Diminuir zoom da imagem" disabled={view.scale <= MIN_PREVIEW_SCALE} onClick={() => zoom(current.current.scale / 1.25)}><Minus /></button>
          <input id={zoomId} aria-label="Zoom da imagem" type="range" min="1" max="800" step="1" value={view.scale * 100} aria-valuetext={`${Math.round(view.scale * 100)}%`} onChange={(event) => zoom(event.currentTarget.valueAsNumber / 100)} />
          <output htmlFor={zoomId} aria-live="polite">{Math.round(view.scale * 100)}%</output>
          <button type="button" className={styles.button} aria-label="Aumentar zoom da imagem" disabled={view.scale >= MAX_PREVIEW_SCALE} onClick={() => zoom(current.current.scale * 1.25)}><Plus /></button>
        </div>
      </div>
      <div
        ref={surface} className={styles.surface} tabIndex={0} role="region" aria-label="Imagem exportada: zoom e arraste" aria-describedby={hintId}
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd}
        onKeyDown={(event) => {
          const key = event.key;
          if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "0", "1", "Home"].includes(key)) event.preventDefault();
          if (key.startsWith("Arrow")) {
            mode.current = "manual";
            const step = event.shiftKey ? 100 : 30;
            apply({ ...current.current, x: current.current.x + (key === "ArrowLeft" ? step : key === "ArrowRight" ? -step : 0),
              y: current.current.y + (key === "ArrowUp" ? step : key === "ArrowDown" ? -step : 0) });
          } else if (key === "+" || key === "=") zoom(current.current.scale * 1.25);
          else if (key === "-") zoom(current.current.scale / 1.25);
          else if (key === "0" || key === "Home") fit();
          else if (key === "1") zoom(1);
        }}
      >
        {url && <img src={url} alt="Arquivo final exportado" draggable={false} className={styles.image}
          style={{ width: result.width, height: result.height, transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
          onLoad={() => { setLoaded(true); setError(false); }} onError={() => { setError(true); setLoaded(false); }} />}
        {(!loaded || error) && <p className={styles.status} role="status">{error ? "Não foi possível exibir a imagem. Você ainda pode baixar o arquivo original." : "Carregando a imagem exportada…"}</p>}
      </div>
      <footer className={styles.footer}>
        <p id={hintId} className={styles.hint}>Arraste ou use as setas para mover. Role, use +/− ou pince para ampliar. 0 ajusta; 1 mostra 100%. O zoom é só da imagem, não do editor 3D.</p>
        <button type="button" className={`${styles.button} ${styles.primary}`} onClick={() => downloadBlob(result.blob, result.filename)}><Download />Baixar esta imagem</button>
      </footer>
    </>
  );
}
