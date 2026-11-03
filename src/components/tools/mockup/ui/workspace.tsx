"use client";
import {
  useEffect as ReactUseEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  ImagePlus,
  Images,
  Coffee,
  Layers,
  Settings2,
  Sun,
  Moon,
  Undo2,
  Redo2,
  FolderOpen,
  Download,
  ArrowLeft,
  MousePointer2,
  Move,
  Rotate3D,
  Scaling,
  Hand,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  Grid3X3,
  Maximize,
  Play,
  Pause,
  Upload,
  Save,
  MessageCircle,
  X,
  Check,
  Camera,
  Lightbulb,
  RotateCcw,
  CircleArrowUp,
  PanelRightClose,
  PanelRightOpen,
  Expand,
  Shrink,
  SlidersHorizontal,
  Palette,
  Sparkles,
  Facebook,
  Instagram,
  Search,
  MoreHorizontal,
  BookOpen,
} from "lucide-react";
import { useMockupStore, type MugState, type ArtState } from "../state/store";
import { useToolsStore } from "@/lib/tools-store";
import {
  ArtPanel,
  CameraPanel,
  LightPanel,
  MugPanel,
  ScenePanel,
} from "./panels";
import { FXPanel, MultiMugPanel } from "./panels-extra";
import { HandleControls } from "./handle-controls";
import { Section, ColorRow, SliderRow, ToggleRow } from "./controls";
import { MODELS } from "../scene/model-geometry";
import { CAMERA_PRESETS, FLOOR_OPTIONS, LIGHT_PRESETS } from "../lib/config";
import { getArtImage, loadArtFile, makeSampleArt } from "../lib/art-registry";
import { NEUTRAL_ADJUSTMENTS } from "../lib/art-adjustments";
import { BaseArtPanel } from "./base-art-panel";
import { OutputFormatControl } from "./output-format-control";
import { PrintLayersPanel } from "./print-layers-panel";
import { HDRIPanel } from "./hdri-panel";
import { PremiumBackgrounds } from "./premium-backgrounds";
import { saveCurrentProject } from "./projects-dialog";
import { exportImage, downloadBlob } from "../exporters/image-exporter";
import {
  exportPortableProject,
  importPortableProject,
} from "../lib/portable-project";
import {
  QuickCameraBar,
  QuickArtControls,
  CeramicPalette,
} from "./quick-controls";
import { CeramicFinishControls } from "./ceramic-finish-controls";
import { CERAMIC_FINISHES } from "../lib/ceramic-finishes";
import { PieceEditor, PieceSwitcher } from "./piece-editor";
import { PoseControls } from "./pose-controls";
import { ShadowPresets } from "./shadow-presets";
import { StudioGuide, type GuideAction } from "./guide-panel";
import { StudioConcierge } from "@/components/creative/studio-concierge";
import {usePlatformLanguage} from "@/components/platform/language-provider";
import { ArtAssistant } from "./art-assistant";
import "./workspace.css";

type Tab =
  | "arts"
  | "base"
  | "backgrounds"
  | "models"
  | "layers"
  | "scene"
  | "light"
  | "camera"
  | "compose"
  | "effects";
