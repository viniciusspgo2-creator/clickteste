"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_RENDER_STATE,
  type ArtPixels,
  type RenderState,
  type SceneMaps,
} from "@/lib/studio-mockup-2d/types";
import { STUDIO_MOCKUP_2D_DEMO_ART, STUDIO_MOCKUP_2D_DEMO_ART_NAME } from "@/lib/studio-mockup-2d/catalog";
import { cacheArtPixels } from "@/lib/studio-mockup-2d/warp";
import { computeMaps } from "@/lib/studio-mockup-2d/maps";
import { makeTestArt, TEST_ART_LABELS, type TestArtKind } from "@/lib/studio-mockup-2d/testart";
import {
  FIXED_BG_COLORS,
  FIXED_MUG_REF_H,
  FIXED_MUG_REF_W,
  FIXED_MUG_TEMPLATE,
  exportFixedMugBlob,
  renderFixedMug,
  renderFixedPairOffscreen,
  type FixedMugBg,
} from "@/lib/studio-mockup-2d/fixed-mug";

const EMPTY_MAPS: SceneMaps = { lumMap: null, specMap: null, edgeColors: [], grainPattern: null, ready: false };

const PREVIEW_W = 1080;
const PREVIEW_H = 1350;

const EXPORT_SIZES = [
  { label: "Retrato · 1080 × 1350", w: 1080, h: 1350 },
  { label: "Retrato 2x · 2160 × 2700", w: 2160, h: 2700 },
  { label: "Story / Reels · 1080 × 1920", w: 1080, h: 1920 },
  { label: "Quadrado · 1080 × 1080", w: 1080, h: 1080 },
  { label: "Paisagem · 1920 × 1080", w: 1920, h: 1080 },
];

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

