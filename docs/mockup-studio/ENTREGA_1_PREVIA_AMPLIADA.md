> Atualização: após autorização do proprietário, este lote foi publicado na `main` no commit `5805217`. O texto abaixo preserva o relatório original. Para os lotes posteriores, consulte `ENTREGAS_PRIORITARIAS.md`.

# Fase Zero e Entrega 1 — prévia final ampliada

## Escopo e estado

- Origem: branch `main`, commit `14a812052cc6844779ecfb2527a0848e99303660`.
- Trabalho local: `feat/mockup-final-preview-viewer`.
- O checkout estava limpo antes do lote. Não houve commit, push, merge ou deploy.
- Somente a Entrega 1 foi implementada. Entregas 2–6 não iniciadas.
- **Status: Implementado, aguardando validação.** Testes técnicos locais realizados; homologação do proprietário, aparelhos reais e build completo do site permanecem pendentes.

## Diagnóstico confirmado e baseline

`ui/panels.tsx`, em `ImageTab`, já guardava o resultado de `exportImage()` e usava seu Blob no download. A imagem final era exibida em `max-h-80`, dentro de um diálogo estreito. O baseline mediu uma apresentação de 320 × 320 CSS px para uma imagem de 1080 × 1080 px.

Os fluxos de câmera, captura, shader, UV, materiais, projetos e upload foram inspecionados. Não precisaram mudar para ampliar uma imagem já gerada.

Antes da implementação:

- 59 testes existentes de arte, alças, movimento, múltiplas peças, cores e regressões do Studio passaram.
- TypeScript do projeto passou após preparar o cliente Prisma; TypeScript restrito ao Studio passou.
- ESLint: zero erros e cinco avisos preexistentes em `src/components/site/home.tsx` sobre navegação interna.
- `next build`, executado diretamente para não fazer `db push`, falhou ao baixar Geist, Geist Mono e Space Grotesk do Google Fonts. O bloqueio é anterior ao lote.
- O cliente Prisma foi gerado **sem motor, apenas para tipos**. Não foi feita conexão com banco nem alteração de dados.
- Referência visual registrada em Chromium com WebGL por software e componentes reais do Studio. Sem servidor Next, autenticação ou banco de produção; fontes de sistema no harness. Não constitui avaliação de fidelidade de cor ou fotorrealismo.

Existem dois lockfiles com versões diferentes no repositório. Foi usado `npm ci` com o `package-lock.json` existente, sem alterar manifesto ou lockfiles e sem atualização incidental de pacotes. A instalação usou `--ignore-scripts`; o preparo necessário para tipos foi executado separadamente.

## Plano de arquivos e riscos do lote

| Área | Mudança | Risco e proteção |
|---|---|---|
| `ui/panels.tsx` | Importar e inserir o botão/componente após a prévia final | Dois acréscimos; captura e download originais mantidos. |
| `ui/final-preview-viewer.tsx` | Janela ampliada, foco, teclado, toque e URL própria | Dialog do design system; testes de foco, Escape, reabertura e bytes do download. |
| `ui/final-preview-viewer.module.css` e `.d.ts` | Estilo responsivo isolado e declaração para checagem restrita | Sem alterações no CSS global ou nos controles 3D. |
| `lib/preview-view.ts` | Matemática de ajuste, zoom ancorado e limites de pan | Funções puras e seis testes. |
| `tests/` | Harness isolado, testes e fixtures sintéticas | Sem novos endpoints ou hooks de teste no produto. |

Prefixo dos arquivos de produto: `src/components/tools/mockup/`.

## Critérios de aceite e alterações

A ação **Ampliar prévia** aparece somente depois de gerar a prévia final. Ela abre o próprio resultado de exportação, sem refazer captura, sem converter a imagem e sem alterar o tamanho do arquivo.

Controles:

