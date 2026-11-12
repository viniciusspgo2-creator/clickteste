"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { readEditorHandoff } from "@/lib/creative/handoff";
import { studioScenes, studioSceneCategories, type StudioScene } from "@/lib/creative/studio-scenes";

/**
 * Editor Mockup 2D — composição.
 *
 * A caneca vem PERFEITA do Studio 3D (render 3D, PNG transparente) e aqui
 * ela é composta sobre um cenário. Nada de warp 2D, nada de template com
 * caneca branca embutida.
 *
 * - Recebe o handoff do Studio 3D (?from=mockup): cada caneca vira uma
 *   camada independente. Também aceita importar um PNG transparente.
 * - O cenário é escolhido numa GALERIA VISUAL (miniaturas, como no
 *   Studio Templates) — não é uma lista de nomes.
 * - Cada caneca se move separadamente (arrastar), redimensiona pela
 *   alça do canto e pode ficar parada enquanto a outra se move.
 * - Ao trocar de cenário, as canecas são reposicionadas com inteligência
 *   no "slot" do cenário (a área onde o produto fica), mantendo o
 *   tamanho relativo entre elas.
 */

type Bg =
  | { kind: "scene"; scene: StudioScene; img: HTMLImageElement }
  | { kind: "color"; value: string; label: string }
  | { kind: "image"; img: HTMLImageElement; label: string };

interface MugLayer {
  id: string;
  name: string;
  img: HTMLImageElement;
  x: number;
  y: number;
  w: number;
  h: number;
}

const SOLID_COLORS = [
  { value: "#ffffff", label: "Branco" },
  { value: "#f2f0eb", label: "Off-white" },
  { value: "#1a1a1e", label: "Preto" },
  { value: "#ff6a00", label: "Laranja" },
  { value: "#8ed0c5", label: "Menta" },
  { value: "#c9a0d8", label: "Lilás" },
  { value: "#6b3a7a", label: "Roxo" },
];

const DEFAULT_W = 1080;
const DEFAULT_H = 1350;

/** O "slot" do cenário: onde o produto fica (mesma lógica do Studio). */
function sceneSlot(W: number, H: number) {
  return { x: W * 0.12, y: H * 0.56, w: W * 0.76, h: H * 0.38 };
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
    img.src = src;
  });
}

function loadBlob(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  return loadImage(url);
}

/** Organiza as canecas dentro de um retângulo (slot ou canvas todo). */
function arrangeLayers(
  layers: MugLayer[],
  rect: { x: number; y: number; w: number; h: number },
): MugLayer[] {
  if (!layers.length) return layers;
  const gap = Math.max(16, rect.w * 0.03);
  const columns = layers.length === 1 ? 1 : Math.ceil(Math.sqrt(layers.length));
  const rows = Math.ceil(layers.length / columns);
  const cellW = (rect.w - gap * (columns - 1)) / columns;
  const cellH = (rect.h - gap * (rows - 1)) / rows;
  const factor = Math.min(
    1,
    ...layers.map((l) => Math.min(cellW / l.w, cellH / l.h)),
  );
  return layers.map((layer, i) => {
    const w = layer.w * factor;
    const h = layer.h * factor;
    const row = Math.floor(i / columns);
    const col = i % columns;
    const rowCount = Math.min(columns, layers.length - row * columns);
    const rowWidth = rowCount * cellW + (rowCount - 1) * gap;
    return {
      ...layer,
      w,
      h,
      x: rect.x + (rect.w - rowWidth) / 2 + col * (cellW + gap) + (cellW - w) / 2,
      y: rect.y + row * (cellH + gap) + (cellH - h) / 2,
    };
  });
}

