# Click & Gruda V3.5 — Atualização de fontes, editor, idiomas e alça

## Escopo realizado nesta cópia de staging

### Editor de Artes (canecas)

- Arrastar os quatro cantos de um texto agora preserva a proporção da caixa e **dimensiona também os pixels da fonte**, evitando texto achatado.
- O desenho do texto não utiliza mais `CanvasRenderingContext2D.fillText(..., maxWidth)` para comprimir os glifos horizontalmente; quando o texto não cabe, o tamanho da fonte é reduzido proporcionalmente.
- Ajustes de largura/altura via números também atualizam o tamanho da fonte proporcionalmente.
- O histórico de **desfazer/refazer não tem corte arbitrário de 70 passos**. Ctrl+Z, Ctrl+Y e Ctrl+Shift+Z. O histórico permanece somente em memória durante a sessão de edição, e pode ser limitado ou perdido pela memória disponível, fechamento ou atualização do navegador. Não prometer infinito físico.
- O reset de projeto com confirmação da V3.4 foi preservado.

### Fontes do RAR do proprietário

- Catalogação anterior permanece em `docs/FONTES_RAR_AUDITORIA_COMPLETA.csv` e `docs/FONTES_RAR_RESUMO_FAMILIAS.csv`.
- A inspeção encontrou arquivos README que descrevem produtos **comprados** e não demonstram uma licença para redistribuição em uma plataforma multiusuário. Uso comercial de uma peça gráfica não implica redistribuição de arquivos-fontes para clientes.
- **Nenhum binário de fonte do RAR foi incluído/publicado na pasta pública.** Isso protege o produto de violação de licença. As Google Fonts abertas continuam disponíveis normalmente.
- Nova importação de fontes pessoais no Editor aceita TTF, OTF, WOFF, WOFF2 e ZIP, carregados apenas na aba do navegador, sem chamada ao servidor, e apresenta detecção PT-BR em TTF/OTF e aviso de não verificado em formatos não analisáveis.
- Admin > Biblioteca Criativa > Fontes aceita selecionar um ZIP de fontes, extrai até 30 fontes por lote **localmente antes de enviar**, com limite de 4 MB por fonte, e continua exigindo a declaração explícita de licença de distribuição. Para usar o RAR original, o proprietário precisa extraí-lo primeiro e revisar os direitos de cada família. Não publica automaticamente o RAR inteiro.
- Fontes pessoais carregadas em um navegador **não são distribuídas** aos visitantes e precisam ser reimportadas após recarregamento.

### Alça 3D

- Perfil `livesub` remodelado para um D alongado, com espessura de tubo reduzida e raízes mais suaves, inspirado na foto enviada.
- Novo projeto usa a alça `livesub` como padrão. Projetos salvos anteriormente e seus modelos escolhidos não são migrados automaticamente.
- **Não é cópia exata garantida**: só existe uma foto frontal, sem escala calibrada, vistas lateral e superior, ou medidas próprias da alça. Teste visual em Three.js é obrigatório antes de homologação.

### Idiomas

- Seletor de primeiro acesso Português / English / Español continua obrigatório para visitantes sem preferência local.
- Catálogo de traduções foi ampliado para aproximadamente 130 novas entradas, além do vocabulário já existente.
- Integradas várias legendas dos módulos Editor e Templates e barra lateral/algumas propriedades do Studio 3D, incluindo o painel de alças.
- **A tradução integral de todos os textos do sistema ainda NÃO foi concluída**: páginas institucionais, textos mais antigos, erros dinâmicos, parte do Admin e guias longos ainda exigem revisão e localização específica. Evitar afirmar “100% traduzido”.
- Não traduzir nomes de arquivos enviados, textos digitados nas estampas, desenhos, nomes próprios ou acervo do Admin automaticamente.

## Como testar

1. Implantar em **clickteste**, sem tocar na conta de produção original.
2. Criar um texto e arrastar o canto em várias direções: as letras não devem ficar estreitas ou esticadas. Exportar o resultado e comparar com a prévia.
3. Executar mais de 80 alterações, usar Ctrl+Z até o início e Ctrl+Y até o final.
4. Abrir Texto > Fontes, importar TTF/OTF de forma local. Testar rótulos de acentuação, seleção e exportação; confirmar que nenhum upload da fonte é feito na aba Network.
5. Em Admin > Fontes, preparar um ZIP de fontes para revisão. Confirmar que não publica sem concordar explicitamente com o licenciamento.
6. Criar projeto novo e escolher perfil `Referência 325 ml`; girar 360° e verificar o encaixe da alça sem falhas de normais e costuras.
7. Em navegador novo, selecionar cada idioma e percorrer as três ferramentas. Registrar textos que ainda aparecem em português para próximo lote de localização.

## Validação e restrições

- Testes independentes em `tests/v35-editor-and-fonts.mjs` verificam sintaxe, classificador de acentos, ausência de limite 70, escala de texto e alterações de geometria.
- **Não foi possível executar `npm ci` ou o build completo no ambiente de preparação** (sem resolução de DNS de registry.npmjs.org). TSX foi analisado sintaticamente; o build da Vercel e testes gráficos finais são obrigatórios.
- Banco de dados e Prisma schema: **sem migração nesta rodada**.
- O `vercel.json` mantém `npm run build` padrão, sem executar `prisma db push` em deploy.
