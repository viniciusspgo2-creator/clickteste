# ClickTools — Bocão + UX: entrega revisada (02/11/2026)

## Estado da entrega

**Código atualizado no pacote, mas ainda não homologado em produção.** Este pacote é o projeto completo de teste, não um deploy. É uma revisão do pacote `CLICKTOOLS_STUDIO_BOCAO_UX_COMPLETO.zip`, que por sua vez foi gerado a partir de `TOK.zip`.

### Implementado no código do pacote

- Fluxo simplificado: **Produto → Estampa → Bocão → Cenário → Luz e sombra**. Controles de câmera, composição, efeitos e camadas permanecem em **Mais**.
- Acesso direto ao Bocão pela navegação, pelo menu de Estampa e pelo atalho do palco 3D (em desktop; no celular pela navegação lateral).
- Giro completo arrastando o círculo no mouse, caneta ou toque, com slider 0–359°, passo de ±1°, ±90°, tecla de seta e `Home`.
- Transformações de tamanho, centralização e deslocamento da arte inferior, sem interferência na arte lateral.
- Enquadramento da base a partir da posição da malha real no mundo 3D, movendo **somente a câmera**. Essa inspeção não vira a caneca nem altera o estado de orientação usado para salvar ou exportar. Quando a base está voltada para o piso, a interface pede ao usuário para deitar ou inclinar a peça antes de inspecionar; não altera a pose automaticamente.
- Painel técnico oculto por padrão, com opção de abrir ajustes finos e ampliar o palco sem excluir funções.
- Proteção contra o término tardio de upload quando o painel do Bocão é desmontado.

### Proteção de recursos existentes

Não alteramos geometria/UV, modelos, cerâmica, shader customizado, tom, luzes, renderizador de captura, estado dos projetos, Prisma, banco ou sistema de exportação. A rotação existente `baseRotation` continua aplicada à malha inferior e é compatível com valores negativos de projetos antigos. Nenhum lockfile foi modificado.

### Evidências executadas neste ambiente

`NODE_PATH=$(npm root -g) node --test tests/bocao-ux-standalone.mjs`

**9/9 testes independentes passaram**: transpile sintático, normalização 360°, mapas do cursor, continuidade perto de ±180°, transformação legada, entrada visível na navegação, uso da rotação pela malha 3D, inspeção sem mudar pose e acessibilidade básica do giro.

**Limitação real:** `npm ci` falhou porque o ambiente não resolve `registry.npmjs.org` (`EAI_AGAIN`); o npm também exibiu `Exit handler never called`. Portanto **não foram executados aqui** `next build`, `tsc --noEmit` do projeto completo, testes que dependem de React/Zustand/Three/Playwright ou WebGL real. Os testes acima não substituem essas verificações. Não houve conexão com dados/sessões reais nem publicação. Busca de projeto `clicktools` na integração de Vercel disponível não retornou projeto, e por isso não se confirmou o estado do site.

### Homologação segura antes de produção

1. Aplicar esta versão numa branch ou ambiente de preview, preservando `.env`, banco e arquivos reais.
2. No ambiente com acesso ao npm, executar `npm ci`, `npx prisma generate`, `npx tsc --noEmit` e os testes existentes, incluindo `node tests/base-art.mjs`, `node tests/ceramic-colors.mjs`, `node tests/final-preview-view.mjs` e `node docs/mockup-studio/regressions.mjs`.
3. Rodar `npx next build` num ambiente de teste com fontes acessíveis. **Não usar `npm run build` apontado para produção sem revisar**, porque o script também roda `prisma db push`.
4. No desktop e no celular: abrir o Studio, localizar a aba Bocão, carregar arte lateral, carregar arte inferior, girar arrastando, ajustar 1°/90°, reduzir a escala, mover, ver a base, trocar de caneca e voltar. Inspecionar se a boca está orientada corretamente no **3D**, não apenas no círculo 2D.
5. Salvar em IndexedDB, recarregar, baixar/reabrir `.cgstudio` e conferir a rotação em cada peça. Gerar PNG e vídeo e comparar o enquadramento da imagem final à prévia.
6. Separadamente validar comunicados reais e sessão PostgreSQL/Prisma. Isso não foi alterado neste pacote.
7. Confirmar em Vercel/GitHub o commit e deploy que receberam estas mudanças e pedir aceitação visual do proprietário antes de promover à produção.

### Ainda fora do escopo de código modificado

- Modo de exportação com **enquadramento exato** (mantido o enquadramento automático antigo).
- Preset visual de Bocão específico da referência (depende de arte/exemplo aprovado).
- Alterações de shader, reflexo ou iluminação (não necessárias para este ajuste e deliberadamente preservadas).
- Homologação real de todos os modelos, navegadores e dispositivos, sessão e banco de produção.

**Critério de finalização:** só declarar operacional após os passos de homologação acima, não apenas porque o pacote está pronto ou testes estáticos passaram.
