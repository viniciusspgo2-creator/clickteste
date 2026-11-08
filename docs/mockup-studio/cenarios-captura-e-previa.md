# Cenários, enquadramento e prévia de vídeo

A apresentação 3D, a imagem de fundo e a estampa original são conteúdos separados. A janela de exportação não aceita drops como substituição da arte. As imagens de prévia e os cartões de cenário não iniciam arrasto nativo. O upload pela área de edição continua disponível.

A captura usa texturas temporárias com Sources próprias, preserva os mapas originais e restaura render target, viewport, recorte, material de override e controles. Encerrar uma sessão duas vezes é seguro. Os cenários ficam ocultos nas saídas branca/transparente e retornam ao fim da captura.

## Cenários

- Fotos e datas: os 30 fundos existentes, com lote e ajustes preservados.
- Ambientes 360°: 24 espaços reais da Poly Haven, organizados em Estúdio, Interiores, Natal e Natureza.
- Cada item tem origem, autores, licença e tamanho em `panorama-catalog.json`. Os arquivos HDRI de 2K e as miniaturas foram verificados no provedor.
- O HDRI só é baixado ao escolher o item. A requisição tem prazo, reaproveita downloads na sessão e não aplica uma escolha antiga depois de uma seleção mais recente.
- A projeção no chão usa `GroundedSkybox`, separada da estampa e excluída da câmera de profundidade das sombras. O usuário pode girar o ambiente e ajustar a perspectiva da superfície.
- O arquivo do ambiente acompanha o projeto pelo mecanismo existente de IndexedDB e `.cgstudio`. Alternar ambientes libera a alocação antiga na GPU, mantendo os dados necessários ao projeto.

Fontes verificadas em 08/11/2026: [licença CC0 da Poly Haven](https://polyhaven.com/license), [API e uso comercial](https://polyhaven.com/our-api). A interface identifica o provedor. Nenhum recurso requer uma nova conta, assinatura ou chave de API. Os downloads iniciais dependem da disponibilidade e da conexão com o provedor.

## Aproximação opcional

Automático continua sendo o padrão da exportação. Minha aproximação preserva a posição e o zoom da câmera, inclusive no vídeo. As escolhas Mais espaço, Destaque e Primeiro plano são atalhos; o slider permite refinar. Mudar a proporção pode recortar as bordas, por isso a prévia usa a proporção final. O zoom escolhido por esse controle acompanha o projeto salvo. Restaurar enquadramento volta ao automático.

## Vídeo ao vivo

A aba Vídeo tem uma prévia local com Reproduzir/Pausar e Recomeçar. Ela compartilha giro, órbita, zoom, revelação e direção com o exportador. A resolução e a atualização são reduzidas para interação; a saída final usa a configuração escolhida. O componente encerra sua sessão antes de gerar o vídeo, ao trocar de aba ou ao fechar a janela. Não altera a estampa, as poses salvas ou a cor da caneca.

## Guia e assistente

O guia tem 12 tópicos pesquisáveis, dicas e verificações práticas. A base local do assistente é específica para o Studio, evitando respostas sobre botões exclusivos do Editor. O mesmo conhecimento fundamenta a IA opcional já existente. As ações propostas só abrem ferramentas após confirmação; não aplicam ajustes ou modificam arquivos automaticamente. Não há configuração de novos provedores nem mudança de autenticação ou faturamento.

## Verificação

Os testes de navegador usam Chromium com WebGL real e arquivos públicos CC0 como fixtures. Não acessam contas ou banco de produção.

```bash
STUDIO_TEST_TOOLS=/caminho/para/ferramentas node tests/mockup-scenes-export-browser.mjs
STUDIO_TEST_TOOLS=/caminho/para/ferramentas node tests/mockup-motion-export-browser.mjs
STUDIO_TEST_TOOLS=/caminho/para/ferramentas node tests/final-preview-browser.mjs
node tests/studio-help-scenes.mjs
```

O primeiro teste baixa uma fixture HDRI e as miniaturas públicas por `curl`, guardando-as no diretório temporário. `STUDIO_TEST_SCENE_CACHE` permite fornecer um cache já preenchido. O teste de vídeo usa `ffprobe` para inspecionar codec, dimensões e duração do arquivo gerado. A resolução de 320 px é injetada exclusivamente no bundle de teste, para reduzir o custo do render em software.
