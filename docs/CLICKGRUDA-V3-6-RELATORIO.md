# Click & Gruda V3.6 — Realismo, assistente, PDF/PSD, máscaras e MP4

## Escopo entregue no código

### Studio 3D e sombra
- Filtro PCFSoftShadowMap para melhorar o contorno de sombras; `shadow-normalBias` ajustado para reduzir artefatos em superfícies próximas.
- Três controles adicionais de sombra de piso: deslocamento X, profundidade Z e escala da sombra; botão de restauração natural e preset Foto Elite ajustado.
- Iluminação, materiais, HDRI, sombra projetada, sombras de contato e demais funções existentes da V3.5 permanecem em seus módulos originais. Não foi implementado ray tracing/path tracing: o resultado fotográfico ainda depende de ajustes de luz e testes em dispositivo real.

### Assistente com IA e ações confirmadas
- Endpoint opcional `/api/creative-assistant` com integração server-side à API de chat da OpenAI, sem dependência extra.
- Configure **OPENAI_API_KEY** somente na Vercel, em Environment Variables; opcionalmente **CREATIVE_ASSISTANT_MODEL** para controlar o modelo (padrão `gpt-4o-mini`). Nunca coloque a chave no frontend ou no ZIP.
- Cada pergunta envia exclusivamente **texto da dúvida, módulo e idioma**, nunca imagens, artes, arquivos ou documentos. A IA só propõe ações da lista permitida; o usuário precisa confirmar e o cliente executa apenas ações implementadas.
- Sem chave, mantém o guia contextual local. Rate limiting em memória por instância (24 consultas por hora/IP) é uma proteção inicial, NÃO adequada para escala grande; antes de abrir publicamente com tráfego elevado, instalar rate limiting compartilhado (Redis/KV) e uma política de autenticação/cotas.

### Importação PDF
- PDF.js v6.4.299 (já no projeto) abre a primeira página no navegador e transforma trechos de texto reconhecíveis em caixas de texto independentes. Preserva fundo rasterizado e tenta limpar as áreas de texto original.
- **Limitações:** PDFs escaneados, textos vetorizados, fontes ausentes, gradientes, transparências e layout complexo não são reconstruídos perfeitamente; os textos originais podem deixar vestígios no fundo. Sem OCR, múltiplas páginas e extração fiel de objetos vetoriais.

### Importação PSD
- Importador local próprio suporta documentos PSD clássicos, RGB 8-bit e compressão raw/RLE, até 100 camadas raster visíveis. Nomes, pixels, posições, opacidade e alfa são transformados em objetos móveis e editáveis no Editor.
- **Não suporta:** PSB, CMYK, 16-bit, ZIP compression, texto PSD editável como caracteres, filtros inteligentes, grupos, objetos inteligentes, máscaras vetoriais e estilos complexos. Este importador não é substituto para `ag-psd` (MIT); a integração dessa biblioteca pode ampliar a compatibilidade no futuro, mas a dependência não foi adicionada porque npm estava sem conexão.

### Templates inteligentes
- Formato `.cgtemplate` (ZIP) com `manifest.json`, imagens de fundo, primeiro plano, sombra e máscara opcionais, além da área relativa de encaixe da caneca. Imagens ficam no navegador ao abrir localmente, ou no R2 quando um administrador publica um template.
- O Admin aceita pacotes `.cgtemplate` de até 4 MB e os exibe na galeria; o Editor os abre usando o código existente.
- Máscaras de luminância: branco revela, preto oculta e cinza cria transparência parcial. Pode selecionar uma imagem e importar uma máscara própria pelo inspetor. O material da caneca permanece editável como imagem 2D após envio.
- `samples/template-inteligente-demonstracao.cgtemplate` exemplifica o formato e o encaixe de uma caneca em pedestal. Não substitui recorte humano inteligente nem estimativa automática de perspectiva.

