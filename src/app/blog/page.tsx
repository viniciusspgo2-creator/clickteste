import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, CalendarDays, Clock, Search, Sparkles, ArrowUpRight } from 'lucide-react';
import {
  ALL_ARTICLES,
  NEW_SUBLIMATION_ARTICLES,
  BLOG_CATEGORIES,
  countCategory,
  formatDateBR,
  readingMinutes,
  type BlogCategory,
} from '@/data/blog';
import { getSeoConfig } from '@/lib/site-config';
import { cn } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoConfig();
  const title = 'Blog de sublimação de canecas: técnicas, dicas e mockups';
  return {
    title,
    description:
      'Aprenda sobre sublimação de canecas: arte em alta resolução, perfil de cor, prensa, efeito fantasma, cuidados e aprovação de mockups 3D.',
    keywords: ['sublimação de canecas', 'dicas de sublimação', 'mockup de caneca', 'prensa de canecas'],
    alternates: { canonical: '/blog' },
    openGraph: {
      title,
      description: 'Guias de sublimação de canecas, preparação de artes, diagnóstico de falhas e mockups 3D.',
      url: `${seo.siteUrl.replace(/\/+$/, '')}/blog`,
      type: 'website',
      locale: 'pt_BR',
      siteName: seo.siteName,
      images: [{ url: seo.ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, images: [seo.ogImage] },
  };
}

const CATEGORY_STYLES: Record<BlogCategory, string> = {
  'Sublimação': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'Mockups': 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  'Marketing': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Redes Sociais': 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  'Ferramentas': 'bg-violet-500/15 text-violet-400 border-violet-500/30',
};

export default async function BlogIndex({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>;
}) {
  const { cat, q } = await searchParams;
  const query = typeof q === 'string' ? q.trim().slice(0, 120) : '';
  const active = BLOG_CATEGORIES.includes(cat as BlogCategory) ? (cat as BlogCategory) : null;
  const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const list = ALL_ARTICLES.filter((article) => (!active || article.category === active)
    && (!query || normalize(`${article.title} ${article.description} ${article.keywords.join(' ')}`).includes(normalize(query))));
  const [featured, ...rest] = list;
  const seo = await getSeoConfig();
  const base = seo.siteUrl.replace(/\/+$/, '');
  const categoryHref = (category?: BlogCategory) => {
    const params = new URLSearchParams();
    if (category) params.set('cat', category);
    if (query) params.set('q', query);
    return params.size ? `/blog?${params.toString()}` : '/blog';
  };
  const collectionLd = {
    '@context': 'https://schema.org', '@type': 'CollectionPage',
    '@id': `${base}/blog#collection`, url: `${base}/blog`, name: 'Blog Click & Gruda', inLanguage: 'pt-BR',
    about: { '@type': 'Blog', '@id': `${base}/blog#blog`, name: 'Blog Click & Gruda', url: `${base}/blog` },
    description: 'Guias de sublimação de canecas, preparação de artes e apresentação em mockups 3D.',
    mainEntity: { '@type': 'ItemList', itemListElement: list.map((article, index) => ({
      '@type': 'ListItem', position: index + 1, url: `${base}/blog/${article.slug}`, name: article.title,
    })) },
  };

  return (
    <div className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd).replace(/</g, '\\u003c') }} />
      {/* brilho de fundo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(232,112,58,0.14),transparent_65%)]" />

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6">
        {/* cabeçalho */}
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3 w-3" /> Blog do Click &amp; Gruda
          </span>
          <h1 className="font-display mt-4 text-3xl font-bold leading-tight text-white sm:text-5xl">
            Conteúdo para quem vive de{' '}
            <span className="bg-gradient-to-r from-[#e8703a] to-[#ffb488] bg-clip-text text-transparent">
              canecas personalizadas
            </span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400 sm:text-base">
            Da preparação da arte à peça pronta: aprenda a investigar falhas, organizar a produção
            e apresentar suas criações. Conteúdo prático para consultar no seu ritmo.
          </p>
          <p className="mt-5 inline-flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-400">
            <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 font-semibold text-primary">{NEW_SUBLIMATION_ARTICLES.length} novos guias de sublimação</span>
            <span>{ALL_ARTICLES.length} artigos disponíveis</span>
            <Link href="/mockup-caneca-3d" className="inline-flex items-center gap-1 text-neutral-200 transition-colors hover:text-primary">Conheça o Studio <ArrowUpRight className="h-3 w-3" /></Link>
          </p>
        </div>

        <form action="/blog" method="get" role="search" className="mt-7 flex max-w-xl items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.03] p-2 focus-within:border-primary/60">
          {active && <input type="hidden" name="cat" value={active} />}
          <Search aria-hidden className="ml-2 h-4 w-4 shrink-0 text-neutral-500" />
          <label htmlFor="blog-search" className="sr-only">Pesquisar artigos do blog</label>
          <input id="blog-search" name="q" type="search" defaultValue={query} maxLength={120} placeholder="Busque: cores, prensa, resolução…" className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-500" />
          <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/85">Buscar</button>
        </form>

        {/* filtro por categoria */}
        <div className="thin-scroll mt-8 flex gap-2 overflow-x-auto pb-1">
          <Link
              href={categoryHref()}
              aria-current={!active ? 'page' : undefined}
            className={cn(
              'shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-all',
              !active
                ? 'border-primary/60 bg-primary/15 text-primary'
                : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200',
            )}
          >
            Todos ({ALL_ARTICLES.length})
          </Link>
          {BLOG_CATEGORIES.map((c) => (
            <Link
              key={c}
              href={categoryHref(c)}
              aria-current={active === c ? 'page' : undefined}
              className={cn(
                'shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-all',
                active === c
                  ? 'border-primary/60 bg-primary/15 text-primary'
                  : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200',
              )}
            >
              {c} ({countCategory(c)})
            </Link>
          ))}
        </div>

        {query && <p className="mt-4 text-sm text-neutral-400">{list.length} resultado{list.length === 1 ? '' : 's'} para <strong className="break-words text-neutral-200">“{query}”</strong>. <Link href={active ? `/blog?cat=${encodeURIComponent(active)}` : '/blog'} className="text-primary underline underline-offset-4">Limpar busca</Link></p>}

        {list.length === 0 && (
          <p className="mt-16 text-center text-sm text-neutral-500">
            Nenhum artigo encontrado. Tente outro termo ou escolha uma categoria diferente.
          </p>
        )}

        {/* destaque */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group mt-8 block overflow-hidden rounded-3xl border border-white/10 bg-[#131010] transition-all hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10"
          >
            <div className="grid md:grid-cols-[1.5fr_1fr]">
              <div className="p-6 sm:p-8">
                <span className={cn('inline-block rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider', CATEGORY_STYLES[featured.category])}>
                  {featured.category}
                </span>
                <h2 className="font-display mt-4 text-xl font-bold leading-snug text-white transition-colors group-hover:text-primary sm:text-2xl">
                  {featured.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-neutral-400">{featured.description}</p>
                <div className="mt-5 flex flex-wrap items-center gap-4 text-[11px] text-neutral-500">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" /> {formatDateBR(featured.date)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {readingMinutes(featured)} min de leitura
                  </span>
                  <span className="flex items-center gap-1.5 font-bold text-primary">
                    Ler artigo <BookOpen className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
              <div className="relative hidden items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,#231512,#0d0a08)] md:flex">
                <span className="watermark pointer-events-none absolute font-display text-[120px] font-bold leading-none">
                  CG
                </span>
                <BookOpen className="relative h-20 w-20 text-primary/60 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6" />
              </div>
            </div>
          </Link>
        )}

        {/* grade */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Artigos do blog">
          {rest.map((a) => (
            <Link
              key={a.slug}
              href={`/blog/${a.slug}`}
              className="group flex flex-col rounded-2xl border border-white/10 bg-[#131010] p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
            >
              <span className={cn('inline-block w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', CATEGORY_STYLES[a.category])}>
                {a.category}
              </span>
              <h3 className="font-display mt-3 text-base font-bold leading-snug text-white transition-colors group-hover:text-primary">
                {a.title}
              </h3>
              <p className="mt-2 line-clamp-3 flex-1 text-[13px] leading-relaxed text-neutral-400">
                {a.description}
              </p>
              <div className="mt-4 flex items-center gap-3 border-t border-white/5 pt-3 text-[11px] text-neutral-500">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> {formatDateBR(a.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {readingMinutes(a)} min
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
