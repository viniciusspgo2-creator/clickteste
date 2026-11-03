import type { MetadataRoute } from 'next';
import { DEFAULT_SEO, getSeoConfig } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSeoConfig();
  const base = (seo.siteUrl || DEFAULT_SEO.siteUrl).replace(/\/+$/, '');

  return {
    rules: [
      /* Busca tradicional */
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
      /* Crawlers de IA — GEO (permitidos expressamente) */
      { userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User'], allow: '/' },
      { userAgent: ['PerplexityBot', 'Perplexity-User'], allow: '/' },
      { userAgent: ['ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai'], allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'CCBot', allow: '/' },
      { userAgent: 'Applebot-Extended', allow: '/' },
      { userAgent: 'Bytespider', allow: '/' },
      { userAgent: 'Amazonbot', allow: '/' },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
