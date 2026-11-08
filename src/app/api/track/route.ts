/* ============================================================
   POST /api/track — beacon de visitas (anônimo, 1 linha por pageview)
   ============================================================ */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {readJsonBody} from '@/lib/security/request-body';
import {clientAddress} from '@/lib/security/rate-limit';
import {sameOriginMutation} from '@/lib/studio-access-options';
import { todayInSaoPaulo, rateLimit } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!sameOriginMutation(req) || !rateLimit('track:'+clientAddress(req),60,60000)) return new NextResponse(null,{status:204});
  try {
    const body = (await readJsonBody(req,2048)) as { path?: string; sid?: string };
    const path = String(body.path ?? '/').slice(0, 200);
    const sid = String(body.sid ?? '').slice(0, 64);

    if (path.startsWith('/admin') || path.startsWith('/api') || !sid) {
      return new NextResponse(null, { status: 204 });
    }

    // filtro básico de bots
    const ua = req.headers.get('user-agent') ?? '';
    if (/bot|spider|crawl|preview|lighthouse|headless/i.test(ua)) {
      return new NextResponse(null, { status: 204 });
    }

    await db.visit.create({
      data: { day: todayInSaoPaulo(), path, sid },
    });

    // limpeza eventual de registros antigos
    if (Math.random() < 0.02) {
      await db.visit.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 120 * 86_400_000) } } });
    }
  } catch {
    /* nunca quebra a página do usuário */
  }
  return new NextResponse(null, { status: 204 });
}
