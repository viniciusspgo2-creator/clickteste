# Click&Gruda — Auditoria técnica do Mockup Studio 3D

**Fase 1 — 25 de outubro de 2026**  
**Base:** `clicktooools.zip`, 10 capturas de tela enviadas, `Markdown colado(2).md`, `DIAGNOSTICO_MOCKUP_STUDIO.md`, `GUIA_ATUAL.md`, `ESPECIFICACAO_FUNCIONAL_RAPIDMOCKUP.md`, `EXPORTACAO-ALFA.md` e arquivos-fonte indicados pelo agente.  
**Natureza:** análise estática do código. O projeto **ainda não foi modificado**; é a entrega da fase de auditoria, conforme as instruções fornecidas pelo proprietário.

## 1. Resumo executivo

O ZIP contém os módulos que o agente descreve. O Studio atual já possui uma base funcional avançada (upload, modelo 3D, canecas em grupo, impressão, fundos, projeto salvo e vários formatos de exportação). Não é necessário recomeçar do zero: a abordagem mais segura é **reorganizar e melhorar a arquitetura existente**, preservando a compatibilidade dos projetos dos clientes.

Problemas confirmados na inspeção:

1. **Vídeo limitado a 10 s**: o slider em `ui/panels.tsx:1923-1931` define `max={10}`; o tipo em `state/store.ts:203-209` documenta `3..10`. Novo requisito solicitado: **até 20 segundos**, em MP4 e WebM com transparência, incluindo fallback. O GIF tem limite independente e NÃO deve ser alterado por acidente.
2. **Vídeo sem 4K**: apenas quatro resoluções, até 1920×1080/1080×1920, em `exporters/video-exporter.ts:28-36`. Os presets 4K existentes em `lib/config.ts:462-469` são da **imagem**.
3. **Qualidade**: codec H.264 `avc1.640028` (High, nível 4.0), bitrate máximo de 24 Mbps e supersampling com teto 1,5× (`exporters/video-exporter.ts:240-274`); o fallback `MediaRecorder` usa 12 Mbps e captura em tempo real (`:347-450`). A textura de arte exportada é 4096 px (`lib/config.ts:153-155`; `exporters/frame-capture.ts:156-198`).
4. **Vídeo e GIF diferem no loop**: MP4 e WebM percorrem `t = i/(total-1)`, duplicando a pose inicial no final (`video-exporter.ts:203-208`, `:291-303`, `:412-423`). GIF usa `t=i/total` (`:481-489`). A repetição dos extremos **pode** gerar pausa visual na emenda do vídeo; o resultado precisa ser testado.
5. **Modelo com base em anel**: `lib/config.ts:6-18` declara `footH=0.34`; `scene/mug-geometry.ts:55-73` modela o anel inferior explicitamente. Isso contraria o acabamento plano e liso mostrado na referência de caneca deitada.
6. **Três tipos incompatíveis com “só canecas”**: `long`, `thermal`, `squeeze` ainda aparecem em `scene/model-geometry.ts:54-73`, `lib/config.ts:494-496`, `ui/workspace.tsx:366-384` e `scene/mug.tsx:405-422`.
7. **Modelos dependem de deformação de geometria única** (`scene/model-geometry.ts:75-118`); faltam perfis realmente independentes para cônica, quadrada, chopp, latte e xícara.
8. **Reset incompleto**: botão acessível somente na aba Cena (`ui/workspace.tsx:500-509`), sem confirmação. `state/store.ts:1184-1200` não redefine `watermark`, `video`, `gif`, `exportSettings`, zoom, ferramentas nem vários estados efêmeros. “Desfazer” usa histórico, mas a confirmação e o aviso de 8 s não existem.
9. **UI escura por padrão** (`ui/workspace.tsx:110-112`, `ui/workspace.css:1-28`) e com trilho Artes/Fundos/Bases/Camadas/Cena, diferente da organização exigida.
10. **Shadow maps baixos para 4K**: resolução 512 mobile/1024 desktop (`scene/studio.tsx:103-120`) e poucos controles na UI (`ui/panels.tsx:1289-1302`); não há tratamento explícito de qualidade maior na exportação.
11. **Projetos antigos precisam de migração**: `state/store.ts:1102-1134` hidrata o `model` sem mapear os IDs a remover. O `.cgstudio` usa formato `version:1` (`lib/portable-project.ts:43-55`, `:65-118`).
12. **Acesso premium**: o portão real está no host `src/app/page.tsx:134-138`, que envolve o `<MockupStudio />` com `<PremiumGate>`. A migração para rota própria NÃO pode depender somente da prop `plan` (`lib/entitlements.ts:1-7`), porque essa prop não faz a autorização.

