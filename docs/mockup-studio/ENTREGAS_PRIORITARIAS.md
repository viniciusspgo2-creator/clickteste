# Continuidade — melhorias prioritárias do Studio

## Publicação e escopo

A Entrega 1 foi autorizada e enviada à `main`: commit `5805217`.
A confirmação é do GitHub; o resultado do deploy Vercel não foi consultável neste ambiente.

Os lotes seguintes foram implementados em `feat/mockup-final-preview-viewer`, sem alteração de dados de produção, shader, UV lateral, geometria principal, dependências ou lockfiles. São candidatos à homologação, não uma afirmação de que todas as fases foram aprovadas em produção.

## Lote de navegação e Bocão — `e8d45df`

Antes: arte da base estava dentro de duas seções recolhidas e tinha apenas rotação.
Depois:

- Painel visível **Arte da base — Bocão** nas propriedades da peça, sem duplicar o controle antigo.
- Upload/substituição, remoção, escala, posição horizontal/vertical, centralização, reset e rotação.
- **Ver parte inferior** usa a peça existente e uma vista de inspeção; **Voltar à vista anterior** restaura pose e câmera salvas. Não foi criado preset estético de composição.
- Respeita bloqueio e edição da peça selecionada; mantém a imagem lateral independente.
- Campos `baseScale`, `baseOffsetX`, `baseOffsetY` opcionais. Ausentes: escala 1 e posição central, reproduzindo projetos antigos.
- Transformações passam pelo histórico existente; os snapshots e serializers já preservam os novos campos opcionais.
- Recorte segue o disco real de cada modelo, sem mudança na geometria.
- Formatos concretos na barra inferior: 1:1, 4:5, 9:16, 16:9 e acesso a personalizado. Reutiliza `exportSettings`; não desenha máscara falsa nem altera a câmera ao escolher uma saída.

Arquivos: `ui/base-art-panel.tsx`, `ui/output-format-control.tsx`, `ui/print-layers-panel.tsx`, `ui/workspace.tsx`, `state/store.ts`, `scene/mug.tsx`, `lib/base-art.ts`. Prefixo: `src/components/tools/mockup/`.

Limitações: os controles e as propriedades foram validados tecnicamente; o proprietário ainda deve homologar posicionamento/visualização em todos os modelos e aparelhos. Não há referência fotográfica do Bocão nem preset de composição aprovado.

## Lote de comunicados — `35d6925` e correção de interação posterior

- Nova seção **Comunicados** no admin: listar, criar, editar, pré-visualizar, ativar/desativar, agendar e encerrar.
- Título, mensagem em texto simples, tipo, URL de imagem opcional, botão, início/fim, público, prioridade, repetição e status.
- Autorização administrativa no servidor e verificação de origem em gravações.
- Validação Zod, limites de texto/payload e bloqueio de URLs perigosas. Não aceita HTML ativo ou chave administrativa no frontend.
- Revisão otimista evita sobrescrever uma edição concorrente.
- Persistência aditiva em chaves `studio-announcement:<uuid>` da tabela **SiteConfig já existente**. Não exige migração nem nova tabela.
- API do Studio exige sessão válida e retorna somente itens vigentes do público autorizado.
- Público inicial: usuários autenticados do Studio, Biblioteca ou Studio temporário; sem distribuição para anônimos.
- Um aviso discreto por vez, sem modal ou foco automático. Espera inatividade e fica oculto durante edição, projetos, exportação e ajuda.
- Consulta ao carregar, retomar foco e a cada 60 segundos; sem WebSocket.
- Fechamento: uma vez por versão, uma vez ao dia em São Paulo ou a cada visita.
- Repetição é persistida **por navegador**, não uma sincronização por conta entre dispositivos. Se o armazenamento local falhar, o fechamento vale para a visita atual.
- Botões abrem links em outra aba com `noopener noreferrer`, preservando a edição.
- Imagem opcional usa URL validada; não foi criado outro serviço de upload.
- Falha de rede ou banco não impede editar/exportar.

Flag: `STUDIO_ANNOUNCEMENTS_ENABLED = true` em `src/lib/features.ts`. Desativá-la oculta o cliente e faz a API retornar lista vazia, sem apagar comunicados. O catálogo separado de cenários mantém sua flag original.

Arquivos: `src/lib/announcements/`, `src/app/api/admin/announcements/route.ts`, `src/app/api/announcements/route.ts`, `src/components/admin/announcements-panel.tsx`, `src/components/tools/mockup/ui/studio-announcements.tsx`, integração em `admin-app.tsx` e `mockup-studio.tsx`.

