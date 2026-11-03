'use client';

import { useCallback, useRef, useState } from 'react';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { downloadBlob, formatBytes, slugifyFilename } from '@/lib/helpers';
import {
  Image as ImageIcon, Upload, Download, Trash2, Loader2, CheckCircle2,
  XCircle, FileArchive, Wand2, Zap, X,
} from 'lucide-react';

const MAX_FILES = 10;

type OutFormat = 'image/png' | 'image/jpeg' | 'image/webp';

interface ImageJob {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pendente' | 'convertendo' | 'pronto' | 'erro';
  resultBlob?: Blob;
  resultName?: string;
  resultSize?: number;
  dims?: { w: number; h: number };
}

const EXT: Record<OutFormat, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export function ImageConverter() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<ImageJob[]>([]);
  const [outFormat, setOutFormat] = useState<OutFormat>('image/webp');
  const [quality, setQuality] = useState(85);
  const [maxWidth, setMaxWidth] = useState(0); // 0 = original
  const [bgColor, setBgColor] = useState('#ffffff');
  const [converting, setConverting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (list: FileList | File[] | null) => {
      if (!list) return;
      const files = Array.from(list).filter((f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg|avif|ico|tiff?)$/i.test(f.name));
      if (!files.length) {
        toast({ title: 'Nenhuma imagem válida encontrada', variant: 'destructive' });
        return;
      }
      setJobs((prev) => {
        const room = MAX_FILES - prev.length;
        if (room <= 0) {
          toast({ title: `Limite de ${MAX_FILES} imagens por lote`, description: 'Converta o lote atual primeiro e depois adicione mais.', variant: 'destructive' });
          return prev;
        }
        const accepted = files.slice(0, room);
        if (files.length > room) {
          toast({ description: `Apenas as primeiras ${room} imagens foram adicionadas (limite ${MAX_FILES}).` });
        }
        return [
          ...prev,
          ...accepted.map((f) => ({
            id: `img${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            file: f,
            previewUrl: URL.createObjectURL(f),
            status: 'pendente' as const,
          })),
        ];
      });
    },
    [toast]
  );

  const removeJob = (id: string) => setJobs((prev) => prev.filter((j) => j.id !== id));

  const loadImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Falha ao decodificar a imagem'));
      img.src = url;
    });

  const convertOne = async (job: ImageJob): Promise<ImageJob> => {
    setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: 'convertendo' } : j)));
    try {
      const img = await loadImage(job.previewUrl);
      let { naturalWidth: w, naturalHeight: h } = img;

      // SVG sem dimensões explícitas
      if (!w || !h) { w = 800; h = 600; }

      const targetW = maxWidth > 0 && maxWidth < w ? maxWidth : w;
      const scale = targetW / w;
      const targetH = Math.max(1, Math.round(h * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d')!;
      if (outFormat === 'image/jpeg') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, targetW, targetH);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Falha na conversão'))),
          outFormat,
          outFormat === 'image/png' ? undefined : quality / 100
        );
      });

      const base = slugifyFilename(job.file.name.replace(/\.[^.]+$/, '')) || 'imagem';
      const resultName = `${base}.${EXT[outFormat]}`;

      return {
        ...job,
        status: 'pronto',
        resultBlob: blob,
        resultName,
        resultSize: blob.size,
        dims: { w: targetW, h: targetH },
      };
    } catch {
      return { ...job, status: 'erro' };
    }
  };

  const convertAll = async () => {
    const pending = jobs.filter((j) => j.status === 'pendente' || j.status === 'erro');
    if (!pending.length) return toast({ title: 'Tudo já está convertido!' });
    setConverting(true);
    let ok = 0;
    for (const job of pending) {
      const done = await convertOne(job);
      if (done.status === 'pronto') ok++;
      setJobs((prev) => prev.map((j) => (j.id === done.id ? done : j)));
    }
    setConverting(false);
    toast({ title: `${ok}/${pending.length} imagens convertidas com sucesso!` });
  };

  const downloadZip = async () => {
    const ready = jobs.filter((j) => j.status === 'pronto' && j.resultBlob);
    if (!ready.length) return;
    const zip = new JSZip();
    const used = new Set<string>();
    ready.forEach((j) => {
      let name = j.resultName!;
      let n = 1;
      while (used.has(name)) {
        name = j.resultName!.replace(/\.(\w+)$/, `-${n++}.$1`);
      }
      used.add(name);
      zip.file(name, j.resultBlob!);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, 'imagens-convertidas.zip');
    toast({ title: 'ZIP baixado!', description: `${ready.length} imagens compactadas.` });
  };

  const totalSaved = jobs.reduce((acc, j) => {
    if (j.status === 'pronto' && j.resultSize) return acc + (j.file.size - j.resultSize);
    return acc;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          dragOver ? 'border-primary bg-primary/10 glow-brand' : 'border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.avif,.ico,.tif,.tiff"
          multiple
          className="sr-only"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
        />
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Upload className="h-6 w-6" />
        </div>
        <div>
          <p className="font-display font-semibold">Arraste até {MAX_FILES} imagens ou clique para escolher</p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPG · PNG · WEBP · GIF · BMP · SVG · AVIF · ICO · TIFF — conversão 100% local no seu navegador
          </p>
        </div>
        <Badge variant={jobs.length >= MAX_FILES ? 'destructive' : 'secondary'}>
          {jobs.length}/{MAX_FILES} imagens na fila
        </Badge>
      </div>

      {/* Configurações */}
      <section className="glass-card rounded-2xl p-5">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="text-xs">Formato de saída</Label>
            <Select value={outFormat} onValueChange={(v) => setOutFormat(v as OutFormat)}>
              <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="image/webp">WEBP — moderno e leve</SelectItem>
                <SelectItem value="image/jpeg">JPG — universal</SelectItem>
                <SelectItem value="image/png">PNG — sem perdas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Qualidade: {quality}%</Label>
            <Slider value={[quality]} min={10} max={100} step={5} onValueChange={([v]) => setQuality(v)} className="mt-4" disabled={outFormat === 'image/png'} />
          </div>
          <div>
            <Label className="text-xs">Largura máxima: {maxWidth === 0 ? 'original' : `${maxWidth}px`}</Label>
            <Slider value={[maxWidth]} min={0} max={4000} step={100} onValueChange={([v]) => setMaxWidth(v)} className="mt-4" />
          </div>
          <div>
            <Label className="text-xs">Fundo (para JPG):</Label>
            <div className="mt-1.5 flex h-11 items-center gap-2 rounded-lg border border-border bg-secondary/40 px-2">
              <input type="color" aria-label="Cor de fundo" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent" />
              <span className="font-mono text-xs text-muted-foreground">{bgColor}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button onClick={convertAll} disabled={converting || !jobs.length} className="gap-2 bg-primary text-primary-foreground transition-transform hover:bg-primary/90 active:scale-95">
            {converting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {converting ? 'Convertendo…' : `Converter ${jobs.filter((j) => j.status === 'pendente' || j.status === 'erro').length || ''} imagem(ns) → ${EXT[outFormat].toUpperCase()}`}
          </Button>
          <Button onClick={downloadZip} variant="outline" disabled={!jobs.some((j) => j.status === 'pronto')} className="gap-2">
            <FileArchive className="h-4 w-4" /> Baixar todas em ZIP
          </Button>
          {jobs.length > 0 && (
            <Button variant="ghost" onClick={() => setJobs([])} className="gap-2 text-muted-foreground hover:text-destructive">
              <X className="h-4 w-4" /> Limpar fila
            </Button>
          )}
          {totalSaved > 0 && (
            <Badge className="ml-auto border-whats/40 bg-whats/15 text-whats gap-1">
              <Zap className="h-3 w-3" /> Economia total: {formatBytes(Math.max(0, totalSaved))}
            </Badge>
          )}
        </div>
      </section>

      {/* Lista */}
      {jobs.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => {
            const saved = job.resultSize ? job.file.size - job.resultSize : 0;
            const pct = job.resultSize ? Math.max(0, Math.round((saved / job.file.size) * 100)) : 0;
            return (
              <div key={job.id} className={`glass-card group overflow-hidden rounded-2xl transition-all ${
                job.status === 'pronto' ? 'border-whats/30' : job.status === 'erro' ? 'border-destructive/50' : ''
              }`}>
                <div className="relative h-36 overflow-hidden bg-[repeating-conic-gradient(#1c1613_0%_25%,#151110_0%_50%)] bg-[length:16px_16px]">
                  { }
                  <img src={job.previewUrl} alt={job.file.name} className="h-full w-full object-contain" />
                  <button
                    onClick={() => removeJob(job.id)}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 hover:bg-destructive"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <div className="absolute bottom-2 left-2">
                    {job.status === 'pendente' && <Badge variant="secondary" className="gap-1"><ImageIcon className="h-3 w-3" /> Aguardando</Badge>}
                    {job.status === 'convertendo' && <Badge className="gap-1 bg-primary/90 text-primary-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Convertendo…</Badge>}
                    {job.status === 'pronto' && <Badge className="gap-1 bg-whats/90 text-white"><CheckCircle2 className="h-3 w-3" /> Pronta</Badge>}
                    {job.status === 'erro' && <Badge className="gap-1 bg-destructive"><XCircle className="h-3 w-3" /> Erro</Badge>}
                  </div>
                </div>
                <div className="p-3">
                  <p className="truncate text-xs font-medium" title={job.file.name}>{job.file.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatBytes(job.file.size)}
                    {job.dims && ` · ${job.dims.w}×${job.dims.h}`}
                    {job.status === 'pronto' && job.resultSize && (
                      <> → <span className="font-semibold text-whats">{formatBytes(job.resultSize)}</span>
                        {pct > 0 && <span className="text-whats"> (-{pct}%)</span>}
                        {pct < 0 && <span className="text-muted-foreground"> (+{Math.abs(pct)}%)</span>}
                      </>
                    )}
                  </p>
                  {job.status === 'convertendo' && <Progress value={undefined} className="mt-2 h-1" />}
                  {job.status === 'pronto' && job.resultBlob && (
                    <Button
                      size="sm" variant="outline"
                      onClick={() => downloadBlob(job.resultBlob!, job.resultName!)}
                      className="mt-2 h-8 w-full gap-1.5 text-xs"
                    >
                      <Download className="h-3 w-3" /> Baixar {EXT[outFormat].toUpperCase()}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
