# Click & Gruda V5.8 — Importações assíncronas seguras

**Destino:** somente `clickteste` / staging. **Nenhuma alteração de banco, migração ou deploy foi realizada.**

## Problema confirmado pela leitura do código

Na V5.7, a recuperação de projetos e o carregamento de templates inteligentes já verificavam se a composição original permanecia atual. Entretanto, outros carregamentos assíncronos, como imagens comuns, máscaras personalizadas, fontes e arquivos PDF/PSD, podiam terminar **depois de um reset ou de a abertura de outro projeto**, aplicando resultados antigos à nova arte.

O mesmo valia para buscas de assets do painel: uma requisição antiga podia chegar depois de uma busca mais recente e substituir os resultados na tela.

## Correções implementadas

1. `src/lib/creative/document-session.ts`: novo contador local de sessão da composição. Edições normais não o alteram; a abertura/reinicialização/substituição da composição o invalida. Não acessa API ou IndexedDB.
2. `src/components/creative/creative-editor.tsx`:
   - Imagens aguardam decodificação e só entram no documento quando a sessão capturada ainda estiver válida.
   - Upload local de imagens, máscaras e MP4 preserva a sessão original durante a leitura; resultados atrasados não aparecem num documento substituído.
   - Importações de PDF e PSD verificam se a sessão ainda é a mesma antes de oferecer a substituição da arte; a entrada efetiva gera uma sessão nova.
   - Fontes assíncronas não alteram projetos novos; para texto existente, a alteração é aplicada ao ID que o usuário havia escolhido quando começou a carregar a fonte.
   - Reset, restauração local, abertura de `.cgdesign`, troca de layout, escolha de template inteligente e recuperação do rascunho inicial invalidam imports antigos.
   - A transferência mockup → Editor mantém suporte ao caso de URL com preset e `from=mockup`, e cancela uma transferência atrasada se outro projeto tiver sido aberto.
   - Resultado de busca antiga da biblioteca não substitui uma consulta nova.
3. `tests/v58-import-session.mjs`: dez testes de regressão, incluindo cenários assíncronos simulados, rotas de substituição, uploads e diagnóstico sintático de TS/TSX.
4. Os testes antigos das versões V5.4 e V5.6 foram adequados às novas chamadas de invalidação sem afrouxar suas verificações principais.

## Validação executada

| Verificação | Resultado |
|---|---|
| `npm run verify:creative` | **140 de 140** testes automatizados aprovados |
| `node scripts/verify-source.mjs` | **270 arquivos de código, 672 imports locais, 0 problemas** |
| `tsc --noEmit --strict ... src/lib/creative/document-session.ts` | Aprovado, apenas no novo módulo independente |
| Parser TypeScript para `creative-editor.tsx` e `document-session.ts` | Sem erros sintáticos |
| `npm run build` | Não concluído. Falha em `prisma: not found` porque as dependências não estão instaladas no ambiente local. Não comprova o build Next.js/TypeScript integral. |
| Testes reais de browser para upload tardio após reset | Ainda não executados na V5.8. A cobertura desta rodada é automatizada e simulada. |

## Checklist manual na `clickteste`

1. Importe uma imagem grande e pressione **Resetar projeto** antes de terminar a importação. A imagem antiga não deve reaparecer na arte nova.
2. Importe uma máscara, mude de projeto durante a leitura e confirme que ela não aparece no documento recém-aberto.
3. Escolha uma fonte remota para um texto, abra outro projeto antes de o download terminar e confirme que o texto do novo projeto não se altera.
4. Importe PSD/PDF pesado, abra outro projeto antes de terminar e confirme que o antigo não o substitui.
5. Alterne rapidamente a busca da biblioteca, confirmando que aparecem os resultados da última consulta.
6. No fluxo Studio Mockup 3D → Editor, teste com e sem preset na URL. Confirme que a caneca chega ao Editor e mantém suas proporções.
7. Confirme `npm ci`, `npx prisma generate`, `npx tsc --noEmit` e `npm run build` no GitHub Actions ou Vercel; sem essa etapa, a versão permanece não homologada.

## Pendências para a homologação geral

- Build completo com todas as dependências instaladas e teste end-to-end em desktop/mobile.
- MP4 por WebCodecs: codificação, cancelamento e reprodução reais em navegadores-alvo.
- Agente de IA: testes de API, respostas e confirmação de ações.
- Studio 3D: alça, brilho cerâmico, iluminação e sombras comparados com referência física.
- PDFs/PSDs complexos e tradução completa PT/EN/ES.

**Não aplicar diretamente à produção.** O projeto original e seus bancos permanecem inalterados.