## 2. Inventário do Studio confirmado no código

| Área / componentes | Controles e recursos efetivos | Origem no código |
|---|---|---|
| Organização do editor | cabeçalho (voltar, nome do projeto, desfazer/refazer, zoom, tema, projetos, salvar, exportar), trilho Artes/Fundos/Bases/Camadas/Cena, palco, inspetor contextual e faixa de composições | `ui/workspace.tsx:66-74`, `:155-240`, `:240-590`, `:590-846` |
| Arte / upload | arquivo PNG/JPEG/WebP/SVG/AVIF, arrastar e soltar, colar Ctrl+V, arte de exemplo, prévia, qualidade por DPI e alerta | `mockup-studio.tsx:24-55`, `:72-85`, `:183-219`; `ui/workspace.tsx:290-352`; `ui/panels.tsx:139-239` |
| Área de impressão | prensa / altura cheia / forno / personalizada; encaixe, preencher/conter/esticar, escala, deslocamento, rotação, repetição 1–4x, espelho, sangria, texto; impressão adicional de decalque/base e máscara | `ui/panels.tsx:139-518`; `ui/print-layers-panel.tsx:7-132`; `lib/config.ts:25-131` |
| Produto | 9 modelos (6 canecas com alça + long/thermal/squeeze), variantes branca/colorida/mágica, calor/revelação, cor separada de corpo, alça, interior e base; verniz/rugosidade/reflexo, preservação de cor | `scene/model-geometry.ts:4-118`; `ui/panels.tsx:571-855`; `ui/workspace.tsx:695-787`; `scene/mug.tsx:69-119` |
| Objetos e camadas | seleção simples/múltipla; mover/girar/escalar em 3 eixos; duplicar/excluir/travar/ocultar, alterar ordem, alinhar/distribuir; composições com até 8 peças | `state/store.ts:258-356`, `:736-935`; `ui/workspace.tsx:401-499`, `:513-569`, `:590-694` |
| Fundo e superfície | branco, escuro, sólido, gradiente, foto e alfa; 30 fotos premium; oito cenários procedurais; foto própria, crop, zoom, posicionamento, rotação, espelho, desfoque, brilho, contraste, vinheta; seis tipos de superfície | `ui/panels.tsx:871-1309`; `ui/premium-backgrounds.tsx`; `scene/bg-image.tsx`; `lib/background-registry.ts` |
| Luz e sombra | presets de iluminação, temperatura, intensidade, rotação, suavidade, HDRI, sombras de contato/projetada; luzes principal, preenchimento, recorte e refletor | `ui/panels.tsx:1310-1388`; `ui/hdri-panel.tsx`; `scene/studio.tsx:60-165`, `:565-628` |
| Câmera e efeitos | doze vistas, lente ajustável, enquadramento, grade, tela cheia, giro automático e velocidade; seis estilos de look, exposição, contraste, saturação, temperatura, bloom, vinheta, grão | `lib/config.ts:302-360`; `ui/panels.tsx:1389-1486`; `ui/panels-extra.tsx:262-375` |
| Imagem | PNG, JPEG, WebP, proporções e medidas personalizadas, escala/qualidade, canal alfa, marca d'água | `ui/panels.tsx:1498-1836`; `exporters/image-exporter.ts`; `exporters/frame-capture.ts` |
| Vídeo | MP4 H.264 com WebCodecs, fallback MediaRecorder, WebM com alfa VP9, 4 movimentos (giro, órbita, zoom, revelação), 24/30 fps, 4 resoluções, duração atual 3–10 s, progresso | `ui/panels.tsx:1840-1996`; `exporters/video-exporter.ts:28-450`; `exporters/alpha-video-encoder.ts` |
| GIF | GIF animado, 10/15/20 fps, 360/480/640 px, movimento e duração independente | `ui/panels.tsx:2000-2119`; `exporters/video-exporter.ts:452-524` |
| Exportações especializadas | lote de imagens/ângulos em ZIP, folha de sublimação 300/600 DPI com guias/espelho, marca d'água | `ui/panels.tsx:2121-2417`; `exporters/batch-exporter.ts`; `exporters/template-exporter.ts` |
| Projetos | IndexedDB, autosave 25 s, restaurar sessão, `.cgstudio` portátil, abrir/renomear/duplicar/excluir, histórico e shortcuts | `mockup-studio.tsx:54-156`; `ui/projects-dialog.tsx`; `lib/projects-db.ts`; `lib/portable-project.ts`; `state/store.ts:1136-1200` |
| Componentes reutilizáveis | acordeão `Section`, slider numérico/duplo clique, seletor de cor, segmentado, toggle e botões | `ui/controls.tsx:15-305` |

