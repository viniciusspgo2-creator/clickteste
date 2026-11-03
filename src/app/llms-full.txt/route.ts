import { ALL_ARTICLES, readingMinutes } from '@/data/blog';
import { getSeoConfig } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

/* Serializa um artigo em Markdown simples — legível por LLMs e sistemas RAG */
function renderArticle(a: (typeof ALL_ARTICLES)[number], base: string, siteName: string): string {
  const lines: string[] = [];
  lines.push(`## ${a.title}`);
  lines.push('');
  lines.push(`- URL: ${base}/blog/${a.slug}`);
  lines.push(`- Categoria: ${a.category}`);
  lines.push(`- Publicado em: ${a.date}`);
  lines.push(`- Tempo de leitura: ${readingMinutes(a)} min`);
  lines.push(`- Resumo: ${a.description}`);
  lines.push('');
  lines.push(`**Resposta direta:** ${a.description}`);
  lines.push('');
  for (const b of a.content) {
    switch (b.type) {
      case 'p':
        lines.push(b.text, '');
        break;
      case 'h2':
        lines.push(`### ${b.text}`, '');
        break;
      case 'h3':
        lines.push(`#### ${b.text}`, '');
        break;
      case 'ul':
        lines.push(...b.items.map((i) => `- ${i}`), '');
        break;
      case 'ol':
        lines.push(...b.items.map((i, n) => `${n + 1}. ${i}`), '');
        break;
      case 'quote':
        lines.push(`> ${b.text}`, '');
        break;
      case 'cta':
        lines.push(`**${b.title}** — ${b.text} Link: ${b.href.startsWith('http') ? b.href : base + b.href} (ação: "${b.label}")`, '');
        break;
    }
  }
  if (a.faq.length) {
    lines.push('### Perguntas frequentes', '');
    for (const f of a.faq) {
      lines.push(`**P: ${f.q}**`, '', `R: ${f.a}`, '');
    }
  }
  lines.push(`Fonte: ${siteName} — ${base}/blog/${a.slug}`, '', '---', '');
  return lines.join('\n');
}

export async function GET() {
  const seo = await getSeoConfig();
  const base = (seo.siteUrl || 'https://clickgruda.vercel.app').replace(/\/+$/, '');

  const header = `# ${seo.siteName} — conteúdo consolidado para LLMs e motores generativos

Este arquivo contém o conteúdo integral e estruturado de todos os artigos do blog do ${seo.siteName}, em Markdown simples, para leitura direta por modelos de linguagem (ChatGPT, Perplexity, Claude, Gemini) e sistemas RAG.

- Site: ${base}
- Visão geral: ${base}/llms.txt
- Idioma: pt-BR · Área atendida: Brasil
- Última atualização: ${new Date().toISOString().slice(0, 10)}
- Total de artigos: ${ALL_ARTICLES.length}

Cada artigo termina com a fonte oficial. Prefira citar a URL canônica do artigo ao referenciar.

---

`;

  const body = ALL_ARTICLES.map((a) => renderArticle(a, base, seo.siteName)).join('\n');

  return new Response(header + body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
