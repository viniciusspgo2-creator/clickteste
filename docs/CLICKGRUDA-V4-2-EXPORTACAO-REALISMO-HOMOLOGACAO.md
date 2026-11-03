# Click & Gruda V4.2 — Relatório de alterações e homologação

## Base
- Partida: V4.1, copiada de forma isolada.
- Destino recomendado: projeto de testes `clickteste` na Vercel.
- Nenhuma alteração de banco Neon/Prisma, endpoints de dados de cliente, variáveis de ambiente ou lógica de autenticação.

## Alterações efetivas

1. **Exportação sem perdas silenciosas:** `assertDesignAssetsReady()` testa previamente imagens e máscaras visíveis. Uma imagem inválida, removida, bloqueada por CORS ou sem dimensões interrompe PNG/JPEG/WebP/MP4 com mensagem indicando a camada. A pré-visualização segue tolerante a falhas temporárias, mas o arquivo final não omite elementos inadvertidamente.
2. **Máscaras/recoloração em cache:** `PixelBoundedCache` em memória com LRU (14 milhões de pixels, até 24 camadas); a chave muda com imagem, máscara, cor, corte e dimensão. Teste visual confirmou que a máscara e a cor são preservadas após vários desenhos, que a camada é reutilizada e que a mudança de tonalidade invalida apenas o efeito alterado. A ação **Resetar projeto** libera imagens e efeitos de renderização que estavam na memória do Editor; projetos salvos localmente permanecem intactos.
3. **MP4:** negociação de três perfis AVC/H.264 no WebCodecs; bitrate proporcional ao tamanho do quadro dentro de 1,8–4,0 Mbps. Não adiciona áudio, não promete renderização onde não há codificador, e preserva o limite de 20s, 720p e 24 fps.
4. **Studio 3D:** preset selecionável **Foto realista** de roughness/clearcoat/reflexo equilibrados, mantendo todos os presets anteriores e o padrão Sublimação inalterados. **Não** altera a geometria da alça nem comprova fotorrealismo físico.

## Verificações executadas

- `node scripts/verify-source.mjs`: 257 arquivos e 654 imports locais, sem erro.
- `npm run verify:creative`: 44 testes Node passando (38 legados + 6 novos).
- `node tests/generate-v37-browser-runtime.mjs && python tests/v42-browser.py`: Chromium isolado confirmou transparência de máscara, mudança de cor, cache e exportação PNG. `python tests/v39-browser.py` validou visibilidade/ordem de camadas.
- `tsc --noEmit` isolado de `effect-cache.ts` e `video-templates.ts` com definição temporária de `mp4-muxer`: sem erro de tipos nas rotinas alteradas. Não substitui `next build`.
- `npm ci --offline` falhou com `ENOTCACHED` em dependência publicada no registro npm; não foi possível executar o build Next.js completo neste ambiente.

## Testes obrigatórios na Vercel

- Realizar deploy e confirmar `Compiled successfully` e `Type checking` sem erros.
- Editor: aplicar imagem e máscara, trocar cor e exportar PNG, JPEG, WebP; testar com arquivo de imagem quebrado e confirmar que recebe aviso antes do download.
- MP4: executar prévia e exportar vídeo de 5–10 segundos com objeto mascarado e keyframes no Chrome/Edge via HTTPS. Conferir enquadramento, qualidade, temporalidade, tamanho e ausência de áudio.
- Studio 3D: comparar **Foto realista** e Sublimação com canecas em pé/deitadas e fundos claro/escuro; verificar highlights, sombra e estampa. Repetir com duas canecas.
- Mobile: testar memória, carregamento de elementos grandes e responsividade de painel.

## Escopo que continua em aberto

- Fotogrametria/alça idêntica à peça física: requer vistas e medidas adicionais para precisão, inclusive lateral.
- MP4 com áudio, camadas nativas do Photoshop ou interpretação perfeita de PDF não estão incluídos nesta rodada.
- Agente com API real e fluxos finais não foi testado com credenciais; não é considerado homologado.
- Testes integrais de navegador com a aplicação Next.js rodando requerem dependências e ambiente configurado.
