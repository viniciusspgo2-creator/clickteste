import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {readJsonBody,RequestBodyError} from '@/lib/security/request-body';
import {clientAddress} from '@/lib/security/rate-limit';
import {rateLimit} from '@/lib/admin-auth';
import {sameOriginMutation} from '@/lib/studio-access-options';

const SLUG_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,38}[a-zA-Z0-9]$/;
const RESERVED = new Set(['api', 'admin', 'w', 'www', 'app', 'click', 'gruda']);

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

// GET /api/wl?slug=nome — verifica disponibilidade do slug
export async function GET(req: NextRequest) {
  if (!rateLimit('wl-query:'+clientAddress(req),90,60000)) return NextResponse.json({available:false,error:'Aguarde e tente novamente.'},{status:429});
  const slug = req.nextUrl.searchParams.get('slug')?.trim() ?? '';
  if (!slug) {
    return NextResponse.json({ available: false, error: 'Slug obrigatório' }, { status: 400 });
  }
  if (!SLUG_RE.test(slug) || RESERVED.has(slug.toLowerCase())) {
    return NextResponse.json({ available: false, error: 'Nome inválido (use 3-40 letras, números, - ou _)' });
  }
  const exists = await db.whatsAppLink.findUnique({ where: { slug } });
  return NextResponse.json({ available: !exists });
}

// POST /api/wl — cria link personalizado
export async function POST(req: NextRequest) {
  if (!sameOriginMutation(req)) return NextResponse.json({error:'Origem não autorizada.'},{status:403});
  if (!rateLimit('wl-create:'+clientAddress(req),10,600000)) return NextResponse.json({error:'Aguarde e tente novamente.'},{status:429});
  try {
    const body = await readJsonBody(req,4096);
    const slug = String(body.slug ?? '').trim();
    const phone = normalizePhone(String(body.phone ?? ''));
    const message = String(body.message ?? '').slice(0, 600);
    const title = String(body.title ?? '').slice(0, 120);

    if (!SLUG_RE.test(slug) || RESERVED.has(slug.toLowerCase())) {
      return NextResponse.json(
        { error: 'Nome personalizado inválido. Use 3-40 caracteres: letras, números, hífen ou underline.' },
        { status: 400 }
      );
    }
    if (phone.length < 10 || phone.length > 15) {
      return NextResponse.json({ error: 'Telefone inválido. Inclua DDI + DDD + número.' }, { status: 400 });
    }

    const exists = await db.whatsAppLink.findUnique({ where: { slug } });
    if (exists) {
      return NextResponse.json({ error: 'Este nome já está em uso. Tente outro.' }, { status: 409 });
    }

    const created = await db.whatsAppLink.create({
      data: { slug, phone, message, title },
    });

    const origin = req.nextUrl.origin;
    return NextResponse.json({
      ok: true,
      slug: created.slug,
      shortUrl: `${origin}/api/wl/${created.slug}`,
      waUrl: `https://wa.me/${created.phone}${message ? `?text=${encodeURIComponent(message)}` : ''}`,
    });
  } catch (e) {
    if(e instanceof RequestBodyError)return NextResponse.json({error:e.message},{status:e.status});
    console.error('WL POST error', e instanceof Error?e.name:'unknown');
    return NextResponse.json({ error: 'Erro ao criar link. Tente novamente.' }, { status: 500 });
  }
}