- Ajustar à tela e tamanho real de 100% (um pixel da imagem por CSS pixel).
- Zoom por botões, slider, roda, teclado e pinça.
- Arraste por mouse/toque e pan pelo teclado.
- Reset para ajuste e centralização.
- Dimensões, formato e tamanho do arquivo.
- Fechamento por botão ou Escape, com retorno de foco.
- Download do mesmo Blob exibido.
- Fundo quadriculado para inspeção de transparência e mensagem se a imagem não puder ser exibida.

O visualizador usa estado local. Não importa o store do Studio, não chama `exportImage()` e não modifica os objetos 3D. Possui uma URL por sessão de visualização, liberada ao desmontar; a URL pequena da prévia continua sob responsabilidade do painel original. A captura por pointer, a roda não passiva e o confinamento de foco se restringem à janela.

O foco é restituído explicitamente ao botão de origem. Os eventos de teclado do conteúdo são impedidos de alcançar os atalhos do editor. O Dialog existente controla Escape e navegação modal. Os estilos não introduzem animação no conteúdo e respeitam redução de movimento.

## Testes executados

### Regressões e matemática

Executados diretamente com Node, em vez de contar apenas arquivos descobertos pelo runner:

```sh
node tests/art-quality.mjs
node tests/handle-regressions.mjs
node tests/mockup-movement.mjs
node tests/mockup-multi-scene.mjs
node tests/ceramic-colors.mjs
node docs/mockup-studio/regressions.mjs
node tests/final-preview-view.mjs
```

Resultado: **65 testes passaram**, sendo 59 existentes e seis novos. Nenhuma falha, teste desativado ou assertion removida.

Os testes novos verificam ajuste de proporções, imagem pequena sem ampliação automática, 100%, zoom mantendo o pixel ancorado, limites do pan, valores numéricos inválidos, resize e reset sem mutação das dimensões.

### Tipos e lint

```sh
node node_modules/next/dist/bin/next typegen
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/typescript/bin/tsc -p docs/mockup-studio/tsconfig.studio.json
node node_modules/eslint/bin/eslint.js .
git diff --check
```

Tipos: sem erros. Lint: sem erros novos; permanecem os cinco avisos do baseline. As declarações CSS locais permitem verificar o componente também no escopo restrito do Studio.

### Navegador

Ferramentas isoladas do projeto: Playwright 1.61.1 e esbuild 0.25.12. Nenhuma dependência de aplicação foi adicionada.

```sh
STUDIO_TEST_TOOLS=/workspace/.clicktools-browser \
STUDIO_TEST_OUTPUT=/workspace/.clicktools-validation/final-browser \
node tests/final-preview-browser.mjs
```

O harness compila e monta os componentes reais `MockupStudio`/`ExportDialog` com os CSS existentes e usa o exportador real. Seus contadores e acessos ao store existem apenas no bundle de teste. Não há mocks da captura nem bypass de autenticação inserido no produto.

Verificações:

1. Importação do projeto legado com arte lateral e inferior.
2. Identidade do Blob entre a prévia pequena e a ampliada.
3. 100%, zoom, arraste, roda e teclado sem mudanças na câmera, peças, luz, efeitos, histórico ou configurações; sem nova captura.
4. Confinamento de Tab na janela.
5. SHA-256 e tamanho do download iguais aos do arquivo exibido.
6. Escape fecha somente a ampliação e retorna o foco.
7. Cinco reaberturas sem crescimento da contagem de URLs ativas ou mudança de cena.
8. Layout de 390 × 844, arraste e pinça com eventos de toque do Chromium.
9. Orientação 844 × 390 com fechamento acessível.
10. Importação e restauração IndexedDB de duas peças com artes distintas, base, fundo e HDRI; exportação portátil versão 1 com os assets.

Isso não valida Safari, Firefox ou hardware de celular. A contagem de URLs é uma verificação de ciclo de vida, não medição exaustiva de memória da GPU.

## Evidência visual

- [Antes: diálogo com prévia pequena](preview-evidence/before-export.png).
- [Depois: visualizador desktop](preview-evidence/after-desktop.png).
- [Depois: visualizador móvel](preview-evidence/after-mobile.png).

