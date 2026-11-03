"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";
import JSZip from "jszip";
import { PdfContentEditor } from "./pdf-content-editor";
import { applyPdfEdits, type PdfTextEdit } from "@/lib/pdf-edits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { downloadBlob, formatBytes } from "@/lib/helpers";
import {
  FileText,
  Upload,
  Trash2,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Download,
  Merge,
  Droplets,
  Hash,
  Info,
  Loader2,
  Eye,
  CheckSquare,
  XCircle,
  FilePlus2,
  PackageOpen,
} from "lucide-react";

/* ================= Tipos ================= */

interface PdfPage {
  id: string;
  origIndex: number; // índice no PDF original
  rotation: number;
  deleted: boolean;
  selected: boolean;
  thumb: string; // dataURL
  w: number;
  h: number;
}

interface MergeFile {
  id: string;
  name: string;
  size: number;
  bytes: ArrayBuffer;
  pages: number;
}

function ViewerCanvas({
  previewPage,
  docBytes,
  ensurePdfjs,
}: {
  previewPage: PdfPage;
  docBytes: Uint8Array | null;
  ensurePdfjs: () => Promise<typeof import("pdfjs-dist")>;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!previewPage || !docBytes || !ref.current) return;
      const pdfjs = await ensurePdfjs();
      const task = pdfjs.getDocument({ data: docBytes.slice() });
      const doc = await task.promise;
      const page = await doc.getPage(previewPage.origIndex + 1);
      const vp0 = page.getViewport({ scale: 1 });
      const scale = Math.min(1.4, 560 / vp0.width);
      const vp = page.getViewport({ scale: scale });
      const canvas = ref.current;
      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: ctx, viewport: vp } as never)
        .promise;
      if (cancelled) return;
      await task.destroy();
    })();
    return () => {
      cancelled = true;
    };
  }, [previewPage, docBytes, ensurePdfjs]);
  return (
    <canvas
      ref={ref}
      className="mx-auto max-w-full rounded-lg bg-white shadow-xl"
    />
  );
}

/* ================= Componente ================= */

