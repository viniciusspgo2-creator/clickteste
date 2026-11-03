# Click & Gruda V3.8 — estabilização e correções do build

**Destino:** exclusivamente a instalação de testes (`clickteste`). Nenhum banco ou deployment foi alterado por esta entrega.

## Erros de build corrigidos

1. `src/lib/creative/pdf-layers.ts` — removeu `isEvalSupported` do objeto `getDocument`, por não existir em `DocumentInitParameters` na versão efetivamente usada na Vercel (TS2353). A lógica de seleção de páginas e extração de textos foi preservada.
2. `src/lib/creative/video-templates.ts` — extrai e valida `supported.config` antes de passá-la para `VideoEncoder.configure` (TS2769). O erro do TypeScript não foi contornado com `any` ou `ts-ignore`.

## Ajustes funcionais adicionais

- `src/lib/creative/handoff.ts`: a transferência Studio → Editor não apaga o arquivo ao ser lido; expira após 24 horas e continua restrita ao IndexedDB local.
- `src/components/creative/creative-editor.tsx`: o handoff só é importado quando existe `?from=mockup`, e esse parâmetro é removido após a importação. Isso evita sobrescrever o rascunho em visitas normais. Elementos bloqueados não podem ser movidos, girados nem redimensionados pelo mouse. Projetos carregados (arquivo ou histórico do navegador) passam por validação.
- `src/lib/creative/validate-project.ts`: módulo novo que verifica documentos `.cgdesign` antes da importação/restauração: dimensões, lista de elementos, geometria, texto, opacidade, keyframes, vídeo, máscara e origem de imagens. Recusa URL `javascript:` e formatos de imagem perigosos.
- `src/lib/creative/browser-projects.ts`: mantém o `createdAt` ao sobrescrever um projeto; valida o conteúdo antes de salvar. O armazenamento continua local ao navegador.
- `scripts/verify-source.mjs`: executado antes do build, verifica sintaxe e existência de imports internos no diretório `src`, reduzindo a chance de novos erros `module not found` na Vercel.
- `tests/v38-stability.mjs`: testes de regressão para os erros de TypeScript e funcionalidades acima.

## Testes efetivamente realizados

- `node scripts/verify-source.mjs`: **253 arquivos**, **647 imports locais**, **0 caminhos ausentes**.
- `node --test tests/v36-feature-checks.mjs tests/v37-feature-checks.mjs tests/v38-stability.mjs tests/creative-structure.mjs tests/v35-editor-and-fonts.mjs`: **26 testes aprovados** no conjunto de regressões.
- Verificação de sintaxe TypeScript/TSX e testes isolados para validação de documentos.

**Não homologado:** `npm run build`, `tsc --noEmit` com todas as dependências e teste end-to-end da aplicação. Neste ambiente, o npm não conseguiu acessar o registro (`EAI_AGAIN`), portanto não havia `node_modules` disponível. O sucesso dos testes estáticos **não garante** que o deploy da Vercel passe sem novos erros.

## Implantação segura

1. Faça backup do repositório da **V3 de testes** e preserve a instalação publicada anterior.
2. Extraia o diretório `clicktools-main` do ZIP; atualize o repositório de testes com o conteúdo, incluindo `src/lib/creative/validate-project.ts`, `scripts/verify-source.mjs` e `tests/v38-stability.mjs`.
3. Não modifique `DATABASE_URL` nem execute `prisma db push` para esta atualização. O `vercel.json` mantém `npm run build`.
4. Confirme o próximo build Vercel. Depois teste: importar PDF, exportação MP4, enviar mockup para o Editor e reabrir um projeto `.cgdesign`.
5. Não promova a produção enquanto o build e os fluxos do navegador não estiverem aprovados.

## Alterações não realizadas

Esta rodada prioriza estabilidade, sem alterações no esquema Prisma, geometria da caneca, suporte a novos formatos de PSD, serviços de IA ou processamento de uploads no servidor.
