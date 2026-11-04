# Studio Click — Editor 2D / Referência V11

Esta versão aproxima a interface do print de referência enviado pelo usuário, preservando o funcionamento da V10.

## Escopo

- `src/components/creative/creative-editor.tsx`: reorganiza a posição dos campos de nome do projeto e das abas, adiciona ícones já instalados aos quatro passos e estados visuais (seleção de modelo/sombra). Nenhum handler existente de importação, canvas, PSD, projetos ou exportação foi substituído.
- `src/components/creative/editor-reference-v11.css`: tema visual isolado por `.cg-reference-v11` para o Editor 2D (topo preto/laranja, navegação guiada, cartões com acabamento, miniaturas, canvas, sombra, sliders e responsividade).
- `public/cg-editor/v11-thumbs/*.svg`: ilustrações vetoriais originais para as prévias dos dez modelos de caneca e a identificação do projeto. Não usam material de terceiros, fontes externas ou referências de rede.

O hero novo da landing page V8, o Studio Mockup 3D, as APIs, Prisma, login, checkout e páginas administrativas permanecem como na V10.

## O que o print significa

A arte dentro do canvas no print é uma **composição de exemplo**, não parte fixa da interface. Os layouts atuais, as imagens importadas e os mockups enviados do Studio 3D continuam editáveis e controlados pelo documento do usuário.

## Validação e publicação

Executar no ambiente com dependências instaladas:

```bash
npm ci
npm run verify:creative
npm run build
```

Antes de promover a produção: testar o envio do mockup Studio 3D → Editor 2D, seleção de modelos Feed/Story sem perder o mockup, modelos de caneca, slider de sombra, troca de aba, exportação 300 DPI e apresentação em 1650 px / 1280 px / celular.

Não publicar direto em produção sem build e prova de navegação no navegador real.
