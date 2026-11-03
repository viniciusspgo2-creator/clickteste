'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { md5 } from 'js-md5';
import { ToolShell, Field, TextInput, ResultCard } from './shell';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/helpers';
import { Copy, RefreshCcw, CheckCircle2, XCircle, KeyRound } from 'lucide-react';

/* ================= Gerador de Senhas ================= */
export function SenhasTool() {
  const [tamanho, setTamanho] = useState(16);
  const [maiusculas, setMaiusculas] = useState(true);
  const [numeros, setNumeros] = useState(true);
  const [simbolos, setSimbolos] = useState(true);
  const [evitarAmbiguos, setEvitarAmbiguos] = useState(true);
  const [senha, setSenha] = useState('');
  const { toast } = useToast();

  const gerar = () => {
    let chars = 'abcdefghijkmnopqrstuvwxyz';
    if (maiusculas) chars += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    if (numeros) chars += '23456789';
    if (simbolos) chars += '!@#$%&*+-_=?';
    if (!evitarAmbiguos) chars += 'il1Lo0O';
    const arr = new Uint32Array(tamanho);
    crypto.getRandomValues(arr);
    setSenha([...arr].map((n) => chars[n % chars.length]).join(''));
  };

  useEffect(() => { gerar();   }, [tamanho, maiusculas, numeros, simbolos, evitarAmbiguos]);

  const forca = Math.min(100, Math.round((tamanho / 40) * 60 + (maiusculas ? 10 : 0) + (numeros ? 10 : 0) + (simbolos ? 20 : 0)));
  const forcaLabel = forca < 40 ? 'Fraca' : forca < 70 ? 'Boa' : forca < 90 ? 'Forte' : 'Militar 🔐';
  const diasParaQuebrar = useMemo(() => {
    const pool = 26 + (maiusculas ? 24 : 0) + (numeros ? 8 : 0) + (simbolos ? 12 : 0);
    const combos = Math.pow(pool, tamanho);
    const guessesPerSec = 1e11;
    const segundos = combos / 2 / guessesPerSec;
    const anos = segundos / 31557600;
    if (anos > 1e12) return `${(anos / 1e12).toFixed(0)} trilhões de anos`;
    if (anos > 1e6) return `${(anos / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} milhões de anos`;
    if (anos > 1000) return `${(anos / 1000).toFixed(0)} mil anos`;
    return `${Math.max(1, Math.round(anos)).toLocaleString('pt-BR')} anos`;
  }, [tamanho, maiusculas, numeros, simbolos]);

  return (
    <ToolShell title="Gerador de Senhas Fortes" description="Criação com criptografia do navegador (crypto API) — nada é enviado">
      <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 text-center">
        <p className="font-mono text-lg font-bold break-all text-primary sm:text-2xl">{senha}</p>
        <div className="mt-3 flex justify-center gap-2">
          <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90" onClick={async () => { const ok = await copyToClipboard(senha); toast({ title: ok ? 'Senha copiada!' : 'Erro' }); }}>
            <Copy className="h-3.5 w-3.5" /> Copiar
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={gerar}>
            <RefreshCcw className="h-3.5 w-3.5" /> Nova senha
          </Button>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        <div><label className="text-xs text-muted-foreground">Tamanho: {tamanho} caracteres</label><Slider value={[tamanho]} min={6} max={48} step={1} onValueChange={([v]) => setTamanho(v)} className="mt-2" /></div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm"><Switch checked={maiusculas} onCheckedChange={setMaiusculas} /> Letras maiúsculas (A-Z)</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={numeros} onCheckedChange={setNumeros} /> Números (0-9)</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={simbolos} onCheckedChange={setSimbolos} /> Símbolos (!@#$…)</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={evitarAmbiguos} onCheckedChange={setEvitarAmbiguos} /> Evitar l, 1, I, 0, O confusos</label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <ResultCard label="Força" value={forcaLabel} tone={forca >= 70 ? 'green' : forca >= 40 ? 'brand' : 'red'} />
          <ResultCard label="Quebrar por força bruta" value={diasParaQuebrar} tone="neutral" />
          <ResultCard label="Entropia" value={`${Math.round(tamanho * Math.log2(26 + (maiusculas ? 24 : 0) + (numeros ? 8 : 0) + (simbolos ? 12 : 0)))} bits`} tone="neutral" />
        </div>
      </div>
    </ToolShell>
  );
}

