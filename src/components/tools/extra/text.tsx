'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { ToolShell, Field, TextInput, ResultCard } from './shell';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/helpers';
import { Copy, Play, Pause, Square, Trash2, Wand2, Volume2, Link2 } from 'lucide-react';

/* ================= Contador de Caracteres ================= */
export function ContadorTool() {
  const [texto, setTexto] = useState('');

  const stats = useMemo(() => {
    const chars = texto.length;
    const charsSemEspaco = texto.replace(/\s/g, '').length;
    const palavras = texto.trim() ? texto.trim().split(/\s+/).length : 0;
    const frases = texto.split(/[.!?]+\s|\.$/).filter((s) => s.trim()).length;
    const paragrafos = texto.split(/\n+/).filter((s) => s.trim()).length;
    const leituraMin = palavras / 200; // 200 ppm média
    const tempo = leituraMin < 1 ? `${Math.round(leituraMin * 60)}s` : leituraMin < 60 ? `${Math.round(leituraMin)}min` : `${Math.floor(leituraMin / 60)}h ${Math.round(leituraMin % 60)}min`;
    return { chars, charsSemEspaco, palavras, frases, paragrafos, tempo };
  }, [texto]);

  const cards = [
    ['Caracteres', stats.chars.toLocaleString('pt-BR')],
    ['Sem espaços', stats.charsSemEspaco.toLocaleString('pt-BR')],
    ['Palavras', stats.palavras.toLocaleString('pt-BR')],
    ['Frases', stats.frases.toLocaleString('pt-BR')],
    ['Parágrafos', stats.paragrafos.toLocaleString('pt-BR')],
    ['Leitura', stats.tempo],
  ] as const;

  return (
    <ToolShell title="Contador de Palavras e Caracteres" description="Métricas ao vivo enquanto você digita">
      <Textarea
        value={texto} onChange={(e) => setTexto(e.target.value)} className="min-h-44"
        placeholder="Cole ou digite seu texto aqui — Instagram (2.200), X/Twitter (280), meta description SEO (160)…"
      />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map(([label, v]) => (
          <div key={label} className="rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-center">
            <p className="font-display text-xl font-bold text-primary">{v}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      {stats.chars > 2200 && (
        <p className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
          ⚠️ Passou do limite de 2.200 caracteres do Instagram ({stats.chars - 2200} caracteres acima).
        </p>
      )}
    </ToolShell>
  );
}

/* ================= Lorem Ipsum ================= */
const PALAVRAS = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'];

export function LoremTool() {
  const [qtd, setQtd] = useState(3);
  const [tipo, setTipo] = useState<'paragrafos' | 'frases' | 'palavras'>('paragrafos');
  const [resultado, setResultado] = useState('');
  const { toast } = useToast();

  const gerar = () => {
    const rnd = () => PALAVRAS[Math.floor(Math.random() * PALAVRAS.length)];
    const frase = () => {
      const len = 8 + Math.floor(Math.random() * 12);
      const words = Array.from({ length: len }, rnd);
      return words[0][0].toUpperCase() + words[0].slice(1) + ' ' + words.slice(1).join(' ') + '.';
    };
    let out = '';
    if (tipo === 'palavras') out = Array.from({ length: qtd }, rnd).join(' ');
    else if (tipo === 'frases') out = Array.from({ length: qtd }, frase).join(' ');
    else out = Array.from({ length: qtd }, () => Array.from({ length: 4 + Math.floor(Math.random() * 3) }, frase).join(' ')).join('\n\n');
    setResultado(out);
  };

  return (
    <ToolShell title="Gerador Lorem Ipsum" description="Texto fictício para protótipos, wireframes e testes de layout">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo" id="lp-tipo">
          <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
            <SelectTrigger id="lp-tipo" className="h-11 mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="paragrafos">Parágrafos</SelectItem>
              <SelectItem value="frases">Frases</SelectItem>
              <SelectItem value="palavras">Palavras</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label={`Quantidade: ${qtd}`} id="lp-qtd">
          <Slider value={[qtd]} min={1} max={20} step={1} onValueChange={([v]) => setQtd(v)} className="mt-3" />
        </Field>
      </div>
      <div className="mt-4 flex gap-2">
        <Button onClick={gerar} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Wand2 className="h-4 w-4" /> Gerar texto
        </Button>
        {resultado && (
          <Button
            variant="outline" className="gap-2"
            onClick={async () => { const ok = await copyToClipboard(resultado); toast({ title: ok ? 'Copiado!' : 'Erro' }); }}
          >
            <Copy className="h-4 w-4" /> Copiar
          </Button>
        )}
      </div>
      {resultado && (
        <div className="mt-4 whitespace-pre-wrap rounded-xl border border-border bg-secondary/30 p-4 text-sm leading-relaxed text-foreground/85">
          {resultado}
        </div>
      )}
    </ToolShell>
  );
}

/* ================= Narrador (TTS) ================= */
export function NarradorTool() {
  const [texto, setTexto] = useState('');
  const [falando, setFalando] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [vozIdx, setVozIdx] = useState(0);
  const [rate, setRate] = useState(1);
  const [vozes, setVozes] = useState<SpeechSynthesisVoice[]>([]);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis?.getVoices?.() ?? [];
      const pt = all.filter((v) => v.lang.toLowerCase().startsWith('pt'));
      setVozes(pt.length ? pt : all.slice(0, 10));
    };
    load();
    window.speechSynthesis?.addEventListener?.('voiceschanged', load);
    return () => {
      window.speechSynthesis?.removeEventListener?.('voiceschanged', load);
      window.speechSynthesis?.cancel?.();
    };
  }, []);

  const falar = () => {
    if (!('speechSynthesis' in window)) return toast({ title: 'Seu navegador não suporta síntese de voz', variant: 'destructive' });
    if (!texto.trim()) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    if (vozes[vozIdx]) u.voice = vozes[vozIdx];
    u.rate = rate;
    u.lang = vozes[vozIdx]?.lang ?? 'pt-BR';
    u.onend = () => { setFalando(false); setPausado(false); };
    utterRef.current = u;
    window.speechSynthesis.speak(u);
    setFalando(true);
  };

  const pausar = () => {
    if (pausado) { window.speechSynthesis.resume(); setPausado(false); }
    else { window.speechSynthesis.pause(); setPausado(true); }
  };

  const parar = () => {
    window.speechSynthesis.cancel();
    setFalando(false);
    setPausado(false);
  };

  return (
    <ToolShell title="Narrador Digital" description="Transforme texto em voz natural — nativo do seu navegador, sem upload">
      <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} className="min-h-40" placeholder="Cole um artigo, post ou qualquer texto para ouvir…" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Voz" id="tts-voz">
          <Select value={String(vozIdx)} onValueChange={(v) => setVozIdx(Number(v))}>
            <SelectTrigger id="tts-voz" className="h-11 mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              {vozes.map((v, i) => <SelectItem key={v.name} value={String(i)}>{v.name}</SelectItem>)}
              {vozes.length === 0 && <SelectItem value="0">Voz padrão</SelectItem>}
            </SelectContent>
          </Select>
        </Field>
        <Field label={`Velocidade: ${rate.toFixed(1)}x`} id="tts-rate">
          <Slider value={[rate]} min={0.5} max={2} step={0.1} onValueChange={([v]) => setRate(v)} className="mt-4" />
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {!falando ? (
          <Button onClick={falar} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"><Play className="h-4 w-4" /> Ouvir texto</Button>
        ) : (
          <>
            <Button onClick={pausar} variant="outline" className="gap-2">{pausado ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />} {pausado ? 'Continuar' : 'Pausar'}</Button>
            <Button onClick={parar} variant="outline" className="gap-2 text-destructive hover:text-destructive"><Square className="h-4 w-4" /> Parar</Button>
          </>
        )}
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Volume2 className="h-3.5 w-3.5" /> {texto.length} caracteres</span>
      </div>
    </ToolShell>
  );
}

