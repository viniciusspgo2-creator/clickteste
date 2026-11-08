import {readJsonBody, RequestBodyError} from '@/lib/security/request-body';
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

import {sameOriginMutation} from '@/lib/studio-access-options';
import {clientAddress,takeSharedRateLimit} from '@/lib/security/rate-limit';
export const runtime = 'nodejs';


export async function POST(req: Request) {
  if (!sameOriginMutation(req)) return NextResponse.json({ok:false,error:'Origem não autorizada.'}, {status:403});
  if (!rateLimit(`login:${clientAddress(req)}`, 8, 10 * 60_000)) {
    return NextResponse.json(
      { ok: false, error: 'Muitas tentativas. Aguarde 10 minutos.' },
      { status: 429 },
    );
  }

  try {
    const limit = await takeSharedRateLimit('admin-login', clientAddress(req), 8, 10 * 60_000);
    if (!limit.allowed) return NextResponse.json({ok:false,error:'Muitas tentativas. Aguarde e tente novamente.'}, {status:429,headers:{'Retry-After':String(limit.retryAfter)}});
  } catch { return NextResponse.json({ok:false,error:'Login temporariamente indisponível. Tente novamente.'}, {status:503}); }
  let password = '';
  try {
    const body = (await readJsonBody(req, 4096)) as { password?: string };
    password = typeof body.password === 'string' ? body.password : '';
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Requisição inválida.' }, { status: error instanceof RequestBodyError ? error.status : 400 });
  }

  if (!password) {
    return NextResponse.json({ ok: false, error: 'Digite a senha.' }, { status: 400 });
  }

  let ok = false;
  try { ok = await checkAdminPassword(password); } catch { return NextResponse.json({ok:false,error:'Login temporariamente indisponível. Tente novamente.'}, {status:503}); }
  if (!ok) {
    return NextResponse.json({ ok: false, error: 'Senha incorreta.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createAdminToken(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 12 * 3600,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}

export async function GET(req: Request) {
  return NextResponse.json({ ok: true, authed: requireAdmin(req) });
}

export async function DELETE(req: Request) {
  if (!sameOriginMutation(req)) return NextResponse.json({ok:false,error:'Origem não autorizada.'}, {status:403});
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
