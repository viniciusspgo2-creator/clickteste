# Editor: canvas estável, entrada e biblioteca — 05/11/2026

Ao selecionar um objeto, a barra contextual alterava a altura disponível. O ajuste automático usava as dimensões afetadas pelas barras de rolagem e podia recalcular o zoom repetidamente. A barra agora ocupa uma altura constante, mensagens aparecem no rodapé existente e o ajuste considera padding, bordas e espaço da régua. O zoom inicial ocupa a área disponível; selecionar, remover seleção e fechar mensagens preservam o enquadramento. Zoom manual permanece manual até clicar na porcentagem para ajustar à tela. A barra da conta e o editor compartilham a altura da janela em desktop.

## Entrada

`/editor-artes` abre **Comece por aqui**, com um banner vazio, três cards vazios e botão destacado **Entrar no editor**. O editor fica em `/editor-artes/editor`. Parâmetros de modelo, acervo e transferência do mockup são preservados. As duas páginas mantêm a verificação de acesso existente. O botão não pré-carrega o editor pesado. Para inserir os banners depois, editar `src/components/creative/editor-welcome.tsx`.

## Arquivos e organização

317 novos itens: **76 SVGs editáveis e 241 WebPs**. Total de **649 elementos enviados** na biblioteca. Os arquivos completos e suas miniaturas somam 40.217.858 bytes (38,35 MiB), contra 286.006.584 bytes dos SVGs de origem processados (redução de aproximadamente 86%). Prévia de até 192 px; WebP de até 2048 px, qualidade 94 e transparência preservada quando presente. SVGs compatíveis pequenos são preservados; SVGs muito complexos, incompatíveis com os limites do editor ou com economia superior a 50% em WebP são convertidos. As mesmas regras de sanitização continuam valendo para a inserção de vetores.

Os 43 PNGs alternativos presentes nos ZIPs não viram itens duplicados. A prancha `baby-shower.svg` fica de fora porque seus 15 elementos separados foram incluídos. Os ZIPs `38-pngs-transparentes.zip` e `209-pngs-transparentes.zip` excedem o limite de download de 32 MiB desta sessão; foram usados os respectivos conjuntos SVG. Origem e nomes constam no CSV ao lado deste documento. Não houve inferência de licença aberta para arquivos enviados pelo usuário.

A biblioteca abre com coleções; a busca cruza todas elas. Ocasião, formato e cor ficam em filtros recolhíveis. Favoritos, recentes e IDs dos 332 elementos anteriores são preservados. Papéis entram em **Fundos**, separados de stickers.

### Novos itens por coleção

- Animais e fofuras: 26
- Bonequinhos divertidos: 14
- Café e frases: 4
- Chá de bebê: 15
- Cinema e séries: 4
- Cowgirls: 3
- Céu e espaço: 4
- Doces e alimentos: 8
- Dragon Ball: 23
- Expressões e emoções: 20
- Flores e natureza: 20
- Frases e humor: 4
- Halloween: 15
- Harry Potter: 15
- Hello Kitty: 8
- Heróis e quadrinhos: 7
- Meninas e personagens: 20
- Michael Jackson: 6
- Natal · Grinch: 12
- Natal · ilustrações: 58
- Objetos e ilustrações: 6
- Papéis e texturas: 6
- Snoopy: 8
- Stitch e Angel: 11

## Verificação

- `npm run verify:creative`.
- TypeScript sem erros; ESLint sem erros ou avisos nos arquivos alterados.
- Build Next.js com Webpack concluído.
- `tests/uploaded-library.mjs`: catálogo completo, formatos, dimensões, miniaturas e transparência dos arquivos anteriores.
- `tests/new-collections-browser.mjs`: todos os 317 novos arquivos decodificam; 76 SVGs passam novamente no sanitizador; navegação por coleção usa miniaturas, e inserção carrega SVG/WebP completos; busca e backup funcionam.
- `tests/canvas-stability-browser.mjs`: seleção, avisos temporários, zoom manual, painéis e ajuste à tela sem oscilação em desktop, incluindo 1920 × 900 e 1440 × 700.
- `tests/editor-entry-browser.mjs`: cards vazios, botão visível em desktop e celular, parâmetros preservados e entrada no editor com a verificação de acesso.
- Regressões de réguas, SVG desagrupado, edição, caminhos e exportação PNG/PDF.
