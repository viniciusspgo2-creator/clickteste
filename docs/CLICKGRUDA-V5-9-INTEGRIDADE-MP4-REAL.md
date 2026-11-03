# Click & Gruda V5.9 — Inspeção de dados de vídeo MP4

**Alvo de instalação: somente o projeto `clickteste` (staging).** Nenhuma alteração foi feita no banco Neon, nas variáveis de ambiente ou na plataforma publicada. Nenhum deploy foi executado nesta entrega.

## Defeito encontrado

O validador da V5.8 exigia estrutura MP4, codec AVC, resolução e a quantidade de amostras da tabela `stsz`. Entretanto, a tabela podia declarar a quantidade correta de quadros mesmo quando os offsets/tamanhos apontavam para bytes fora da área `mdat`. Isso poderia permitir download de um arquivo truncado ou estruturalmente incoerente.

## Correções implementadas

- `src/lib/creative/mp4-integrity.ts`: cruza tamanhos de amostras (`stsz`), agrupamento em chunks (`stsc`), localização (`stco` ou `co64`) e os limites de dados reais de vídeo (`mdat`). Rejeita tabela incompleta, offsets inconsistentes, chunks fora de `mdat`, tamanhos zerados, falta ou excesso de amostras e offsets de 64 bits inseguros.
- `src/lib/creative/video-templates.ts`: só notifica progresso 100% **depois** da validação de integridade e de uma última verificação de cancelamento.
- `tests/v59-mp4-sample-integrity.mjs`: oito testes adicionais, incluindo MP4 real, MP4 legítimo com `moov` após `mdat`, tamanhos e offsets adulterados, mapas de chunk inválidos e sequência de finalização.
- `tests/fixtures/smoke-moov-last-h264.mp4`: arquivo compacto de referência H.264 com estrutura alternativa.
- `package.json`: inclui a nova bateria no `verify:creative`.

## Validação nesta rodada

| Verificação | Resultado |
|---|---|
| `npm run verify:creative` | **148/148 testes passaram** |
| `node scripts/verify-source.mjs` | **270 arquivos de código, 672 imports locais, zero problemas** |
| `tsc --noEmit --strict --skipLibCheck --target ES2017 --lib DOM,ESNext src/lib/creative/mp4-integrity.ts` | Aprovado para o módulo alterado |
| `ffprobe` e decodificação com `ffmpeg` nos três vídeos H.264 de referência | Aprovados: 320×180/24 quadros, 1920×1080/30 quadros, 320×180/24 quadros com `moov` no final |
| `npm run build` | **Não executado por completo**; abortou em `prisma: not found` após a verificação de imports, porque as dependências não estão instaladas neste ambiente |
| Exportação WebCodecs real no site | **Não homologada**: dependências do Next não instaladas localmente e exportação em navegador de destino ainda precisa ser testada |

## Checklist da `clickteste`

1. Publicar **apenas** no projeto de testes, aguardar o build TypeScript e conferir os logs. Não alterar bancos ou projeto de produção.
2. No Editor, importar um MP4 de até 20 s; usar o diagnóstico, exportar em 720p/24fps e abrir o arquivo no navegador e num player externo.
3. Repetir em 1080p/30fps, com uma máscara de caneca e texto animado; conferir duração, resolução, cores, ausência de quadros pretos e posições dos elementos.
4. Cancelar a exportação durante codificação e durante finalização; nenhum download incompleto deve ser iniciado.
5. Tentar MP4 com origem externa sem CORS: deve apresentar erro explicativo em vez de entregar arquivo inválido.
6. Confirmar responsividade no celular, memória e temperatura em exportações longas; a opção HD permanece a mais leve.

## Limites e próximo foco

A verificação reforçada confirma a *consistência das tabelas e dos bytes de amostras*, **não decodifica todo o H.264 nem garante qualidade visual**. A homologação final continua dependendo de reproduzir o MP4 exportado de verdade, testar o agente de IA com API configurada, confirmar a fidelidade da alça/cerâmica no Studio 3D, PDF/PSD complexos, i18n e navegador mobile. Esses pontos não foram resolvidos pela V5.9.
