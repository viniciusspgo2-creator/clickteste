import { ALL_ARTICLES } from "@/data/blog";
import { getSeoConfig } from "@/lib/site-config";
import { BONUS_TOOLS, LIBRARY_URL, SUPPORT_URL } from "@/lib/studio-links";
export const dynamic = "force-dynamic";
export async function GET() {
  const seo = await getSeoConfig();
  const base = (seo.siteUrl || "https://clicktools.vercel.app").replace(
    /\/+$/,
    "",
  );
  const body = `# Click Gruda — Studio Mockup 3D

O produto principal é o Studio Mockup 3D para personalizados e sublimação. O acesso avulso custa R$ 12,90 por 24 horas, com criação de quantos mockups desejar durante esse período. A Biblioteca tem oferta vitalícia de R$ 47,90 e inclui o Studio. Assinantes da Biblioteca Click Gruda têm acesso gratuito mediante código. Pagamento, confirmação da assinatura e liberação são feitos pelo suporte no WhatsApp. O código é pessoal, vinculado a um navegador, com uma sessão ativa.

- Studio: ${base}/mockup-caneca-3d/studio
- Apresentação do Studio: ${base}/#studio
- Biblioteca Studio 3D: ${LIBRARY_URL}
- Suporte: ${SUPPORT_URL}
- Conteúdo completo dos artigos: ${base}/llms-full.txt

## Cinco bônus gratuitos

Sem assinatura nem código; arquivos processados no próprio navegador.
${BONUS_TOOLS.map((t) => `- [${t.title}](${base}/bonus/${t.id}): ${t.description}`).join("\n")}

O PDF permite edição visual de texto selecionável, anotações e formulários; não faz OCR de páginas digitalizadas nem redação segura. O leitor Excel aceita XLSX e CSV e não executa macros.

## Artigos e guias

${ALL_ARTICLES.map((a) => `- [${a.title}](${base}/blog/${a.slug}): ${a.description}`).join("\n")}
`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
