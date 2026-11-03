"use client";
import { useEffect, useState } from "react";
import { Download, Eye, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { SceneDocument, SceneModel } from "@/lib/mockup-scenes/types";
import { exportScene } from "@/lib/mockup-scenes/render";

export function SceneExportDialog({
  doc,
  models,
  onClose,
}: {
  doc: SceneDocument;
  models: SceneModel[];
  onClose: () => void;
}) {
  const [edge, setEdge] = useState(3000),
    [format, setFormat] = useState<"png" | "jpeg">("png"),
    [transparent, setTransparent] = useState(false);
  const [result, setResult] = useState<
      (Awaited<ReturnType<typeof exportScene>> & { url: string }) | null
    >(null),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false,
      url: string | undefined;
    setResult(null);
    setBusy(true);
    setError("");
    const timer = setTimeout(() => {
      exportScene(doc, models, edge, format, transparent)
        .then((r) => {
          if (cancelled) return;
          url = URL.createObjectURL(r.blob);
          setResult({ ...r, url });
        })
        .catch((e) => {
          if (!cancelled)
            setError(
              e instanceof Error
                ? e.message
                : "Não foi possível gerar a prévia.",
            );
        })
        .finally(() => {
          if (!cancelled) setBusy(false);
        });
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (url) URL.revokeObjectURL(url);
    };
  }, [doc, models, edge, format, transparent]);
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className="sc-export sc-scope"
        aria-describedby="sc-export-description"
      >
        <DialogHeader>
          <span className="sc-eyebrow">
            <Eye size={14} /> CONFERIR ANTES DE BAIXAR
          </span>
          <DialogTitle>Seu mockup, pronto para sair.</DialogTitle>
          <DialogDescription id="sc-export-description">
            Confira o arquivo final. O download terá exatamente esta imagem.
          </DialogDescription>
        </DialogHeader>
        <div className="sc-export-body">
          <div className="sc-export-preview sc-checker" aria-busy={busy}>
            {busy ? (
              <div className="sc-preview-state">
                <Loader2 className="sc-spin" />
                <span>Preparando a prévia em alta resolução…</span>
              </div>
            ) : error ? (
              <p role="alert">{error}</p>
            ) : (
              result && (
                <img
                  src={result.url}
                  alt="Pré-visualização exata do arquivo que será baixado"
                />
              )
            )}
          </div>
          <div className="sc-export-options">
            <label>
              Formato
              <select
                aria-label="Formato de exportação"
                value={format}
                onChange={(e) => {
                  setFormat(e.target.value as "png" | "jpeg");
                  if (e.target.value === "jpeg") setTransparent(false);
                }}
              >
                <option value="png">PNG · com transparência opcional</option>
                <option value="jpeg">JPEG · fundo preenchido</option>
              </select>
            </label>
            <label>
              Maior lado
              <select
                aria-label="Resolução de exportação"
                value={edge}
                onChange={(e) => setEdge(Number(e.target.value))}
              >
                <option value="2000">2000 px · catálogo</option>
                <option value="3000">3000 px · alta resolução</option>
                <option value="4096">4096 px · máxima resolução</option>
              </select>
            </label>
            <label className="sc-check-label">
              <input
                type="checkbox"
                checked={transparent}
                disabled={format === "jpeg"}
                onChange={(e) => setTransparent(e.target.checked)}
              />
              Fundo transparente
            </label>
            <p className="sc-muted">
              {format === "jpeg"
                ? "O JPEG mantém o cenário escolhido."
                : "Com transparência, apenas as canecas, suas sombras e o logotipo são exportados."}
            </p>
            {result && (
              <div className="sc-file-info">
                <strong>
                  {result.width} × {result.height} px
                </strong>
                <span>
                  {format.toUpperCase()} ·{" "}
                  {(result.blob.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            )}
            <p className="sc-muted">
              A nitidez também depende da resolução da arte e do cenário
              enviados.
            </p>
            <a
              className={`sc-primary ${!result || busy ? "sc-disabled" : ""}`}
              aria-disabled={!result || busy}
              href={result?.url}
              download={result?.filename}
              onClick={(e) => {
                if (!result || busy) e.preventDefault();
              }}
            >
              <Download size={17} />
              Confirmar e baixar
            </a>
            <button className="sc-secondary" onClick={onClose}>
              Voltar aos ajustes
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
