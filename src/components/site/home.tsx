'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useToolsStore, type ToolId } from '@/lib/tools-store';
import { EXTRA_TOOLS, CATEGORY_META } from '@/components/tools/extra/registry';
import { MugsIllustration, MockupStudioIllustration } from './illustrations';
import {
  QrCode, MessageCircle, FileSpreadsheet, Scale, FileText, Image as ImageIcon,
  Coffee, ArrowRight, ArrowDown, Zap, ShieldCheck, Infinity as InfinityIcon,
  Sparkles, Check, Crown, Download, Wrench, Share2, CupSoda,
  LockKeyhole, Wand2, Search, ArrowUpRight,
} from 'lucide-react';

const TOOLS: { id: ToolId; icon: React.ComponentType<{ className?: string }>; title: string; desc: string; chips: string[] }[] = [
  {
    id: 'qr',
    icon: QrCode,
    title: 'Gerador de QR Code',
    desc: 'QR Codes profissionais com logo, cores em gradiente, estilos de pontos, PIX, Wi-Fi, vCard e download em PNG/SVG/WEBP.',
    chips: ['Logo no centro', 'PIX / Wi-Fi / vCard', 'Download HD'],
  },
  {
    id: 'whatsapp',
    icon: MessageCircle,
    title: 'Link para WhatsApp',
    desc: 'Crie links wa.me com mensagem automática e ainda gere um link personalizado com o nome que você quiser — sem números na frente.',
    chips: ['Link com nome', 'Mensagem pronta', 'QR automático'],
  },
  {
    id: 'orcamento',
    icon: FileSpreadsheet,
    title: 'Gerador de Orçamento',
    desc: 'Monte orçamentos profissionais com itens, descontos, condições, logo da empresa e assinaturas. Exporte em PDF na hora.',
    chips: ['Preview ao vivo', 'Descontos', 'Exportar PDF'],
  },
  {
    id: 'contrato',
    icon: Scale,
    title: 'Gerador de Contrato',
    desc: 'Contratos com cláusulas prontas para serviços, venda, NDA, freelancer e manutenção. Você só preenche e baixa em PDF.',
    chips: ['5 modelos', 'Cláusulas automáticas', 'Testemunhas'],
  },
  {
    id: 'pdf',
    icon: FileText,
    title: 'Leitor & Editor de PDF',
    desc: 'Organize páginas, gire, exclua, extraia, mescle PDFs, aplique marca d\u2019água, numeração e edite metadados. 100% no navegador.',
    chips: ['Mesclar PDFs', 'Marca d\u2019água', 'Privacidade total'],
  },
  {
    id: 'imagens',
    icon: ImageIcon,
    title: 'Conversor de Imagens',
    desc: 'Converta até 10 imagens por vez entre JPG, PNG, WEBP e mais — com redimensionamento, qualidade ajustável e download em ZIP.',
    chips: ['10 por lote', 'Redimensionar', 'ZIP final'],
  },
];

const EXTRA_COUNT = EXTRA_TOOLS.length;
const TOOL_COUNT = TOOLS.length + EXTRA_COUNT;

const MARQUEE = [
  'Mockup 3D de Canecas', 'QR Code Pro', 'Link de WhatsApp', 'Orçamentos', 'Contratos',
  'Editor de PDF', 'Conversor de Imagens', 'Juros Compostos', 'Sorteador', 'Gerador de Senhas',
  'Código de Barras', 'Paleta de Cores', 'Consulta de CEP', 'Pomodoro',
  'Construtor UTM', `+${EXTRA_COUNT} extras`,
];

const STATS = [
  { v: `${TOOL_COUNT}+`, l: 'ferramentas' },
  { v: String(CATEGORY_META.length), l: 'categorias' },
  { v: '100%', l: 'grátis' },
  { v: '0', l: 'cadastros' },
];


const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const card = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 120, damping: 18 } },
};

