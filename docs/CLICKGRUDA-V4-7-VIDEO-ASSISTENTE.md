# Click & Gruda V4.7 — robustez do MP4 e assistente

**Base:** V4.6. **Destino:** somente staging `clickteste`. Nenhuma alteração de schema Prisma, Neon ou armazenamento.

## Alterações efetivas

### Exportador MP4/H.264

- Configuração explícita `avc: {format: "avc"}` para preservar compatibilidade com o contêiner MP4. Incluído perfil Baseline 3.0 (`avc1.42001e`) antes dos perfis já existentes. Referência técnica: [W3C WebCodecs AVC Registration](https://www.w3.org/TR/webcodecs-avc-codec-registration/).
- Compatibilidade do codificador verificada antes de carregar e decodificar o vídeo inteiro. A exportação continua limitada a 20 s, 24 fps, 1280×720 e sem áudio.
- Flush do codificador possui cancelamento e timeout de 20 s. Se o dispositivo travar na codificação, apresenta erro e não salva um arquivo parcial.
- A exportação checa a quantidade efetiva de quadros codificados versus quadros solicitados. Se faltarem quadros, **não finaliza o arquivo MP4**. O resultado vazio também é recusado.
- Erros retornados pelo muxer passam a interromper a exportação antes de salvar.

### Guia inteligente

- Perguntas sequenciais cancelam a requisição anterior. Uma resposta atrasada não pode mais sobrescrever a pergunta mais recente, nem reativar ações antigas.
- Ações propostas pelo assistente passam por uma lista de ações permitidas para o módulo atual no **cliente**, além da restrição já existente na API.
- Quando a chave da API não está configurada, o guia local responde imediatamente sem efetuar POST desnecessário. O texto de ajuda geral tem versões em PT/EN/ES.
- Perguntas continuam sendo texto; imagens, projetos e uploads do cliente não são transmitidos ao serviço de IA pelo assistente.

## Arquivos alterados

- `src/lib/creative/video-templates.ts`
- `src/components/creative/studio-concierge.tsx`
- `tests/v42-export-integrity.mjs` (expectativa dos perfis atualizada)
- `tests/v47-assistant-video-reliability.mjs` (novo)
- `package.json` (`verify:creative` inclui novos testes)
- `CHANGELOG.md` e este documento

## Validação feita

- `npm run verify:creative`: **70/70 testes Node passaram**.
- `node scripts/verify-source.mjs`: **260 arquivos de código e 657 imports internos, sem ausências**.
- `npm run build`: **não homologado localmente**, encerrado em `prisma: not found` devido às dependências não instaladas neste ambiente.
- Teste real H.264/WebCodecs e IA com API externa **não realizados** neste ambiente. Testes usando dublês de `VideoEncoder`, muxer e `video` verificam negociação de formato, rejeição de quadros incompletos, timeout e cancelamento; não comprovam reprodução de um MP4 real.

## Checklist de aceitação na clickteste

1. Instalar o ZIP completo na cópia de testes. Confirmar build e verificar importações e tipagem do Next.js.
2. Abrir o Editor no Chrome/Edge atualizado em HTTPS. Importar MP4 local curto; exportar e verificar **duração, primeira/última cena, ausência de áudio e reprodução do MP4**.
3. Testar um vídeo com elementos estáticos e animados. Confirmar que máscaras e fontes mantêm a mesma aparência entre a prévia e a exportação.
4. Cancelar exportação durante a codificação. Confirmar que nenhum download parcial aparece.
5. Se disponível, configurar `OPENAI_API_KEY` somente na Vercel de testes. Enviar duas perguntas em sequência rápida: a resposta mais antiga não deve substituir a mais recente. Confirmar uma ação permitida e tentar solicitar ação de outro módulo (deve ser bloqueada).
6. Repetir no celular, sabendo que nem todo navegador suporta H.264 via WebCodecs.

## O que ainda não é 100%

A calibração fotográfica milimétrica da alça, a exportação MP4 com áudio, a edição de PSD/PDF complexos e os testes integrados de produção seguem pendentes. A versão deve permanecer em **staging** até passar pelos testes no navegador.
