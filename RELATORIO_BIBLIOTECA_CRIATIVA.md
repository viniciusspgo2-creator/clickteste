# Click & Gruda — Entrega: Biblioteca Criativa do Editor 2D

Base: **Editor 2D Premium V4, de 03/11/2026**. Escopo: apenas o editor de artes. Não houve commit, deploy nem modificação do projeto em produção.

## Implementação

Nova seção **Biblioteca** na barra do Editor 2D, com navegação interna:

- **Modelos** — acesso direto aos modelos já existentes (não cria um segundo sistema de templates).
- **Stickers** — 3D Fluent Emoji e vetores coloridos Noto Emoji.
- **Elementos** — seleção com fontes Tabler, Lucide e Phosphor, todos pelos arquivos oficiais e versões fixadas.
- **Formas** — SVGs autorais com cor selecionável e espessura pré-definível antes de inserir.
- **Molduras e Faixas** — estilos autorais, alguns com espaços transparentes para composição.
- **Fundos e Padrões** — 105 combinações vetoriais para a resolução ativa do projeto (incluindo 2480×1122), sem esticar um raster.
- **Frases** — 91 textos autorais genéricos, editáveis pelos controles existentes, com opções por ocasião.
- **Favoritos** — localStorage no navegador do usuário, sem banco ou API.
- **Recentes** — histórico dos últimos 40 itens inseridos, apenas local.

13 categorias por ocasião em português e busca normalizada sem acentos, com nomes e tags para termos simples. O manifesto canônico está em `src/lib/creative/library-manifest.ts` e inclui todos os metadados solicitados.

**Catálogo total:** 457 itens fixos + até 735 vetores Tabler = **até 1.192** quando o índice oficial carrega corretamente. Quantidade efetiva menor caso o índice não esteja disponível ou não contenha entradas correspondentes à curadoria. Não são 1.192 arquivos empacotados no ZIP: as bibliotecas externas são consultadas **sob demanda** em versões fixadas.

## Integração e segurança

Todos os stickers e elementos continuam inseridos pelo `addImage()` já existente. Os fundos seguem `applyTemplate(..., 'background')`, e frases usam `addText()`. Não foram modificados callbacks existentes de arrastar, rotacionar, redimensionar, desfazer/refazer ou exportar. Os PNGs são convertidos em data URL antes de desenhar; SVGs externos são reconstruídos apenas com elementos/atributos permitidos e bloqueio de scripts, atributos de eventos e links externos.

Grade com **virtualização de linhas**, miniaturas visíveis e cache limitado, esqueleto de carregamento, busca, seleção, estados de vazio e erro, focos de teclado e avisos inteligíveis. Nenhuma nova dependência npm foi instalada.

## Arquivos alterados

1. `src/components/creative/creative-editor.tsx` — somente nova opção de painel e integração do componente.
2. `src/components/creative/creative.css` — estilos da nova biblioteca escopados sob `.cg-creative`.

## Arquivos novos

1. `src/components/creative/curated-library.tsx`
2. `src/lib/creative/library-manifest.ts`
3. `src/lib/creative/library-native.ts`
4. `src/lib/creative/library-load.ts`
5. `CREDITS-LIBRARY.md`
6. `tests/v61-curated-library.mjs`
7. `RELATORIO_BIBLIOTECA_CRIATIVA.md`

Não foram alterados **Studio Mockup 3D, Home, login, checkout, Prisma, rotas, endpoints, arquivos de banco, nem componentes externos ao Editor 2D**.

## Verificações e limites

- 217 testes de regressão do projeto + 7 novos testes do manifesto e integração.
- `node scripts/verify-source.mjs`: zero problemas de imports.
- Sintaxe de todos os TS/TSX novos via parser TypeScript: sem erros.
- CSS analisado com `tinycss2`: sem erros de parse.
- SVGs autorais (formas e fundos) validados com parser XML.
- SVG externo de teste sanitizado no Chromium: remove script, evento e link remoto, preserva gradientes locais.
- Repositórios/licenças principais verificados em suas versões fixas; Remix Icon atual foi excluído por mudança de licença.

**Limitações que requerem avaliação no navegador de homologação:** build de produção Next.js não executado, pois não havia dependências npm locais e o ambiente não tinha acesso de rede ao registro. Também não foi possível executar a aplicação inteira contra o CDN neste ambiente isolado. Recomenda-se `npm ci && npm run build` e teste de inserção/exportação de um sticker Fluent, Noto e vetor Tabler antes da publicação.

A biblioteca preserva o modelo de camadas como `image`. Isso permite usar as ferramentas existentes de posição, opacidade e sombra; **não transforma SVGs em objetos de edição por nós**. Cor e espessura das formas são escolhidas antes da inserção. Mudanças de traço internas posteriores, máscaras vetoriais editáveis ou ajuste automático das fontes das frases exigiriam modificações no motor que não foram autorizadas.

**Licenciamento:** detalhes de origem, termos e versões em `CREDITS-LIBRARY.md`. Nenhum asset de Game Icons, Twemoji, OpenMoji, personagens comerciais ou Remix Icon atual foi copiado.
