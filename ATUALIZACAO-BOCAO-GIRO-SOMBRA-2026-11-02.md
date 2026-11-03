# ClickTools / Studio Mockup 3D — atualização de 2/11/2026

## Objetivo
Corrigir o chuvisco branco que aparece na arte da base (Bocão) à distância; simplificar o posicionamento de canecas; intensificar a sombra que a caneca projeta na mesa/fundo, preservando o material cerâmico e as estampas.

## Alterações
- **Arte inferior:** separação de profundidade de 0,003 cm para 0,018 cm entre base impressa e porcelana, mais `polygonOffset` aplicado **somente ao material do decalque inferior**; textura inferior com mipmapping e filtragem anisotrópica até 8x. Motivo: reduzir a disputa pelo depth buffer (z-fighting) em zoom distante.
- **Produto → Mover, girar e inclinar:** 4 poses em um toque; botões Mão livre · mover e Mão livre · girar; ao arrastar sobre a caneca, eixo Y pela horizontal e inclinação X pela vertical; **Alt** + arrastar atua no eixo Z e **Shift** faz movimentos finos. O gizmo original de 3 eixos continua disponível. Movimentação vertical pelo gizmo ou pelo controle de altura. Edição numérica de posição e ângulos para valores fora dos sliders.
- **Cenário → Sombra na mesa / cenário:** presets Suave, Natural e Marcada, força, suavidade e liga/desliga das sombras. Melhoria da máscara de sombra de chão e do receptor de sombras, sem trocar luzes/verniz/shaders do corpo.
- **Projeto:** os campos usados já existiam no Zustand e no formato de projeto. Nenhuma mudança de Prisma, IndexedDB, geometria principal, UV lateral, materiais do corpo ou lógica dos exportadores.

## Validação deste pacote
- Passou `node tests/bocao-ux-standalone.mjs` (12/12 testes).
- Passou `node tests/studio-interaction-rendering.mjs` (6/6 testes; inclui módulo real de rotação livre).
- Sintaxe dos 62 arquivos TS/TSX de `src/components/tools/mockup` compilável em `transpileModule`; as duas declarações `.d.ts` são excluídas dessa checagem de emissão.
- A integridade do ZIP e a preservação dos arquivos críticos foram verificadas.
- **Pendente:** build completo, TypeScript com dependências, ensaio visual WebGL, exportação PNG/vídeo e aceitação em aparelhos reais. O registro npm apresentou `EAI_AGAIN` neste ambiente. Isso NÃO autoriza afirmar homologação em produção.

## Como testar sem perder o trabalho
1. Faça uma cópia da pasta do repositório local. Não remova `.git` nem `.env` e não copie um projeto antigo sobre alterações locais feitas depois desta versão.
2. Preferencialmente aplique apenas os arquivos do ZIP `CLICKTOOLS_APENAS_ARQUIVOS_ALTERADOS.zip` à pasta do projeto (ou use o ZIP completo para uma cópia separada). Se usa GitHub Desktop, confirme os diffs antes de commitar.
3. Execute `npm ci`, `npm run verify:studio` (ou `npm run build:studio-safe`), **sem rodar o `npm run build` original enquanto ele chama `prisma db push`**.
4. Abra o Studio em um deploy de preview. Confira o mesmo Bocão em 25%, 50%, 100% e 200% de zoom; compare em caneca em pé, inclinada e deitada, inclusive com duas peças.
5. Teste a rotação livre, Alt, Shift, Esc, desfazer/refazer, salvar/reabrir `.cgstudio`, exportar PNG, fundo transparente e vídeo. Teste as três sombras com fundo branco, escuro e foto de mesa.
6. Só depois de passar no preview, publique em produção.

**Limitação importante:** fotografias de cenário são planos 2D; uma sombra realista pode não seguir perfeitamente a perspectiva de todas as mesas fotográficas. A posição do cenário/da caneca e a iluminação da foto também afetam a naturalidade.
