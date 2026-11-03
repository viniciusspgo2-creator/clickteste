# Mockup de Cenários — 29/10/2026

**Status: pausado por solicitação do proprietário.** O código e os dados foram preservados, mas os links e acessos públicos estão desativados por `MOCKUP_SCENES_ENABLED = false` em `src/lib/features.ts`. A reativação será feita quando o módulo estiver pronto, sem agendamento automático.

Área independente do Studio 3D. O editor estático recebe uma arte pronta, aplica em canecas preparadas e monta a apresentação. Não gera nem modifica o arquivo original da arte.

## Entradas

- `/mockup-cenarios`: apresentação do produto.
- `/mockup-cenarios/editor`: editor estático, com o mesmo acesso premium existente.
- `/admin` → **Mockup de Cenários** → **Cenários e fundos** ou **Modelos de caneca**.
- `/mockup-caneca-3d/studio`: Studio 3D existente, com quatro novas alças e prévia de exportação de imagem.

Rotas, estado, renderização, catálogo e CSS do editor estático são próprios (`src/lib/mockup-scenes`, `src/components/tools/mockup-scenes`). Não importa o estado, a cena, o WebGL ou os exportadores do Studio 3D. O único compartilhamento de produto é o acesso premium e a leitura dos arquivos de fundos já incluídos. Os controles e o banco de projetos 3D continuam independentes.

## Catálogo inicial e expansão

Incluídos: **3 vistas de porcelana branca**, preparadas em **4096 × 4096 px**, **6 composições** (solo, dupla, empilhadas, trio, pirâmide e editorial) e **30 cenários existentes**. As combinações são editáveis; não são milhares de fotografias distintas. Novos modelos e cenários podem ser cadastrados no painel sem alterar código ou fazer um novo deploy.

O catálogo administrativo tem busca por nome, categoria e tags, rascunhos, publicação e arquivamento. A listagem consulta **24 registros por página**. Miniaturas são gravadas separadamente das imagens originais. Não carrega milhares de arquivos no editor nem no painel. O volume disponível depende da capacidade e do espaço do PostgreSQL contratado; não há um limite artificial de quantidade no aplicativo.

## Cadastrar um cenário sazonal

1. Abra **Cenários e fundos → Novo cenário**.
2. Envie a foto do fundo em PNG, JPEG ou WebP, até **4 MB**. Mínimo de 1000 px em cada lado; prefira 2000 px ou mais.
3. Informe nome, coleção/categoria e tags, como Natal, Dia das Mães ou Páscoa.
4. Salve como rascunho ou publique. Rascunhos e arquivados não aparecem no catálogo público.

Fundos podem ser trocados sem alterar o modelo de caneca. No editor, também é possível enviar um fundo próprio, preservar toda a foto ou preencher o enquadramento e ajustar o recorte. O envio pessoal fica no navegador, sem criar um item administrativo.

## Posso criar uma caneca em IA e subir a imagem?

Sim, **depois de preparar o modelo**. Uma foto sozinha não contém a geometria necessária para aplicar uma estampa. Para o fluxo atual:

1. Gere/fotografe uma **caneca branca, sem estampa**, com perspectiva plausível e iluminação neutra.
2. Recorte a caneca com fundo transparente e preserve a resolução. Use PNG ou WebP transparente.
3. Abra **Modelos de caneca → Novo modelo**. Posicione os quatro limites da impressão e ajuste a curvatura. Os pontos podem ser arrastados ou ajustados pelas setas do teclado.
4. Use **Conferir estampa** para inspecionar a grade e a proporção. Ajuste novamente se necessário.
5. Publique somente depois dessa conferência. A API também rejeita publicação sem uma área válida.

A aplicação dos modelos incluídos usa mapas UV de 12 bits, obtidos da geometria na vista exata, e uma camada de reflexos. Modelos fotográficos cadastrados usam uma superfície cilíndrica calibrada, interpolação bilinear da arte e a luminosidade da cerâmica original. O ajuste **Arte inteira** preserva a proporção; **Preencher** recorta o excedente. Nenhum dos dois estica a foto para preencher um retângulo.

**Limites da preparação:** o editor administrativo atual prepara uma área cilíndrica por modelo. Para canecas com geometrias muito irregulares, transparência de vidro, mãos ou objetos cobrindo a estampa, é preciso preparar máscaras/mapas específicos antes de cadastrar; esses mapas avançados não são gerados automaticamente. Fotos de grupos não recebem várias áreas de impressão automáticas. Para duplas/trios, monte o conjunto com as peças independentes do editor.

## Composição e exportação

