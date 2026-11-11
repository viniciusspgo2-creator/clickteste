"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_RENDER_STATE,
  EXPORT_SIZES_16_9,
  EXPORT_SIZES_4_5,
  EXPORT_SIZES_SOCIAL,
  type ArtPixels,
  type ExportSize,
  type MockupTemplate,
  type MugCalibration,
  type RenderState,
  type SceneMaps,
} from "@/lib/studio-mockup-2d/types";
import { STUDIO_MOCKUP_2D_TEMPLATES, STUDIO_MOCKUP_2D_DEMO_ART, STUDIO_MOCKUP_2D_DEMO_ART_NAME } from "@/lib/studio-mockup-2d/catalog";
import { cacheArtPixels } from "@/lib/studio-mockup-2d/warp";
import { computeMaps } from "@/lib/studio-mockup-2d/maps";
import { renderMockup, exportMockupBlob } from "@/lib/studio-mockup-2d/render";
import { detectMugArea, loadImage, type DetectedArea } from "@/lib/studio-mockup-2d/detect";
import { autoFitArt } from "@/lib/studio-mockup-2d/autofit";
import { mugLeft, mugRight } from "@/lib/studio-mockup-2d/geometry";

const EMPTY_MAPS: SceneMaps = { lumMap: null, specMap: null, edgeColors: [], grainPattern: null, ready: false };

/** Calibrações manuais (arrastar a máscara) salvas no navegador, por cena. */
const OVERRIDE_KEY = "studio-mockup-2d-calib-v1";
type CalibOverrides = Record<string, MugCalibration[]>;

function loadOverrides(): CalibOverrides {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CalibOverrides;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function applyOverride(t: MockupTemplate, overrides: CalibOverrides): MockupTemplate {
  const mugs = overrides[t.id];
  if (!mugs || mugs.length === 0) return t;
  return { ...t, mugs, calibration: { ...t.calibration, needsManual: false } };
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-xs text-neutral-300">
        <span>{label}</span>
        <span className="font-semibold text-white">{value}%</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-orange-500"
      />
    </label>
  );
}

/**
 * Máscara arrastável da calibração manual: o retângulo da área da caneca
 * (xLeft/xRight/topC/botC) com 8 alças. Arrastar uma alça ajusta a área
 * em tempo real; a arte é re-renderizada junto.
 */
function CalibrationOverlay({
  mug,
  refW,
  refH,
  onHandleDown,
}: {
  mug: MugCalibration;
  refW: number;
  refH: number;
  onHandleDown: (handle: string) => (e: React.PointerEvent) => void;
}) {
  const left = (mugLeft(mug) / refW) * 100;
  const top = (mug.topC / refH) * 100;
  const width = ((mugRight(mug) - mugLeft(mug)) / refW) * 100;
  const height = ((mug.botC - mug.topC) / refH) * 100;
  const handles: { id: string; left: string; top: string; cursor: string }[] = [
    { id: "tl", left: "0%", top: "0%", cursor: "nwse-resize" },
    { id: "tr", left: "100%", top: "0%", cursor: "nesw-resize" },
    { id: "bl", left: "0%", top: "100%", cursor: "nesw-resize" },
    { id: "br", left: "100%", top: "100%", cursor: "nwse-resize" },
    { id: "t", left: "50%", top: "0%", cursor: "ns-resize" },
    { id: "b", left: "50%", top: "100%", cursor: "ns-resize" },
    { id: "l", left: "0%", top: "50%", cursor: "ew-resize" },
    { id: "r", left: "100%", top: "50%", cursor: "ew-resize" },
  ];
  return (
    <div
      className="pointer-events-none absolute z-10"
      style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
    >
      <div className="absolute inset-0 rounded-sm border-2 border-dashed" style={{ borderColor: mug.cor }} />
      <span
        className="absolute -top-6 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-bold text-white"
        style={{ backgroundColor: mug.cor }}
      >
        {mug.nome} · {Math.round(mugRight(mug) - mugLeft(mug))} × {Math.round(mug.botC - mug.topC)} px
      </span>
      {handles.map((h) => (
        <button
          key={h.id}
          type="button"
          aria-label={`Ajustar ${h.id}`}
          onPointerDown={onHandleDown(h.id)}
          className="pointer-events-auto absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 touch-none rounded-sm border-2 border-white bg-orange-500 shadow"
          style={{ left: h.left, top: h.top, cursor: h.cursor }}
        />
      ))}
    </div>
  );
}