**Atalhos presentes em `mockup-studio.tsx:87-149`:** V selecionar; G mover; E girar; S escalar; A mover arte; H pan; Ctrl/Cmd+D duplicar; Ctrl/Cmd+A selecionar todas; Ctrl/Cmd+Z desfazer; Ctrl/Cmd+Y ou Shift+Z refazer; Delete/Backspace excluir; setas mover; Shift+setas mover mais; F enquadrar; R girar 45°; Espaço giro automático; Ctrl/Cmd+V colar arte. Câmera também oferece mouse para órbita/pan/zoom no palco.

## 3. Tabela de decisão — manter / simplificar / avançado / remover

**Legenda:** ESSENCIAL = direto no fluxo diário; ÚTIL = grupo recolhível; AVANÇADO = secundário; REMOVER = apenas sob os quatro critérios do agente. A referência Rapid dos **prints** mostra design em painel lateral, upload Principal/Base, controle de cores, fundo, luz e exportação imagem/vídeo; as funções não mostradas em captura permanecem **NÃO VERIFICADAS** na interface do concorrente (a especificação anexa é a fonte suplementar).

| Recurso atual | Decisão | Justificativa / destino |
|---|---|---|
| Enviar arte, arrastar/colar, exemplo | ESSENCIAL | principal ação da ferramenta |
| Encaixar, escala, posição, rotação de arte | ESSENCIAL | valor central para sublimação |
| Área de impressão e sangria | ESSENCIAL | evita medidas erradas antes da prensa |
| Repetição/espelho e texto sobre a caneca | ÚTIL | mantidos, mas agrupados sob Arte |
| Decalque, impressão de base e máscara metálica | AVANÇADO | profissionais precisam; dispensável no primeiro uso |
| Correção de imagem e indicadores DPI | ÚTIL | qualidade com acesso rápido; detalhes recolhíveis |
| Caneca clássica 11 oz, outras canecas com alça | ESSENCIAL | preservar e reconstruir perfis, clássica como padrão |
| Long drink, copo térmico e squeeze | REMOVER COM MIGRAÇÃO | fora do escopo canecas; mapear projetos antigos antes de apagar |
| Branca, alça/interior coloridos, mágica, toda colorida | ESSENCIAL | diferencial comercial, manter e organizar presets |
| Cor por corpo, alça, interior e base | ESSENCIAL | coerente com referência visual enviada |
| Rugosidade, verniz, reflexão, HDRI próprio | AVANÇADO | úteis, porém controles técnicos não devem congestionar fluxo |
| Uma caneca, duplas/trios/grupos | ESSENCIAL | manter até 8 peças, presets na faixa do palco |
| Camadas, travar, ocultar, alinhar/distribuir | ÚTIL | painel contextual à direita, recolhível |
| Fundo branco/cor/imagem/fotos prontas | ESSENCIAL | cenário rápido para anúncio |
| 30 fundos + oito procedurais | ÚTIL | uma única galeria categorizada |
| Seis superfícies/chãos | ÚTIL | uma categoria “Superfície” com presets |
| Sombras ligadas, intensidade e suavidade | ESSENCIAL | sombra convincente define realismo do produto |
| Luzes individuais, HDRI custom, cor da sombra | AVANÇADO | manter para quem faz anúncios refinados |
| Giro sentido, velocidade, loop e enquadramento | ESSENCIAL | diretamente relacionado ao vídeo vendido ao cliente |
| 12 vistas de câmera e lente 24–100 mm | ÚTIL / AVANÇADO | 6 vistas visíveis + vistas extras/lente em Avançado |
| Looks prontos, bloom, grão, LUT e vinheta | ÚTIL / AVANÇADO | looks simples; parâmetros avançados recolhidos |
| Imagem PNG/JPEG/WebP com alfa | ESSENCIAL | exportação principal |
| Vídeo MP4/WebM com alfa até 20 s | ESSENCIAL | solicitação explícita; elevar resolução/codec e confiabilidade |
| GIF e lote ZIP | ESSENCIAL | não eliminar fluxos existentes |
| Folha para sublimação 300/600 DPI | ESSENCIAL | não esconder em excesso |
| Marca d'água | ÚTIL | opcional, recolhida nas exportações |
| Projeto, importar/exportar `.cgstudio`, desfazer/refazer | ESSENCIAL | continuidade e compatibilidade do trabalho |
| Opções técnicas e mensagens de engine | AVANÇADO | substituir por termos amigáveis no fluxo normal |

