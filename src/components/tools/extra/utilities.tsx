'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { confetti } from '@/lib/confetti';
import { ToolShell, Field, TextInput, ResultCard, SectionBox } from './shell';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard, downloadBlob } from '@/lib/helpers';
import JsBarcode from 'jsbarcode';
import { Dices, Copy, CheckCircle2, Loader2, Download, RefreshCcw } from 'lucide-react';

const num = (s: string) => {
  const v = parseFloat(s.replace(/\./g, '').replace(',', '.'));
  return isNaN(v) ? 0 : v;
};

/* ================= Sorteador ================= */
export function SorteadorTool() {
  const [modo, setModo] = useState<'numero' | 'nomes'>('numero');
  const [min, setMin] = useState('1');
  const [max, setMax] = useState('100');
  const [qtd, setQtd] = useState('1');
  const [permitirRep, setPermitirRep] = useState(false);
  const [resultado, setResultado] = useState<number[]>([]);
  const [nomes, setNomes] = useState('');
  const [sorteado, setSorteado] = useState<string | null>(null);
  const [girando, setGirando] = useState(false);
  const { toast } = useToast();

  const sortearNumeros = () => {
    const lo = Math.ceil(num(min)), hi = Math.floor(num(max));
    const q = Math.max(1, Math.min(100, Number(qtd) || 1));
    if (hi <= lo) return toast({ title: 'O máximo deve ser maior que o mínimo', variant: 'destructive' });
    const set = new Set<number>();
    const out: number[] = [];
    if (!permitirRep && hi - lo + 1 < q) return toast({ title: 'Intervalo pequeno demais para essa quantidade', variant: 'destructive' });
    while (out.length < q) {
      const n = Math.floor(Math.random() * (hi - lo + 1)) + lo;
      if (permitirRep || !set.has(n)) {
        if (!set.has(n)) set.add(n);
        out.push(n);
        if (out.length >= q) break;
      }
    }
    setResultado(out);
  };

  const sortearNome = () => {
    const list = nomes.split('\n').map((s) => s.trim()).filter(Boolean);
    if (list.length < 2) return toast({ title: 'Adicione pelo menos 2 nomes', variant: 'destructive' });
    setGirando(true);
    let ticks = 0;
    const iv = setInterval(() => {
      setSorteado(list[Math.floor(Math.random() * list.length)]);
      ticks++;
      if (ticks > 18) {
        clearInterval(iv);
        setGirando(false);
        confettiBurst();
      }
    }, 90);
  };

  const confettiBurst = () => confetti();

  return (
    <ToolShell title="Sorteador Aleatório" description="Números para rifas ou nomes para sorteios justos">
      <div className="mb-5 flex gap-2">
        {([['numero', '🔢 Números'], ['nomes', '🎯 Nomes']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setModo(id)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-95 ${
              modo === id ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {modo === 'numero' ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Mínimo" id="sr-min"><TextInput id="sr-min" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))} /></Field>
            <Field label="Máximo" id="sr-max"><TextInput id="sr-max" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))} /></Field>
            <Field label="Quantidade" id="sr-q"><TextInput id="sr-q" inputMode="numeric" value={qtd} onChange={(e) => setQtd(e.target.value.replace(/\D/g, ''))} /></Field>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={permitirRep} onChange={(e) => setPermitirRep(e.target.checked)} className="h-4 w-4 accent-[#e8703a]" />
            Permitir números repetidos
          </label>
          <Button onClick={sortearNumeros} className="mt-4 gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Dices className="h-4 w-4" /> Sortear números
          </Button>
          {resultado.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {resultado.map((n, i) => (
                <span key={`${n}-${i}`} className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 font-display text-xl font-bold text-primary">
                  {n}
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <Field label="Nomes (um por linha)" id="sr-nomes">
            <Textarea id="sr-nomes" value={nomes} onChange={(e) => setNomes(e.target.value)} className="min-h-36 font-mono text-sm" placeholder={'Maria\nJoão\nAna\nPedro'} />
          </Field>
          <Button onClick={sortearNome} disabled={girando} className="mt-4 gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            {girando ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Dices className="h-4 w-4" />} Sortear nome
          </Button>
          {sorteado && (
            <div className="mt-5 rounded-2xl border border-whats/40 bg-whats/10 p-6 text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">O vencedor é:</p>
              <p className="font-display mt-1 text-3xl font-bold text-whats">{sorteado}</p>
            </div>
          )}
        </>
      )}
    </ToolShell>
  );
}

/* ================= Regra de 3 ================= */
export function RegraTresTool() {
  const [a, setA] = useState(''); const [b, setB] = useState('');
  const [c, setC] = useState(''); const [d, setD] = useState('');
  const [vazio, setVazio] = useState<'d' | 'b'>('d');

  const x = useMemo(() => {
    const A = num(a), B = num(b), C = num(c);
    if (vazio === 'd') return B > 0 && A > 0 ? (B * C) / A : NaN;
    return C > 0 && A > 0 ? (A * B) / C : NaN;
  }, [a, b, c, vazio]);

  return (
    <ToolShell title="Calculadora de Regra de 3" description="Preencha 3 valores e descubra o 4º">
      <div className="mb-4 flex gap-2">
        {([['d', 'Descobrir D'], ['b', 'Descobrir B']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setVazio(id)}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
              vazio === id ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Valor A" id="r3-a"><TextInput id="r3-a" inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} /></Field>
        <Field label="Valor B" id="r3-b">{vazio === 'b' ? <TextInput id="r3-b" disabled placeholder="? = X" className="opacity-50" /> : <TextInput id="r3-b" inputMode="decimal" value={b} onChange={(e) => setB(e.target.value)} />}</Field>
        <Field label="Valor C" id="r3-c"><TextInput id="r3-c" inputMode="decimal" value={c} onChange={(e) => setC(e.target.value)} /></Field>
        <Field label="Valor D" id="r3-d">{vazio === 'd' ? <TextInput id="r3-d" disabled placeholder="? = X" className="opacity-50" /> : <TextInput id="r3-d" inputMode="decimal" value={d} onChange={(e) => setD(e.target.value)} />}</Field>
      </div>
      {!isNaN(x) && x !== 0 && (
        <div className="mt-5">
          <ResultCard label="Resultado (X)" value={x.toLocaleString('pt-BR', { maximumFractionDigits: 4 })} big />
        </div>
      )}
    </ToolShell>
  );
}

/* ================= IMC + TMB ================= */
export function ImcTmbTool() {
  const [sexo, setSexo] = useState<'m' | 'f'>('m');
  const [peso, setPeso] = useState('70');
  const [altura, setAltura] = useState('1.70');
  const [idade, setIdade] = useState('30');
  const [atividade, setAtividade] = useState('1.375');

  const p = num(peso), a = num(altura), i = num(idade);
  const imc = a > 0 ? p / (a * a) : 0;
  const classImc =
    imc === 0 ? '—' : imc < 18.5 ? 'Abaixo do peso' : imc < 25 ? 'Peso normal' : imc < 30 ? 'Sobrepeso' : imc < 35 ? 'Obesidade grau I' : imc < 40 ? 'Obesidade grau II' : 'Obesidade grau III';
  const tmb =
    sexo === 'm' ? 88.36 + 13.4 * p + 4.8 * a * 100 - 5.7 * i : 447.6 + 9.2 * p + 3.1 * a * 100 - 4.3 * i;
  const get = tmb * num(atividade);

  return (
    <ToolShell title="Calculadora de IMC + TMB" description="Índice de Massa Corporal e gasto calórico diário estimado">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sexo" id="imc-sexo">
          <Select value={sexo} onValueChange={(v) => setSexo(v as 'm' | 'f')}>
            <SelectTrigger id="imc-sexo" className="h-11 mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="m">Masculino</SelectItem><SelectItem value="f">Feminino</SelectItem></SelectContent>
          </Select>
        </Field>
        <Field label="Idade" id="imc-idade"><TextInput id="imc-idade" inputMode="numeric" value={idade} onChange={(e) => setIdade(e.target.value.replace(/\D/g, ''))} /></Field>
        <Field label="Peso (kg)" id="imc-peso"><TextInput id="imc-peso" inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} /></Field>
        <Field label="Altura (m)" id="imc-alt" hint="Ex: 1.72"><TextInput id="imc-alt" inputMode="decimal" value={altura} onChange={(e) => setAltura(e.target.value)} /></Field>
        <div className="sm:col-span-2">
          <Field label="Nível de atividade" id="imc-atv">
            <Select value={atividade} onValueChange={setAtividade}>
              <SelectTrigger id="imc-atv" className="h-11 mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1.2">Sedentário (sem exercício)</SelectItem>
                <SelectItem value="1.375">Leve (1-3x/semana)</SelectItem>
                <SelectItem value="1.55">Moderado (3-5x/semana)</SelectItem>
                <SelectItem value="1.725">Intenso (6-7x/semana)</SelectItem>
                <SelectItem value="1.9">Atleta (2x por dia)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <ResultCard label="IMC" value={imc ? imc.toFixed(1) : '—'} big />
        <ResultCard label="Classificação" value={classImc} tone={imc >= 18.5 && imc < 25 ? 'green' : imc ? 'red' : 'neutral'} />
        <ResultCard label="Calorias p/ manter peso" value={`${Math.round(get)} kcal/dia`} tone="neutral" />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ResultCard label="TMB (repouso)" value={`${Math.round(tmb)} kcal`} tone="neutral" />
        <ResultCard label="Para emagrecer (-20%)" value={`${Math.round(get * 0.8)} kcal/dia`} tone="green" />
      </div>
    </ToolShell>
  );
}

/* ================= Bhaskara ================= */
export function BhaskaraTool() {
  const [a, setA] = useState('1'); const [b, setB] = useState('-3'); const [c, setC] = useState('2');
  const A = num(a), B = num(b), C = num(c);
  const delta = B * B - 4 * A * C;
  const x1 = delta >= 0 && A !== 0 ? (-B + Math.sqrt(delta)) / (2 * A) : null;
  const x2 = delta >= 0 && A !== 0 ? (-B - Math.sqrt(delta)) / (2 * A) : null;

  return (
    <ToolShell title="Equação do 2º Grau (Bhaskara)" description="Resolva ax² + bx + c = 0 com passo a passo">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="a" id="bh-a"><TextInput id="bh-a" inputMode="text" value={a} onChange={(e) => setA(e.target.value)} /></Field>
        <Field label="b" id="bh-b"><TextInput id="bh-b" inputMode="text" value={b} onChange={(e) => setB(e.target.value)} /></Field>
        <Field label="c" id="bh-c"><TextInput id="bh-c" inputMode="text" value={c} onChange={(e) => setC(e.target.value)} /></Field>
      </div>
      <div className="mt-5 space-y-3">
        <ResultCard label="Delta (Δ = b² - 4ac)" value={delta.toFixed(2)} tone={delta < 0 ? 'red' : 'brand'} />
        {delta < 0 ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-muted-foreground">
            Δ negativo → a equação <strong className="text-foreground">não tem raízes reais</strong>.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <ResultCard label="x₁ = (-b + √Δ) / 2a" value={x1!.toFixed(4).replace(/\.?0+$/, '')} tone="green" />
            <ResultCard label="x₂ = (-b - √Δ) / 2a" value={x2!.toFixed(4).replace(/\.?0+$/, '')} tone="green" />
          </div>
        )}
      </div>
    </ToolShell>
  );
}

/* ================= Tempo de Download ================= */
export function TempoDownloadTool() {
  const [tamanho, setTamanho] = useState('10');
  const [unidade, setUnidade] = useState<'MB' | 'GB'>('GB');
  const [velocidade, setVelocidade] = useState('100');

  const bytes = num(tamanho) * (unidade === 'GB' ? 1024 * 1024 * 1024 : 1024 * 1024);
  const mbps = num(velocidade);
  const segundos = mbps > 0 ? (bytes * 8) / (mbps * 1_000_000) : 0;

  const formatDur = (s: number) => {
    if (s < 1) return 'menos de 1s';
    if (s < 60) return `${Math.round(s)} segundos`;
    if (s < 3600) return `${Math.floor(s / 60)}min ${Math.round(s % 60)}s`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ${Math.round((s % 3600) / 60)}min`;
    return `${(s / 86400).toFixed(1)} dias`;
  };

  return (
    <ToolShell title="Tempo de Download" description="Quanto tempo real levará para baixar seu arquivo">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Tamanho do arquivo" id="td-t"><TextInput id="td-t" inputMode="decimal" value={tamanho} onChange={(e) => setTamanho(e.target.value)} /></Field>
        <Field label="Unidade" id="td-u">
          <Select value={unidade} onValueChange={(v) => setUnidade(v as 'MB' | 'GB')}>
            <SelectTrigger id="td-u" className="h-11 mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="MB">Megabytes (MB)</SelectItem><SelectItem value="GB">Gigabytes (GB)</SelectItem></SelectContent>
          </Select>
        </Field>
        <Field label="Velocidade (Mbps)" id="td-v"><TextInput id="td-v" inputMode="decimal" value={velocidade} onChange={(e) => setVelocidade(e.target.value)} /></Field>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <ResultCard label="Tempo estimado" value={formatDur(segundos)} big />
        <ResultCard label="Velocidade real típica" value={`≈ ${Math.round(mbps * 0.82)} Mbps`} tone="neutral" />
      </div>
    </ToolShell>
  );
}

/* ================= Consultor de CEP (ViaCEP) ================= */
interface CepData { logradouro?: string; bairro?: string; localidade?: string; uf?: string; ddd?: string; erro?: boolean }

export function CepTool() {
  const [cep, setCep] = useState('');
  const [data, setData] = useState<CepData | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const { toast } = useToast();

  const buscar = async () => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return setErro('Digite os 8 números do CEP');
    setErro('');
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const json = await res.json();
      if (json.erro) setErro('CEP não encontrado');
      else setData(json);
    } catch {
      setErro('Falha na consulta. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell title="Consultor de CEP" description="Rua, bairro, cidade, UF e DDD de qualquer CEP do Brasil (ViaCEP)">
      <div className="flex gap-2">
        <TextInput
          value={cep}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 8);
            setCep(v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v);
          }}
          placeholder="74000-000" inputMode="numeric"
        />
        <Button onClick={buscar} disabled={loading} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '🔍'} Buscar
        </Button>
      </div>
      {erro && <p className="mt-3 text-sm text-destructive">{erro}</p>}
      {data && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ResultCard label="Logradouro" value={data.logradouro || '—'} tone="neutral" />
          <ResultCard label="Bairro" value={data.bairro || '—'} tone="neutral" />
          <ResultCard label="Cidade / UF" value={`${data.localidade ?? '—'} / ${data.uf ?? '—'}`} />
          <ResultCard label="DDD" value={data.ddd || '—'} tone="green" />
        </div>
      )}
    </ToolShell>
  );
}

/* ================= Gerador de Código de Barras ================= */
export function BarcodeTool() {
  const { toast } = useToast();
  const [texto, setTexto] = useState('ClickGruda2026');
  const [tipo, setTipo] = useState('CODE128');
  const [erro, setErro] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const gerar = () => {
    if (!canvasRef.current) return;
    try {
      JsBarcode(canvasRef.current, texto, {
        format: tipo,
        width: 2.4,
        height: 110,
        displayValue: true,
        fontSize: 15,
        background: '#ffffff',
        lineColor: '#111111',
        margin: 12,
      });
      setErro('');
    } catch {
      setErro(`Texto inválido para o formato ${tipo}. EAN-13 pede 12-13 dígitos; UPC 11-12; EAN-8: 7-8; ITF-14: 13-14.`);
    }
  };

  useEffect(() => {
    gerar();
     
  }, [texto, tipo]);

  const baixar = () => {
    if (!canvasRef.current || erro) return;
    canvasRef.current.toBlob((b) => b && downloadBlob(b, `codigo-barras-${Date.now()}.png`));
    toast({ title: 'Código de barras baixado!' });
  };

  return (
    <ToolShell title="Gerador de Código de Barras" description="CODE128, EAN-13, EAN-8, UPC e ITF-14 em alta resolução">
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <Field label="Conteúdo" id="bc-t"><TextInput id="bc-t" value={texto} onChange={(e) => { setTexto(e.target.value); }} /></Field>
        <Field label="Formato" id="bc-f">
          <Select value={tipo} onValueChange={(v) => setTipo(v)}>
            <SelectTrigger id="bc-f" className="h-11 mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CODE128">CODE128 (qualquer texto)</SelectItem>
              <SelectItem value="EAN13">EAN-13 (produtos)</SelectItem>
              <SelectItem value="EAN8">EAN-8</SelectItem>
              <SelectItem value="UPC">UPC-A</SelectItem>
              <SelectItem value="ITF14">ITF-14 (caixas)</SelectItem>
              <SelectItem value="CODE39">CODE39</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      {erro && <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">{erro}</p>}
      <div className="mt-5 flex flex-col items-center gap-4">
        <div className="rounded-xl bg-white p-3">
          <canvas ref={canvasRef} />
        </div>
        <div className="flex gap-2">
          <Button onClick={baixar} disabled={!!erro} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Download className="h-4 w-4" /> Baixar PNG
          </Button>
          <Button variant="outline" onClick={gerar} className="gap-2"><RefreshCcw className="h-4 w-4" /> Regenerar</Button>
        </div>
      </div>
    </ToolShell>
  );
}

/* ================= Base64 (texto + imagem) ================= */
export function Base64Tool() {
  const [modo, setModo] = useState<'texto' | 'imagem'>('texto');
  const [plain, setPlain] = useState('');
  const [b64, setB64] = useState('');
  const [imgSrc, setImgSrc] = useState('');
  const [imgB64, setImgB64] = useState('');
  const { toast } = useToast();

  const encode = () => {
    try {
      setB64(btoa(unescape(encodeURIComponent(plain))));
    } catch { /* ignore */ }
  };
  const decode = () => {
    try {
      setPlain(decodeURIComponent(escape(atob(b64.trim()))));
    } catch {
      toast({ title: 'Base64 inválido', variant: 'destructive' });
    }
  };

  return (
    <ToolShell title="Conversor Base64" description="Texto ↔ Base64 e Imagem ↔ Base64, tudo local">
      <div className="mb-5 flex gap-2">
        {([['texto', '📝 Texto ↔ Base64'], ['imagem', '🖼️ Imagem ↔ Base64']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setModo(id)} className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${modo === id ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground'}`}>
            {label}
          </button>
        ))}
      </div>

      {modo === 'texto' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Texto" id="b64-plain">
            <Textarea id="b64-plain" value={plain} onChange={(e) => setPlain(e.target.value)} className="min-h-40 font-mono text-sm" placeholder="Digite ou cole o texto…" />
          </Field>
          <Field label="Base64" id="b64-b64">
            <Textarea id="b64-b64" value={b64} onChange={(e) => setB64(e.target.value)} className="min-h-40 font-mono text-xs" placeholder="SGVsbG8h…" />
          </Field>
          <div className="flex gap-2 lg:col-span-2">
            <Button onClick={encode} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">Codificar →</Button>
            <Button onClick={decode} variant="outline">← Decodificar</Button>
            <Button
              variant="ghost" size="icon" aria-label="Copiar Base64"
              onClick={async () => { const ok = await copyToClipboard(b64); toast({ title: ok ? 'Copiado!' : 'Erro ao copiar' }); }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Imagem de origem</p>
            <input
              type="file" accept="image/*" id="b64-img"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const d = reader.result as string;
                  setImgSrc(d);
                  setImgB64(d);
                };
                reader.readAsDataURL(f);
              }}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/15 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary"
            />
            {imgSrc && (
               
              <img src={imgSrc} alt="Prévia" className="mt-3 max-h-40 rounded-xl border border-border object-contain" />
            )}
          </div>
          <Field label="Data URL / Base64" id="b64-out">
            <Textarea id="b64-out" value={imgB64} onChange={(e) => setImgB64(e.target.value)} className="min-h-40 font-mono text-[10px]" />
          </Field>
          <div className="flex gap-2 lg:col-span-2">
            <Button
              variant="outline" className="gap-2"
              onClick={async () => { const ok = await copyToClipboard(imgB64); toast({ title: ok ? 'Base64 copiado!' : 'Erro ao copiar' }); }}
            >
              <Copy className="h-4 w-4" /> Copiar Base64
            </Button>
            {imgB64 && !imgSrc && (
              <Button
                variant="outline" className="gap-2"
                onClick={() => { try { setImgSrc(imgB64.trim()); } catch { toast({ title: 'Base64 inválido', variant: 'destructive' }); } }}
              >
                <CheckCircle2 className="h-4 w-4" /> Renderizar imagem
              </Button>
            )}
          </div>
        </div>
      )}
    </ToolShell>
  );
}
