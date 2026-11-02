import Link from 'next/link';
import { ArrowLeft, BookOpen, MessageCircle } from 'lucide-react';
import { Footer } from '@/components/site/footer';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0908] text-neutral-100">
      {/* cabeçalho próprio do blog (rota real, fora do SPA) */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-[#0a0908]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 transition-transform active:scale-95">
            <img src="/icons/icon-192.png" alt="Logo Click & Gruda" className="h-9 w-9 rounded-lg" />
            <div className="hidden text-left sm:block">
              <p className="font-display text-sm font-bold leading-none">
                Click <span className="text-primary">&amp;</span> Gruda
                <span className="ml-1 text-[10px] font-medium text-muted-foreground">Tools</span>
              </p>
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Blog</p>
            </div>
          </Link>

          <nav className="ml-auto flex items-center gap-1 rounded-full border border-border/70 bg-secondary/40 p-1" aria-label="Navegação">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Início
            </Link>
            <Link href="/blog" className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground">
              <BookOpen className="h-3.5 w-3.5" /> Blog
            </Link>
          </nav>

          <a
            href="https://wa.me/62998387816"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-full border border-whats/40 bg-whats/10 px-3.5 py-2 text-xs font-medium text-whats transition-all hover:bg-whats/20 sm:flex"
          >
            <MessageCircle className="h-3.5 w-3.5" /> Suporte
          </a>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  );
}