**Política de remoção:** dos itens existentes, somente os três recipientes sem alça têm remoção aprovada pelo escopo explícito, **condicionada a migração**. Nenhuma outra função essencial deve desaparecer.

## 4. Diagnóstico técnico detalhado da exportação

- **Resoluções atuais**: `sq1080` 1080², `hd` 1280×720, `vertical` 1080×1920, `wide` 1920×1080. Não existem QHD/4K na lista de vídeo (`video-exporter.ts:28-36`).
- **Codec**: inicial `avc1.640028`, tentativas `avc1.4d0028` e `avc1.42E01E` (`video-exporter.ts:253-267`; `frame-capture.ts:73-110`). Precisará detecção de perfil conforme dimensões e suporte real do encoder; não assumir HEVC universal.
- **Compressão**: `Math.min(24_000_000, ...)` em MP4 (`video-exporter.ts:269-274`) e no encoder alfa (`alpha-video-encoder.ts:8-11`); MediaRecorder usa 12_000_000 bps (`video-exporter.ts:390-393`).
- **Supersampling**: 1,5× MP4 e WebM alfa (`video-exporter.ts:198`, `:240-242`); `frame-capture.ts:130-150` limita GPU/FX (sob efeitos ligados o SS fica 1×). Um ajuste visual na UI sozinho não resolverá nitidez.
- **Tamanho da arte**: 4096px no canvas de exportação (`config.ts:154`; `frame-capture.ts:156-198`); o upload também possui teto em `art-registry.ts:52-65`. Subir para 8192 exige verificar `maxTextureSize`, memória e proporções do canvas, com fallback.
- **Tempo de vídeo**: `ui/panels.tsx:1923-1931` limita a 10 s. O exporter recebe `duration` sem validação de faixa (interface e exportador não usam uma constante única); é prudente limitar **3–20 s** também ao hidratar projetos antigos ou valores modificados programaticamente. Presets 5/10/15/20 s ajudam a UI. Padrão de 5 s pode permanecer.
- **Loop**: conferir a junção entre último e primeiro quadros após a correção do `t`, mantendo a duração informada e sem esticar a câmera/sombra. Verificar se “giro 360°” entrega a volta completa independentemente do FPS.
- **Armazenamento**: `ArrayBufferTarget`/`fastStart: "in-memory"` (`video-exporter.ts:275-280`, `:324-330`); vídeos 4K/20 s podem consumir muita RAM antes de gerar o Blob. Exportação por chunks ou recusa amigável pode ser necessária.
- **Progresso/cancelar**: há barra (`ui/panels.tsx:1970-1988`), mas **não** há botão Cancelar nem sinal de aborto encaminhado ao loop de frames.
- **Atenção à qualidade**: 4K terá mais informação espacial que Full HD, mas não será “sem perda” tecnicamente em MP4 com compressão, nem ficará sempre nítido a 200% se a arte de entrada for pequena. Para fidelidade máxima, usar sequência de PNG/ZIP e configurar bitrate alto, além de fazer teste visual real com arquivo de arte de alta resolução.