As imagens usam somente artes sintéticas. Servem para comparar área de visualização, controles e responsividade. Não são golden tests de pixels WebGL nem aprovação estética do produto. A igualdade de arquivo é verificada **na mesma sessão**, por identidade do Blob e SHA-256 do download.

## Compatibilidade e preservação

- Sem campos novos no estado do projeto, IndexedDB ou formato `.cgstudio`.
- Sem alterações em `baseImageId`, `baseRotation`, herança, duplicação ou undo/redo.
- Sem alterações no renderer, câmera, shader, UV, geometria ou textura inferior.
- Sem mudanças em banco, admin, comunicados ou autenticação.
- Sem alterações nos manifestos e lockfiles.
- A prévia pequena e o botão original de confirmar/baixar permanecem como fallback.
- PNG foi exercitado com exportação real no navegador. Os caminhos JPEG/WebP não mudaram, mas não foram submetidos a uma nova matriz visual completa neste lote.
- As fixtures incluem transparência, linhas finas, texto, cores saturadas, cinzas, preto/branco, projeto legado e projeto portátil com assets. O HDRI é sintético, não referência fotográfica.

## Riscos e limitações

- Build completo continua dependente do acesso ao Google Fonts. Não houve troca de fonte, mock para declarar build aprovado, mudança de tone mapping ou configuração global.
- Banco, APIs de acesso/admin e testes que exigem PostgreSQL não foram executados; estão fora da Entrega 1.
- Capturas em Chromium usam SwiftShader e fontes de sistema no harness. Homologar no site completo e em aparelhos reais antes de publicar.
- Houve um teste inicial com timeout de compilação WebGL por software e uma verificação imediata de foco que falhou. O timeout foi ajustado para esse ambiente; o retorno de foco passou a ser explícito e o teste aguarda a conclusão do ciclo de fechamento. Nenhuma verificação foi removida. Na checagem de persistência, um fundo SVG da fixture não foi decodificado pelo carregador existente; a fixture foi corrigida para PNG, formato já suportado, sem mudar o importador.
- 100% representa pixels CSS, não tamanho físico garantido em monitores com densidades diferentes.

## Flags, release gradual e reversão

Não há feature flag nova: trata-se de uma ação adicional, acionada pelo usuário, com fallback original preservado. Não há ativação automática nem alteração silenciosa de projetos.

Para desativar o lote, retirar somente o import e a montagem de `FinalPreviewViewer` em `ui/panels.tsx`. Os arquivos novos ficam sem uso. Para uma reversão completa, remover apenas os arquivos novos deste lote após preservar alterações posteriores. Não usar reset/limpeza global.

Não existe migração nem dado novo a apagar. Reverter o código não exige excluir projetos locais.

Plano de release: branch local → revisão do diff e homologação → preview autorizado → inspeção em aparelhos reais → autorização explícita do proprietário para produção. Nada foi publicado neste lote.

## Checklist de homologação

- [ ] Aprovar aparência e texto do visualizador.
- [ ] Validar no site completo com fontes e acesso reais.
- [ ] Validar toque em Android/iOS e teclado em desktop.
- [ ] Conferir PNG com alfa sobre branco/preto e JPEG/WebP.
- [ ] Conferir saídas grandes, retrato/paisagem e zoom a 100%.
- [ ] Confirmar fluxo normal de exportação e restauração de foco.
- [ ] Autorizar separadamente eventual preview/deploy.

## Resumo por fase

| Fase | Status |
|---|---|
| Fase Zero | Baseline registrado; restrições de build e ambiente documentadas. |
| Entrega 1 | Implementada localmente, testes técnicos realizados, aguardando homologação. |
| Entrega 2 — navegação/formatos | Não iniciada. |
| Entrega 3 — Bocão | Não iniciada. |
| Entrega 4 — exportação | Não iniciada. |
| Entrega 5 — realismo | Não iniciada. |
| Entrega 6 — comunicados | Não iniciada. |
