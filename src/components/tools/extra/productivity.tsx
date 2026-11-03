'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ToolShell, Field, TextInput, ResultCard } from './shell';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { confetti } from '@/lib/confetti';
import { Play, Pause, RotateCcw, Coffee, Timer, AlarmClock } from 'lucide-react';

/* ================= Timer Pomodoro ================= */
const MODO = {
  foco: { label: 'Foco', min: 25, cor: '#e8703a' },
  curto: { label: 'Pausa curta', min: 5, cor: '#25d366' },
  longo: { label: 'Pausa longa', min: 15, cor: '#f2b56b' },
} as const;
type ModoId = keyof typeof MODO;

export function PomodoroTool() {
  const [modo, setModo] = useState<ModoId>('foco');
  const [restante, setRestante] = useState(MODO.foco.min * 60);
  const [rodando, setRodando] = useState(false);
  const [ciclos, setCiclos] = useState(0);
  const { toast } = useToast();
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const trocarModo = (m: ModoId, auto = false) => {
    setModo(m);
    setRestante(MODO[m].min * 60);
    if (!auto) setRodando(false);
  };

  useEffect(() => {
    if (!rodando) return;
    ivRef.current = setInterval(() => {
      setRestante((r) => {
        if (r <= 1) {
          clearInterval(ivRef.current!);
          setRodando(false);
          confetti(2200, 90);
          if (modo === 'foco') {
            const novo = ciclos + 1;
            setCiclos(novo);
            toast({ title: '🎉 Ciclo completo!', description: novo % 4 === 0 ? 'Hora da pausa longa — você merece!' : 'Faça a pausa curta de 5 minutos.' });
            setTimeout(() => trocarModo(novo % 4 === 0 ? 'longo' : 'curto', true), 400);
          } else {
            toast({ title: 'Pausa finalizada', description: 'De volta ao foco! 💪' });
            setTimeout(() => trocarModo('foco', true), 400);
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (ivRef.current) clearInterval(ivRef.current); };
     
  }, [rodando, modo, ciclos]);

  const total = MODO[modo].min * 60;
  const pct = ((total - restante) / total) * 100;
  const mm = String(Math.floor(restante / 60)).padStart(2, '0');
  const ss = String(restante % 60).padStart(2, '0');
  const cor = MODO[modo].cor;
  const circ = 2 * Math.PI * 88;

  return (
    <ToolShell title="Timer Pomodoro" description="25min de foco · 5min de pausa · a cada 4 ciclos, 15min de pausa longa">
      <div className="flex justify-center gap-2">
        {(Object.keys(MODO) as ModoId[]).map((m) => (
          <button
            key={m}
            onClick={() => trocarModo(m)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${modo === m ? 'text-white' : 'border-border text-muted-foreground hover:text-foreground'}`}
            style={modo === m ? { background: cor, borderColor: cor } : undefined}
          >
            {MODO[m].label}
          </button>
        ))}
      </div>

      <div className="relative mx-auto mt-8 h-56 w-56">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
          <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(243,237,228,0.08)" strokeWidth="10" />
          <circle
            cx="100" cy="100" r="88" fill="none" stroke={cor} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
            className="transition-all duration-1000"
            style={{ filter: `drop-shadow(0 0 8px ${cor}66)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-display text-5xl font-bold tabular-nums">{mm}:{ss}</p>
          <p className="mt-1 text-xs text-muted-foreground">{rodando ? MODO[modo].label + ' em andamento' : 'pausado'}</p>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        <Button onClick={() => setRodando(!rodando)} className="gap-2 text-white" style={{ background: cor }}>
          {rodando ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {rodando ? 'Pausar' : 'Iniciar'}
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => trocarModo(modo)}>
          <RotateCcw className="h-4 w-4" /> Reiniciar
        </Button>
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i} className={`h-2.5 w-8 rounded-full transition-colors ${i < ciclos % 4 || (ciclos > 0 && ciclos % 4 === 0) ? 'bg-primary' : 'bg-secondary'}`} />
        ))}
        <span className="ml-2 text-xs text-muted-foreground">{ciclos} pomodoros hoje nesta sessão</span>
      </div>
    </ToolShell>
  );
}

/* ================= Cronômetro ================= */
export function CronometroTool() {
  const [ms, setMs] = useState(0);
  const [rodando, setRodando] = useState(false);
  const [voltas, setVoltas] = useState<{ tempo: number; delta: number }[]>([]);
  const startRef = useRef(0);
  const accRef = useRef(0);
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (rodando) {
      startRef.current = performance.now();
      ivRef.current = setInterval(() => {
        setMs(accRef.current + (performance.now() - startRef.current));
      }, 33);
    } else if (ivRef.current) {
      clearInterval(ivRef.current);
    }
    return () => { if (ivRef.current) clearInterval(ivRef.current); };
  }, [rodando]);

  const parar = () => {
    accRef.current += performance.now() - startRef.current;
    setRodando(false);
  };
  const zerar = () => { parar(); accRef.current = 0; setMs(0); setVoltas([]); };
  const volta = () => {
    const anterior = voltas[0]?.tempo ?? 0;
    setVoltas([{ tempo: ms, delta: ms - anterior }, ...voltas]);
  };

  const fmt = (t: number) => {
    const h = Math.floor(t / 3600000);
    const m = Math.floor((t % 3600000) / 60000);
    const s = Math.floor((t % 60000) / 1000);
    const cs = Math.floor((t % 1000) / 10);
    return `${h > 0 ? `${String(h).padStart(2, '0')}:` : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };

  return (
    <ToolShell title="Cronômetro Online" description="Precisão de centésimos com registro de voltas">
      <div className="text-center">
        <p className="font-display text-6xl font-bold tabular-nums text-primary sm:text-7xl">{fmt(ms)}</p>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={() => (rodando ? parar() : setRodando(true))} className="w-28 gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          {rodando ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {rodando ? 'Parar' : ms > 0 ? 'Continuar' : 'Iniciar'}
        </Button>
        <Button onClick={volta} disabled={!rodando} variant="outline" className="gap-2"><AlarmClock className="h-4 w-4" /> Volta</Button>
        <Button onClick={zerar} variant="outline" className="gap-2 text-destructive hover:text-destructive"><RotateCcw className="h-4 w-4" /> Zerar</Button>
      </div>
      {voltas.length > 0 && (
        <div className="thin-scroll mt-6 max-h-56 overflow-y-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-secondary">
              <tr className="text-muted-foreground"><th className="px-4 py-2 text-left font-semibold">Volta</th><th className="px-4 py-2 text-right font-semibold">Tempo total</th><th className="px-4 py-2 text-right font-semibold">Diferença</th></tr>
            </thead>
            <tbody>
              {voltas.map((v, i) => (
                <tr key={i} className="border-t border-border/60">
                  <td className="px-4 py-2 font-semibold text-primary">#{voltas.length - i}</td>
                  <td className="px-4 py-2 text-right font-mono">{fmt(v.tempo)}</td>
                  <td className="px-4 py-2 text-right font-mono text-whats">+{fmt(v.delta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ToolShell>
  );
}

/* ================= Calculadora de Render 3D ================= */
export function TempoRenderTool() {
  const [frames, setFrames] = useState('240');
  const [minPorFrame, setMinPorFrame] = useState('2.5');
  const [maquinas, setMaquinas] = useState('1');
  const [custoHora, setCustoHora] = useState('5');

  const totalMin = (Number(frames) * parseFloat(minPorFrame.replace(',', '.'))) / Math.max(1, Number(maquinas));
  const horas = totalMin / 60;
  const custo = horas * (parseFloat(custoHora.replace(',', '.')) || 0);

  const fmtDur = (h: number) => {
    if (h < 1) return `${Math.round(h * 60)} min`;
    if (h < 24) return `${h.toFixed(1)} horas`;
    return `${Math.floor(h / 24)}d ${Math.round(h % 24)}h`;
  };

  return (
    <ToolShell title="Calculadora de Tempo de Render 3D" description="Estime prazos e custos de renderização para orçar seus projetos">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Frames" id="rd-f"><TextInput id="rd-f" inputMode="numeric" value={frames} onChange={(e) => setFrames(e.target.value.replace(/\D/g, ''))} /></Field>
        <Field label="Minutos por frame" id="rd-mf" hint="Faça um teste com 1 frame"><TextInput id="rd-mf" inputMode="decimal" value={minPorFrame} onChange={(e) => setMinPorFrame(e.target.value)} /></Field>
        <Field label="Máquinas em paralelo" id="rd-m"><TextInput id="rd-m" inputMode="numeric" value={maquinas} onChange={(e) => setMaquinas(e.target.value.replace(/\D/g, ''))} /></Field>
        <Field label="Custo por hora (R$)" id="rd-c" hint="Farma/render cloud, energia…"><TextInput id="rd-c" inputMode="decimal" value={custoHora} onChange={(e) => setCustoHora(e.target.value)} /></Field>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <ResultCard label="Tempo total" value={fmtDur(horas)} big />
        <ResultCard label="Em dias úteis (8h)" value={`${(horas / 8).toFixed(1)} dias`} tone="neutral" />
        <ResultCard label="Custo estimado" value={`R$ ${custo.toFixed(2).replace('.', ',')}`} tone="red" />
      </div>
    </ToolShell>
  );
}

/* ================= Calculadora de VRAM ================= */
export function VramTool() {
  const [resX, setResX] = useState('4096');
  const [resY, setResY] = useState('4096');
  const [bits, setBits] = useState('32');
  const [canais, setCanais] = useState('4');
  const [mipmaps, setMipmaps] = useState(true);
  const [texturas, setTexturas] = useState('12');

  const w = Number(resX) || 0, h = Number(resY) || 0, b = Number(bits) || 0, c = Number(canais) || 1, n = Number(texturas) || 1;
  const bytesUma = (w * h * b / 8) * c * (mipmaps ? 1.333 : 1);
  const mb = (bytesUma * n) / (1024 * 1024);
  const gb = mb / 1024;

  return (
    <ToolShell title="Calculadora de VRAM para Texturas" description="Quanto de memória de vídeo suas texturas consomem">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Field label="Resolução X" id="vr-x"><TextInput id="vr-x" inputMode="numeric" value={resX} onChange={(e) => setResX(e.target.value.replace(/\D/g, ''))} /></Field>
        <Field label="Resolução Y" id="vr-y"><TextInput id="vr-y" inputMode="numeric" value={resY} onChange={(e) => setResY(e.target.value.replace(/\D/g, ''))} /></Field>
        <Field label="Canais" id="vr-c" hint="RGBA = 4">
          <Select value={canais} onValueChange={setCanais}>
            <SelectTrigger id="vr-c" className="h-11 mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="1">R (1)</SelectItem><SelectItem value="2">RG (2)</SelectItem><SelectItem value="3">RGB (3)</SelectItem><SelectItem value="4">RGBA (4)</SelectItem></SelectContent>
          </Select>
        </Field>
        <Field label="Bits por canal" id="vr-b">
          <Select value={bits} onValueChange={setBits}>
            <SelectTrigger id="vr-b" className="h-11 mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="8">8-bit</SelectItem><SelectItem value="16">16-bit (HDR)</SelectItem><SelectItem value="32">32-bit float</SelectItem></SelectContent>
          </Select>
        </Field>
        <Field label="Qtd. de texturas" id="vr-n"><TextInput id="vr-n" inputMode="numeric" value={texturas} onChange={(e) => setTexturas(e.target.value.replace(/\D/g, ''))} /></Field>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={mipmaps} onChange={(e) => setMipmaps(e.target.checked)} className="h-4 w-4 accent-[#e8703a]" />
        Incluir mipmaps (+33%)
      </label>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <ResultCard label="Por textura" value={`${(bytesUma / (1024 * 1024)).toFixed(1)} MB`} tone="neutral" />
        <ResultCard label="Total estimado" value={gb >= 1 ? `${gb.toFixed(2)} GB` : `${mb.toFixed(0)} MB`} big tone={gb > 4 ? 'red' : 'brand'} />
        <ResultCard label="Recomendação GPU" value={gb > 10 ? '16GB+' : gb > 4 ? '8-12GB' : gb > 2 ? '6-8GB' : '4-6GB'} tone="green" />
      </div>
    </ToolShell>
  );
}

/* ================= Conversor de Unidades 3D ================= */
const ESCALAS = [
  { id: 'blender', label: 'Blender → mundo real', fator: 1, unidadeOrigem: 'unidade = 1 metro' },
  { id: 'zbrush', label: 'ZBrush → mundo real', fator: 0.01, unidadeOrigem: 'unidade ≈ 1 cm' },
  { id: 'sketchup', label: 'SketchUp → mundo real', fator: 0.0254, unidadeOrigem: 'unidade = 1 polegada' },
  { id: 'ue5', label: 'Unreal Engine 5 → metros', fator: 0.01, unidadeOrigem: 'unidade = 1 cm' },
  { id: 'unity', label: 'Unity → metros', fator: 1, unidadeOrigem: 'unidade = 1 metro' },
  { id: 'cad-mm', label: 'CAD (mm) → metros', fator: 0.001, unidadeOrigem: 'unidade = 1 mm' },
] as const;

export function Unidades3dTool() {
  const [software, setSoftware] = useState<string>('blender');
  const [valor, setValor] = useState('1.8');
  const [destino, setDestino] = useState<'m' | 'cm' | 'mm' | 'pol'>('cm');

  const esc = ESCALAS.find((e) => e.id === software) ?? ESCALAS[0];
  const metros = (parseFloat(valor.replace(',', '.')) || 0) * esc.fator;
  const out = {
    m: metros, cm: metros * 100, mm: metros * 1000,
    pol: metros * 39.3700787,
  }[destino];

  const unLabel = { m: 'metros', cm: 'cm', mm: 'mm', pol: 'polegadas' }[destino];

  return (
    <ToolShell title="Conversor de Unidades 3D" description="Traduza medidas entre softwares 3D e o mundo real — ideal para impressão 3D e produção">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Software de origem" id="u3d-sw">
          <Select value={software} onValueChange={setSoftware}>
            <SelectTrigger id="u3d-sw" className="h-11 mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>{ESCALAS.map((e) => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label={`Valor em ${esc.unidadeOrigem}`} id="u3d-v"><TextInput id="u3d-v" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} /></Field>
        <Field label="Converter para" id="u3d-d">
          <Select value={destino} onValueChange={(v) => setDestino(v as typeof destino)}>
            <SelectTrigger id="u3d-d" className="h-11 mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="m">Metros (m)</SelectItem>
              <SelectItem value="cm">Centímetros (cm)</SelectItem>
              <SelectItem value="mm">Milímetros (mm)</SelectItem>
              <SelectItem value="pol">Polegadas (")</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="mt-5">
        <ResultCard label={`Equivale a`} value={`${out.toLocaleString('pt-BR', { maximumFractionDigits: 4 })} ${unLabel}`} big />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['m', 'cm', 'mm', 'pol'] as const).map((u) => (
          <div key={u} className={`rounded-lg border px-3 py-2 text-center ${u === destino ? 'border-primary/40 bg-primary/10' : 'border-border bg-secondary/40'}`}>
            <p className="font-display font-bold text-primary">{out && u === destino ? '' : ''}{({ m: metros, cm: metros * 100, mm: metros * 1000, pol: metros * 39.3700787 })[u].toLocaleString('pt-BR', { maximumFractionDigits: 3 })}</p>
            <p className="text-[10px] text-muted-foreground">{({ m: 'metros', cm: 'cm', mm: 'mm', pol: 'polegadas' })[u]}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
        <Coffee className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        Dica para canecas e produtos: 1 unidade do Blender = 1 metro real. Uma caneca de 350ml tem ≈ 0.095m de altura no Blender.
      </p>
    </ToolShell>
  );
}

void Timer;
