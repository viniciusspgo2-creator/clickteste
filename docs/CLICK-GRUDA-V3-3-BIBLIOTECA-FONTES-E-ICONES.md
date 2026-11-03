# Click & Gruda V3.3 — Acervo criativo para sublimação de canecas

Data: 2026-11-02 · Status: **STAGING — sem build completo do Next.js no ambiente de preparação**.

## Entrega implementada

- **27 famílias de Google Fonts** selecionadas e distribuídas em quatro estilos (Sans premium, Serif elegante, Display, Manuscrita). As fontes são baixadas **pelo navegador** a partir do serviço Google Fonts, quando suas prévias ficam visíveis ou ao selecionar. Não foram incorporados arquivos de fonte binários ao ZIP.
- **Fontes do painel Admin**: seção separada, filtros por nome e status de acentuação. Ordena primeiro arquivos auditados como PT-BR completos, depois parciais, sem acento e não verificados. Seleção de fonte com prévia; upload Admin exige confirmação explícita de direitos de redistribuição.
- **RAR do usuário**: a planilha `FONTES_RAR_AUDITORIA_COMPLETA.csv` contém o resultado por arquivo e `FONTES_RAR_RESUMO_FAMILIAS.csv` por família. Foram encontrados 167 ZIPs aninhados, 1.656 arquivos de fonte e 397 identificadores de família (incluindo alguns registros de família vazia). Cobertura completa em 388 famílias, mista em 3, parcial em 3, sem acentos em 3. 391 famílias possuem pelo menos uma variante com suporte completo. A fonte pode possuir os caracteres e ainda ter licença comercial insuficiente; todas as 397 famílias foram marcadas como **LICENÇA PENDENTE DE VERIFICAÇÃO**. **Nenhum binário do RAR foi publicado.**
- **Ícones SVG Tabler**: seleção inicial organizada por presentes, datas especiais, natureza, esportes, negócios e formas. Os SVGs são solicitados ao CDN jsDelivr por versão fixa e só são integrados na composição depois de validação e conversão em data URI local. O Editor requer conexão para baixar um ícone Tabler ainda não carregado. Este catálogo é aberto para expansão; não contém o pacote inteiro com milhares de ícones.
- **Objetos ornamentais**: 19 desenhos vetoriais originais programáticos (flores, selo, fitas, Natal, cartoon, naturezas e afins) com aplicação de cor editável, dimensões, rotação, sombras, filtros e opacidade.
- **Efeitos rápidos**: sete presets, incluindo foto nítida, vibrante, vintage, preto e branco, sombra premium, sombra intensa e reset, aplicados ao elemento selecionado.
- **Importações locais**: JPG/JPEG/JFIF/JFI/JIF, PNG, SVG restrito, WebP, BMP, GIF (primeiro quadro), AVIF (se suportado pelo navegador). PDF continua importando a primeira página rasterizada. O binário permanece no navegador; SVGs são validados e convertidos localmente para PNG por segurança, não viram paths editáveis. **PSD com camadas, HEIC, TIFF e Lottie não são importados nesta entrega.**
- **Interface Admin**: confirmação obrigatória de direitos na publicação de fontes e sinalização do suporte a acentos nas listagens.

## Fontes, licenças e uso

| Recurso | URL oficial | Licença | Aplicação |
|---|---|---|---|
| Google Fonts | https://fonts.google.com/ | SIL OFL 1.1 para famílias recentes; verificar a licença individual no repositório | Tipografia web carregada sob demanda |
| Google Fonts GitHub | https://github.com/google/fonts | Licenças inclusas por família (principalmente SIL OFL) | Referência de nome, família, licença e scripts |
| Tabler Icons | https://github.com/tabler/tabler-icons | MIT | Seleção de ícones SVG carregados via jsDelivr (`@tabler/icons@3.46.0`) |
| Lucide | https://github.com/lucide-icons/lucide | ISC (parte derivada do Feather, com avisos próprios) | Ícones da interface do projeto existente |
| Ornamentos próprios | `src/lib/creative/stock-objects.ts` | Código produzido para este projeto | Biblioteca interna de objetos |

**Atribuição:** mantenha os avisos MIT/ISC/OFL aplicáveis na distribuição das bibliotecas. Modelos, marcas e personagens protegidos podem depender de permissões adicionais.

## Sites mencionados pelo proprietário

- **Designer Brasil** (https://designerbrasil.com.br/): referência para descobrir categorias e fontes. Verificar os direitos **de cada arquivo** antes de republicar em serviço online.
- **IconPacks.net** (https://www.iconpacks.net/): permite uso em projetos comerciais, mas a página de termos **proíbe redistribuir os ícones para terceiros e criar produto/serviço semelhante ou concorrente** (https://www.iconpacks.net/terms/). **Nenhum ícone deste site foi copiado ou incorporado.**

## Arquivos principais alterados

- `src/components/creative/creative-editor.tsx`
- `src/components/creative/font-library.tsx`
- `src/components/creative/stock-library.tsx`
- `src/components/creative/creative.css`
- `src/lib/creative/typefaces.ts`
- `src/lib/creative/stock-icons.ts`
- `src/lib/creative/stock-objects.ts`
- `src/lib/creative/user-uploads.ts`
- `src/lib/creative/design.ts`
- `src/lib/creative/font-coverage.ts`
- `src/app/api/admin/creative-assets/route.ts`
- `src/components/admin/creative-assets-panel.tsx`
- `src/components/admin/creative-assets.css`

## Deploy e segurança

1. Implantar **somente no projeto V3 de teste**, nunca sobre a versão original sem validação.
2. Manter `DATABASE_URL` apontando exclusivamente ao Neon de teste. Nenhuma alteração de schema foi necessária nesta fase; não executar `prisma db push` automaticamente em todo build.
3. Os recursos administrativos continuam exigindo bucket R2; uploads pessoais e os ornamentos embutidos funcionam no navegador sem R2.
4. Rodar `npm ci --no-audit --no-fund`, `npx prisma generate`, `npx tsc --noEmit` e `npm run build` no projeto de staging antes de homologar. **O build Next.js completo não foi executado neste ambiente.**
5. Testar cadastro de fonte TTF/OTF com licença liberada, sua acentuação, prévia e exportação; testar SVG sem scripts, JFIF/JPG, PNG, WebP, GIF, filtros, exportação 300 DPI e transição de template que mantém a caneca.
6. Google Fonts e Tabler via CDN dependem de rede e permissões de acesso do cliente; manter as fontes em cache do navegador ou futuramente hospedar apenas as famílias e pesos autorizados no R2, com avisos de licença.

## Limitações conhecidas

- Apenas curadoria inicial de 27 famílias e uma seleção inicial Tabler — ainda não são milhares de arquivos incluídos.
- Google Fonts e ícones do CDN dependem da disponibilidade externa no navegador.
- `WOFF2` cadastrado no Admin fica com acentos **não verificados** até termos um decodificador confiável; TTF/OTF/WOFF têm inspeção de cmap.
- SVG importado é rasterizado localmente: pode mover, girar, redimensionar e filtrar, mas não editar paths individualmente.
- Não inclui pacotes comerciais do RAR; verificação de licença e compra para redistribuição são responsabilidade de quem administra o catálogo.
