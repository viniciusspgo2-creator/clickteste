# Click & Gruda V5.13 — Homologação de requisições do assistente

**Destino:** `clickteste` (staging). **Produção:** não alterada.

## Falha identificada

Na V5.12, a leitura da **resposta do provedor** de IA já possuía prazo de 15 segundos e limite de 16 KiB, mas a leitura da **pergunta recebida pelo endpoint** (`readAssistantBody`) continuava aguardando indefinidamente enquanto uma requisição HTTP fragmentada permanecesse aberta. Um cliente que interrompesse a conexão ou uma conexão de rede instável poderiam deixar uma invocação do endpoint ocupada sem necessidade.

## Mudanças implementadas

- `src/lib/creative/assistant-request.ts`: leitura da pergunta com prazo máximo de **8 segundos para o corpo inteiro**, cancelamento por `request.signal`, rejeição HTTP **408** quando o prazo é excedido ou a requisição é abortada.
- Leitura de JSON mantém limite de **4.096 bytes**, inclusive sem `Content-Length`, com erro **413** e cancelamento da leitura quando o limite é excedido.
- Mantém erros de conteúdo inválido (**400**) e mídia errada (**415**); nenhum arquivo, vídeo, projeto ou credencial é enviado para o provedor externo.
- Cancelamento e limpeza de `reader`, eventos e temporizador após sucesso ou falha.
- `package.json`: o comando `verify:creative` incorpora `tests/v513-assistant-request-timeouts.mjs`.
- Nenhuma alteração de Prisma, Neon, R2, geometria 3D ou configuração de domínio.

## Verificações realizadas (locais)

- **183/183 testes automatizados aprovados** (176 anteriores + 7 novos).
- Casos novos: JSON válido fragmentado, envio sem término, abort de cliente, abort antes da leitura, corpo maior que o limite, JSON/tipo inválido e rota completa retornando HTTP 408 sem consultar o provedor.
- **675 imports internos verificados, sem falha.**
- `tsc --noEmit --strict` do módulo alterado aprovado com bibliotecas DOM/ES2022.
- Integridade do ZIP conferida após empacotamento.

## Limitações e homologação pendente

- **O build completo do Next.js ainda não foi executado neste ambiente**: dependências npm/Prisma não estão instaladas. A correção não deve ser considerada homologada na Vercel apenas pelos testes isolados.
- Não foi testada uma API de IA real; os testes do endpoint usam provedor simulado.
- O rate limiter do endpoint continua por instância, conforme o aviso original. Para acesso público de grande volume, requer persistência/limitação distribuída.
- MP4 end-to-end no navegador, fidelidade visual da alça/cerâmica, PDF/PSD complexos e compatibilidade móvel continuam pendentes.

## Testes recomendados na `clickteste`

1. Confirmar build TypeScript/Next.js pela Vercel e abrir a página do Editor.
2. Com a chave de API configurada, fazer uma pergunta simples e verificar resposta e confirmação de ações, sem transferir dados de imagem ou projeto.
3. Verificar fallback local quando o provedor estiver indisponível; uma pergunta com conexão interrompida não deve deixar o painel preso.
4. Exportar um MP4 em 720p e, se o navegador suportar, outro em 1080p; reproduzir os dois arquivos completos após exportação.
5. Recuperar um `.cgdesign` com mídia local, testar um template e conferir no celular sem sobrescrever projeto existente.

**Deploy:** não executado nesta rodada. ZIP pronto para instalação somente na `clickteste`. Nenhuma migração nem variável de ambiente adicional obrigatória.