export default function CompositionEditor() {
  const [layers, setLayers] = useState<MugLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bg, setBg] = useState<Bg>({ kind: "color", value: "#ffffff", label: "Branco" });
  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const [status, setStatus] = useState("Carregando…");
  const [sceneQuery, setSceneQuery] = useState("");
  const [sceneCategory, setSceneCategory] = useState("");
  const [exportScale, setExportScale] = useState("1x");
  const [exporting, setExporting] = useState(false);
  const [handoffLoaded, setHandoffLoaded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<null | {
    mode: "move" | "resize";
    id: string;
    startX: number;
    startY: number;
    orig: MugLayer;
  }>(null);

  const selected = layers.find((l) => l.id === selectedId) ?? null;

  const filteredScenes = useMemo(() => {
    const q = sceneQuery.trim().toLowerCase();
    return studioScenes.filter(
      (s) =>
        (!sceneCategory || s.category === sceneCategory) &&
        (!q || `${s.name} ${s.category}`.toLowerCase().includes(q)),
    );
  }, [sceneQuery, sceneCategory]);

  // Desenha o canvas: fundo + canecas + seleção.
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w: W, h: H } = canvasSize;
    ctx.clearRect(0, 0, W, H);
    if (bg.kind === "scene" && bg.img) {
      ctx.drawImage(bg.img, 0, 0, W, H);
    } else if (bg.kind === "image" && bg.img) {
      const s = Math.max(W / bg.img.naturalWidth, H / bg.img.naturalHeight);
      const dw = bg.img.naturalWidth * s;
      const dh = bg.img.naturalHeight * s;
      ctx.drawImage(bg.img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else if (bg.kind === "color") {
      ctx.fillStyle = bg.value;
      ctx.fillRect(0, 0, W, H);
    }
    for (const layer of layers) {
      ctx.drawImage(layer.img, layer.x, layer.y, layer.w, layer.h);
    }
    if (selected) {
      ctx.save();
      ctx.strokeStyle = "#ff6a00";
      ctx.lineWidth = Math.max(2, W / 540);
      ctx.setLineDash([10, 6]);
      ctx.strokeRect(selected.x, selected.y, selected.w, selected.h);
      ctx.setLineDash([]);
      // Alça de redimensionar (canto inferior direito).
      const hs = Math.max(14, W / 54);
      ctx.fillStyle = "#ff6a00";
      ctx.fillRect(selected.x + selected.w - hs / 2, selected.y + selected.h - hs / 2, hs, hs);
      ctx.restore();
    }
  }, [bg, layers, selected, canvasSize]);

  useEffect(() => {
    render();
  }, [render]);

  // Carrega o handoff do Studio 3D (?from=mockup).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const sceneId = params.get("scene");
        if (sceneId) {
          const scene = studioScenes.find((s) => s.id === sceneId);
          if (scene) {
            const img = await loadImage(scene.src);
            if (cancelled) return;
            setBg({ kind: "scene", scene, img });
            setBgImg(img);
            setCanvasSize({ w: scene.width, h: scene.height });
          }
        }
        if (params.get("from") === "mockup") {
          const handoff = await readEditorHandoff();
          if (cancelled) return;
          if (!handoff || !handoff.items.length) {
            setStatus("Nenhuma caneca recebida do Studio 3D. Importe um PNG transparente ou volte ao Studio 3D e use “Enviar para o Editor”.");
            setHandoffLoaded(true);
            return;
          }
          const loaded: MugLayer[] = [];
          for (const item of handoff.items) {
            const img = await loadBlob(item.blob);
            if (cancelled) return;
            loaded.push({ id: uid(), name: item.name, img, x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight });
          }
          const size = canvasSize;
          const rect =
            bg.kind === "scene"
              ? sceneSlot(size.w, size.h)
              : { x: size.w * 0.06, y: size.h * 0.11, w: size.w * 0.88, h: size.h * 0.78 };
          const arranged = arrangeLayers(loaded, rect);
          setLayers(arranged);
          setSelectedId(arranged[0]?.id ?? null);
          setStatus(
            handoff.mode === "separate"
              ? `${arranged.length} canecas em camadas independentes. Clique numa caneca para mover só ela; a outra fica no lugar.`
              : "Composição recebida do Studio 3D. Escolha um cenário e ajuste as canecas.",
          );
          setHandoffLoaded(true);
        } else {
          setStatus("Importe um PNG transparente de caneca, ou volte ao Studio 3D e use “Enviar para o Editor”.");
          setHandoffLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setStatus("Não foi possível ler as canecas do Studio 3D. Importe um PNG transparente.");
          setHandoffLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyScene = useCallback(
    async (scene: StudioScene) => {
      try {
        setStatus(`Carregando cenário ${scene.name}…`);
        const img = await loadImage(scene.src);
        const W = scene.width;
        const H = scene.height;
        setBg({ kind: "scene", scene, img });
        setBgImg(img);
        setCanvasSize({ w: W, h: H });
        // Reposiciona as canecas com inteligência no slot do cenário.
        setLayers((prev) => arrangeLayers(prev, sceneSlot(W, H)));
        setStatus(`Cenário aplicado: ${scene.name}. As canecas foram posicionadas no lugar certo — arraste para ajustar.`);
      } catch {
        setStatus("Não foi possível carregar esse cenário. Tente outro.");
      }
    },
    [],
  );

  const applyColor = useCallback((value: string, label: string) => {
    setBg({ kind: "color", value, label });
    setBgImg(null);
    setCanvasSize({ w: DEFAULT_W, h: DEFAULT_H });
    setLayers((prev) =>
      arrangeLayers(prev, { x: DEFAULT_W * 0.06, y: DEFAULT_H * 0.11, w: DEFAULT_W * 0.88, h: DEFAULT_H * 0.78 }),
    );
    setStatus(`Fundo aplicado: ${label}.`);
  }, []);

  const addMugFile = useCallback((f: File) => {
    const url = URL.createObjectURL(f);
    loadImage(url)
      .then((img) => {
        setLayers((prev) => {
          const layer: MugLayer = {
            id: uid(),
            name: f.name.replace(/\.[^.]+$/, "").slice(0, 60) || "Caneca",
            img,
            x: 0,
            y: 0,
            w: img.naturalWidth,
            h: img.naturalHeight,
          };
          const size = { w: DEFAULT_W, h: DEFAULT_H };
          const arranged = arrangeLayers([...prev, layer], {
            x: size.w * 0.06,
            y: size.h * 0.11,
            w: size.w * 0.88,
            h: size.h * 0.78,
          });
          setSelectedId(layer.id);
          return arranged;
        });
        setStatus(`Caneca importada: ${f.name}. Arraste para posicionar.`);
      })
      .catch(() => setStatus("Não foi possível carregar essa imagem. Use um PNG com fundo transparente."));
  }, []);

  const addBgFile = useCallback((f: File) => {
    const url = URL.createObjectURL(f);
    loadImage(url)
      .then((img) => {
        setBg({ kind: "image", img, label: `Imagem: ${f.name}` });
        setBgImg(img);
        setCanvasSize({ w: img.naturalWidth, h: img.naturalHeight });
        setLayers((prev) =>
          arrangeLayers(prev, sceneSlot(img.naturalWidth, img.naturalHeight)),
        );
        setStatus(`Fundo personalizado aplicado: ${f.name}.`);
      })
      .catch(() => setStatus("Não foi possível carregar essa imagem de fundo."));
  }, []);

  const organizeLayers = useCallback(() => {
    setLayers((prev) => {
      const rect =
        bg.kind === "scene"
          ? sceneSlot(canvasSize.w, canvasSize.h)
          : { x: canvasSize.w * 0.06, y: canvasSize.h * 0.11, w: canvasSize.w * 0.88, h: canvasSize.h * 0.78 };
      return arrangeLayers(prev, rect);
    });
    setStatus("Canecas organizadas no lugar certo do cenário.");
  }, [bg, canvasSize]);

  // --- Interação no canvas (arrastar / redimensionar) ---
  const toLogical = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * canvasSize.w,
        y: ((e.clientY - rect.top) / rect.height) * canvasSize.h,
      };
    },
    [canvasSize],
  );

  const hitHandle = useCallback(
    (layer: MugLayer, x: number, y: number) => {
      const hs = Math.max(14, canvasSize.w / 54);
      const hx = layer.x + layer.w - hs / 2;
      const hy = layer.y + layer.h - hs / 2;
      return x >= hx - hs && x <= hx + hs * 2 && y >= hy - hs && y <= hy + hs * 2;
    },
    [canvasSize],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const { x, y } = toLogical(e);
      // Alça de redimensionar da camada selecionada.
      if (selected && hitHandle(selected, x, y)) {
        dragRef.current = { mode: "resize", id: selected.id, startX: x, startY: y, orig: { ...selected } };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
      // Camada mais acima primeiro.
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];
        if (x >= layer.x && x <= layer.x + layer.w && y >= layer.y && y <= layer.y + layer.h) {
          setSelectedId(layer.id);
          dragRef.current = { mode: "move", id: layer.id, startX: x, startY: y, orig: { ...layer } };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          return;
        }
      }
      setSelectedId(null);
    },
    [layers, selected, toLogical, hitHandle],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const { x, y } = toLogical(e);
      const dx = x - drag.startX;
      const dy = y - drag.startY;
      setLayers((prev) =>
        prev.map((layer) => {
          if (layer.id !== drag.id) return layer;
          if (drag.mode === "move") {
            return { ...layer, x: drag.orig.x + dx, y: drag.orig.y + dy };
          }
          const aspect = drag.orig.w / drag.orig.h;
          const nw = Math.max(40, drag.orig.w + dx);
          return { ...layer, w: nw, h: nw / aspect };
        }),
      );
    },
    [toLogical],
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const moveLayer = useCallback((id: string, dir: -1 | 1) => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }, []);

  const duplicateLayer = useCallback((id: string) => {
    setLayers((prev) => {
      const layer = prev.find((l) => l.id === id);
      if (!layer) return prev;
      const copy: MugLayer = { ...layer, id: uid(), name: `${layer.name} (cópia)`, x: layer.x + 40, y: layer.y + 40 };
      setSelectedId(copy.id);
      return [...prev, copy];
    });
  }, []);

  const deleteLayer = useCallback((id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }, []);

  const handleExport = useCallback(async () => {
    if (!layers.length) {
      setStatus("Não há canecas para exportar. Importe um PNG ou envie do Studio 3D.");
      return;
    }
    setExporting(true);
    try {
      const scale = exportScale === "2x" ? 2 : 1;
      const W = canvasSize.w * scale;
      const H = canvasSize.h * scale;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("Sem contexto 2d.");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      if (bg.kind === "scene" && bg.img) ctx.drawImage(bg.img, 0, 0, W, H);
      else if (bg.kind === "image" && bg.img) {
        const s = Math.max(W / bg.img.naturalWidth, H / bg.img.naturalHeight);
        ctx.drawImage(bg.img, (W - bg.img.naturalWidth * s) / 2, (H - bg.img.naturalHeight * s) / 2, bg.img.naturalWidth * s, bg.img.naturalHeight * s);
      } else if (bg.kind === "color") {
        ctx.fillStyle = bg.value;
        ctx.fillRect(0, 0, W, H);
      }
      for (const layer of layers) {
        ctx.drawImage(layer.img, layer.x * scale, layer.y * scale, layer.w * scale, layer.h * scale);
      }
      const blob = await new Promise<Blob | null>((resolve) => c.toBlob((b) => resolve(b), "image/png"));
      if (!blob) throw new Error("Não foi possível criar o PNG.");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mockup-2d-${W}x${H}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 12000);
      setStatus(`Exportado ${W} × ${H} px.`);
    } catch (err) {
      setStatus("Erro na exportação: " + (err instanceof Error ? err.message : "desconhecido"));
    } finally {
      setExporting(false);
    }
  }, [layers, bg, canvasSize, exportScale]);

  const downloadMugs = useCallback(async () => {
    if (!layers.length) return;
    for (const layer of layers) {
      const c = document.createElement("canvas");
      c.width = layer.img.naturalWidth;
      c.height = layer.img.naturalHeight;
      const ctx = c.getContext("2d");
      if (!ctx) continue;
      ctx.drawImage(layer.img, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) => c.toBlob((b) => resolve(b), "image/png"));
      if (!blob) continue;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${layer.name.replace(/[^\w-]+/g, "-")}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 12000);
    }
    setStatus(`${layers.length} caneca(s) baixada(s) para o PC (PNG transparente).`);
  }, [layers]);

  return (
    <div className="min-h-screen bg-[#101014] text-neutral-100">
      <header className="border-b border-neutral-800 px-4 py-3">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-white">Editor Mockup 2D</h1>
            <p className="text-xs text-neutral-400">
              A caneca vem perfeita do Studio 3D — aqui você só compõe ela no cenário
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/mockup-caneca-3d"
              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-800"
            >
              ← Voltar ao Studio 3D
            </a>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || !layers.length}
              className="rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {exporting ? "Exportando…" : "Baixar PNG"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_340px]">
        <section>
          <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-black">
            <canvas
              ref={canvasRef}
              width={canvasSize.w}
              height={canvasSize.h}
              className="block h-auto w-full cursor-grab touch-none active:cursor-grabbing"
              aria-label="Prévia da composição — arraste as canecas para posicionar"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            />
          </div>
          <p className="mt-2 text-xs text-neutral-400" role="status">
            {status}
            {layers.length > 0 && ` · ${layers.length} caneca(s) · ${canvasSize.w} × ${canvasSize.h} px`}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Importar caneca (PNG transparente)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/webp"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) addMugFile(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={organizeLayers}
              disabled={!layers.length}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
            >
              Organizar canecas no cenário
            </button>
            <button
              type="button"
              onClick={downloadMugs}
              disabled={!layers.length}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
            >
              Baixar canecas p/ o PC
            </button>
          </div>

          <div className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-white">Cenário — escolha vendo a imagem</h2>
            <div className="mb-3 flex flex-wrap gap-2">
              <input
                type="search"
                value={sceneQuery}
                onChange={(e) => setSceneQuery(e.target.value)}
                placeholder="Buscar cafés, aniversário, neon…"
                aria-label="Buscar cenários"
                className="min-w-0 flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
              />
              <select
                value={sceneCategory}
                onChange={(e) => setSceneCategory(e.target.value)}
                aria-label="Categoria de cenários"
                className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
              >
                <option value="">Todas as categorias</option>
                {studioSceneCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {studioSceneCategories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSceneCategory(sceneCategory === c ? "" : c)}
                  aria-pressed={sceneCategory === c}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    sceneCategory === c
                      ? "border-orange-500 bg-orange-500/20 text-orange-300"
                      : "border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="grid max-h-96 grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
              {filteredScenes.map((scene) => (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => applyScene(scene)}
                  title={scene.name}
                  className={`group overflow-hidden rounded-lg border-2 text-left ${
                    bg.kind === "scene" && bg.scene.id === scene.id
                      ? "border-orange-500"
                      : "border-neutral-800 hover:border-neutral-600"
                  }`}
                >
                  <img
                    src={scene.preview}
                    alt={scene.name}
                    loading="lazy"
                    decoding="async"
                    className="block aspect-[4/5] w-full object-cover"
                  />
                  <span className="block truncate px-2 py-1.5 text-[11px] font-semibold text-neutral-200">
                    {scene.name}
                  </span>
                </button>
              ))}
              {filteredScenes.length === 0 && (
                <p className="col-span-full py-6 text-center text-xs text-neutral-400">
                  Nenhum cenário encontrado. Tente outro termo.
                </p>
              )}
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              {filteredScenes.length} de {studioScenes.length} cenários · clique num cenário para aplicar — as canecas
              são posicionadas no lugar certo automaticamente.
            </p>

            <h3 className="mb-2 mt-5 text-xs font-semibold text-neutral-300">Ou uma cor sólida / sua imagem</h3>
            <div className="flex flex-wrap items-center gap-2">
              {SOLID_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => applyColor(c.value, c.label)}
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
                Enviar imagem de fundo
              </button>
              <input
                ref={bgFileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) addBgFile(f);
                  e.target.value = "";
                }}
              />
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              Fundo atual:{" "}
              {bg.kind === "scene" ? bg.scene.name : bg.kind === "image" ? bg.label : bg.label}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-neutral-800 p-4">
            <h2 className="text-sm font-semibold text-white">Exportação</h2>
            <label className="flex items-center gap-2 text-xs text-neutral-300">
              Tamanho
              <select
                value={exportScale}
                onChange={(e) => setExportScale(e.target.value)}
                className="rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-white"
              >
                <option value="1x">Normal ({canvasSize.w} × {canvasSize.h})</option>
                <option value="2x">Alta resolução 2x ({canvasSize.w * 2} × {canvasSize.h * 2})</option>
              </select>
            </label>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || !layers.length}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {exporting ? "Exportando…" : "Baixar PNG da composição"}
            </button>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-neutral-800 p-4">
            <h2 className="mb-1 text-sm font-semibold text-white">Canecas ({layers.length})</h2>
            <p className="mb-3 text-xs text-neutral-400">
              Clique numa caneca no canvas para selecionar. Arraste para mover só ela — a outra fica no lugar.
              Arraste o quadradinho laranja do canto para mudar o tamanho.
            </p>
            {layers.length === 0 && (
              <p className="rounded-lg bg-neutral-900 px-3 py-2 text-xs text-neutral-400">
                Nenhuma caneca ainda. {handoffLoaded ? "Importe um PNG transparente." : "Carregando…"}
              </p>
            )}
            <ul className="space-y-2">
              {layers.map((layer, i) => (
                <li
                  key={layer.id}
                  className={`rounded-lg border px-3 py-2 ${
                    selectedId === layer.id ? "border-orange-500 bg-orange-500/10" : "border-neutral-800"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(layer.id)}
                    className="block w-full text-left text-xs font-semibold text-white"
                  >
                    {i + 1}. {layer.name}
                    <span className="block font-normal text-neutral-400">
                      {Math.round(layer.w)} × {Math.round(layer.h)} px
                    </span>
                  </button>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => moveLayer(layer.id, -1)}
                      disabled={i === 0}
                      className="rounded border border-neutral-700 px-2 py-1 text-[11px] text-neutral-200 hover:bg-neutral-800 disabled:opacity-40"
                    >
                      ↑ Para trás
                    </button>
                    <button
                      type="button"
                      onClick={() => moveLayer(layer.id, 1)}
                      disabled={i === layers.length - 1}
                      className="rounded border border-neutral-700 px-2 py-1 text-[11px] text-neutral-200 hover:bg-neutral-800 disabled:opacity-40"
                    >
                      ↓ Para frente
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateLayer(layer.id)}
                      className="rounded border border-neutral-700 px-2 py-1 text-[11px] text-neutral-200 hover:bg-neutral-800"
                    >
                      Duplicar
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteLayer(layer.id)}
                      className="rounded border border-red-900 px-2 py-1 text-[11px] text-red-300 hover:bg-red-950"
                    >
                      Remover
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-neutral-800 p-4">
            <h2 className="mb-2 text-sm font-semibold text-white">Como funciona</h2>
            <ol className="list-decimal space-y-1 pl-4 text-xs leading-relaxed text-neutral-400">
              <li>Crie a caneca no Studio 3D e clique em “Enviar para o Editor”.</li>
              <li>Escolha um cenário na galeria — a caneca vai para o lugar certo sozinha.</li>
              <li>Arraste cada caneca para ajustar a posição e o tamanho.</li>
              <li>Baixe o PNG da composição (ou as canecas separadas para o PC).</li>
            </ol>
          </div>
        </aside>
      </main>
    </div>
  );
}
