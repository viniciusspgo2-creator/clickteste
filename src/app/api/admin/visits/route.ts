/* ============================================================
   GET /api/admin/visits → estatísticas do contador de visitas
   ============================================================ */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isoDaysAgoInSaoPaulo, requireAdmin, todayInSaoPaulo } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado.' }, { status: 401 });
  }

  const today = todayInSaoPaulo();
  const d7 = isoDaysAgoInSaoPaulo(6);
  const d30 = isoDaysAgoInSaoPaulo(29);

  // limpeza ocasional de registros muito antigos
  if (Math.random() < 0.1) {
    await db.visit.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 120 * 86_400_000) } } });
  }

  const [total, hoje, ultimos7, ultimos30, paths, sids] = await Promise.all([
    db.visit.count(),
    db.visit.count({ where: { day: today } }),
    db.visit.count({ where: { day: { gte: d7 } } }),
    db.visit.count({ where: { day: { gte: d30 } } }),
    db.visit.groupBy({
      by: ['path'],
      where: { day: { gte: d30 } },
      _count: { _all: true },
      orderBy: { _count: { path: 'desc' } },
      take: 8,
    }),
    db.visit.findMany({
      where: { day: { gte: d7 } },
      distinct: ['sid'],
      select: { sid: true },
    }),
  ]);

  // série dos últimos 30 dias (preenche dias sem visitas)
  const grouped = await db.visit.groupBy({
    by: ['day'],
    where: { day: { gte: d30 } },
    _count: { _all: true },
  });
  const map = new Map(grouped.map((g) => [g.day, g._count._all]));
  const serie: { day: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = isoDaysAgoInSaoPaulo(i);
    serie.push({ day, count: map.get(day) ?? 0 });
  }

  return NextResponse.json({
    ok: true,
    stats: {
      total,
      hoje,
      ultimos7,
      ultimos30,
      sessoes7: sids.length,
      topPaginas: paths.map((p) => ({ path: p.path, visitas: p._count._all })),
      serie,
    },
  });
}