const NAV = [
  { id: "models", label: "Produto", icon: Coffee },
  { id: "arts", label: "Estampa", icon: ImagePlus },
  { id: "base", label: "Bocão", icon: CircleArrowUp },
  { id: "backgrounds", label: "Cenário", icon: Images },
  { id: "light", label: "Luz e sombra", icon: Sun },
  { id: "camera", label: "Câmera", icon: Camera, advanced: true },
  { id: "compose", label: "Composição", icon: Layers, advanced: true },
  { id: "effects", label: "Efeitos", icon: Palette, advanced: true },
  { id: "layers", label: "Camadas", icon: SlidersHorizontal, advanced: true },
] as const;
function ToolButton({
  label,
  onClick,
  active,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled}
      className={`cg-icon ${active ? "is-active" : ""}`}
    >
      {children}
    </button>
  );
}
export function Workspace({
  viewport,
  onUpload,
  onShortcuts,
  onGuideOpenChange,
}: {
  viewport: ReactNode;
  onUpload: () => void;
  onShortcuts: () => void;
  onGuideOpenChange?: (open: boolean) => void;
}) {
  const st = useMockupStore();
  const {t}=usePlatformLanguage();
  const [tab, setTab] = useState<Tab>("arts");
  const [advanced, setAdvanced] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [stageFocus, setStageFocus] = useState(false);
  const [light, setLight] = useState(true);
  const [resetOpen, setResetOpen] = useState(false);
  const [keepArt, setKeepArt] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [resetNotice, setResetNotice] = useState(false);
  const [drawer, setDrawer] = useState<"library" | "properties" | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [conciergeOpen, setConciergeOpen] = useState(false);
  ReactUseEffect(() => { onGuideOpenChange?.(guideOpen); }, [guideOpen, onGuideOpenChange]);
  const active = st.selectedIds[0] ?? "hero";
  const selected =
    active === "hero" ? st.mug : st.companions.find((c) => c.id === active);
  const art =
    active === "hero"
      ? st.art
      : (st.companions.find((c) => c.id === active)?.art ?? st.art);
  const notify = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4500);
  }, []);
  ReactUseEffect(() => {
    const migrated = (e: Event) => notify((e as CustomEvent<string>).detail);
    window.addEventListener("cg-mockup-migrated", migrated);
    return () => window.removeEventListener("cg-mockup-migrated", migrated);
  }, [notify]);
  ReactUseEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);
  async function safe(task: () => Promise<void>) {
    setBusy(true);
    try {
      await task();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setBusy(false);
    }
  }
  async function share() {
    const r = await exportImage({
      width: 1080,
      height: 1080,
      format: "png",
      quality: 1,
      transparent: false,
    });
    const file = new File([r.blob], r.filename, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: st.projectName });
    } else {
      downloadBlob(r.blob, r.filename);
      notify("Imagem baixada. Anexe no WhatsApp para enviar ao cliente.");
    }
  }
  function patchArt(p: Partial<ArtState>) {
    if (st.compareArt) st.setCompare(false);
    st.patchObjectArt(active, p);
  }
  function openGuideAction(action: GuideAction) {
    if (action === "upload") { onUpload(); return; }
    if (action === "export") { st.setExportOpen(true); return; }
    if (action === "move") { st.setTool("move"); setDrawer(null); return; }
    if (action === "light" || action === "compose") { if (action === "compose") setAdvanced(true); setStageFocus(false); setTab(action); setDrawer("library"); return; }
    setShowProperties(true); setStageFocus(false); setDrawer("properties");
    requestAnimationFrame(() => document.getElementById(action === "finish" ? "cg-finish-section" : "cg-art-section")?.scrollIntoView({ block: "start", behavior: "smooth" }));
  }
  return (
    <div className={`cg-workspace ${light ? "cg-light" : "cg-dark"} ${!showProperties ? "cg-properties-hidden" : ""} ${stageFocus ? "cg-stage-focus" : ""}`}>
      <header className="cg-topbar">
        <a
          className="cg-icon"
          aria-label="Voltar ao guia"
          href="/mockup-caneca-3d"
        >
          <ArrowLeft />
        </a>
        <div className="cg-brand">
          <span className="cg-logo">
            <Coffee />
          </span>
          <span>
            Click<span className="cg-orange">&</span>Gruda
            <small>MOCKUP STUDIO</small>
          </span>
        </div>
        <span className="cg-divider" />
        <input
          aria-label="Nome do projeto"
          className="cg-project-name"
          value={st.projectName}
          onChange={(e) => st.setProjectName(e.target.value)}
        />
        <div className="cg-history">
          <ToolButton
            label="Desfazer · Ctrl+Z"
            onClick={st.undo}
            disabled={!st.past.length}
          >
            <Undo2 />
          </ToolButton>
          <ToolButton
            label="Refazer · Ctrl+Y"
            onClick={st.redo}
            disabled={!st.future.length}
          >
            <Redo2 />
          </ToolButton>
        </div>
        <div className="cg-zoom-top">
          <button
            onClick={() => st.setZoom(st.zoom - 10)}
            aria-label="Diminuir zoom"
          >
            −
          </button>
          <span>{Math.round(st.zoom)}%</span>
          <button
            onClick={() => st.setZoom(st.zoom + 10)}
            aria-label="Aumentar zoom"
          >
            +
          </button>
        </div>
        <a className="cg-toplink" href="/bonus">
          Bônus grátis
        </a>
        <a
          className="cg-toplink"
          href="https://clickgruda.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          title="Biblioteca de artes"
        >
          Biblioteca
        </a>
        <a
          className="cg-top-social"
          href="https://instagram.com/clickgruda.digital"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram Click&Gruda"
        >
          <Instagram />
        </a>
        <a
          className="cg-top-social"
          href="https://www.facebook.com/artesparacanecasoficial"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook Click&Gruda"
        >
          <Facebook />
        </a>
        <div className="cg-header-actions">
          <ToolButton label={t('Guia do Studio')} onClick={() => setGuideOpen(true)}><BookOpen /></ToolButton>
          <ToolButton label={t('Assistente de sublimação')} onClick={() => setConciergeOpen(true)}><MessageCircle /></ToolButton>
          <ToolButton
            label="Buscar ajustes · Ctrl+K"
            onClick={() => setSearchOpen(true)}
          >
            <Search />
          </ToolButton>
          <ToolButton
            label={light ? "Tema escuro" : "Tema claro"}
            onClick={() => setLight(!light)}
          >
            {light ? <Moon /> : <Sun />}
          </ToolButton>
          <ToolButton
            label="Projetos salvos"
            onClick={() => st.setProjectsOpen(true)}
          >
            <FolderOpen />
          </ToolButton>
          <ToolButton
            label="Salvar projeto"
            disabled={busy}
            onClick={() =>
              safe(async () => {
                await saveCurrentProject("working-project", st.projectName);
                notify("Projeto salvo neste dispositivo.");
              })
            }
          >
            <Save />
          </ToolButton>
          <button
            className="cg-reset-btn"
            onClick={() => setResetOpen(true)}
            title={t('Resetar tudo')}
          >
            <RotateCcw /> <span>{t('Resetar tudo')}</span>
          </button>
        </div>
        <details className="cg-mobile-menu">
          <summary aria-label="Mais opções do estúdio">
            <MoreHorizontal />
          </summary>
          <div>
            <button type="button" onClick={(e) => { setGuideOpen(true); e.currentTarget.closest("details")?.removeAttribute("open"); }}><BookOpen />{t('Guia do Studio')}</button>
            <button
              type="button"
              onClick={(e) => {
                setSearchOpen(true);
                e.currentTarget.closest("details")?.removeAttribute("open");
              }}
            >
              <Search />
              Buscar ajustes
            </button>
            <button
              type="button"
              onClick={(e) => {
                st.setProjectsOpen(true);
                e.currentTarget.closest("details")?.removeAttribute("open");
              }}
            >
              <FolderOpen />
              Projetos salvos
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={(e) => {
                e.currentTarget.closest("details")?.removeAttribute("open");
                safe(async () => {
                  await saveCurrentProject("working-project", st.projectName);
                  notify("Projeto salvo neste dispositivo.");
                });
              }}
            >
              <Save />
              Salvar projeto
            </button>
            <button type="button" onClick={() => setLight(!light)}>
              {light ? <Moon /> : <Sun />}
              {light ? "Tema escuro" : "Tema claro"}
            </button>
            <button
              type="button"
              onClick={(e) => {
                setResetOpen(true);
                e.currentTarget.closest("details")?.removeAttribute("open");
              }}
            >
              <RotateCcw />
              Resetar tudo
            </button>
          </div>
        </details>
        <button
          className="cg-toplink"
          onClick={onShortcuts}
          title="Atalhos de teclado (?)"
        >
          Atalhos <kbd>?</kbd>
        </button>
        <button
          className="cg-export"
          aria-label="Exportar imagem"
          onClick={() => st.setExportOpen(true)}
        >
          <Download />
          <span>Exportar imagem</span>
        </button>
      </header>
      <div className="cg-body">
        <nav className="cg-rail" aria-label="Biblioteca do estúdio">
          {NAV.filter(n => advanced || !("advanced" in n)).map((n) => (
            <button
              key={n.id}
              className={tab === n.id ? "is-active" : ""}
              onClick={() => {
                setTab(n.id);
                setStageFocus(false);
                setDrawer("library");
              }}
              aria-label={t(n.label)}
            >
              <n.icon />
              <span>{t(n.label)}</span>
            </button>
          ))}
          <button type="button" className={`cg-advanced-toggle ${advanced ? "is-active" : ""}`} aria-expanded={advanced} title={advanced ? "Ocultar ferramentas avançadas" : "Mostrar ferramentas avançadas"} onClick={() => { setAdvanced(v => !v); if (advanced && NAV.find(n => n.id === tab && "advanced" in n)) setTab("arts"); setStageFocus(false); }}>
            <SlidersHorizontal /><span>{t(advanced ? 'Menos' : 'Mais')}</span>
          </button>
          <div className="cg-rail-bottom">
            <ToolButton
              label="Compartilhar imagem"
              disabled={busy}
              onClick={() => safe(share)}
            >
              <MessageCircle />
            </ToolButton>
          </div>
        </nav>
        {drawer && (
          <button
            className="cg-scrim"
            aria-label="Fechar painel"
            onClick={() => setDrawer(null)}
          />
        )}
        <aside
          className={`cg-library cg-panel ${drawer === "library" ? "cg-drawer-open" : ""}`}
          aria-label="Biblioteca e recursos"
        >
          <div className="cg-panel-heading">
            <div>
              <small>SEU ESTÚDIO CRIATIVO</small>
              <h2>{NAV.find((n) => n.id === tab)?.label}</h2>
            </div>
            <button
              className="cg-mobile-close cg-icon"
              aria-label="Fechar biblioteca"
              onClick={() => setDrawer(null)}
            >
              <X />
            </button>
          </div>
          {st.companions.length > 0 && <label className="cg-piece-quick-select">Editar peça
            <select aria-label="Caneca selecionada" value={active} onChange={e => { st.patch("camera", {autoRotate:false}); st.select(e.target.value); }}>
              <option value="hero">{st.mug.name || "Caneca 01"}</option>
              {st.companions.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>}
          <details className="cg-piece-editor-toggle"><summary>Girar ou gerenciar canecas</summary><PieceEditor onUpload={onUpload} /></details>
          <div className="cg-editor-help"><span>{advanced ? "Ferramentas completas" : "Ferramentas essenciais"}</span><button type="button" onClick={() => {setShowProperties(true);setStageFocus(false);setDrawer("properties");}}>Ajustes finos <PanelRightOpen /></button></div>
          {tab === "arts" && (
            <>
              <button className="cg-upload" onClick={onUpload}>
                <Upload />
                <strong>{art.imageId ? "Trocar arte" : "Adicionar arte"} · {selected?.name || "Caneca selecionada"}</strong>
                <span>Arraste um arquivo ou cole com Ctrl+V</span>
              </button>
              <div className="cg-asset-preview">
                {getArtImage(art.imageId)?.source && <ArtPreview art={art} />}
                <strong>{art.name || "Sua próxima ideia começa aqui"}</strong>
                <span>
                  {art.width
                    ? `${art.width} × ${art.height} px`
                    : "PNG, JPG, WebP, SVG e AVIF"}
                </span>
              </div>
              <button
                className="cg-secondary"
                disabled={!!selected?.locked}
                onClick={() => {
                  const e = makeSampleArt();
                  st.setArtImage({
                    objectId: active,
                    imageId: e.id,
                    name: e.name,
                    width: e.naturalWidth,
                    height: e.naturalHeight,
                  });
                }}
              >
                Experimentar arte de exemplo
              </button>
              <QuickArtControls active={active} art={art} locked={!!selected?.locked} />
              <button type="button" className="cg-bocao-entry" onClick={() => { setTab("base"); setDrawer("library"); }}>
                <CircleArrowUp /><span><strong>Arte da base · Bocão</strong><small>Enviar, centralizar e girar a boca livremente</small></span>
              </button>
              <p className="cg-hint">
                A arte será aplicada à caneca selecionada. Use o modo “Mover
                arte” para arrastá-la diretamente na peça.
              </p>
              <Section title={t('Arquivo de projeto')} icon={FolderOpen}>
                <button
                  className="cg-secondary"
                  onClick={() =>
                    safe(async () => {
                      await exportPortableProject();
                      notify("Projeto completo baixado com as imagens.");
                    })
                  }
                >
                  Baixar projeto .cgstudio
                </button>
                <label className="cg-file-label">
                  Abrir arquivo de projeto
                  <input
                    type="file"
                    accept=".cgstudio,application/json"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f)
                        safe(async () => {
                          await importPortableProject(f);
                          notify("Projeto aberto.");
                        });
                      e.target.value = "";
                    }}
                  />
                </label>
              </Section>
            </>
          )}
          {tab === "base" && <BaseArtPanel />}
          {tab === "backgrounds" && (
            <>
              <Section
                title="Cenas prontas em 1 clique"
                icon={Sparkles}
                defaultOpen
              >
                <div className="cg-preset-grid">
                  {[
                    {
                      label: "Estúdio branco",
                      bg: {
                        type: "studio-white" as const,
                        floor: "continuo" as const,
                      },
                      light: "suave",
                    },
                    {
                      label: "Estúdio escuro",
                      bg: {
                        type: "studio-dark" as const,
                        floor: "continuo" as const,
                      },
                      light: "dramatico",
                    },
                    {
                      label: "Laranja criativo",
                      bg: {
                        type: "solid" as const,
                        colorA: "#ffb986",
                        floor: "continuo" as const,
                      },
                      light: "quente",
                    },
                    {
                      label: "Fundo transparente",
                      bg: {
                        type: "transparent" as const,
                        floor: "continuo" as const,
                      },
                      light: "suave",
                    },
                  ].map((scene) => (
                    <button
                      key={scene.label}
                      type="button"
                      onClick={() => {
                        st.patch("bg", { ...scene.bg, imageId: null });
                        const found = LIGHT_PRESETS.find(
                          (l) => l.id === scene.light,
                        );
                        if (found) st.patch("light", { preset: found.id });
                      }}
                    >
                      {scene.label}
                    </button>
                  ))}
                </div>
              </Section>
              <PremiumBackgrounds notify={notify} />
              <ScenePanel />
              <ShadowPresets />
            </>
          )}
          {tab === "models" && (
            <>
              <Section title={t('Acabamento rápido da caneca')} icon={Sparkles} defaultOpen>
                <p className="cg-hint">Troque o material com um toque. Os detalhes completos do verniz continuam em Propriedades.</p>
                <div className="cg-finish-presets" role="group" aria-label="Acabamentos da caneca">
                  {CERAMIC_FINISHES.map(finish=><button key={finish.id} type="button"
                    title={finish.description} disabled={!!selected?.locked}
                    aria-pressed={!!selected&&Object.entries(finish.values).every(([k,v])=>Math.abs((selected[k as keyof typeof finish.values] as number ?? NaN)-v)<0.001)}
                    onClick={()=>st.patchObject(active,finish.values)}>{finish.label}</button>)}
                </div>
              </Section>
              <PoseControls />
              <p className="cg-hint">
                Escolha a forma da peça selecionada. A arte acompanha a mudança.
              </p>
              <HandleControls active={active} />
              <CeramicPalette active={active} />
              <button type="button" className="cg-secondary" onClick={() => {setShowProperties(true);setDrawer("properties");setStageFocus(false);requestAnimationFrame(()=>document.getElementById("cg-finish-section")?.scrollIntoView({block:"start",behavior:"smooth"}));}}>Abrir acabamento e verniz profissional</button>
              <Section title={t('Cores prontas')} icon={Palette} defaultOpen>
                <div className="cg-preset-grid">
                  {[
                    {
                      label: "Branca clássica",
                      patch: {
                        variant: "white" as const,
                        bodyColor: "#ffffff",
                        handleColor: "#ffffff",
                        interiorColor: "#ffffff",
                        roughness: 0.08,
                      },
                    },
                    {
                      label: "Alça colorida",
                      patch: {
                        variant: "accent" as const,
                        bodyColor: "#ffffff",
                        handleColor: "#e44837",
                        interiorColor: "#e44837",
                        accentColor: "#e44837",
                      },
                    },
                    {
                      label: "Toda colorida",
                      patch: {
                        variant: "accent" as const,
                        bodyColor: "#325aaf",
                        handleColor: "#325aaf",
                        interiorColor: "#325aaf",
                        accentColor: "#325aaf",
                      },
                    },
                    {
                      label: "Preta fosca",
                      patch: {
                        variant: "accent" as const,
                        bodyColor: "#202024",
                        handleColor: "#202024",
                        interiorColor: "#202024",
                        roughness: 0.68,
                      },
                    },
                    {
                      label: "Mágica",
                      patch: {
                        variant: "magic" as const,
                        bodyColor: "#18181b",
                        handleColor: "#121216",
                        interiorColor: "#121216",
                        magicHeat: 0.2,
                      },
                    },
                  ].map((v) => (
                    <button
                      key={v.label}
                      type="button"
                      onClick={() => st.patchObject(active, v.patch)}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </Section>
              <div className="cg-model-grid">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    className={selected?.model === m.id ? "is-active" : ""}
                    onClick={() => st.patchObject(active, { model: m.id })}
                  >
                    <Coffee
                      style={{
                        transform: m.id === "tea" ? "scale(1.25,.8)" : "none",
                      }}
                    />
                    <strong>{m.label}</strong>
                    <small>{m.desc}</small>
                    {selected?.model === m.id && (
                      <Check className="cg-model-check" />
                    )}
                  </button>
                ))}
              </div>
              <Section title={t('Bases de apoio')} icon={Layers} defaultOpen>
                <div className="cg-pills">
                  {FLOOR_OPTIONS.map((f) => (
                    <button
                      key={f.value}
                      className={st.bg.floor === f.value ? "is-active" : ""}
                      onClick={() => st.patch("bg", { floor: f.value })}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </Section>
            </>
          )}
          {tab === "layers" && (
            <>
              <div className="cg-section-line">
                <span>{1 + st.companions.length} objetos</span>
                <button
                  onClick={() => {
                    st.duplicateSelected();
                  }}
                >
                  + Duplicar
                </button>
              </div>
              <p className="cg-hint">
                Shift + clique seleciona várias peças. A ordem de camadas ajusta
                a profundidade real da cena.
              </p>
              <div className="cg-layers">
                {[
                  ...new Set([
                    ...st.layerOrder,
                    "hero",
                    ...st.companions.map((c) => c.id),
                  ]),
                ]
                  .reverse()
                  .map((id) => {
                    const o =
                      id === "hero"
                        ? st.mug
                        : st.companions.find((c) => c.id === id);
                    if (!o) return null;
                    return (
                      <div
                        className={`cg-layer ${st.selectedIds.includes(id) ? "is-active" : ""}`}
                        key={id}
                      >
                        <button
                          className="cg-layer-name"
                          onClick={(e) =>
                            st.select(id, e.shiftKey || e.ctrlKey)
                          }
                        >
                          <Coffee />
                          <span>{o.name || "Caneca"}</span>
                        </button>
                        <ToolButton
                          label={
                            o.hidden ? "Mostrar objeto" : "Esconder objeto"
                          }
                          onClick={() =>
                            st.patchObject(id, { hidden: !o.hidden })
                          }
                        >
                          {o.hidden ? <EyeOff /> : <Eye />}
                        </ToolButton>
                        <ToolButton
                          label={
                            o.locked ? "Destravar objeto" : "Travar objeto"
                          }
                          onClick={() =>
                            st.patchObject(id, { locked: !o.locked })
                          }
                        >
                          {o.locked ? <Lock /> : <Unlock />}
                        </ToolButton>
                        <div className="cg-layer-order">
                          <button
                            aria-label="Trazer para frente"
                            onClick={() => st.reorderLayer(id, 1)}
                          >
                            <ChevronUp />
                          </button>
                          <button
                            aria-label="Enviar para trás"
                            onClick={() => st.reorderLayer(id, -1)}
                          >
                            <ChevronDown />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div className="cg-pills">
                <button onClick={() => st.alignSelected("left")}>
                  Esquerda
                </button>
                <button onClick={() => st.alignSelected("center")}>
                  Centro
                </button>
                <button onClick={() => st.alignSelected("right")}>
                  Direita
                </button>
                <button onClick={() => st.alignSelected("distribute")}>
                  Distribuir
                </button>
              </div>
            </>
          )}
          {tab === "light" && (
            <>
              <LightPanel />
              <HDRIPanel />
            </>
          )}
          {tab === "camera" && <CameraPanel />}
          {tab === "compose" && <MultiMugPanel />}
          {tab === "effects" && (
            <>
              <FXPanel />
              <Section
                title="Meus presets (neste navegador)"
                icon={Save}
                defaultOpen
              >
                <button
                  className="cg-secondary"
                  onClick={() => {
                    try {
                      const current = {
                        mug: st.mug,
                        light: st.light,
                        bg: st.bg,
                        fx: st.fx,
                      };
                      localStorage.setItem(
                        "cg_studio_preset",
                        JSON.stringify(current),
                      );
                      notify("Configuração salva neste navegador.");
                    } catch {
                      notify(
                        "Não foi possível salvar. Verifique o espaço disponível.",
                      );
                    }
                  }}
                >
                  Salvar minha configuração
                </button>
                <button
                  className="cg-secondary"
                  onClick={() => {
                    try {
                      const stored = localStorage.getItem("cg_studio_preset");
                      if (!stored) {
                        notify("Nenhum preset salvo ainda.");
                        return;
                      }
                      const parsed = JSON.parse(stored);
                      if (parsed.mug) st.patch("mug", parsed.mug);
                      if (parsed.light) st.patch("light", parsed.light);
                      if (parsed.bg) st.patch("bg", parsed.bg);
                      if (parsed.fx) st.patch("fx", parsed.fx);
                      notify("Meu preset aplicado.");
                    } catch {
                      notify("Este preset não pôde ser aberto.");
                    }
                  }}
                >
                  Aplicar meu preset salvo
                </button>
              </Section>
            </>
          )}
          {tab === "scene" && (
            <>
              <PremiumBackgrounds notify={notify} />
              <ScenePanel />
            </>
          )}
        </aside>
        <main className="cg-canvas" aria-label="Canvas 3D">
          <div className="cg-canvas-toolbar">
            <div className="cg-stage-toolbar-actions">
            <ToolButton label={stageFocus ? "Mostrar painéis" : "Ampliar palco 3D"} onClick={() => {setStageFocus(v=>!v);setDrawer(null);}}>{stageFocus ? <Shrink /> : <Expand />}</ToolButton>
            <ToolButton label={showProperties ? "Ocultar ajustes finos" : "Mostrar ajustes finos"} onClick={() => {setStageFocus(false);setShowProperties(v=>!v);setDrawer(showProperties ? null : "properties");}}>{showProperties ? <PanelRightClose /> : <PanelRightOpen />}</ToolButton>
            <ToolButton label="Ajustar Bocão (arte da base)" onClick={() => {setStageFocus(false);setTab("base");setDrawer("library");}} active={tab === "base"}><CircleArrowUp /></ToolButton>
            </div>
            <span className="cg-divider" />
            {(
              [
                { id: "select", label: "Selecionar · V", icon: MousePointer2 },
                { id: "move", label: "Mover · G", icon: Move },
                { id: "rotate", label: "Girar e inclinar à mão livre · E", icon: Rotate3D },
                { id: "scale", label: "Escalar · S", icon: Scaling },
                { id: "art", label: "Mover arte · A", icon: ImagePlus },
                { id: "pan", label: "Navegar · H", icon: Hand },
              ] as const
            ).map((t) => (
              <ToolButton
                key={t.id}
                label={t.label}
                onClick={() => { if (t.id === "rotate" || t.id === "move") st.patch("camera", {autoRotate:false}); st.setTool(t.id); }}
                active={st.tool === t.id}
              >
                <t.icon />
              </ToolButton>
            ))}
            <span className="cg-divider" />
            <ToolButton
              label="Duplicar · Ctrl+D"
              onClick={st.duplicateSelected}
            >
              <Copy />
            </ToolButton>
            <ToolButton label="Apagar · Delete" onClick={st.deleteSelected}>
              <Trash2 />
            </ToolButton>
          </div>
          <div className="cg-viewport">{viewport}</div>
          <PieceSwitcher onUpload={onUpload} />
          {(st.tool === "move" || st.tool === "rotate" || st.tool === "art") && <div className="cg-tool-hint" role="status">
            {st.tool === "move" ? <><Move /><span>Arraste a caneca para posicionar.<small>Use a seta vertical para altura · Alt: sem encaixe · Esc: cancelar</small></span></> :
              st.tool === "rotate" ? <><Rotate3D /><span>Girar e inclinar livremente: arraste sobre a caneca.<small>Alt + arrastar: eixo lateral · Shift: precisão · Esc: cancelar</small></span></> :
              <><ImagePlus /><span>Arraste sobre a caneca para mover a estampa.<small>Para mover a peça, use G.</small></span></>}
          </div>}
          <div className="cg-canvas-label">
            <span className="cg-live-dot" />
            PRÉVIA 3D EM TEMPO REAL
          </div>
          <details className="cg-scene-presets">
            <summary>
              <Layers /> Composição rápida
            </summary>
            <div>
              {(
                [
                  ["solo", "1 peça"],
                  ["pair", "Par"],
                  ["trio", "Trio"],
                  ["row", "Fileira"],
                  ["fan", "Leque"],
                  ["stack", "Empilhadas"],
                  ["gift", "Kit presente"],
                ] as const
              ).map(([id, name]) => (
                <button key={id} onClick={() => st.compose(id)}>
                  {name}
                </button>
              ))}
            </div>
          </details>
          <QuickCameraBar />
          {notice && (
            <div className="cg-notice" role="status">
              {notice}
            </div>
          )}
        </main>
        <aside
          className={`cg-properties cg-panel ${drawer === "properties" ? "cg-drawer-open" : ""}`}
          aria-label="Propriedades da caneca selecionada"
        >
          <div className="cg-panel-heading">
            <div>
              <small>
                {st.selectedIds.length > 1
                  ? `${st.selectedIds.length} PEÇAS SELECIONADAS`
                  : "PROPRIEDADES"}
              </small>
              <h2>{selected?.name || "Selecione uma peça"}</h2>
            </div>
            <button
              className="cg-mobile-close cg-icon"
              aria-label="Fechar propriedades"
              onClick={() => setDrawer(null)}
            >
              <X />
            </button>
          </div>
          {selected ? (
            <>
              {selected.locked && <div className="cg-locked-message"><Lock /><span>Esta peça está travada.</span><button type="button" onClick={() => st.patchObject(active, { locked: false })}>Destravar</button></div>}
              <div id="cg-art-section"><p className="cg-hint">Ajustes profissionais da peça. Para o básico, use as abas Produto, Estampa e Bocão.</p></div>
              <ArtAssistant active={active} art={art} locked={!!selected.locked} onNotice={notify} />
              {tab !== "models" && <HandleControls active={active} />}
              <Section title={t('Poses prontas')} icon={Move} defaultOpen>
                <div className="cg-pills">
                  {[
                    ["Em pé", 0, 0],
                    ["Deitada", 90, 0],
                    ["Invertida", 180, 0],
                    ["Inclinada", 20, 25],
                  ].map(([name, x, z]) => (
                    <button
                      key={name}
                      disabled={!!selected.locked}
                      onClick={() =>
                        st.patchObject(active, {
                          tiltX: Number(x),
                          tiltZ: Number(z),
                        })
                      }
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <ToggleRow
                  label="Encaixe magnético"
                  checked={st.snapEnabled}
                  onChange={st.setSnap}
                />
                <ToggleRow
                  label="Travar objeto"
                  checked={!!selected.locked}
                  onChange={(locked) => st.patchObject(active, { locked })}
                />
              </Section>
              <Section title={t('Avançado (Modo Manual)')} icon={SlidersHorizontal}>
                <div className="cg-numeric-grid">
                  {(
                    [
                      "posX",
                      "posY",
                      "posZ",
                      "tiltX",
                      "rotationY",
                      "tiltZ",
                      "scale",
                    ] as const
                  ).map((k, i) => (
                    <label key={k}>
                      {
                        [
                          "Posição X",
                          "Altura Y",
                          "Profundidade Z",
                          "Rotação X",
                          "Rotação Y",
                          "Rotação Z",
                          "Escala",
                        ][i]
                      }
                      <input
                        aria-label={
                          [
                            "Posição X",
                            "Altura Y",
                            "Profundidade Z",
                            "Rotação X",
                            "Rotação Y",
                            "Rotação Z",
                            "Escala",
                          ][i]
                        }
                        type="number"
                        disabled={!!selected.locked}
                        step={k === "scale" ? 0.05 : 0.5}
                        value={Number(
                          (selected[k] ?? (k === "scale" ? 1 : 0)).toFixed(2),
                        )}
                        onChange={(e) => {
                          if (Number.isFinite(e.target.valueAsNumber))
                            st.patchObject(active, {
                              [k]: e.target.valueAsNumber,
                            });
                        }}
                      />
                    </label>
                  ))}
                </div>
              </Section>
              <div id="cg-finish-section"><Section title={t('Cerâmica e acabamento')} icon={Coffee} defaultOpen>
                <ColorRow
                  label="Cor do corpo"
                  disabled={!!selected.locked}
                  value={selected.bodyColor ?? "#ffffff"}
                  onChange={(bodyColor) =>
                    st.patchObject(active, { bodyColor })
                  }
                />
                <ColorRow
                  label="Cor da base"
                  disabled={!!selected.locked}
                  value={selected.baseColor ?? selected.bodyColor ?? "#ffffff"}
                  onChange={(baseColor) =>
                    st.patchObject(active, { baseColor })
                  }
                />
                <ColorRow
                  label="Cor do interior"
                  disabled={!!selected.locked}
                  value={selected.interiorColor ?? "#ffffff"}
                  onChange={(interiorColor) =>
                    st.patchObject(active, { interiorColor })
                  }
                />
                <ColorRow
                  label="Cor da alça"
                  disabled={!!selected.locked}
                  value={selected.handleColor ?? "#ffffff"}
                  onChange={(handleColor) =>
                    st.patchObject(active, { handleColor })
                  }
                />
                <CeramicFinishControls
                  mug={selected}
                  disabled={selected.locked}
                  onChange={(values) => st.patchObject(active, values)}
                  onApplyAll={
                    st.companions.length
                      ? (values) => {
                          st.patchObject("hero", values);
                          for (const c of st.companions)
                            st.patchObject(c.id, values);
                        }
                      : undefined
                  }
                />
                <ToggleRow
                  label="Preservar cor da arte"
                  disabled={!!selected.locked}
                  checked={selected.faithfulColor ?? true}
                  onChange={(faithfulColor) =>
                    st.patchObject(active, { faithfulColor })
                  }
                />
                <div className="cg-pills">
                  {(["white", "accent", "magic"] as const).map((v, i) => (
                    <button
                      key={v}
                      disabled={!!selected.locked}
                      className={selected.variant === v ? "is-active" : ""}
                      onClick={() => st.patchObject(active, { variant: v })}
                    >
                      {["Branca", "Colorida", "Mágica"][i]}
                    </button>
                  ))}
                </div>
                {selected.variant === "magic" && (
                  <>
                    <SliderRow
                      label="Revelação térmica"
                      disabled={!!selected.locked}
                      value={selected.magicHeat}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(magicHeat) =>
                        st.patchObject(active, { magicHeat })
                      }
                    />
                    {active === "hero" && <MugPanel />}
                  </>
                )}
              </Section></div>
              <Section title={t('Ajustes de cor da arte')} icon={ImagePlus}>
                <p className="cg-quick-hint">Ajusta a imagem aplicada. Para brilho da superfície, use Verniz de estúdio.</p>
                {st.compareArt && <button type="button" className="cg-compare-banner" onClick={() => st.setCompare(false)}>Você está vendo a arte sem filtros. Voltar aos ajustes <ArrowLeft /></button>}
                {(
                  [
                    "brightness",
                    "contrast",
                    "saturation",
                    "vibrance",
                    "temperature",
                    "sharpness",
                    "opacity",
                  ] as const
                ).map((k, i) => (
                  <SliderRow
                    key={k}
                    label={
                      [
                        "Luminosidade da arte",
                        "Contraste",
                        "Saturação",
                        "Vibração",
                        "Temperatura",
                        "Nitidez",
                        "Opacidade",
                      ][i]
                    }
                    min={k === "sharpness" || k === "opacity" ? 0 : -1}
                    max={1}
                    step={0.01}
                    value={art[k] ?? (k === "opacity" ? 1 : 0)}
                    defaultValue={k === "opacity" ? 1 : 0}
                    disabled={!!selected.locked}
                    format={v => k === "opacity" || k === "sharpness" ? `${Math.round(v * 100)}%` : `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`}
                    onChange={(v) => patchArt({ [k]: v })}
                  />
                ))}
                <SliderRow
                  label="Sangria (cm)"
                  min={0}
                  max={0.5}
                  step={0.01}
                  value={art.bleed ?? 0}
                  defaultValue={0}
                  disabled={!!selected.locked}
                  onChange={(bleed) => patchArt({ bleed })}
                />
                <div className="cg-pills">
                  <button disabled={!!selected.locked} onClick={() => patchArt(NEUTRAL_ADJUSTMENTS)}>
                    Resetar ajustes
                  </button>
                  <button
                    aria-pressed={st.compareArt}
                    onClick={() => st.setCompare(!st.compareArt)}
                  >
                    {st.compareArt ? "Voltar ao depois" : "Ver antes"}
                  </button>
                </div>
              </Section>
              <Section title={t('Mais opções da arte')} icon={ImagePlus}>
                <PrintLayersPanel />
                <ArtPanel onUpload={onUpload} />
              </Section>
            </>
          ) : (
            <p className="cg-hint">Clique em uma caneca ou abra Camadas.</p>
          )}
        </aside>
      </div>
      {searchOpen && (
        <div
          className="cg-search-popover"
          role="dialog"
          aria-label="Buscar ajustes"
        >
          <div className="cg-search-head">
            <Search />
            <input
              autoFocus
              placeholder="Buscar ajustes: sombra, arte, giro, caneca..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              onClick={() => setSearchOpen(false)}
              aria-label="Fechar busca"
            >
              <X />
            </button>
          </div>
          <div className="cg-search-results">
            {NAV.filter(
              (n) =>
                !query ||
                n.label.toLowerCase().includes(query.toLowerCase()) ||
                (
                  {
                    arts: "estampa upload encaixe impressão",
                    base: "bocão boca arte inferior fundo girar alinhar base",
                    models: "caneca cor cerâmica alça interior",
                    backgrounds: "fundo cenário superfície",
                    light: "sombra iluminação hdri",
                    camera: "giro rotação movimento",
                    compose: "duo trio grupo",
                    effects: "cor brilho look",
                    layers: "objeto camada",
                  }[n.id] || ""
                ).includes(query.toLowerCase()),
            ).map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if ("advanced" in n) setAdvanced(true);
                  setStageFocus(false);
                  setTab(n.id);
                  setDrawer("library");
                  setSearchOpen(false);
                  setQuery("");
                }}
              >
                <n.icon /> {t(n.label)}
              </button>
            ))}
          </div>
        </div>
      )}
      {resetOpen && (
        <div className="cg-modal-scrim" role="presentation">
          <div
            className="cg-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cg-reset-title"
          >
            <span className="cg-confirm-icon">
              <RotateCcw />
            </span>
            <h2 id="cg-reset-title">Voltar tudo ao padrão?</h2>
            <p>
              A caneca, a arte, a cena, a luz, a câmera e os efeitos voltam ao
              início. Seus projetos salvos não serão apagados.
            </p>
            <label>
              <input
                type="checkbox"
                checked={keepArt}
                onChange={(e) => setKeepArt(e.target.checked)}
              />{" "}
              Manter a arte que enviei
            </label>
            <div className="cg-confirm-actions">
              <button onClick={() => setResetOpen(false)}>Cancelar</button>
              <button
                className="is-danger"
                onClick={() => {
                  st.resetAll(keepArt);
                  setResetOpen(false);
                  setKeepArt(false);
                  setResetNotice(true);
                  window.setTimeout(() => setResetNotice(false), 8000);
                }}
              >
                Resetar tudo
              </button>
            </div>
          </div>
        </div>
      )}
      {resetNotice && (
        <div className="cg-reset-toast" role="status">
          Tudo resetado{" "}
          <button
            onClick={() => {
              st.undo();
              setResetNotice(false);
            }}
          >
            Desfazer
          </button>
        </div>
      )}
      <footer className="cg-statusbar">
        <OutputFormatControl />
        <div className="cg-status-tools" role="group" aria-label="Controles essenciais do Studio">
          <button type="button" aria-pressed={st.tool === "move"} title="Arrastar e posicionar a caneca (tecla G)" onClick={()=>st.setTool(st.tool === "move" ? "select" : "move")}><Move /> {t('Mover caneca')}</button>
          <button type="button" aria-pressed={st.tool === "pan"} title="Deslocar o cenário sem mover a caneca" onClick={()=>st.setTool(st.tool === "pan" ? "select" : "pan")}><Hand /> {t('Mover cenário')}</button>
          <button type="button" title="Abrir os ajustes de iluminação e sombra" onClick={()=>{setTab("light");setStageFocus(false);setDrawer("library");}}><Sun /> {t('Luz/sombra')}</button>
          <button type="button" title="Resetar ajustes, com confirmação" onClick={()=>setResetOpen(true)}><RotateCcw /> {t('Resetar')}</button>
        </div>
        <button
          onClick={() =>
            st.patch("camera", { autoRotate: !st.camera.autoRotate })
          }
        >
          {st.camera.autoRotate ? <Pause /> : <Play />}
          {t(st.camera.autoRotate ? 'Pausar giro' : 'Girar 360°')}
        </button>
        <button type="button" className="cg-guide-status" onClick={() => setGuideOpen(true)}><BookOpen /> Guia do Studio</button>
        <span className="cg-shortcuts">
          G: mover caneca · Shift + clique: seleção múltipla · Ctrl+D: duplicar ·
          Ctrl+Z: desfazer
        </span>
        <div>
          <ToolButton
            label="Guias"
            active={st.showGuides}
            onClick={() => st.setShowGuides(!st.showGuides)}
          >
            <Grid3X3 />
          </ToolButton>
          <button
            className="cg-mobile-properties"
            onClick={() => setDrawer("properties")}
          >
            <Settings2 />
            Propriedades
          </button>
          <button
            onClick={() =>
              document.querySelector(".cg-workspace")?.requestFullscreen?.()
            }
            aria-label="Tela cheia"
          >
            <Maximize />
          </button>
        </div>
      </footer>
      <StudioGuide open={guideOpen} onOpenChange={setGuideOpen} onAction={openGuideAction} onShortcuts={onShortcuts} />
      {conciergeOpen&&<StudioConcierge area="studio" onClose={()=>setConciergeOpen(false)} onAction={a=>{
        if(a==='guides'){st.setShowGuides(true);return true;}
        if(a==='export'){st.setExportOpen(true);return true;}
        const areas:Record<string,Tab>={arts:'arts',base:'base',models:'models',light:'light',camera:'camera',effects:'effects',compose:'compose',backgrounds:'backgrounds'};
        const matched=areas[a];
        if(matched){setTab(matched);setAdvanced(true);setStageFocus(false);setDrawer('library');return true;}
        return false;
      }}/>}

    </div>
  );
}
function ArtPreview({ art }: { art: ArtState }) {
  const entry = getArtImage(art.imageId);
  const [url, setUrl] = useState("");
  ReactUseEffect(() => {
    let alive = true;
    import("../lib/art-registry").then(async (m) => {
      const blob = await m.getArtBlob(art.imageId);
      if (blob && alive) {
        const u = URL.createObjectURL(blob);
        setUrl(u);
      }
    });
    return () => {
      alive = false;
    };
  }, [art.imageId]);
  ReactUseEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  return url ? (
    <img src={url} alt="Arte original selecionada" />
  ) : (
    <div className="cg-art-placeholder">
      <ImagePlus />
    </div>
  );
}
