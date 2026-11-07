# Organização do Editor 2D — 07/11/2026

## Interface e caminhos

A interface mantém a estrutura de menu lateral, acervo, canvas e propriedades, com painéis em cinza azulado, contraste mais calmo, laranja para ações e cantos de 5 a 12 px conforme a superfície. Os estilos novos são limitados ao Editor; os popovers têm classes próprias.

- **Projeto**, no cabeçalho: salvar no navegador, baixar cópia editável .cgdesign, abrir projeto, histórico local e resetar com a confirmação existente. O menu usa Radix, com teclado, Escape e retorno de foco.
- **Exportar**: uma única entrada de destaque no cabeçalho. A confirmação e os formatos continuam no diálogo existente, incluindo vídeo quando houver mídia. O processamento e a qualidade da exportação foram preservados.
- **Adicionar à arte**: atalhos compactos para biblioteca, fundo, foto/arquivo e texto, substituindo a antiga faixa de quatro etapas. O nome editável e o estado do rascunho continuam próximos ao projeto.
- **Começar**, no menu lateral: painel de início com quatro destinos descritos em linguagem direta. Os antigos layouts deixam de ser a apresentação inicial e permanecem em **Modelos editáveis**, opcionais, com canecas, posts e stories. O caminho da biblioteca abre essa seção diretamente.
- **Visualização e guias**, junto ao canvas: réguas, faces, encaixe, área segura e guias livres em um grupo; tamanho e enquadramento em outro, com a indicação de que estes alteram a arte. Importar SVG editável fica em Uploads.
- Ações de travar, duplicar e excluir ficam na barra contextual da seleção. O inspector evita repeti-las e mostra orientação simples quando não há seleção. Sombra passa a iniciar recolhida, com título visível. Texto novo recebe cor escura sobre fundo claro/transparente e branca sobre fundo escuro, sem recolorir textos existentes.
- **Biblioteca**: seletor de conteúdo, favoritos e recentes próximos; capas maiores de coleção; caminho de volta explícito; filtros agrupados; pesquisa com filtro de coleção; cartões com nomes em duas linhas e qualidade do arquivo. A virtualização usa a mesma altura dos cartões. Carregamento do original, favoritos salvos e inserção de SVG/PNG foram mantidos.
- Em telas pequenas, selecionar uma ferramenta abre o acervo e leva o usuário ao painel correspondente. Projeto permanece identificado por texto. A página de entrada e seus cards não foram alterados.

## Verificação

- `verify:creative`: 38 arquivos/suítes de regressão passaram, cobrindo persistência, recuperação, renderização, exportação, fontes, abas e biblioteca. O teste antigo que exigia quatro etapas foi substituído pelo fluxo real de navegador descrito abaixo; os outros quatro testes de impressão/enquadramento desse arquivo passam.
- `editor-workspace-browser.mjs`: começo sem layouts expandidos; um Exportar; Projeto por teclado; retorno de foco; texto novo legível e desfazer; coleções, voltar, favoritos e recentes; inserção de vetor original sem sombra adicionada; referências sem mutação do documento; salvamento e histórico; PNG real em 2480 × 1122 e 300 DPI, com pixels iguais ao renderer; SVG e modelos opcionais acessíveis; larguras de 390 a 1920 px e menu móvel dentro da tela.
- Regressões reais em Chromium: refinamentos (48 formas, 38 objetos, 31 efeitos e PDF físico); 18 verificações de guias; estabilidade do canvas ao selecionar, exibir avisos e mudar painéis/zoom; desagrupamento de SVG com recomposição, gradientes e backup; 15 verificações de precisão, cópia entre abas e atalhos.
- TypeScript, ESLint dos três componentes e diff --check passaram. O build local esbarrou no download externo de fontes em next/font (resposta com URL sem extensão); o build de publicação é conferido na Vercel da PR, usando as dependências e configuração do projeto.

Não há alterações de schema, autenticação, contas, cobrança, integração da Biblioteca, motor de renderização ou arquivos originais do acervo. As adaptações nos testes existentes seguem os novos caminhos de menus sem retirar suas verificações funcionais.

Evidências locais em /workspace/work/editor-workspace-20261107/ e /tmp/editor-workspace-*.log.
