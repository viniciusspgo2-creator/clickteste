"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Copy,
  Download,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers3,
  Loader2,
  Lock,
  Maximize2,
  Move,
  Plus,
  Redo2,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Stamp,
  Trash2,
  Undo2,
  Unlock,
  Upload,
} from "lucide-react";
import {
  BUILTIN_BACKGROUNDS,
  BUILTIN_MODELS,
  COMPOSITIONS,
} from "@/lib/mockup-scenes/catalog";
import {
  DEFAULT_PLACEMENT,
  sceneSize,
  type Artwork,
  type CatalogItem,
  type Piece,
  type SceneBackground,
  type SceneDocument,
  type SceneModel,
} from "@/lib/mockup-scenes/types";
import {
  loadImage,
  pieceBounds,
  readArtwork,
  renderScene,
} from "@/lib/mockup-scenes/render";
import { SceneExportDialog } from "./export-dialog";
import { BackgroundTiles, ModelTiles } from "./catalog-tiles";
import "./scenes.css";

type Tab = "compositions" | "models" | "backgrounds" | "art" | "logo";
const TABS = [
  { id: "compositions", label: "Composições", icon: Layers3 },
  { id: "models", label: "Canecas", icon: Coffee },
  { id: "backgrounds", label: "Cenários", icon: ImageIcon },
  { id: "art", label: "Sua arte", icon: Upload },
  { id: "logo", label: "Logotipo", icon: Stamp },
] as const;
const initial: SceneDocument = {
  pieces: [
    {
      id: "first",
      modelId: "porcelain-right",
      x: 0.5,
      y: 0.57,
      width: 0.88,
      art: null,
      placement: { ...DEFAULT_PLACEMENT },
      shadow: 0.65,
      locked: false,
      hidden: false,
    },
  ],
  background: {
    src: "/mockup/backgrounds/16-studio-creme.jpg",
    color: "#f1ece3",
    fit: "cover",
    x: 0.5,
    y: 0.5,
  },
  logo: null,
  aspect: "square",
};
const uid = () => crypto.randomUUID();
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function ScenesEditor() {
  const [doc, setDoc] = useState<SceneDocument>(initial),
    [selected, setSelected] = useState("first"),
    [tab, setTab] = useState<Tab>("compositions");
  const [models, setModels] = useState<SceneModel[]>(BUILTIN_MODELS),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [page, setPage] = useState(1);
  const [remote, setRemote] = useState<CatalogItem[]>([]),
    [categories, setCategories] = useState<string[]>([]),
    [pages, setPages] = useState(0),
    [catalogBusy, setCatalogBusy] = useState(false),
    [catalogError, setCatalogError] = useState("");
  const [historyState, setHistoryState] = useState({
    undo: false,
    redo: false,
  });
  const hitMasks = useRef(new Map<string, ImageData>());
  const [renderBusy, setRenderBusy] = useState(false),
    [uploadBusy, setUploadBusy] = useState(false),
    [error, setError] = useState(""),
    [exportOpen, setExportOpen] = useState(false),
    [guides, setGuides] = useState(true),
    [revision, setRevision] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null),
    canvasAreaRef = useRef<HTMLDivElement>(null),
    docRef = useRef(doc);
  const [canvasDisplay, setCanvasDisplay] = useState({
    width: 400,
    height: 400,
  });
  useEffect(() => {
    const area = canvasAreaRef.current;
    if (!area) return;
    const size = sceneSize(doc.aspect, 1000),
      ratio = size.width / size.height;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(
        1,
        Math.min(
          entry.contentRect.width,
          entry.contentRect.height * ratio,
          740,
        ),
      );
      setCanvasDisplay({ width, height: width / ratio });
    });
    observer.observe(area);
    return () => observer.disconnect();
  }, [doc.aspect]);
  const history = useRef<SceneDocument[]>([]),
    future = useRef<SceneDocument[]>([]);
  const gesture = useRef<{
    id: string;
    x: number;
    y: number;
    doc: SceneDocument;
    pointer: number;
  } | null>(null);
  const artInput = useRef<HTMLInputElement>(null),
    bgInput = useRef<HTMLInputElement>(null),
    logoInput = useRef<HTMLInputElement>(null);
  const remember = useCallback((prev: SceneDocument) => {
    history.current = [...history.current.slice(-39), prev];
    future.current = [];
    setRevision((v) => v + 1);
    setHistoryState({
      undo: history.current.length > 0,
      redo: future.current.length > 0,
    });
  }, []);
  const commit = useCallback(
    (update: (d: SceneDocument) => SceneDocument) => {
      const previous = docRef.current;
      const next = update(previous);
      if (next !== previous) {
        remember(previous);
        docRef.current = next;
        setDoc(next);
      }
    },
    [remember],
  );
  const patchPiece = (patch: Partial<Piece>) =>
    commit((d) => ({
      ...d,
      pieces: d.pieces.map((p) => (p.id === selected ? { ...p, ...patch } : p)),
    }));
  const active = doc.pieces.find((p) => p.id === selected),
    selectedModel = models.find((m) => m.id === active?.modelId);
  const logoSelected = selected === "logo" && !!doc.logo;
  const undo = useCallback(() => {
    const last = history.current.pop();
    if (!last) return;
    future.current.push(docRef.current);
    docRef.current = last;
    setDoc(last);
    setRevision((v) => v + 1);
    setHistoryState({
      undo: history.current.length > 0,
      redo: future.current.length > 0,
    });
  }, []);
  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    history.current.push(docRef.current);
    docRef.current = next;
    setDoc(next);
    setRevision((v) => v + 1);
    setHistoryState({
      undo: history.current.length > 0,
      redo: future.current.length > 0,
    });
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).matches("input,textarea,select") ||
        exportOpen
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [undo, redo, exportOpen]);
  useEffect(() => {
    let cancelled = false;
    setRenderBusy(true);
    const timer = setTimeout(
      () =>
        renderScene(doc, models, 1000)
          .then((c) => {
            if (cancelled) return;
            const target = canvasRef.current;
            if (target) {
              target.width = c.width;
              target.height = c.height;
              target.getContext("2d")?.drawImage(c, 0, 0);
            }
          })
          .catch((e) => {
            if (!cancelled) setError(e.message);
          })
          .finally(() => {
            if (!cancelled) setRenderBusy(false);
          }),
      20,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [doc, models]);
  useEffect(() => {
    if (tab !== "models" && tab !== "backgrounds") return;
    const abort = new AbortController();
    setCatalogBusy(true);
    setCatalogError("");
    setRemote([]);
    const params = new URLSearchParams({
      kind: tab === "models" ? "model" : "background",
      page: String(page),
      q: query,
      category,
    });
    const timer = setTimeout(
      () =>
        fetch(`/api/mockup-scenes/catalog?${params}`, {
          signal: abort.signal,
          cache: "no-store",
        })
          .then(async (r) => {
            const d = await r.json();
            if (!r.ok) throw new Error(d.error);
            return d;
          })
          .then((data) => {
            if (abort.signal.aborted) return;
            setRemote(data.items);
            setPages(data.pages);
            setCategories(data.categories);
            if (tab === "models")
              setModels((prev) => {
                const map = new Map(prev.map((m) => [m.id, m]));
                for (const r of data.items as CatalogItem[])
                  if (r.surface)
                    map.set(r.id, {
                      id: r.id,
                      name: r.name,
                      category: r.category,
                      imageUrl: r.imageUrl,
                      width: r.width,
                      height: r.height,
                      mapping: { kind: "cylinder", surface: r.surface },
                    });
                return [...map.values()];
              });
          })
          .catch((e) => {
            if (!abort.signal.aborted) setCatalogError(e.message);
          })
          .finally(() => {
            if (!abort.signal.aborted) setCatalogBusy(false);
          }),
      220,
    );
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [tab, page, query, category]);
  useEffect(() => {
    let cancelled = false;
    for (const model of models) {
      if (hitMasks.current.has(model.imageUrl)) continue;
      loadImage(model.imageUrl)
        .then((im) => {
          if (cancelled) return;
          const c = document.createElement("canvas");
          c.width = 256;
          c.height = Math.round((256 * im.height) / im.width);
          const ctx = c.getContext("2d");
          if (ctx) {
            ctx.drawImage(im, 0, 0, c.width, c.height);
            hitMasks.current.set(
              model.imageUrl,
              ctx.getImageData(0, 0, c.width, c.height),
            );
          }
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [models]);
  function switchTab(t: Tab) {
    setTab(t);
    setQuery("");
    setCategory("");
    setPage(1);
    setRemote([]);
    setCategories([]);
    setCatalogError("");
  }
  async function upload(
    file: File | undefined,
    target: "art" | "background" | "logo",
  ) {
    if (!file) return;
    setUploadBusy(true);
    setError("");
    try {
      const image = await readArtwork(file);
      if (target === "art") {
        if (
          !active ||
          !docRef.current.pieces.some((p) => p.id === active.id && !p.locked)
        )
          throw new Error(
            "Selecione e desbloqueie uma caneca para aplicar sua arte.",
          );
        const id = active.id;
        commit((d) => ({
          ...d,
          pieces: d.pieces.map((p) =>
            p.id === id
              ? { ...p, art: image, placement: { ...DEFAULT_PLACEMENT } }
              : p,
          ),
        }));
      } else if (target === "background")
        commit((d) => ({
          ...d,
          background: { ...d.background, src: image.src },
        }));
      else {
        commit((d) => ({
          ...d,
          logo: {
            image,
            x: 0.84,
            y: 0.9,
            width: 0.18,
            opacity: 1,
            locked: false,
          },
        }));
        setSelected("logo");
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível abrir a imagem.",
      );
    } finally {
      setUploadBusy(false);
    }
  }
  function addModel(id: string) {
    if (doc.pieces.length >= 12) {
      setError("Esta composição aceita até 12 canecas.");
      return;
    }
    const p: Piece = {
      id: uid(),
      modelId: id,
      x: 0.5,
      y: 0.55,
      width: 0.7,
      art: active?.art ?? null,
      placement: { ...DEFAULT_PLACEMENT },
      shadow: 0.65,
      locked: false,
      hidden: false,
    };
    commit((d) => ({ ...d, pieces: [...d.pieces, p] }));
    setSelected(p.id);
  }
  function compose(preset: (typeof COMPOSITIONS)[number]) {
    commit((d) => ({
      ...d,
      pieces: preset.items.map(([modelId, x, y, width], i) => ({
        id: d.pieces[i]?.id ?? uid(),
        modelId,
        x,
        y,
        width,
        art: d.pieces[i]?.art ?? active?.art ?? null,
        placement: d.pieces[i]?.placement ?? { ...DEFAULT_PLACEMENT },
        shadow: 0.65,
        locked: false,
        hidden: false,
      })),
    }));
    setSelected(docRef.current.pieces[0].id);
  }
  function moveLayer(direction: number) {
    commit((d) => {
      const ps = [...d.pieces],
        i = ps.findIndex((p) => p.id === selected),
        to = i + direction;
      if (i < 0 || to < 0 || to >= ps.length) return d;
      [ps[i], ps[to]] = [ps[to], ps[i]];
      return { ...d, pieces: ps };
    });
  }
  function pointerDown(e: PointerEvent<HTMLCanvasElement>) {
    if (!canvasRef.current || gesture.current) return;
    const rect = canvasRef.current.getBoundingClientRect(),
      x = (e.clientX - rect.left) / rect.width,
      y = (e.clientY - rect.top) / rect.height;
    const current = docRef.current,
      l = current.logo;
    let hit: string | undefined;
    if (l) {
      const height =
        (((l.width * rect.width) / rect.height) * l.image.height) /
        l.image.width;
      if (Math.abs(x - l.x) < l.width / 2 && Math.abs(y - l.y) < height / 2)
        hit = "logo";
    }
    if (!hit)
      for (const p of [...current.pieces].reverse()) {
        if (p.hidden) continue;
        const m = models.find((m) => m.id === p.modelId);
        if (!m) continue;
        const b = pieceBounds(p, m, rect.width, rect.height),
          px = x * rect.width - b.x,
          py = y * rect.height - b.y;
        if (px < 0 || py < 0 || px >= b.width || py >= b.height) continue;
        // Alpha hit testing prevents transparent template margins from covering neighbours.
        const mask = hitMasks.current.get(m.imageUrl);
        if (!mask) continue;
        const mx = Math.min(
            mask.width - 1,
            Math.floor((px / b.width) * mask.width),
          ),
          my = Math.min(
            mask.height - 1,
            Math.floor((py / b.height) * mask.height),
          );
        if (mask.data[(my * mask.width + mx) * 4 + 3] > 30) {
          hit = p.id;
          break;
        }
      }
    if (!hit) return;
    setSelected(hit);
    if (
      hit === "logo"
        ? l?.locked
        : current.pieces.find((p) => p.id === hit)?.locked
    )
      return;
    // Pointer capture is synchronous with a gesture; avoid starting after a quick tap ended.
    if (e.buttons !== 1 && e.pointerType !== "touch") return;
    gesture.current = { id: hit, x, y, doc: current, pointer: e.pointerId };
    canvasRef.current.setPointerCapture(e.pointerId);
  }
  function pointerMove(e: PointerEvent<HTMLCanvasElement>) {
    const g = gesture.current,
      c = canvasRef.current;
    if (!g || !c || g.pointer !== e.pointerId) return;
    const rect = c.getBoundingClientRect(),
      dx = (e.clientX - rect.left) / rect.width - g.x,
      dy = (e.clientY - rect.top) / rect.height - g.y;
    const p = g.doc.pieces.find((p) => p.id === g.id);
    const next =
      g.id === "logo" && g.doc.logo
        ? {
            ...g.doc,
            logo: {
              ...g.doc.logo,
              x: clamp(g.doc.logo.x + dx, 0, 1),
              y: clamp(g.doc.logo.y + dy, 0, 1),
            },
          }
        : {
            ...g.doc,
            pieces: g.doc.pieces.map((q) =>
              q.id === p?.id
                ? {
                    ...q,
                    x: clamp(q.x + dx, -0.25, 1.25),
                    y: clamp(q.y + dy, -0.25, 1.25),
                  }
                : q,
            ),
          };
    docRef.current = next;
    setDoc(next);
  }
  function finishPointer(cancelled = false) {
    const g = gesture.current;
    if (!g) return;
    gesture.current = null;
    if (cancelled) {
      docRef.current = g.doc;
      setDoc(g.doc);
    } else if (docRef.current !== g.doc) remember(g.doc);
  }
  const filteredBG = BUILTIN_BACKGROUNDS.filter(
    (m) =>
      (!category || m.category === category) &&
      (!query ||
        `${m.name} ${m.category}`.toLowerCase().includes(query.toLowerCase())),
  );
  const filteredModels = BUILTIN_MODELS.filter(
    (m) =>
      (!category || m.category === category) &&
      (!query ||
        `${m.name} ${m.category}`.toLowerCase().includes(query.toLowerCase())),
  );
  const remoteBG: SceneBackground[] = remote.map((r) => ({ ...r }));
  const remoteModels = remote
    .map((r) => models.find((m) => m.id === r.id))
    .filter((x): x is SceneModel => !!x);
  const [rw, rh] = Object.values(sceneSize(doc.aspect, 1000));
  const b =
    active && selectedModel ? pieceBounds(active, selectedModel, rw, rh) : null;
  const locked = active?.locked ?? doc.logo?.locked ?? false;
  return (
    <div className="sc-scope sc-editor">
      <header className="sc-header">
        <Link href="/mockup-cenarios" className="sc-brand">
          <span className="sc-brand-icon">
            <Layers3 size={22} />
          </span>
          <span>
            <strong>Mockup de Cenários</strong>
            <small>CLICK & GRUDA</small>
          </span>
        </Link>
        <div className="sc-header-center">
          <span className="sc-dot" />
          FOTOGRAFIA & COMPOSIÇÃO
        </div>
        <div className="sc-header-actions">
          <Link href="/mockup-caneca-3d/studio" className="sc-text-link">
            Studio 3D ↗
          </Link>
          <button
            className="sc-primary"
            onClick={() => setExportOpen(true)}
            disabled={renderBusy || uploadBusy}
          >
            <Download size={16} />
            Exportar imagem
          </button>
        </div>
      </header>
      <div className="sc-toolbar">
        <span>
          <ShieldCheck size={14} />
          Sua arte pronta. Uma nova apresentação.
        </span>
        <div>
          <button
            title="Desfazer (Ctrl+Z)"
            aria-label="Desfazer"
            disabled={!historyState.undo}
            onClick={undo}
          >
            <Undo2 size={16} />
          </button>
          <button
            title="Refazer (Ctrl+Shift+Z)"
            aria-label="Refazer"
            disabled={!historyState.redo}
            onClick={redo}
          >
            <Redo2 size={16} />
          </button>
          <i />
          <label>
            Proporção
            <select
              aria-label="Proporção do mockup"
              value={doc.aspect}
              onChange={(e) =>
                commit((d) => ({
                  ...d,
                  aspect: e.target.value as SceneDocument["aspect"],
                }))
              }
            >
              <option value="square">Quadrado · 1:1</option>
              <option value="portrait">Retrato · 4:5</option>
              <option value="landscape">Paisagem · 3:2</option>
            </select>
          </label>
          <button
            aria-label="Mostrar guias de seleção"
            aria-pressed={guides}
            onClick={() => setGuides(!guides)}
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>
      {error && (
        <div className="sc-alert" role="alert">
          {error}
          <button aria-label="Fechar aviso" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}
      <div className="sc-workspace">
        <nav className="sc-rail" aria-label="Ferramentas de composição">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
            >
              <t.icon size={21} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <aside className="sc-library">
          <div className="sc-library-heading">
            <span className="sc-eyebrow">SUA COMPOSIÇÃO COMEÇA AQUI</span>
            <h1>{TABS.find((t) => t.id === tab)?.label}</h1>
            <p>
              {tab === "compositions"
                ? "Um ponto de partida. Cada peça continua livre para mover e personalizar."
                : tab === "models"
                  ? "Vistas prontas, com curvatura e acabamento preservados."
                  : tab === "backgrounds"
                    ? "Escolha o clima da sua próxima apresentação."
                    : tab === "art"
                      ? "Aplique sua imagem pronta, sem alterar a proporção."
                      : "Assine sua criação com a sua marca."}
            </p>
          </div>
          <div className="sc-library-content">
            {tab === "compositions" && (
              <>
                <div className="sc-composition-grid">
                  {COMPOSITIONS.map((p) => (
                    <button
                      key={p.id}
                      className="sc-composition"
                      onClick={() => compose(p)}
                    >
                      <span className="sc-composition-image">
                        {p.items.map(([modelId, x, y, width], i) => (
                          <img
                            key={i}
                            src={
                              BUILTIN_MODELS.find((m) => m.id === modelId)
                                ?.imageUrl
                            }
                            alt=""
                            style={{
                              left: `${x * 100}%`,
                              top: `${y * 100}%`,
                              width: `${width * 100}%`,
                            }}
                          />
                        ))}
                      </span>
                      <strong>{p.name}</strong>
                      <small>{p.description}</small>
                    </button>
                  ))}
                </div>
                <div className="sc-note">
                  <Layers3 size={18} />
                  <p>
                    Use uma composição pronta ou monte a sua, com até 12 canecas
                    e artes independentes.
                  </p>
                </div>
              </>
            )}
            {(tab === "models" || tab === "backgrounds") && (
              <>
                <div className="sc-search">
                  <Search size={15} />
                  <input
                    aria-label="Buscar no catálogo"
                    placeholder="Buscar por nome ou tema…"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <select
                  aria-label="Categoria do catálogo"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Todas as categorias</option>
                  {[
                    ...new Set([
                      ...(tab === "models"
                        ? BUILTIN_MODELS
                        : BUILTIN_BACKGROUNDS
                      ).map((m) => m.category),
                      ...categories,
                    ]),
                  ]
                    .sort()
                    .map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                </select>
                {tab === "backgrounds" && (
                  <>
                    <button
                      className="sc-upload"
                      disabled={uploadBusy}
                      onClick={() => bgInput.current?.click()}
                    >
                      <Upload size={17} />
                      Enviar meu cenário
                      <small>PNG, JPEG ou WebP · até 12 MB</small>
                    </button>
                    <div className="sc-color-swatches">
                      {[
                        "#f1ece3",
                        "#ffffff",
                        "#151c1b",
                        "#c9d5c3",
                        "#dec6ba",
                      ].map((c) => (
                        <button
                          aria-label={`Fundo ${c}`}
                          key={c}
                          style={{ background: c }}
                          onClick={() =>
                            commit((d) => ({
                              ...d,
                              background: {
                                ...d.background,
                                src: null,
                                color: c,
                              },
                            }))
                          }
                        />
                      ))}
                    </div>
                  </>
                )}
                {tab === "backgrounds" ? (
                  <BackgroundTiles
                    items={[...(page === 1 ? filteredBG : []), ...remoteBG]}
                    selected={doc.background.src}
                    onSelect={(src) =>
                      commit((d) => ({
                        ...d,
                        background: { ...d.background, src },
                      }))
                    }
                  />
                ) : (
                  <ModelTiles
                    items={[
                      ...(page === 1 ? filteredModels : []),
                      ...remoteModels,
                    ]}
                    onSelect={addModel}
                  />
                )}
                {catalogBusy && (
                  <p className="sc-muted">
                    <Loader2 className="sc-spin" size={14} />
                    Consultando catálogo…
                  </p>
                )}
                {catalogError && (
                  <p className="sc-catalog-error" role="status">
                    {catalogError}
                  </p>
                )}
                {pages > 1 && (
                  <div className="sc-pagination">
                    <button
                      aria-label="Página anterior"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span>
                      {page} / {pages}
                    </span>
                    <button
                      aria-label="Próxima página"
                      disabled={page === pages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
            {tab === "art" && (
              <>
                <button
                  className="sc-upload sc-upload-large"
                  disabled={uploadBusy || !active || active.locked}
                  onClick={() => artInput.current?.click()}
                >
                  <Upload size={25} />
                  <strong>
                    {active?.art
                      ? "Trocar minha arte"
                      : "Enviar minha arte pronta"}
                  </strong>
                  <small>PNG, JPEG ou WebP · até 12 MB</small>
                </button>
                {active?.art && (
                  <div className="sc-uploaded">
                    <img src={active.art.src} alt="Arte enviada" />
                    <strong>{active.art.name}</strong>
                    <small>
                      {active.art.width} × {active.art.height} px
                    </small>
                    <button
                      className="sc-secondary"
                      disabled={active.locked}
                      onClick={() =>
                        commit((d) => ({
                          ...d,
                          pieces: d.pieces.map((p) =>
                            p.locked
                              ? p
                              : {
                                  ...p,
                                  art: active.art,
                                  placement: { ...active.placement },
                                },
                          ),
                        }))
                      }
                    >
                      <Copy size={14} />
                      Aplicar a todas as desbloqueadas
                    </button>
                  </div>
                )}
                <div className="sc-note">
                  <Check size={18} />
                  <p>
                    A proporção original é preservada. Ajuste o encaixe no
                    painel da caneca selecionada.
                  </p>
                </div>
                {!active && (
                  <p className="sc-muted">
                    Selecione uma caneca na composição para enviar a arte.
                  </p>
                )}
              </>
            )}
            {tab === "logo" && (
              <>
                <button
                  className="sc-upload sc-upload-large"
                  disabled={uploadBusy}
                  onClick={() => logoInput.current?.click()}
                >
                  <Stamp size={27} />
                  <strong>
                    {doc.logo ? "Trocar logotipo" : "Adicionar meu logotipo"}
                  </strong>
                  <small>Prefira PNG com fundo transparente</small>
                </button>
                {doc.logo && (
                  <>
                    <div className="sc-uploaded">
                      <img src={doc.logo.image.src} alt="Seu logotipo" />
                      <strong>{doc.logo.image.name}</strong>
                    </div>
                    <button
                      className="sc-secondary"
                      onClick={() => setSelected("logo")}
                    >
                      <Move size={14} />
                      Ajustar na composição
                    </button>
                    <button
                      className="sc-danger"
                      onClick={() => commit((d) => ({ ...d, logo: null }))}
                    >
                      <Trash2 size={14} />
                      Remover logotipo
                    </button>
                  </>
                )}
                <p className="sc-muted">
                  O logotipo é opcional e aparece na imagem exportada.
                </p>
              </>
            )}
          </div>
        </aside>
        <main className="sc-stage">
          <div className="sc-stage-top">
            <span>
              <span className="sc-dot" />
              {doc.pieces.length}{" "}
              {doc.pieces.length === 1 ? "caneca" : "canecas"} na composição
            </span>
            <span>
              {renderBusy ? (
                <>
                  <Loader2 size={12} className="sc-spin" />
                  Atualizando…
                </>
              ) : (
                <>
                  <Check size={12} />
                  Prévia atualizada
                </>
              )}
            </span>
          </div>
          <div className="sc-canvas-area" ref={canvasAreaRef}>
            <div
              className="sc-canvas-wrap"
              style={{
                width: canvasDisplay.width,
                height: canvasDisplay.height,
                aspectRatio: `${rw}/${rh}`,
              }}
            >
              <canvas
                ref={canvasRef}
                aria-label="Composição do mockup. Arraste para mover a caneca ou o logotipo."
                onPointerDown={pointerDown}
                onPointerMove={pointerMove}
                onPointerUp={() => finishPointer()}
                onPointerCancel={() => finishPointer(true)}
                onLostPointerCapture={() => finishPointer()}
              />
              {guides && b && !active?.hidden && (
                <div
                  className="sc-selection"
                  style={{
                    left: `${(b.x / rw) * 100}%`,
                    top: `${(b.y / rh) * 100}%`,
                    width: `${(b.width / rw) * 100}%`,
                    height: `${(b.height / rh) * 100}%`,
                  }}
                >
                  <span>
                    {active?.locked ? <Lock size={10} /> : <Move size={10} />}{" "}
                    {selectedModel?.name}
                  </span>
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              )}
              {guides && logoSelected && doc.logo && (
                <div
                  className="sc-selection"
                  style={{
                    left: `${(doc.logo.x - doc.logo.width / 2) * 100}%`,
                    top: `${(doc.logo.y - (((doc.logo.width * rw) / rh) * doc.logo.image.height) / doc.logo.image.width / 2) * 100}%`,
                    width: `${doc.logo.width * 100}%`,
                    aspectRatio: `${doc.logo.image.width}/${doc.logo.image.height}`,
                  }}
                >
                  <span>
                    <Stamp size={10} />
                    Logotipo
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="sc-stage-bottom">
            <span>
              <Move size={14} />
              Arraste para posicionar · ajuste o tamanho à direita
            </span>
            <span>Vistas fixas · imagem estática</span>
          </div>
        </main>
        <aside className="sc-inspector">
          <div className="sc-inspector-heading">
            <SlidersHorizontal size={17} />
            <h2>
              {logoSelected
                ? "Seu logotipo"
                : active
                  ? "Caneca selecionada"
                  : "Ajustes da composição"}
            </h2>
          </div>
          {(active || logoSelected) && (
            <section>
              <div className="sc-piece-title">
                <strong>
                  {logoSelected ? "Logotipo" : selectedModel?.name}
                </strong>
                <button
                  aria-label={locked ? "Desbloquear peça" : "Bloquear peça"}
                  onClick={() =>
                    logoSelected
                      ? commit((d) => ({
                          ...d,
                          logo: d.logo
                            ? { ...d.logo, locked: !d.logo.locked }
                            : null,
                        }))
                      : patchPiece({ locked: !active?.locked })
                  }
                >
                  {locked ? <Lock size={15} /> : <Unlock size={15} />}
                </button>
              </div>
              <p className="sc-muted">
                {locked
                  ? "Peça bloqueada. Desbloqueie para ajustar."
                  : "Posicione livremente, mantendo o ângulo do modelo."}
              </p>
              <fieldset disabled={locked}>
                <Range
                  label="Posição horizontal"
                  value={(logoSelected ? doc.logo!.x : active!.x) * 100}
                  min={-25}
                  max={125}
                  onChange={(v) =>
                    logoSelected
                      ? commit((d) => ({
                          ...d,
                          logo: { ...d.logo!, x: v / 100 },
                        }))
                      : patchPiece({ x: v / 100 })
                  }
                />
                <Range
                  label="Posição vertical"
                  value={(logoSelected ? doc.logo!.y : active!.y) * 100}
                  min={-25}
                  max={125}
                  onChange={(v) =>
                    logoSelected
                      ? commit((d) => ({
                          ...d,
                          logo: { ...d.logo!, y: v / 100 },
                        }))
                      : patchPiece({ y: v / 100 })
                  }
                />
                <Range
                  label="Tamanho"
                  value={(logoSelected ? doc.logo!.width : active!.width) * 100}
                  min={logoSelected ? 3 : 15}
                  max={logoSelected ? 65 : 150}
                  onChange={(v) =>
                    logoSelected
                      ? commit((d) => ({
                          ...d,
                          logo: { ...d.logo!, width: v / 100 },
                        }))
                      : patchPiece({ width: v / 100 })
                  }
                />
                <button
                  className="sc-secondary"
                  onClick={() =>
                    logoSelected
                      ? commit((d) => ({
                          ...d,
                          logo: { ...d.logo!, x: 0.5, y: 0.5 },
                        }))
                      : patchPiece({ x: 0.5, y: 0.57 })
                  }
                >
                  <Maximize2 size={14} />
                  Centralizar
                </button>
                {logoSelected ? (
                  <Range
                    label="Opacidade"
                    value={doc.logo!.opacity * 100}
                    onChange={(v) =>
                      commit((d) => ({
                        ...d,
                        logo: { ...d.logo!, opacity: v / 100 },
                      }))
                    }
                  />
                ) : (
                  <Range
                    label="Sombra de contato"
                    value={active!.shadow * 100}
                    onChange={(v) => patchPiece({ shadow: v / 100 })}
                  />
                )}
              </fieldset>
            </section>
          )}
          {active && (
            <section>
              <h3>
                <ImageIcon size={15} />
                Encaixe da estampa
              </h3>
              {!active.art ? (
                <button
                  className="sc-secondary"
                  disabled={active.locked || uploadBusy}
                  onClick={() => artInput.current?.click()}
                >
                  <Upload size={14} />
                  Enviar arte pronta
                </button>
              ) : (
                <fieldset disabled={active.locked}>
                  <label>
                    Aplicação
                    <select
                      value={active.placement.mode}
                      onChange={(e) =>
                        patchPiece({
                          placement: {
                            ...active.placement,
                            mode: e.target.value as "front" | "wrap",
                          },
                        })
                      }
                    >
                      <option value="front">Arte na frente</option>
                      <option value="wrap">Faixa envolvente</option>
                    </select>
                  </label>
                  <div className="sc-segmented">
                    <button
                      aria-pressed={active.placement.fit === "contain"}
                      onClick={() =>
                        patchPiece({
                          placement: { ...active.placement, fit: "contain" },
                        })
                      }
                    >
                      Arte inteira
                    </button>
                    <button
                      aria-pressed={active.placement.fit === "cover"}
                      onClick={() =>
                        patchPiece({
                          placement: { ...active.placement, fit: "cover" },
                        })
                      }
                    >
                      Preencher
                    </button>
                  </div>
                  <Range
                    label="Escala da arte"
                    min={10}
                    max={300}
                    value={active.placement.zoom * 100}
                    onChange={(v) =>
                      patchPiece({
                        placement: { ...active.placement, zoom: v / 100 },
                      })
                    }
                  />
                  <Range
                    label="Deslocar arte na horizontal"
                    min={-100}
                    max={100}
                    value={active.placement.x * 100}
                    onChange={(v) =>
                      patchPiece({
                        placement: { ...active.placement, x: v / 100 },
                      })
                    }
                  />
                  <Range
                    label="Deslocar arte na vertical"
                    min={-100}
                    max={100}
                    value={active.placement.y * 100}
                    onChange={(v) =>
                      patchPiece({
                        placement: { ...active.placement, y: v / 100 },
                      })
                    }
                  />
                  <button
                    className="sc-secondary"
                    onClick={() =>
                      patchPiece({ placement: { ...DEFAULT_PLACEMENT } })
                    }
                  >
                    Restaurar encaixe
                  </button>
                  <button
                    className="sc-danger"
                    onClick={() => patchPiece({ art: null })}
                  >
                    Remover arte desta caneca
                  </button>
                </fieldset>
              )}
            </section>
          )}
          <section>
            <h3>
              <ImageIcon size={15} />
              Fundo da composição
            </h3>
            <label>
              Enquadramento
              <select
                value={doc.background.fit}
                onChange={(e) =>
                  commit((d) => ({
                    ...d,
                    background: {
                      ...d.background,
                      fit: e.target.value as "cover" | "contain",
                    },
                  }))
                }
              >
                <option value="cover">Preencher o cenário</option>
                <option value="contain">Mostrar o cenário inteiro</option>
              </select>
            </label>
            <Range
              label="Enquadrar fundo na horizontal"
              value={doc.background.x * 100}
              onChange={(v) =>
                commit((d) => ({
                  ...d,
                  background: { ...d.background, x: v / 100 },
                }))
              }
            />
            <Range
              label="Enquadrar fundo na vertical"
              value={doc.background.y * 100}
              onChange={(v) =>
                commit((d) => ({
                  ...d,
                  background: { ...d.background, y: v / 100 },
                }))
              }
            />
          </section>
          <section>
            <h3>
              <Layers3 size={15} />
              Camadas <small>{doc.pieces.length}/12</small>
            </h3>
            <div className="sc-layers">
              {doc.logo && (
                <button
                  className={logoSelected ? "sc-active" : ""}
                  onClick={() => setSelected("logo")}
                >
                  <Stamp size={15} />
                  <span>Logotipo</span>
                </button>
              )}
              {[...doc.pieces].reverse().map((p, i) => (
                <div
                  key={p.id}
                  className={
                    selected === p.id ? "sc-layer sc-active" : "sc-layer"
                  }
                >
                  <button onClick={() => setSelected(p.id)}>
                    <Coffee size={15} />
                    <span>Caneca {doc.pieces.length - i}</span>
                    {p.locked && <Lock size={12} />}
                  </button>
                  <button
                    aria-label={p.hidden ? "Mostrar caneca" : "Ocultar caneca"}
                    onClick={() =>
                      commit((d) => ({
                        ...d,
                        pieces: d.pieces.map((q) =>
                          q.id === p.id ? { ...q, hidden: !q.hidden } : q,
                        ),
                      }))
                    }
                  >
                    {p.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              ))}
            </div>
            {active && (
              <>
                <div className="sc-piece-actions">
                  <button
                    className="sc-secondary"
                    title="Trazer uma camada para frente"
                    disabled={active.locked}
                    onClick={() => moveLayer(1)}
                  >
                    <ArrowUp size={14} />
                    Frente
                  </button>
                  <button
                    className="sc-secondary"
                    title="Enviar uma camada para trás"
                    disabled={active.locked}
                    onClick={() => moveLayer(-1)}
                  >
                    <ArrowDown size={14} />
                    Trás
                  </button>
                </div>
                <div className="sc-piece-actions">
                  <button
                    className="sc-secondary"
                    disabled={doc.pieces.length >= 12}
                    onClick={() => {
                      const p = {
                        ...active,
                        id: uid(),
                        x: clamp(active.x + 0.08, 0, 1),
                        placement: { ...active.placement },
                        locked: false,
                      };
                      commit((d) => ({ ...d, pieces: [...d.pieces, p] }));
                      setSelected(p.id);
                    }}
                  >
                    <Copy size={14} />
                    Duplicar
                  </button>
                  <button
                    className="sc-danger"
                    disabled={active.locked || doc.pieces.length === 1}
                    onClick={() => {
                      commit((d) => ({
                        ...d,
                        pieces: d.pieces.filter((p) => p.id !== selected),
                      }));
                      setSelected(docRef.current.pieces[0].id);
                    }}
                  >
                    <Trash2 size={14} />
                    Remover
                  </button>
                </div>
              </>
            )}
          </section>
        </aside>
      </div>
      <input
        ref={artInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          void upload(e.target.files?.[0], "art");
          e.target.value = "";
        }}
      />
      <input
        ref={bgInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          void upload(e.target.files?.[0], "background");
          e.target.value = "";
        }}
      />
      <input
        ref={logoInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          void upload(e.target.files?.[0], "logo");
          e.target.value = "";
        }}
      />
      {exportOpen && (
        <SceneExportDialog
          doc={doc}
          models={models}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  );
}

export function Range({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="sc-range">
      <span>
        {label}
        <output>{Math.round(value)}%</output>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
