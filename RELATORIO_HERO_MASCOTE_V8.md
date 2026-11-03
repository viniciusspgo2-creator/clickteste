# Click & Gruda — Hero com Mascote da Prensa · V8

**Base:** `clickgruda-landing-premium-v7-2026-11-03.zip`.
**Escopo:** somente hero da landing page.
**Publicação:** nenhuma alteração feita no GitHub ou na Vercel.

## Alterações no projeto

- `src/components/site/studio-home.css`: substituição do fundo da seção hero pelo cenário aprovado com o novo mascote segurando a prensa; ajustes de gradiente para manter legibilidade do texto HTML; crop separado para celulares.
- `src/components/site/studio-home.tsx`: quebra visual do título para três linhas e descrição acessível do novo mascote. Os links, botões, player, rotas e handlers continuam inalterados.
- `public/cg-home/hero-mascot-studio-v8.webp`: composição **sem textos nem botões da landing embutidos**, com mascote, prensa e cenário, aproximadamente 155 kB.
- `public/cg-home/hero-mascot-studio-mobile-v8.webp`: composição voltada para celular, aproximadamente 98 kB.
- `public/cg-home/mascote-prensa-original-v8.png`: cópia preservada da imagem original fornecida pelo usuário para reutilização futura; não carregada pelo navegador.
- `public/cg-home/hero-studio-wide.webp`: original da V7 mantido, não sobrescrito.

## Validações executadas

- Validação sintática TSX pelo TypeScript: **0 erros**.
- Parse do CSS com PostCSS: **0 erros**.
- `node scripts/verify-source.mjs`: **279 arquivos, 688 imports, 0 problemas**.
- `npm run verify:creative`: **217 testes aprovados, 0 falhas**.
- Integridade das três imagens com Pillow: **aprovada**.
- Prévia estática em Chromium nas larguras **1600 px e 390 px**: sem rolagem horizontal. A prévia usa markup ilustrativo, não o Next.js em execução.
- Comparação de arquivos com a V7: apenas os dois arquivos do hero acima modificados; três assets e este relatório adicionados.

## Limitação

O build final do Next.js (`npm run build`) não foi realizado neste ambiente porque não há `node_modules` instalados. Faça deploy de **pré-visualização** antes de publicar em produção, testando desktop, tablet, celular, botões e vídeo.
