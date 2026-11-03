/* ============================================================
   GET /api/admin/seo → configuração atual
   PUT /api/admin/seo → salva configuração
   ============================================================ */

import { NextResponse } from 'next/server';
import { getSeoConfig, saveSeoConfig, type SeoConfig } from '@/lib/site-config';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado.' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, seo: await getSeoConfig() });
}

export async function PUT(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado.' }, { status: 401 });
  }
  let body: Partial<SeoConfig> & { keywords?: string | string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida.' }, { status: 400 });
  }

  const rawKeywords = body.keywords;
  const clean: Partial<SeoConfig> = {
    siteName: String(body.siteName ?? '').slice(0, 80) || undefined,
    defaultTitle: String(body.defaultTitle ?? '').slice(0, 120) || undefined,
    titleTemplate: String(body.titleTemplate ?? '').slice(0, 120) || undefined,
    description: String(body.description ?? '').slice(0, 300) || undefined,
    keywords:
      typeof rawKeywords === 'string'
        ? rawKeywords
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean)
            .slice(0, 30)
        : Array.isArray(rawKeywords)
          ? rawKeywords.slice(0, 30).map((k) => String(k).slice(0, 40))
          : undefined,
    siteUrl: String(body.siteUrl ?? '').trim().replace(/\/+$/, '') || undefined,
    ogImage: String(body.ogImage ?? '').slice(0, 300) || undefined,
    twitterCreator: String(body.twitterCreator ?? '').slice(0, 40),
    gaId: String(body.gaId ?? '').slice(0, 24),
  };

  const seo = await saveSeoConfig(clean);
  return NextResponse.json({ ok: true, seo });
}