## 5. Bugs e riscos — evidência e plano de correção

| Prioridade | Bug / risco | Evidência e status | Correção / teste proposto |
|---|---|---|---|
| P0 | Vídeo >10 s bloqueado pela interface | **CONFIRMADO**: `ui/panels.tsx:1923-1931` | usar constante 3–20 em UI, estado, validação do exporter e testes em MP4/WebM alfa |
| P0 | 4K ausente no vídeo e bitrate insuficiente | **CONFIRMADO**: `exporters/video-exporter.ts:28-36`, `:253-274` | presets 2K/4K, codec apropriado, qualidade, benchmark por formato |
| P0 | Alteração de rotas pode ignorar premium | **RISCO**: `src/app/page.tsx:134-138` | reaproveitar `<PremiumGate>` na rota `/studio`; teste logado/não autorizado |
| P0 | Projetos com `long`, `thermal`, `squeeze` | **CONFIRMADO**: `model-geometry.ts:54-73`, `state/store.ts:1102-1134` | migrar na leitura de IndexedDB e `.cgstudio`, com aviso e testes |
| P1 | Base da caneca não é lisa | **CONFIRMADO**: `scene/mug-geometry.ts:55-73` | refazer perfil inferior e material mantendo opção de estampa da base |
| P1 | Alça parece mais fina que a referência | **HIPÓTESE CONSISTENTE**: `mug-geometry.ts:147-170` (semi-eixos 0,5/0,37; tubular 72) | engrossar por geometria de perfil, render em frente, lado e deitada |
| P1 | Pequena pausa no loop exportado | **CAUSA PROVÁVEL**: `video-exporter.ts:203-208`, `:291-303`, `:412-423` | comparar primeiro/último quadro, ajustar amostragem e loop real |
| P1 | Shadow maps aquém da exportação 4K | **CONFIRMADO**: `scene/studio.tsx:103-120` | qualidade adaptativa na exportação + restauração depois; teste sem serrilhado/flicker |
| P1 | Reset global deixa resíduos | **CONFIRMADO**: `state/store.ts:1184-1200` | incluir watermark/export/video/gif e campos efêmeros; botão no topo, confirmação, desfazer |
| P1 | Sombra no alfa sobreposta erradamente | **NÃO VERIFICADO visualmente**: `scene/studio.tsx:565-628`, `exporters/frame-capture.ts` | render transparente e checar pixels RGBA intermediários, várias poses e fundos |
| P1 | Segunda caneca colada ao duplicar | **NÃO REPRODUZIDO**: `state/store.ts:736-830`; documentação relata correção anterior | testar diferentes inclinações/modelos/grupos 2–8 |
| P1 | Mancha atrás da alça / faixa colorida | **NÃO REPRODUZIDO**: `scene/mug-geometry.ts:100-117`, `lib/art-canvas.ts` | teste com arte saturada 360°, costura e base; comparar preview vs export |
| P1 | Fundo persiste/escurece ou deforma | **NÃO REPRODUZIDO**: `scene/bg-image.tsx`, `lib/background-registry.ts` | cenários de troca e crop em imagem portrait/landscape |
| P2 | “Cor da alça / tampa” menciona tampa de copo | **CONFIRMADO**: `ui/workspace.tsx:718` | renomear “Cor da alça” |
| P2 | Contraste/tema claro fora da exigência | **CONFIRMADO**: `workspace.tsx:110-112`; `workspace.css:1-28` | tema claro padrão, alto contraste, testes em 360/390/768/1280/1920 |
| P2 | UI com controles duplicados | **CONFIRMADO**: `ui/workspace.tsx:695-844`, `ui/panels.tsx:571-855` | concentrar controles essenciais na seleção; preservar funcionalidades |
| P2 | Acessibilidade mobile e preferências de movimento | **NÃO VERIFICADO** no navegador | teste de tabulação, zoom, toques 44px, `prefers-reduced-motion` e leitor de tela |
| P2 | WebGL fallback e memória em 4K/20s | **NÃO VERIFICADO** em dispositivos reais | testes Chrome/Edge/Firefox/Safari e hardware básico; modos de fallback |