export function PdfEditor() {
  const { toast } = useToast();
  const [tab, setTab] = useState("conteudo");

  /* ---------- estado: organizar / editar ---------- */
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [docBytes, setDocBytes] = useState<Uint8Array | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewPage, setPreviewPage] = useState<PdfPage | null>(null);

  /* ---------- estado: marca d'água / numeração / metadados ---------- */
  const [wmText, setWmText] = useState("");
  const [wmSize, setWmSize] = useState(48);
  const [wmOpacity, setWmOpacity] = useState(0.12);
  const [wmColor, setWmColor] = useState("#e8703a");
  const [wmRotation, setWmRotation] = useState(45);
  const [enableNumbers, setEnableNumbers] = useState(false);
  const [numPosition, setNumPosition] = useState("bottom-center");
  const [numFormat, setNumFormat] = useState("simple");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaAuthor, setMetaAuthor] = useState("");
  const [metaSubject, setMetaSubject] = useState("");

  /* ---------- estado: mesclar ---------- */
  const [mergeFiles, setMergeFiles] = useState<MergeFile[]>([]);
  const [busy, setBusy] = useState(false);

  const pdfjsRef = useRef<typeof import("pdfjs-dist") | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textDraft = useRef<{
    edits: PdfTextEdit[];
    fields: Record<string, string | boolean>;
  }>({ edits: [], fields: {} });
  const keepTextDraft = useCallback(
    (edits: PdfTextEdit[], fields: Record<string, string | boolean>) => {
      textDraft.current = { edits, fields };
    },
    [],
  );
  const mergeInputRef = useRef<HTMLInputElement>(null);

  const ensurePdfjs = useCallback(async () => {
    if (!pdfjsRef.current) {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      pdfjsRef.current = pdfjs;
    }
    return pdfjsRef.current;
  }, []);

  const refreshThumbs = async (updated: Uint8Array) => {
    const pdfjs = await ensurePdfjs();
    const task = pdfjs.getDocument({ data: updated.slice() });
    try {
      const doc = await task.promise;
      const thumbs = new Map<number, string>();
      for (let i = 0; i < doc.numPages; i++) {
        const page = await doc.getPage(i + 1);
        const vp0 = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: Math.min(1, 140 / vp0.width) });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(vp.width);
        canvas.height = Math.ceil(vp.height);
        await page.render({ canvas, viewport: vp }).promise;
        thumbs.set(i, canvas.toDataURL("image/jpeg", 0.8));
      }
      setPages((ps) =>
        ps.map((p) => ({ ...p, thumb: thumbs.get(p.origIndex) || p.thumb })),
      );
    } finally {
      await task.destroy();
    }
  };

  /* ---------- carregar PDF principal ---------- */
  const loadMainPdf = async (file: File) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast({ title: "Use um PDF de até 25 MB", variant: "destructive" });
      return;
    }
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      toast({ title: "Envie um arquivo PDF", variant: "destructive" });
      return;
    }
    setLoadingPdf(true);
    setProgress(0);
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf.slice(0));
      setDocBytes(bytes);
      textDraft.current = { edits: [], fields: {} };
      setFileName(file.name);
      setFileSize(file.size);

      const pdfjs = await ensurePdfjs();
      const task = pdfjs.getDocument({ data: bytes.slice() });
      const doc = await task.promise;
      const thumbs: PdfPage[] = [];

      for (let i = 0; i < doc.numPages; i++) {
        const page = await doc.getPage(i + 1);
        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(1, 140 / viewport.width);
        const vp = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(vp.width);
        canvas.height = Math.floor(vp.height);
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: ctx, viewport: vp } as never)
          .promise;
        thumbs.push({
          id: `p${i}-${Date.now()}`,
          origIndex: i,
          rotation: 0,
          deleted: false,
          selected: false,
          thumb: canvas.toDataURL("image/jpeg", 0.72),
          w: viewport.width,
          h: viewport.height,
        });
        setProgress(Math.round(((i + 1) / doc.numPages) * 100));
        await new Promise((r) => setTimeout(r, 0)); // deixa a UI respirar
      }

      setPages(thumbs);
      setTab("conteudo");
      // metadados
      try {
        const md = await doc.getMetadata();
        const info = (md?.info ?? {}) as {
          Title?: string;
          Author?: string;
          Subject?: string;
        };
        setMetaTitle(info.Title || "");
        setMetaAuthor(info.Author || "");
        setMetaSubject(info.Subject || "");
      } catch {
        /* ignore */
      }

      await task.destroy();
      toast({
        title: "PDF carregado!",
        description: `${doc.numPages} páginas prontas para edição.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Não foi possível ler o PDF",
        description: "O arquivo pode estar protegido por senha ou corrompido.",
        variant: "destructive",
      });
      setDocBytes(null);
      setPages([]);
    } finally {
      setLoadingPdf(false);
      setProgress(0);
    }
  };

  /* ---------- operações de páginas ---------- */
  const toggleSelect = (id: string) =>
    setPages((ps) =>
      ps.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p)),
    );

  const rotate = (id: string) =>
    setPages((ps) =>
      ps.map((p) =>
        p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p,
      ),
    );

  const removePage = (id: string) =>
    setPages((ps) =>
      ps.map((p) => (p.id === id ? { ...p, deleted: !p.deleted } : p)),
    );

  const move = (idx: number, dir: -1 | 1) =>
    setPages((ps) => {
      const next = [...ps];
      const t = idx + dir;
      if (t < 0 || t >= next.length) return ps;
      [next[idx], next[t]] = [next[t], next[idx]];
      return next;
    });

  const selectAll = (v: boolean) =>
    setPages((ps) => ps.map((p) => ({ ...p, selected: !p.deleted && v })));
  const deleteSelected = () => {
    const n = pages.filter((p) => p.selected && !p.deleted).length;
    if (!n)
      return toast({
        title: "Selecione páginas primeiro",
        variant: "destructive",
      });
    setPages((ps) =>
      ps.map((p) =>
        p.selected ? { ...p, deleted: true, selected: false } : p,
      ),
    );
    toast({ title: `${n} páginas marcadas para remoção` });
  };

  const activeCount = pages.filter((p) => !p.deleted).length;

  /* ---------- exportar (organizar + edição) ---------- */
  const buildEditedPdf = async (): Promise<Uint8Array | null> => {
    if (!docBytes) return null;
    const draft = textDraft.current;
    const editedBytes =
      draft.edits.length || Object.keys(draft.fields).length
        ? await applyPdfEdits(docBytes, draft.edits, draft.fields)
        : docBytes;
    const src = await PDFDocument.load(editedBytes.slice());
    const out = await PDFDocument.create();
    const kept = pages.filter((p) => !p.deleted);
    const copied = await out.copyPages(
      src,
      kept.map((p) => p.origIndex),
    );
    copied.forEach((page, i) => {
      if (kept[i].rotation)
        page.setRotation(
          degrees((page.getRotation().angle + kept[i].rotation) % 360),
        );
      out.addPage(page);
    });

    // marca d'água
    if (wmText.trim()) {
      const font = await out.embedFont(StandardFonts.HelveticaBold);
      const color = hexToRgb(wmColor);
      out.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        const tw = font.widthOfTextAtSize(wmText, wmSize);
        page.drawText(wmText, {
          x: (width - tw * Math.cos((wmRotation * Math.PI) / 180)) / 2.6,
          y: height / 2 - 60,
          size: wmSize,
          font,
          color: rgb(color.r, color.g, color.b),
          opacity: wmOpacity,
          rotate: degrees(wmRotation),
        });
      });
    }

    // numeração
    if (enableNumbers) {
      const font = await out.embedFont(StandardFonts.Helvetica);
      const all = out.getPages();
      all.forEach((page, i) => {
        const { width, height } = page.getSize();
        const label =
          numFormat === "simple"
            ? `${i + 1}`
            : `Página ${i + 1} de ${all.length}`;
        const tw = font.widthOfTextAtSize(label, 10);
        const margin = 18;
        let x = width / 2 - tw / 2;
        let y = margin;
        if (numPosition === "bottom-right") x = width - tw - margin;
        if (numPosition === "bottom-left") x = margin;
        if (numPosition === "top-center") y = height - margin - 4;
        if (numPosition === "top-right") {
          x = width - tw - margin;
          y = height - margin - 4;
        }
        if (numPosition === "top-left") {
          x = margin;
          y = height - margin - 4;
        }
        page.drawText(label, {
          x,
          y,
          size: 10,
          font,
          color: rgb(0.35, 0.35, 0.35),
        });
      });
    }

    // metadados
    if (metaTitle.trim()) out.setTitle(metaTitle);
    if (metaAuthor.trim()) out.setAuthor(metaAuthor);
    if (metaSubject.trim()) out.setSubject(metaSubject);
    out.setProducer("Click & Gruda Tools");
    out.setCreator("Click & Gruda Tools");

    return out.save();
  };

  const exportEdited = async () => {
    if (!docBytes) return;
    setBusy(true);
    try {
      const bytes = await buildEditedPdf();
      if (!bytes) return;
      const base = fileName.replace(/\.pdf$/i, "") || "documento";
      downloadBlob(
        new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
        `${base}-editado.pdf`,
      );
      toast({
        title: "PDF exportado!",
        description: `${activeCount} páginas · processado no seu navegador`,
      });
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao exportar", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const extractSelected = async () => {
    const sel = pages.filter((p) => p.selected && !p.deleted);
    if (!sel.length)
      return toast({
        title: "Selecione páginas para extrair",
        variant: "destructive",
      });
    setBusy(true);
    try {
      const src = await PDFDocument.load(docBytes!.slice());
      const out = await PDFDocument.create();
      const copied = await out.copyPages(
        src,
        sel.map((p) => p.origIndex),
      );
      copied.forEach((page, i) => {
        if (sel[i].rotation)
          page.setRotation(
            degrees((page.getRotation().angle + sel[i].rotation) % 360),
          );
        out.addPage(page);
      });
      const bytes = await out.save();
      downloadBlob(
        new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
        "paginas-extraidas.pdf",
      );
      toast({ title: `${sel.length} páginas extraídas!` });
    } catch {
      toast({ title: "Erro ao extrair", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  /* ---------- mesclar ---------- */
  const addMergeFiles = async (list: FileList | null) => {
    if (!list) return;
    const pdfs = Array.from(list).filter(
      (f) =>
        f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );
    if (!pdfs.length)
      return toast({ title: "Nenhum PDF válido", variant: "destructive" });
    setBusy(true);
    try {
      const added: MergeFile[] = [];
      for (const f of pdfs) {
        const bytes = await f.arrayBuffer();
        const doc = await PDFDocument.load(bytes.slice(0));
        added.push({
          id: `f${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: f.name,
          size: f.size,
          bytes,
          pages: doc.getPageCount(),
        });
      }
      setMergeFiles((prev) => [...prev, ...added]);
      toast({ title: `${added.length} PDF(s) adicionados à fila` });
    } catch {
      toast({
        title: "Um dos arquivos não pôde ser lido",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const runMerge = async () => {
    if (mergeFiles.length < 2)
      return toast({
        title: "Adicione ao menos 2 PDFs",
        variant: "destructive",
      });
    setBusy(true);
    try {
      const out = await PDFDocument.create();
      for (const f of mergeFiles) {
        const src = await PDFDocument.load(f.bytes.slice(0));
        const copied = await out.copyPages(src, src.getPageIndices());
        copied.forEach((p) => out.addPage(p));
      }
      const bytes = await out.save();
      downloadBlob(
        new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
        "pdf-mesclado.pdf",
      );
      toast({
        title: "PDFs mesclados!",
        description: `${out.getPageCount()} páginas no arquivo final.`,
      });
    } catch {
      toast({ title: "Erro ao mesclar", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const downloadAllThumbs = async () => {
    const kept = pages.filter((p) => !p.deleted);
    if (!kept.length) return;
    setBusy(true);
    try {
      const zip = new JSZip();
      kept.forEach((p, i) => {
        zip.file(
          `pagina-${String(i + 1).padStart(3, "0")}.jpg`,
          p.thumb.split(",")[1],
          { base64: true },
        );
      });
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(
        blob,
        `${fileName.replace(/\.pdf$/i, "") || "pdf"}-paginas.zip`,
      );
      toast({ title: "ZIP com imagens das páginas baixado!" });
    } catch {
      toast({ title: "Erro ao gerar ZIP", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const dropzone = (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        loadMainPdf(e.dataTransfer.files[0]);
      }}
      onClick={() => fileInputRef.current?.click()}
      className="flex min-h-[240px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-secondary/30 p-8 text-center transition-all hover:border-primary/50 hover:bg-secondary/50"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={(e) => e.target.files?.[0] && loadMainPdf(e.target.files[0])}
      />
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Upload className="h-6 w-6" />
      </div>
      <div>
        <p className="font-display font-semibold">
          Arraste seu PDF aqui ou clique para escolher
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Processamento 100% local — seu arquivo nunca sai do navegador
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full max-w-2xl h-auto grid-cols-2 gap-1 bg-muted/60 sm:grid-cols-5">
          {(
            [
              ["conteudo", FileText, "Texto e leitura"],
              ["organizar", PackageOpen, "Páginas"],
              ["mesclar", Merge, "Mesclar"],
              ["editar", Droplets, "Marcar d\u2019água"],
              ["meta", Info, "Metadados"],
            ] as const
          ).map(([id, Icon, label]) => (
            <TabsTrigger
              key={id}
              value={id}
              className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent
          forceMount
          value="conteudo"
          className="mt-4 space-y-4 data-[state=inactive]:hidden"
        >
          {!docBytes ? (
            dropzone
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
                <p className="truncate text-sm">
                  {fileName} · {pages.length} páginas
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Trocar PDF
                  </Button>
                  <Button
                    size="sm"
                    onClick={exportEdited}
                    disabled={busy || !activeCount}
                  >
                    Exportar PDF
                  </Button>
                </div>
              </div>
              <input
                ref={tab === "conteudo" ? fileInputRef : undefined}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) void loadMainPdf(e.target.files[0]);
                  e.target.value = "";
                }}
              />
              <PdfContentEditor
                bytes={docBytes}
                onDraftChange={keepTextDraft}
                onApply={(updated) => {
                  textDraft.current = { edits: [], fields: {} };
                  setDocBytes(updated);
                  void refreshThumbs(updated).catch(() =>
                    toast({
                      title: "Prévia não atualizada",
                      description:
                        "O PDF editado continua disponível para exportação.",
                    }),
                  );
                  toast({
                    title: "Alterações aplicadas",
                    description: "Exporte o PDF para salvar uma cópia.",
                  });
                }}
              />
            </>
          )}
          {loadingPdf && (
            <p className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Lendo páginas… {progress}%
            </p>
          )}
        </TabsContent>
        {/* ============== ORGANIZAR ============== */}
        <TabsContent value="organizar" className="mt-4 space-y-4">
          {!docBytes && dropzone}

          {loadingPdf && (
            <div className="glass-card flex items-center gap-3 rounded-2xl p-5">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Renderizando páginas… {progress}%
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {docBytes && !loadingPdf && (
            <>
              <div className="glass-card flex flex-wrap items-center gap-2 rounded-2xl p-4">
                <Badge variant="secondary" className="gap-1.5">
                  <FileText className="h-3 w-3" /> {fileName} ·{" "}
                  {formatBytes(fileSize)}
                </Badge>
                <Badge className="border-primary/40 bg-primary/20 text-primary-foreground">
                  {activeCount} páginas
                </Badge>
                <div className="ml-auto flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => selectAll(true)}
                    className="gap-1.5"
                  >
                    <CheckSquare className="h-3.5 w-3.5" /> Selecionar tudo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => selectAll(false)}
                    className="gap-1.5"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Limpar seleção
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={deleteSelected}
                    className="gap-1.5 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Excluir selecionadas
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={extractSelected}
                    disabled={busy}
                    className="gap-1.5"
                  >
                    <FilePlus2 className="h-3.5 w-3.5" /> Extrair selecionadas
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={downloadAllThumbs}
                    disabled={busy}
                    className="gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" /> Páginas em JPG (ZIP)
                  </Button>
                  <Button
                    size="sm"
                    onClick={exportEdited}
                    disabled={busy}
                    className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}{" "}
                    Salvar PDF final
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
                {pages.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`group relative rounded-xl border-2 p-2 transition-all ${
                      p.deleted
                        ? "border-destructive/50 bg-destructive/10 opacity-50"
                        : p.selected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary/30 hover:border-primary/40"
                    }`}
                  >
                    <button
                      onClick={() => setPreviewPage(p)}
                      className="block w-full"
                      title="Visualizar página"
                    >
                      {}
                      <img
                        src={p.thumb}
                        alt={`Página ${idx + 1}`}
                        className="mx-auto rounded border border-border bg-white shadow-sm transition-transform group-hover:scale-[1.03]"
                        style={{ transform: `rotate(${p.rotation}deg)` }}
                      />
                    </button>
                    <div className="mt-2 flex items-center justify-between">
                      <label className="flex cursor-pointer items-center gap-1 text-[10px] text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={p.selected}
                          onChange={() => toggleSelect(p.id)}
                          className="accent-[#e8703a]"
                        />
                        #{idx + 1}
                      </label>
                      <div className="flex gap-0.5">
                        <button
                          onClick={() => move(idx, -1)}
                          aria-label="Mover para trás"
                          className="rounded p-1 text-muted-foreground hover:text-primary"
                        >
                          <ArrowLeft className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => move(idx, 1)}
                          aria-label="Mover para frente"
                          className="rounded p-1 text-muted-foreground hover:text-primary"
                        >
                          <ArrowRight className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => rotate(p.id)}
                          aria-label="Girar"
                          className="rounded p-1 text-muted-foreground hover:text-primary"
                        >
                          <RotateCw className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removePage(p.id)}
                          aria-label="Remover"
                          className="rounded p-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* ============== MESCLAR ============== */}
        <TabsContent value="mesclar" className="mt-4 space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addMergeFiles(e.dataTransfer.files);
            }}
            onClick={() => mergeInputRef.current?.click()}
            className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-secondary/30 p-8 text-center transition-all hover:border-primary/50 hover:bg-secondary/50"
          >
            <input
              ref={mergeInputRef}
              type="file"
              accept="application/pdf"
              multiple
              className="sr-only"
              onChange={(e) => addMergeFiles(e.target.files)}
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Merge className="h-5 w-5" />
            </div>
            <p className="font-display font-semibold">
              Arraste 2 ou mais PDFs para mesclar
            </p>
            <p className="text-xs text-muted-foreground">
              A ordem da lista define a ordem no arquivo final
            </p>
          </div>

          {mergeFiles.length > 0 && (
            <div className="glass-card space-y-2 rounded-2xl p-4">
              {mergeFiles.map((f, idx) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{f.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {f.pages} páginas · {formatBytes(f.size)}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const n = [...mergeFiles];
                      [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]];
                      setMergeFiles(n);
                    }}
                    disabled={idx === 0}
                    className="h-8 w-8"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const n = [...mergeFiles];
                      [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]];
                      setMergeFiles(n);
                    }}
                    disabled={idx === mergeFiles.length - 1}
                    className="h-8 w-8"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setMergeFiles(mergeFiles.filter((x) => x.id !== f.id))
                    }
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                onClick={runMerge}
                disabled={busy || mergeFiles.length < 2}
                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Merge className="h-4 w-4" />
                )}
                Mesclar {mergeFiles.length} PDFs e baixar
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ============== MARCA D'ÁGUA ============== */}
        <TabsContent value="editar" className="mt-4">
          {!docBytes ? (
            <div className="glass-card rounded-2xl p-6 text-center text-sm text-muted-foreground">
              Carregue um PDF na aba{" "}
              <strong className="text-foreground">Páginas</strong> primeiro,
              depois aplique marca d&apos;água e numeração aqui.
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="glass-card rounded-2xl p-5">
                <h3 className="font-display mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Droplets className="h-4 w-4 text-primary" /> Marca
                  d&apos;água
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">
                      Texto da marca d&apos;água
                    </Label>
                    <Input
                      placeholder="CONFIDENCIAL, RASCUNHO, seu nome…"
                      value={wmText}
                      onChange={(e) => setWmText(e.target.value)}
                      className="mt-1.5 h-10"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Tamanho: {wmSize}px</Label>
                      <Slider
                        value={[wmSize]}
                        min={16}
                        max={120}
                        step={4}
                        onValueChange={([v]) => setWmSize(v)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Rotação: {wmRotation}°</Label>
                      <Slider
                        value={[wmRotation]}
                        min={0}
                        max={90}
                        step={15}
                        onValueChange={([v]) => setWmRotation(v)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">
                        Opacidade: {Math.round(wmOpacity * 100)}%
                      </Label>
                      <Slider
                        value={[wmOpacity * 100]}
                        min={5}
                        max={60}
                        step={5}
                        onValueChange={([v]) => setWmOpacity(v / 100)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Cor</Label>
                      <div className="mt-1.5 flex h-10 items-center gap-2 rounded-lg border border-border bg-secondary/40 px-2">
                        <input
                          type="color"
                          aria-label="Cor da marca d'água"
                          value={wmColor}
                          onChange={(e) => setWmColor(e.target.value)}
                          className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent"
                        />
                        <span className="font-mono text-xs text-muted-foreground">
                          {wmColor}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="glass-card rounded-2xl p-5">
                <h3 className="font-display mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Hash className="h-4 w-4 text-primary" /> Numeração de páginas
                </h3>
                <div className="mb-3 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="en-num"
                    checked={enableNumbers}
                    onChange={(e) => setEnableNumbers(e.target.checked)}
                    className="h-4 w-4 accent-[#e8703a]"
                  />
                  <Label htmlFor="en-num" className="text-sm">
                    Ativar numeração automática
                  </Label>
                </div>
                <div
                  className={`grid gap-3 ${enableNumbers ? "" : "pointer-events-none opacity-40"}`}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Posição</Label>
                      <Select
                        value={numPosition}
                        onValueChange={setNumPosition}
                      >
                        <SelectTrigger className="mt-1.5 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bottom-center">
                            Inferior centro
                          </SelectItem>
                          <SelectItem value="bottom-right">
                            Inferior direita
                          </SelectItem>
                          <SelectItem value="bottom-left">
                            Inferior esquerda
                          </SelectItem>
                          <SelectItem value="top-center">
                            Superior centro
                          </SelectItem>
                          <SelectItem value="top-right">
                            Superior direita
                          </SelectItem>
                          <SelectItem value="top-left">
                            Superior esquerda
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Formato</Label>
                      <Select value={numFormat} onValueChange={setNumFormat}>
                        <SelectTrigger className="mt-1.5 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">1, 2, 3…</SelectItem>
                          <SelectItem value="full">Página 1 de N</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={exportEdited}
                  disabled={busy}
                  className="mt-5 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Aplicar e baixar PDF
                </Button>
              </section>
            </div>
          )}
        </TabsContent>

        {/* ============== METADADOS ============== */}
        <TabsContent value="meta" className="mt-4">
          {!docBytes ? (
            <div className="glass-card rounded-2xl p-6 text-center text-sm text-muted-foreground">
              Carregue um PDF na aba{" "}
              <strong className="text-foreground">Páginas</strong> para editar
              os metadados.
            </div>
          ) : (
            <section className="glass-card mx-auto max-w-xl rounded-2xl p-5 sm:p-6">
              <h3 className="font-display mb-1 flex items-center gap-2 text-lg font-semibold">
                <Info className="h-4 w-4 text-primary" /> Metadados do documento
              </h3>
              <p className="mb-4 text-xs text-muted-foreground">
                Útil para SEO de PDFs, profissionalismo e organização.
              </p>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Título</Label>
                  <Input
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="mt-1.5 h-10"
                    placeholder="Ex: Orçamento nº 123 — Click & Gruda"
                  />
                </div>
                <div>
                  <Label className="text-xs">Autor</Label>
                  <Input
                    value={metaAuthor}
                    onChange={(e) => setMetaAuthor(e.target.value)}
                    className="mt-1.5 h-10"
                    placeholder="Nome do autor ou empresa"
                  />
                </div>
                <div>
                  <Label className="text-xs">Assunto</Label>
                  <Input
                    value={metaSubject}
                    onChange={(e) => setMetaSubject(e.target.value)}
                    className="mt-1.5 h-10"
                    placeholder="Descrição curta do conteúdo"
                  />
                </div>
                <Button
                  onClick={exportEdited}
                  disabled={busy}
                  className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}{" "}
                  Salvar e baixar PDF
                </Button>
              </div>
            </section>
          )}
        </TabsContent>
      </Tabs>

      {/* Visualizador de página */}
      <Dialog
        open={!!previewPage}
        onOpenChange={(o) => !o && setPreviewPage(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4 text-primary" />
              Visualizando página{" "}
              {previewPage
                ? pages.findIndex((p) => p.id === previewPage.id) + 1
                : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="thin-scroll max-h-[70vh] overflow-auto rounded-xl bg-secondary/40 p-4">
            {previewPage && (
              <ViewerCanvas
                previewPage={previewPage}
                docBytes={docBytes}
                ensurePdfjs={ensurePdfjs}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  return {
    r: parseInt(full.slice(0, 2), 16) / 255,
    g: parseInt(full.slice(2, 4), 16) / 255,
    b: parseInt(full.slice(4, 6), 16) / 255,
  };
}
