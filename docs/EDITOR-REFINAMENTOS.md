# Refinamentos do Editor de Artes — 05/11/2026

O editor mantém a estrutura de quatro áreas: navegação, acervo, canvas e propriedades. Não foram alterados o Studio 3D, autenticação, banco de dados, APIs, dependências ou lockfiles.

## Edição

- Setas: mover a seleção 1 pixel do documento; Shift: 10 px; Alt: 0,1 px. Uma tecla mantida produz uma única etapa de desfazer. Campos de formulário, conteúdo editável, modais e camadas protegidas não recebem movimento do canvas.
- Posição X/Y com confirmação no campo e seis alinhamentos à página. Bordas de objetos girados são consideradas.
- Encaixe de bordas e centros durante arraste, com linhas auxiliares e tolerância constante de seis pixels de tela. Alt suspende o encaixe, Shift restringe a um eixo. Shift durante o giro usa passos de 15°.
- Réguas em milímetros a 300 DPI ou em pixels. Réguas adaptam a graduação ao zoom. Botões para ampliar, reduzir e encaixar. Esses auxiliares não integram o documento nem o arquivo exportado.
- Painel de atalhos com foco contido, fechamento por Esc e restauração do foco.
- Formas novas cabem na página; fontes duplicadas foram removidas do seletor; os campos de texto aparecem antes dos efeitos no inspetor.

## Acervo e apresentação

2.081 opções na Biblioteca Criativa, com pesquisa em português, categorias por ocasião, filtro SVG/PNG/texto, favoritos e recentes. O índice oficial Tabler é um objeto na raiz; o carregador antigo ignorava esse formato e caía na lista reduzida. O parser aceita o formato oficial e os formatos alternativos já existentes.

1.793 arquivos foram empacotados localmente, com 24 ilustrações kawaii adicionais produzidas no navegador e os geradores existentes. Créditos, versões e licenças estão em [CREDITS-LIBRARY.md](../CREDITS-LIBRARY.md). Há um script para reproduzir o pacote. Todos os vetores externos continuam passando pelo sanitizador.

Os vetores de 24 px agora recebem dimensão de inserção legível, preservando a proporção do viewBox. Fotos enviadas pelo usuário mantêm o comportamento existente. A lista virtualizada considera a altura real do painel. Mudar de seção limpa filtros incompatíveis.

Tipografia dos controles, espaçamento, bordas, estados de foco e cards foram refinados por uma folha CSS específica do editor. As ferramentas foram aproximadas por afinidade na mesma barra lateral: bases, texto/uploads, biblioteca/elementos e camadas/efeitos.

## Validação

Comandos reproduzíveis a partir da raiz do repositório:

```bash
npm run verify:creative
node tests/creative-precision.mjs
node --test tests/v61-curated-library.mjs tests/v61-separated-layouts.mjs
# esbuild e playwright podem estar instalados fora do checkout:
STUDIO_TEST_TOOLS=/caminho/das/ferramentas node tests/creative-precision-browser.mjs
```

O teste de navegador renderiza o componente real, isolando somente hospedagem Next, autenticação e respostas do catálogo administrativo. Usa Chromium, bloqueia serviços externos e verifica movimentos, histórico, travas, encaixe, cópia entre abas, inserção de ativos, foco, PNG exportado e largura móvel. O PNG com régua ligada é comparado por SHA-256 ao PNG com régua desligada. As capturas ficam no diretório de saída indicado pelo teste.

TypeScript do componente e de suas dependências passa. O lint dos módulos novos e da biblioteca passa; o arquivo principal continua com os mesmos nove erros anteriores de regras de hooks/refs, conferidos contra o HEAD original, sem desabilitar regras. O build completo e o TypeScript global continuam bloqueados pela geração do Prisma: a política ativa de rede nega `binaries.prisma.sh`. Isso já ocorria antes desta implementação. O teste isolado não comprova autenticação, banco ou implantação.

As quatro referências fornecidas (OpenPaint, Krafto, BlazorKawaii e GetStickerPack) retornaram bloqueio de proxy HTTP 403. Não houve acesso ao funcionamento interno nem cópia de código ou de acervos desses sites. O catálogo entregue usa as origens licenciadas registradas e desenhos originais.
