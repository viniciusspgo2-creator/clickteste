# Atualização ClickTools — Click & Gruda (29/10/2026)

## Alterações entregues

- **Hero horizontal full-width**: imagem aprovada usada como cenário de fundo, mascote à direita e textos/botões sem texto embutido (SEO e responsividade preservados); versão mobile com visual próprio.
- **Copy hero**: “Crie Mockups de Canecas em Segundos”, editor 3D, exemplos de ferramentas e exportação até 4K, respeitando suporte de navegador/dispositivo.
- **Catálogo Online**: cartão “EM BREVE” informativo, sem link enganoso para recurso não publicado.
- **Áudio de apresentação**: permanece somente sob clique; não foi adicionado autoplay.
- **Carrossel da Biblioteca**: 38 artes de `ARTES .rar` convertidas para WEBP, duas faixas contínuas com pausa no hover e rótulos por código CG.
- **Recursos avançados**: 8 cards explicando composições com até 4 canecas, movimentação livre, tipos de caneca, exportação JPEG/PNG/WebP, MP4/WebM e transparência alfa, filtros e controles, iluminação e fundos.
- **CTA final**: nova ilustração cinematográfica de fundo horizontal, com mascote à direita e texto HTML à esquerda.
- **Legibilidade**: texto das ferramentas bônus e rodapé aumentado; estados móveis contemplados no CSS.

## Arquivos alterados

- `src/components/site/studio-home.tsx`
- `src/components/site/studio-home.css`
- `public/cg-home/hero-studio-wide.webp` (novo)
- `public/cg-home/cta-studio-wide.webp` (novo)
- `public/cg-art-gallery-new/*.webp` (38 arquivos novos)

## Escopo e observações

Código do editor 3D, controle de acesso, painel administrativo, API e banco foram mantidos. O recurso de catálogo foi comunicado como futuro, não publicado. A disponibilidade de exportações avançadas depende da compatibilidade do navegador/dispositivo.

**Validação local:** inspeção sintática TSX e dos arquivos de imagem passou. O build completo não pôde ser executado nesta sessão porque `npm ci` falhou com `Exit handler never called!`; **não** considerar o pacote testado em produção até um build na Vercel passar.
