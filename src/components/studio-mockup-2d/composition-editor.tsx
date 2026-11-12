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
  kind?: "mug" | "logo";
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

/** O "slot" do cenário: onde o produto fica (mesma lógica do Studio).
 *  Slot grande para a caneca já chegar no tamanho adequado — antes ela
 *  chegava pequena (só 38% da altura) e precisava ampliar na mão. */
function sceneSlot(W: number, H: number) {
  return { x: W * 0.05, y: H * 0.30, w: W * 0.90, h: H * 0.64 };
}

/** Sombra de contato do editor: elipse suave sob a caneca, desenhada no
 *  canvas (prévia e exportação). Sem ela a caneca parece flutuando,
 *  principalmente quando uma está mais para cima (afastada) e outra mais
 *  para baixo (perto). A sombra acompanha a caneca e varia com a
 *  profundidade: mais para baixo = mais perto = sombra maior e mais forte. */
function drawLayerShadow(
  ctx: CanvasRenderingContext2D,
  layer: MugLayer,
  canvasH: number,
  scale: number,
) {
  const cx = (layer.x + layer.w / 2) * scale;
  const baseY = (layer.y + layer.h) * scale;
  const rx = layer.w * 0.44 * scale;
  const ry = Math.max(6 * scale, layer.h * 0.055 * scale);
  const depth = Math.min(1, Math.max(0, baseY / (canvasH * scale)));
  const alpha = 0.16 + depth * 0.24;
  ctx.save();
  ctx.translate(cx, baseY - ry * 0.35);
  ctx.scale(rx, ry);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, `rgba(0,0,0,${alpha.toFixed(3)})`);
  g.addColorStop(0.55, `rgba(0,0,0,${(alpha * 0.55).toFixed(3)})`);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Cantos da alça de redimensionar (os 4, para redimensionar por qualquer lado). */
