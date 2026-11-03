# Click & Gruda V4.9 — MP4 Full HD e correções de build TypeScript

## Base
Projeto V4.8, evoluído em cópia isolada. Nenhuma alteração no banco Neon, nas variáveis de produção ou no projeto original.

## Recursos desta rodada
- Seleção de exportação MP4 HD 720p (padrão) e Full HD até 1920 × 1080 (opcional).
- Opção de 24 fps (padrão) e 30 fps, com prévia da resolução calculada antes de exportar.
- A mesma seleção de fps e resolução é enviada à inspeção e ao exportador.
- Negociação H.264 conforme limite de macroblocos/segundo; 720p usa Level 3.1 ou superior e Full HD usa Level 4.0 ou superior.
- Nenhuma alteração no conteúdo de áudio: exportação continua sem áudio, até 20 segundos, processada localmente no navegador.

## Erros reais apontados pela Vercel e corrigidos
1. `TS2304 checkBeforeExport`: a função estava sendo utilizada em `src/components/creative/creative-editor.tsx` sem import de runtime. Foi adicionada ao import existente de `@/lib/creative/print-check`.
2. `TS18048 doc.video possivelmente undefined`: o campo `video` é opcional no documento. O importador/exportador agora o valida e guarda em `source`, usando esse valor não nulo para a leitura de `src`, `start`, `end` e `fit`.

## Validação realizada
- `npm run verify:creative` -> 81 testes aprovados, incluindo as regressões `tests/v49-build-type-fixes.mjs` (2 testes).
- `node scripts/verify-source.mjs` -> 261 arquivos de código e 658 imports locais sem ausência.
- Compilação TypeScript semântica isolada do módulo MP4 com `strictNullChecks` habilitado -> aprovada; os módulos externos foram representados por declarações mínimas para viabilizar o teste sem npm.
- ZIP completo compactado e inspecionado após o empacotamento.

## Limitações / homologação
O ambiente não possui as dependências npm completas; por isso NÃO foi executado com sucesso `prisma generate && next build` nem a aplicação em execução real neste ambiente. A integração de MP4 em browsers reais e o desempenho de 1080p ainda precisam de testes na `clickteste`. Os testes isolados não substituem essa homologação.

## Passos para staging
1. Atualize somente o repositório de testes com **todo** o conteúdo de `clicktools-main/`, verificando que `src/components/creative/creative-editor.tsx` e `src/lib/creative/video-templates.ts` entraram no commit.
2. Faça deploy no projeto Vercel de staging.
3. Verifique se o `npm run build` passa TypeScript; não há migração de banco nesta versão.
4. No Editor de Artes, teste MP4 de 3 a 5 segundos em 720p/24fps, depois 1080p/30fps no Chrome ou Edge atualizado.
5. Abra o MP4 gerado e verifique proporção, duração, frame inicial/final, animações, cancelamento, camadas e CPU/memória. Teste também PNG sem vídeo.
6. Caso ocorra uma falha, envie o trecho do novo log com caminho e número de linha, sem enviar segredos de ambiente.