/* ================= Removedor de Linhas Duplicadas ================= */
export function DuplicadasTool() {
  const [texto, setTexto] = useState('');
  const [ignorarCase, setIgnorarCase] = useState(true);
  const [trimEspacos, setTrimEspacos] = useState(true);
  const [ordenar, setOrdenar] = useState(false);
  const { toast } = useToast();

  const { linhas, antes, depois } = useMemo(() => {
    const orig = texto.split('\n');
    const norm = orig.map((l) => {
      let v = l;
      if (trimEspacos) v = v.trim();
      return v;
    }).filter((l) => l !== '');
    const seen = new Set<string>();
    const out: string[] = [];
    for (const l of norm) {
      const key = ignorarCase ? l.toLowerCase() : l;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(l);
      }
    }
    if (ordenar) out.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return { linhas: out, antes: orig.filter((l) => l.trim()).length, depois: out.length };
  }, [texto, ignorarCase, trimEspacos, ordenar]);

  return (
    <ToolShell title="Removedor de Linhas Duplicadas" description="Purifique listas de e-mails, dados ou palavras-chave em um clique">
      <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} className="min-h-44 font-mono text-sm" placeholder="Cole sua lista aqui — milhares de linhas processam instantaneamente…" />
      <div className="mt-4 flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm"><Switch checked={ignorarCase} onCheckedChange={setIgnorarCase} /> Ignorar maiúsculas/minúsculas</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={trimEspacos} onCheckedChange={setTrimEspacos} /> Remover espaços extras</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={ordenar} onCheckedChange={setOrdenar} /> Ordenar A→Z</label>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ResultCard label="Linhas originais" value={antes.toLocaleString('pt-BR')} tone="neutral" />
        <ResultCard label="Linhas únicas" value={depois.toLocaleString('pt-BR')} tone="green" />
        <ResultCard label="Removidas" value={(antes - depois).toLocaleString('pt-BR')} tone="red" />
      </div>
      {linhas.length > 0 && (
        <div className="mt-4">
          <Textarea readOnly value={linhas.join('\n')} className="min-h-36 font-mono text-xs" />
          <Button
            className="mt-2 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={async () => { const ok = await copyToClipboard(linhas.join('\n')); toast({ title: ok ? 'Lista copiada!' : 'Erro' }); }}
          >
            <Copy className="h-4 w-4" /> Copiar lista limpa
          </Button>
        </div>
      )}
    </ToolShell>
  );
}