## 6. Plano de arquivos e fases seguintes

Apenas rotas e entradas permitidas pelo agente serão tocadas; arquivos de outras ferramentas, Prisma, Neon, deploy e `package.json` permanecerão inalterados.

| Fase | Arquivos esperados (a confirmar durante implementação) | Entrega |
|---|---|---|
| 2 — UI/UX e reset | `ui/workspace.tsx`, `ui/workspace.css`, `ui/controls.tsx`, `ui/panels.tsx` (dividido em componentes menores), `ui/panels-extra.tsx`, `state/store.ts` | sistema visual branco/preto/laranja, painel contextual, responsividade, reset completo com confirmação |
| 3 — modelos realistas | `scene/model-geometry.ts`, `scene/mug-geometry.ts`, `scene/mug.tsx`, `lib/config.ts`, `state/store.ts`, `lib/portable-project.ts`, `lib/projects-db.ts` | só canecas, base lisa, alça robusta, perfis próprios, migração |
| 4 — luz/movimento | `scene/studio.tsx`, `scene/camera-rig.tsx`, `scene/studio-scene.tsx`, `ui/*` relevantes, `state/store.ts` | sombras e giro configuráveis; preview/export consistentes |
| 5 — vídeo/imagem | `exporters/video-exporter.ts`, `exporters/alpha-video-encoder.ts`, `exporters/alpha-webm-muxer.ts`, `exporters/frame-capture.ts`, `exporters/image-exporter.ts`, `exporters/batch-exporter.ts`, `ui/panels/*` | vídeo 3–20 s; 2K/4K/60fps, alta qualidade, cancelar, sequências PNG, presets, QA |
| 6 — guia/rotas | **novos** `src/app/mockup-caneca-3d/page.tsx`, `src/app/mockup-caneca-3d/studio/page.tsx`, componentes do guia dentro do escopo permitido, `src/components/site/home.tsx`, `src/app/page.tsx` (somente redirecionamento antigo), rodapé, sitemap | página-guia indexável, studio protegido, navegação, Instagram/Facebook/biblioteca |
| 7 — extras e regressões | `ui/*`, `docs/mockup-studio/GUIA_ATUAL.md`, `docs/mockup-studio/regressions.mjs`, `CHANGELOG` | presets/cenas prontas, compartilhamento, QA de produção e ZIP final |

**Política de dependências:** a biblioteca `three`, WebCodecs, mp4-muxer, JSZip e o conjunto React já constam em `package.json`; qualquer dependência externa adicional exige autorização explícita. A migração entre rotas deve ser tratada como ponto de entrada estritamente necessário, sem alterar cobrança ou autenticação.

## 7. Testes e limitações desta fase

- **Leitura de código:** realizada no ZIP enviado. Os 10 prints e a especificação Rapid foram usados somente como referências de aparência/organização; **não houve inspeção interativa do concorrente** nesta fase.
- **Documentação:** o repositório contém resultados de QA anteriores (`docs/mockup-studio/validacao/qa-results.json`) que não equivalem a novo teste.
- **Teste de regressão executado:** `node docs/mockup-studio/regressions.mjs` foi tentado; **NÃO EXECUTOU**, porque o ZIP não contém `node_modules` e a execução falhou em `Cannot find module 'zustand'`. Não foi executado `npm install` nem `npm run build`, pois o comando de build do projeto chama comandos do Prisma/banco e o agente proíbe alterações fora do módulo.
- **Teste visual/render de 4K, sombras e 20 s:** **NÃO VERIFICADO**; requer instalação local isolada e execução no navegador com WebGL/WebCodecs.
- **Sem alterações no site, código-fonte, banco ou Vercel.** O agente atualizado que acompanha esta auditoria contém a exigência adicional de até **20 segundos**.

---

**Fase 1 concluída — responda CONTINUAR.**