/* ================= Gerador de Hash ================= */
export function HashTool() {
  const [texto, setTexto] = useState('');
  const [hashes, setHashes] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const out: Record<string, string> = {};
      out['MD5'] = md5(texto);
      const enc = new TextEncoder().encode(texto);
      for (const alg of ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']) {
        try {
          const buf = await crypto.subtle.digest(alg, enc);
          out[alg] = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
        } catch { out[alg] = '—'; }
      }
      if (!cancelled) setHashes(out);
    };
    run();
    return () => { cancelled = true; };
  }, [texto]);

  return (
    <ToolShell title="Gerador de Hash Criptográfico" description="MD5, SHA-1, SHA-256, SHA-384 e SHA-512 — calculados no seu navegador">
      <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} className="min-h-32 font-mono text-sm" placeholder="Digite o texto para gerar os hashes…" />
      <div className="mt-4 space-y-2">
        {['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'].map((alg) => (
          <div key={alg} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3">
            <span className="w-20 shrink-0 text-xs font-bold text-primary">{alg}</span>
            <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-foreground/85">{hashes[alg] ?? '…'}</code>
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" aria-label={`Copiar ${alg}`} onClick={async () => { await copyToClipboard(hashes[alg] ?? ''); }}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">⚠️ MD5 e SHA-1 servem para checksums; para senhas use sempre bcrypt/argon2 no servidor.</p>
    </ToolShell>
  );
}

/* ================= Gerador CPF/CNPJ ================= */
function calcDigitosCpf(base: string): string {
  const dig = (arr: number[], pesoInicial: number) =>
    arr.reduce((acc, d, i) => acc + d * (pesoInicial - i), 0) % 11;
  const nums = base.split('').map(Number);
  const d1 = dig(nums, 10);
  const r1 = d1 < 2 ? 0 : 11 - d1;
  const d2 = dig([...nums, r1], 11);
  const r2 = d2 < 2 ? 0 : 11 - d2;
  return `${r1}${r2}`;
}
function calcDigitosCnpj(base: string): string {
  const calc = (nums: number[], pesos: number[]) => {
    const soma = nums.reduce((acc, d, i) => acc + d * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const nums = base.split('').map(Number);
  const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calc(nums, p1);
  const p2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d2 = calc([...nums, d1], p2);
  return `${d1}${d2}`;
}

export function CpfCnpjTool() {
  const { toast } = useToast();
  const [tipo, setTipo] = useState<'cpf' | 'cnpj'>('cpf');
  const [formatado, setFormatado] = useState(true);
  const [lista, setLista] = useState<string[]>([]);

  const gerar = () => {
    const arr = new Uint32Array(tipo === 'cpf' ? 9 : 8);
    crypto.getRandomValues(arr);
    let base = [...arr].map((n) => n % 10).join('');
    if (tipo === 'cpf') base = `1${base.slice(0, 8)}`; // evita CPFs com região 00
    const dv = tipo === 'cpf' ? calcDigitosCpf(base) : calcDigitosCnpj(base);
    const full = base + dv;
    let out = full;
    if (formatado) {
      out = tipo === 'cpf'
        ? full.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        : full.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    setLista([out, ...lista].slice(0, 12));
  };

  return (
    <ToolShell title="Gerador de CPF e CNPJ" description="Números válidos para testar sistemas, cadastros e validações">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {([['cpf', 'CPF'], ['cnpj', 'CNPJ']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTipo(id)} className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${tipo === id ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground'}`}>{label}</button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm"><Switch checked={formatado} onCheckedChange={setFormatado} /> Com pontuação</label>
        <Button onClick={gerar} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"><KeyRound className="h-4 w-4" /> Gerar</Button>
      </div>
      <div className="mt-4 space-y-2">
        {lista.length === 0 && <p className="text-sm text-muted-foreground">Clique em &quot;Gerar&quot; — cada número é gerado aleatoriamente e válido matematicamente.</p>}
        {lista.map((v, i) => (
          <button
            key={`${v}-${i}`}
            onClick={async () => { await copyToClipboard(v); toast({ title: `${v} copiado!` }); }}
            className="flex w-full items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3 text-left font-mono text-sm transition-colors hover:border-primary/50"
          >
            <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {v}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">⚠️ Somente para testes de software. Não use para cadastros reais ou fraudes — isso é crime.</p>
    </ToolShell>
  );
}

/* ================= Formatador JSON ================= */
export function JsonTool() {
  const [entrada, setEntrada] = useState('');
  const [saida, setSaida] = useState('');
  const [erro, setErro] = useState('');
  const [indent, setIndent] = useState(2);
  const { toast } = useToast();

  const processar = (modo: 'formatar' | 'minificar') => {
    try {
      const obj = JSON.parse(entrada);
      setSaida(modo === 'formatar' ? JSON.stringify(obj, null, indent) : JSON.stringify(obj));
      setErro('');
      toast({ title: modo === 'formatar' ? 'JSON formatado!' : 'JSON minificado!' });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'JSON inválido');
      setSaida('');
    }
  };

  const stats = useMemo(() => {
    if (!saida) return null;
    try {
      const obj = JSON.parse(entrada);
      const count = (o: unknown): { chaves: number; prof: number } => {
        if (typeof o !== 'object' || o === null) return { chaves: 0, prof: 0 };
        let chaves = 0; let prof = 0;
        for (const [, v] of Object.entries(o)) {
          chaves++;
          const r = count(v);
          chaves += r.chaves;
          prof = Math.max(prof, r.prof + 1);
        }
        return { chaves, prof };
      };
      const s = count(obj);
      return { ...s, tamanho: saida.length };
    } catch { return null; }
  }, [saida, entrada]);

  return (
    <ToolShell title="Formatador de JSON" description="Valide, embeleze ou minifique JSON com destaque de erros">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Entrada</p>
          <Textarea value={entrada} onChange={(e) => setEntrada(e.target.value)} className="min-h-56 font-mono text-xs" placeholder='{"click":"gruda","ferramentas":[1,2,3]}' />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Resultado</p>
          <Textarea readOnly value={saida} className="min-h-56 font-mono text-xs text-primary" />
        </div>
      </div>
      {erro && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {erro}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={() => processar('formatar')} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"><CheckCircle2 className="h-4 w-4" /> Formatar</Button>
        <Button variant="outline" onClick={() => processar('minificar')}>Minificar</Button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Switch checked={indent === 4} onCheckedChange={(v) => setIndent(v ? 4 : 2)} /> Indentação 4</div>
        {saida && <Button size="icon" variant="ghost" aria-label="Copiar" onClick={async () => { await copyToClipboard(saida); toast({ title: 'Copiado!' }); }}><Copy className="h-4 w-4" /></Button>}
      </div>
      {stats && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <ResultCard label="Chaves totais" value={stats.chaves.toLocaleString('pt-BR')} tone="neutral" />
          <ResultCard label="Profundidade" value={`${stats.prof} níveis`} tone="neutral" />
          <ResultCard label="Tamanho final" value={`${(stats.tamanho / 1024).toFixed(1)} KB`} tone="neutral" />
        </div>
      )}
    </ToolShell>
  );
}

/* ================= Gerador de Dados Falsos ================= */
const NOMES_M = ['Carlos', 'João', 'Pedro', 'Lucas', 'Mateus', 'Bruno', 'Rafael', 'Diego', 'Gustavo', 'Thiago', 'André', 'Felipe', 'Rodrigo'];
const NOMES_F = ['Maria', 'Ana', 'Julia', 'Beatriz', 'Camila', 'Fernanda', 'Larissa', 'Mariana', 'Patrícia', 'Rafaela', 'Sofia', 'Letícia'];
const SOBRENOMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Almeida', 'Nascimento', 'Araújo', 'Ribeiro', 'Carvalho', 'Gomes', 'Martins'];
const CIDADES = [['Goiânia', 'GO'], ['São Paulo', 'SP'], ['Rio de Janeiro', 'RJ'], ['Belo Horizonte', 'MG'], ['Curitiba', 'PR'], ['Porto Alegre', 'RS'], ['Salvador', 'BA'], ['Recife', 'PE']];

export function DadosFalsosTool() {
  const [pessoas, setPessoas] = useState<{ nome: string; cpf: string; email: string; tel: string; cidade: string; nasc: string }[]>([]);

  const gerar = () => {
    const arr = new Uint32Array(64);
    crypto.getRandomValues(arr);
    const r = (i: number, max: number) => arr[i % arr.length] % max;
    const out = Array.from({ length: 8 }, (_, k) => {
      const fem = r(k, 2) === 1;
      const nome = `${fem ? NOMES_F[r(k + 1, NOMES_F.length)] : NOMES_M[r(k + 1, NOMES_M.length)]} ${SOBRENOMES[r(k + 2, SOBRENOMES.length)]} ${SOBRENOMES[r(k + 3, SOBRENOMES.length)]}`;
      const baseCpf = String(100000000 + r(k + 4, 899999999));
      const cpf = baseCpf + calcDigitosCpf(baseCpf);
      const cidade = CIDADES[r(k + 5, CIDADES.length)];
      const tel = `(${31 + r(k + 6, 50)}) 9${8000 + r(k + 7, 1999)}-${1000 + r(k + 8, 8999)}`;
      const nasc = `${1900 + r(k + 9, 55)}-${String(1 + r(k + 10, 12)).padStart(2, '0')}-${String(1 + r(k + 11, 28)).padStart(2, '0')}`;
      const email = `${nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z ]/g, '').split(' ').join('.')}@emailteste.com.br`;
      return { nome, cpf: cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'), email, tel, cidade: `${cidade[0]} / ${cidade[1]}`, nasc };
    });
    setPessoas(out);
  };

  return (
    <ToolShell title="Gerador de Dados Brasileiros de Teste" description="Perfis completos com nome, CPF, e-mail, telefone e cidade para popular seus testes">
      <Button onClick={gerar} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"><RefreshCcw className="h-4 w-4" /> Gerar 8 perfis</Button>
      {pessoas.length > 0 && (
        <div className="thin-scroll mt-4 max-h-96 overflow-auto rounded-xl border border-border">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-secondary">
              <tr className="text-muted-foreground">
                {['Nome', 'CPF', 'E-mail', 'Telefone', 'Cidade', 'Nascimento'].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pessoas.map((p, i) => (
                <tr key={i} className="border-t border-border/60 hover:bg-secondary/30">
                  <td className="px-3 py-2 font-medium">{p.nome}</td>
                  <td className="px-3 py-2 font-mono">{p.cpf}</td>
                  <td className="px-3 py-2">{p.email}</td>
                  <td className="px-3 py-2 font-mono">{p.tel}</td>
                  <td className="px-3 py-2">{p.cidade}</td>
                  <td className="px-3 py-2 font-mono">{p.nasc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">⚠️ Dados fictícios para desenvolvimento e testes. Qualquer semelhança é coincidência.</p>
    </ToolShell>
  );
}

/* ================= Calculadora IP/CIDR ================= */
export function CidrTool() {
  const [ip, setIp] = useState('192.168.1.10');
  const [cidr, setCidr] = useState('24');

  const info = useMemo(() => {
    const oct = ip.split('.').map(Number);
    const bits = Number(cidr);
    if (oct.length !== 4 || oct.some((n) => isNaN(n) || n < 0 || n > 255) || isNaN(bits) || bits < 0 || bits > 32) return null;
    const ipInt = ((oct[0] << 24) | (oct[1] << 16) | (oct[2] << 8) | oct[3]) >>> 0;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    const rede = (ipInt & mask) >>> 0;
    const broadcast = (rede | (~mask >>> 0)) >>> 0;
    const toIp = (n: number) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');
    const hosts = bits >= 31 ? (bits === 32 ? 1 : 2) : Math.pow(2, 32 - bits) - 2;
    const maskOct = [24, 16, 8, 0].map((s) => (mask >>> s) & 255);
    return {
      rede: toIp(rede), broadcast: toIp(broadcast), hosts,
      mascara: maskOct.join('.'),
      wildcard: maskOct.map((v) => 255 - v).join('.'),
      primeira: toIp(rede + 1), ultima: toIp(broadcast - 1),
      classe: oct[0] < 128 ? 'A' : oct[0] < 192 ? 'B' : oct[0] < 224 ? 'C' : 'D/E',
      privado: oct[0] === 10 || (oct[0] === 172 && oct[1] >= 16 && oct[1] <= 31) || (oct[0] === 192 && oct[1] === 168),
    };
  }, [ip, cidr]);

  return (
    <ToolShell title="Calculadora de Sub-rede IPv4 (CIDR)" description="Máscara, faixa de hosts, broadcast e muito mais — instantâneo">
      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <Field label="Endereço IP" id="cidr-ip"><TextInput id="cidr-ip" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="192.168.1.10" /></Field>
        <Field label="Prefixo (/CIDR)" id="cidr-p"><TextInput id="cidr-p" inputMode="numeric" value={cidr} onChange={(e) => setCidr(e.target.value.replace(/\D/g, '').slice(0, 2))} /></Field>
      </div>
      {info ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ResultCard label="Endereço de rede" value={info.rede} />
          <ResultCard label="Máscara de sub-rede" value={info.mascara} tone="neutral" />
          <ResultCard label="Wildcard" value={info.wildcard} tone="neutral" />
          <ResultCard label="Primeiro host" value={info.primeira} tone="green" />
          <ResultCard label="Último host" value={info.ultima} tone="green" />
          <ResultCard label="Broadcast" value={info.broadcast} tone="red" />
          <ResultCard label="Hosts utilizáveis" value={info.hosts.toLocaleString('pt-BR')} big />
          <ResultCard label="Classe" value={`Classe ${info.classe}`} tone="neutral" />
          <ResultCard label="Tipo" value={info.privado ? 'Rede privada' : 'Rede pública'} tone={info.privado ? 'green' : 'neutral'} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-destructive">IP ou prefixo inválido — use o formato 192.168.0.1 e CIDR entre 0 e 32.</p>
      )}
    </ToolShell>
  );
}
