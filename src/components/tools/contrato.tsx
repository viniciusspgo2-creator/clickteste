'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatBRL, formatDateBR, printHtmlDocument } from '@/lib/helpers';
import {
  Scale, Printer, Save, FolderOpen, RotateCcw, Plus, Trash2,
  Building2, User, PenLine, ScrollText, FileText,
} from 'lucide-react';

type ContractType = 'servicos' | 'venda' | 'nda' | 'freelancer' | 'manutencao';

const CONTRACT_TYPES: { value: ContractType; label: string; icon: string }[] = [
  { value: 'servicos', label: 'Prestação de Serviços', icon: '🛠️' },
  { value: 'venda', label: 'Compra e Venda', icon: '🛒' },
  { value: 'nda', label: 'Confidencialidade (NDA)', icon: '🤫' },
  { value: 'freelancer', label: 'Freelancer / Design', icon: '🎨' },
  { value: 'manutencao', label: 'Manutenção Continuada', icon: '🔧' },
];

interface FormState {
  tipo: ContractType;
  titulo: string;
  // contratante
  cteNome: string; cteDoc: string; cteEnd: string; cteTel: string;
  // contratado
  cdoNome: string; cdoDoc: string; cdoEnd: string; cdoTel: string;
  // conteúdo
  objeto: string;
  valor: string;
  valorExtenso: string;
  pagamento: string;
  prazo: string;
  rescisao: string;
  multa: string;
  foro: string;
  cidade: string;
  data: string;
  clausulasExtra: string[];
  // testemunhas e assinaturas
  test1: string; test2: string;
  sigCte: boolean; sigCdo: boolean; sigTest: boolean;
}

const DEFAULT_FORM: FormState = {
  tipo: 'servicos',
  titulo: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS',
  cteNome: '', cteDoc: '', cteEnd: '', cteTel: '',
  cdoNome: '', cdoDoc: '', cdoEnd: '', cdoTel: '',
  objeto: '',
  valor: '',
  valorExtenso: '',
  pagamento: '',
  prazo: '',
  rescisao: '30 dias de aviso prévio',
  multa: '2%',
  foro: '',
  cidade: '',
  data: new Date().toISOString().slice(0, 10),
  clausulasExtra: [''],
  test1: '', test2: '',
  sigCte: true, sigCdo: true, sigTest: false,
};

const num = (s: string) => {
  const v = parseFloat(s.replace(/\./g, '').replace(',', '.'));
  return isNaN(v) ? 0 : v;
};