Limitação: testes de endpoints usam armazenamento simulado; não foi possível exercer o PostgreSQL real ou autenticação real de produção neste ambiente. Não se deve declarar essa homologação concluída.

## Lote de qualidade inferior — `7938495`

Antes: textura inferior fixa em 1024 px mesmo na exportação.
Depois:

- `renderBaseArt()` centraliza a composição inferior e desenha sempre da fonte original retida.
- Durante captura, as texturas inferiores usam resolução adaptada à saída, limitada à GPU, a 4096 px e a um orçamento compartilhado de pixels (2 milhões no mobile; 8 milhões no desktop).
- Dispositivos/quantidades limitados podem usar resolução menor; ampliar não recupera detalhes ausentes na fonte.
- As imagens das texturas originais são guardadas e restauradas em `endFrames`, também chamado pelo caminho de falha existente.
- Reutiliza a sessão e o bloqueio de captura; não substitui a arquitetura, não descarta texturas compartilhadas e não muda tone mapping ou alfa.
- A interface esclarece que o enquadramento da exportação é automático. O comportamento de projetos anteriores continua igual; não foi criada uma opção não testada de câmera exata.

Arquivos: `lib/base-art-canvas.ts`, `scene/mug.tsx`, `exporters/frame-capture.ts`, `ui/panels.tsx`.

## Testes executados

76 testes passaram com execução direta dos arquivos Node:

```
node tests/art-quality.mjs
node tests/handle-regressions.mjs
node tests/mockup-movement.mjs
node tests/mockup-multi-scene.mjs
node tests/ceramic-colors.mjs
node docs/mockup-studio/regressions.mjs
node tests/final-preview-view.mjs
node tests/base-art.mjs
node tests/announcements.mjs
```

Incluem compatibilidade legada, independência da arte inferior, limites de resolução/memória, desenho a partir da fonte original, permissões, URLs maliciosas, validade, segmentação, repetição e conflito de edição.

Tipos: `tsc --noEmit --incremental false`, sem erros.
Lint: zero erros; cinco avisos preexistentes em `site/home.tsx`.
`git diff --check`: sem erros.

Navegador (ferramentas fora das dependências do aplicativo):

```
STUDIO_TEST_TOOLS=/workspace/.clicktools-browser node tests/final-preview-browser.mjs
STUDIO_TEST_TOOLS=/workspace/.clicktools-browser node tests/announcements-browser.mjs
```

As 10 verificações do Studio passaram após a mudança de captura: arquivo idêntico ao da prévia ampliada, nenhuma captura adicional ao navegar, foco/Escape, toque e pinça, reabertura sem crescimento de URLs, projetos legados, IndexedDB e portátil com base/fundo/HDRI.

O teste de comunicados passou em Chromium móvel: adiado durante exportação, sem roubar foco, fechamento persistente e formulário/prévia administrativos. Essa API foi simulada; o teste não substitui PostgreSQL real.

Foi corrigida uma falha encontrada pelo teste: a interação global de atividade não pode esconder o aviso antes de seu próprio botão de fechar receber o clique.

## Fase de realismo: avaliação, sem alteração automática

Não foi criada receita de material, trocado tone mapping ou modificado shader de cor fiel. Ainda faltam referência fotográfica do proprietário e comparação visual aprovada. Os acabamentos existentes foram preservados. As capturas sintéticas são referência técnica, não prova de fidelidade física ou fotorrealismo.

## Pendências e status

| Parte | Status |
|---|---|
| Prévia ampliada | Enviada à main; deploy não confirmado. |
| Formatos e Bocão | Implementados localmente, aguardando homologação visual. |
| Qualidade inferior | Implementada; regressões técnicas e captura em Chromium passaram. |
| Comunicados | Implementados; testes de regras, rotas simuladas e interface passaram; banco real pendente. |
| Realismo / novos presets | Avaliação pendente de referência e aprovação; sem alteração de shader. |
| Build completo | Baseline bloqueado por download das fontes Google, sem troca incidental de fonte. |

## Rollback e release

Os lotes têm commits separados. Reverter apenas o lote desejado, preservando trabalho posterior e sem reset/limpeza global. Desativar comunicados pela flag não remove dados; reverter código também não exige apagar chaves do SiteConfig ou projetos dos usuários.

Antes de levar os novos lotes à produção: homologar Bocão em todos os modelos, aviso com sessão real, agendamento/expiração, banco real, JPEG/WebP e aparelhos reais. Conferir build em ambiente com fontes e motores Prisma disponíveis. Não desativar verificação de TLS, checksum ou testes para publicar.
