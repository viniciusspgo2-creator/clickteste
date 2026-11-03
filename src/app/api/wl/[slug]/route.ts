import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/wl/{slug} — redireciona para o WhatsApp com o nome personalizado
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const link = await db.whatsAppLink.findUnique({ where: { slug } });

  if (!link) {
    return NextResponse.redirect(new URL('/?erro=link-nao-encontrado', req.url), 302);
  }

  // Contabiliza clique. Precisa ser aguardado: na Vercel (serverless) a função
  // é encerrada logo após a resposta e um update "solto" pode nunca executar.
  // Falha na contagem não bloqueia o redirect.
  try {
    await db.whatsAppLink.update({ where: { id: link.id }, data: { clicks: { increment: 1 } } });
  } catch {
    /* ignora */
  }

  const waUrl = `https://wa.me/${link.phone}${link.message ? `?text=${encodeURIComponent(link.message)}` : ''}`;
  return NextResponse.redirect(waUrl, 302);
}
