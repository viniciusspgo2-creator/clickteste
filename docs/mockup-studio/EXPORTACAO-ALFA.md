# Vídeo com fundo transparente

## Como usar

1. Abra o gerador de mockup e prepare sua arte na caneca.
2. Clique em **Exportar → Vídeo**.
3. Ative **ALFA — fundo transparente**.
4. Escolha movimento, duração, FPS e resolução.
5. Clique em **Gerar WebM com ALFA**.

O download termina em `-alfa-<data>.webm`. Desative ALFA para usar a exportação normal existente. Não é necessário mudar o fundo da cena para exportar com transparência.

O vídeo ALFA mantém as peças visíveis, suas artes, sombras com transparência parcial e a marca d'água configurada. Remove foto de fundo, cenário e bases de apoio somente durante a exportação. A cena do editor é restaurada ao concluir ou falhar.

## Compatibilidade

- A exportação ALFA usa WebM com VP9 e exige suporte a WebCodecs/VP9. Prefira Chrome ou Edge atualizados em computador. A capacidade é verificada para a resolução e FPS solicitados.
- O destino precisa aceitar **WebM com alfa**. Um player que mostra preto pode estar apenas exibindo a transparência sobre preto ou não oferecer composição com alfa.
- Se o navegador não suportar essa codificação, o aplicativo mostra uma mensagem. Não troca silenciosamente o vídeo transparente por um vídeo opaco.
- O render transparente mantém a iluminação e exposição da cena. Bloom, vinheta, granulado e demais efeitos de pós-processamento de tela inteira não são aplicados, pois podem tornar o fundo opaco.
- O processamento acontece no dispositivo; resoluções maiores exigem mais tempo e memória. Não há serviço externo nem dependência adicional de produção.

## Implementação

`video.transparent` começa desativado e é incluído no estado de vídeo dos projetos. Projetos antigos continuam usando o padrão desativado ao hidratar o estado.

O exportador usa o motor de frames compartilhado em modo transparente e gera duas sequências VP9 sincronizadas: cor e máscara alfa. O muxer WebM inclui `AlphaMode=1` e a máscara em `BlockAdditional`, com índices para busca. Isso preserva dados reais de transparência, em vez de apenas adicionar uma indicação no arquivo. A conversão de cor é explícita em BT.709; a máscara usa o alfa original em 0–255.

## Validação realizada

- TypeScript do Mockup Studio e ESLint dos arquivos alterados: aprovados.
- Dez regressões existentes do editor: aprovadas.
- Fixture de 60 frames/2,5 segundos, com busca antes/depois do segundo keyframe: alfa 0, 255 e 128 confirmado no navegador e no FFmpeg usando libvpx-vp9; cores verificadas.
- Recusa de frames sem máscara e de navegador incompatível: verificada.
- Exportação pela interface com a cena 3D, giro, 24 FPS, 3 segundos e resolução de teste 256×256: 72 frames, alfa 0–255 e pixels parcialmente transparentes confirmados por decodificação.
- Restauração de cena, visibilidade, flags e fundo após exportação e falha de encoder simulada: verificada.
- Consulta de suporte VP9 para as quatro resoluções de produção: aprovada no Chromium usado no teste. Isso não substitui testes em todos os dispositivos.

Para repetir o teste isolado, instale Playwright/Chromium no ambiente de testes e disponibilize FFmpeg e ffprobe com libvpx-vp9 no PATH. Execute `node docs/mockup-studio/alpha-video-regressions.mjs`. As variáveis opcionais `PLAYWRIGHT_MODULE` e `CHROMIUM_PATH` permitem usar instalações existentes.

Esta entrega altera o código-fonte. Não realiza publicação ou mudança de configuração de hospedagem/banco.
