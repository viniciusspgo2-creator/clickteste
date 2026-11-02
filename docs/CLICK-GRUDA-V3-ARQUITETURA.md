# Click & Gruda V3 — Arquitetura de expansão (ambiente isolado)

## Auditoria do ZIP base

Código real identificado: Next.js 16 / React 19 / TypeScript / Prisma / Neon; Studio 3D em `src/components/tools/mockup/` com Three.js e React Three Fiber; exportadores de imagem, WebM, MP4, GIF, lote e PNG com DPI; seleção de múltiplas canecas, acabamentos, iluminação, rotação, perfis de modelos, sombras, controle de objetos, armazenamento local de projetos; proteção de acesso `PremiumGate`; painel administrativo com códigos, comunicados, SEO, visitas e editor de cenários estáticos desativado intencionalmente (`MOCKUP_SCENES_ENABLED = false`). O código anterior foi mantido.

## Rotas independentes

| Rota | Função |
| --- | --- |
| `/` | Página inicial original, com central dos três módulos adicionada |
| `/mockup-caneca-3d/studio` | Studio 3D existente, preservado, com opção Enviar para Editor |
| `/studio-templates` | Galeria com 4 layouts editáveis inclusos e templates paginados publicados pelo administrador |
| `/editor-artes` | Editor Canvas 2D para texto, fotos, formas, filtros, sombras, escalas e exportação |
| `/admin` | Painel existente com nova aba Biblioteca Criativa |

Todas as três ferramentas usam `PremiumGate`, preservando o esquema de acesso pré-existente. Os projetos `.cgdesign` exportados do Editor ficam no dispositivo do cliente. A ponte Mockup > Editor armazena temporariamente PNG transparente em IndexedDB; não envia o arquivo ao servidor.

## Implementado nesta entrega

- Quatro layouts iniciais editáveis (Vitrine Elite, Editorial, Natal Elegante e Oferta Premium), além do catálogo administrativo expansível.
- Editor em Canvas 2D próprio, com seleção, arraste, redimensionamento por canto, rotação via slider, ordem de objetos, duplicação, exclusão, desfazer/refazer, texto livre, tamanho, fonte e alinhamento, círculos, retângulos, cor, opacidade, sombra, brilho, saturação, contraste e desfoque.
- Importação local PNG/JPEG/WebP/AVIF e rasterização da **primeira página** de PDF; arquivos de imagens são reduzidos a no máximo 4.800 px no maior lado antes do tratamento, para limitar memória.
- Exportação local PNG/JPEG/WebP com redimensionamento 50/100/200% e limite de alocação; visualizador único da composição. Projetos abertos e salvos com `.cgdesign` em JSON local (imagens embutidas no documento quando importadas do dispositivo).
- Presets de formatos: Instagram 1080x1350, quadrado 1080x1080, stories 1080x1920, arte de caneca 2480x1122 (~300 DPI para 21 x 9,5 cm), horizontal 1920x1080.
- Logos e mascotes fornecidos pelo proprietário, preservados sem reinterpretação, disponíveis em aba própria do Editor.
- Ponte do Studio 3D para o Editor via `IndexedDB` com prazo lógico de 24 h e leitura destrutiva ao abrir o Editor; não muda o arquivo da arte original.
- Biblioteca administrativa de templates, elementos, fundos, fontes e Lottie JSON. Metadados paginados em Neon; arquivos no bucket **R2 separado**; upload admin em lote (até 4 MB por arquivo em rotas Vercel; upload direto multipart/R2 virá na fase de escala), rascunho/publicado, categorias, tags, busca, ativar/desativar, excluir. Publicações aparecem nos respectivos consumidores.
- Formato MP4 aceito na biblioteca de templates para **visualização**, ainda sem edição/exportação de vídeo no novo Editor.
- Perfil opcional de alça `Referência 325 ml` (sem substituir `classic`, preservando projetos anteriores). Um único ângulo fotográfico não permite validar cópia exata da geometria por medição; exigem-se fotos frontal/lateral/superior e medidas físicas para uma réplica fiel.
- Controle de acesso administrativo antes de qualquer operação de biblioteca. Binários do cliente jamais são escritos via estas APIs.

## Escopo ainda NÃO implementado