- Até **12 peças** na mesma composição, sem rotação livre no editor estático.
- Arte, escala da arte, posição, tamanho da peça, sombra, visibilidade e bloqueio por caneca.
- Ordenação de camadas, duplicação, centralização, desfazer/refazer e cópia da estampa para as peças desbloqueadas.
- Logotipo opcional, com posição, tamanho, opacidade e bloqueio próprios.
- Quadrado 1:1, retrato 4:5 e paisagem 3:2. O palco mantém a proporção real inclusive no celular.
- Saídas **somente PNG ou JPEG**, em 2000, 3000 ou 4096 px no maior lado. PNG permite transparência real; JPEG mantém o cenário preenchido.
- Artes, fundos e logos pessoais aceitam até **12 MB**, PNG/JPEG/WebP, e até 36 megapixels; o maior lado é limitado a 6000 px durante a leitura.
- Ao abrir a exportação, a prévia é gerada a partir do **arquivo final codificado**. Download só é disponibilizado depois da prévia. Mudanças de formato, resolução ou transparência geram outro arquivo e outra prévia. O download reutiliza o mesmo Blob, sem uma segunda renderização.
- No Studio 3D, a aba Imagem agora usa **Pré-visualizar exportação → Confirmar e baixar imagem**, reutilizando o Blob conferido. As exportações de vídeo, GIF, lote e folha existentes continuam no seu próprio fluxo.

Resolução do arquivo não recupera detalhes inexistentes na foto original. Os fundos reaproveitados têm a resolução original do catálogo; cenários novos de maior resolução podem ser enviados pelo admin. As prévias do editor usam versões menores dos modelos incluídos; a exportação seleciona os originais quando necessário. Os caches têm limites de memória.

## Atualização do projeto e do banco

O projeto usa o PostgreSQL já configurado em `DATABASE_URL`. A nova tabela é `MockupSceneItem`, com metadados, imagem e miniatura em BYTEA. **Não usa a pasta pública gravável nem o disco temporário do servidor para uploads.** Os arquivos administrativos persistem no banco inclusive em hospedagem serverless. Nomear, publicar ou arquivar não altera a geometria/código do Studio 3D.

Instale as dependências habituais e gere o Prisma. O `npm run build` existente já executa `prisma generate` e `prisma db push` antes do Next. Para uma atualização administrada manualmente, revise `SCHEMA_ADICIONAL.sql` com o responsável pelo banco: ele só cria a tabela e seus dois índices. Não aplique as duas alternativas em sequência. Preserve suas variáveis e credenciais de produção. Os testes foram executados em um banco isolado; a atualização do banco configurado na hospedagem ocorre durante o build da publicação.

As dependências de produção existentes foram suficientes; nenhuma integração paga ou chave nova é exigida. `scripts/bake-scene-models.mjs` é uma ferramenta opcional para recriar as imagens incluídas, com TypeScript, Three, Sharp, Playwright e Chromium locais (`CHROME_BIN` permite informar outro executável). Não é chamada pelo editor ou pelo build.

## Alças do Studio 3D

Adicionadas a partir das quatro referências: **com colher**, **coração assimétrico**, **coração** e **oval**. Original e arredondada permanecem disponíveis. A oval começa branca e todas usam o mesmo acabamento de cerâmica, respeitando a cor escolhida. O ID salvo `oval-gold` permanece por compatibilidade com projetos existentes. Cada peça mantém sua escolha em projetos, duplicações e restauração. A colher integra a geometria da alça e participa do cálculo de apoio; sua haste e concha têm folga em relação à parede dos seis modelos de caneca. As junções das alças de referência são fechadas e ficam dentro da parede cerâmica. A câmera reenquadra a composição ao trocar a alça.

As fotos de referência determinam o perfil visual, mas não fornecem medidas ou digitalização 3D. Uma correspondência dimensional industrial exigiria medidas ou um arquivo de modelo do fornecedor.

## Cores livres no Studio 3D

Em **Cores da caneca**, escolha **Caneca inteira**, **Só o corpo**, **Só a alça** ou **Só o interior**. Os presets continuam disponíveis, mas a escolha não fica limitada a eles: arraste na área de saturação/brilho e use a faixa de tonalidade para obter qualquer cor. Também é possível informar o código HEX.

Cada parte mantém sua cor ao alternar os controles; mudar a cerâmica não recolore a arte enviada. O seletor funciona com mouse, toque e teclado. Peças bloqueadas não podem ser recoloridas. As cores usam os campos de projeto existentes, preservando salvamento, duplicação e restauração, sem uma nova alteração no banco.
