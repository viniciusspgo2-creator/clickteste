# Estado final desta entrega de código

Este documento substitui qualquer interpretação de que os lotes anteriores estivessem homologados. O pacote é uma proposta **pré-deploy**, com código e verificação independente; **não é** uma certificação do site publicado.

| Área | Estado | Evidência/limite |
|---|---|---|
| Bocão: aba, atalhos, mover, escala e giro | Implementado; testes unitários independentes passaram | `tests/bocao-ux-standalone.mjs` |
| Referência frontal do Bocão | Implementado; não calibrado visualmente em todos os modelos | Verificação de estrutura do UI |
| Inspeção sem mudar pose e restauração na exportação | Implementado; teste estático passou | Necessário WebGL para aceite visual |
| Navegação simplificada e palco desktop ampliado | Implementado; sintaxe checada | Responsividade requer inspeção de dispositivos |
| Testes de visualizador final | 6/6 passaram | `tests/final-preview-view.mjs` |
| Verificação de sintaxe TypeScript/TSX | 213 arquivos sem erros de parser | Não substitui `tsc --noEmit` |
| `npm ci`, `next build`, testes Three/React/Playwright | Pendentes por infraestrutura | DNS do registry npm indisponível |
| Dados PostgreSQL, autenticação e comunicados | Pendentes | Sem acesso ao banco real |
| Deploy e aceitação visual do usuário | Pendentes | O usuário fará deploy |

Arquivos preservados byte a byte: `scene/mug.tsx`, `scene/model-geometry.ts`, `scene/ceramic-material.ts`, `exporters/frame-capture.ts`, `state/store.ts` e `prisma/schema.prisma`.

Comandos: `npm ci`, `npm run verify:studio`. Sem migração/alteração de produção. O comando normal `npm run build` do projeto original ainda faz `prisma db push`, cuidado ao usá-lo.
