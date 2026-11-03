# Click & Gruda Tools — redesign público

**Versão:** 28 de outubro de 2026

## Entrega implementada

- Home reconstruída como página de conversão para o Studio Mockup 3D e a Biblioteca Click & Gruda.
- Hero com mascote oficial fornecido, composição visual laranja/preta com a órbita fornecida, hierarquia de chamadas, botões de acesso e microinterações.
- Galeria animada com 13 artes reais fornecidas; imagens otimizadas em WebP. Não há arte fictícia na galeria.
- Seção ampla da Biblioteca: organização do acervo, variedade de temas, atualizações e acesso ao site oficial `https://www.clickgruda.com.br/`.
- Oferta principal: **Biblioteca R$ 47,90, acesso vitalício**, com Studio Mockup 3D incluso para assinantes.
- Alternativa: **Studio avulso R$ 12,90 por 24 horas**, com criação de quantos mockups o usuário desejar durante a vigência, mediante código fornecido pelo suporte.
- Plano antigo anual removido das páginas e textos de oferta, inclusive na tela de acesso, FAQ do guia e metadados padrão.
- Fluxo de códigos: **novos códigos avulsos expiram após 24 horas, por padrão**, no backend. Códigos antigos já emitidos conservam suas validades originais, para não revogar acessos inesperadamente. Planos Biblioteca preservados.
- Header, rodapé, Instagram, Facebook e WhatsApp flutuante com links recuperados do código original.
- Destaque aumentado para os cinco bônus. Página `/bonus` e telas `/bonus/[tool]` com composição aprimorada sem mudar a lógica das ferramentas.
- Responsividade, interações com teclado, motion reduzido e previews locais otimizados.
- Arquivos internos do editor 3D, canvas, cenas e exportações **não foram modificados**.

## Principais arquivos alterados

- `src/components/site/studio-home.tsx`
- `src/components/site/studio-home.css` (novo)
- `src/components/site/header.tsx`
- `src/components/site/footer.tsx`
- `src/lib/studio-links.ts`
- `src/app/bonus/page.tsx`
- `src/app/bonus/[tool]/page.tsx`
- `src/app/api/admin/codes/route.ts` (validade avulsa)
- `src/components/admin/codes-panel.tsx` (rótulos + instruções)
- `src/components/site/premium-gate.tsx` (somente texto de oferta e cor do link)
- `src/app/mockup-caneca-3d/page.tsx` (FAQ de preço)
- `src/app/llms.txt/route.ts`
- `src/lib/site-config.ts`
- `src/app/layout.tsx`
- `public/cg-home/*.webp` (16 recursos visuais)

## Verificações

- Passou a análise sintática de TypeScript/TSX dos 13 arquivos principais alterados (compilador TypeScript global, 0 erros de sintaxe).
- CSS analisado com PostCSS, sem erros de parse.
- Todos os recursos visuais locais estão presentes.
- **Build completo de Next.js/Prisma, lint e testes visuais não executados** neste ambiente, pois `npm ci` não concluiu a instalação de dependências. Não se pode garantir build sem esse teste.

## Para publicar

1. Faça backup do projeto atual e **preserve a pasta `.git`** se estiver substituindo arquivos na cópia do Git.
2. Atualize o repositório com o conteúdo deste ZIP.
3. Na Vercel, rode o deploy e verifique logs de build.
4. Confira no painel Admin Master os acessos avulsos criados a partir desta versão: validade padrão de 24 horas (a data customizada ainda pode ser preenchida manualmente).
5. Se o painel Admin Master tiver uma descrição SEO antiga salva no banco, revise-a; descrições com o preço anual antigo são neutralizadas automaticamente na leitura.
6. Confira os links oficiais de Instagram e Facebook antes de divulgar.

**Notas:** a compra e a liberação do código continuam gerenciadas via WhatsApp; este redesign não integra checkout automático. O link público do Studio continua protegendo o editor por código.
