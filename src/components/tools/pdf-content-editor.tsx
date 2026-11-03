"use client";
import { useEffect, useRef, useState } from "react";
import {
  PDFDocument,
  StandardFonts,
  PDFTextField,
  PDFCheckBox,
  PDFDropdown,
  PDFRadioGroup,
  PDFOptionList,
} from "pdf-lib";
import type { PDFPageProxy, TextItem } from "pdfjs-dist/types/src/display/api";
type PageViewport = ReturnType<PDFPageProxy["getViewport"]>;
import { PDF_FONTS, applyPdfEdits, type PdfTextEdit } from "@/lib/pdf-edits";
import { Undo2, Redo2, Plus, Check, Loader2 } from "lucide-react";
type Block = { id: string; item: TextItem };
type Field = { name: string; value: string | boolean; options?: string[] };
const control =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
export function PdfContentEditor({
  bytes,
  onApply,
  onDraftChange,
}: {
  bytes: Uint8Array;
  onApply: (bytes: Uint8Array) => void;
  onDraftChange: (
    edits: PdfTextEdit[],
    fields: Record<string, string | boolean>,
  ) => void;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [viewport, setViewport] = useState<PageViewport | null>(null);
  const [history, setHistory] = useState<PdfTextEdit[][]>([[]]);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState("");
  const [addMode, setAddMode] = useState(false);
  const [fields, setFields] = useState<Field[]>([]);
  const [fieldEdits, setFieldEdits] = useState<
    Record<string, string | boolean>
  >({});
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);
  const edits = history[step];
  useEffect(() => {
    onDraftChange(edits, fieldEdits);
  }, [edits, fieldEdits, onDraftChange]);
  const active = edits.find((e) => e.id === selected);
  const change = (next: PdfTextEdit[]) => {
    setHistory((h) => [...h.slice(0, step + 1), next]);
    setStep(step + 1);
  };
  useEffect(() => {
    let cancelled = false;
    let task:
      | ReturnType<(typeof import("pdfjs-dist"))["getDocument"]>
      | undefined;
    let render: ReturnType<PDFPageProxy["render"]> | undefined;
    setBusy(true);
    setError("");
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        task = pdfjs.getDocument({ data: bytes.slice() });
        const pdf = await task.promise;
        if (cancelled) {
          await task.destroy();
          return;
        }
        setCount(pdf.numPages);
        const page = await pdf.getPage(Math.min(pageIndex + 1, pdf.numPages));
        const vp = page.getViewport({ scale: zoom / 100 });
        const text = await page.getTextContent();
        if (cancelled || !canvas.current) return;
        setBlocks(
          text.items
            .filter(
              (item): item is TextItem => "str" in item && !!item.str.trim(),
            )
            .map((item, i) => ({ id: `${pageIndex}-${i}`, item })),
        );
        setViewport(vp);
        const c = canvas.current;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        c.width = Math.ceil(vp.width * ratio);
        c.height = Math.ceil(vp.height * ratio);
        c.style.width = vp.width + "px";
        c.style.height = vp.height + "px";
        render = page.render({
          canvas: c,
          viewport: vp,
          transform: [ratio, 0, 0, ratio, 0, 0],
        });
        await render.promise;
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Falha na prévia.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
      render?.cancel();
      if (task) void task.destroy();
    };
  }, [bytes, pageIndex, zoom]);
  useEffect(() => {
    let alive = true;
    setHistory([[]]);
    setStep(0);
    setSelected("");
    setFieldEdits({});
    void PDFDocument.load(bytes.slice())
      .then((doc) => {
        const result: Field[] = [];
        for (const f of doc.getForm().getFields()) {
          if (f.isReadOnly()) continue;
          if (f instanceof PDFTextField)
            result.push({ name: f.getName(), value: f.getText() || "" });
          else if (f instanceof PDFCheckBox)
            result.push({ name: f.getName(), value: f.isChecked() });
          else if (f instanceof PDFDropdown || f instanceof PDFOptionList)
            result.push({
              name: f.getName(),
              value: f.getSelected()[0] || "",
              options: f.getOptions(),
            });
          else if (f instanceof PDFRadioGroup)
            result.push({
              name: f.getName(),
              value: f.getSelected() || "",
              options: f.getOptions(),
            });
        }
        if (alive) setFields(result);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [bytes]);
  const choose = (block: Block) => {
    setSelected(block.id);
    if (edits.some((e) => e.id === block.id)) return;
    const t = block.item.transform;
    const size = Math.hypot(t[2], t[3]);
    change([
      ...edits,
      {
        id: block.id,
        page: pageIndex,
        text: block.item.str,
        original: block.item.str,
        x: t[4],
        y: t[5],
        originX: t[4],
        originY: t[5],
        size,
        width: block.item.width,
        height: block.item.height || size,
        angle: (Math.atan2(t[1], t[0]) * 180) / Math.PI,
        originAngle: (Math.atan2(t[1], t[0]) * 180) / Math.PI,
        font: StandardFonts.Helvetica,
        color: "#000000",
        background: "#ffffff",
        cover: true,
      },
    ]);
  };
  const patch = (values: Partial<PdfTextEdit>) => {
    if (active)
      change(edits.map((e) => (e.id === selected ? { ...e, ...values } : e)));
  };
  const apply = async () => {
    setSaving(true);
    setError("");
    try {
      const result = await applyPdfEdits(bytes, edits, fieldEdits);
      onApply(result);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível aplicar a edição.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
        <label className="flex items-center gap-2 text-xs">
          Página
          <select
            aria-label="Página do editor"
            className={control + " w-auto"}
            value={pageIndex}
            onChange={(e) => {
              setPageIndex(+e.target.value);
              setSelected("");
            }}
          >
            {Array.from({ length: count }, (_, i) => (
              <option key={i} value={i}>
                {i + 1} / {count}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs">
          Zoom
          <select
            className={control + " w-auto"}
            value={zoom}
            onChange={(e) => setZoom(+e.target.value)}
          >
            {[50, 75, 100, 125, 150, 200].map((n) => (
              <option key={n} value={n}>
                {n}%
              </option>
            ))}
          </select>
        </label>
        <button
          title="Desfazer texto"
          aria-label="Desfazer texto"
          disabled={!step}
          onClick={() => setStep((s) => s - 1)}
          className="p-2 disabled:opacity-30"
        >
          <Undo2 size={17} />
        </button>
        <button
          title="Refazer texto"
          aria-label="Refazer texto"
          disabled={step === history.length - 1}
          onClick={() => setStep((s) => s + 1)}
          className="p-2 disabled:opacity-30"
        >
          <Redo2 size={17} />
        </button>
        <button
          onClick={() => setAddMode(!addMode)}
          aria-pressed={addMode}
          className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-xs ${addMode ? "border-orange-500 text-orange-400" : "border-border"}`}
        >
          <Plus size={15} />
          Adicionar texto
        </button>
        <button
          disabled={
            saving || (!edits.length && !Object.keys(fieldEdits).length)
          }
          onClick={apply}
          className="ml-auto flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-black disabled:opacity-40"
        >
          {saving ? (
            <Loader2 className="animate-spin" size={15} />
          ) : (
            <Check size={15} />
          )}
          Aplicar ao documento
        </button>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {busy
          ? "Analisando página…"
          : blocks.length
            ? `${blocks.length} trechos de texto selecionável encontrados. Clique em um trecho para editar.`
            : "Página digitalizada ou sem texto selecionável. O texto da imagem não pode ser editado sem OCR; você pode adicionar anotações."}{" "}
        {addMode && (
          <strong className="text-orange-400">
            Clique na folha para posicionar o novo texto.
          </strong>
        )}
      </p>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="relative min-h-72 overflow-auto rounded-xl border border-border bg-neutral-200 p-4">
          <div
            className="relative mx-auto bg-white"
            style={{
              width: viewport?.width || 0,
              height: viewport?.height || 0,
            }}
            onClick={(e) => {
              if (!addMode || !viewport) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const [x, y] = viewport.convertToPdfPoint(
                e.clientX - rect.left,
                e.clientY - rect.top,
              );
              const id = crypto.randomUUID();
              change([
                ...edits,
                {
                  id,
                  page: pageIndex,
                  text: "Seu texto",
                  x,
                  y,
                  size: 16,
                  width: 160,
                  height: 20,
                  angle: 0,
                  font: StandardFonts.Helvetica,
                  color: "#000000",
                  background: "#ffffff",
                  cover: false,
                },
              ]);
              setSelected(id);
              setAddMode(false);
            }}
          >
            <canvas ref={canvas} aria-label="Página PDF" />
            {viewport &&
              blocks.map((b) => {
                const [x, y] = viewport.convertToViewportPoint(
                  b.item.transform[4],
                  b.item.transform[5],
                );
                const size =
                  Math.hypot(b.item.transform[2], b.item.transform[3]) *
                  viewport.scale;
                return (
                  <button
                    key={b.id}
                    aria-label={`Editar texto: ${b.item.str}`}
                    title={b.item.str}
                    onClick={(e) => {
                      if (addMode) return;
                      e.stopPropagation();
                      choose(b);
                    }}
                    className={`absolute border text-transparent hover:border-orange-500 hover:bg-orange-500/10 ${selected === b.id ? "border-orange-500" : "border-transparent"}`}
                    style={{
                      left: x,
                      top: y - size,
                      width: Math.max(8, b.item.width * viewport.scale),
                      height: size * 1.3,
                      transformOrigin: "0 100%",
                      transform: `rotate(${viewport.rotation - (Math.atan2(b.item.transform[1], b.item.transform[0]) * 180) / Math.PI}deg)`,
                    }}
                  />
                );
              })}
            {viewport &&
              edits
                .filter((e) => e.page === pageIndex)
                .map((edit) => {
                  const [x, y] = viewport.convertToViewportPoint(
                    edit.x,
                    edit.y,
                  );
                  const [ox, oy] = viewport.convertToViewportPoint(
                    edit.originX ?? edit.x,
                    edit.originY ?? edit.y,
                  );
                  return (
                    <div
                      key={edit.id}
                      className="pointer-events-none absolute inset-0"
                    >
                      {edit.cover && (
                        <div
                          className="absolute"
                          style={{
                            left: ox,
                            top: oy - edit.height * viewport.scale,
                            width: (edit.width + 1) * viewport.scale,
                            height: edit.height * viewport.scale * 1.25,
                            background: edit.background,
                            transformOrigin: "0 80%",
                            transform: `rotate(${viewport.rotation - (edit.originAngle ?? edit.angle)}deg)`,
                          }}
                        />
                      )}
                      <span
                        className="absolute whitespace-pre"
                        style={{
                          left: x,
                          top: y - edit.size * viewport.scale,
                          fontSize: edit.size * viewport.scale,
                          lineHeight: 1.2,
                          color: edit.color,
                          fontFamily: edit.font.startsWith("Courier")
                            ? "monospace"
                            : edit.font.startsWith("Times")
                              ? "serif"
                              : "Arial, sans-serif",
                          fontWeight: edit.font.includes("Bold")
                            ? "bold"
                            : "normal",
                          fontStyle: /Italic|Oblique/.test(edit.font)
                            ? "italic"
                            : "normal",
                          transformOrigin: "0 83%",
                          transform: `rotate(${viewport.rotation - edit.angle}deg)`,
                        }}
                      >
                        {edit.text}
                      </span>
                    </div>
                  );
                })}
          </div>
          {busy && (
            <div className="absolute inset-0 grid place-items-center bg-white/60">
              <Loader2 className="animate-spin text-orange-500" />
            </div>
          )}
        </div>
        <aside className="space-y-4 rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold">Editar conteúdo</h3>
          {active ? (
            <>
              <label className="block space-y-2 text-xs">
                Texto
                <textarea
                  aria-label="Texto do PDF"
                  className={control + " min-h-24"}
                  value={active.text}
                  onChange={(e) => patch({ text: e.target.value })}
                />
              </label>
              <label className="block space-y-2 text-xs">
                Fonte
                <select
                  className={control}
                  value={active.font}
                  onChange={(e) =>
                    patch({ font: e.target.value as StandardFonts })
                  }
                >
                  {PDF_FONTS.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs">
                  Tamanho (pt)
                  <input
                    aria-label="Tamanho do texto"
                    className={control}
                    type="number"
                    min={4}
                    max={200}
                    value={active.size}
                    onChange={(e) => patch({ size: +e.target.value })}
                  />
                </label>
                <label className="text-xs">
                  Cor
                  <input
                    aria-label="Cor do texto"
                    className={control}
                    type="color"
                    value={active.color}
                    onChange={(e) => patch({ color: e.target.value })}
                  />
                </label>
                <label className="text-xs">
                  Posição X (pt)
                  <input
                    className={control}
                    type="number"
                    value={Math.round(active.x)}
                    onChange={(e) => patch({ x: +e.target.value })}
                  />
                </label>
                <label className="text-xs">
                  Posição Y (pt)
                  <input
                    className={control}
                    type="number"
                    value={Math.round(active.y)}
                    onChange={(e) => patch({ y: +e.target.value })}
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={active.cover}
                  onChange={(e) => patch({ cover: e.target.checked })}
                />
                Cobrir o texto original
              </label>
              {active.cover && (
                <label className="block text-xs">
                  Cor do fundo
                  <input
                    className={control}
                    type="color"
                    value={active.background}
                    onChange={(e) => patch({ background: e.target.value })}
                  />
                </label>
              )}
              <button
                className="text-xs text-red-400"
                onClick={() => {
                  change(edits.filter((e) => e.id !== selected));
                  setSelected("");
                }}
              >
                Descartar esta alteração
              </button>
            </>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Selecione um trecho na página ou clique em Adicionar texto. Você
              pode mudar a fonte, o tamanho, a cor e a posição.
            </p>
          )}
          {fields.length > 0 && (
            <div className="space-y-3 border-t border-border pt-4">
              <h4 className="text-sm font-semibold">Campos do formulário</h4>
              {fields.map((f) => (
                <label key={f.name} className="block space-y-1 text-xs">
                  {f.name}
                  {typeof f.value === "boolean" ? (
                    <input
                      className="ml-2"
                      type="checkbox"
                      checked={Boolean(fieldEdits[f.name] ?? f.value)}
                      onChange={(e) =>
                        setFieldEdits({
                          ...fieldEdits,
                          [f.name]: e.target.checked,
                        })
                      }
                    />
                  ) : f.options ? (
                    <select
                      className={control}
                      value={String(fieldEdits[f.name] ?? f.value)}
                      onChange={(e) =>
                        setFieldEdits({
                          ...fieldEdits,
                          [f.name]: e.target.value,
                        })
                      }
                    >
                      <option value="">Escolha…</option>
                      {f.options.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={control}
                      value={String(fieldEdits[f.name] ?? f.value)}
                      onChange={(e) =>
                        setFieldEdits({
                          ...fieldEdits,
                          [f.name]: e.target.value,
                        })
                      }
                    />
                  )}
                </label>
              ))}
            </div>
          )}
        </aside>
      </div>
      <p className="rounded-xl bg-amber-500/10 p-3 text-xs leading-relaxed text-muted-foreground">
        A edição é visual: substitui trechos por uma cobertura e novo texto; as
        fontes originais e o fluxo de parágrafos podem mudar. Não use para
        ocultar dados sigilosos: o conteúdo original pode continuar no arquivo.
        Revise o resultado antes de compartilhar. Clique em Aplicar ao documento
        e depois em Exportar PDF.
      </p>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
