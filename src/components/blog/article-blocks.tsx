/* ============================================================
   Renderizador dos blocos de artigo do blog
   ============================================================ */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { headingId, type BlogBlock } from '@/data/blog';

export function ArticleBlocks({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'h2':
            return (
              <h2
                key={i}
                id={headingId(b.text, i)}
                className="font-display mt-10 flex scroll-mt-24 items-start gap-3 text-xl font-bold leading-snug text-white sm:text-2xl"
              >
                <span className="mt-2 h-5 w-1.5 shrink-0 rounded-full bg-primary" />
                {b.text}
              </h2>
            );

          case 'h3':
            return (
              <h3 key={i} id={headingId(b.text, i)} className="font-display mt-7 scroll-mt-24 text-lg font-semibold text-neutral-100">
                {b.text}
              </h3>
            );

          case 'p':
            return (
              <p key={i} className="text-[15px] leading-[1.85] text-neutral-300">
                {b.text}
              </p>
            );

          case 'ul':
            return (
              <ul key={i} className="space-y-2.5">
                {b.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-neutral-300">
                    <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            );

          case 'ol':
            return (
              <ol key={i} className="space-y-2.5">
                {b.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-[15px] leading-relaxed text-neutral-300">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                      {j + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            );

          case 'quote':
            return (
              <blockquote
                key={i}
                className="rounded-r-xl border-l-4 border-primary bg-primary/5 px-5 py-4 text-[15px] italic leading-relaxed text-neutral-200"
              >
                {b.text}
              </blockquote>
            );

          case 'cta': {
            const external = b.href.startsWith('http');
            const inner = (
              <>
                <div className="flex-1">
                  <p className="font-display text-sm font-bold text-[#1d130d]">{b.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#5c4331]">{b.text}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#1d130d] px-4 py-2 font-display text-xs font-bold text-white transition-transform group-hover:scale-105">
                  {b.label} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </>
            );
            const cls =
              'group flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-[#e8703a] to-[#f0955f] p-5 shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/25 sm:flex-row sm:items-center';
            return external ? (
              <a key={i} href={b.href} target="_blank" rel="noopener noreferrer" className={cls}>
                {inner}
              </a>
            ) : (
              <Link key={i} href={b.href} className={cls}>
                {inner}
              </Link>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}
