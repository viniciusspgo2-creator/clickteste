# Click & Gruda V5.7 — Segurança de rascunhos e revisão de homologação

**Destino:** `clickteste` (staging). **Nenhum deploy, alteração na produção ou migração de banco foi realizado.**

## Problemas identificados e corrigidos

1. **Rascunho automático ressuscitando após Resetar:** o IndexedDB pode concluir uma gravação antiga depois do comando de exclusão. Foi criada a classe `DraftWriteQueue`, que serializa gravações e exclusões, invalida operações pendentes de gerações anteriores e garante que a exclusão ocorra *depois* de uma gravação já iniciada. Também é acionada ao abrir ou restaurar outro projeto.
2. **Restauração inicial sobrescrevendo trabalho:** se a leitura do rascunho demorasse, o Editor podia aplicá-lo mesmo depois de o usuário começar a trabalhar. Agora a aplicação verifica a identidade da composição original e o número da solicitação mais recente antes de alterar o histórico.
3. **Rascunho com imagens ou máscaras inacessíveis:** a restauração inicial passou a validar as mídias, como a abertura manual de projetos já fazia. Uma imagem ou máscara corrompida impede substituir a arte atual; um vídeo incompatível apenas gera aviso. URLs temporárias `blob:` antigas não são tratadas como recuperáveis.

## Alterações no código

- `src/lib/creative/draft-write-queue.ts`: fila serializada de gravações com gerações e invalidação de operações obsoletas.
- `src/components/creative/creative-editor.tsx`: uso da fila no salvamento automático, reset e importação/restauração de projetos; validação e proteção da restauração na montagem inicial.
- `tests/v57-draft-race.mjs`: seis regressões novas, cobrindo edição concorrente, fila obsoleta, operações pendentes durante reset, recuperação de falha e proteção de startup.
- `tests/v57-browser.py`: prova isolada no Chromium com execução assíncrona e fila de gravação simulada (não é teste do IndexedDB real).
- `package.json`: testes V5.7 incluídos em `npm run verify:creative`, que também roda na CI do GitHub.

## Verificações executadas

| Verificação | Resultado |
|---|---|
| `npm run verify:creative` | **130/130** testes aprovados |
| `node scripts/verify-source.mjs` | **269 arquivos, 671 imports, zero ausentes** |
| `tsc --noEmit --strict ... draft-write-queue.ts` | **Aprovado** (tipagem do módulo isolado) |
| Chromium isolado: corrida reset ↔ gravação ↔ novo projeto | **Aprovado** com gravador assíncrono simulado |
| IndexedDB real no Chromium isolado | **Não testado**: navegação/origem necessárias bloqueadas pelo ambiente |
| `npm run build` | **Não concluído**: executou a verificação interna, parou em `prisma: not found` porque as dependências npm estão ausentes |
| Vercel `clickteste` | Consultados os 2 deployments mais recentes no momento da revisão; ambos tinham status **READY**, porém **não são um deploy da V5.7** e não comprovam seu build |

## Checklist da `clickteste` após instalar

1. Abra o Editor e crie uma arte. Aguarde o salvamento automático. Recarregue e confira que o rascunho foi restaurado.
2. Edite e clique **Resetar projeto** logo após um salvamento: recarregue e confirme que a arte anterior não reaparece.
3. Abra um `.cgdesign` ou projeto do Histórico Local enquanto houver um rascunho ativo e confira que o projeto novo permanece após recarregar.
4. Num navegador com CPU/armazenamento lento, altere a arte enquanto o Editor ainda restaura um rascunho; a alteração recente não deve ser substituída.
5. Importações com imagem/máscara inacessível devem preservar a composição atual e exibir aviso.
6. Execute o build TypeScript/Next.js da V5.7 via check GitHub Actions ou Vercel; depois valide MP4 Full HD, IA via API, Studio 3D e mobile.

## O que ainda impede homologação final

- Build Next.js e checagem TypeScript **com todas as dependências instaladas**, referentes à versão V5.7.
- Execução end-to-end de rascunhos e IndexedDB no site real, especialmente mobile e concorrência entre abas.
- MP4/WebCodecs com codificação, reprodução, desempenho e cancelamento reais.
- Assistente IA conectado à API, incluindo autorização, respostas e confirmação de ações.
- Comparação física/visual da alça, cerâmica, iluminação e sombras no Studio 3D.
- Compatibilidade com PDF/PSD complexos e revisão de PT/EN/ES em toda a interface.

**Sem novas variáveis de ambiente ou migrações Prisma.** Não altere a aplicação de produção antes de concluir a homologação na `clickteste`.
