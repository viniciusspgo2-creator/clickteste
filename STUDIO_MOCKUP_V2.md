> Atualização final: veja [AJUSTES_FINAIS_MOCKUP_STUDIO.md](AJUSTES_FINAIS_MOCKUP_STUDIO.md) para limites da estampa, Duo, giro de todas as peças e novos acabamentos.

# Mockup Studio V2 — geometria, cor e interface

Implementação de 27/10/2026 no módulo `src/components/tools/mockup/`.

## Caneca Clássica 325 ml

A cena usa **1 unidade = 1 cm**. Os raios normalizados solicitados (0,82 e 0,745) foram convertidos por ×5 para manter câmeras, composições e projetos compatíveis.

| Propriedade | Implementação |
| --- | --- |
| Corpo | Cilindro com raio externo constante de 4,1 cm na parede |
| Dimensões externas | Diâmetro 8,2 cm; altura total 9,55 cm |
| Raio interno | 3,725 cm; diferença entre raios de 3,75 mm, arredondada para 3,8 mm na especificação |
| Borda | Perfil circular contínuo com 32 segmentos; 256 segmentos em volta |
| Apoio | Anel inferior com largura radial de 4 mm |
| Fundo | Rebaixo côncavo com 1,8 mm de profundidade |
| Alça | Varredura de seção arredondada e achatada; junções alargadas na própria malha |
| Soldas | Pontas embutidas na parede, sem atravessar o interior; normais aproximadas às do corpo na junção |
| Impressão inferior | Malha que acompanha o rebaixo, com UV próprio e rotação independente |

O corpo continua usando `LatheGeometry`: seu perfil externo é constante na Clássica. A conicidade foi removida do perfil, preservando parede, lábio, cavidade e fundo em uma superfície de revolução. As outras cinco formas continuam disponíveis.

## Material e cor

`scene/ceramic-material.ts` centraliza a receita usada pelo corpo, pela alça e pela impressão inferior:

- Roughness 0,08; metalness 0; clearcoat 1; clearcoat roughness 0,04.
- IOR efetivo 1,52; specular intensity 0,9; specular color branco.
- Reflexo, verniz e rugosidade continuam ajustáveis por peça.
- O Three vincula reflectivity a IOR: a receita declara reflectivity 0,5 e atribui IOR por último para preservar 1,52 (reflectivity derivada próxima de 0,51).
- Removidos os mapas artificiais de AO e bump que existiam apenas no corpo.
- O modo **Preservar cor da arte** aplica a mesma resposta de cor às partes com textura e sem textura. Compressão de brilho ocorre depois da camada de verniz, protegendo pretos e tons saturados.
- Saída sRGB; mapas de arte sRGB, mipmaps e anisotropia máxima informada pela GPU; renderizador AgX para os materiais com tone mapping ativo.

Sombras e reflexos continuam modificando a aparência da peça. O editor apresenta cores RGB; não simula o perfil CMYK/ICC da impressora, tinta ou papel.

## Estúdio e câmera

Luz principal, preenchimento, recorte e softbox retangular usam um ambiente procedural de estúdio. O padrão é neutro, com reflexos em intensidade moderada. Presets quentes, dramáticos e HDRI próprio continuam disponíveis.

A sombra principal tem mapa de até 2048 px e bias -0,0001. O renderer usa PCFShadowMap, pois o PCFSoftShadowMap foi removido no Three instalado. Duas camadas de ContactShadows combinam contato próximo com penumbra difusa. O chão recebe uma projeção mais discreta, evitando a mancha dura anterior.

A câmera inicial usa lente de 85 mm para reduzir a diferença aparente de tamanho entre o topo e a base causada pela perspectiva. O modelo permanece matematicamente cilíndrico em qualquer câmera.

## Fluxo simplificado

1. Adicione ou cole a arte.
2. Em **Sua arte na caneca**, escolha Centrar, Frente, Costas ou 360° completo e ajuste o tamanho de 10% a 100%.
3. Em **Cores da caneca**, escolha Caneca inteira ou Só a alça e toque em uma cor.
4. Na barra sobre o palco, use **Girar 360°**, Frente, Lateral / Alça, Costas, Perspectiva 3D, Topo / Interior e Centralizar.
5. Abra **Exportar imagem** e escolha o destino e o fundo.

As vistas acompanham a posição e a rotação da peça selecionada. Pausar o giro mantém a pose visível; retomar continua desse ângulo. As coordenadas XYZ e a escala da peça ficam em **Avançado (Modo Manual)**. Ajustes de cor, impressão, acabamento e camadas permanecem em seções recolhíveis. No celular, o menu de três pontos reúne as ações do cabeçalho.

## Exportação

| Opção | Saída padrão |
| --- | --- |
| WhatsApp / Redes | 1080 × 1080 px |
| Stories / Reels | 1080 × 1920 px |
| Alta resolução Print | PNG 3000 × 3000 px; 300 DPI reais no chunk pHYs; 25,4 × 25,4 cm |
| Fundos | Cenário atual, branco ou transparente |
| Avançado | Tamanhos personalizados, proporções anteriores, PNG/JPG/WebP, escala e qualidade |

A imagem solicita supersampling de até 4× por eixo. O motor limita o buffer à capacidade da GPU e ao orçamento de pixels; o arquivo mantém as dimensões escolhidas. Efeitos de tela inteira e dispositivos com menos memória usam um teto menor. JPG recebe fundo branco quando a entrada solicita transparência.

Durante a captura, controles e animação de câmera ficam congelados. O motor restaura tamanho, pixel ratio, cor de limpeza, fundo, visibilidade, materiais do chão, texturas e controles, inclusive em falhas de captura. As funções de vídeo de 3 a 20 segundos, GIF, lote, folha de sublimação, projetos e composições continuam no módulo.

## Arquivos centrais

- `scene/mug-geometry.ts`, `model-geometry.ts`: dimensões, perfil, alça, base e apoio.
- `scene/ceramic-material.ts`, `mug.tsx`: receita comum e aplicação por peça.
- `scene/studio.tsx`, `studio-scene.tsx`: luzes, sombras e renderer.
- `ui/quick-controls.tsx`, `workspace.tsx`, `workspace.css`: controles rápidos e interface responsiva.
- `ui/panels.tsx`: destinos simples de exportação e opções avançadas.
- `exporters/image-exporter.ts`, `frame-capture.ts`, `png-dpi.ts`: captura, restauração e metadados.

O `package-lock.json` também foi reparado para permitir instalação limpa; as dependências declaradas e as versões diretas fixadas foram preservadas.

Uma correção mecânica em `src/components/tools/pdf-editor.tsx` moveu o visualizador para fora da função do editor, passando seus dados por propriedades, para eliminar o erro preexistente `react-hooks/static-components` no ESLint geral. A tipagem dos parâmetros de giro no exportador de vídeo também foi corrigida.

## Instalação

Entre na pasta `clicktools-main` de dentro do ZIP e copie seu conteúdo para a raiz do repositório, onde ficam `package.json` e `src`, substituindo os arquivos correspondentes. Preserve a pasta `.git` e suas configurações pessoais de ambiente. O pacote contém o projeto completo e não inclui dependências instaladas nem caches de build.

Consulte `docs/mockup-studio/VALIDACAO_V2.md` para os testes, evidências e limites da verificação.
