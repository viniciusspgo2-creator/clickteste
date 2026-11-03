> Guia anterior preservado como registro do comportamento recebido. Para a versão atual, consulte [GUIA_ATUAL.md](mockup-studio/GUIA_ATUAL.md), [CHANGELOG](../CHANGELOG.md) e [limites conhecidos](../PROXIMA_VERSAO.md).

# Mockup Studio 3D — Guia completo

Estúdio de mockups de canecas para sublimação, 100% no navegador (nada é enviado
para servidores). Ferramenta **PREMIUM** do Click & Gruda Tools — acesso
exclusivo para assinantes da Biblioteca de Artes mediante código de acesso.

## Como acessar

1. Na home, seção **MOCKUP 3D STUDIO** (badge PREMIUM) → botão **Abrir Studio**.
2. Insira o código de acesso recebido ao assinar a Biblioteca de Artes.
3. O administrador gera e gerencia códigos no painel `/admin`
   (ver `docs/ADMIN.md`).

## Recursos

### Cena e realismo
- Caneca de porcelana 11 oz modelada proceduralmente (LatheGeometry com perfil
  real: borda arredondada, parede cônica, interior, fundo rebaixado) e alça em C
  com seção elíptica varrida em Catmull-Rom.
- Arte mapeada por projeção cilíndrica exata: a textura cobre a volta completa
  de 360° e o vão da alça é preenchido com a cor-base — nunca há listras nem
  vazamento de cor atrás da alça, mesmo com artes de bordas fortes.
- Materiais PBR com verniz (clearcoat), micro-ruído no esmalte, sombras suaves e
  6 presets de iluminação com temperatura Kelvin.
- Fundos: **branco puro (padrão — sai 255,255,255 nas exportações)**, estúdio
  escuro premium, gradiente, cor sólida, **imagem do dispositivo** e sem fundo
  (alfa verdadeiro com sombra).
- **Chão em 4 modos**: Contínuo (sem borda visível em nenhum ângulo), Flutuante
  (sem chão; sombra difusa no ar; opção “Flutuar suavemente”), Pedestal
  (base redonda premium com bevel) e Espelhado (reflexo suave).
- Câmera com lente 24–100 mm, 12 presets com transição animada, giro automático,
  foco por duplo clique/tecla F, **Enquadrar tudo** e guias de enquadramento
  (grade de terços).

### Arte
- Upload por clique, arrastar-e-soltar ou **Ctrl+V**.
- Ajustes: preencher/conter/esticar, escala, posição com wrap 360°, rotação,
  espelhar e repetir até 4× na volta.
- **Texto na caneca**: escreva uma frase/nome direto no estúdio (cor, tamanho e
  altura ajustáveis) — aparece na caneca, nas exportações e na folha de
  sublimação.
- Medidor de **DPI efetivo** com alertas (≥300 excelente, ≥150 boa, <150 arriscada).
- Arte de exemplo procedural para testes.

### Canecas
- **Branca**, **colorida** (alça e interior personalizáveis) e **mágica** com
  revelação térmica configurável (calor, direção e dissolução da borda) e botão
  **Ver revelação** (play) que anima a caneca preta revelando a arte.
- **Multicaneca**: cenas com até 4 canecas — arranjos Duo, Trio, Quarteto e
  Vitrine (posições calculadas para **nunca se sobrepor**, mesmo com as alças),
  controles individuais (variante, cor, posição, rotação, tamanho, mostrar arte,
  calor), botões **Distribuir sem encostar** e **Enquadrar tudo**, e trava de
  sobreposição com aviso ao arrastar.
- Sombras, câmera de sombra, ContactShadows e pedestal crescem junto com o
  grupo — nada corta a sombra quando as canecas se afastam.

### Fundo com imagem
- Enviar por clique ou arrastar-e-soltar (Ctrl+V continua colando a ARTE;
  com o fundo “Imagem” ativo, o arrastar-e-soltar troca o FUNDO).
- JPG/PNG/WebP até 25 MB, reduzido internamente para 4096 px.
- Encaixe: Cobrir / Conter / Esticar, zoom (0,5×–3×), posição (sliders ou
  **arrastando direto no 3D** no modo “Ajustar fundo no 3D”, com guias de centro
  e encaixe magnético; duplo clique recentra), rotação, espelhar, desfoque e
  clarear/escurecer.