export default function FixedMugEditor() {
  const [state, setState] = useState<RenderState>(DEFAULT_RENDER_STATE);
  const [art, setArt] = useState<HTMLImageElement | null>(null);
  const [artName, setArtName] = useState("");
  const [artPixels, setArtPixels] = useState<ArtPixels | null>(null);
  const [status, setStatus] = useState("Carregando caneca fixa…");
  const [bg, setBg] = useState<FixedMugBg>(FIXED_BG_COLORS[0]);
  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);
  const [offsetY, setOffsetY] = useState(0);
  const [exportSize, setExportSize] = useState("1080x1350");
  const [exporting, setExporting] = useState(false);
  const [pairLoaded, setPairLoaded] = useState(false);
  const [maps, setMaps] = useState<SceneMaps>(EMPTY_MAPS);
  const [pairCanvas, setPairCanvas] = useState<HTMLCanvasElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pairImgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const renderScheduledRef = useRef(false);

  const set = useCallback(<K extends keyof RenderState>(key: K, value: RenderState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Carrega a imagem do par (uma vez) e calcula os mapas de realismo
  // a partir da própria caneca (a arte herda a luz da porcelana).
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      pairImgRef.current = img;
      setMaps(computeMaps(img, FIXED_MUG_TEMPLATE.mugs, FIXED_MUG_REF_W, FIXED_MUG_REF_H));
      setPairLoaded(true);
      setStatus("Caneca fixa pronta — a mesma caneca em todos os cenários.");
    };
    img.onerror = () => {
      if (cancelled) return;
      setStatus("Não foi possível carregar a caneca fixa.");
    };
    img.src = FIXED_MUG_TEMPLATE.base;
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-renderiza o par (com a arte) sempre que a arte ou os controles mudam.
  useEffect(() => {
    if (!pairLoaded) return;
    const pairImg = pairImgRef.current;
    if (!pairImg) return;
    const off = renderFixedPairOffscreen(pairImg, artPixels, maps, state);
    setPairCanvas(off);
  }, [pairLoaded, artPixels, maps, state]);

  const renderNow = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pairCanvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderFixedMug(ctx, PREVIEW_W, PREVIEW_H, bg, bgImg, pairCanvas, offsetY);
  }, [pairCanvas, bg, bgImg, offsetY]);

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
    setStatus(`Arte de demonstração aplicada: ${STUDIO_MOCKUP_2D_DEMO_ART_NAME}.`);
  }, [loadArtFromSrc]);

  const loadTestArt = useCallback(
    (kind: TestArtKind) => {
      try {
        const url = makeTestArt(kind);
        loadArtFromSrc(url, `teste-${kind}.png (21 × 9,5 cm)`);
        setStatus(`Arte de teste aplicada: ${TEST_ART_LABELS[kind]}.`);
      } catch {
        setStatus("Não foi possível gerar a arte de teste.");
      }
    },
    [loadArtFromSrc],
  );

  useEffect(() => {
    loadDemoArt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const readBgFile = useCallback((f: File) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        setBgImg(img);
        setBg({ kind: "image", value: f.name, label: `Imagem: ${f.name}` });
        setStatus(`Fundo personalizado aplicado: ${f.name}.`);
      };
      img.onerror = () => setStatus("Não foi possível carregar essa imagem de fundo.");
      img.src = String(r.result);
    };
    r.readAsDataURL(f);
  }, []);

  const clearArt = useCallback(() => {
    setArt(null);
    setArtName("");
    setArtPixels(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleExport = useCallback(async () => {
    if (!pairCanvas || !art) return;
    const size = EXPORT_SIZES.find((s) => `${s.w}x${s.h}` === exportSize) ?? EXPORT_SIZES[0];
    setExporting(true);
    try {
      const blob = await exportFixedMugBlob(bg, bgImg, pairCanvas, offsetY, size.w, size.h);
      if (!blob) {
        setStatus("Não foi possível criar o PNG.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mockup-caneca-fixa-${size.w}x${size.h}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 12000);
      setStatus(`Exportado ${size.w} × ${size.h}.`);
    } catch (err) {
      setStatus("Erro na exportação: " + (err instanceof Error ? err.message : "desconhecido"));
    } finally {
      setExporting(false);
    }
  }, [pairCanvas, art, bg, bgImg, offsetY, exportSize]);

  return (
    <div className="min-h-screen bg-[#101014] text-neutral-100">
      <header className="border-b border-neutral-800 px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-white">Studio Click Mockup 2D — Caneca Fixa</h1>
            <p className="text-xs text-neutral-400">
              Uma caneca só, calibrada uma vez — o cenário muda, a caneca não
            </p>
          </div>
          <a
            href="/studio-mockup-2d"
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-800"
          >
            ← Voltar para as cenas
          </a>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-black">
            <canvas
              ref={canvasRef}
              width={PREVIEW_W}
              height={PREVIEW_H}
              className="block h-auto w-full"
              aria-label="Prévia do mockup — caneca fixa"
            />
          </div>
          <p className="mt-2 text-xs text-neutral-400" role="status">
            {status}
            {art ? ` · Arte: ${artName} (${art.naturalWidth} × ${art.naturalHeight} px)` : " · nenhuma arte carregada"}
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

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-neutral-300">Artes de teste (revelam distorção):</span>
            <button
              type="button"
              onClick={() => loadTestArt("grid")}
              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-800"
            >
              Grade técnica
            </button>
            <button
              type="button"
              onClick={() => loadTestArt("checker")}
              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-800"
            >
              Xadrez
            </button>
            <button
              type="button"
              onClick={() => loadTestArt("text")}
              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-800"
            >
              Texto grande
            </button>
          </div>

          <div className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-white">Cenário (fundo)</h2>
            <p className="mb-3 text-xs text-neutral-400">
              A caneca não muda — só o fundo. Escolha uma cor ou envie uma foto de cenário (sem caneca).
            </p>
            <div className="flex flex-wrap gap-2">
              {FIXED_BG_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    setBg(c);
                    setBgImg(null);
                  }}
                  title={c.label}
                  aria-label={c.label}
                  className={`h-9 w-9 rounded-lg border-2 ${
                    bg.kind === "color" && bg.value === c.value ? "border-orange-500" : "border-neutral-700"
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
              <button
                type="button"
                onClick={() => bgFileInputRef.current?.click()}
                className="rounded-lg border border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-800"
              >
                Enviar foto de fundo
              </button>
              <input
                ref={bgFileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) readBgFile(f);
                }}
              />
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              Fundo atual: {bg.label}
              {bg.kind === "image" && (
                <>
                  {" · "}
                  <button
                    type="button"
                    className="underline hover:text-white"
                    onClick={() => {
                      setBg(FIXED_BG_COLORS[0]);
                      setBgImg(null);
                    }}
                  >
                    voltar para cor sólida
                  </button>
                </>
              )}
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-800 p-4">
              <h2 className="mb-3 text-sm font-semibold text-white">Posição das canecas</h2>
              <label className="block">
                <span className="flex justify-between text-xs text-neutral-300">
                  <span>Altura das canecas</span>
                  <span className="font-semibold text-white">{offsetY} px</span>
                </span>
                <input
                  type="range"
                  min={-250}
                  max={250}
                  value={offsetY}
                  onChange={(e) => setOffsetY(Number(e.target.value))}
                  className="mt-1 w-full accent-orange-500"
                />
              </label>
              <p className="mt-2 text-xs text-neutral-400">
                Sobe ou desce o par para alinhar a base com a mesa do cenário.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800 p-4">
              <h2 className="mb-3 text-sm font-semibold text-white">Exportação</h2>
              <label className="block text-xs text-neutral-400">
                Tamanho
                <select
                  value={exportSize}
                  onChange={(e) => setExportSize(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
                >
                  {EXPORT_SIZES.map((s) => (
                    <option key={`${s.w}x${s.h}`} value={`${s.w}x${s.h}`}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting || !art || !pairCanvas}
                className="mt-3 w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {exporting ? "Exportando…" : "Exportar PNG"}
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-neutral-800 p-4">
            <h2 className="mb-3 text-sm font-semibold text-white">Arte na caneca</h2>
            <div className="grid gap-3">
              <Slider label="Zoom da arte" value={state.zoom} min={60} max={200} onChange={(v) => set("zoom", v)} />
              <Slider label="Posição horizontal" value={state.offX} min={-50} max={50} onChange={(v) => set("offX", v)} />
              <Slider label="Posição vertical" value={state.offY} min={-15} max={15} onChange={(v) => set("offY", v)} />
              <Slider label="Opacidade" value={state.opacity} min={40} max={100} onChange={(v) => set("opacity", v)} />
              <label className="flex items-center gap-2 text-xs text-neutral-300">
                <input
                  type="checkbox"
                  checked={state.split}
                  onChange={(e) => set("split", e.target.checked)}
                  className="accent-orange-500"
                />
                Dividir a arte entre as duas canecas
              </label>
              {state.split && (
                <Slider
                  label="Ponto de divisão"
                  value={state.splitPoint}
                  min={30}
                  max={70}
                  onChange={(v) => set("splitPoint", v)}
                />
              )}
              <button
                type="button"
                onClick={() => {
                  setState(DEFAULT_RENDER_STATE);
                  setOffsetY(0);
                  setBg(FIXED_BG_COLORS[0]);
                  setBgImg(null);
                  setStatus("Controles redefinidos (arte, altura e fundo).");
                }}
                className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-800"
              >
                Redefinir controles
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-800 p-4">
            <h2 className="mb-3 text-sm font-semibold text-white">Realismo</h2>
            <div className="grid gap-3">
              <Slider label="Realismo" value={state.realismo} min={0} max={100} onChange={(v) => set("realismo", v)} />
              <Slider label="Luz / reflexo" value={state.light} min={0} max={100} onChange={(v) => set("light", v)} />
              <Slider label="Sombra" value={state.shade} min={0} max={100} onChange={(v) => set("shade", v)} />
              <Slider label="Saturação" value={state.sat} min={70} max={140} onChange={(v) => set("sat", v)} />
            </div>
            <p className="mt-3 text-xs text-neutral-400">
              A arte herda a luz da própria caneca (o realismo vem do recorte, não do fundo).
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
