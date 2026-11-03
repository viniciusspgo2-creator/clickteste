import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  try {
    const now = new Date(), week = new Date(now.getTime() - 7 * 86400000);
    const valid = { active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] };
    const [total, active, pending, expired, revoked, bound, library, recent, sessions] = await db.$transaction([
      db.accessCode.count(), db.accessCode.count({ where: valid }),
      db.accessCode.count({ where: { ...valid, uses: { none: {} } } }),
      db.accessCode.count({ where: { active: true, expiresAt: { lte: now } } }),
      db.accessCode.count({ where: { active: false } }),
      db.accessCode.count({ where: { uses: { some: {} } } }),
      db.accessCode.count({ where: { clientType: "library" } }),
      db.accessCode.count({ where: { createdAt: { gte: week } } }),
      db.accessCode.count({ where: { ...valid, sessionExpiresAt: { gt: now }, sessionHash: { not: null } } }),
    ]);
    const universalSessions = await db.accessCodeUse.count({
      where: { sessionHash: { not: null }, sessionExpiresAt: { gt: now }, code: { accessMode: "universal", active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } },
    });
    return NextResponse.json({ ok: true, overview: { total, active, pending, expired, revoked, bound, library, recent, sessions: sessions + universalSessions },
      updatedAt: now.toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Não foi possível carregar os indicadores." }, { status: 500 });
  }
}
