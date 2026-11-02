/* ============================================================
   POST   /api/admin/login  → autentica e cria sessão
   GET    /api/admin/login  → verifica sessão atual
   DELETE /api/admin/login  → encerra sessão
   ============================================================ */

import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  checkAdminPassword,
  createAdminToken,
  rateLimit,
  requireAdmin,
} from '@/lib/admin-auth';

export const runtime = 'nodejs';

function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'local'
  );
}

export async function POST(req: Request) {
  if (!rateLimit(`login:${clientIp(req)}`, 8, 10 * 60_000)) {
    return NextResponse.json(
      { ok: false, error: 'Muitas tentativas. Aguarde 10 minutos.' },
      { status: 429 },
    );
  }

  let password = '';
  try {
    const body = (await req.json()) as { password?: string };
    password = String(body.password ?? '');
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida.' }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json({ ok: false, error: 'Digite a senha.' }, { status: 400 });
  }

  const ok = await checkAdminPassword(password);
  if (!ok) {
    return NextResponse.json({ ok: false, error: 'Senha incorreta.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createAdminToken(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 12 * 3600,
    secure: process.env.NODE_ENV === 'production' && process.env.FORCE_INSECURE_COOKIE !== '1',
  });
  return res;
}

export async function GET(req: Request) {
  return NextResponse.json({ ok: true, authed: requireAdmin(req) });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