type Corner = "tl" | "tr" | "bl" | "br";
type Rect = { x: number; y: number; w: number; h: number };
function handleCorners(rect: Rect): Record<Corner, { x: number; y: number }> {
  return {
    tl: { x: rect.x, y: rect.y },
    tr: { x: rect.x + rect.w, y: rect.y },
    bl: { x: rect.x, y: rect.y + rect.h },
    br: { x: rect.x + rect.w, y: rect.y + rect.h },
  };
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bg, setBg] = useState<Bg>({ kind: "color", value: "#ffffff", label: "Branco" });
  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const [status, setStatus] = useState("Carregando…");
  const [sceneQuery, setSceneQuery] = useState("");
  const [sceneCategory, setSceneCategory] = useState("");
  const [exportScale, setExportScale] = useState("1x");
  const [exporting, setExporting] = useState(false);
  const [exportingWebm, setExportingWebm] = useState(false);
  const [handoffLoaded, setHandoffLoaded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<null | {
    mode: "move" | "resize";
    id: string;
    startX: number;
    startY: number;
    orig: MugLayer;
    corner?: Corner;
    origBox?: { x: number; y: number; w: number; h: number };
    origLayers?: MugLayer[];
  }>(null);
  const guideDragRef = useRef<null | { id: string; orientation: "h" | "v" }>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [guides, setGuides] = useState<{ id: string; orientation: "h" | "v"; pos: number }[]>([]);
  const layersRef = useRef(layers);
  layersRef.current = layers;
  const historyRef = useRef<{ past: MugLayer[][]; future: MugLayer[][] }>({ past: [], future: [] });
  const [histTick, setHistTick] = useState(0);
  const snapshot = (ls: MugLayer[]) => ls.map((l) => ({ ...l }));
  const pushHistory = () => {
    historyRef.current.past.push(snapshot(layersRef.current));
    if (historyRef.current.past.length > 50) historyRef.current.past.shift();
    historyRef.current.future = [];
    setHistTick((t) => t + 1);
  };
  const undo = () => {
    const h = historyRef.current;
    if (!h.past.length) return;
    const prev = h.past.pop()!;
    h.future.push(snapshot(layersRef.current));
    setLayers(prev);
    setSelectedIds((cur) => cur.filter((id) => prev.some((l) => l.id === id)));
    setHistTick((t) => t + 1);
    setStatus("Desfeito.");
  };
  const redo = () => {
    const h = historyRef.current;
    if (!h.future.length) return;
    const next = h.future.pop()!;
    h.past.push(snapshot(layersRef.current));
    setLayers(next);
    setSelectedIds((cur) => cur.filter((id) => next.some((l) => l.id === id)));
    setHistTick((t) => t + 1);
    setStatus("Refeito.");
  };
  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  const selectedLayers = layers.filter((l) => selectedIds.includes(l.id));
  /** Caixa que engloba a seleção (uma caneca ou várias juntas). */
  const selectionBox = selectedLayers.length
    ? {
        x: Math.min(...selectedLayers.map((l) => l.x)),
        y: Math.min(...selectedLayers.map((l) => l.y)),
        w: Math.max(...selectedLayers.map((l) => l.x + l.w)) - Math.min(...selectedLayers.map((l) => l.x)),
        h: Math.max(...selectedLayers.map((l) => l.y + l.h)) - Math.min(...selectedLayers.map((l) => l.y)),
      }
    : null;

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
      drawLayerShadow(ctx, layer, H, 1);
      ctx.drawImage(layer.img, layer.x, layer.y, layer.w, layer.h);
    }
    // Guias (régua) — só na prévia, nunca na exportação.
    if (guides.length) {
      ctx.save();
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = Math.max(1.5, W / 720);
      ctx.setLineDash([8, 6]);
      for (const g of guides) {
        ctx.beginPath();
        if (g.orientation === "h") {
          ctx.moveTo(0, g.pos);
          ctx.lineTo(W, g.pos);
        } else {
          ctx.moveTo(g.pos, 0);
          ctx.lineTo(g.pos, H);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
    // Seleção: uma caneca ou o grupo (várias juntas) — contorno + 4 cantos.
    if (selectionBox) {
      ctx.save();
      ctx.strokeStyle = "#ff6a00";
      ctx.lineWidth = Math.max(2, W / 540);
      ctx.setLineDash([10, 6]);
      ctx.strokeRect(selectionBox.x, selectionBox.y, selectionBox.w, selectionBox.h);
      ctx.setLineDash([]);
      // Alças de redimensionar nos QUATRO cantos.
      const hs = Math.max(14, W / 54);
      ctx.fillStyle = "#ff6a00";
      for (const corner of Object.values(handleCorners(selectionBox))) {
        ctx.fillRect(corner.x - hs / 2, corner.y - hs / 2, hs, hs);
      }
      ctx.restore();
    }
  }, [bg, layers, selectionBox, canvasSize, guides]);

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
          setSelectedIds(arranged[0] ? [arranged[0].id] : []);
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
        pushHistory();
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
          setSelectedIds([layer.id]);
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
    pushHistory();
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
    (rect: Rect, x: number, y: number): Corner | null => {
      const hs = Math.max(14, canvasSize.w / 54);
      for (const [key, c] of Object.entries(handleCorners(rect)) as [Corner, { x: number; y: number }][]) {
        if (x >= c.x - hs && x <= c.x + hs && y >= c.y - hs && y <= c.y + hs) return key;
      }
      return null;
    },
    [canvasSize],
  );

  const hitGuide = useCallback(
    (x: number, y: number): string | null => {
      const tol = Math.max(6, canvasSize.w / 180);
      for (let i = guides.length - 1; i >= 0; i--) {
        const g = guides[i];
        if (g.orientation === "h" ? Math.abs(y - g.pos) <= tol : Math.abs(x - g.pos) <= tol) return g.id;
      }
      return null;
    },
    [guides, canvasSize],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const { x, y } = toLogical(e);
      // Arrastar uma guia existente.
      const guideId = hitGuide(x, y);
      if (guideId) {
        guideDragRef.current = { id: guideId, orientation: guides.find((g) => g.id === guideId)?.orientation ?? "h" };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
      // Alça de redimensionar da seleção (qualquer um dos 4 cantos) — redimensiona o grupo.
      if (selectionBox) {
        const corner = hitHandle(selectionBox, x, y);
        if (corner) {
          pushHistory();
          dragRef.current = {
            mode: "resize", id: selectedLayers[0]?.id ?? "", startX: x, startY: y,
            orig: selectedLayers[0] ?? { id: "", name: "", img: new Image(), x: 0, y: 0, w: 0, h: 0 },
            corner, origBox: { ...selectionBox }, origLayers: snapshot(selectedLayers),
          };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          return;
        }
      }
      // Camada mais acima primeiro.
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];
        if (x >= layer.x && x <= layer.x + layer.w && y >= layer.y && y <= layer.y + layer.h) {
          // Shift+clique soma à seleção (várias juntas); clique normal seleciona só ela.
          const nextSel = e.shiftKey
            ? selectedIds.includes(layer.id)
              ? selectedIds.filter((id) => id !== layer.id)
              : [...selectedIds, layer.id]
            : [layer.id];
          setSelectedIds(nextSel);
          pushHistory();
          dragRef.current = {
            mode: "move", id: layer.id, startX: x, startY: y, orig: { ...layer },
            origLayers: snapshot(layers.filter((l) => nextSel.includes(l.id))),
          };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          return;
        }
      }
      setSelectedIds([]);
    },
    [layers, selectedIds, selectedLayers, selectionBox, toLogical, hitHandle, hitGuide, guides],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const { x, y } = toLogical(e);
      // Arrastar guia.
      const gd = guideDragRef.current;
      if (gd) {
        const pos = gd.orientation === "h"
          ? Math.max(0, Math.min(canvasSize.h, y))
          : Math.max(0, Math.min(canvasSize.w, x));
        setGuides((prev) => prev.map((g) => (g.id === gd.id ? { ...g, pos } : g)));
        return;
      }
      const drag = dragRef.current;
      if (!drag) return;
      const dx = x - drag.startX;
      const dy = y - drag.startY;
      if (drag.mode === "move") {
        const ids = new Set((drag.origLayers ?? [drag.orig]).map((l) => l.id));
        const origMap = new Map((drag.origLayers ?? [drag.orig]).map((l) => [l.id, l]));
        setLayers((prev) =>
          prev.map((layer) => {
            const o = origMap.get(layer.id);
            if (!o || !ids.has(layer.id)) return layer;
            return { ...layer, x: o.x + dx, y: o.y + dy };
          }),
        );
        return;
      }
      // Resize do grupo: escala proporcional ancorada no canto oposto.
      const box = drag.origBox;
      const origLayers = drag.origLayers ?? [];
      if (!box || !drag.corner || !origLayers.length) return;
      const corner = drag.corner;
      const anchorX = corner === "tl" || corner === "bl" ? box.x + box.w : box.x;
      const anchorY = corner === "tl" || corner === "tr" ? box.y + box.h : box.y;
      const scaleX = corner === "tl" || corner === "bl" ? (anchorX - x) / box.w : (x - anchorX) / box.w;
      const scaleY = corner === "tl" || corner === "tr" ? (anchorY - y) / box.h : (y - anchorY) / box.h;
      const s = Math.max(0.05, Math.max(scaleX, scaleY));
      const newW = box.w * s;
      const newH = box.h * s;
      const newX = corner === "tl" || corner === "bl" ? anchorX - newW : anchorX;
      const newY = corner === "tl" || corner === "tr" ? anchorY - newH : anchorY;
      setLayers((prev) =>
        prev.map((layer) => {
          const o = origLayers.find((l) => l.id === layer.id);
          if (!o) return layer;
          const relX = (o.x - box.x) / box.w;
          const relY = (o.y - box.y) / box.h;
          return {
            ...layer,
            x: newX + relX * newW,
            y: newY + relY * newH,
            w: Math.max(20, o.w * s),
            h: Math.max(20, o.h * s),
          };
        }),
      );
    },
    [toLogical, canvasSize],
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    // Guia arrastada para fora (de volta à régua) é removida.
    const gd = guideDragRef.current;
    if (gd) {
      setGuides((prev) => prev.filter((g) => {
        if (g.id !== gd.id) return true;
        const limit = g.orientation === "h" ? canvasSize.h : canvasSize.w;
        return g.pos > 2 && g.pos < limit - 2;
      }));
      guideDragRef.current = null;
    }
  }, [canvasSize]);

  const moveLayer = useCallback((id: string, dir: -1 | 1) => {
    pushHistory();
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
    pushHistory();
    setLayers((prev) => {
      const layer = prev.find((l) => l.id === id);
      if (!layer) return prev;
      const copy: MugLayer = { ...layer, id: uid(), name: `${layer.name} (cópia)`, x: layer.x + 40, y: layer.y + 40 };
      setSelectedIds([copy.id]);
      return [...prev, copy];
    });
  }, []);

  const deleteLayer = useCallback((id: string) => {
    pushHistory();
    setLayers((prev) => prev.filter((l) => l.id !== id));
    setSelectedIds((cur) => cur.filter((x) => x !== id));
  }, []);

  const deleteSelected = useCallback(() => {
    if (!selectedIds.length) return;
    pushHistory();
    setLayers((prev) => prev.filter((l) => !selectedIds.includes(l.id)));
    setSelectedIds([]);
    setStatus(`${selectedIds.length} camada(s) removida(s).`);
  }, [selectedIds]);

  const selectAllLayers = useCallback(() => {
    setSelectedIds(layers.map((l) => l.id));
  }, [layers]);

  /** Puxar uma linha-guia da régua: da régua de cima sai uma linha horizontal,
   *  da régua da esquerda sai uma linha vertical. Solte sobre o canvas. */
  const startGuideFromRuler = useCallback(
    (orientation: "h" | "v") => (e: React.PointerEvent) => {
      const id = uid();
      const { x, y } = toLogical(e);
      const pos = orientation === "h"
        ? Math.max(0, Math.min(canvasSize.h, y))
        : Math.max(0, Math.min(canvasSize.w, x));
      setGuides((prev) => [...prev, { id, orientation, pos }]);
      guideDragRef.current = { id, orientation };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [toLogical, canvasSize],
  );

  // Atalhos: Delete/Backspace apaga a seleção · Ctrl+Z desfaz · Ctrl+Y / Ctrl+Shift+Z refaz.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA")) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length) {
        e.preventDefault();
        deleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIds, deleteSelected, undo, redo]);

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
        if (layer.kind !== "logo") drawLayerShadow(ctx, layer, H, scale);
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
    const mugs = layers.filter((l) => l.kind !== "logo");
    if (!mugs.length) return;
    for (const layer of mugs) {
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

  /** Upload de logotipo: vira uma camada que pode ir para qualquer lugar da composição. */
  const addLogoFile = useCallback((f: File) => {
    const url = URL.createObjectURL(f);
    loadImage(url)
      .then((img) => {
        pushHistory();
        const maxW = canvasSize.w * 0.28;
        const scale = Math.min(1, maxW / img.naturalWidth);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        const layer: MugLayer = {
          id: uid(), name: `Logo: ${f.name.replace(/\.[^.]+$/, "").slice(0, 40)}`, img,
          x: (canvasSize.w - w) / 2, y: canvasSize.h * 0.08, w, h, kind: "logo",
        };
        setLayers((prev) => [...prev, layer]);
        setSelectedIds([layer.id]);
        setStatus(`Logotipo adicionado: ${f.name}. Arraste para posicionar em qualquer lugar.`);
      })
      .catch(() => setStatus("Não foi possível carregar esse logotipo. Use um PNG com fundo transparente."));
  }, [canvasSize]);

  /**
   * Exporta WebM com canal alfa (fundo transparente): só as canecas, girando
   * 360° em 4 s, para usar como overlay em vídeo. O giro aqui é 2D (a caneca
   * gira no plano); o giro 3D de vitrine (mostrando todos os lados) continua
   * sendo o vídeo do Studio 3D.
   */
  const handleExportWebm = useCallback(async () => {
    const mugs = layers.filter((l) => l.kind !== "logo");
    if (!mugs.length) {
      setStatus("Não há canecas para exportar em WebM. Importe um PNG ou envie do Studio 3D.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setStatus("Este navegador não suporta gravação de WebM.");
      return;
    }
    setExportingWebm(true);
    try {
      const W = canvasSize.w;
      const H = canvasSize.h;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("Sem contexto 2d.");
      const stream = c.captureStream(30);
      const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((m) => {
        try { return MediaRecorder.isTypeSupported(m); } catch { return false; }
      }) ?? "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 8_000_000 } : undefined);
      const chunks: Blob[] = [];
      const done = new Promise<Blob>((resolve, reject) => {
        rec.ondataavailable = (ev) => { if (ev.data.size) chunks.push(ev.data); };
        rec.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
        rec.onerror = () => reject(new Error("Falha ao gravar o WebM."));
      });
      rec.start();
      const duration = 4000;
      const start = performance.now();
      await new Promise<void>((resolve) => {
        const frame = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const angle = t * Math.PI * 2;
          ctx.clearRect(0, 0, W, H);
          for (const layer of mugs) {
            const cx = layer.x + layer.w / 2;
            const cy = layer.y + layer.h / 2;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);
            ctx.drawImage(layer.img, -layer.w / 2, -layer.h / 2, layer.w, layer.h);
            ctx.restore();
          }
          if (t < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
      // Deixa o último quadro gravar antes de parar.
      await new Promise((r) => setTimeout(r, 120));
      rec.stop();
      const blob = await done;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mockup-2d-girando-${W}x${H}.webm`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 12000);
      setStatus(`WebM exportado (${W} × ${H}, giro 360° em 4 s, fundo transparente).`);
    } catch (err) {
      setStatus("Erro na exportação WebM: " + (err instanceof Error ? err.message : "desconhecido"));
    } finally {
      setExportingWebm(false);
    }
  }, [layers, canvasSize]);

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
          <div ref={canvasWrapRef} className="relative overflow-hidden rounded-xl border border-neutral-800 bg-black">
            <div className="flex">
              <div className="h-[22px] w-[22px] shrink-0 border-b border-r border-neutral-800 bg-neutral-900" aria-hidden="true" />
              <div
                role="presentation"
                aria-label="Régua horizontal — arraste para baixo para puxar uma linha-guia horizontal"
                title="Arraste para baixo para puxar uma linha-guia horizontal"
                className="h-[22px] flex-1 cursor-ns-resize touch-none border-b border-neutral-800 bg-neutral-900 bg-[repeating-linear-gradient(90deg,transparent_0_9px,#52525b_9px_10px,transparent_10px_49px,#a1a1aa_49px_50px)]"
                onPointerDown={startGuideFromRuler("h")}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
              />
            </div>
            <div className="flex">
              <div
                role="presentation"
                aria-label="Régua vertical — arraste para a direita para puxar uma linha-guia vertical"
                title="Arraste para a direita para puxar uma linha-guia vertical"
                className="w-[22px] shrink-0 cursor-ew-resize touch-none border-r border-neutral-800 bg-neutral-900 bg-[repeating-linear-gradient(0deg,transparent_0_9px,#52525b_9px_10px,transparent_10px_49px,#a1a1aa_49px_50px)]"
                onPointerDown={startGuideFromRuler("v")}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
              />
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
          </div>
          <p className="mt-2 text-xs text-neutral-400" role="status">
            {status}
            {layers.length > 0 && ` · ${layers.length} camada(s) · ${canvasSize.w} × ${canvasSize.h} px`}
          </p>
          <p className="mt-1 text-[11px] text-neutral-500">
            Réguas: puxe uma linha da régua de cima (horizontal) ou da esquerda (vertical) para alinhar. Arraste a
            linha de volta para a régua para remover. Guias não saem na exportação.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              title="Desfazer (Ctrl+Z)"
              className="rounded-lg border border-neutral-700 px-3 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-800 disabled:opacity-40"
            >
              ↩ Desfazer
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              title="Refazer (Ctrl+Y)"
              className="rounded-lg border border-neutral-700 px-3 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-800 disabled:opacity-40"
            >
              ↪ Refazer
            </button>
            <button
              type="button"
              onClick={selectAllLayers}
              disabled={!layers.length}
              title="Selecionar todas as camadas juntas"
              className="rounded-lg border border-neutral-700 px-3 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-800 disabled:opacity-40"
            >
              Selecionar todas
            </button>
            <button
              type="button"
              onClick={deleteSelected}
              disabled={!selectedIds.length}
              title="Excluir a(s) camada(s) selecionada(s) (Delete)"
              className="rounded-lg border border-red-900 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-950 disabled:opacity-40"
            >
              Excluir selecionada(s)
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Importar caneca / mockup pronto (PNG transparente)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/webp"
              multiple
              hidden
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                files.forEach((f) => addMugFile(f));
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-800"
            >
              Enviar logotipo
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/webp"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) addLogoFile(f);
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
            <button
              type="button"
              onClick={handleExportWebm}
              disabled={exportingWebm || !layers.some((l) => l.kind !== "logo")}
              title="Vídeo WebM com fundo transparente: só as canecas, girando 360° em 4 s"
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
            >
              {exportingWebm ? "Gravando…" : "Baixar WebM girando (fundo transparente)"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-neutral-500">
            O WebM sai só com as canecas (sem o cenário), fundo transparente, girando 360° em 4 s — pronto para
            usar como overlay em vídeo. O giro aqui é 2D; o giro 3D de vitrine é o vídeo do Studio 3D.
          </p>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-neutral-800 p-4">
            <h2 className="mb-1 text-sm font-semibold text-white">Camadas ({layers.length})</h2>
            <p className="mb-3 text-xs text-neutral-400">
              Clique numa caneca para selecionar. Segure Shift e clique para somar várias juntas (mova e
              redimensione o grupo). Arraste um quadradinho laranja de qualquer canto para mudar o tamanho.
              ↑ Para trás / ↓ Para frente mudam a ordem (uma atrás da outra). Delete apaga a seleção.
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
                    selectedIds.includes(layer.id) ? "border-orange-500 bg-orange-500/10" : "border-neutral-800"
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) =>
                      setSelectedIds((cur) =>
                        e.shiftKey
                          ? cur.includes(layer.id)
                            ? cur.filter((x) => x !== layer.id)
                            : [...cur, layer.id]
                          : [layer.id],
                      )
                    }
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