Esta fase não equivale a um clone do Canva/Polotno/Pacdora. **Não** estão implementados: edição nativa dos objetos internos de PDF, leitura de PSD por camadas, reprodução/editoração e exportação de Lottie ou MP4 no Editor, mascaramento avançado de cenas com pessoas e substituição automática de arte na superfície de uma caneca fotografada, perspective warp, modelos reais escaneados/calibrados por fotogrametria, milhares de templates já preenchidos, geração automatizada de templates ou mecanismo de edição via CSG. O catálogo administrativo começa vazio (há apenas 4 layouts iniciais); não confundir a estrutura pronta com milhares de modelos; depende de importação de conteúdo licenciado pelo proprietário.

## Próximas fases (ordem para não quebrar)

1. **Pipeline PSD/PDF**: avaliador de suporte e parser ag-psd (MIT), extração real de texto e elementos com cálculo de coordenadas e fontes; fallback explícito para camada achatada; teste em PSD com grupos, máscaras, smart objects e PDF com vetores/textos, arquivos malformados e 16/32 bits. Recursos sem suporte devem ser mostrados como não editáveis, sem inventar camadas.
2. **Templates inteligentes**: regiões de impressão vetoriais, máscaras, profundidade, sombras e composições pessoa/caneca com parâmetros editáveis, templates MP4 com âncoras animadas e exportação de vídeo compatível.
3. **Studio 3D de próxima geração**: ajustar 325 ml conforme fotos/medidas e alça de referência, calibração por imagem, AO/contact shadows fisicamente plausíveis, mesh/LOD por dispositivo, antialiasing progressivo e testes com GPU integrada e telefone.
4. **Editor de alto nível**: SVG vetorial editável, tipografia de múltiplos estilos, máscaras e perspective warp, manipulação de texto em múltiplas caixas, snapping e guias inteligentes, painel de camadas simplificado, biblioteca de favoritos e presets de efeitos, histórico de projeto em IndexedDB com controle de tamanho.
5. **Escala e operação**: thumbnails e variantes comprimidas no R2, CDN assinado, upload multipart, jobs de importação em lote, taxonomia administrativa, métricas e QA visual automatizado em dispositivos reais.

## Deploy seguro em uma conta NOVA

1. Criar novo projeto **Vercel**, novo projeto **Neon** (com outra `DATABASE_URL`) e bucket **Cloudflare R2** exclusivo para a V3; nunca copiar as credenciais da produção no projeto de teste.
2. Definir `DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SECRET`, `R2_ACCOUNT_ID`, `R2_CREATIVE_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` nas variáveis do projeto de teste.
3. Instalar dependências via `npm ci`. Executar `npm run db:generate` e `npm run db:push` **uma vez** no banco de teste (a alteração aditiva cria `CreativeAsset`). Não usar `--accept-data-loss`.
4. Executar `npm run build:staging`. O build está configurado para não executar `prisma db push` automaticamente e para falhar ao encontrar erros TypeScript.
5. Fazer deploy apenas depois dos testes, usando domínio separado. Não fazer alias do domínio da produção até testar todos os exports do Studio 3D, gating, admin, imagens, mobile e armazenamento.

### Limitações de validação desta geração

A cópia foi feita isoladamente no ZIP fornecido. A instalação `npm ci` falhou porque o ambiente de execução não consegue resolver `registry.npmjs.org`; sem os pacotes não foi possível rodar build real do Next.js, `tsc` completo ou testes de navegador. Foi executada análise de sintaxe TypeScript com transpilador instalado localmente. Portanto, **o código ainda requer build/QA de staging antes de deploy**.

## Segurança/privacidade

- O navegador dos clientes processa arquivos localmente com FileReader, Canvas e IndexedDB; não há POST para servidor na importação/exportação do Editor nem na ponte do Studio.
- Imagens temporárias não são publicadas automaticamente nem persistidas no R2. O projeto salvo pelo próprio usuário é responsabilidade dele.
- Fontes administradas precisam ter licença de redistribuição/uso comercial de cada fonte; software MIT não concede direitos sobre fontes, imagens ou templates de terceiros.
- Os endpoints do R2 são acessados por backend. Nunca colocar chaves privadas do R2 em variáveis `NEXT_PUBLIC_`.
- Materiais administrativos de MP4/JSON podem ser cadastrados e listados mas sua incorporação em animação exportável requer o módulo futuro.