function Reveal({
  children, className, delay = 0, id,
}: { children: React.ReactNode; className?: string; delay?: number; id?: string }) {
  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ type: 'spring', stiffness: 110, damping: 18, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ================= HERO (preto) ================= */

function Hero() {
  return (
    <div className="relative overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="grid-bg absolute inset-0" />
        <div className="aurora -top-24 left-1/4 h-72 w-72 bg-primary/25" />
        <div className="aurora right-10 top-40 h-60 w-60 bg-whats/15" style={{ animationDelay: '-6s' }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-14 sm:px-6 sm:pb-28 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            100% grátis · sem cadastro · funciona direto no navegador
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
          >
            {TOOL_COUNT} ferramentas para facilitar seu dia a dia,{' '}
            <span className="text-gradient-brand">em um só lugar</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            QR Codes avançados, links elegantes para WhatsApp, orçamentos, contratos,
            edição de PDFs, conversão de imagens <strong className="text-foreground">e mais {EXTRA_COUNT} utilitários</strong> —
            rápido, privado e sem pagar nada.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-7 flex flex-wrap items-center justify-center gap-3"
          >
            <button
              onClick={() => scrollTo('essenciais')}
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display text-sm font-bold text-primary-foreground shadow-[0_10px_30px_-8px_rgba(232,112,58,0.6)] transition-transform hover:scale-[1.04] active:scale-95"
            >
              Ver ferramentas
              <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </button>
            <button
              onClick={() => scrollTo('todas-ferramentas')}
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-6 py-3 font-display text-sm font-bold text-primary transition-colors hover:bg-primary/20 active:scale-95"
            >
              <Wrench className="h-4 w-4" />
              Explorar as +{EXTRA_COUNT} ferramentas
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-primary" /> Processamento instantâneo</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-whats" /> Seus arquivos não saem do seu dispositivo</span>
            <span className="flex items-center gap-1.5"><InfinityIcon className="h-3.5 w-3.5 text-primary" /> Uso ilimitado</span>
          </motion.div>
        </div>

        {/* stats */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {STATS.map((s) => (
            <div
              key={s.l}
              className="glass-card rounded-2xl px-4 py-4 text-center transition-transform hover:-translate-y-1"
            >
              <p className="font-display text-2xl font-bold text-primary sm:text-3xl">{s.v}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/* ================= FAIXA MARQUEE (laranja) ================= */

function MarqueeBand() {
  return (
    <div className="relative z-20 -my-6 rotate-[-1.3deg] scale-[1.03]">
      <div className="border-y-2 border-[#1d130d]/50 bg-[linear-gradient(90deg,#f08048,#e8703a_40%,#e0622e)] py-3 shadow-[0_14px_44px_-12px_rgba(232,112,58,0.6)]">
        <div className="marquee">
          <div className="marquee-track">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={copy === 1}>
                {MARQUEE.map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-8 whitespace-nowrap font-display text-sm font-bold uppercase tracking-[0.14em] text-[#1d130d]"
                  >
                    {item}
                    <Coffee className="h-4 w-4 opacity-70" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= ESSENCIAIS (branco) ================= */

function EssentialsSection() {
  const setActiveTool = useToolsStore((s) => s.setActiveTool);

  return (
    <section id="essenciais" className="relative scroll-mt-16 bg-[#faf6f0] pb-20 pt-24 sm:pt-28">
      <div className="dot-grid-light pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1d130d] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ffb488]">
              <Sparkles className="h-3 w-3" /> As essenciais
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#1d130d] sm:text-4xl">
              6 ferramentas que resolvem seu dia a dia
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#7c6f63] sm:text-base">
              Rápidas, gratuitas e direto no navegador. Clique em qualquer uma para começar —
              e role a página que tem muito mais te esperando.
            </p>
          </div>
          <button
            onClick={() => scrollTo('todas-ferramentas')}
            className="group inline-flex shrink-0 items-center gap-2 self-start rounded-full border-2 border-[#e8703a] bg-white px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-[#e8703a] transition-colors hover:bg-[#e8703a] hover:text-white sm:self-auto"
          >
            +{EXTRA_COUNT} ferramentas logo abaixo
            <ArrowDown className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" />
          </button>
        </Reveal>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {TOOLS.map((tool) => (
            <motion.button
              key={tool.id}
              variants={card}
              onClick={() => setActiveTool(tool.id)}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.98 }}
              className="card-light group relative overflow-hidden rounded-2xl border border-[#eadfd2] bg-white p-5 text-left transition-colors duration-300 hover:border-[#e8703a]/60 sm:p-6"
            >
              <div className="pointer-events-none absolute inset-x-0 -top-20 h-40 bg-gradient-to-b from-[#e8703a]/20 to-transparent opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fdeee3] text-[#e8703a] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <tool.icon className="h-5 w-5" />
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#e8703a] opacity-0 transition-all duration-300 group-hover:opacity-100">
                    Abrir <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-[#1d130d]">{tool.title}</h3>
                <p className="mt-2 min-h-16 text-sm leading-relaxed text-[#7c6f63]">{tool.desc}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tool.chips.map((chip) => (
                    <span key={chip} className="rounded-full border border-[#eee3d6] bg-[#faf4ec] px-2.5 py-0.5 text-[10px] font-medium text-[#8b7d6e]">
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* ===== Mockup Studio de Canecas — PREMIUM ===== */}
        <Reveal className="mt-6" delay={0.05}>
          <button
            onClick={() => window.location.assign('/mockup-caneca-3d')}
            className="card-light group relative flex w-full flex-col items-center gap-4 overflow-hidden rounded-2xl border-2 border-amber-400/70 bg-[linear-gradient(120deg,#fffdf6,#fff3d6_55%,#fdeee3)] px-6 py-5 text-center transition-all hover:border-amber-500 sm:flex-row sm:text-left"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-600 text-[#1d130d] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
              <Crown className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <p className="font-display text-sm font-bold uppercase tracking-wide text-[#1d130d]">
                Mockup 3D Studio — <span className="text-amber-600">ferramenta premium!</span>
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#7c6f63]">
                Estúdio fotorrealista no navegador: sua arte envolvendo a caneca, luz de estúdio,
                caneca mágica e exportação em alta resolução.{' '}
                <strong className="text-[#1d130d]">Incluído para assinantes da Biblioteca de Artes</strong> —
                acesso por código exclusivo.
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-4 py-2 font-display text-xs font-bold uppercase tracking-wide text-[#1d130d] shadow-lg transition-transform group-hover:scale-105">
              Abrir com código <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        </Reveal>

        <ExtrasPanel />
      </div>
    </section>
  );
}

/* ================= PAINEL FERRAMENTAS EXTRAS (preto sobre branco) ================= */

function ExtrasPanel() {
  const setActiveTool = useToolsStore((s) => s.setActiveTool);
  const setExtrasCategory = useToolsStore((s) => s.setExtrasCategory);

  const cats = CATEGORY_META.map((c) => {
    const list = EXTRA_TOOLS.filter((t) => t.category === c.id);
    return { ...c, count: list.length, examples: list.slice(0, 2).map((t) => t.title) };
  });

  return (
    <Reveal id="todas-ferramentas" className="mt-14 scroll-mt-20">
      <div className="relative overflow-hidden rounded-3xl bg-[#0f0c0a] p-6 shadow-[0_30px_80px_-30px_rgba(29,19,13,0.5)] sm:p-10">
        <div className="dot-grid-dark pointer-events-none absolute inset-0" />
        <div className="aurora -right-24 -top-28 h-80 w-80 bg-primary/30" />
        <span className="watermark pointer-events-none absolute -bottom-7 right-2 hidden font-display text-[130px] font-bold leading-none lg:block">
          MAIS
        </span>

        <div className="relative grid gap-8 lg:grid-cols-[1fr_1.35fr] lg:gap-12">
          {/* texto */}
          <div className="flex flex-col items-start">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1d130d]">
              <Wrench className="h-3 w-3" /> Ferramentas+ · bônus grátis
            </span>
            <h3 className="mt-4 font-display text-3xl font-bold leading-tight text-[#f3ede4] sm:text-4xl">
              Tem muito mais
              <span className="text-gradient-brand"> além das 6 essenciais</span>
            </h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#a89c8e] sm:text-base">
              Finanças, segurança, texto, design, produtividade e mais: {EXTRA_COUNT} utilitários extras
              esperando por você — todos grátis, sem cadastro e no mesmo lugar.
            </p>
            <div className="mt-5 flex items-center gap-4 text-xs text-[#a89c8e]">
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> {EXTRA_COUNT} utilitários</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> {CATEGORY_META.length} categorias</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> R$ 0,00</span>
            </div>
            <button
              onClick={() => {
                setExtrasCategory(null);
                setActiveTool('extras');
              }}
              className="group mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display text-sm font-bold text-[#1d130d] shadow-[0_10px_30px_-8px_rgba(232,112,58,0.7)] transition-transform hover:scale-[1.04] active:scale-95"
            >
              Abrir todas as ferramentas
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* categorias */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {cats.map((cat, i) => (
              <motion.button
                key={cat.id}
                onClick={() => {
                  setExtrasCategory(cat.id);
                  setActiveTool('extras');
                }}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 140, damping: 18 }}
                className="group rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left backdrop-blur transition-colors hover:border-primary/50 hover:bg-white/[0.07]"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${cat.cor}22`, color: cat.cor }}
                  >
                    <cat.icon className="h-4 w-4" />
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-[#f3ede4]">
                    {cat.count}
                  </span>
                </div>
                <p className="mt-2 font-display text-xs font-bold text-[#f3ede4]">{cat.label}</p>
                <p className="mt-0.5 truncate text-[10px] text-[#8b7d6e]">{cat.examples.join(' · ')}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ================= BANNER PREMIUM — MOCKUP 3D STUDIO (preto com dourado) ================= */

const MOCKUP_FEATURES = [
  'Canecas 3D fotorrealistas com verniz, sombras e reflexos reais',
  'Sua arte envolvendo a caneca em projeção cilíndrica exata',
  'Caneca branca, colorida e MÁGICA com revelação térmica animada',
  'Vídeo MP4 em giro 360°, GIF animado e lote de ângulos em ZIP',
  'Cenas com várias canecas + folha de sublimação em 300/600 DPI',
  '100% no navegador — sua arte não sai do seu dispositivo',
];

function MockupBanner() {
  const setActiveTool = useToolsStore((s) => s.setActiveTool);

  return (
    <section id="mockup-3d" className="relative scroll-mt-16 overflow-hidden bg-[#080706] py-20 sm:py-24">
      {/* brilhos dourados */}
      <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-primary/15 blur-[110px]" />
      <div className="dot-grid-dark pointer-events-none absolute inset-0 opacity-50" />
      <span className="watermark pointer-events-none absolute -top-6 right-4 hidden font-display text-[150px] font-bold leading-none lg:block">
        3D
      </span>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        {/* texto */}
        <Reveal>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300">
            <Crown className="h-3.5 w-3.5" /> Premium · Novidade
          </span>

          <h2 className="font-display mt-4 text-4xl font-bold leading-[0.95] tracking-tight text-white sm:text-6xl">
            MOCKUP
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 bg-clip-text text-transparent">
              3D STUDIO
            </span>
          </h2>

          <p className="mt-4 max-w-lg text-sm leading-relaxed text-neutral-300 sm:text-base">
            Fotos de estúdio fotorrealistas das suas canecas — sem estúdio, sem fotógrafo,
            sem mensalidade. Carregue a arte, escolha a luz e exporte em alta resolução
            direto do navegador.
          </p>

          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {MOCKUP_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[13px] leading-snug text-neutral-200">
                <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-amber-400/15">
                  <Check className="h-3 w-3 text-amber-400" />
                </span>
                {f}
              </li>
            ))}
          </ul>

          {/* selo de acesso */}
          <div className="mt-7 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3">
            <LockKeyhole className="h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-xs leading-relaxed text-neutral-200">
              <strong className="text-amber-300">Ferramenta PREMIUM</strong> — liberada para
              assinantes da <strong className="text-white">Biblioteca de Artes</strong>. Acesso
              vitalício pelo seu código exclusivo.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => window.location.assign('/mockup-caneca-3d')}
              className="group flex items-center gap-2 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-7 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-[#1d130d] shadow-[0_18px_50px_-12px_rgba(251,191,36,0.55)] transition-all hover:scale-[1.03] hover:brightness-110 active:scale-95"
            >
              <Wand2 className="h-4 w-4 transition-transform group-hover:rotate-12" />
              Abrir Mockup Studio
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a
              href="https://clickgruda.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 font-display text-xs font-bold uppercase tracking-wide text-neutral-200 transition-colors hover:border-amber-400/50 hover:text-amber-300"
            >
              <Crown className="h-4 w-4" /> Conhecer a Biblioteca
            </a>
          </div>
        </Reveal>

        {/* ilustração */}
        <Reveal delay={0.12} className="relative">
          <div className="mx-auto max-w-[520px] rounded-3xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-sm sm:p-6">
            <MockupStudioIllustration />
          </div>
          <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/10 blur-[90px]" />
        </Reveal>
      </div>
    </section>
  );
}

/* ================= BANNER 1 — BIBLIOTECA DE ARTES PARA CANECAS (laranja) ================= */

function CanecasBanner() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#f08048_0%,#e8703a_45%,#d95f2b_100%)] py-16 sm:py-24">
      <span className="watermark-dark pointer-events-none absolute -top-5 right-0 select-none font-display text-[24vw] font-bold leading-none sm:text-[170px]">
        CANECAS
      </span>
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-16 top-16 h-56 w-56 rounded-full bg-[#1d130d]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        {/* texto */}
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#1d130d] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
            <Crown className="h-3.5 w-3.5 text-[#ffb488]" />
            Sessão exclusiva · produto digital
          </span>

          <h2 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl">
            BIBLIOTECA DE
            <br />
            <span className="text-[#1d130d]">ARTES PARA CANECAS</span>
          </h2>

          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/90">
            Um acervo completo, organizado e pronto para usar: escolha a arte, baixe em alta
            resolução e aplique nas suas canecas em minutos. Perfeito para quem vende
            personalizados e quer produção profissional.
          </p>

          <ul className="mt-6 space-y-2.5">
            {[
              'Artes exclusivas, organizadas e prontas para imprimir',
              'Downloads em alta resolução para canecas mágicas',
              'Acesso vitalício: pague uma vez e use para sempre',
              'Novidades adicionadas constantemente',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm font-medium text-white">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[#e8703a]">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap items-end gap-6">
            <div className="rounded-2xl bg-white px-6 py-4 shadow-[0_20px_50px_-18px_rgba(29,19,13,0.5)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b9845c]">
                Acesso vitalício por apenas
              </p>
              <p className="font-display text-4xl font-bold leading-tight text-[#1d130d] sm:text-5xl">
                R$ 47,90
              </p>
              <p className="text-[11px] font-medium text-[#8b7d6e]">pagamento único · acesso para sempre</p>
            </div>
            <a
              href="https://clickgruda.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-[#1d130d] px-7 py-4 font-display text-sm font-bold uppercase tracking-wide text-white shadow-xl transition-transform hover:scale-[1.04] active:scale-95"
            >
              Quero meu acesso
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </Reveal>

        {/* ilustração */}
        <Reveal delay={0.1} className="relative">
          <div className="floaty relative mx-auto max-w-lg">
            <MugsIllustration />
            <div className="floaty absolute -top-1 left-2 flex items-center gap-1.5 rounded-full bg-[#1d130d] px-3.5 py-2 text-xs font-semibold text-white shadow-lg">
              <Crown className="h-3.5 w-3.5 text-[#ffb488]" /> Acesso vitalício
            </div>
            <div className="floaty absolute right-0 top-1/3 flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-[#1d130d] shadow-lg [animation-delay:1.3s]">
              <Download className="h-3.5 w-3.5 text-[#e8703a]" /> Alta resolução
            </div>
            <div className="floaty absolute -bottom-3 left-8 flex items-center gap-1.5 rounded-full bg-[#1d130d] px-3.5 py-2 text-xs font-semibold text-white shadow-lg [animation-delay:2.2s]">
              <Sparkles className="h-3.5 w-3.5 text-[#ffb488]" /> Novidades frequentes
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= CTA FINAL (branco) ================= */

function FinalCta() {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Click & Gruda Tools',
          text: `${TOOL_COUNT} ferramentas online grátis, sem cadastro!`,
          url: window.location.origin,
        });
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      /* compartilhamento cancelado */
    }
  };

  return (
    <section className="relative bg-[#faf6f0] py-16">
      <div className="dot-grid-light pointer-events-none absolute inset-0" />
      <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h3 className="font-display text-3xl font-bold tracking-tight text-[#1d130d] sm:text-4xl">
          Cansado de caçar ferramenta por aí?
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#7c6f63] sm:text-base">
          Aqui são {TOOL_COUNT} ferramentas grátis, sem cadastro e sem pegadinha. Salve o site nos favoritos
          e mande para aquele amigo que trabalha por conta própria — ele vai agradecer.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => scrollTo('essenciais')}
            className="group inline-flex items-center gap-2 rounded-full bg-[#e8703a] px-6 py-3 font-display text-sm font-bold text-white shadow-[0_12px_32px_-10px_rgba(232,112,58,0.7)] transition-transform hover:scale-[1.04] active:scale-95"
          >
            Usar as ferramentas
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={share}
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#1d130d] bg-white px-6 py-3 font-display text-sm font-bold text-[#1d130d] transition-colors hover:bg-[#1d130d] hover:text-white active:scale-95"
          >
            <Share2 className="h-4 w-4" />
            {copied ? 'Link copiado!' : 'Compartilhar'}
          </button>
        </div>
      </Reveal>
    </section>
  );
}

/* ================= HOME ================= */

export function Home() {
  const [query, setQuery] = useState('');
  const setActiveTool = useToolsStore((s) => s.setActiveTool);
  const setExtrasCategory = useToolsStore((s) => s.setExtrasCategory);
  const setExtrasQuery = useToolsStore((s) => s.setExtrasQuery);
  const explore = (category: string | null = null, search = '') => {
    setExtrasCategory(category);
    setExtrasQuery(search);
    setActiveTool('extras');
  };

  return (
    <div className="relative overflow-hidden bg-[#0b0a09] text-[#f5f1eb]">
      <section className="relative isolate overflow-hidden border-b border-white/[.06]">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_5%,rgba(232,112,58,.19),transparent_40%),radial-gradient(ellipse_at_10%_55%,rgba(86,65,160,.13),transparent_38%)]" />
          <div className="absolute inset-0 opacity-[.08] [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:48px_48px]" />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:pb-24">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[.08] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[.17em] text-[#ffb488]"><Sparkles className="h-3.5 w-3.5"/> Seu espaço de trabalho criativo</div>
            <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-[1.04] tracking-[-.04em] text-white sm:text-5xl lg:text-[4.3rem]">Menos tarefas repetidas.<br/><span className="text-gradient-brand">Mais trabalho que rende.</span></h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-neutral-300 sm:text-base">Ferramentas certeiras para vender, criar, produzir e organizar seu dia — de um jeito simples, rápido e direto no navegador.</p>
            <form onSubmit={(e)=>{e.preventDefault();explore(null,query);}} className="mt-7 flex max-w-2xl items-center gap-2 rounded-2xl border border-white/10 bg-white/[.06] p-2 shadow-[0_24px_70px_-40px_rgba(232,112,58,.65)] backdrop-blur-xl focus-within:border-primary/50">
              <Search className="ml-2 h-5 w-5 shrink-0 text-primary"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="O que você precisa fazer hoje?" aria-label="Buscar uma ferramenta" className="h-11 min-w-0 flex-1 bg-transparent px-1 text-sm text-white outline-none placeholder:text-neutral-500"/><button className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-[#1d130d] transition hover:brightness-110 sm:px-5">Buscar <ArrowRight className="h-4 w-4"/></button>
            </form>
            <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-neutral-400"><span className="mr-1 self-center">Buscas populares:</span>{['preço','impressão','WhatsApp','cores'].map(q=><button key={q} onClick={()=>{setQuery(q);explore(null,q);}} className="rounded-full border border-white/10 px-3 py-1.5 transition hover:border-primary/40 hover:text-white">{q}</button>)}</div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-medium text-neutral-400"><span><b className="text-white">{TOOL_COUNT}</b> ferramentas</span><span><b className="text-white">{CATEGORY_META.length}</b> categorias</span><span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400"/>Arquivos processados localmente</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-[560px]">
            <div className="absolute -inset-8 rounded-[40px] bg-primary/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#15120f] p-3 shadow-[0_40px_120px_-45px_rgba(0,0,0,.9)] sm:p-4">
              <div className="flex items-center justify-between border-b border-white/[.07] px-3 pb-3"><div><span className="text-[9px] font-bold uppercase tracking-[.2em] text-primary">Click & Gruda · toolkit</span><p className="mt-1 font-display text-sm font-semibold text-white">Seu painel de trabalho</p></div><span className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[9px] font-bold text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/> pronto para usar</span></div>
              <div className="grid grid-cols-2 gap-2.5 p-2 sm:gap-3 sm:p-3">{TOOLS.slice(0,4).map((tool,i)=><button key={tool.id} onClick={()=>tool.id === 'mockup' ? window.location.assign('/mockup-caneca-3d') : setActiveTool(tool.id)} className="group rounded-2xl border border-white/[.07] bg-white/[.035] p-3.5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/[.07] sm:p-4"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${i%2?'bg-violet-400/10 text-violet-300':'bg-primary/10 text-primary'}`}><tool.icon className="h-4 w-4"/></span><p className="mt-3 text-xs font-semibold text-white">{tool.title}</p><p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-neutral-500">{tool.chips[0]} · {tool.chips[1]}</p></button>)}</div>
              <button onClick={()=>explore()} className="mx-2 mb-2 flex w-[calc(100%-1rem)] items-center justify-between rounded-xl border border-white/[.07] bg-gradient-to-r from-white/[.05] to-primary/[.08] px-4 py-3 text-left transition hover:border-primary/30"><span><span className="block text-xs font-semibold text-white">Mais {EXTRA_COUNT} ferramentas para explorar</span><span className="mt-1 block text-[10px] text-neutral-500">Finanças, sublimação, design, marketing e mais</span></span><ArrowUpRight className="h-4 w-4 text-primary"/></button>
            </div>
          </div>
        </div>
      </section>

      <section id="essenciais" className="scroll-mt-20 border-b border-white/[.06] py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">Comece por aqui</p><h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Ferramentas essenciais</h2><p className="mt-2 max-w-xl text-sm text-neutral-400">O kit rápido para atender clientes, fechar pedidos e entregar com mais profissionalismo.</p></div><button onClick={()=>explore()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-neutral-200 transition hover:border-primary/40 hover:text-primary">Ver catálogo completo <ArrowRight className="h-3.5 w-3.5"/></button></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{TOOLS.map((tool,i)=><button key={tool.id} onClick={()=>tool.id === 'mockup' ? window.location.assign('/mockup-caneca-3d') : setActiveTool(tool.id)} className="group relative flex min-h-[205px] flex-col overflow-hidden rounded-2xl border border-white/[.08] bg-[#12100e] p-5 text-left transition-all hover:-translate-y-1 hover:border-primary/35 hover:bg-[#17130f]"><div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-primary/0 blur-2xl transition group-hover:bg-primary/10"/><div className="relative flex items-start justify-between"><span className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/[.05] ${i%3===1?'bg-violet-400/10 text-violet-300':'bg-primary/10 text-primary'}`}><tool.icon className="h-5 w-5"/></span><ArrowUpRight className="h-4 w-4 text-neutral-600 transition group-hover:text-primary"/></div><h3 className="relative mt-5 font-display text-base font-semibold text-white">{tool.title}</h3><p className="relative mt-2 line-clamp-2 text-xs leading-relaxed text-neutral-400">{tool.desc}</p><div className="relative mt-auto flex flex-wrap gap-1.5 pt-4">{tool.chips.slice(0,2).map(c=><span key={c} className="rounded-full border border-white/[.07] bg-white/[.03] px-2.5 py-1 text-[9px] text-neutral-400">{c}</span>)}</div></button>)}</div>
        </div>
      </section>

      <section className="border-b border-white/[.06] py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-7 px-4 sm:px-6 lg:grid-cols-[.85fr_1.15fr]">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-300">Estúdio de criação · Premium</p><h2 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">Apresente sua arte<br/><span className="text-amber-300">em outro nível.</span></h2><p className="mt-3 max-w-lg text-sm leading-relaxed text-neutral-400">Crie mockups 3D de canecas com cenários, iluminação, ajustes precisos da arte e exportação em alta qualidade. O estúdio continua com todos os controles e fluxos atuais.</p><button onClick={()=>window.location.assign('/mockup-caneca-3d')} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-5 py-3 text-xs font-bold text-[#1d130d] transition hover:bg-amber-200">Abrir Mockup Studio <ArrowRight className="h-4 w-4"/></button><p className="mt-2 text-[10px] text-neutral-500">Acesso Premium com código</p></div>
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(ellipse_at_50%_30%,rgba(245,158,11,.12),transparent_65%),#12100e] p-3 sm:p-5"><MockupStudioIllustration/></div>
        </div>
      </section>

      <CanecasBanner />

      <section id="todas-ferramentas" className="scroll-mt-20 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">{EXTRA_COUNT} utilitários práticos</p><h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">Encontre sua próxima ferramenta</h2><p className="mt-2 text-sm text-neutral-400">Organizado por área para você chegar mais rápido ao que precisa.</p></div><button onClick={()=>explore()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-[#1d130d] transition hover:brightness-110">Abrir Ferramentas+ <ArrowRight className="h-3.5 w-3.5"/></button></div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">{CATEGORY_META.map((cat,i)=>{const count=EXTRA_TOOLS.filter(x=>x.category===cat.id).length;const examples=EXTRA_TOOLS.filter(x=>x.category===cat.id).slice(0,2).map(x=>x.title);return <button key={cat.id} onClick={()=>explore(cat.id)} className="group rounded-2xl border border-white/[.08] bg-white/[.025] p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/[.05]"><span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{backgroundColor:`${cat.cor}1a`,color:cat.cor}}><cat.icon className="h-4 w-4"/></span><span className="mt-3 flex items-center justify-between gap-1"><span className="text-xs font-semibold text-white">{cat.label}</span><span className="rounded-full bg-white/[.07] px-2 py-0.5 text-[9px] font-bold text-neutral-300">{count}</span></span><span className="mt-1 block truncate text-[9px] text-neutral-500">{examples.join(' · ')}</span></button>})}</div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-white/[.07] pt-6 text-[11px] text-neutral-500"><span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400"/> Privacidade primeiro</span><span>Sem cadastro</span><span>Sem limite de uso</span><span>Feito para quem trabalha por conta</span></div>
        </div>
      </section>
    </div>
  );
}

