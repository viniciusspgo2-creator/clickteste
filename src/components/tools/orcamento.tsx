'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatBRL, formatDateBR, printHtmlDocument, fileToDataUrl } from '@/lib/helpers';
import {
  FileText, Plus, Trash2, ArrowUp, ArrowDown, Printer, Save, FolderOpen,
  Building2, User, Package, Receipt, Copy, ImagePlus, Loader2, RotateCcw,
} from 'lucide-react';

interface Item {
  id: number;
  descricao: string;
  qtd: string;
  unidade: string;
  valor: string;
}

interface FormState {
  // empresa
  empNome: string; empDoc: string; empTel: string; empEmail: string; empEnd: string; empLogo: string;
  // cliente
  cliNome: string; cliDoc: string; cliTel: string; cliEmail: string; cliEnd: string;
  // documento
  numero: string; data: string; validade: string; titulo: string;
  // condições
  pagamento: string; entrega: string; garantia: string; obs: string;
  // totais
  descontoTipo: 'pct' | 'brl';
  descontoValor: string;
  acrescimoDesc: string;
  acrescimoValor: string;
  assinaturaEmpresa: boolean;
  assinaturaCliente: boolean;
}

let itemSeq = 1;
const novoItem = (descricao = '', qtd = '1', unidade = 'un', valor = ''): Item => ({
  id: itemSeq++,
  descricao, qtd, unidade, valor,
});

const DEFAULT_FORM: FormState = {
  empNome: '', empDoc: '', empTel: '', empEmail: '', empEnd: '', empLogo: '',
  cliNome: '', cliDoc: '', cliTel: '', cliEmail: '', cliEnd: '',
  numero: '', data: new Date().toISOString().slice(0, 10), validade: '15',
  titulo: 'ORÇAMENTO',
  pagamento: 'PIX, dinheiro ou cartão', entrega: '', garantia: '90 dias', obs: '',
  descontoTipo: 'pct', descontoValor: '', acrescimoDesc: 'Frete/Deslocamento', acrescimoValor: '',
  assinaturaEmpresa: true, assinaturaCliente: true,
};

const num = (s: string) => {
  const v = parseFloat(s.replace(/\./g, '').replace(',', '.'));
  return isNaN(v) ? 0 : v;
};