- O fundo fica **fixo na tela** (não gira com a câmera) e o enquadramento é
  recalculado para cada proporção de exportação (1:1, 4:5, 9:16, 16:9, 2:3 e
  personalizada).
- **Cenários prontos**: 8 cenários desenhados por código (madeira, mármore,
  concreto, parede, linho, estúdio escuro, pôr do sol, verde) — sem direitos
  autorais.
- “Combinar luz com o fundo” tinge a iluminação com a cor média da foto.
- Funciona no preview, imagem, vídeo, GIF, lote, miniatura e com efeitos
  ligados. “Sem fundo (PNG)” continua removendo tudo.

### Pós-processamento
- Estilos de cor prontos: **Nenhum, Vivo, Quente, Frio, Cinema, P&B**.
- Controles finos: brilho geral, contraste, saturação, temperatura, brilho
  suave (halo), escurecer bordas e textura de filme.
- Vale para o preview, imagens, vídeos, GIFs e lote.

### Exportação (5 modos)
| Modo | O que faz |
|------|-----------|
| **Imagem** | PNG/JPG/WebP até 8K, 6 proporções + custom, fundo alfa verdadeiro |
| **Vídeo** | MP4 H.264 ou WebM VP9 com ALFA em Giro 360°, Órbita, Zoom e Revelação; 720p–1080p; fallback MediaRecorder apenas no vídeo normal |
| **GIF** | Loop infinito com paleta adaptativa, 360/480/640 px, 10–20 fps |
| **Lote** | Vários ângulos × variantes (mágica fria/quente) num único ZIP |
| **Folha** | Arte planificada para sublimação: 20,7 × 8,7 cm em 300/600 DPI, guias de corte e margem de segurança opcionais, opção volta completa |

- **Marca d'água** opcional em todos os modos (texto, posição, tamanho, opacidade).

### Projetos
- Salvar/abrir/renomear/duplicar/excluir projetos com miniatura renderizada —
  tudo em IndexedDB no dispositivo (inclui a arte original **e a imagem de
  fundo**; cenários prontos são regenerados por código).
- **Autosave** da sessão a cada 25 s e ao sair da página; a última sessão é
  restaurada automaticamente.
- Desfazer/refazer guarda apenas o id e os parâmetros do fundo (nunca o blob).

### Atalhos
| Tecla | Ação |
|-------|------|
| Ctrl+Z / Ctrl+Shift+Z | Desfazer / Refazer |
| R | Gira a caneca +45° |
| F / duplo clique | Focar |
| Espaço | Girar/parar o giro automático |
| Ctrl+V | Colar arte |

(Atalhos não disparam enquanto o usuário digita em um campo.)

## Arquitetura técnica

```
src/components/tools/mockup/
├── mockup-studio.tsx        # shell (topbar, painéis, mobile, autosave, gate)
├── state/store.ts           # Zustand + undo/redo (art, mug, light, bg, camera,
│                            #   companions, fx, watermark, video, gif)
├── lib/
│   ├── config.ts            # dimensões da caneca, presets de luz/câmera, tipos de chão…
│   ├── art-canvas.ts        # motor de arte em canvas (folha 360°) + revelação térmica
│   ├── art-registry.ts      # registro de imagens da arte + blob round-trip
│   ├── background-registry.ts # imagens de fundo + cenários prontos gerados por código
│   └── projects-db.ts       # IndexedDB (projetos)
├── scene/
│   ├── mug-geometry.ts      # geometria procedural (corpo + alça + pedestal)
│   ├── mug.tsx              # caneca hero + acompanhantes (geometria/texturas compartilhadas)
│   ├── studio.tsx           # luzes, fundos, chão (contínuo/flutuante/pedestal/espelhado), sombras
│   ├── bg-image.tsx         # fundo imagem fixo na tela (quad alinhado à câmera ativa)
│   ├── camera-rig.tsx       # OrbitControls, presets, foco, enquadrar tudo
│   ├── postfx.tsx           # EffectComposer: RenderPass → Bloom → Grade → Output
│   ├── studio-scene.tsx     # Canvas + contextlost + exposição
│   └── studio-refs.ts       # refs para os exportadores (+ flags de exportação)
├── exporters/
│   ├── frame-capture.ts     # motor offscreen compartilhado (estado, ss, FX, alfa,
│   │                        #   marca d'água, restauração)
│   ├── image-exporter.ts    # imagem estática + canvas p/ miniatura
│   ├── video-exporter.ts    # MP4 (mp4-muxer/WebCodecs; MediaRecorder fallback) + GIF (gifenc)
│   ├── batch-exporter.ts    # lote ZIP (fflate)
│   └── template-exporter.ts # folha planificada com guias
└── ui/
    ├── panels.tsx           # Arte/Caneca/Cena/Luz/Câmera + ExportDialog (5 abas)
    ├── panels-extra.tsx     # Multicaneca + Efeitos de imagem
    ├── projects-dialog.tsx  # projetos + autosave/restore
    └── controls.tsx         # sliders, cores, segmentados, toggles
```