/* ================= Gerador de Slug ================= */
export function SlugTool() {
  const { toast } = useToast();
  const [titulo, setTitulo] = useState('');
  const [separador, setSeparador] = useState<'-' | '_'>('-');

  const slug = useMemo(() => {
    return titulo
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/[\s_]+/g, separador)
      .replace(new RegExp(`\\${separador}{2,}`, 'g'), separador)
      .replace(new RegExp(`^\\${separador}+|\\${separador}+$`, 'g'), '');
  }, [titulo, separador]);

  return (
    <ToolShell title="Gerador de Slug de URL" description="Transforme títulos em URLs limpas e amigáveis para SEO">
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <Field label="Título do post / página" id="slug-t"><TextInput id="slug-t" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="10 Dicas para Vender mais em 2026!" /></Field>
        <Field label="Separador" id="slug-s">
          <Select value={separador} onValueChange={(v) => setSeparador(v as '-' | '_')}>
            <SelectTrigger id="slug-s" className="h-11 mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="-">Hífen (-)</SelectItem><SelectItem value="_">Underline (_)</SelectItem></SelectContent>
          </Select>
        </Field>
      </div>
      <div className="mt-5 rounded-xl border border-primary/40 bg-primary/10 p-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Slug gerado</p>
        <p className="mt-1 break-all font-mono text-lg font-semibold text-primary">{slug || '—'}</p>
        {slug && (
          <Button
            size="sm" variant="outline" className="mt-3 gap-1.5"
            onClick={async () => { const ok = await copyToClipboard(slug); toast({ title: ok ? 'Slug copiado!' : 'Erro' }); }}
          >
            <Link2 className="h-3.5 w-3.5" /> Copiar slug
          </Button>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-secondary/40 px-3 py-2 text-center"><p className="font-display font-bold text-primary">{titulo.length}</p><p className="text-[10px] text-muted-foreground">caracteres originais</p></div>
        <div className="rounded-lg bg-secondary/40 px-3 py-2 text-center"><p className="font-display font-bold text-primary">{slug.length}</p><p className="text-[10px] text-muted-foreground">caracteres do slug</p></div>
        <div className="rounded-lg bg-secondary/40 px-3 py-2 text-center"><p className="font-display font-bold text-primary">{slug ? slug.split('-').filter(Boolean).length : 0}</p><p className="text-[10px] text-muted-foreground">palavras</p></div>
        <div className="rounded-lg bg-secondary/40 px-3 py-2 text-center"><p className="font-display font-bold text-whats">{slug.length <= 75 ? '✓' : '⚠'}</p><p className="text-[10px] text-muted-foreground">SEO (≤75)</p></div>
      </div>
    </ToolShell>
  );
}

/* ================= Construtor UTM ================= */
export function UtmTool() {
  const [url, setUrl] = useState('https://clickgruda.vercel.app');
  const [source, setSource] = useState('instagram');
  const [medium, setMedium] = useState('social');
  const [campaign, setCampaign] = useState('');
  const [term, setTerm] = useState('');
  const [content, setContent] = useState('');
  const { toast } = useToast();

  const final = useMemo(() => {
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      if (source) u.searchParams.set('utm_source', source.toLowerCase());
      if (medium) u.searchParams.set('utm_medium', medium.toLowerCase());
      if (campaign) u.searchParams.set('utm_campaign', campaign.toLowerCase().replace(/\s+/g, '-'));
      if (term) u.searchParams.set('utm_term', term.toLowerCase().replace(/\s+/g, '-'));
      if (content) u.searchParams.set('utm_content', content.toLowerCase().replace(/\s+/g, '-'));
      return u.toString();
    } catch {
      return '';
    }
  }, [url, source, medium, campaign, term, content]);

  return (
    <ToolShell title="Construtor de Links UTM" description="Rastreie de onde vem cada clique no Google Analytics, Meta Ads e mais">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="URL da página" id="utm-url"><TextInput id="utm-url" value={url} onChange={(e) => setUrl(e.target.value)} /></Field>
        </div>
        <Field label="utm_source *" id="utm-src" hint="De onde vem: instagram, facebook, newsletter…"><TextInput id="utm-src" value={source} onChange={(e) => setSource(e.target.value)} /></Field>
        <Field label="utm_medium *" id="utm-mdm" hint="Tipo: social, cpc, email, bio…"><TextInput id="utm-mdm" value={medium} onChange={(e) => setMedium(e.target.value)} /></Field>
        <Field label="utm_campaign" id="utm-camp" hint="Ex: black-friday-2026"><TextInput id="utm-camp" value={campaign} onChange={(e) => setCampaign(e.target.value)} /></Field>
        <Field label="utm_content" id="utm-cont" hint="Ex: story-1, link-bio"><TextInput id="utm-cont" value={content} onChange={(e) => setContent(e.target.value)} /></Field>
      </div>
      {final && (
        <div className="mt-5 rounded-xl border border-whats/40 bg-whats/10 p-4">
          <p className="mb-1 text-[11px] uppercase tracking-wider text-whats">Link rastreável pronto</p>
          <p className="break-all font-mono text-sm text-foreground">{final}</p>
          <Button
            size="sm" className="mt-3 gap-1.5 bg-whats text-white hover:bg-whats/90"
            onClick={async () => { const ok = await copyToClipboard(final); toast({ title: ok ? 'Link UTM copiado!' : 'Erro' }); }}
          >
            <Copy className="h-3.5 w-3.5" /> Copiar link
          </Button>
        </div>
      )}
    </ToolShell>
  );
}

// remoção de import não utilizado
void Trash2;