### Templates MP4
- Importar MP4 local (máximo 30 MB) ou abrir vídeo publicado pelo Admin como fundo do Editor. Texto, objetos, imagens e mockup se sobrepõem e permanecem editáveis; início/fim da reprodução podem ser indicados.
- Exportação local de MP4 H.264 com WebCodecs e `mp4-muxer` (MIT, dependência que já constava no projeto), com imagens estáticas sobrepostas; até 20 segundos, até 720p, 24 fps, **sem áudio original**. Requer navegador compatível, HTTPS e permissão de leitura/CORS para vídeo administrativo.
- Não há timeline com keyframes nem edição dos quadros originais. `mp4-muxer` está depreciado e deverá ser migrado para Mediabunny antes de um lançamento profissional de vídeo.

## Especificação do template inteligente

`manifest.json` no arquivo `.cgtemplate`:

```json
{
 "format": "clickgruda-smart-template", "version": 1,
 "name": "Cenário de caneca", "width": 1080, "height": 1350,
 "background": "background.webp", "foreground": "foreground.png",
 "shadow": "shadow.png", "mask": "mask.png",
 "slot": {"x": 0.26, "y": 0.19, "w": 0.50, "h": 0.58}
}
```

Os campos de imagem são opcionais e devem apontar para PNG/JPEG/WebP dentro do próprio ZIP. As coordenadas `slot` variam de 0 a 1 em relação ao tamanho do documento. A máscara está no sistema de coordenadas da caneca, é redimensionada sobre ela e usa a luminosidade como alfa. O primeiro plano é desenhado acima da caneca, por exemplo, para mãos e objetos.

## Privacidade e operações
- Nenhuma importação de PDF, PSD, vídeo ou imagem local envia os bytes ao servidor. O assistente com IA recebe apenas a pergunta digitada, e o usuário deve ser informado desse envio.
- Para arquivos de acervo administrativo, as rotas já existentes armazenam arquivos no R2 e metadados no Neon.
- O arquivo `.cgdesign` pode ficar grande com imagens/vídeo incorporados. O navegador pode remover rascunhos locais: exporte e guarde arquivos originais.
- Deploy somente em `clickteste`. Não altere nem execute migração sobre o banco original. Esta rodada não exige `prisma db push`.

## Testes efetivamente realizados
- Verificação sintática por TypeScript transpileModule, incluindo telas, Studio e novas rotas.
- Testes unitários de estrutura do Editor e regressão em módulos que não exigem node_modules.
- Chromium real (isolado): importação de PSD sintético com duas camadas, pixels vermelhos/azuis, preservação de alfa; máscara de luminância com pixels visíveis e ocultos. Resultados aprovados.
- **Não homologado:** build Next.js (`npm ci` falhou por dependência ausente do cache npm e DNS externo indisponível), integração geral no navegador, MP4/WebCodecs end-to-end, PDF com documentos complexos e autorização R2 em staging. Esses testes deverão ser executados com as dependências instaladas e ambiente `clickteste` configurado.

## Validação de deploy antes da produção
1. `npm ci --no-audit --no-fund` e `npx prisma generate`.
2. `npx tsc --noEmit` e `npm run build`.
3. Abrir `/editor-artes`, importar PSD de teste, PDF simples e um `.cgtemplate`; verificar seleção de camadas, máscaras e exportação PNG.
4. Abrir MP4 de até 20 s, posicionar texto e mockup, exportar MP4 em Chrome/Edge atualizado; reproduzir o arquivo e conferir a duração.
5. Testar assistente sem chave (guia local), depois com chave no staging; confirmar que ações não são executadas sem confirmação e checar custos.
6. Abrir `/mockup-caneca-3d/studio`, girar a caneca, mover sombras X/Z, comparar no modo mobile e desktop e exportar.
7. Validar responsividade, autorização de Admin, uploads e políticas de CORS R2 antes de liberar a versão pública.
