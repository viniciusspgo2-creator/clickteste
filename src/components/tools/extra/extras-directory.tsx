'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EXTRA_TOOLS, CATEGORY_META, getExtraTool, type ExtraCategory } from './registry';
import { useToolsStore } from '@/lib/tools-store';
import { BackToExtrasButton } from './shell';
import { Search, ArrowRight, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';

const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

export function ExtrasDirectory() {
  const { activeExtra, openExtra, extrasCategory, setExtrasCategory, extrasQuery, setExtrasQuery } = useToolsStore();
  const [cat, setCat] = useState<ExtraCategory | 'todas'>(() =>
    CATEGORY_META.some((item) => item.id === extrasCategory) ? extrasCategory as ExtraCategory : 'todas',
  );
  const [busca, setBusca] = useState(extrasQuery);
  useEffect(() => { setBusca(extrasQuery); }, [extrasQuery]);

  const filtradas = EXTRA_TOOLS.filter((t) => {
    const okCat = cat === 'todas' || t.category === cat;
    const q = normalizeSearch(busca.trim());
    const categoryLabel = CATEGORY_META.find((item) => item.id === t.category)?.label ?? '';
    const searchable = normalizeSearch(`${t.title} ${t.desc} ${t.id} ${categoryLabel}`);
    const okBusca = !q || searchable.includes(q);
    return okCat && okBusca;
  });

  /* ----- visualização de UMA ferramenta aberta ----- */
  if (activeExtra) {
    const tool = getExtraTool(activeExtra);
    if (tool) {
      const Comp = tool.Component;
      return (
        <motion.div
          key={tool.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="mx-auto mb-5 flex max-w-5xl items-center gap-3 px-4 sm:px-6">
            <BackToExtrasButton />
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <tool.icon className="h-4 w-4" />
            </span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {CATEGORY_META.find((c) => c.id === tool.category)?.label} · Ferramentas+
            </span>
          </div>
          <Comp />
        </motion.div>
      );
    }
  }

  /* ----- diretório ----- */
  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="relative mb-7 overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(ellipse_at_90%_0%,rgba(232,112,58,.25),transparent_42%),linear-gradient(135deg,#191411,#0b0a09_65%)] px-5 py-7 shadow-[0_30px_100px_-45px_rgba(232,112,58,.45)] sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute inset-0 opacity-[.08] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="relative grid gap-7 lg:grid-cols-[1fr_minmax(300px,.72fr)] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-primary"><Sparkles className="h-3.5 w-3.5"/> Central de ferramentas</span>
            <h2 className="mt-4 max-w-3xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">Tudo para fazer seu trabalho <span className="text-gradient-brand">fluir.</span></h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-300 sm:text-base">{EXTRA_TOOLS.length} utilitários práticos para vender, criar, produzir e organizar — gratuitos e prontos para usar no navegador.</p>
            <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-medium text-neutral-300">
              <span className="rounded-full border border-white/10 bg-white/[.05] px-3 py-1.5">{CATEGORY_META.length} áreas de trabalho</span><span className="rounded-full border border-white/10 bg-white/[.05] px-3 py-1.5">Sem cadastro</span><span className="rounded-full border border-white/10 bg-white/[.05] px-3 py-1.5">Seus dados ficam no dispositivo</span>
            </div>
          </div>
          <div className="relative">
            <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-neutral-300"><SlidersHorizontal className="h-3.5 w-3.5 text-primary"/> Encontre a ferramenta certa</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca} onChange={(e) => { setBusca(e.target.value); setExtrasQuery(e.target.value); }}
            placeholder="Ex.: custo de impressão, margem…" aria-label="Buscar ferramentas por nome, categoria ou função" className="h-12 rounded-xl border-white/10 bg-black/35 pl-10 pr-9 text-white placeholder:text-neutral-500 focus-visible:ring-primary/50"
          />
          {busca && <button type="button" onClick={() => { setBusca(''); setExtrasQuery(''); }} aria-label="Limpar busca" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">×</button>}
        </div>
          </div>
        </div>
      </div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div><p className="text-sm font-semibold">Explore por área</p><p className="mt-0.5 text-xs text-muted-foreground">Escolha uma categoria ou veja tudo</p></div>
        <p className="text-xs text-muted-foreground" aria-live="polite"><span className="font-semibold text-foreground">{filtradas.length}</span> de {EXTRA_TOOLS.length} ferramentas</p>
      </div>

      {/* filtro por categoria */}
      <div className="thin-scroll mb-6 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => { setCat('todas'); setExtrasCategory(null); }}
          aria-pressed={cat === 'todas'}
          className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-all active:scale-95 ${
            cat === 'todas' ? 'border-primary bg-primary text-primary-foreground shadow-[0_8px_24px_-10px_rgba(232,112,58,.85)]' : 'border-border/70 bg-card/70 text-muted-foreground hover:border-primary/40 hover:text-foreground'
          }`}
        >
          Todas ({EXTRA_TOOLS.length})
        </button>
        {CATEGORY_META.map((c) => {
          const count = EXTRA_TOOLS.filter((t) => t.category === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => { setCat(c.id); setExtrasCategory(c.id); }}
              aria-pressed={cat === c.id}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-all active:scale-95 ${
                cat === c.id ? 'text-white' : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
              }`}
              style={cat === c.id ? { background: c.cor, borderColor: c.cor } : undefined}
            >
              <c.icon className="h-3.5 w-3.5" />
              {c.label} ({count})
            </button>
          );
        })}
      </div>

      {/* grid */}
      <motion.div layout className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {filtradas.map((tool) => (
            <motion.button
              layout
              key={tool.id}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.18 }}
              onClick={() => openExtra(tool.id)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              className="group relative flex min-h-[170px] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/65 p-4 text-left shadow-[0_12px_32px_-24px_rgba(0,0,0,.75)] backdrop-blur transition-all hover:border-primary/40 hover:bg-card hover:shadow-[0_18px_46px_-28px_rgba(232,112,58,.5)]"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-gradient-to-br from-primary/15 to-primary/[.04] text-primary transition-transform duration-300 group-hover:scale-110">
                  <tool.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{tool.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{tool.desc}</p>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between pt-4">
                <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {CATEGORY_META.find((c) => c.id === tool.category)?.label}
                </span>
                <ArrowRight className="h-3.5 w-3.5 -translate-x-1 text-primary opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>

      {filtradas.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma ferramenta encontrada{busca ? <> para &quot;{busca}&quot;</> : ' nesta categoria'}.</p>
          <button type="button" onClick={() => { setBusca(''); setExtrasQuery(''); setCat('todas'); setExtrasCategory(null); }} className="mt-3 rounded-full border border-primary/30 px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10">
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}
