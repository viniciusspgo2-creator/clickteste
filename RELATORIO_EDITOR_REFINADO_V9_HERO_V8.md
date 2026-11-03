# Click & Gruda — V9 | Hero da V8 + refinamento do Editor 2D

## Base do projeto
- Base: `clickgruda-landing-hero-mascote-prensa-v8-2026-11-03.zip`.
- Objetivo: incorporar o refinamento de acabamento do Editor 2D **sem perder** a imagem e o layout novo do hero da V8.
- Escopo modificado: somente o Editor 2D, em `src/components/creative/creative-editor.tsx` e `src/components/creative/creative.css`.
- O hero da V8 foi preservado de forma idêntica, incluindo `src/components/site/studio-home.tsx`, `src/components/site/studio-home.css`, `public/cg-home/hero-mascot-studio-v8.webp` e a versão mobile.

## Mudanças feitas
1. **Painel de propriedades:** a antiga seção fechada “Ajuste fino: aparência e sombras” foi reorganizada em “Aparência” e “Sombra” separadas; “Sombra” fica aberta ao selecionar uma camada. Os handlers e valores de sombra, rotação e opacidade são exatamente os existentes.
2. **Sombra acessível:** agora os controles Sem sombra, Suave, Realista, sombra em px, cor, deslocamentos X/Y estão agrupados, com orientação curta em português.
3. **Tipografia:** padronização de família já disponível no projeto, pesos, corpo, título, rótulos, texto secundário e valores numéricos.
4. **Barra de ferramentas:** ícones 24px, rótulos legíveis, hover e estado ativo, tooltips nativos via `title`, barra de rolagem visivelmente mais larga no desktop.
5. **Cartões e controles:** bordas, cantos, espaçamentos e focos de teclado consistentes; valores numéricos editáveis de sliders existentes preservados.
6. **Canvas:** moldura e guias de impressão com refinamento de contrastes, sem alterar gestos ou renderização.
7. **Responsividade:** ajustes de coluna nas larguras 1600/1200/820/390px; em 390px removidas quebras ruins de nomes como “Elementos”, “Camadas” e “Biblioteca”.

## O que não mudou
- Hero V8 e sua nova imagem do mascote com a prensa, assim como textos HTML, botões, menu, áudio, carrossel e demais seções da landing.
- Motor do canvas, exportação e funções; rotas/APIs, Prisma, banco e Studio 3D.
- Quatro alças funcionais de redimensionamento: não foram substituídas por oito porque isso requer alterações de lógica e interação fora do escopo autorizado.
- Não foi inventado um controle independente de opacidade da sombra, já que o modelo atual não possui esse parâmetro.
- Nenhuma biblioteca nova foi instalada.

## Validação realizada
- `node scripts/verify-source.mjs`: **279 arquivos, 688 imports locais, 0 problemas**.
- `npm run verify:creative`: **217 testes, 217 aprovados, 0 falhas**.
- Transpilação sintática de `creative-editor.tsx`: **sem diagnósticos**.
- Parse CSS com `tinycss2`: **0 erros sintáticos**.
- QA estático com Chromium em larguras **1600, 1200, 820 e 390px**: sem rolagem horizontal; seção Sombra visível nas quatro larguras. **Essa QA utiliza HTML de demonstração, não o Next.js em execução.**
- Comparação binária da V8 com a V9: apenas `creative-editor.tsx` e `creative.css` alterados (fora o relatório adicional).

## Limites da validação
`npm run build` do Next.js **não foi executado** por falta de dependências instaladas no ambiente. Faça deploy de pré-visualização na Vercel e teste especialmente abertura de painéis, seleção de texto/imagem, sliders e exportação antes de promover a produção.