### Decisões importantes
- **Enquadramento inteligente**: todos os exports usam a bounding sphere de
  todas as canecas (hero + acompanhantes) para nunca cortar a cena.
- **Fundo imagem**: quad preso à câmera ativa a cada render (`alignBackdrop`),
  então preview e qualquer proporção de exportação ficam coerentes. Fica em
  layer própria para não aparecer nos reflexos do piso espelhado.
- **Exportação estática**: durante qualquer export as flags `exporting` são
  ligadas e a flutuação fica parada na pose de descanso (`settleFloaters`); ao
  final, tudo é restaurado (visibilidade, materiais, tamanho do renderer,
  textura 4096 px).
- **Encaixe sem sobreposição**: distância mínima calculada por caneca a partir
  do raio do corpo × escala + caixa real da alça (`handleExtentR`) + folga de
  1 cm, com setor de alça de ±55° — os arranjos e o arrasto respeitam sempre.
- **Marca d'água** é desenhada no canvas 2D após a captura (não afeta a cena).
- **Loop de vídeo**: giro 360° fecha exatamente em 360°; GIF usa `t = i/total`
  para loop perfeito; MP4 inclui o frame final (frente → frente).
- **Caneca mágica no lote**: `setMugOverride` re-renderiza a folha 4096 px com
  calor 0/1 sem tocar no estado do usuário.
- Todos os recursos GPU/geometria são descartados (`dispose`) no unmount.

## Novidades (análise de concorrente — rapidmockup.net)
Analisamos o editor de mockups 3D da Rapid Mockup (canecas, taças e copos,
com vídeo animado). O site do app é renderizado em JavaScript e a maior parte
da interface não fica acessível sem conta; a comparação abaixo usa o que está
público (páginas de venda e conhecimento de editores do gênero) cruzado com o
que o Mockup Studio JÁ tinha.

**Ideias vistas neles que não tínhamos:** texto escrito direto na caneca,
variedade de produtos (taças/copos), ajuste da arte arrastando na caneca 3D,
provas visuais rápidas para enviar ao cliente e biblioteca de cenários.

**Implementadas (à nossa maneira, identidade Click & Gruda):**
1. **Texto na caneca** — camada de texto sobre a arte (cor, tamanho, altura),
   que também sai na folha de sublimação e nas exportações.
2. **Guias de enquadramento** — grade de terços para compor a foto (painel Câmera).
3. **Tela cheia** — preview em fullscreen para mostrar ao cliente.
4. **Segurar p/ ver antes** — segura o botão (caneca mágica) para espiar a
   caneca fria e soltar para voltar; comparação antes/depois sem exportar.

**Descartadas (com motivo):**
- **Taças e copos** — exigiria novos modelos 3D e remapeamento de UV; fora do
  escopo e de risco para o deploy nesta rodada.
- **Arrastar a arte direto na caneca 3D** — conflita com a órbita da câmera
  (mesmo gesto) e com o toque no celular; os sliders com wrap 360° já cobrem
  bem e sem risco de gesto ambíguo. Reavaliar com modo “editar arte” explícito.
- **Prova rápida por link** — sem backend a arte não viaja no link (100% local
  por design); ficaria uma cena sem arte.

## Limitações conhecidas
- Em Exportar → Vídeo, ative **ALFA — fundo transparente** para gerar WebM VP9
  com transparência. O modo normal permanece opaco. Veja [Exportação ALFA](mockup-studio/EXPORTACAO-ALFA.md).
- Vídeo ALFA exige WebCodecs/VP9 e um editor/player compatível com WebM com alfa.
  Efeitos de tela inteira são desativados nas exportações transparentes para preservar o recorte.
- GIF sempre com fundo renderizado (sem alfa).
- Exportações 8K exigem navegadores 64-bit e memória disponível.
- No piso Espelhado o horizonte é visível por natureza (é o comportamento
  esperado de um reflexo); os outros modos não têm borda.
