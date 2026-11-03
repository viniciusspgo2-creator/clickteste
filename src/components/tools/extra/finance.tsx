'use client';

import { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ToolShell, Field, TextInput, ResultCard, SectionBox } from './shell';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { formatBRL } from '@/lib/helpers';

const num = (s: string) => {
  const normalized = s.trim().replace(/\s/g, '');
  const value = normalized.includes(',')
    ? normalized.replace(/\./g, '').replace(',', '.')
    : normalized;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/* ================= Juros Compostos ================= */
export function JurosCompostosTool() {
  const [inicial, setInicial] = useState('1000');
  const [aporte, setAporte] = useState('200');
  const [taxa, setTaxa] = useState('1');
  const [meses, setMeses] = useState(24);

  const { data, total, investido, juros } = useMemo(() => {
    const i = num(inicial), a = num(aporte), tx = num(taxa) / 100;
    let saldo = i;
    const rows = [{ mes: 0, saldo: i, investido: i }];
    for (let m = 1; m <= meses; m++) {
      saldo = saldo * (1 + tx) + a;
      rows.push({ mes: m, saldo: Math.round(saldo * 100) / 100, investido: i + a * m });
    }
    const inv = i + a * meses;
    return { data: rows, total: saldo, investido: inv, juros: saldo - inv };
  }, [inicial, aporte, taxa, meses]);

  return (
    <ToolShell title="Calculadora de Juros Compostos" description="Simule o crescimento do seu dinheiro mês a mês">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Valor inicial (R$)" id="jc-ini"><TextInput id="jc-ini" value={inicial} onChange={(e) => setInicial(e.target.value)} /></Field>
        <Field label="Aporte mensal (R$)" id="jc-apor"><TextInput id="jc-apor" value={aporte} onChange={(e) => setAporte(e.target.value)} /></Field>
        <Field label="Taxa de juros (% ao mês)" id="jc-tx"><TextInput id="jc-tx" value={taxa} onChange={(e) => setTaxa(e.target.value)} /></Field>
        <Field label={`Período: ${meses} meses (${(meses / 12).toFixed(1)} anos)`} id="jc-meses">
          <Slider value={[meses]} min={1} max={480} step={1} onValueChange={([v]) => setMeses(v)} className="mt-3" />
        </Field>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <ResultCard label="Valor final" value={formatBRL(total)} big />
        <ResultCard label="Total investido" value={formatBRL(investido)} tone="neutral" />
        <ResultCard label="Juros ganhos" value={formatBRL(juros)} tone="green" />
      </div>

      <div className="mt-5 h-64 rounded-xl border border-border bg-secondary/30 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
            <CartesianGrid stroke="rgba(243,237,228,0.08)" />
            <XAxis dataKey="mes" tick={{ fill: '#a89c8e', fontSize: 11 }} tickFormatter={(v) => `${v}m`} />
            <YAxis tick={{ fill: '#a89c8e', fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={40} />
            <ReTooltip
              formatter={(value: number, name: string) => [formatBRL(value), name === 'saldo' ? 'Total' : 'Investido']}
              contentStyle={{ background: '#151110', border: '1px solid rgba(243,237,228,0.1)', borderRadius: 12, color: '#f3ede4' }}
            />
            <Line type="monotone" dataKey="investido" stroke="#a89c8e" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="saldo" stroke="#e8703a" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ToolShell>
  );
}

/* ================= Desconto ================= */
export function DescontoTool() {
  const [preco, setPreco] = useState('');
  const [desconto, setDesconto] = useState('');
  const p = num(preco), d = num(desconto);
  const economia = p * (d / 100);
  const final = p - economia;

  return (
    <ToolShell title="Calculadora de Desconto" description="Descubra o preço final e quanto você economiza">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Preço original (R$)" id="desc-preco"><TextInput id="desc-preco" inputMode="decimal" placeholder="199,90" value={preco} onChange={(e) => setPreco(e.target.value)} /></Field>
        <Field label="Desconto (%)" id="desc-pct"><TextInput id="desc-pct" inputMode="decimal" placeholder="25" value={desconto} onChange={(e) => setDesconto(e.target.value)} /></Field>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <ResultCard label="Preço final" value={formatBRL(final)} big />
        <ResultCard label="Você economiza" value={formatBRL(economia)} tone="green" />
        <ResultCard label="Você paga" value={`${d || 0}% do original`} tone="neutral" />
      </div>
      {d >= 50 && d > 0 && (
        <p className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
          ⚡ Desconto grande! Confira se não é &quot;leve 2 e pague 2&quot; disfarçado — compare sempre o preço unitário.
        </p>
      )}
    </ToolShell>
  );
}

/* ================= Salário Líquido CLT ================= */
export function SalarioLiquidoTool() {
  const [bruto, setBruto] = useState('');
  const [dependentes, setDependentes] = useState('0');
  const [outros, setOutros] = useState('');

  const b = num(bruto);

  // Tabelas 2025
  const inss = useMemo(() => {
    const t = [
      [1518.0, 0.075], [2793.88, 0.09], [3654.03, 0.12], [5189.82, 0.14],
    ] as const;
    if (b <= t[0][0]) return b * t[0][1];
    if (b <= t[1][0]) return b * t[1][1];
    if (b <= t[2][0]) return b * t[2][1];
    if (b <= t[3][0]) return b * t[3][1];
    return 5189.82 * 0.14; // teto aproximado progressivo simplificado
  }, [b]);

  const irrf = useMemo(() => {
    const base = Math.max(0, b - inss - Number(dependentes) * 189.59 - num(outros));
    if (base <= 2259.2) return 0;
    if (base <= 2826.65) return base * 0.075 - 169.44;
    if (base <= 3751.05) return base * 0.15 - 381.44;
    if (base <= 4664.68) return base * 0.225 - 662.77;
    return base * 0.275 - 896.0;
  }, [b, inss, dependentes, outros]);

  const liquido = b - inss - irrf - num(outros);

  return (
    <ToolShell title="Calculadora de Salário Líquido (CLT)" description="Estimativa com INSS e IRRF (tabelas 2025)">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Salário bruto (R$)" id="sl-bruto"><TextInput id="sl-bruto" inputMode="decimal" placeholder="3500,00" value={bruto} onChange={(e) => setBruto(e.target.value)} /></Field>
        <Field label="Dependentes" id="sl-dep"><TextInput id="sl-dep" inputMode="numeric" value={dependentes} onChange={(e) => setDependentes(e.target.value.replace(/\D/g, ''))} /></Field>
        <Field label="Outros descontos (R$)" id="sl-outros"><TextInput id="sl-outros" inputMode="decimal" placeholder="0" value={outros} onChange={(e) => setOutros(e.target.value)} /></Field>
      </div>
      <div className="mt-5 space-y-3">
        <ResultCard label="Salário líquido" value={formatBRL(liquido)} big />
        <div className="grid gap-3 sm:grid-cols-3">
          <ResultCard label="INSS" value={`- ${formatBRL(inss)}`} tone="red" />
          <ResultCard label="IRRF" value={`- ${formatBRL(irrf)}`} tone="red" />
          <ResultCard label="Outros" value={`- ${formatBRL(num(outros))}`} tone="neutral" />
        </div>
      </div>
    </ToolShell>
  );
}

/* ================= Rescisão CLT ================= */
export function RescisaoTool() {
  const [salario, setSalario] = useState('');
  const [mesesTrab, setMesesTrab] = useState('12'); // meses no último ano
  const [diasMes, setDiasMes] = useState('10'); // dias trabalhados no mês da saída
  const [avisoPrevio, setAvisoPrevio] = useState(true);
  const [justaCausa, setJustaCausa] = useState(false);

  const s = num(salario);
  const m = Math.min(12, Math.max(0, Number(mesesTrab)));
  const d = Math.min(30, Math.max(0, Number(diasMes)));

  const saldoSalario = (s / 30) * d;
  const feriasProp = (s / 12) * m;
  const feriasTerco = feriasProp / 3;
  const decimoProp = (s / 12) * m;
  const aviso = avisoPrevio && !justaCausa ? s : 0;
  const fgtsMulta = justaCausa ? 0 : ((s * 0.08 * m) + (aviso * 0.08)) * 0.4;

  const total = saldoSalario + (justaCausa ? 0 : feriasProp + feriasTerco) + (justaCausa ? 0 : decimoProp) + aviso + fgtsMulta;

  return (
    <ToolShell title="Calculadora de Rescisão Trabalhista" description="Estimativa simplificada dos valores de saída (sem justa causa ou com justa causa)">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Salário bruto mensal (R$)" id="re-sal"><TextInput id="re-sal" inputMode="decimal" value={salario} onChange={(e) => setSalario(e.target.value)} /></Field>
        <Field label="Meses trabalhados no último ano (0-12)" id="re-m"><TextInput id="re-m" inputMode="numeric" value={mesesTrab} onChange={(e) => setMesesTrab(e.target.value.replace(/\D/g, ''))} /></Field>
        <Field label="Dias trabalhados no mês da saída (0-30)" id="re-d"><TextInput id="re-d" inputMode="numeric" value={diasMes} onChange={(e) => setDiasMes(e.target.value.replace(/\D/g, ''))} /></Field>
        <div className="flex flex-col justify-center gap-3 pt-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={avisoPrevio} onChange={(e) => setAvisoPrevio(e.target.checked)} className="h-4 w-4 accent-[#e8703a]" />
            Receberá aviso prévio indenizado
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={justaCausa} onChange={(e) => setJustaCausa(e.target.checked)} className="h-4 w-4 accent-[#e8703a]" />
            Demissão por justa causa
          </label>
        </div>
      </div>

      <div className="mt-5 space-y-2 text-sm">
        {[
          ['Saldo de salário', saldoSalario],
          ['Férias proporcionais + 1/3', justaCausa ? 0 : feriasProp + feriasTerco],
          ['13º salário proporcional', justaCausa ? 0 : decimoProp],
          ['Aviso prévio indenizado', aviso],
          ['Multa 40% do FGTS', fgtsMulta],
        ].map(([label, v]) => (
          <div key={label as string} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold">{formatBRL(v as number)}</span>
          </div>
        ))}
        <ResultCard label="Total estimado a receber" value={formatBRL(total)} big />
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Estimativa educativa — não substitui o cálculo oficial do departamento pessoal.
      </p>
    </ToolShell>
  );
}

/* ================= Taxas de Maquininha ================= */
export function MaquininhaTool() {
  const [valor, setValor] = useState('100');
  const [taxaPct, setTaxaPct] = useState('3.99');
  const [repasse, setRepasse] = useState<'embutir' | 'cobrar'>('embutir');

  const v = num(valor), t = num(taxaPct);
  const taxa = v * (t / 100);

  // Para receber o valor cheio, embutindo a taxa:
  const valorComTaxaEmbutida = v / (1 - t / 100);
  const taxaEmbutida = valorComTaxaEmbutida - v;

  return (
    <ToolShell title="Calculadora de Taxas de Maquininha" description="Saiba o valor líquido e quanto cobrar para embutir a taxa no preço">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Valor da venda (R$)" id="mq-v"><TextInput id="mq-v" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} /></Field>
        <Field label="Taxa da maquininha (%)" id="mq-t"><TextInput id="mq-t" inputMode="decimal" value={taxaPct} onChange={(e) => setTaxaPct(e.target.value)} /></Field>
        <Field label="Modo" id="mq-modo">
          <Select value={repasse} onValueChange={(x) => setRepasse(x as 'embutir' | 'cobrar')}>
            <SelectTrigger id="mq-modo" className="h-11 mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="embutir">Embutir taxa no preço</SelectItem>
              <SelectItem value="cobrar">Apenas calcular desconto</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {repasse === 'cobrar' ? (
          <>
            <ResultCard label="Taxa a pagar" value={formatBRL(taxa)} tone="red" />
            <ResultCard label="Você recebe" value={formatBRL(v - taxa)} big tone="green" />
            <ResultCard label="Cliente paga" value={formatBRL(v)} tone="neutral" />
          </>
        ) : (
          <>
            <ResultCard label="Cobre do cliente" value={formatBRL(valorComTaxaEmbutida)} big />
            <ResultCard label="Você recebe líquido" value={formatBRL(v)} tone="green" />
            <ResultCard label="Taxa embutida" value={formatBRL(taxaEmbutida)} tone="red" />
          </>
        )}
      </div>
    </ToolShell>
  );
}

/* ================= Consumo de Energia ================= */
export function EnergiaTool() {
  const [potencia, setPotencia] = useState('1500');
  const [horas, setHoras] = useState('1');
  const [tarifa, setTarifa] = useState('0.85');
  const [dias, setDias] = useState('30');

  const kwhMes = (num(potencia) / 1000) * num(horas) * num(dias);
  const custo = kwhMes * num(tarifa);

  return (
    <ToolShell title="Calculadora de Consumo de Energia" description="Descubra quanto cada aparelho custa na sua conta de luz">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Potência (W)" id="en-pot" hint="Ex: chuveiro 5500W, geladeira 150W"><TextInput id="en-pot" inputMode="decimal" value={potencia} onChange={(e) => setPotencia(e.target.value)} /></Field>
        <Field label="Horas por dia" id="en-h"><TextInput id="en-h" inputMode="decimal" value={horas} onChange={(e) => setHoras(e.target.value)} /></Field>
        <Field label="Dias por mês" id="en-d"><TextInput id="en-d" inputMode="decimal" value={dias} onChange={(e) => setDias(e.target.value)} /></Field>
        <Field label="Tarifa (R$/kWh)" id="en-t" hint="Veja na sua conta de luz"><TextInput id="en-t" inputMode="decimal" value={tarifa} onChange={(e) => setTarifa(e.target.value)} /></Field>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <ResultCard label="Consumo mensal" value={`${kwhMes.toFixed(1)} kWh`} />
        <ResultCard label="Custo mensal" value={formatBRL(custo)} big tone="red" />
        <ResultCard label="Custo anual" value={formatBRL(custo * 12)} tone="neutral" />
      </div>
    </ToolShell>
  );
}

/* ================= Cotação (Dólar/Euro/Bitcoin) ================= */
interface CotationInfo { bid: string; name: string; pctChange?: string }

export function CotacaoTool() {
  const [usd, setUsd] = useState('1');
  const [rates, setRates] = useState<Record<string, CotationInfo> | null>(null);
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState('5.40');
  const [erro, setErro] = useState(false);

  const fetchRates = async () => {
    setLoading(true);
    setErro(false);
    try {
      const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL');
      if (!res.ok) throw new Error();
      const json = await res.json();
      setRates({
        USD: json.USDBRL, EUR: json.EURBRL, BTC: json.BTCBRL,
      });
    } catch {
      setErro(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRates(); }, []);

  const valor = num(usd);
  const rate = rates?.USD ? parseFloat(rates.USD.bid) : num(manual);
  const euroRate = rates?.EUR ? parseFloat(rates.EUR.bid) : rate * 1.08;
  const btcRate = rates?.BTC ? parseFloat(rates.BTC.bid) : 0;

  return (
    <ToolShell title="Conversor de Cotação" description="Dólar, Euro e Bitcoin para Real — cotação ao vivo com fallback manual">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Valor em Dólar (US$)" id="ct-v"><TextInput id="ct-v" inputMode="decimal" value={usd} onChange={(e) => setUsd(e.target.value)} /></Field>
        {!rates && erro && (
          <Field label="Cotação manual (R$/US$)" id="ct-manual" hint="API indisponível — digite a cotação do dia">
            <TextInput id="ct-manual" inputMode="decimal" value={manual} onChange={(e) => setManual(e.target.value)} />
          </Field>
        )}
        {rates?.USD && (
          <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3 self-end">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Cotação atual</p>
            <p className="font-semibold text-whats">US$ 1 = {formatBRL(parseFloat(rates.USD.bid))}</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button onClick={fetchRates} variant="outline" size="sm" disabled={loading} className="gap-1.5">
          {loading ? 'Atualizando…' : '↻ Atualizar cotação'}
        </Button>
        {erro && <span className="text-xs text-muted-foreground">usando cotação manual</span>}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <ResultCard label="Em Reais (BRL)" value={formatBRL(valor * rate)} big />
        <ResultCard label="Em Euros (EUR)" value={rate > 0 ? `€ ${(valor * rate / euroRate).toFixed(2)}` : '—'} tone="neutral" />
        <ResultCard label="Em Bitcoin (BTC)" value={btcRate > 0 ? `₿ ${(valor * rate / btcRate).toFixed(8)}` : '—'} tone="green" />
      </div>
    </ToolShell>
  );
}

/* ================= Valor Hora Freelancer ================= */
export function ValorHoraTool() {
  const [renda, setRenda] = useState('5000');
  const [horasSemana, setHorasSemana] = useState('30');
  const [semanasTrab, setSemanasTrab] = useState('44'); // semanas produtivas no mês (descanso/feriados)
  const [custos, setCustos] = useState('500');
  const [impostoPct, setImpostoPct] = useState('15');

  const custoMensal = num(renda) + num(custos);
  const custoComImposto = custoMensal / (1 - num(impostoPct) / 100);
  const horasMes = num(horasSemana) * (num(semanasTrab) / 4.33);
  const hora = horasMes > 0 ? custoComImposto / horasMes : 0;

  return (
    <ToolShell title="Calculadora de Valor-Hora Freelancer" description="Descubra quanto você deve cobrar por hora para bater sua meta">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Renda desejada por mês (R$)" id="vh-r"><TextInput id="vh-r" inputMode="decimal" value={renda} onChange={(e) => setRenda(e.target.value)} /></Field>
        <Field label="Custos mensais (R$)" id="vh-c" hint="Software, internet, equipamento, contador…"><TextInput id="vh-c" inputMode="decimal" value={custos} onChange={(e) => setCustos(e.target.value)} /></Field>
        <Field label="Horas produtivas por semana" id="vh-h"><TextInput id="vh-h" inputMode="decimal" value={horasSemana} onChange={(e) => setHorasSemana(e.target.value)} /></Field>
        <Field label="Semanas produtivas por mês" id="vh-s" hint="44 = quase sem folga · 40 = equilibrado · 36 = com férias"><TextInput id="vh-s" inputMode="decimal" value={semanasTrab} onChange={(e) => setSemanasTrab(e.target.value)} /></Field>
        <Field label="Impostos e taxas (%)" id="vh-i" hint="MEI ≈ 5% · Simples ≈ 6-15% · PJ 15-27%"><TextInput id="vh-i" inputMode="decimal" value={impostoPct} onChange={(e) => setImpostoPct(e.target.value)} /></Field>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <ResultCard label="Sua hora ideal" value={formatBRL(hora)} big />
        <ResultCard label="Horas no mês" value={`${horasMes.toFixed(0)}h`} tone="neutral" />
        <ResultCard label="Faturamento alvo/mês" value={formatBRL(custoComImposto)} tone="green" />
      </div>
    </ToolShell>
  );
}

/* ================= Precificação por custo e margem ================= */
export function PrecificacaoTool() {
  const [material, setMaterial] = useState('');
  const [maoDeObra, setMaoDeObra] = useState('');
  const [embalagem, setEmbalagem] = useState('');
  const [energia, setEnergia] = useState('');
  const [outros, setOutros] = useState('');
  const [taxas, setTaxas] = useState('');
  const [margemAlvo, setMargemAlvo] = useState('30');
  const [precoPraticado, setPrecoPraticado] = useState('');

  const custos = [material, maoDeObra, embalagem, energia, outros]
    .map((value) => Math.max(0, num(value)))
    .reduce((total, value) => total + value, 0);
  const feeRate = Math.min(99, Math.max(0, num(taxas))) / 100;
  const marginRate = Math.min(95, Math.max(0, num(margemAlvo))) / 100;
  const divisor = 1 - feeRate - marginRate;
  const recomendado = custos > 0 && divisor > 0 ? custos / divisor : 0;
  const praticado = Math.max(0, num(precoPraticado));
  const baseVenda = praticado || recomendado;
  const taxaEmReais = baseVenda * feeRate;
  const lucro = baseVenda - custos - taxaEmReais;
  const margemReal = baseVenda > 0 ? (lucro / baseVenda) * 100 : 0;

  return (
    <ToolShell title="Precificador de Produtos e Serviços" description="Some custos de produção, mão de obra e taxas para encontrar um preço de venda com margem definida">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Materiais e insumos (R$)" id="prec-material" hint="Ex.: caneca, papel, tinta, matéria-prima">
          <TextInput id="prec-material" inputMode="decimal" placeholder="0,00" value={material} onChange={(e) => setMaterial(e.target.value)} />
        </Field>
        <Field label="Mão de obra (R$)" id="prec-mao" hint="Inclua o tempo de produção e acabamento">
          <TextInput id="prec-mao" inputMode="decimal" placeholder="0,00" value={maoDeObra} onChange={(e) => setMaoDeObra(e.target.value)} />
        </Field>
        <Field label="Embalagem (R$)" id="prec-embalagem">
          <TextInput id="prec-embalagem" inputMode="decimal" placeholder="0,00" value={embalagem} onChange={(e) => setEmbalagem(e.target.value)} />
        </Field>
        <Field label="Energia e custos indiretos (R$)" id="prec-energia">
          <TextInput id="prec-energia" inputMode="decimal" placeholder="0,00" value={energia} onChange={(e) => setEnergia(e.target.value)} />
        </Field>
        <Field label="Outros custos por unidade (R$)" id="prec-outros">
          <TextInput id="prec-outros" inputMode="decimal" placeholder="0,00" value={outros} onChange={(e) => setOutros(e.target.value)} />
        </Field>
        <Field label="Taxas sobre a venda (%)" id="prec-taxas" hint="Cartão, marketplace ou comissão">
          <TextInput id="prec-taxas" inputMode="decimal" placeholder="0" value={taxas} onChange={(e) => setTaxas(e.target.value)} />
        </Field>
        <Field label="Margem de lucro desejada (%)" id="prec-margem" hint="Margem calculada sobre o preço de venda">
          <TextInput id="prec-margem" inputMode="decimal" placeholder="30" value={margemAlvo} onChange={(e) => setMargemAlvo(e.target.value)} />
        </Field>
        <Field label="Preço que você já cobra (opcional)" id="prec-praticado" hint="Compare seu preço atual com o recomendado">
          <TextInput id="prec-praticado" inputMode="decimal" placeholder="Deixe em branco para usar o recomendado" value={precoPraticado} onChange={(e) => setPrecoPraticado(e.target.value)} />
        </Field>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ResultCard label="Preço recomendado" value={divisor > 0 ? formatBRL(recomendado) : 'Revise as taxas'} big />
        <ResultCard label="Custo por unidade" value={formatBRL(custos)} tone="neutral" />
        <ResultCard label="Taxas estimadas" value={formatBRL(taxaEmReais)} tone="neutral" />
        <ResultCard label={precoPraticado ? 'Lucro no preço atual' : 'Lucro estimado'} value={formatBRL(lucro)} tone={lucro >= 0 ? 'green' : 'neutral'} />
      </div>
      {divisor <= 0 && custos > 0 && (
        <p role="alert" className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          A soma da margem desejada e das taxas precisa ser menor que 100% para calcular um preço viável.
        </p>
      )}
      {baseVenda > 0 && divisor > 0 && (
        <p className="mt-3 rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
          Margem estimada neste preço: <strong className="text-foreground">{margemReal.toFixed(1).replace('.', ',')}%</strong>. Informe custos por unidade; custos fixos mensais podem ser rateados em “Energia e custos indiretos”.
        </p>
      )}
    </ToolShell>
  );
}
