# CREDITS-LIBRARY — Biblioteca Criativa 2D Click & Gruda

Registro de origens existente: **03/11/2026**. Empacotamento local e ilustrações originais: **05/11/2026**. Os arquivos são utilizados exclusivamente no Editor de Artes 2D. O editor original e o Mockup Studio 3D continuam independentes.

## Fontes efetivamente integradas

| Projeto / URL | Versão fixada | Arquivos utilizados | Licença auditada | Observações |
|---|---|---|---|---|
| [Microsoft Fluent UI Emoji](https://github.com/microsoft/fluentui-emoji) | commit `1ffb34c752ecf5d402f04cfb4b392c77f57c54bc` | `assets/<nome>/3D/<nome>_3d.png` (seleção curada) | **MIT** — [LICENSE](https://github.com/microsoft/fluentui-emoji/blob/1ffb34c752ecf5d402f04cfb4b392c77f57c54bc/LICENSE), Copyright Microsoft Corporation | Stickers 3D coloridos, carregados sob demanda. Sem marcas, personagens famosos ou arquivos não liberados. |
| [Google Noto Emoji](https://github.com/googlefonts/noto-emoji) | tag **`v2.048`** | `svg/emoji_u<codepoint>.svg` (seleção curada) | **Apache-2.0** — [svg/LICENSE](https://github.com/googlefonts/noto-emoji/blob/v2.048/svg/LICENSE), Copyright 2013 Google, Inc. | **A licença dos SVGs não é a mesma das fontes** (OFL). Só imagens SVG da pasta `svg`. |
| [Tabler Icons](https://github.com/tabler/tabler-icons) | pacote npm **`@tabler/icons@3.46.0`** | `icons.json` e `icons/outline/*.svg` | **MIT** — [LICENSE](https://github.com/tabler/tabler-icons/blob/ed177a085b652fe04ec4f37ced867c94621e7840/LICENSE), Copyright 2020–2026 Paweł Kuna | 1.600 itens selecionados do índice oficial, incluídos localmente em public/creative-library. Lista pesquisável em português; pacote npm fixado em 3.46.0. |
| [Lucide Icons](https://github.com/lucide-icons/lucide) | commit `1980e3d59b0fa1a2aeb566d5902b25ee98204001` | 26 ícones `icons/*.svg` selecionados; `lucide-react@^0.525.0` já existe para a interface | **ISC** — [LICENSE](https://github.com/lucide-icons/lucide/blob/1980e3d59b0fa1a2aeb566d5902b25ee98204001/LICENSE), Lucide Icons and Contributors | Complemento curado de profissões/apoio; nenhum pacote instalado. |
| [Phosphor Icons](https://github.com/phosphor-icons/core) | commit `2b75f3ad12b420c9504ef05df8d2564a28f8500e` | 25 ícones da família `assets/regular/*.svg` | **MIT** — [LICENSE](https://github.com/phosphor-icons/core/blob/2b75f3ad12b420c9504ef05df8d2564a28f8500e/LICENSE), Copyright 2023 Phosphor Icons | Um único peso (regular), desenhos complementares e sem duplicação pelo mesmo nome no Tabler. |
| Click & Gruda (criações nativas) | pacote V1 deste projeto | 24 ilustrações kawaii originais, formas, molduras, faixas, 105 fundos/padrões, 91 frases | **Autoral** | SVGs gerados no navegador; não dependem de serviços externos. |

### Metadados de cada item

A fonte canônica está em `src/lib/creative/library-manifest.ts`. Todos os objetos produzidos por `libraryManifest()` possuem os campos `id`, `nome`, `tags`, `categoria`, `arquivo`, `formato`, `tipoCor`, `licenca`, `origem` e `aba`. `curatedFromTabler()` compõe somente entradas **existentes no índice oficial** versionado e não cria caminhos de ícones por tentativa.

A seleção atual contém **481 itens estáticos** e **1.600 vetores Tabler**, totalizando **2.081 opções**. Foram incluídos **1.793 arquivos locais** (1.717 SVGs e 76 PNGs), o índice e os textos integrais das licenças em `public/creative-library/`. As outras 288 opções são ilustrações, formas, fundos e textos produzidos pelo código do editor.

A Biblioteca Criativa usa primeiro o índice local e arquivos locais; não precisa consultar CDNs para esses itens. Os SVGs locais passam pelo mesmo sanitizador usado nos remotos. O mapa `src/lib/creative/bundled-library.json` registra os arquivos efetivamente incluídos. Se o índice local não puder ser servido, permanece a recuperação do índice remoto versionado e, por fim, da lista básica. Outros painéis legados e integrações do aplicativo podem continuar dependendo da rede.

Os **24 desenhos kawaii** são composições originais em `library-kawaii.ts` (café, nuvem, estrela, lua, flor, cacto, gato, cachorro, urso, coelho, donut, morango, abacate, cogumelo, abelha, borboleta, foguete, presente, livro, coração, arco-íris, planeta, balão e sorvete). Não usam código, personagens ou arquivos de BlazorKawaii ou de sites de stickers. A cor principal é ajustável antes de inserir; o SVG é incorporado ao projeto.

Para reproduzir os arquivos, use o pacote oficial `@tabler/icons@3.46.0` extraído e execute `scripts/bundle-creative-library.mjs`, conforme os comandos no próprio script. Os arquivos complementares são baixados das revisões registradas acima via HTTPS. O script não muda dependências nem o lockfile do aplicativo. Os testes verificam a existência e assinatura dos arquivos locais e a presença das licenças.

## Repositórios examinados, mas não incorporados neste lote

- **Simple Icons** — CC0 1.0, [LICENSE](https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md): não incorporado porque esta biblioteca não implementa QR Code e não deve comercializar marcas; ícones de redes já existentes não foram modificados.
- **Google Fonts** — OFL/Apache dependendo da família: nenhum arquivo de fonte novo foi instalado/distribuído; usa-se a tipografia que o editor já possui.
- **pixijs/filters** — MIT: analisado como referência, nenhuma dependência de filtros adicionada.
- **una/CSSgram** — MIT: analisado como referência, nenhum CSS de terceiros copiado.
- **Remix Icon** — **EXCLUÍDO**. A licença atual no repositório não é a Apache-2.0 especificada no escopo fechado; desde janeiro de 2026 é Remix Icon License v1.0. Não foram copiados arquivos nem códigos desse pacote.
- **Game Icons, Twemoji, OpenMoji, unDraw redistribuída** — não utilizados.

## Segurança

O carregador `src/lib/creative/library-load.ts` usa uma lista explícita de origens/versões e filtra SVGs externos com `DOMParser`, reconstruindo um documento novo com elementos e atributos permitidos. Elimina eventos (`onload`, `onclick`), scripts, `foreignObject`, `<image>`, `<use>`, links externos e estilos ativos. Proíbe URLs fora de `url(#id)` e limita o tamanho/complexidade. Somente o SVG sanitizado se transforma em data URI para a miniatura e para o editor.

PNG do Fluent é baixado como blob e convertido em data URI para evitar contaminação de canvas por origem cruzada durante exportação. A biblioteca não altera o modelo `DesignNode`, banco, rota ou API.

## Regras de uso

Os assets são peças auxiliares de composição. Evitar redistribuição isolada como pacotes de terceiros ou sugestão de que marcas e personagens comerciais sejam conteúdo próprio. A responsabilidade sobre artes compostas pelo usuário, nomes e imagens próprias continua sujeita a seus direitos de uso. Os textos autorais são frases genéricas, sem reprodução de letras de músicas, citações não autorizadas ou material de terceiros.