export function Contrato() {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cg-contrato-draft');
      if (raw) {
        setForm(JSON.parse(raw));
        toast({ title: 'Rascunho restaurado', description: 'Recuperamos seu último contrato salvo.' });
      }
    } catch { /* ignore */ }
     
  }, []);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const changeType = (t: ContractType) => {
    const titles: Record<ContractType, string> = {
      servicos: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS',
      venda: 'CONTRATO DE COMPRA E VENDA',
      nda: 'CONTRATO DE CONFIDENCIALIDADE (NDA)',
      freelancer: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS FREELANCER',
      manutencao: 'CONTRATO DE MANUTENÇÃO CONTINUADA',
    };
    set({ tipo: t, titulo: titles[t] });
  };

  const total = num(form.valor);

  /* ---------- Cláusulas geradas por tipo ---------- */
  const clauses = useMemo(() => {
    const c: { title: string; text: string }[] = [];
    const cte = form.cteNome || 'CONTRATANTE';
    const cdo = form.cdoNome || 'CONTRATADO';

    c.push({
      title: 'Das Partes',
      text: `${cte}${form.cteDoc ? `, inscrito(a) sob o CPF/CNPJ nº ${form.cteDoc}` : ''}${form.cteEnd ? `, residente e domiciliado(a) em ${form.cteEnd}` : ''}, doravante denominada(a) CONTRATANTE, e ${cdo}${form.cdoDoc ? `, inscrito(a) sob o CPF/CNPJ nº ${form.cdoDoc}` : ''}${form.cdoEnd ? `, residente e domiciliado(a) em ${form.cdoEnd}` : ''}, doravante denominado(a) CONTRATADO, têm, entre si, justo e acertado o presente contrato, que se regerá pelas cláusulas seguintes e pelas disposições legais aplicáveis.`,
    });

    c.push({
      title: 'Do Objeto',
      text: `CLÁUSULA 1ª — O presente contrato tem como objeto ${form.objeto || '[descreva o objeto do contrato]'}. O CONTRATADO compromete-se a executar o objeto contratado com diligência, zelo e técnica adequada, observando as melhores práticas da atividade.`,
    });

    if (form.tipo === 'servicos' || form.tipo === 'freelancer' || form.tipo === 'manutencao') {
      c.push({
        title: 'Da Execução dos Serviços',
        text: `CLÁUSULA 2ª — Os serviços serão executados de forma dedicada pelo CONTRATADO, que comunicará prontamente o CONTRATANTE qualquer impedimento relevante ao bom andamento dos trabalhos. ${form.prazo ? `O prazo para execução/entrega é de ${form.prazo}, contado da assinatura deste instrumento ou do recebimento das informações necessárias.` : 'O prazo de execução será acordado entre as partes conforme a demanda.'}`,
      });
      c.push({
        title: 'Das Alterações de Escopo',
        text: `CLÁUSULA 3ª — Alterações de escopo solicitadas pelo CONTRATANTE que aumentem a complexidade ou o volume dos serviços serão objeto de aditivo contratual, com ajuste proporcional de prazo e valores, mediante aceite expresso das partes.`,
      });
    }

    if (form.tipo === 'venda') {
      c.push({
        title: 'Da Entrega',
        text: `CLÁUSULA 2ª — O produto será entregue nas condições ajustadas. ${form.prazo ? `Prazo de entrega: ${form.prazo}.` : ''} A verificação das condições do produto deverá ocorrer no ato do recebimento, declinando o CONTRATANTE por escrito, em até 48 (quarenta e oito) horas, eventuais não conformidades aparentes.`,
      });
      c.push({
        title: 'Da Garantia',
        text: `CLÁUSULA 3ª — O produto conta com garantia legal de 90 (noventa) dias, contada do recebimento, aplicando-se a legislação consumerista vigente, excluídos defeitos decorrentes de mau uso, acidentes ou intervenções não autorizadas.`,
      });
    }

    if (form.tipo === 'nda') {
      c.push({
        title: 'Da Confidencialidade',
        text: `CLÁUSULA 2ª — A parte receptora compromete-se a manter sigilo absoluto sobre todas as informações confidenciais da parte reveladora — incluindo, sem limitação, dados comerciais, técnicos, financeiros, estratégias, projetos, arquivos e segredos de negócio — não as revelando a terceiros nem utilizando-as para fins distintos do objeto deste contrato, durante sua vigência e pelos próximos 5 (cinco) anos após seu término.`,
      });
      c.push({
        title: 'Das Exceções',
        text: `CLÁUSULA 3ª — Não constituem violação as informações que: (a) sejam de domínio público sem culpa da parte receptora; (b) já fossem lícitamente conhecidas antes do presente contrato; (c) sejam desenvolvidas de forma independente; ou (d) sua divulgação seja exigida por lei ou ordem judicial, mediante comunicação prévia à parte reveladora quando possível.`,
      });
    }

    c.push({
      title: 'Do Valor e Forma de Pagamento',
      text: `CLÁUSULA ${c.length}ª — Pelo cumprimento do objeto, o CONTRATANTE pagará ao CONTRATADO o valor de ${total > 0 ? formatBRL(total) : '[valor a definir]'}${form.valorExtenso ? ` (${form.valorExtenso})` : ''}.${form.pagamento ? ` O pagamento será realizado da seguinte forma: ${form.pagamento}.` : ' A forma de pagamento será acordada entre as partes.'} Na hipótese de atraso, incidirá multa moratória de ${form.multa || '2%'} sobre o montante devido, acrescida de juros de 1% (um por cento) ao mês pro rata die.`,
    });

    c.push({
      title: 'Da Vigência e Rescisão',
      text: `CLÁUSULA ${c.length}ª — O presente contrato vigorará a partir de sua assinatura até o cumprimento integral das obrigações.${form.rescisao ? ` O descumprimento de qualquer cláusula autoriza a rescisão unilateral mediante aviso prévio de ${form.rescisao}, sem prejuízo das demais penalidades aplicáveis.` : ''} Rescindido o contrato, pagas estarão as parcelas proporcionalmente devidas pelo que efetivamente executado.`,
    });

    c.push({
      title: 'Da Propriedade Intelectual',
      text: `CLÁUSULA ${c.length}ª — Todos os direitos patrimoniais sobre os resultados, entregas e criações derivadas do objeto deste contrato serão transferidos ao CONTRATANTE após a quitação integral dos valores devidos, ressalvados os direitos morais e as ferramentas, bibliotecas e conhecimentos gerais já detidos pelo CONTRATADO.`,
    });

    c.push({
      title: 'Das Disposições Gerais',
      text: `CLÁUSULA ${c.length}ª — Este contrato obriga as partes e seus sucessores. A tolerância quanto à exigência de qualquer obrigação não configurará novação ou renúncia. Fica eleito o foro da comarca de ${form.foro || form.cidade || '[comarca a definir]'} para dirimir eventuais controvérsias, com renúncia a qualquer outro, por mais privilegiado que seja.`,
    });

    return c;
  }, [form, total]);

  const buildDocHtml = () => {
    const extras = form.clausulasExtra
      .filter((c) => c.trim())
      .map((c, i) => `<p style="margin-top:10px"><b>CLÁUSULA ADICIONAL ${i + 1}ª</b> — ${c.replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`)
      .join('');

    return `
    <div style="max-width:800px;margin:0 auto;font-size:12.5px;line-height:1.7">
      <h1 style="text-align:center;font-size:17px;margin-bottom:4px">${form.titulo}</h1>
      <p style="text-align:center;color:#888;font-size:10px;margin-bottom:20px">Identificador: CTR-${form.data.replaceAll('-', '')}-${(form.cteNome || 'A').slice(0, 3).toUpperCase()}${(form.cdoNome || 'B').slice(0, 3).toUpperCase()}</p>

      ${clauses.map((c) => `<p style="margin-bottom:10px"><b>${c.title.toUpperCase()}</b></p><p style="text-align:justify;margin-bottom:14px">${c.text}</p>`).join('')}
      ${extras}

      ${form.cidade ? `<p style="margin-top:24px">${form.cidade}, ${formatDateBR(form.data)}.</p>` : `<p style="margin-top:24px">${formatDateBR(form.data)}.</p>`}

      <div style="margin-top:46px;text-align:center;font-size:11.5px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px">
          ${form.sigCdo ? `<div><div style="border-top:1px solid #333;padding-top:6px"><b>${form.cdoNome || 'CONTRATADO'}</b><br><span style="color:#888">${form.cdoDoc ? `CPF/CNPJ: ${form.cdoDoc}` : ''}</span></div></div>` : ''}
          ${form.sigCte ? `<div><div style="border-top:1px solid #333;padding-top:6px"><b>${form.cteNome || 'CONTRATANTE'}</b><br><span style="color:#888">${form.cteDoc ? `CPF/CNPJ: ${form.cteDoc}` : ''}</span></div></div>` : ''}
        </div>
        ${form.sigTest && (form.test1 || form.test2) ? `
        <div style="margin-top:34px;font-size:10.5px;color:#555">
          <p style="margin-bottom:16px"><b>TESTEMUNHAS:</b></p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px">
            ${form.test1 ? `<div><div style="border-top:1px solid #333;padding-top:6px">${form.test1}</div></div>` : '<div></div>'}
            ${form.test2 ? `<div><div style="border-top:1px solid #333;padding-top:6px">${form.test2}</div></div>` : '<div></div>'}
          </div>
        </div>` : ''}
      </div>

      <div style="margin-top:30px;border-top:1px solid #e5e0d8;padding-top:8px;text-align:center;color:#aaa;font-size:9.5px">
        Gerado com Click &amp; Gruda Tools — clickgruda.vercel.app — Este documento é um modelo e não substitui aconselhamento jurídico.
      </div>
    </div>`;
  };

  const exportPdf = () => {
    if (!form.cteNome || !form.cdoNome || !form.objeto) {
      toast({ title: 'Preencha as partes e o objeto do contrato', variant: 'destructive' });
      return;
    }
    printHtmlDocument(form.titulo, buildDocHtml());
    toast({ title: 'Abrindo impressão…', description: 'Escolha "Salvar como PDF" na janela de impressão.' });
  };

  const saveDraft = () => {
    try {
      localStorage.setItem('cg-contrato-draft', JSON.stringify(form));
      toast({ title: 'Rascunho salvo!' });
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    }
  };

  const loadDraft = () => {
    try {
      const raw = localStorage.getItem('cg-contrato-draft');
      if (!raw) return toast({ title: 'Nenhum rascunho encontrado', variant: 'destructive' });
      setForm(JSON.parse(raw));
      toast({ title: 'Rascunho carregado!' });
    } catch {
      toast({ title: 'Erro ao carregar', variant: 'destructive' });
    }
  };

  const inputCls = 'h-10';
  const field = (label: string, key: keyof FormState, placeholder = '') => (
    <div>
      <Label htmlFor={`ctr-${key}`} className="text-xs">{label}</Label>
      <Input
        id={`ctr-${key}`} placeholder={placeholder} value={form[key] as string}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className={`mt-1.5 ${inputCls}`}
      />
    </div>
  );

  const wordCount = buildDocHtml().replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_460px]">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportPdf} className="gap-2 bg-primary text-primary-foreground transition-transform hover:bg-primary/90 active:scale-95">
            <Printer className="h-4 w-4" /> Exportar PDF
          </Button>
          <Button onClick={saveDraft} variant="outline" className="gap-2"><Save className="h-4 w-4" /> Salvar rascunho</Button>
          <Button onClick={loadDraft} variant="outline" className="gap-2"><FolderOpen className="h-4 w-4" /> Carregar</Button>
          <Button onClick={() => { setForm({ ...DEFAULT_FORM }); toast({ title: 'Formulário limpo' }); }} variant="ghost" className="gap-2 text-muted-foreground hover:text-destructive">
            <RotateCcw className="h-4 w-4" /> Limpar
          </Button>
        </div>

        {/* Tipo */}
        <section className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary"><Scale className="h-4 w-4" /></span>
            <h3 className="font-display text-lg font-semibold">Tipo de contrato</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {CONTRACT_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => changeType(t.value)}
                className={`rounded-xl border p-3 text-center text-xs font-medium transition-all active:scale-95 ${
                  form.tipo === t.value
                    ? 'border-primary bg-primary/15 text-foreground glow-brand'
                    : 'border-border bg-secondary/40 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                <span className="mb-1 block text-lg">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
          <div className="mt-4">
            {field('Título do documento', 'titulo')}
          </div>
        </section>

        {/* Partes */}
        <section className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary"><User className="h-4 w-4" /></span>
            <h3 className="font-display text-lg font-semibold">Partes envolvidas</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-primary">Contratante (cliente)</p>
              <div className="space-y-3">
                {field('Nome / Razão social', 'cteNome', 'Maria Silva')}
                {field('CPF / CNPJ', 'cteDoc', '000.000.000-00')}
                {field('Endereço', 'cteEnd', 'Rua, nº — Cidade/UF')}
                {field('Telefone / E-mail', 'cteTel', '(62) 9…')}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-primary">Contratado (você)</p>
              <div className="space-y-3">
                {field('Nome / Razão social', 'cdoNome', 'Click & Gruda ME')}
                {field('CPF / CNPJ', 'cdoDoc', '00.000.000/0000-00')}
                {field('Endereço', 'cdoEnd', 'Rua, nº — Cidade/UF')}
                {field('Telefone / E-mail', 'cdoTel', '(62) 9…')}
              </div>
            </div>
          </div>
        </section>

        {/* Conteúdo */}
        <section className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary"><PenLine className="h-4 w-4" /></span>
            <h3 className="font-display text-lg font-semibold">Conteúdo do acordo</h3>
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="ctr-objeto" className="text-xs">Objeto do contrato *</Label>
              <Textarea
                id="ctr-objeto" value={form.objeto} onChange={(e) => set({ objeto: e.target.value })}
                className="mt-1.5 min-h-24"
                placeholder="Ex: criação de identidade visual completa, incluindo logotipo, paleta de cores, manual de marca e 5 artes para redes sociais…"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Valor total (R$)</Label>
                <Input inputMode="decimal" placeholder="1500,00" value={form.valor} onChange={(e) => set({ valor: e.target.value })} className="mt-1.5 h-10" />
              </div>
              <div>
                <Label className="text-xs">Valor por extenso</Label>
                <Input placeholder="um mil e quinhentos reais" value={form.valorExtenso} onChange={(e) => set({ valorExtenso: e.target.value })} className="mt-1.5 h-10" />
              </div>
              <div>
                <Label className="text-xs">Forma de pagamento</Label>
                <Input placeholder="50% na assinatura + 50% na entrega" value={form.pagamento} onChange={(e) => set({ pagamento: e.target.value })} className="mt-1.5 h-10" />
              </div>
              <div>
                <Label className="text-xs">Prazo de execução/entrega</Label>
                <Input placeholder="30 dias corridos" value={form.prazo} onChange={(e) => set({ prazo: e.target.value })} className="mt-1.5 h-10" />
              </div>
              <div>
                <Label className="text-xs">Multa por atraso (%)</Label>
                <Input inputMode="decimal" value={form.multa} onChange={(e) => set({ multa: e.target.value })} className="mt-1.5 h-10" />
              </div>
              <div>
                <Label className="text-xs">Aviso prévio p/ rescisão</Label>
                <Input value={form.rescisao} onChange={(e) => set({ rescisao: e.target.value })} className="mt-1.5 h-10" />
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Cláusulas adicionais (opcional)</Label>
            {form.clausulasExtra.map((c, i) => (
              <div key={i} className="flex gap-2">
                <Textarea
                  value={c}
                  onChange={(e) => {
                    const arr = [...form.clausulasExtra];
                    arr[i] = e.target.value;
                    set({ clausulasExtra: arr });
                  }}
                  placeholder={`Texto da cláusula adicional ${i + 1}…`}
                  className="min-h-16 flex-1"
                />
                <Button
                  variant="ghost" size="icon"
                  onClick={() => set({ clausulasExtra: form.clausulasExtra.filter((_, j) => j !== i) })}
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Remover cláusula"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline" size="sm"
              onClick={() => set({ clausulasExtra: [...form.clausulasExtra, ''] })}
              className="gap-1.5 border-dashed border-primary/40 text-primary hover:bg-primary/10"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar cláusula
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="grid gap-3 sm:grid-cols-2">
            {field('Cidade de assinatura', 'cidade', 'Goiânia')}
            <div>
              <Label className="text-xs">Data</Label>
              <Input type="date" value={form.data} onChange={(e) => set({ data: e.target.value })} className="mt-1.5 h-10" />
            </div>
            {field('Foro / comarca', 'foro', 'Goiânia — GO')}
            {field('Testemunha 1', 'test1', 'Nome completo')}
            {field('Testemunha 2', 'test2', 'Nome completo')}
          </div>
        </section>
      </div>

      {/* Preview */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <section className="glass-card glow-brand rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Pré-visualização</h3>
            <Badge className="border-primary/40 bg-primary/20 text-primary-foreground">{wordCount} palavras</Badge>
          </div>

          <div className="thin-scroll max-h-[540px] overflow-y-auto rounded-xl bg-white p-5 text-[#16181d]">
            <p className="text-center text-[11px] font-extrabold uppercase leading-snug">{form.titulo}</p>
            <div className="mt-3 space-y-2 text-[8.5px] leading-relaxed text-neutral-700">
              {clauses.map((c) => (
                <div key={c.title}>
                  <p className="font-bold text-neutral-900">{c.title.toUpperCase()}</p>
                  <p className="text-justify">{c.text}</p>
                </div>
              ))}
              {form.clausulasExtra.filter((c) => c.trim()).map((c, i) => (
                <div key={`extra-${i}`}>
                  <p className="font-bold text-neutral-900">CLÁUSULA ADICIONAL {i + 1}ª</p>
                  <p className="text-justify">{c}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[8px] text-neutral-500">{form.cidade ? `${form.cidade}, ` : ''}{formatDateBR(form.data)}</p>
            <div className="mt-6 grid grid-cols-2 gap-6 text-center text-[7px] text-neutral-500">
              {form.sigCdo && <div className="border-t border-neutral-400 pt-1 text-[8px] font-semibold text-neutral-700">{form.cdoNome || 'CONTRATADO'}</div>}
              {form.sigCte && <div className="border-t border-neutral-400 pt-1 text-[8px] font-semibold text-neutral-700">{form.cteNome || 'CONTRATANTE'}</div>}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-muted-foreground"><ScrollText className="h-4 w-4" /> Cláusulas geradas</span>
              <span className="font-display text-xl font-bold text-primary">{clauses.length + form.clausulasExtra.filter((c) => c.trim()).length}</span>
            </div>
            <Button onClick={exportPdf} className="w-full gap-2 bg-primary text-primary-foreground transition-transform hover:bg-primary/90 active:scale-95">
              <FileText className="h-4 w-4" /> Baixar / Imprimir PDF
            </Button>
            <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
              Modelo baseado em boas práticas de contratos civis brasileiros. Recomendamos revisão jurídica para casos específicos.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
