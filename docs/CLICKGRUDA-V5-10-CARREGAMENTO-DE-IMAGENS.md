# Click & Gruda V5.10 — carregamento seguro de imagens (staging)

**Origem:** ZIP completo V5.9, em cópia isolada. **Destino de teste:** `clickteste`. **Nenhuma alteração em produção.**

## Defeito identificado

O `imageFor` do Editor e a inspeção das mídias ao abrir um `.cgdesign` aguardavam `onload/onerror` sem tempo limite. Uma URL remota lenta, um host inacessível ou um arquivo de imagem travado podia deixar um carregamento sem resposta e bloquear o fluxo de exportação ou recuperação por tempo indeterminado. Havia também uma corrida na invalidação do cache: um erro antigo podia remover a nova entrada da mesma URL depois de uma limpeza do cache.

## Solução

- Carregador `loadImageWithTimeout` compartilhado, respeitando `crossOrigin='anonymous'` e `decoding='async'`. Valida dimensões e desmonta listeners e recursos após timeout/erro.
- Tempo máximo de **15 segundos por imagem** na prévia/exportação; **12 segundos por imagem/máscara** na inspeção de projetos importados. São limites por mídia, não de carregamento total.
- `design.imageFor` continua compartilhando pedidos simultâneos (cache de Promises), mas permite nova tentativa após falha. A entrada é removida **somente se ainda for a promessa que falhou**.
- Mantidos o tratamento de erros que preserva o projeto aberto, a checagem de até três mídias simultâneas e os recursos de MP4 e Templates.

## Verificação executada

- `npm run verify:creative`: **156/156 testes passaram**, incluindo oito novos casos de regressão.
- `node scripts/verify-source.mjs`: **674 imports internos**, sem caminhos quebrados.
- `tsc --noEmit ... src/lib/creative/async-image-load.ts`: **aprovado** para o novo arquivo sem dependências.
- Chromium: carregou PNG real 2 × 3 px; rejeitou arquivo PNG inválido; e interrompeu uma imagem simulada que não respondia.
- Integridade do ZIP conferida depois do empacotamento.

## Limites de homologação

O build completo `npm run build` não pôde avançar além do `prisma generate`: `prisma: not found` neste ambiente sem `node_modules`. Por isso, **não há homologação de build Next.js nem de fluxos ponta a ponta da V5.10 em Vercel**. Não houve publicação ou mutação dos projetos Vercel, GitHub, Neon e R2.

## Checklist mínimo na `clickteste`

1. Confirmar build TypeScript/Next e páginas do Editor/Studio 3D sem erro.
2. Abrir projeto `.cgdesign` com várias imagens, máscaras e um vídeo; confirmar a recuperação.
3. Testar uma URL de imagem indisponível: o Editor deve apresentar erro após o limite, preservando a arte atual.
4. Corrigir a URL ou importar imagem válida novamente, certificando-se de que o cache aceita nova tentativa.
5. Verificar exportação PNG e MP4 de projetos válidos e reprodução do MP4.
6. Testar nos navegadores Chrome e Edge, inclusive mobile, e verificar desempenho da caneca com ângulos inclinados/deitada.

## Outros pontos ainda abertos

Homologação MP4/WebCodecs real com áudio ausente por projeto, IA com provedor configurado, precisão fotográfica da alça da caneca, PSD/PDF complexos, revisão integral PT/EN/ES e matriz de desempenho/mobile. Sem migração de banco e sem variáveis novas nesta versão.
