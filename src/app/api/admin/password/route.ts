/* ============================================================
   POST /api/admin/password → troca a senha do painel
   ============================================================ */

import { NextResponse } from 'next/server';
import { checkAdminPassword, requireAdmin, setAdminPassword } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado.' }, { status: 401 });
  }

  let body: { current?: string; next?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida.' }, { status: 400 });
  }

  const current = String(body.current ?? '');
  const next = String(body.next ?? '');

  if (!(await checkAdminPassword(current))) {
    return NextResponse.json({ ok: false, error: 'Senha atual incorreta.' }, { status: 401 });
  }
  if (next.length < 6) {
    return NextResponse.json(
      { ok: false, error: 'A nova senha precisa ter pelo menos 6 caracteres.' },
      { status: 400 },
    );
  }

  await setAdminPassword(next);
  return NextResponse.json({ ok: true });
}
