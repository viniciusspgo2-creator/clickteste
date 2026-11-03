# Click & Gruda — Editor 2D V6 (correção de deploy + experiência de sublimação)

Data: 03/11/2026. Base de atualização: ZIP Biblioteca Robusta V5 entregue anteriormente. **Nenhuma publicação no GitHub/Vercel foi feita.**

## Erro de TypeScript que impedia o deploy

- Arquivo: `src/components/creative/creative-editor.tsx`.
- Trecho original: `imageFor(node.src)` na função `cropImage` causava `TS2345: string | undefined não pode ser atribuído a string`.
- Correção: o `src` é guardado em `source` imediatamente após a validação da imagem selecionada. `imageFor(source)` recebe `string` validada.
- Comportamento de recorte, desfazer e camadas preservado.

## Experiência visual e enquadramento implementados

- Fluxo principal sempre visível com quatro passos: Modelo ou fundo → Foto e texto → Ajustar → Conferir e exportar.
- Canvas inicial e novos modelos em 2480 × 1122 px; formato principal identificado como 21 × 9,5 cm, 300 DPI; guia existente de 19 × 8,5 cm preservada.
- 10 modelos editáveis por ocasião, incluindo aniversários, mães, profissões, gospel, infantil e casal. IDs de quatro modelos antigos preservados; artes de projetos existentes não são regravadas.
- Botão "Enquadrar 21 × 9,5" no palco e no painel Fundos, com restauração do fundo existente por cobertura centralizada sem esticar, enviado para trás e com outras camadas preservadas.
- Ao aplicar fundo com proporção diferente, escolha explícita: Preencher (corte central), Caber inteiro (com possíveis margens) ou Manter original (sem ampliar). Aviso se a imagem tem menos pixels que a tela de impressão. O fundo só substitui o anterior após a escolha.
- Botão "Importar meu fundo" usa o mesmo caminho já existente de aplicar fundos. O usuário pode continuar importando imagens como elementos via Uploads.
- Formatos para outras finalidades preservados, agora atrás de "Outros formatos"; não há exclusão de funcionalidade.
- Propriedades avançadas de texto, filtros, sombras e ordem de camadas inicialmente recolhidas; botões rápidos de Foto mais viva, Vintage e Texto com contorno usam propriedades existentes.
- Estado vazio das propriedades oferece atalhos para escolher modelo, adicionar foto ou texto.
- Nome editável da arte, usado em projeto salvo localmente, arquivo CGDESIGN e nome do arquivo exportado; duplicação de projeto no Histórico local, sem alterar banco ou APIs.
- A verificação anterior de pré-impressão foi ampliada para avisar sobre imagens fora da área visível e elementos cortados na borda.

## Arquivos alterados na V6 em relação à V5

1. `src/components/creative/creative-editor.tsx` (correção TS e interface)
2. `src/components/creative/creative.css` (visuais isolados em `.cg-creative`)
3. `src/lib/creative/presets.ts` (modelos no formato para caneca)
4. `src/lib/creative/print-check.ts` (avisos de pré-impressão)
5. `src/lib/creative/background-fit.ts` (NOVO: geometria de encaixe proporcional)
6. `tests/v6-print-workflow.mjs` (NOVO: testes de fluxo, encaixe e regressão)
7. Este relatório.

Não foram modificados Studio Mockup 3D, Home, checkout, login, Prisma, banco de dados, APIs ou sistemas de acesso.

## Validação realizada

- Verificação de imports locais: **279 arquivos / 688 imports / 0 problemas** (verificação do próprio projeto).
- Testes automatizados existentes e novos: **230 aprovados, 0 falhas**.
- Sintaxe TSX/TS dos arquivos alterados: sem erros de parsing pelo compilador TypeScript global.
- Função de enquadramento: teste real de cobertura, contenção, dimensões originais, centralização e tolerância de proporção.

### Limitação relevante antes do deploy

**O build do Next.js NÃO pôde ser executado integralmente neste ambiente**, porque não há `node_modules` e o registro npm não respondeu (`EAI_AGAIN`). Os testes e a compilação sintática não substituem `npm run build` com todas as dependências. É necessário executar um deploy de pré-visualização na Vercel e confirmar a passagem por TypeScript antes de publicar em produção.

### Observações sobre escopo

- O requisito de 8 alças funcionais e mudança de ferramentas de manipulação não foi implementado porque exigiria alterar o sistema de gestos, expressamente protegido na especificação. Permanecem as quatro alças existentes e a alça de rotação.
- A galeria de modelos existente também lê `builtInPresets`; seus cartões passam a listar os modelos novos, mas `template-gallery.tsx` não foi alterado. A prévia dessa galeria deve ser conferida em homologação.
- Modelos novos são objetos editáveis vetoriais e textos; posicionamento e fotos pessoais precisam ser ajustados pelo usuário. Nem todo projeto antigo é convertido automaticamente para formato de caneca (preservação dos dados do cliente).
- Exportação em 300 DPI aplica-se ao formato de impressão e à escala 100%. Escalas e formatos alternativos anteriores continuam disponíveis e têm medidas de saída próprias.