export function StudioMockup2DEditor() {
  const [activeTemplateIdx, setActiveTemplateIdx] = useState(0);
  const [template, setTemplate] = useState<MockupTemplate>(STUDIO_MOCKUP_2D_TEMPLATES[0]);
  const [state, setState] = useState<RenderState>(DEFAULT_RENDER_STATE);
  const [art, setArt] = useState<HTMLImageElement | null>(null);
  const [artName, setArtName] = useState("");
  const [artPixels, setArtPixels] = useState<ArtPixels | null>(null);
  const [maps, setMaps] = useState<SceneMaps>(EMPTY_MAPS);
  const [baseLoaded, setBaseLoaded] = useState(false);
  const [status, setStatus] = useState("Carregando template…");
  const [exporting, setExporting] = useState(false);
  const [exportSize, setExportSize] = useState("1920x1080");
  const [detecting, setDetecting] = useState(false);
  const [detection, setDetection] = useState<DetectedArea | null>(null);
  // Calibração manual (arrastar a máscara): qual caneca, modo ativo e
  // overrides salvos no navegador (por cena).
  const [calibrating, setCalibrating] = useState(false);
  const [calibMugIdx, setCalibMugIdx] = useState(0);
  const [overrides, setOverrides] = useState<CalibOverrides>({});
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; mug: MugCalibration } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseImgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderScheduledRef = useRef(false);

  const set = useCallback(<K extends keyof RenderState>(key: K, value: RenderState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const renderNow = useCallback(() => {
    const canvas = canvasRef.current;
    const baseImg = baseImgRef.current;
    if (!canvas || !baseImg) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderMockup(ctx, template.refW, template.refH, template, baseImg, artPixels, maps, state);
  }, [template, artPixels, maps, state]);

  // Tamanhos de exportação válidos para o template ativo: só os que têm a
  // mesma proporção da cena (senão a imagem estica). Retrato 4:5 usa a lista
  // 4:5; 16:9 usa a lista 16:9 + os sociais que batem com 16:9.
  const exportSizesForTemplate = useCallback((t: MockupTemplate): ExportSize[] => {
    const aspect = t.refW / t.refH;
    const all = [...EXPORT_SIZES_16_9, ...EXPORT_SIZES_4_5, ...EXPORT_SIZES_SOCIAL];
    const matching = all.filter((s) => Math.abs(s.w / s.h - aspect) < 0.01);
    const seen = new Set<string>();
    return matching.filter((s) => {
      const key = `${s.w}x${s.h}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);

  const scheduleRender = useCallback(() => {
    if (renderScheduledRef.current) return;
    renderScheduledRef.current = true;
    requestAnimationFrame(() => {
      renderScheduledRef.current = false;
      renderNow();
    });
  }, [renderNow]);

  useEffect(() => {
    scheduleRender();
  }, [scheduleRender]);

  // Carrega a imagem base do template ativo e calcula os mapas.
  useEffect(() => {
    let cancelled = false;
    setBaseLoaded(false);
    setMaps(EMPTY_MAPS);
    setDetection(null);
    setStatus("Carregando template…");
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      baseImgRef.current = img;
      setMaps(computeMaps(img, template.mugs, template.refW, template.refH));
      setBaseLoaded(true);
      setStatus(`Template: ${template.nome}`);
    };
    img.onerror = () => {
      if (cancelled) return;
      setStatus("Não foi possível carregar o template.");
    };
    img.src = template.base;
    return () => {
      cancelled = true;
    };
  }, [template]);

  const loadArtFromSrc = useCallback((src: string, name: string, attempt = 1) => {
    const img = new Image();
    img.onload = () => {
      setArt(img);
      setArtName(name);
      setArtPixels(cacheArtPixels(img));
    };
    img.onerror = () => {
      if (attempt < 3) {
        setTimeout(() => loadArtFromSrc(src, name, attempt + 1), 800);
        return;
      }
      setStatus("Não foi possível carregar a arte. Tente outro arquivo.");
    };
    img.src = src;
  }, []);

  const readFile = useCallback(
    (f: File) => {
      const r = new FileReader();
      r.onload = () => loadArtFromSrc(String(r.result), f.name);
      r.readAsDataURL(f);
    },
    [loadArtFromSrc],
  );

  const loadDemoArt = useCallback(() => {
    loadArtFromSrc(STUDIO_MOCKUP_2D_DEMO_ART, STUDIO_MOCKUP_2D_DEMO_ART_NAME);
  }, [loadArtFromSrc]);

  // Carrega a arte de demonstração na primeira abertura.
  useEffect(() => {
    loadDemoArt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearArt = useCallback(() => {
    setArt(null);
    setArtName("");
    setArtPixels(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const resetControls = useCallback(() => {
    setState(DEFAULT_RENDER_STATE);
  }, []);

  const handleAutoFit = useCallback(() => {
    if (!art) return;
    const mug = template.mugs[0];
    const fit = autoFitArt(mug, art.naturalWidth, art.naturalHeight, "contain");
    setState((prev) => ({ ...prev, zoom: fit.zoom, offX: fit.offX, offY: fit.offY }));
    setStatus(`Encaixe automático aplicado (zoom ${fit.zoom}%).`);
  }, [art, template]);

  const handleDetectArea = useCallback(async () => {
    const baseImg = baseImgRef.current;
    if (!baseImg) return;
    setDetecting(true);
    setStatus("Detectando a área da caneca…");
    try {
      const result = await Promise.resolve(
        detectMugArea(baseImg, 1, "Caneca 1", template.refW, template.refH),
      );
      setDetection(result);
      setStatus(
        `Detecção: confiança ${Math.round(result.confidence * 100)}% (${result.method}). Clique em "Aplicar área" para usar.`,
      );
    } catch {
      setStatus("Não foi possível detectar a área. Calibre manualmente.");
    } finally {
      setDetecting(false);
    }
  }, [template]);

  // Carrega as calibrações manuais salvas no navegador (por cena).
  useEffect(() => {
    setOverrides(loadOverrides());
  }, []);

  const applyDetection = useCallback(() => {
    if (!detection) return;
    setTemplate((prev) => ({
      ...prev,
      mugs: prev.mugs.map((m) => (m.id === detection.calibration.id ? detection.calibration : m)),
    }));
    setStatus(`Área detectada aplicada à ${detection.calibration.nome}.`);
  }, [detection]);

  // --- Calibração manual (arrastar a máscara) ---
  const calibMug: MugCalibration | null = template.mugs[calibMugIdx] ?? template.mugs[0] ?? null;
  const hasOverride = Boolean(overrides[template.id]);

  const updateCalibMug = useCallback((next: MugCalibration) => {
    setTemplate((prev) => ({
      ...prev,
      mugs: prev.mugs.map((m) => (m.id === next.id ? next : m)),
    }));
  }, []);

  const saveCalibration = useCallback(() => {
    const next = { ...overrides, [template.id]: template.mugs };
    setOverrides(next);
    try {
      localStorage.setItem(OVERRIDE_KEY, JSON.stringify(next));
      setStatus(`Calibração manual salva para ${template.nome} (neste navegador).`);
    } catch {
      setStatus("Não foi possível salvar a calibração neste navegador.");
    }
  }, [overrides, template]);

  const restoreCalibration = useCallback(() => {
    const base = STUDIO_MOCKUP_2D_TEMPLATES.find((t) => t.id === template.id);
    if (!base) return;
    const next = { ...overrides };
    delete next[template.id];
    setOverrides(next);
    try {
      localStorage.setItem(OVERRIDE_KEY, JSON.stringify(next));
    } catch {
      /* ignora */
    }
    setTemplate(base);
    setStatus(`Calibração original de ${template.nome} restaurada.`);
  }, [overrides, template.id]);

  const exportCalibrations = useCallback(() => {
    const blob = new Blob([JSON.stringify(overrides, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "studio-mockup-2d-calibracoes-manuais.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 12000);
    setStatus(`Exportadas ${Object.keys(overrides).length} calibrações manuais (JSON).`);
  }, [overrides]);

  const onCalibPointerDown = useCallback(
    (handle: string) => (e: React.PointerEvent) => {
      if (!calibMug) return;
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragStartRef.current = { x: e.clientX, y: e.clientY, mug: { ...calibMug } };
      setDragHandle(handle);
    },
    [calibMug],
  );

  const onCalibPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const start = dragStartRef.current;
      if (!start || !dragHandle || !calibMug) return;
      const el = canvasWrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = ((e.clientX - start.x) / rect.width) * template.refW;
      const dy = ((e.clientY - start.y) / rect.height) * template.refH;
      const m = start.mug;
      const startLeft = mugLeft(m);
      const startRight = mugRight(m);
      let xLeft = startLeft;
      let xRight = startRight;
      let topC = m.topC;
      let botC = m.botC;
      if (dragHandle.includes("l")) xLeft = Math.max(0, Math.min(startRight - 40, startLeft + dx));
      if (dragHandle.includes("r")) xRight = Math.min(template.refW, Math.max(startLeft + 40, startRight + dx));
      if (dragHandle.includes("t")) topC = Math.max(0, Math.min(m.botC - 40, m.topC + dy));
      if (dragHandle.includes("b")) botC = Math.min(template.refH, Math.max(m.topC + 40, m.botC + dy));
      // Recomputa cx/R a partir das bordas e mantém a elipse proporcional.
      const cx = (xLeft + xRight) / 2;
      const R = Math.max(10, (xRight - xLeft) / 2);
      const next: MugCalibration = {
        ...m,
        cx: Math.round(cx),
        R: Math.round(R),
        topC: Math.round(topC),
        topRy: Math.max(4, Math.round(R * 0.06)),
        botC: Math.round(botC),
        botRy: Math.max(5, Math.round(R * 0.07)),
        xLeft: Math.round(xLeft),
        xRight: Math.round(xRight),
      };
      updateCalibMug(next);
    },
    [dragHandle, calibMug, template.refW, template.refH, updateCalibMug],
  );

  const onCalibPointerUp = useCallback(() => {
    dragStartRef.current = null;
    setDragHandle(null);
  }, []);

  const handleExport = useCallback(async () => {
    const baseImg = baseImgRef.current;
    if (!baseImg || !art) return;
    const sizes = exportSizesForTemplate(template);
    const size = sizes.find((s) => `${s.w}x${s.h}` === exportSize) ?? sizes[0];
    if (!size) return;
    const W = size.w;
    const H = size.h;
    setExporting(true);
    try {
      // Exportação em 16:9 usa o render direto; formatos sociais usam o mesmo
      // render centralizado no canvas do formato (a cena é 16:9 e cabe no formato).
      const blob = await exportMockupBlob(template, baseImg, artPixels, maps, state, W, H);
      if (!blob) {
        setStatus("Não foi possível criar o PNG.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = template.exportName.replace(/\.png$/i, "") + `-${W}x${H}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 12000);
      setStatus(`Exportado ${W} × ${H}.`);
    } catch (err) {
      setStatus("Erro na exportação: " + (err instanceof Error ? err.message : "desconhecido"));
    } finally {
      setExporting(false);
    }
  }, [template, artPixels, maps, state, art, exportSize, exportSizesForTemplate]);

  const setTemplateIdx = useCallback(
    (idx: number) => {
      setActiveTemplateIdx(idx);
      const t = STUDIO_MOCKUP_2D_TEMPLATES[idx];
      // Aplica a calibração manual salva (se houver) por cima da do catálogo.
      const base = applyOverride(t, loadOverrides());
      setTemplate(base);
      setCalibMugIdx(0);
      setState(DEFAULT_RENDER_STATE);
      // A resolução de exportação volta para a primeira válida da proporção
      // da nova cena (16:9 ou 4:5), para o select nunca ficar sem opção.
      const sizes = exportSizesForTemplate(t);
      if (sizes[0]) setExportSize(`${sizes[0].w}x${sizes[0].h}`);
    },
    [exportSizesForTemplate],
  );

  return (
    <div className="min-h-screen bg-[#101014] text-neutral-100">
      <header className="border-b border-neutral-800 px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-white">Studio Click Mockup 2D</h1>
            <p className="text-xs text-neutral-400">Warp cilíndrico · detecção de área · exportação em alta resolução</p>
          </div>
          <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-400">
            Desenvolvimento — não publicado
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_320px]">
        <section>
          <div
            ref={canvasWrapRef}
            className="relative overflow-hidden rounded-xl border border-neutral-800 bg-black"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) readFile(f);
            }}
            onPointerMove={onCalibPointerMove}
            onPointerUp={onCalibPointerUp}
            onPointerCancel={onCalibPointerUp}
          >
            <canvas
              ref={canvasRef}
              width={template.refW}
              height={template.refH}
              className="block h-auto w-full"
              aria-label="Prévia do mockup"
            />
            {calibrating && calibMug && (
              <CalibrationOverlay
                mug={calibMug}
                refW={template.refW}
                refH={template.refH}
                onHandleDown={onCalibPointerDown}
              />
            )}
          </div>
          <p className="mt-2 text-xs text-neutral-400" role="status">
            {status}
            {art ? ` · Arte: ${artName} (${art.naturalWidth} × ${art.naturalHeight} px)` : " · nenhuma arte carregada"}
            {template.calibration?.avgConfidence !== undefined &&
              ` · Calibração: ${Math.round((template.calibration.avgConfidence ?? 0) * 100)}%`}
            {template.calibration?.needsManual && " · ⚠️ precisa de revisão manual no calibrador"}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Enviar arte (21 × 9,5 cm)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) readFile(f);
              }}
            />
            <button
              type="button"
              onClick={loadDemoArt}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-800"
            >
              Usar arte de demonstração
            </button>
            <button
              type="button"
              onClick={clearArt}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-800"
            >
              Limpar arte
            </button>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                set("compare", true);
              }}
              onPointerUp={() => set("compare", false)}
              onPointerLeave={() => set("compare", false)}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-800"
            >
              Segurar p/ comparar (sem arte)
            </button>
          </div>

          <div className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-white">Cena</h2>
            <label className="block text-xs text-neutral-400">
              Template ({STUDIO_MOCKUP_2D_TEMPLATES.length} cenas)
              <select
                value={String(activeTemplateIdx)}
                onChange={(e) => setTemplateIdx(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
              >
                <optgroup label="Gamer · 16:9">
                  {STUDIO_MOCKUP_2D_TEMPLATES.slice(0, 2).map((t, i) => (
                    <option key={t.id} value={String(i)}>
                      {t.nome}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Retrato 4:5 · par de canecas">
                  {STUDIO_MOCKUP_2D_TEMPLATES.slice(2).map((t, i) => (
                    <option key={t.id} value={String(i + 2)}>
                      {t.nome}
                      {t.calibration?.needsManual ? " — ⚠️ revisar calibração" : ""}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-800 p-4">
              <h2 className="mb-3 text-sm font-semibold text-white">Detecção de área</h2>
              <p className="mb-3 text-xs text-neutral-400">
                Encontra a caneca na foto e sugere a área de impressão. Confirme e aplique, ou calibre manualmente.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDetectArea}
                  disabled={detecting || !baseLoaded}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {detecting ? "Detectando…" : "Detectar área automaticamente"}
                </button>
                {detection && (
                  <button
                    type="button"
                    onClick={applyDetection}
                    className="rounded-lg border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-300 hover:bg-orange-500/10"
                  >
                    Aplicar área ({Math.round(detection.confidence * 100)}%)
                  </button>
                )}
              </div>
              {detection && (
                <p className="mt-2 text-xs text-neutral-400">
                  Detectado: cx {detection.calibration.cx} · R {detection.calibration.R} · topo{" "}
                  {detection.calibration.topC} · base {detection.calibration.botC} · método {detection.method}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-neutral-800 p-4">
              <h2 className="mb-3 text-sm font-semibold text-white">Calibração manual</h2>
              <p className="mb-3 text-xs text-neutral-400">
                Arraste a máscara sobre a caneca para ajustar a área exata. A arte acompanha em tempo real.
                {hasOverride ? " Esta cena já tem uma calibração manual salva." : ""}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCalibrating((v) => !v)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                    calibrating ? "bg-orange-500 text-white" : "border border-orange-500 text-orange-300 hover:bg-orange-500/10"
                  }`}
                >
                  {calibrating ? "Calibrando… (clique para sair)" : "Calibrar área (arrastar a máscara)"}
                </button>
                {calibrating && template.mugs.length > 1 && (
                  <label className="text-xs text-neutral-300">
                    Caneca
                    <select
                      value={String(calibMugIdx)}
                      onChange={(e) => setCalibMugIdx(Number(e.target.value))}
                      className="ml-2 rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
                    >
                      {template.mugs.map((m, i) => (
                        <option key={m.id} value={String(i)}>
                          {m.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              {calibrating && calibMug && (
                <p className="mt-2 text-xs text-neutral-400">
                  {calibMug.nome}: esquerda {Math.round(mugLeft(calibMug))} · direita {Math.round(mugRight(calibMug))} · topo{" "}
                  {Math.round(calibMug.topC)} · base {Math.round(calibMug.botC)} · R {Math.round(calibMug.R)}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveCalibration}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  Salvar calibração desta cena
                </button>
                {hasOverride && (
                  <button
                    type="button"
                    onClick={restoreCalibration}
                    className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-800"
                  >
                    Restaurar original
                  </button>
                )}
                {Object.keys(overrides).length > 0 && (
                  <button
                    type="button"
                    onClick={exportCalibrations}
                    className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-800"
                  >
                    Exportar calibrações ({Object.keys(overrides).length})
                  </button>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-neutral-800 p-4">
              <h2 className="mb-3 text-sm font-semibold text-white">Encaixe da arte</h2>
              <p className="mb-3 text-xs text-neutral-400">
                Centraliza e dimensiona a arte na área de impressão, respeitando 21 × 9,5 cm, sem distorcer.
              </p>
              <button
                type="button"
                onClick={handleAutoFit}
                disabled={!art}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                Encaixar automaticamente
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-neutral-800 p-4">
            <h2 className="mb-3 text-sm font-semibold text-white">Ajustes da arte</h2>
            <div className="space-y-3">
              <Slider label="Zoom" value={state.zoom} min={60} max={200} onChange={(v) => set("zoom", v)} />
              <Slider label="Posição horizontal" value={state.offX} min={-50} max={50} onChange={(v) => set("offX", v)} />
              <Slider label="Posição vertical" value={state.offY} min={-15} max={15} onChange={(v) => set("offY", v)} />
              <Slider label="Opacidade" value={state.opacity} min={40} max={100} onChange={(v) => set("opacity", v)} />
              <Slider label="Brilho / reflexo" value={state.light} min={0} max={100} onChange={(v) => set("light", v)} />
              <Slider label="Sombra" value={state.shade} min={0} max={100} onChange={(v) => set("shade", v)} />
              <Slider label="Vivacidade" value={state.sat} min={70} max={140} onChange={(v) => set("sat", v)} />
              <Slider label="Realismo" value={state.realismo} min={0} max={100} onChange={(v) => set("realismo", v)} />
              <Slider label="Curva" value={state.curva} min={0} max={100} onChange={(v) => set("curva", v)} />
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={state.split} onChange={(e) => set("split", e.target.checked)} className="accent-orange-500" />
                Dividir a arte entre as canecas
              </label>
              {state.split && (
                <Slider label="Ponto de divisão" value={state.splitPoint} min={30} max={70} onChange={(v) => set("splitPoint", v)} />
              )}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={state.use[0] ?? true}
                  onChange={(e) => set("use", [e.target.checked, state.use[1] ?? true])}
                  className="accent-orange-500"
                />
                Aplicar na Caneca 1
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={state.use[1] ?? true}
                  onChange={(e) => set("use", [state.use[0] ?? true, e.target.checked])}
                  className="accent-orange-500"
                />
                Aplicar na Caneca 2
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={state.showMasks} onChange={(e) => set("showMasks", e.target.checked)} className="accent-orange-500" />
                Mostrar máscaras (calibração)
              </label>
            </div>
            <button
              type="button"
              onClick={resetControls}
              className="mt-4 w-full rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-800"
            >
              Restaurar ajustes
            </button>
          </div>

          <div className="rounded-xl border border-neutral-800 p-4">
            <h2 className="mb-3 text-sm font-semibold text-white">Exportar</h2>
            <label className="block text-xs text-neutral-400">
              Resolução ({template.refW} × {template.refH} · mesma proporção da cena)
              <select
                value={exportSize}
                onChange={(e) => setExportSize(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
              >
                {exportSizesForTemplate(template).map((s) => (
                  <option key={`${s.w}x${s.h}`} value={`${s.w}x${s.h}`}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || !art}
              className="mt-3 w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {exporting ? "Preparando PNG…" : "Exportar PNG"}
            </button>
            <p className="mt-2 text-xs text-neutral-500">
              A exportação usa o mesmo render da prévia, sem diferença de geometria.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
