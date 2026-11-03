"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DEFAULT_SURFACE,
  type CatalogItem,
  type CatalogKind,
  type Surface,
} from "@/lib/mockup-scenes/types";
import { SurfacePreparer } from "@/components/tools/mockup-scenes/surface-preparer";
import "@/components/tools/mockup-scenes/scenes.css";

export function ScenesPanel({
  refreshKey,
  onUnauthorized,
}: {
  refreshKey: number;
  onUnauthorized: () => void;
}) {
  const [kind, setKind] = useState<CatalogKind>("background"),
    [items, setItems] = useState<CatalogItem[]>([]),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    [pages, setPages] = useState(0),
    [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [version, setVersion] = useState(0),
    [editing, setEditing] = useState<CatalogItem | "new" | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    setBusy(true);
    setError("");
    const timer = setTimeout(
      () =>
        fetch(
          `/api/admin/mockup-scenes?${new URLSearchParams({ kind, q, status, page: String(page) })}`,
          { cache: "no-store", signal: abort.signal },
        )
          .then(async (r) => {
            if (r.status === 401) {
              onUnauthorized();
              return null;
            }
            const d = await r.json();
            if (!r.ok) throw new Error(d.error);
            return d;
          })
          .then((d) => {
            if (abort.signal.aborted) return;
            if (d) {
              setItems(d.items);
              setPages(d.pages);
              setTotal(d.total);
            }
          })
          .catch((e) => {
            if (!abort.signal.aborted) setError(e.message);
          })
          .finally(() => {
            if (!abort.signal.aborted) setBusy(false);
          }),
      180,
    );
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [kind, q, status, page, version, refreshKey, onUnauthorized]);
  return (
    <div className="ad-scenes">
      <div className="ad-page-intro">
        <div>
          <span className="ad-eyebrow">MOCKUP DE CENÁRIOS · CATÁLOGO</span>
          <h1>Um novo cenário para cada ideia.</h1>
          <p>
            Organize fundos sazonais e modelos estáticos. Publique quando
            estiverem prontos.
          </p>
        </div>
        <a
          href="/mockup-cenarios/editor"
          target="_blank"
          rel="noopener noreferrer"
          className="ad-scene-link"
        >
          <ExternalLink size={15} />
          Abrir editor de cenários
        </a>
      </div>
      <div className="ad-scene-tabs">
        <button
          aria-pressed={kind === "background"}
          onClick={() => {
            setKind("background");
            setPage(1);
            setQ("");
          }}
        >
          <ImageIcon size={17} />
          Cenários e fundos
        </button>
        <button
          aria-pressed={kind === "model"}
          onClick={() => {
            setKind("model");
            setPage(1);
            setQ("");
          }}
        >
          <Coffee size={17} />
          Modelos de caneca
        </button>
      </div>
      <div className="ad-scene-info">
        {kind === "background"
          ? "Envie fundos novos para Natal, Dia das Mães, Páscoa e qualquer outra coleção. Os modelos de caneca são cadastrados na outra seção."
          : "Envie a caneca sem estampa e com fundo transparente. Prepare a área de impressão e confira o resultado antes de publicar."}
      </div>
      <div className="ad-scene-toolbar">
        <div>
          <Search size={16} />
          <input
            aria-label="Buscar itens do catálogo"
            placeholder="Buscar por nome, categoria ou tag"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          aria-label="Status dos itens"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos os status</option>
          <option value="draft">Rascunhos</option>
          <option value="published">Publicados</option>
          <option value="archived">Arquivados</option>
        </select>
        <button className="ad-scene-add" onClick={() => setEditing("new")}>
          <Plus size={16} />
          {kind === "background" ? "Novo cenário" : "Novo modelo"}
        </button>
      </div>
      <p className="ad-scene-count">
        {total} {kind === "background" ? "cenários" : "modelos"} cadastrados no
        painel · 24 por página
      </p>
      {busy ? (
        <div className="ad-state">
          <Loader2 className="ad-spin" />
          Carregando catálogo…
        </div>
      ) : error ? (
        <div className="ad-error-banner" role="alert">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="ad-state">
          <ImageIcon size={30} />
          <h2>
            {q || status
              ? "Nenhum resultado"
              : "Sua próxima coleção começa aqui."}
          </h2>
          <p>
            {q || status
              ? "Ajuste a busca ou o filtro."
              : "Os modelos e fundos incluídos já estão disponíveis no editor. Adicione os seus aqui."}
          </p>
        </div>
      ) : (
        <div className="ad-scene-grid">
          {items.map((item) => (
            <button key={item.id} onClick={() => setEditing(item)}>
              <div className="ad-scene-thumb">
                <img
                  src={`${item.imageUrl}?thumb=1`}
                  alt={item.name}
                  loading="lazy"
                />
                <span className={`ad-scene-status ad-scene-${item.status}`}>
                  {item.status === "draft"
                    ? "Rascunho"
                    : item.status === "published"
                      ? "Publicado"
                      : "Arquivado"}
                </span>
              </div>
              <div>
                <small>{item.category}</small>
                <strong>{item.name}</strong>
                <span>
                  {item.width} × {item.height} px · Editar →
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
      {pages > 1 && (
        <div className="ad-scene-pages">
          <button
            aria-label="Página anterior"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft size={17} />
          </button>
          <span>
            {page} / {pages}
          </span>
          <button
            aria-label="Próxima página"
            disabled={page === pages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      )}
      {editing && (
        <CatalogForm
          key={typeof editing === "string" ? `new-${kind}` : editing.id}
          kind={kind}
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setVersion((v) => v + 1);
          }}
          onUnauthorized={onUnauthorized}
        />
      )}
    </div>
  );
}

function CatalogForm({
  kind,
  item,
  onClose,
  onSaved,
  onUnauthorized,
}: {
  kind: CatalogKind;
  item: CatalogItem | null;
  onClose: () => void;
  onSaved: () => void;
  onUnauthorized: () => void;
}) {
  const [name, setName] = useState(item?.name ?? ""),
    [category, setCategory] = useState(item?.category ?? ""),
    [tags, setTags] = useState(item?.tags.join(", ") ?? ""),
    [status, setStatus] = useState(item?.status ?? "draft");
  const [file, setFile] = useState<File | null>(null),
    [src, setSrc] = useState(item?.imageUrl ?? ""),
    [size, setSize] = useState([item?.width ?? 1, item?.height ?? 1]);
  const [surface, setSurface] = useState<Surface>(
      item?.surface ?? DEFAULT_SURFACE,
    ),
    [reviewed, setReviewed] = useState(!!item?.surface),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null),
    fileUrl = useRef<string | null>(null);
  const reviewedCallback = useCallback(() => setReviewed(true), []);
  useEffect(
    () => () => {
      if (fileUrl.current) URL.revokeObjectURL(fileUrl.current);
    },
    [],
  );
  async function choose(file: File | undefined) {
    if (!file) return;
    setError("");
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 4 * 1024 * 1024
    ) {
      setError("Envie PNG, JPEG ou WebP de até 4 MB.");
      return;
    }
    const url = URL.createObjectURL(file),
      im = new Image();
    im.onload = () => {
      if (
        im.width < 1000 ||
        im.height < 1000 ||
        im.width * im.height > 36_000_000
      ) {
        URL.revokeObjectURL(url);
        setError(
          "Use uma imagem com pelo menos 1000 px em cada lado e até 36 megapixels.",
        );
        return;
      }
      if (fileUrl.current) URL.revokeObjectURL(fileUrl.current);
      fileUrl.current = url;
      setFile(file);
      setSrc(url);
      setSize([im.width, im.height]);
      setReviewed(false);
      if (!name) setName(file.name.replace(/\.[^.]+$/, "").slice(0, 90));
    };
    im.onerror = () => {
      URL.revokeObjectURL(url);
      setError("O arquivo não pôde ser aberto.");
    };
    im.src = url;
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (!item && !file) {
      setError("Escolha a imagem do cadastro.");
      return;
    }
    if (kind === "model" && status === "published" && !reviewed) {
      setError(
        "Abra Conferir estampa para validar o encaixe antes de publicar.",
      );
      return;
    }
    setBusy(true);
    try {
      const metadata = {
        name,
        category,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status,
        surface: kind === "model" ? surface : null,
      };
      let body: FormData | string, headers: Record<string, string> | undefined;
      if (item) {
        body = JSON.stringify(metadata);
        headers = { "Content-Type": "application/json" };
      } else {
        const form = new FormData();
        form.set("kind", kind);
        form.set("metadata", JSON.stringify(metadata));
        form.set("image", file!);
        body = form;
      }
      const r = await fetch(
        `/api/admin/mockup-scenes${item ? `/${item.id}` : ""}`,
        { method: item ? "PUT" : "POST", headers, body },
      );
      if (r.status === 401) {
        onUnauthorized();
        return;
      }
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !busy) onClose();
      }}
    >
      <DialogContent className="sc-scope sc-catalog-form">
        <DialogHeader>
          <span className="sc-eyebrow">
            CATÁLOGO · {kind === "model" ? "MODELO ESTÁTICO" : "CENÁRIO"}
          </span>
          <DialogTitle>
            {item
              ? "Editar"
              : kind === "model"
                ? "Preparar novo modelo"
                : "Adicionar novo cenário"}
          </DialogTitle>
          <DialogDescription>
            {kind === "model"
              ? "Uma foto preparada recebe a arte com perspectiva e curvatura."
              : "Publique novos fundos e coleções sem alterar o Studio 3D."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save}>
          <div className="sc-catalog-form-body">
            <div>
              {!item && (
                <>
                  <button
                    type="button"
                    className="sc-upload"
                    onClick={() => input.current?.click()}
                  >
                    <Upload size={22} />
                    {file ? file.name : "Selecionar imagem"}
                    <small>
                      {kind === "model"
                        ? "Caneca recortada · PNG ou WebP transparente"
                        : "Cenário · PNG, JPEG ou WebP"}{" "}
                      · até 4 MB
                    </small>
                  </button>
                  <input
                    ref={input}
                    hidden
                    type="file"
                    accept={
                      kind === "model"
                        ? "image/png,image/webp"
                        : "image/png,image/jpeg,image/webp"
                    }
                    onChange={(e) => {
                      void choose(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </>
              )}
              {src &&
                (kind === "model" ? (
                  <SurfacePreparer
                    src={src}
                    width={size[0]}
                    height={size[1]}
                    value={surface}
                    onChange={(s) => {
                      setSurface(s);
                      setReviewed(false);
                    }}
                    onReviewed={reviewedCallback}
                  />
                ) : (
                  <img
                    className="sc-catalog-form-image"
                    src={src}
                    alt="Prévia do cenário a cadastrar"
                  />
                ))}
            </div>
            <div className="sc-catalog-form-fields">
              <label>
                Nome do {kind === "model" ? "modelo" : "cenário"}
                <input
                  required
                  minLength={2}
                  maxLength={90}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    kind === "model"
                      ? "Porcelana · alça coração"
                      : "Natal · mesa natural"
                  }
                />
              </label>
              <label>
                Categoria ou coleção
                <input
                  required
                  minLength={2}
                  maxLength={60}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex.: Natal, Dia das Mães, Porcelana"
                />
              </label>
              <label>
                Tags, separadas por vírgula
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="natal, madeira, aconchegante"
                  maxLength={420}
                />
              </label>
              <label>
                Visibilidade
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                >
                  <option value="draft">Rascunho · só no admin</option>
                  <option value="published">
                    Publicado · disponível no editor
                  </option>
                  <option value="archived">Arquivado · fora do catálogo</option>
                </select>
              </label>
              <p className="sc-muted">
                {status === "published"
                  ? "O item ficará disponível no Mockup de Cenários."
                  : "O item não aparece para os usuários."}
              </p>
              {kind === "model" && (
                <p className="sc-review-state">
                  {reviewed ? (
                    <>
                      <Check size={14} />
                      Prévia da estampa conferida
                    </>
                  ) : (
                    <>
                      <EyeIcon />
                      Confira a estampa antes de publicar
                    </>
                  )}
                </p>
              )}
              <p className="sc-muted">
                Recomendamos imagens com 2000 px ou mais. A resolução da origem
                define os detalhes disponíveis na exportação.
              </p>
              {error && (
                <p className="sc-form-error" role="alert">
                  {error}
                </p>
              )}
              <button className="sc-primary" disabled={busy}>
                {busy ? (
                  <Loader2 size={16} className="sc-spin" />
                ) : (
                  <Check size={16} />
                )}
                Salvar {status === "published" ? "e publicar" : "cadastro"}
              </button>
              <button
                className="sc-secondary"
                type="button"
                disabled={busy}
                onClick={onClose}
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function EyeIcon() {
  return <ImageIcon size={14} />;
}