export function Orcamento() {
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([
    novoItem('', '1', 'un', ''),
    novoItem('', '1', 'un', ''),
    novoItem('', '1', 'un', ''),
  ]);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Carrega rascunho salvo
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cg-orcamento-draft');
      if (raw) {
        const { form: f, items: it } = JSON.parse(raw);
        if (f) setForm(f);
        if (Array.isArray(it) && it.length) setItems(it);
        toast({ title: 'Rascunho restaurado', description: 'Recuperamos seu último orçamento salvo.' });
      }
    } catch { /* ignore */ }
     
  }, []);

  // Número automático
  useEffect(() => {
    if (!form.numero) {
      const now = new Date();
      const seq = String(Math.floor(Math.random() * 900) + 100);
      setForm((f) => ({ ...f, numero: `ORC-${now.getFullYear()}-${now.getMonth() + 1}${seq}` }));
    }
     
  }, []);

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, it) => acc + num(it.qtd) * num(it.valor), 0);
    const desconto = form.descontoTipo === 'pct' ? subtotal * (num(form.descontoValor) / 100) : num(form.descontoValor);
    const acrescimo = num(form.acrescimoValor);
    const total = Math.max(0, subtotal - desconto + acrescimo);
    return { subtotal, desconto, acrescimo, total };
  }, [items, form.descontoTipo, form.descontoValor, form.acrescimoValor]);

  const filledItems = items.filter((it) => it.descricao.trim() || num(it.valor) > 0);

  const setItem = (id: number, patch: Partial<Item>) =>
    setItems((arr) => arr.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const addItem = () => setItems((arr) => [...arr, novoItem()]);
  const removeItem = (id: number) => setItems((arr) => (arr.length > 1 ? arr.filter((it) => it.id !== id) : arr));
  const moveItem = (idx: number, dir: -1 | 1) =>
    setItems((arr) => {
      const next = [...arr];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return arr;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const dataUrl = await fileToDataUrl(f);
    setForm((s) => ({ ...s, empLogo: dataUrl }));
    toast({ title: 'Logo carregado!' });
  };

  const saveDraft = () => {
    try {
      localStorage.setItem('cg-orcamento-draft', JSON.stringify({ form, items }));
      toast({ title: 'Rascunho salvo!', description: 'Você pode fechar e voltar depois.' });
    } catch {
      toast({ title: 'Erro ao salvar rascunho', variant: 'destructive' });
    }
  };

  const loadDraft = () => {
    try {
      const raw = localStorage.getItem('cg-orcamento-draft');
      if (!raw) return toast({ title: 'Nenhum rascunho encontrado', variant: 'destructive' });
      const { form: f, items: it } = JSON.parse(raw);
      if (f) setForm(f);
      if (Array.isArray(it) && it.length) setItems(it);
      toast({ title: 'Rascunho carregado!' });
    } catch {
      toast({ title: 'Erro ao carregar', variant: 'destructive' });
    }
  };

  const resetAll = () => {
    setForm({ ...DEFAULT_FORM, numero: '' });
    setItems([novoItem(), novoItem(), novoItem()]);
    toast({ title: 'Formulário limpo' });
  };

  /* ---------- Documento HTML para impressão ---------- */
  const buildDocHtml = () => {
    const validade = new Date();
    validade.setDate(validade.getDate() + (parseInt(form.validade) || 0));

    const rows = filledItems
      .map(
        (it, i) => `
        <tr>
          <td style="text-align:center;color:#555">${i + 1}</td>
          <td>${it.descricao.replace(/</g, '&lt;')}</td>
          <td style="text-align:center">${it.qtd} ${it.unidade}</td>
          <td style="text-align:right">${formatBRL(num(it.valor))}</td>
          <td style="text-align:right;font-weight:600">${formatBRL(num(it.qtd) * num(it.valor))}</td>
        </tr>`
      )
      .join('');

    return `
    <div style="max-width:800px;margin:0 auto">
      <!-- Cabeçalho -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #e8703a;padding-bottom:16px;gap:20px">
        <div style="display:flex;gap:14px;align-items:center">
          ${form.empLogo ? `<img src="${form.empLogo}" alt="logo" style="max-height:64px;max-width:150px;object-fit:contain">` : ''}
          <div>
            <div style="font-size:18px;font-weight:800;color:#111">${form.empNome || 'Sua Empresa'}</div>
            ${form.empDoc ? `<div style="color:#666;font-size:11px">CNPJ/CPF: ${form.empDoc}</div>` : ''}
            <div style="color:#666;font-size:11px">${[form.empTel, form.empEmail].filter(Boolean).join(' · ')}</div>
            ${form.empEnd ? `<div style="color:#666;font-size:11px">${form.empEnd}</div>` : ''}
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:26px;font-weight:800;color:#e8703a;letter-spacing:1px">${form.titulo}</div>
          <div style="font-size:13px;font-weight:600">Nº ${form.numero}</div>
          <div style="color:#666;font-size:11px">Emissão: ${formatDateBR(form.data)}</div>
          <div style="color:#666;font-size:11px">Válido até: ${formatDateBR(validade)}</div>
        </div>
      </div>

      <!-- Cliente -->
      <div style="margin:18px 0;background:#f7f5f2;border:1px solid #e5e0d8;border-radius:8px;padding:14px">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#e8703a;margin-bottom:6px">Cliente</div>
        <div style="font-size:15px;font-weight:700">${form.cliNome || '—'}</div>
        <div style="color:#555;font-size:12px">
          ${[form.cliDoc && `Doc: ${form.cliDoc}`, form.cliTel && `Tel: ${form.cliTel}`, form.cliEmail, form.cliEnd].filter(Boolean).join(' · ')}
        </div>
      </div>

      <!-- Itens -->
      <table style="font-size:12px;margin-bottom:14px">
        <thead>
          <tr style="background:#111;color:#fff">
            <th style="padding:9px 10px;width:34px;text-align:center">#</th>
            <th style="padding:9px 10px;text-align:left">Descrição</th>
            <th style="padding:9px 10px;width:90px;text-align:center">Qtd.</th>
            <th style="padding:9px 10px;width:100px;text-align:right">Valor Unit.</th>
            <th style="padding:9px 10px;width:110px;text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#999">Nenhum item adicionado</td></tr>'}</tbody>
      </table>

      <!-- Totais -->
      <div style="display:flex;justify-content:flex-end;margin-bottom:18px">
        <table style="width:280px;font-size:12px">
          <tr><td style="padding:5px 8px;color:#555">Subtotal</td><td style="padding:5px 8px;text-align:right;font-weight:600">${formatBRL(totals.subtotal)}</td></tr>
          ${totals.desconto > 0 ? `<tr><td style="padding:5px 8px;color:#555">Desconto${form.descontoTipo === 'pct' ? ` (${num(form.descontoValor)}%)` : ''}</td><td style="padding:5px 8px;text-align:right;color:#16a34a;font-weight:600">- ${formatBRL(totals.desconto)}</td></tr>` : ''}
          ${totals.acrescimo > 0 ? `<tr><td style="padding:5px 8px;color:#555">${form.acrescimoDesc || 'Acréscimo'}</td><td style="padding:5px 8px;text-align:right;font-weight:600">+ ${formatBRL(totals.acrescimo)}</td></tr>` : ''}
          <tr style="background:#e8703a;color:#fff">
            <td style="padding:10px 8px;font-weight:700;font-size:14px">TOTAL</td>
            <td style="padding:10px 8px;text-align:right;font-weight:800;font-size:16px">${formatBRL(totals.total)}</td>
          </tr>
        </table>
      </div>

      <!-- Condições -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:11.5px;margin-bottom:20px">
        ${form.pagamento ? `<div style="border:1px solid #e5e0d8;border-radius:8px;padding:10px"><b style="color:#e8703a">Forma de pagamento</b><br>${form.pagamento.replace(/</g, '&lt;')}</div>` : ''}
        ${form.entrega ? `<div style="border:1px solid #e5e0d8;border-radius:8px;padding:10px"><b style="color:#e8703a">Prazo de entrega/execução</b><br>${form.entrega.replace(/</g, '&lt;')}</div>` : ''}
        ${form.garantia ? `<div style="border:1px solid #e5e0d8;border-radius:8px;padding:10px"><b style="color:#e8703a">Garantia</b><br>${form.garantia.replace(/</g, '&lt;')}</div>` : ''}
        ${form.obs ? `<div style="border:1px solid #e5e0d8;border-radius:8px;padding:10px"><b style="color:#e8703a">Observações</b><br>${form.obs.replace(/</g, '&lt;').replace(/\n/g, '<br>')}</div>` : ''}
      </div>

      <!-- Assinaturas -->
      ${(form.assinaturaEmpresa || form.assinaturaCliente) ? `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:50px;font-size:11px;text-align:center;color:#444">
        ${form.assinaturaEmpresa ? `<div><div style="border-top:1px solid #333;padding-top:5px">${form.empNome || 'Responsável pela empresa'}<br><span style="color:#888">${form.empNome ? 'Contratado' : ''}</span></div></div>` : ''}
        ${form.assinaturaCliente ? `<div><div style="border-top:1px solid #333;padding-top:5px">${form.cliNome || 'Cliente'}<br><span style="color:#888">${form.cliNome ? 'Contratante' : ''}</span></div></div>` : ''}
      </div>` : ''}

      <div style="margin-top:26px;border-top:1px solid #e5e0d8;padding-top:8px;text-align:center;color:#aaa;font-size:9.5px">
        Gerado com Click &amp; Gruda Tools — clickgruda.vercel.app
      </div>
    </div>`;
  };

  const exportPdf = () => {
    if (!filledItems.length && !form.cliNome) {
      toast({ title: 'Preencha os dados antes de exportar', variant: 'destructive' });
      return;
    }
    printHtmlDocument(`Orcamento ${form.numero}`, buildDocHtml());
    toast({ title: 'Abrindo impressão…', description: 'Escolha "Salvar como PDF" na janela de impressão.' });
  };

  const inputCls = 'h-10';
  const field = (label: string, key: keyof FormState, placeholder = '', type = 'text') => (
    <div>
      <Label htmlFor={`orc-${key}`} className="text-xs">{label}</Label>
      <Input
        id={`orc-${key}`} type={type} placeholder={placeholder} value={form[key] as string}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className={`mt-1.5 ${inputCls}`}
      />
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_460px]">
      {/* ===== Formulário ===== */}
      <div className="space-y-6">
        {/* Ações rápidas */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportPdf} className="gap-2 bg-primary text-primary-foreground transition-transform hover:bg-primary/90 active:scale-95">
            <Printer className="h-4 w-4" /> Exportar PDF
          </Button>
          <Button onClick={saveDraft} variant="outline" className="gap-2"><Save className="h-4 w-4" /> Salvar rascunho</Button>
          <Button onClick={loadDraft} variant="outline" className="gap-2"><FolderOpen className="h-4 w-4" /> Carregar</Button>
          <Button onClick={resetAll} variant="ghost" className="gap-2 text-muted-foreground hover:text-destructive"><RotateCcw className="h-4 w-4" /> Limpar tudo</Button>
        </div>

        {/* Empresa */}
        <section className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary"><Building2 className="h-4 w-4" /></span>
            <h3 className="font-display text-lg font-semibold">Sua empresa</h3>
          </div>
          <div className="mb-4 flex items-center gap-4">
            {form.empLogo ? (
              <div className="relative">
                { }
                <img src={form.empLogo} alt="Logo da empresa" className="h-16 w-16 rounded-xl border border-border object-contain p-1" />
                <button
                  onClick={() => setForm((f) => ({ ...f, empLogo: '' }))}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
                  aria-label="Remover logo"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => logoInputRef.current?.click()}
                className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                <ImagePlus className="h-5 w-5" />
                <span className="text-[9px]">Logo</span>
              </button>
            )}
            <input ref={logoInputRef} type="file" accept="image/*" className="sr-only" onChange={uploadLogo} />
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              {field('Nome / Razão social', 'empNome', 'Click & Gruda')}
              {field('CNPJ / CPF', 'empDoc', '00.000.000/0000-00')}
              {field('Telefone', 'empTel', '(62) 99999-8888')}
              {field('E-mail', 'empEmail', 'contato@empresa.com')}
            </div>
          </div>
          {field('Endereço', 'empEnd', 'Rua, nº — Cidade/UF')}
        </section>

        {/* Cliente */}
        <section className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary"><User className="h-4 w-4" /></span>
            <h3 className="font-display text-lg font-semibold">Dados do cliente</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {field('Nome do cliente', 'cliNome', 'Maria Silva')}
            {field('CNPJ / CPF', 'cliDoc', '000.000.000-00')}
            {field('Telefone', 'cliTel', '(62) 99999-8888')}
            {field('E-mail', 'cliEmail', 'cliente@email.com')}
          </div>
          {field('Endereço', 'cliEnd', 'Rua, nº — Cidade/UF')}
        </section>

        {/* Itens */}
        <section className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary"><Package className="h-4 w-4" /></span>
            <h3 className="font-display text-lg font-semibold">Itens do orçamento</h3>
            <Badge variant="secondary" className="ml-auto">{filledItems.length} itens</Badge>
          </div>

          <div className="space-y-3">
            {items.map((it, idx) => (
              <div key={it.id} className="group relative rounded-xl border border-border bg-secondary/30 p-3 transition-colors focus-within:border-primary/40">
                <div className="grid grid-cols-[24px_1fr_64px_92px_96px_28px] items-center gap-2 sm:grid-cols-[28px_1fr_60px_100px_110px_60px]">
                  <span className="text-center font-mono text-xs text-muted-foreground">{idx + 1}</span>
                  <Input placeholder="Descrição do item/serviço…" value={it.descricao} onChange={(e) => setItem(it.id, { descricao: e.target.value })} className="h-9" />
                  <Input inputMode="decimal" placeholder="Qtd" value={it.qtd} onChange={(e) => setItem(it.id, { qtd: e.target.value })} className="h-9" />
                  <Input placeholder="un" value={it.unidade} onChange={(e) => setItem(it.id, { unidade: e.target.value })} className="h-9" />
                  <Input inputMode="decimal" placeholder="0,00" value={it.valor} onChange={(e) => setItem(it.id, { valor: e.target.value })} className="h-9" />
                  <div className="flex items-center justify-end gap-0.5">
                    <button onClick={() => moveItem(idx, -1)} aria-label="Subir" className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100 disabled:opacity-0" disabled={idx === 0}><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button onClick={() => moveItem(idx, 1)} aria-label="Descer" className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100" disabled={idx === items.length - 1}><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button onClick={() => removeItem(it.id)} aria-label="Remover" className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between pl-8">
                  <button
                    onClick={() => { setItems((arr) => [...arr.slice(0, idx + 1), novoItem(it.descricao, it.qtd, it.unidade, it.valor), ...arr.slice(idx + 1)]); }}
                    className="text-[10px] text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
                  >
                    <Copy className="mr-1 inline h-3 w-3" /> duplicar
                  </button>
                  <span className="text-xs font-semibold text-primary">
                    {num(it.qtd) * num(it.valor) > 0 && formatBRL(num(it.qtd) * num(it.valor))}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={addItem} variant="outline" className="mt-3 w-full gap-2 border-dashed border-primary/40 text-primary hover:bg-primary/10">
            <Plus className="h-4 w-4" /> Adicionar item
          </Button>
        </section>

        {/* Condições */}
        <section className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary"><Receipt className="h-4 w-4" /></span>
            <h3 className="font-display text-lg font-semibold">Condições e observações</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {field('Nº do orçamento', 'numero')}
            {field('Data de emissão', 'data', '', 'date')}
            <div>
              <Label className="text-xs">Validade (dias)</Label>
              <Select value={form.validade} onValueChange={(v) => setForm((f) => ({ ...f, validade: v }))}>
                <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['7', '10', '15', '30', '60'].map((d) => <SelectItem key={d} value={d}>{d} dias</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {field('Forma de pagamento', 'pagamento', 'PIX, cartão, dinheiro…')}
            {field('Prazo de entrega/execução', 'entrega', 'Ex: 10 dias úteis')}
            {field('Garantia', 'garantia', 'Ex: 90 dias')}
          </div>
          <div className="mt-3">
            <Label htmlFor="orc-obs" className="text-xs">Observações adicionais</Label>
            <Textarea id="orc-obs" value={form.obs} onChange={(e) => setForm((f) => ({ ...f, obs: e.target.value }))} className="mt-1.5 min-h-20" placeholder="Informações complementares…" />
          </div>

          <Separator className="my-4" />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <Label className="text-xs">Desconto</Label>
              <div className="mt-1.5 flex gap-2">
                <Select value={form.descontoTipo} onValueChange={(v) => setForm((f) => ({ ...f, descontoTipo: v as 'pct' | 'brl' }))}>
                  <SelectTrigger className="h-10 w-[74px] shrink-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pct">%</SelectItem>
                    <SelectItem value="brl">R$</SelectItem>
                  </SelectContent>
                </Select>
                <Input inputMode="decimal" placeholder="0" value={form.descontoValor} onChange={(e) => setForm((f) => ({ ...f, descontoValor: e.target.value }))} className="h-10" />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <Label className="text-xs">Acréscimo (frete, taxa…)</Label>
              <div className="mt-1.5 flex gap-2">
                <Input placeholder="Descrição" value={form.acrescimoDesc} onChange={(e) => setForm((f) => ({ ...f, acrescimoDesc: e.target.value }))} className="h-10 flex-1" />
                <Input inputMode="decimal" placeholder="0,00" value={form.acrescimoValor} onChange={(e) => setForm((f) => ({ ...f, acrescimoValor: e.target.value }))} className="h-10 w-24" />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch id="sig-emp" checked={form.assinaturaEmpresa} onCheckedChange={(v) => setForm((f) => ({ ...f, assinaturaEmpresa: v }))} />
              <Label htmlFor="sig-emp" className="text-xs">Campo de assinatura — empresa</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="sig-cli" checked={form.assinaturaCliente} onCheckedChange={(v) => setForm((f) => ({ ...f, assinaturaCliente: v }))} />
              <Label htmlFor="sig-cli" className="text-xs">Campo de assinatura — cliente</Label>
            </div>
          </div>
        </section>
      </div>

      {/* ===== Preview ===== */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <section className="glass-card glow-brand rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Pré-visualização</h3>
            <Badge className="border-primary/40 bg-primary/20 text-primary-foreground">Ao vivo</Badge>
          </div>

          {/* Mini documento */}
          <div className="thin-scroll max-h-[560px] overflow-y-auto rounded-xl bg-white p-4 text-[#16181d] shadow-inner">
            <div className="flex items-start justify-between gap-3 border-b-[3px] border-[#e8703a] pb-3">
              <div className="flex items-center gap-2">
                {form.empLogo && (
                   
                  <img src={form.empLogo} alt="logo" className="max-h-10 max-w-20 object-contain" />
                )}
                <div>
                  <p className="text-sm font-extrabold leading-tight">{form.empNome || 'Sua Empresa'}</p>
                  <p className="text-[9px] text-neutral-500">{[form.empDoc, form.empTel].filter(Boolean).join(' · ')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-extrabold tracking-wide text-[#e8703a]">{form.titulo}</p>
                <p className="text-[10px] font-semibold">Nº {form.numero}</p>
                <p className="text-[9px] text-neutral-500">{formatDateBR(form.data)}</p>
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-[#f7f5f2] p-2.5">
              <p className="text-[8px] font-bold uppercase tracking-wider text-[#e8703a]">Cliente</p>
              <p className="text-xs font-bold">{form.cliNome || '—'}</p>
              <p className="text-[9px] text-neutral-500">{[form.cliTel, form.cliEmail].filter(Boolean).join(' · ')}</p>
            </div>

            <table className="mt-3 w-full text-[9.5px]">
              <thead>
                <tr className="bg-[#111] text-white">
                  <th className="p-1.5 text-left font-semibold">Descrição</th>
                  <th className="p-1.5 text-center font-semibold">Qtd</th>
                  <th className="p-1.5 text-right font-semibold">Unit.</th>
                  <th className="p-1.5 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {filledItems.length === 0 && (
                  <tr><td colSpan={4} className="p-3 text-center text-neutral-400">Adicione itens ao orçamento…</td></tr>
                )}
                {filledItems.map((it) => (
                  <tr key={it.id} className="border-b border-neutral-100">
                    <td className="p-1.5">{it.descricao || <span className="text-neutral-300">—</span>}</td>
                    <td className="p-1.5 text-center">{it.qtd} {it.unidade}</td>
                    <td className="p-1.5 text-right">{formatBRL(num(it.valor))}</td>
                    <td className="p-1.5 text-right font-semibold">{formatBRL(num(it.qtd) * num(it.valor))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-3 ml-auto w-40 text-[10px]">
              <div className="flex justify-between py-0.5 text-neutral-500"><span>Subtotal</span><span className="font-semibold text-neutral-800">{formatBRL(totals.subtotal)}</span></div>
              {totals.desconto > 0 && (
                <div className="flex justify-between py-0.5 text-neutral-500"><span>Desconto</span><span className="font-semibold text-green-600">- {formatBRL(totals.desconto)}</span></div>
              )}
              {totals.acrescimo > 0 && (
                <div className="flex justify-between py-0.5 text-neutral-500"><span>{form.acrescimoDesc || 'Acréscimo'}</span><span className="font-semibold text-neutral-800">+ {formatBRL(totals.acrescimo)}</span></div>
              )}
              <div className="mt-1 flex justify-between rounded-md bg-[#e8703a] px-2 py-1.5 font-bold text-white"><span>TOTAL</span><span>{formatBRL(totals.total)}</span></div>
            </div>

            {(form.assinaturaEmpresa || form.assinaturaCliente) && (
              <div className="mt-8 grid grid-cols-2 gap-8 text-center text-[8px] text-neutral-500">
                {form.assinaturaEmpresa && <div className="border-t border-neutral-400 pt-1">{form.empNome || 'Empresa'}</div>}
                {form.assinaturaCliente && <div className="border-t border-neutral-400 pt-1">{form.cliNome || 'Cliente'}</div>}
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
              <span className="text-sm text-muted-foreground">Total geral</span>
              <span className="font-display text-xl font-bold text-primary">{formatBRL(totals.total)}</span>
            </div>
            <Button onClick={exportPdf} className="w-full gap-2 bg-primary text-primary-foreground transition-transform hover:bg-primary/90 active:scale-95">
              <Printer className="h-4 w-4" /> Baixar / Imprimir PDF
            </Button>
          </div>
        </section>
      </div>
    </div>
  );

}
