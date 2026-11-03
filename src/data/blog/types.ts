import { LIBRARY_URL, DISCOVERY_SUPPORT_URL } from '../../lib/studio-links';

/* ============================================================
   Tipos do blog do Click & Gruda — artigos SEO em pt-BR
   ============================================================ */

export type BlogCategory =
  | 'Sublimação'
  | 'Mockups'
  | 'Marketing'
  | 'Redes Sociais'
  | 'Ferramentas';

export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'cta'; title: string; text: string; href: string; label: string };

export interface BlogFaqItem {
  q: string;
  a: string;
}

export interface BlogArticle {
  slug: string;
  title: string;
  description: string;
  category: BlogCategory;
  tags: string[];
  /** ISO date: "2026-10-05" */
  date: string;
  keywords: string[];
  content: BlogBlock[];
  faq: BlogFaqItem[];
}

/** Links reais usados nos CTAs dos artigos */
export const CTA_LINKS = {
  inicio: '/',
  mockup: '/mockup-caneca-3d/studio',
  qr: '/bonus/qr',
  whatsapp: '/bonus/whatsapp',
  orcamento: '/bonus/orcamento',
  contrato: '/bonus',
  pdf: '/bonus/pdf',
  imagens: '/bonus',
  ferramentas: '/bonus',
  blog: '/blog',
  biblioteca: LIBRARY_URL,
  tv: LIBRARY_URL,
  suporte: DISCOVERY_SUPPORT_URL,
} as const;
