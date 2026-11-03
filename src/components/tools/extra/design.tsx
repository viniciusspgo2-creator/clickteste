'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ToolShell, Field, TextInput, ResultCard } from './shell';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard, downloadBlob } from '@/lib/helpers';
import { Copy, Download, Palette, RefreshCcw, Plus, X } from 'lucide-react';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
}
function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}
function luminancia(r: number, g: number, b: number): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contraste(hex1: string, hex2: string): string {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const l1 = luminancia(r1, g1, b1), l2 = luminancia(r2, g2, b2);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return ratio.toFixed(2);
}

/* ================= Extrator de Paleta ================= */
export function PaletaTool() {
  const [imgSrc, setImgSrc] = useState('');
  const [cores, setCores] = useState<{ hex: string; pct: number }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const extrair = useCallback((src: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      const W = 160;
      const scale = W / img.width;
      canvas.width = W;
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // quantização simples em baldes 4 bits
      const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a < 128) continue;
        const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
        const cur = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
        cur.r += r; cur.g += g; cur.b += b; cur.n++;
        buckets.set(key, cur);
      }
      const total = [...buckets.values()].reduce((a, b) => a + b.n, 0) || 1;
      const top = [...buckets.values()]
        .sort((a, b) => b.n - a.n)
        .slice(0, 8)
        .map((v) => ({ hex: rgbToHex(v.r / v.n, v.g / v.n, v.b / v.n), pct: Math.round((v.n / total) * 1000) / 10 }));
      setCores(top);
    };
    img.src = src;
  }, []);

  return (
    <ToolShell title="Extrator de Paleta de Cores" description="Descubra as cores dominantes de qualquer imagem">
      <input
        type="file" accept="image/*" id="pal-img"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = () => { setImgSrc(reader.result as string); extrair(reader.result as string); };
          reader.readAsDataURL(f);
        }}
        className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/15 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-primary"
      />
      <canvas ref={canvasRef} className="hidden" />
      {imgSrc && (
        <div className="mt-5 grid gap-4 sm:grid-cols-[200px_1fr]">
          { }
          <img src={imgSrc} alt="Imagem analisada" className="max-h-48 w-full rounded-xl border border-border object-cover" />
          <div>
            {cores.length === 0 ? (
              <p className="text-sm text-muted-foreground">Analisando pixels…</p>
            ) : (
              <>
                <div className="flex h-14 overflow-hidden rounded-xl border border-border">
                  {cores.map((c) => (
                    <div key={c.hex} className="flex-1 transition-transform hover:scale-y-110" style={{ background: c.hex }} title={`${c.hex} · ${c.pct}%`} />
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {cores.map((c) => (
                    <button
                      key={c.hex}
                      onClick={async () => { const ok = await copyToClipboard(c.hex); toast({ title: ok ? `${c.hex} copiado!` : 'Erro' }); }}
                      className="group rounded-lg border border-border bg-secondary/40 p-2 text-left transition-colors hover:border-primary/50"
                    >
                      <span className="mb-1.5 block h-8 rounded-md border border-white/10" style={{ background: c.hex }} />
                      <span className="block font-mono text-[11px] text-foreground">{c.hex}</span>
                      <span className="block text-[10px] text-muted-foreground">{c.pct}% · copiar</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </ToolShell>
  );
}

/* ================= Mixer de Cores ================= */
export function MixerCoresTool() {
  const [cores, setCores] = useState(['#e8703a', '#f3ede4', '#0a0908']);

  const mistura = useMemo(() => {
    const rgbs = cores.map(hexToRgb);
    const avg = [0, 1, 2].map((i) => rgbs.reduce((a, r) => a + r[i], 0) / rgbs.length);
    return rgbToHex(avg[0], avg[1], avg[2]);
  }, [cores]);

  const [r, g, b] = hexToRgb(mistura);
  const luz = luminancia(r, g, b) > 0.5;

  return (
    <ToolShell title="Mixer de Cores" description="Misture de 2 a 6 cores e veja o resultado, código e contraste">
      <div className="flex flex-wrap items-center gap-3">
        {cores.map((c, i) => (
          <div key={i} className="group relative">
            <input
              type="color" value={c} aria-label={`Cor ${i + 1}`}
              onChange={(e) => setCores((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))}
              className="h-16 w-16 cursor-pointer rounded-xl border border-border bg-transparent"
            />
            {cores.length > 2 && (
              <button
                onClick={() => setCores((arr) => arr.filter((_, j) => j !== i))}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remover cor"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        {cores.length < 6 && (
          <button
            onClick={() => setCores((arr) => [...arr, '#888888'])}
            className="flex h-16 w-16 flex-col items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Plus className="h-5 w-5" />
            <span className="text-[9px]">adicionar</span>
          </button>
        )}
      </div>
      <div className="mt-5 flex items-center gap-4">
        <div className="h-24 w-24 shrink-0 rounded-2xl border border-border shadow-inner" style={{ background: mistura }} />
        <div>
          <ResultCard label="Cor misturada" value={mistura.toUpperCase()} />
          <p className="mt-2 text-xs text-muted-foreground">RGB: {r}, {g}, {b} · melhor texto: <strong className="text-foreground">{luz ? 'preto' : 'branco'}</strong> (contraste {luz ? contraste(mistura, '#000000') : contraste(mistura, '#ffffff')})</p>
        </div>
      </div>
    </ToolShell>
  );
}

/* ================= Box Shadow CSS ================= */
export function BoxShadowTool() {
  const [x, setX] = useState(0);
  const [y, setY] = useState(18);
  const [blur, setBlur] = useState(36);
  const [spread, setSpread] = useState(-6);
  const [cor, setCor] = useState('#e8703a');
  const [opacidade, setOpacidade] = useState(45);
  const [inset, setInset] = useState(false);
  const [radius, setRadius] = useState(16);
  const { toast } = useToast();

  const hexToRgba = (hex: string, alpha: number) => {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const css = `${inset ? 'inset ' : ''}${x}px ${y}px ${blur}px ${spread}px ${hexToRgba(cor, opacidade / 100)}`;
  const cssCode = `box-shadow: ${css};\nborder-radius: ${radius}px;\n-webkit-box-shadow: ${css};`;

  return (
    <ToolShell title="Gerador de Box Shadow CSS" description="Desenhe sombras profissionais e copie o código pronto">
      <div className="grid gap-6 sm:grid-cols-[1fr_240px]">
        <div className="flex min-h-56 items-center justify-center rounded-2xl border border-border bg-[repeating-conic-gradient(#1c1613_0%_25%,#151110_0%_50%)] bg-[length:20px_20px] p-8">
          <div
            className="flex h-32 w-full max-w-64 items-center justify-center bg-card text-sm text-muted-foreground transition-all"
            style={{ boxShadow: css, borderRadius: radius }}
          >
            preview da sombra
          </div>
        </div>
        <div className="space-y-3.5">
          <div><label className="text-xs text-muted-foreground">X: {x}px</label><Slider value={[x]} min={-40} max={60} onValueChange={([v]) => setX(v)} /></div>
          <div><label className="text-xs text-muted-foreground">Y: {y}px</label><Slider value={[y]} min={-40} max={60} onValueChange={([v]) => setY(v)} /></div>
          <div><label className="text-xs text-muted-foreground">Desfoque: {blur}px</label><Slider value={[blur]} min={0} max={100} onValueChange={([v]) => setBlur(v)} /></div>
          <div><label className="text-xs text-muted-foreground">Expansão: {spread}px</label><Slider value={[spread]} min={-30} max={40} onValueChange={([v]) => setSpread(v)} /></div>
          <div><label className="text-xs text-muted-foreground">Opacidade: {opacidade}%</label><Slider value={[opacidade]} min={0} max={100} onValueChange={([v]) => setOpacidade(v)} /></div>
          <div><label className="text-xs text-muted-foreground">Cantos: {radius}px</label><Slider value={[radius]} min={0} max={50} onValueChange={([v]) => setRadius(v)} /></div>
          <div className="flex items-center gap-2">
            <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} aria-label="Cor da sombra" className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent" />
            <label className="flex items-center gap-2 text-xs"><Switch checked={inset} onCheckedChange={setInset} /> Sombra interna</label>
          </div>
        </div>
      </div>
      <div className="mt-5 rounded-xl border border-border bg-[#0d0b0a] p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">CSS</p>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={async () => { const ok = await copyToClipboard(cssCode); toast({ title: ok ? 'CSS copiado!' : 'Erro' }); }}>
            <Copy className="h-3 w-3" /> Copiar
          </Button>
        </div>
        <pre className="mt-2 overflow-x-auto font-mono text-xs leading-relaxed text-primary">{cssCode}</pre>
      </div>
    </ToolShell>
  );
}

/* ================= Estúdio de Avatares ================= */
export function AvatarTool() {
  const [seed, setSeed] = useState('ClickGruda');
  const [tamanho, setTamanho] = useState(5);
  const [colorido, setColorido] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const desenhar = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const S = 320;
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#f3ede4';
    ctx.fillRect(0, 0, S, S);

    // PRNG determinístico a partir do seed
    let h = 0;
    for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) | 0;
    const rnd = () => {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
      return ((h >>> 0) % 1000) / 1000;
    };

    const palette = colorido
      ? ['#e8703a', '#25d366', '#f2b56b', '#9f1239', '#166534', '#57534e']
      : ['#3f3a36', '#57534e', '#78716c', '#292524'];

    const cell = S / (tamanho * 2);
    const half = tamanho;
    for (let y = 0; y < half; y++) {
      for (let x = 0; x < half; x++) {
        if (rnd() > 0.52) {
          const cor = palette[Math.floor(rnd() * palette.length)];
          ctx.fillStyle = cor;
          ctx.fillRect(x * cell, y * cell, cell, cell);
          ctx.fillRect((half * 2 - 1 - x) * cell, y * cell, cell, cell); // espelho
        }
      }
    }
  }, [seed, tamanho, colorido]);

  useEffect(() => { desenhar(); }, [desenhar]);

  return (
    <ToolShell title="Estúdio de Avatares" description="Avatares geométricos únicos — digite qualquer nome e gere a identidade visual">
      <div className="grid gap-6 sm:grid-cols-[240px_1fr]">
        <div className="flex flex-col items-center gap-3">
          <canvas ref={canvasRef} className="w-52 rounded-2xl border border-border shadow-xl" />
          <div className="flex gap-2">
            <Button
              size="sm" variant="outline" className="gap-1.5"
              onClick={() => setSeed(Math.random().toString(36).slice(2, 10))}
            >
              <RefreshCcw className="h-3.5 w-3.5" /> Aleatório
            </Button>
            <Button
              size="sm" variant="outline" className="gap-1.5"
              onClick={() => canvasRef.current?.toBlob((b) => b && downloadBlob(b, `avatar-${seed}.png`)) && toast({ title: 'Avatar baixado!' })}
            >
              <Download className="h-3.5 w-3.5" /> PNG
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          <Field label="Nome / seed" id="av-seed"><TextInput id="av-seed" value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="Digite para gerar" /></Field>
          <div><label className="text-xs text-muted-foreground">Detalhe: {tamanho * 2}×{tamanho * 2} blocos</label><Slider value={[tamanho]} min={3} max={10} step={1} onValueChange={([v]) => setTamanho(v)} className="mt-2" /></div>
          <label className="flex items-center gap-2 text-sm"><Switch checked={colorido} onCheckedChange={setColorido} /> Modo colorido</label>
          <p className="rounded-lg border border-border bg-secondary/40 p-3 text-xs leading-relaxed text-muted-foreground">
            <Palette className="mr-1 inline h-3.5 w-3.5 text-primary" />
            O mesmo nome sempre gera o mesmo avatar — perfeito para sistemas de perfil e identidade de marca.
          </p>
        </div>
      </div>
    </ToolShell>
  );
}

/* ================= Aspect Ratio ================= */
export function AspectRatioTool() {
  const [largura, setLargura] = useState('1920');
  const [altura, setAltura] = useState('1080');
  const [novoValor, setNovoValor] = useState('1080');
  const [campo, setCampo] = useState<'altura' | 'largura'>('altura');

  const W = parseFloat(largura) || 0;
  const H = parseFloat(altura) || 0;
  const novo = parseFloat(novoValor) || 0;

  const resultado = useMemo(() => {
    if (!W || !H || !novo) return null;
    return campo === 'altura' ? (novo * W) / H : (novo * H) / W;
  }, [W, H, novo, campo]);

  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const divisor = W && H ? gcd(Math.round(W), Math.round(H)) : 0;
  const ratioStr = W && H ? `${Math.round(W / divisor)}:${Math.round(H / divisor)}` : '—';
  const decimal = W && H ? (W / H).toFixed(4) : '—';

  const presets = [
    ['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080],
    ['4:3', 1440, 1080], ['3:2', 1500, 1000], ['21:9', 2560, 1080],
  ] as const;

  return (
    <ToolShell title="Calculadora de Aspect Ratio" description="Redimensione mantendo proporção perfeita">
      <div className="mb-4 flex flex-wrap gap-2">
        {presets.map(([label, w, h]) => (
          <button
            key={label}
            onClick={() => { setLargura(String(w)); setAltura(String(h)); }}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${W === w && H === h ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            {label} <span className="opacity-60">{w}×{h}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Largura original (px)" id="ar-w"><TextInput id="ar-w" inputMode="decimal" value={largura} onChange={(e) => setLargura(e.target.value)} /></Field>
        <Field label="Altura original (px)" id="ar-h"><TextInput id="ar-h" inputMode="decimal" value={altura} onChange={(e) => setAltura(e.target.value)} /></Field>
        <div className="sm:col-span-2 flex gap-2">
          <button onClick={() => setCampo('altura')} className={`rounded-lg border px-3 text-xs transition-all ${campo === 'altura' ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground'}`}>Descobrir altura</button>
          <button onClick={() => setCampo('largura')} className={`rounded-lg border px-3 text-xs transition-all ${campo === 'largura' ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground'}`}>Descobrir largura</button>
        </div>
        <Field label={campo === 'altura' ? 'Nova largura (px)' : 'Nova altura (px)'} id="ar-n"><TextInput id="ar-n" inputMode="decimal" value={novoValor} onChange={(e) => setNovoValor(e.target.value)} /></Field>
        <div className="flex items-end">
          <ResultCard label={campo === 'altura' ? 'Altura proporcional' : 'Largura proporcional'} value={resultado ? `${Math.round(resultado)} px` : '—'} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ResultCard label="Proporção simplificada" value={ratioStr} tone="neutral" />
        <ResultCard label="Decimal" value={decimal} tone="neutral" />
      </div>
    </ToolShell>
  );
}
