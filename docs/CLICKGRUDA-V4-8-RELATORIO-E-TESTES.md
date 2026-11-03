# Click & Gruda V4.8 — Relatório de atualização (STAGING)

## Base e segurança

Derivada da cópia V4.7 corrigida. Não houve alteração na instância de produção, no Neon nem nos buckets R2. **Não é uma versão de produção homologada.**

## Implementações

1. **Espelhamento de estampa na exportação:** o usuário pode marcar *Espelhar horizontalmente só na exportação*. O controle inicia desligado, aplica a inversão apenas ao canvas do arquivo PNG/JPEG/WebP, não altera o documento nem a prévia e inclui o sufixo `-espelhado` no nome do arquivo. Há aviso contra espelhamento duplo se a impressora ou o software já fizer a inversão.
2. **PSD — preservar camadas ocultas:** importador RGB/8-bit raw/RLE/ZIP agora preserva camadas raster ocultas, que podem ser exibidas na aba Camadas. Os arquivos são processados localmente e não são enviados ao servidor. Guarda de 45 milhões de pixels de camadas combinadas antes da descompressão. Não reconstrói texto, efeitos, máscaras vetoriais ou objetos inteligentes do Photoshop.
3. **PDF multipágina:** número de páginas lido antes da rasterização. O usuário seleciona a página primeiro; o sistema só renderiza a página escolhida. Em textos girados, a limpeza aproximada por retângulos fica desativada para evitar danos à arte subjacente. PDF escaneado e estruturas complexas não viram objetos editáveis automaticamente.

## Arquivos principais alterados

- `src/lib/creative/design.ts`
- `src/lib/creative/export-transform.ts` (novo)
- `src/lib/creative/psd-import.ts`
- `src/lib/creative/pdf-layers.ts`
- `src/components/creative/creative-editor.tsx`
- `src/components/creative/creative.css`
- `tests/v48-sublimation-psd-pdf.mjs` (novo)
- `tests/v48-browser.py` (novo)
- `tests/v37-feature-checks.mjs` e `tests/v42-export-integrity.mjs` (adaptação às APIs alteradas)
- `package.json` (inclui teste V4.8)

## Testes executados

- `npm run verify:creative`: 75 testes aprovados, sem falhas.
- `node scripts/verify-source.mjs`: 658 imports locais verificados, 0 ausentes.
- `python tests/v48-browser.py`: Chromium executou teste de pixels do espelhamento, importou duas camadas PSD (uma ocultada por flag) e confirmou que a camada oculta manteve seus pixels.
- Validação de integridade do ZIP após a geração.

**Limitação:** não é possível executar `prisma generate && next build` nesta sessão porque as dependências do npm não estão instaladas integralmente no ambiente. Um build `Ready` na Vercel não substitui validação funcional da exportação e das importações em desktop e celular.

## Checklist para a `clickteste`

1. Fazer deploy da V4.8 e confirmar `Ready`, sem erros TypeScript.
2. Criar uma estampa de caneca com texto e cor assimétrica; exportar com e sem espelhamento e conferir se o editor permaneceu inalterado.
3. Confirmar que a impressora não espelha automaticamente quando se usa a opção manual.
4. Importar PSD RGB/8-bit com uma camada oculta e mostrar/ocultar pelo painel Camadas.
5. Importar PDF com mais de uma página e texto inclinado; verificar se a escolha de página não causa duplicação e se o fundo original não foi danificado.
6. Testar em Chrome/Edge desktop e celular e conferir upload temporário no navegador.

## O que permanece pendente

Homologação integrada do MP4 e agente de IA, calibração visual da alça e cerâmica em múltiplos ângulos e compatibilidade com PSD/PDF complexos. Os limites dos formatos não podem ser resolvidos por um selo de 100%: dependem das estruturas presentes em cada arquivo.
