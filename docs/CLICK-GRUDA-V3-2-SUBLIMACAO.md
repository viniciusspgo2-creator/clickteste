# Click & Gruda V3.2 — atualização dedicada a SUBLIMAÇÃO DE CANECAS

Esta versão foi produzida sobre a cópia de staging da V3. Não substitui nem migra a versão original por conta própria. Todos os dados de clientes (uploads para criar e editar artes) permanecem no navegador; o catálogo administrativo continua usando Neon/R2.

## Entregas implementadas neste pacote

- Editor com documento inicial **21 × 9,5 cm**, 2480 × 1122 px (base de 300 DPI) para estampa horizontal envolvente; opção de área central 19 × 8,5 cm (2244 × 1004 px). Os formatos para divulgação (Instagram, quadrado, Story) continuam opcionais.
- Guia visual de área visível para a estampa 21 × 9,5 cm (não sai na exportação). O encaixe exato depende do fabricante da caneca, da prensa e da técnica de impressão.
- PNG de estampa exportado em escala de 100% inclui metadados **300 DPI** (`pHYs`), preservando a contagem original dos pixels.
- Redimensionamento real pelas **quatro alças** de seleção com preservação de proporção para imagens, inclusive giradas. Dimensões numéricas preservam proporção de imagens.
- Alternância dos quatro templates internos sem perder o mockup enviado do Studio nem objetos/textos próprios; fundo administrativo também passa a ser substituído, não empilhado indefinidamente.
- **12 fundos visuais autorais e sem texto**, vetoriais e recoloridos, mais acesso a fundos carregados pelo Admin. Fundos de estampas e templates de apresentação ficam em abas diferentes.
- Recorte não destrutivo (margens esquerda/direita/superior/inferior), flip horizontal/vertical, opacidade, rotação, sombras com X/Y/cor, filtros de brilho/contraste/saturação/cinza/sépia/matiz/desfoque e inclinação visual.
- Texto com curvatura, ondulação, contorno, profundidade 3D aproximada, espaçamento de letras, sombra, estilos, fontes cadastradas e edição direta.
- Nova aba Personagens filtrada por `kind=element` + `category=Personagens` do Admin, sem mascotes/logotipos pré-carregados. O usuário continua podendo importar seus próprios arquivos localmente.
- Admin com fontes e textos maiores nas telas principais, sugestões de categorias e opção de cadastrar recursos do acervo para canecas.
- Assistente **contextual local** acessível no Editor, galeria e Studio 3D, com orientações por assunto e abertura de ferramentas disponíveis somente após confirmação. Não é um agente LLM autônomo, não faz alterações silenciosas e não navega sozinho por toda a aplicação.
- Studio Mockup 3D com acabamento rápido visível (incluindo **Fosco / Opaco**), atalho para Guia contextual e preset **Foto Elite** de sombra na mesa. Preservadas as funções existentes (poses, mão livre, Bocão, exportação etc.).

## Limitações conhecidas e trabalhos NÃO entregues

- Geometria 3D não foi reconstruída a partir de digitalização física da caneca da fotografia; a alça de referência anterior continua sendo uma aproximação. Para reprodução exata seriam necessárias vistas adicionais/medições.
- Realismo foto-real de interação mão/caneca, sombras fisicamente calibradas para cada cenário, máscara de profundidade automática e substituição de canecas em fotos ainda exigem desenvolvimento específico.
- Importação PDF é rasterizada (primeira página), sem desmontar todas as camadas; importação editável PSD ainda não implementada. MP4 e Lottie podem ser cadastrados como acervo, mas não editados/exportados como vídeo no Editor 2D.
- Não foram fornecidas nem incorporadas milhares de imagens, personagens de filmes ou fontes comerciais. O Admin aceita catálogos em lotes de até 30 arquivos de até 4 MB por arquivo; formatos são validados na API. A categoria de personagens deve conter itens com autorização de uso comercial/redistribuição, não cópias arbitrárias de personagens protegidos.
- O Assistente é uma base de orientação contextual e comandos limitados. Um agente generativo profundo de conhecimento do sistema precisaria de avaliação de permissões, pesquisa estruturada do código e conexão configurada a um modelo, com aprovação de ações.
- Não foi possível executar `npm ci` nem o build completo neste ambiente devido à indisponibilidade de pacote npm no cache (`zwitch@2.0.4`). **Ainda requer teste em deploy de staging**.

## Arquivos principais alterados ou criados

- `src/components/creative/creative-editor.tsx`
- `src/components/creative/creative.css`
- `src/components/creative/studio-concierge.tsx` (novo)
- `src/components/creative/template-gallery.tsx`
- `src/lib/creative/design.ts`
- `src/lib/creative/geometry.ts` (novo)
- `src/lib/creative/backgrounds.ts` (novo)
- `src/components/admin/admin.css`
- `src/components/admin/creative-assets.css`
- `src/components/admin/creative-assets-panel.tsx`
- `src/components/tools/mockup/ui/workspace.tsx`
- `src/components/tools/mockup/ui/workspace.css`
- `src/components/tools/mockup/ui/guide-panel.tsx`
- `src/components/tools/mockup/ui/shadow-presets.tsx`
- `src/components/tools/mockup/lib/ceramic-finishes.ts`
- `tests/mug-creative-upgrade.mjs` (novo)
- `public/creative-brand/` (retirado desta cópia por não ter mais uso no Editor; imagens originais do site em outras pastas foram preservadas)

## Como validar antes de publicar

1. Use exclusivamente o repositório de **testes** e a **Vercel de testes**. Garanta que DATABASE_URL aponta ao Neon de staging e que nenhum R2 de produção está configurado por engano.
2. O `vercel.json` está com `npm run build` — a etapa excepcional `prisma db push` do deploy anterior NÃO é mantida. Execute migrações apenas com backup e análise de schema, nunca rode `prisma migrate reset` em base com dados.
3. Depois do `npm ci`, execute `node --test tests/mug-creative-upgrade.mjs`, `npx tsc --noEmit` e `npm run build`.
4. Entre no Editor, importe PNG, arraste cada uma das 4 alças para reduzir e aumentar, faça recortes, use Ctrl+Z/Shift+Ctrl+Z, exporte PNG da estampa.
5. No Studio 3D, envie uma caneca ao Editor, aplique Elite, Natal, Editorial; verifique se a caneca não desaparece. Troque fundos, edite textos, salve e recarregue projeto.
6. No Admin, publique um SVG ou PNG como **Elemento / Personagens** e um fundo como **Fundo / Estampas de canecas**. Reabra o Editor e teste as duas abas.
7. No Studio 3D, verifique Fosco/Opaco, demais acabamentos, sombra Foto Elite e demais modos existentes.
8. Teste desktop e mobile em navegadores diferentes antes de considerar a atualização homologada.

## Privacidade

No Editor, imagens enviadas por clientes são mantidas em memória do navegador e em arquivos locais que o próprio usuário salva. O handoff vindo do Studio usa IndexedDB. Materiais publicados pelo administrador seguem para o Cloudflare R2 configurado pela plataforma. Evite carregar dados sensíveis em elementos públicos do Admin.

## Licenças

Não foram adicionadas novas bibliotecas externas neste incremento. Novos fundos foram definidos em SVG diretamente no código. Continuam aplicáveis as licenças e créditos do projeto-base em `docs/CLICK-GRUDA-V3-ARQUITETURA.md`.
