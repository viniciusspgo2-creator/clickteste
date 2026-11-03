# Click & Gruda V4.1 — Relatório de evolução e validação

## Base e escopo
- Origem: V4.0, cópia separada para `clickteste`.
- Sem migrações Prisma, alterações no Neon ou mudanças em variáveis Vercel.
- Uploads do cliente continuam no navegador.

## Implementado
1. **Video MP4**: corrigido cálculo de exportação para aproveitar 1280 × 720 em vídeos horizontais (a V4.0 exportava horizontal em resolução inferior); vídeos verticais respeitam o teto de 720 px de altura. Controle `Preencher (cortar bordas)` ou `Mostrar inteiro`, aplicado à prévia HTML e ao renderizador H.264; configuração salva no projeto `.cgdesign`. Reprodução recomeça no trecho definido pelo usuário.
2. **Templates inteligentes**: encaixe centralizado com proporção preservada nos presets 90, 100 e 110%, sem remover máscara do mockup.
3. **Studio 3D**: ajuste fino da alça de referência baseado na única foto frontal enviada; curvas mais discretas e seção oval afinada. Sombra ambiente difusa com uma segunda penumbra de contato de intensidade limitada. Não foi alterado o perfil clássico; o perfil Live Sub segue uma aproximação 3D, não uma digitalização de precisão.
4. **Assistente**: o painel informa se a chave de IA está configurada ou se está no guia local. Uma rota GET de status retorna apenas booleano `aiEnabled`, sem credenciais, mensagens de projetos ou imagens.

## Verificação
- `node scripts/verify-source.mjs`: verifica sintaxe e resolução dos imports internos.
- `node --test tests/v36-feature-checks.mjs tests/v37-feature-checks.mjs tests/v38-stability.mjs tests/v39-layers.mjs tests/v40-realism-print-template.mjs tests/v41-video-glaze-template.mjs`.
- `npm run build`: **não homologado** neste ambiente sem a instalação integral de `node_modules`. Validar na Vercel.

## Testes manuais obrigatórios antes de produção
- No Chrome/Edge em HTTPS, enviar caneca ao Editor, trocar o template inteligente, testar máscara e encaixes 90/100/110%.
- Com vídeo **horizontal**, exportar MP4 e conferir 1280×720 quando o template tiver proporção 16:9; com vídeo vertical, confirmar enquadramento sem deformação nos dois modos.
- Verificar o vídeo com 0,5–2 segundos de corte inicial e final: prévia e exportação devem coincidir; o MP4 atual é propositalmente **sem áudio**.
- Conferir 3D com caneca em pé, deitada, inclinada e com duas canecas, iluminação escura/clara e transparência na transferência.
- Verificar o assistente com/sem `OPENAI_API_KEY` e executar uma ação apenas após confirmação explícita.
- Conferir tempos de carga, memória e imagens em desktop e celular.

## Limitações declaradas
- O modelo da alça foi estimado por apenas uma foto frontal; não há precisão milimétrica garantida sem vistas adicionais e medidas.
- Exportação de vídeo H.264 precisa de WebCodecs compatível no navegador e continua sem áudio.
- O assistente depende de API externa configurada; a indicação de status não equivale a teste de geração real.
- Ainda falta compilação Next.js completa e validação visual ponta a ponta em deploy.
