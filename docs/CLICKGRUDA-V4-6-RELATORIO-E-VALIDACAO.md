# Click & Gruda V4.6 — relatório de staging

Base: V4.5. Destino recomendado: **somente clickteste**.

## Implementado

1. **Alça 325 ml (estilo `livesub`)**: seção transversal progressiva na curva da alça; raízes mais finas dentro da parede da caneca, transição suave e região de pegada levemente reforçada. Os outros estilos não foram alterados. A forma continua sendo uma **aproximação fotográfica**, não digitalização exata.
2. **Assistente**: últimas quatro perguntas válidas, apenas texto, são consideradas como contexto em cada nova resposta; nenhum projeto, imagem, arquivo, fonte ou senha é incluído. O servidor limita e higieniza o histórico recebido; as ações seguem dependentes de confirmação e do módulo permitido.
3. **Exportador MP4**: ao buscar um quadro, não confunde vídeo ainda em movimento (`seeking`) com um quadro pronto; ao finalizar, não tenta fechar um encoder que já esteja fechado. A exportação original segue em MP4/H.264, 720p máximo e sem áudio, conforme navegador.
4. **Regressões**: testes atualizados para verificar a nova seção da alça; introduzidos testes V4.6 para alça, agente e quadros do vídeo.

## Arquivos principais alterados

- `src/components/tools/mockup/lib/reference-handle-section.ts` (novo)
- `src/components/tools/mockup/scene/mug-geometry.ts`
- `src/lib/creative/assistant-history.ts` (novo)
- `src/components/creative/studio-concierge.tsx`
- `src/app/api/creative-assistant/route.ts`
- `src/lib/creative/video-templates.ts`
- `tests/v43-reliability.mjs`
- `tests/v37-feature-checks.mjs`
- `tests/v46-realism-video-assistant.mjs` (novo)
- `package.json`

## Validação executada

- `npm run verify:creative`: **66/66 testes aprovados**.
- `node scripts/verify-source.mjs`: **260 arquivos de código, 657 imports locais, 0 problemas**.
- `npm run build`: verificações preliminares passaram; interrompido em `prisma: not found` porque as dependências npm não estão instaladas no ambiente de trabalho. **Não é um build homologado.**

## Para testar na Vercel

1. Atualize só o repositório de staging (`clickteste`) com o conteúdo da pasta `clicktools-main`.
2. Confirme o build TypeScript/Next.js completo, sem nova migração de banco.
3. Studio 3D: compare a alça **Referência 325 ml** com a foto em frente, lateral e três quartos; confira interior, raízes e sombra no fundo claro/escuro.
4. Assistente: com chave de API configurada, faça duas perguntas encadeadas e confirme que o contexto é respeitado; sem chave, verifique o guia local. Teste confirmação de ações e bloqueio entre módulos.
5. Editor: importe MP4 local, verifique os quadros e exporte em H.264 no Chrome/Edge em HTTPS; valide as bordas do vídeo e a reprodução do arquivo final.
6. Desktop e mobile: testes manuais de interação, exportação, persistência e reset.

## Não concluído nesta rodada

- Fidelity exata 3D da alça sem fotos laterais e medidas físicas.
- Homologação real de IA com provedor, exportação MP4 em todos os navegadores e build Next.js final.
- Edição total de PSD/PDF complexos.

Os arquivos de clientes continuam locais, conforme o Editor; nenhuma migração Prisma foi introduzida. A plataforma publicada original não foi modificada.
