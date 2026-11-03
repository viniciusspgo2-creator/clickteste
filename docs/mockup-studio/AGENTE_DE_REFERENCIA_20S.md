# AGENTE — REPAGINAÇÃO TOTAL DO MOCKUP STUDIO 3D (SÓ CANECAS) — CLICK&GRUDA

> **Como usar:** cole este texto inteiro no GPT (ou Z.AI) e anexe: (1) o zip do projeto `clicktools` e (2) os prints do concorrente (UI do editor e canecas 3D, inclusive a caneca deitada com fundo liso). **Idioma das respostas e da interface:** português do Brasil. **Fluxo:** o agente trabalha em fases. No fim de cada fase ele para e diz "Fase X concluída — responda CONTINUAR".

---

## 0. PAPEL E MISSÃO

Você é um(a) **Lead de Produto + UI/UX Designer + Engenheiro(a) 3D/WebGL sênior** (React, Next.js, Three.js / React Three Fiber, WebCodecs). Sua missão é **repaginar 100% o Mockup Studio 3D de canecas** da Click&Gruda, deixando-o em **nível profissional, acima da média do mercado**, com a caneca 3D parecendo uma **caneca real de sublimação** (simulação fotorrealista), controles organizados por categorias, visual moderno em **branco, preto e laranja**, exportação de vídeo **sem perda perceptível de qualidade** e uma **página-guia própria** que abre ao clicar em "Mockup Studio".

**O sistema atual funciona, mas está amador e confuso:** muitos botões à vista, controles básicos, caneca simples demais, layout escuro demais, vídeo que perde nitidez quando ampliado no editor. **Não quero um retoque: quero uma repaginação completa**, mantendo o que é essencial.

---

## 1. REGRAS INEGOCIÁVEIS

1. **Escopo.** Mexa somente em: `src/components/tools/mockup/**`, novos ativos em `public/mockup/**`, a documentação em `docs/mockup-studio/**`, as **novas rotas** da página-guia e do Studio, e os **pontos de entrada** estritamente necessários (o card/banner do Mockup na home, o rodapé e o `sitemap`). **Não abra nem altere** as outras ferramentas (QR Code, WhatsApp, Orçamento, Contrato, PDF, Conversor, Extras, Blog, Admin).
2. **Não mexer em deploy.** Nada de alterar Vercel, Neon/Prisma, variáveis de ambiente, autenticação, API de cobrança, configuração de build ou lockfiles. Se **realmente** precisar de uma dependência nova, **avise antes**, explique o motivo e peça minha autorização.
3. **Não remover o essencial.** Só retire uma função se ela for **realmente desnecessária, duplicada ou confusa** (critérios na seção 5). Na dúvida, **mova para "Avançado"** em vez de apagar.
4. **Compatibilidade.** Projetos salvos (IndexedDB) e arquivos `.cgstudio` antigos **precisam continuar abrindo**. Se um projeto usar um modelo removido (`long`, `thermal`, `squeeze`), migre-o automaticamente para a caneca clássica e avise com uma mensagem amigável.
5. **Código completo.** Proibido "// resto do código aqui". Arquivos novos ou reescritos devem vir **inteiros**. Arquivos muito grandes (como `ui/panels.tsx`, com \~2.400 linhas) devem ser **divididos em componentes menores** (ex.: um arquivo por painel, menos de \~400 linhas cada), ajustando os imports.
6. **Sem inventar.** Se algo não puder ser verificado, escreva **"NÃO VERIFICADO"** e me diga o que preciso enviar. Não copie código, modelos 3D, ícones, fotos ou marca do concorrente: use-o só como **referência de nível** e **supere-o**.
7. **Tudo em português do Brasil**, com linguagem simples para o usuário final (sem jargão técnico na interface).

---

## 2. CONTEXTO DO PROJETO (o que já existe — leia antes de codar)

**Stack:** Next.js 16, React 19, Tailwind 4, `three` 0.186, `@react-three/fiber` 9, `@react-three/drei` 10, `zustand`, `mp4-muxer` (vídeo), `gifenc` (GIF), `jszip` (ZIP).

**Pasta do módulo:** `src/components/tools/mockup/`

- `mockup-studio.tsx` — casca do Studio (sessão, upload, atalhos)
- `state/store.ts` — estado global (zustand), seleção, histórico, composições
- `lib/config.ts` — constantes, presets de luz/câmera/área de impressão/exportação
- `scene/` — `mug.tsx`, `mug-geometry.ts`, `model-geometry.ts`, `studio.tsx`, `studio-scene.tsx`, `camera-rig.tsx`, `postfx.tsx`, `bg-image.tsx`
- `ui/` — `workspace.tsx`, `workspace.css`, `panels.tsx`, `panels-extra.tsx`, `controls.tsx`, `print-layers-panel.tsx`, `hdri-panel.tsx`, `premium-backgrounds.tsx`, `projects-dialog.tsx`
- `exporters/` — `video-exporter.ts`, `frame-capture.ts`, `image-exporter.ts`, `batch-exporter.ts`, `template-exporter.ts`, `alpha-video-encoder.ts`, `alpha-webm-muxer.ts`
- `public/mockup/backgrounds/` — 30 fotos de fundo (madeira, mármore, cozinha, Natal, Dia das Mães, Dia dos Pais, Páscoa, Black Friday etc.)

**Leitura obrigatória antes de qualquer alteração:** `DIAGNOSTICO_MOCKUP_STUDIO.md` (raiz), `docs/mockup-studio/GUIA_ATUAL.md`, `docs/mockup-studio/ESPECIFICACAO_FUNCIONAL_RAPIDMOCKUP.md` (120 controles do concorrente já catalogados), `docs/mockup-studio/EXPORTACAO-ALFA.md`, além de `state/store.ts`, `lib/config.ts`, `scene/model-geometry.ts`, `scene/mug-geometry.ts` e `exporters/video-exporter.ts`.

**Funções que já existem e NÃO podem ser perdidas** (resumo do inventário): upload de arte (PNG/JPG/WebP/SVG/AVIF, arrastar, Ctrl+V, arte de exemplo), encaixe (preencher/conter/esticar), escala, posição, rotação, espelho, repetição 1–4x, área de impressão (prensa, altura cheia, forno, personalizada), DPI efetivo com alertas, texto na caneca, ajustes de arte (brilho, contraste, saturação, etc.), decalque e impressão na base, máscara metálica; caneca branca, colorida e **mágica** (térmica, com revelação); cores separadas de corpo/alça/interior/base, brilho/rugosidade/reflexo; até 8 canecas na mesma cena com composições (Duo, Trio, Quarteto, Vitrine…); gizmos mover/girar/escalar, camadas, multisseleção, alinhar/distribuir, travar/ocultar/duplicar; fundos (branco, escuro, gradiente, cor, imagem, transparente), 30 fotos premium, chão (contínuo, flutuante, base redonda/quadrada, pódio, espelhado); luzes, HDRI, câmera (12 vistas, lente 24–100 mm, giro automático), efeitos de cena (LUTs, bloom, vinheta, grão); exportar imagem (PNG/JPG/WebP até 8192 px, com transparência), vídeo MP4, vídeo WebM com alfa, GIF, lote em ZIP, **folha de sublimação** (300/600 DPI), marca d'água; projetos (IndexedDB, autosave, `.cgstudio`), histórico (desfazer/refazer), atalhos, modo mobile com abas.

---

## 3. GLOSSÁRIO — USE ESTES TERMOS (na interface e nos textos)

| Usar                                                                     | Evitar                                           |
| ------------------------------------------------------------------------ | ------------------------------------------------ |
| **Arte** / **estampa**                                                   | "imagem" solta, "design"                         |
| **Sublimação**, **prensa térmica**                                       | "impressão normal"                               |
| **Área de impressão**                                                    | "área útil"                                      |
| **Giro 360°** / **Girar automaticamente**                                | "turntable" (**proibido aparecer na interface**) |
| **Cerâmica**, **esmalte/verniz (brilho)**                                | "plástico", "material" genérico                  |
| **Corpo**, **alça**, **borda**, **interior**, **base (fundo da caneca)** | "parte de cima/de baixo"                         |
| **Superfície/chão**, **sombra de contato**, **sombra projetada**         | "sombrinha"                                      |
| **Iluminação**, **luz principal**, **luz de preenchimento**              | "lights"                                         |
| **Taxa de quadros (fps)**, **taxa de bits (bitrate)**                    | —                                                |
| **Canal alfa (fundo transparente)**                                      | "fundo vazado"                                   |
| **Sangria**                                                              | "margem extra"                                   |
| **Resetar tudo / Restaurar padrão**                                      | "limpar"                                         |

---

## 4. FASE 1 — AUDITORIA (entregue antes de qualquer código)

Entregue um relatório curto com:

1. **Inventário real** do Studio (confira no código, não só nos documentos): lista de todos os painéis, controles, botões, atalhos e exportações, com o arquivo onde cada um está.
2. **Tabela de decisão por função** (formato da seção 5), comparando com o concorrente dos prints (referência: rapidmockup.net/pt/app/caneca) e com a especificação já catalogada no projeto.
3. **Diagnóstico da exportação de vídeo** (seção 12), confirmando as causas encontradas no código.
4. **Lista de bugs prováveis** (seção 16) com arquivo/linha e plano de correção.
5. **Plano de arquivos:** o que será criado, reescrito, dividido ou removido.

Pare e diga: **"Fase 1 concluída — responda CONTINUAR"**.

---

## 5. PEDIDO 1 — SOMENTE CANECAS + PODA INTELIGENTE DE FUNÇÕES

### 5.1 Somente canecas

O gerador deve ter **apenas opções de caneca**. Hoje `scene/model-geometry.ts` tem 9 formas; **remover** as que não são canecas: **`long` (copo long drink), `thermal` (copo térmico com tampa) e `squeeze` (garrafa)**. Manter as canecas com alça (clássica, quadrada, cônica, chopp, latte, xícara) e **reconstruir cada uma com perfil próprio** (não apenas "escalar" o raio da clássica, como o código faz hoje com `deform`). Renomear com termos de mercado, por exemplo: *Caneca Clássica 325 ml (11 oz)*, *Caneca Cônica*, *Caneca Chopp*, *Caneca Latte*, *Caneca Quadrada*, *Xícara*. Remover também qualquer texto, ícone, tipo (`MugModel`) ou ilustração de squeeze, copo ou garrafa. A **caneca clássica 11 oz é o padrão** e a primeira da lista.

### 5.2 Poda inteligente (critérios)

O Studio tem funções demais. Classifique **cada** função em uma das categorias e justifique em uma linha:

- **ESSENCIAL** — fica visível no fluxo principal (ex.: enviar arte, encaixe, cor da caneca, fundo, giro, exportar imagem/vídeo, resetar).
- **ÚTIL** — fica no painel, dentro de um grupo recolhível.
- **AVANÇADO** — fica escondido atrás de "Avançado" (ex.: lente em mm, HDRI personalizado, ajuste fino de material, camadas de impressão, `.cgstudio`).
- **REMOVER** — só se cumprir **todas** estas condições: (a) é duplicada por outro controle; (b) pouca utilidade para quem trabalha com sublimação de caneca; (c) a remoção não quebra projetos salvos nem exportações; (d) deixa a interface mais clara.

**Regras de ouro:** é **proibido** remover ou esconder demais o que o usuário de sublimação usa no dia a dia: **upload e encaixe da arte, área de impressão, folha de sublimação (300/600 DPI), cores da cerâmica, caneca mágica, várias canecas, fundos prontos, exportar imagem/vídeo/GIF/lote, marca d'água, projetos, desfazer/refazer**. Na dúvida, mova para **Avançado**.

**Candidatos a simplificar (decida com base no código e justifique):** 12 vistas de câmera (condensar em \~6 + "Livre"), 6 chãos (agrupar sob "Superfície"), efeitos de cena (agrupar em "Looks" prontos + ajuste fino em Avançado), fundos procedurais + 30 fotos (unir numa **única galeria por categoria**), controles duplicados de cor/alça/interior, nomes internos técnicos.

---

## 6. PEDIDO 2 — NOVA PÁGINA-GUIA ("Mockup de Caneca 3D") + ROTAS

### 6.1 Comportamento

Hoje o card/banner do Mockup na home (`src/components/site/home.tsx`, `setActiveTool('mockup')`) abre o Studio **dentro da mesma página** (`src/app/page.tsx`, `activeTool === 'mockup'`). **Mude para navegar para uma página própria:**

- **`/mockup-caneca-3d`** → **página-guia** (nova, indexável, bonita, rápida).
- **`/mockup-caneca-3d/studio`** → o **Studio em tela cheia** (`MockupStudio`), com o **mesmo controle de acesso premium que existe hoje** (descubra no código como `plan`/portão é decidido e replique; não altere cobrança/autenticação).
- Todos os pontos de entrada (card da home, `MockupBanner`, menu/lista de ferramentas, "Voltar ao início") passam a apontar para a página-guia. Mantenha compatibilidade: se alguém chegar pelo fluxo antigo (`activeTool === 'mockup'`), redirecione para a nova rota.
- Botão **"Voltar ao guia"** e **logo** no topo do Studio.

### 6.2 Conteúdo da página-guia (escrever em português, claro e direto)

**Hero**

- **H1:** `Mockup de Caneca 3D`
- **Subtítulo (usar este texto como base, pode lapidar mantendo o sentido):** *"Mande a sua arte e veja a caneca montada na hora — gire a peça, encaixe a estampa na folha, troque a cor da cerâmica, salve a imagem ou grave o vídeo."*
- **Botões bem à vista:** **[Abrir o Mockup Studio]** (laranja, principal), **[Ver como funciona]** (secundário, rola até o guia), **[Biblioteca de artes]** (link para `https://clickgruda.vercel.app/`), e os ícones **[Instagram]** e **[Facebook]** (ver seção 13).
- Visual: render da caneca 3D com arte (de preferência uma **demonstração ao vivo e leve**, carregada só quando visível e respeitando `prefers-reduced-motion`; se não for possível, imagens/vídeo reais gerados pelo próprio Studio).

**Seção "Para quem é este mockup de caneca"** (texto-base, manter o sentido): *"Para quem trabalha com sublimação de caneca: o ateliê que vende caneca personalizada, a loja de presentes, quem faz brinde para empresa e quem prepara as datas fortes do ano — Dia das Mães, Dia dos Pais, Dia dos Namorados, Natal. Com o mockup 3D, o cliente vê a caneca com a arte dele antes de você ligar a prensa, e a mesma foto já serve para o anúncio."*

**Guia rápido em 4 passos** (cards numerados 01–04, cada um com título, 2 linhas e uma dica):

1. **Envie sua arte** — arraste, cole (Ctrl+V) ou escolha o arquivo. *Dica: PNG com boa resolução dá mais nitidez.*
2. **Encaixe a estampa** — cobrir a caneca inteira ou respeitar a área da prensa; ajuste posição e tamanho.
3. **Monte a caneca e a cena** — cor da cerâmica, alça e interior, fundo, luz e sombra.
4. **Salve ou grave** — imagem PNG/JPG, vídeo em Full HD/4K, GIF, ZIP com vários ângulos ou a **folha de sublimação**.

**"O que você faz no Studio"** — grade com 8 recursos (giro 360°, cores da cerâmica, caneca mágica, várias canecas, fundos prontos, vídeo 4K sem perda, imagem com fundo transparente, folha de sublimação), cada um com mini-ilustração/print.

**Seção "Biblioteca de artes Click&Gruda"** (**obrigatória**, sem remover a da home): bloco com título, 2 linhas explicando que a Click&Gruda tem uma biblioteca de artes prontas para sublimação de caneca (milhares de opções, novas artes toda semana), miniaturas de exemplo, e botão **[Conhecer a biblioteca]** → `https://clickgruda.vercel.app/`.

**FAQ** (acordeão): preciso instalar algo? / minha arte fica salva? / quais formatos de arte aceita? / o vídeo sai em qualidade boa para anúncio? / funciona no celular? / posso usar as imagens em anúncios e marketplaces? / o que é a caneca mágica? / como imprimo pela folha de sublimação?

**Bloco "Siga a Click&Gruda"** com botões grandes de **Instagram** e **Facebook**, e **CTA final** "Abrir o Mockup Studio".

**SEO e técnica:** `title` "Mockup de Caneca 3D online | Click&Gruda", `meta description`, H1 único, canonical, Open Graph com imagem, JSON-LD `SoftwareApplication` + `FAQPage`, entrada no `sitemap.ts`, Lighthouse ≥ 90, imagens WebP/AVIF com `lazy`, sem carregar Three.js na página-guia (importar o Studio só na rota `/studio`). Reaproveitar header/rodapé do site para manter a identidade.

---

## 7. PEDIDO 3 — REDESIGN TOTAL DO STUDIO (UI/UX)

**Objetivo:** parecer um app profissional (nível Figma/Spline/Canva), **claro, organizado, bonito**, sem "tapete de botões".

### 7.1 Paleta (branco · preto · laranja) — NÃO deixar escuro demais

Tema **claro por padrão** (o atual é escuro, `#111216`). Mantenha um alternador de tema **secundário** (escuro opcional), mas o padrão é claro.

| Token              | Valor                         | Uso                                                 |
| ------------------ | ----------------------------- | --------------------------------------------------- |
| `--cg-bg`          | `#FFFFFF`                     | fundo dos painéis                                   |
| `--cg-bg-soft`     | `#F5F4F1`                     | cards, campos, áreas neutras                        |
| `--cg-stage`       | gradiente `#F3F2EF → #E6E4DF` | palco 3D (fundo da cena padrão)                     |
| `--cg-ink`         | `#0E0E10`                     | texto, barra superior preta                         |
| `--cg-ink-soft`    | `#55565C`                     | texto secundário                                    |
| `--cg-line`        | `#E7E5E0`                     | bordas finas (1 px)                                 |
| `--cg-accent`      | `#FF6A13`                     | laranja da marca: botão principal, item ativo, foco |
| `--cg-accent-text` | `#C2410C`                     | texto laranja sobre branco (contraste AA)           |
| `--cg-accent-soft` | `#FFF0E6`                     | fundo de item selecionado                           |

**Contraste:** botões laranja com **texto preto `#111`** (AA). Raios 12–16 px, sombras curtas e suaves, muito respiro, ícones de traço único consistentes (Lucide). Tipografia: reutilizar as fontes do site (título "display" + UI sans), números com `tabular-nums`, micro-rótulos em caixa alta 11 px com espaçamento largo.

### 7.2 Estrutura da tela (desktop ≥ 1280 px)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ◀ Guia · LOGO · [Nome do projeto]   ↶ ↷  Projetos  Salvar  Compartilhar    │  Barra superior PRETA
│        📷 IG  f FB  📚 Biblioteca     [⟲ RESETAR TUDO]  [ EXPORTAR ▾ ]     │
├──────┬──────────────────────────────────────────────────────┬──────────────┤
│ ARTE │                                                      │ PROPRIEDADES │
│CANECA│              PALCO 3D (caneca grande)                │ da peça      │
│ CENA │   [Selecionar|Mover|Girar|Escalar|Arte|Pan]          │ selecionada  │
│ LUZ  │   ▶ Girar automaticamente ⟳ ⟲  velocidade            │ (contextual) │
│CÂMERA│   comparar arte · grade · tela cheia · zoom          │              │
│COMPOR│                                                      │ CAMADAS      │
│EFEITO│──────────────────────────────────────────────────────│ (recolhível) │
│      │  composições: Solo · Duo · Trio · Quarteto · Vitrine │              │
└──────┴──────────────────────────────────────────────────────┴──────────────┘
```

- **Trilho esquerdo (ícone + nome):** **Arte · Caneca · Cena · Luz e sombra · Câmera e movimento · Composição · Efeitos**. Ao clicar, abre o painel daquela categoria (largura \~320 px).
- **Cada painel** tem: título, **grupo "Essencial"** sempre aberto, **"Avançado"** recolhido, botão **"Restaurar esta seção"** e **busca de ajustes** (atalho `Ctrl+K`: digita "sombra" e vai direto ao controle).
- **Painel direito contextual:** propriedades **da peça selecionada** (posição, rotação, escala, cores, acabamento) e **Camadas** (recolhível).
- **Palco:** ferramentas flutuantes no canto, controles de giro e zoom, "comparar arte antes/depois", tela cheia.
- **Faixa inferior:** composições (Solo, Duo, Trio, Quarteto, Vitrine…) em chips.

### 7.3 Componentes de controle (padrão único)

- **Slider** com rótulo à esquerda, **campo numérico editável** à direita (com unidade), indicador de "alterado" (pontinho laranja) e **duplo clique para voltar ao padrão**.
- **Segmentado** (2–4 opções), **cartões com miniatura** (modelos, fundos, looks), **seletor de cor** com amostras prontas + cor livre + conta-gotas (quando o navegador permitir), **toggle**, **select**.
- **Tooltips curtos em português** e microtextos de ajuda ("O que é isso?").
- Estados completos: carregando (skeleton), vazio, erro e sucesso; foco visível; navegação por teclado; alvos de toque ≥ 44 px no mobile.

### 7.4 Primeiro uso

- **Estado vazio convidativo no palco:** área grande "Arraste sua arte aqui", botões **[Enviar arte]**, **[Usar arte de exemplo]**, **[Abrir da Biblioteca]**.
- **Tour rápido de 4 passos** (pode pular; aparece só na primeira vez) e link "Ver guia rápido" que leva à página-guia.

### 7.5 Mobile

Palco no topo; **barra inferior com 5 abas** (Arte, Caneca, Cena, Câmera, Exportar) abrindo **gavetas (bottom sheets)** arrastáveis; **Resetar** e **Exportar** sempre acessíveis; gestos de pinça/arrastar no palco. Testar em 360 px, 390 px, 768 px.

---

## 8. PEDIDO 4 — BOTÃO RESETAR BEM À VISTA

- Botão **"Resetar tudo"** (ícone de seta circular) **fixo na barra superior**, sempre visível, em contorno (para não competir com o laranja de "Exportar").
- Ao clicar: **janela de confirmação** — *"Voltar tudo ao padrão? A caneca, a arte, a cena, a luz, a câmera e os efeitos voltam ao início. Seus projetos salvos não serão apagados."* com opção **"Manter a arte que enviei"** (desmarcada por padrão).
- Depois do reset: aviso **"Tudo resetado — Desfazer"** por 8 segundos, usando o histórico já existente.
- Além do global: **"Restaurar esta seção"** em cada painel e **duplo clique em qualquer slider** para voltar ao valor padrão.
- Reset precisa limpar de verdade: arte, fundo personalizado, HDRI, texto, canecas extras, seleção, câmera, efeitos, marca d'água, estados de exportação — sem deixar resíduos.

---

## 9. PEDIDO 5 — NOVA CANECA 3D (REALISTA, "DE SUBLIMAÇÃO DE VERDADE")

Hoje a geometria (`mug-geometry.ts`) é um *Lathe* com parede, interior, borda e **pé**, e uma alça em "C" de seção elíptica fina. **Reconstrua**, olhando os **prints do concorrente** (canecas mais encorpadas, alça grossa, aparência real) como referência de nível — e **supere**.

### 9.1 Geometria (valores de referência para a caneca clássica 11 oz — **confirme visualmente com os prints e ajuste**)

- **Corpo:** altura ≈ 9,5 cm; diâmetro externo ≈ 8,1–8,3 cm; leve conicidade quase imperceptível; **parede ≈ 3,5–4 mm** (visível na borda).
- **Borda (lip):** arredondada, raio ≈ 1,5–2 mm, com brilho de esmalte; interior com curva suave até o fundo interno.
- **Base (fundo da caneca) — LISA:** **plana e lisa, sem anel de pé, sem rebaixo, sem relevo, sem texto** — exatamente como na **caneca deitada** dos prints. Apenas um **chanfro/arredondamento suave** (≈ 1,5–2 mm) entre a lateral e a base. **Remova o "pé" atual.**
- **Alça mais encorpada:** formato em "C" (ou "D") **robusto**, seção **oval/ovalada grossa** (≈ 1,3–1,6 cm × 2,0–2,4 cm), mais larga na raiz e levemente afinando no meio; **abertura interna** confortável para um dedo; **ponto de fixação com concordância suave (filete/"fillet")** no corpo — sem aresta de interseção visível; normais suaves (sem facetas).
- **Resolução:** ≥ 128 segmentos radiais no corpo, ≥ 64 segmentos de perfil, alça com ≥ 96 segmentos ao longo da curva; normais suavizadas.
- **Modelos derivados** (cônica, chopp, latte, quadrada, xícara): cada um com **perfil próprio** e alça proporcional.
- *(Opcional)* Se preferir usar um modelo `.glb` próprio, me avise qual arquivo enviar; **não baixe modelos de terceiros**.

### 9.2 Material de cerâmica (fotorrealismo)

- `MeshPhysicalMaterial` com **esmalte brilhante**: rugosidade baixa (≈ 0,18–0,28), **clearcoat ≈ 1** com rugosidade de clearcoat baixa (≈ 0,04–0,1), `ior ≈ 1.5`, reflexos de ambiente via HDRI de estúdio, **microvariação sutil de rugosidade** (procedural) para tirar o aspecto "plástico perfeito".
- **Interior** com brilho próprio e ligeiro escurecimento por oclusão ambiente; **borda** com realce especular fino.
- **Arte sublimada:** acompanha o brilho do esmalte (cores fiéis, sem lavar nem escurecer); manter o modo **"cor fiel"** existente; saída sRGB e tone mapping neutro.
- **Variantes preservadas:** branca, **colorida (alça + interior)**, **toda colorida**, **mágica** (preta que revela a arte pelo calor; manter controles de calor, direção e dissolução).
- Cores separadas de **corpo, alça, interior e base**, com amostras prontas ("branco gelo", "preto fosco", "vermelho", "azul royal", "rosa", "verde", etc.).

### 9.3 Cobertura e costura da arte

- A arte cobre a **área de impressão completa** (do pé à borda, sem faixa branca), com opção de **área da prensa** (≈ 8,7 cm de altura) e **sangria** ajustável; **giro 360°** sem vão obrigatório.
- **Costura atrás da alça**, UV contínuo, **sem mancha colorida atrás da alça** e **sem faixas coloridas/marcações na borda da arte** (bugs que eu já tinha reportado — **valide que continuam corrigidos** com a nova geometria).

---

## 10. PEDIDO 6 — ROTAÇÃO: DIREITA/ESQUERDA, VELOCIDADE E LOOP

Hoje existem `autoRotate` e `autoRotateSpeed` (0,2–6). Entregue um **painel "Câmera e movimento"** com:

- **Girar automaticamente** (liga/desliga, botão grande no palco e atalho `Espaço`).
- **Sentido:** **Direita (horário) · Esquerda (anti-horário) · Vai e volta** (pêndulo).
- **Velocidade** em linguagem humana: **segundos por volta** (ex.: 4 s, 6 s, 10 s) com slider e campo numérico; presets **Lenta · Normal · Rápida**.
- **Ponto de partida** (ângulo inicial, ex.: alça à direita / à esquerda / de frente).
- **Giro de ida e volta suave** (easing) e **linear** (padrão para vídeo).
- **Na exportação de vídeo:** escolher **sentido, voltas (0,5 / 1 / 2 / 3), duração e loop perfeito** ("ajustar duração para fechar exatamente 1 volta", sem tranco no fim).
- Outras animações de vídeo mantidas e melhoradas: **órbita da câmera, aproximação (zoom), revelação da caneca mágica, balanço, flutuação**.
- A rotação deve girar **a caneca** (e opcionalmente a **câmera**), sem a **sombra** "girar junto" de forma errada.

---

## 11. PEDIDO 7 — SOMBRAS E SOMBREAMENTO (INCLUSIVE NO VÍDEO)

Hoje existem `contactShadow` e `castShadow` e a suavidade da luz. Crie um grupo **"Sombra"** (em **Luz e sombra**) e garanta que **a sombra apareça no vídeo e na imagem**:

- **Ligar/desligar sombra** (padrão **ligada**), e **"Sombra no vídeo"** explícito no diálogo de exportação.
- Controles: **intensidade**, **suavidade (desfoque)**, **distância**, **ângulo/direção da luz**, **cor da sombra** (tom neutro/quente/frio) e **opacidade**.
- **Dois tipos:** **sombra de contato** (escurecimento bem perto da base, ancora a caneca) e **sombra projetada** (suave, no chão), combináveis.
- **Fundo transparente:** manter a sombra como **camada semitransparente real** ("shadow catcher") em **PNG/WebP e WebM com alfa**, para o cliente aplicar em outro fundo.
- **Qualidade de exportação:** mapa de sombra de alta resolução (≥ 2048, ideal 4096 em exportação), **sem serrilhado, sem "shadow acne", sem faixas (banding), sem corte nas bordas do plano de sombra, sem piscar (flicker) entre quadros** e **consistente entre prévia e exportação**.
- Casos a testar: caneca **flutuante**, **deitada**, **inclinada**, **várias canecas** (sombras que se cruzam), cada tipo de chão e fundo (claro, escuro, foto).

---

## 12. PEDIDO 8 — EXPORTAÇÃO DE VÍDEO SEM PERDA DE QUALIDADE (PRIORIDADE ALTA)

**Problema relatado:** mesmo em Full HD, ao colocar o vídeo no editor e **ampliar**, a arte da caneca perde qualidade. Quero **exportação "full"**, nítida mesmo depois de ampliada.

### 12.1 Causas confirmadas no código (revalide)

- `video-exporter.ts`: **resoluções de vídeo limitadas a 1080p** (`sq1080 | hd | vertical | wide`), sem 4K, embora `EXPORT_RATIOS` já tenha 3840×2160 para imagem.
- **Codec H.264 nível 4.0** (`avc1.640028`), que **não comporta 4K**; lista de fallback até `avc1.42E01E` (perfil baixo).
- **Bitrate com teto de 24 Mbps** (`pixels × fps × 0,26`, mínimo 6 Mbps) — insuficiente para texturas detalhadas em movimento.
- **Supersampling 1,5×** no vídeo (comentário no código: "memória/GPU sob pressão"); GIF usa 2×.
- Textura da arte limitada a **4096 px** (`CANVAS_W_EXPORT`, `MAX_ART_PX`) e **taxa de quadros só 24/30**.
- **Fallback `MediaRecorder`** grava em **tempo real, sem supersampling, 12 Mbps** — qualidade inferior.

### 12.2 O que entregar

1. **Novas resoluções de vídeo:** Full HD (1920×1080), **2K/QHD (2560×1440)**, **4K UHD (3840×2160)**, **Story 1080×1920** e **Story 4K (2160×3840)**, **Quadrado 1080 e 2160**, **Retrato 4:5 (1080×1350 / 2160×2700)**; manter as existentes.
2. **Níveis de qualidade:** **Rápida · Alta · Ultra (máxima, sem perdas perceptíveis)**.
3. **Codec correto por resolução:** H.264 **High nível 5.1** (`avc1.640033`) para 4K (e 4.2 para 1080p/60 fps); **HEVC/H.265** como opção quando o navegador suportar; detectar com `VideoEncoder.isConfigSupported` e escolher o melhor automaticamente, avisando o usuário.
4. **Bitrate de alta qualidade:** Full HD ≈ **20–35 Mbps**; 2K ≈ **35–50 Mbps**; 4K ≈ **60–100 Mbps** (modo Ultra). Deixar o teto bem acima do atual.
5. **Supersampling de 2×** (renderizar maior e reduzir com filtro de alta qualidade) em **Alta/Ultra**, com **fallback automático** se faltar memória (reduzir para 1,5× e depois 1×) **avisando** o usuário.
6. **Taxa de quadros:** **24 · 30 · 60 fps**.
7. **Textura da arte maior:** subir a textura de exportação para **8192 px** quando `gl.capabilities.maxTextureSize` permitir (fallback 4096), com **mipmaps**, **filtro anisotrópico máximo**, `colorSpace sRGB` e sem recompressão intermediária da arte.
8. **Render quadro a quadro (offline), nunca em tempo real**, para não perder quadros; **contrapressão** no encoder (respeitar `encodeQueueSize`) e muxer em memória por partes (ou `fastStart` adequado) para vídeos 4K longos sem estourar a memória.
9. **Enquadramento:** opção **"Preencher mais o quadro"** (caneca ocupando mais pixels) e margem de segurança ajustável.
10. **Saídas sem perda para editores:** **sequência de PNG em ZIP** (sem compressão com perda) e **WebM com canal alfa** (já existe — manter e melhorar), além de **MP4** (H.264/H.265).
**REQUISITO ADICIONAL DO PROPRIETÁRIO — DURAÇÃO MÁXIMA DE 20 SEGUNDOS (25/10/2026):** na aba Exportar → Vídeo, permitir duração de **3 a 20 segundos**, com presets rápidos de **5 s / 10 s / 15 s / 20 s** e entrada numérica; vale para MP4 H.264/H.265, WebM com alfa e o fallback MediaRecorder. Centralizar `VIDEO_DURATION_MIN = 3` e `VIDEO_DURATION_MAX = 20`, validar o valor no estado, na hidratação de projetos salvos e na entrada dos exportadores para impedir duração inválida; preservar o comportamento e limites próprios do GIF. A duração padrão pode permanecer 5 segundos. Garantir que o render de 20 segundos mantenha progresso confiável, timestamps regulares, controle de memória e loop suave; testar 3/5/10/15/20 s em formatos compatíveis. Em aparelhos ou navegadores sem suporte, exibir aviso em vez de prometer render 4K irrestrito.

11. **Aviso claro** quando o navegador só oferece o fallback `MediaRecorder` ("qualidade reduzida — use Chrome/Edge para 4K").
12. **Estimativa antes de exportar:** tamanho aproximado do arquivo, tempo estimado e barra de progresso com "cancelar" funcional.

### 12.3 Critério de aceite (obrigatório)

Exportar o mesmo giro em **Full HD** e em **4K Ultra**, abrir no editor de vídeo e **ampliar 200% sobre a arte**: o **4K deve ficar nitidamente superior** (sem borrão, sem blocos de compressão, sem "bandas" nos degradês, sem serrilhado nas bordas da arte e da caneca). Documentar o teste.

---

## 13. PEDIDO 9 — BIBLIOTECA DE ARTES, INSTAGRAM, FACEBOOK E BOTÕES À VISTA

- **Biblioteca de artes** (`https://clickgruda.vercel.app/`): **acrescentar** na página-guia (seção própria, seção 6.2) e como **botão visível** no Studio ("Biblioteca de artes"). **Não remover** os links/blocos da biblioteca que já existem na home.
- **Instagram (já existe no rodapé):** `https://instagram.com/clickgruda.digital` — reutilize o link existente.
- **Facebook (NOVO):** `https://www.facebook.com/artesparacanecasoficial` — **adicionar ao lado do Instagram** em **todos** os lugares onde o Instagram aparece (rodapé do site, página-guia, barra do Studio).
- **Botões bem à vista:** na página-guia (herói + bloco final) e no Studio (ícones na barra superior, com *tooltip*; no mobile, no menu "Mais"). Abrir em **nova aba** com `rel="noopener noreferrer"` e `aria-label` em português.
- Ícones de marca em SVG leves (sem bibliotecas pesadas), acessíveis e na paleta (preto com realce laranja no hover).

---

## 14. EXTRAS (inclua — pedi para colocar mais coisas, sem tirar nada)

1. **"Cenas prontas" de 1 clique:** combinam fundo + luz + sombra + câmera (ex.: *Estúdio branco, Madeira e café, Dia das Mães, Dia dos Pais, Namorados, Natal, Páscoa, Black Friday*) — aproveitando as 30 fotos já existentes.
2. **Presets de caneca:** *Branca clássica, Alça e interior coloridos, Toda colorida, Preta fosca, Mágica*.
3. **Presets de exportação para anúncio:** *Feed Instagram 1080×1350, Story/Reels 1080×1920, WhatsApp, Mercado Livre/Shopee/Elo7 (quadrado 1200×1200 em fundo branco), Catálogo*.
4. **"Pacote do anúncio" em ZIP:** 1 imagem em fundo branco + 1 imagem em cena + 1 vídeo de giro, em um clique (reaproveitando o exportador em lote).
5. **Selo de qualidade da arte:** "Boa / Média / Baixa resolução" em linguagem simples (a partir do DPI efetivo), com dica de como melhorar.
6. **Atalhos visíveis** (menu "?" com a lista) e **busca de ajustes** (`Ctrl+K`).
7. **Qualidade adaptativa na interação:** renderizar em resolução menor enquanto o usuário arrasta/gira e voltar à resolução cheia ao parar (sensação de fluidez).
8. **Indicador de desempenho** (FPS) opcional e **modo econômico** para celulares fracos.
9. **Compartilhar prova para o cliente** (Web Share com a imagem + texto pronto para WhatsApp), mantendo fallback de download.
10. **Meus presets** (salvar combinações de caneca/cena/luz no navegador).
11. **Textos de ajuda e erros amigáveis** em português para cada problema comum (arquivo grande, formato inválido, WebGL indisponível, navegador sem WebCodecs).

---

## 15. FASES DE TRABALHO (ordem obrigatória)

| Fase  | Entrega                                                                                                                                                       | Parada                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **1** | Auditoria (seção 4)                                                                                                                                           | "Fase 1 concluída — responda CONTINUAR" |
| **2** | **Design system** (tokens, componentes de controle da 7.3) + **nova estrutura do Studio** (barra superior, trilho, painéis, palco, mobile) + **Resetar tudo** | idem                                    |
| **3** | **Somente canecas** (limpeza dos modelos + migração de projetos antigos) + **nova geometria e materiais da caneca** (seção 9)                                 | idem                                    |
| **4** | **Luz e sombra** (seção 11) + **Câmera e movimento** com rotação (seção 10)                                                                                   | idem                                    |
| **5** | **Exportação de vídeo/imagem sem perda** (seção 12) + extras de exportação                                                                                    | idem                                    |
| **6** | **Página-guia + rotas** (seção 6) + Facebook/Instagram/Biblioteca (seção 13)                                                                                  | idem                                    |
| **7** | **Extras** (seção 14) + **pente fino de bugs** (seção 16) + QA final + documentação                                                                           | entrega final                           |

Em **cada fase** informe: **arquivos criados/alterados/removidos**, o que mudou, **como testar** e riscos. Se tiver ambiente de código, **devolva o projeto completo atualizado em ZIP** + `CHANGELOG`; se não, entregue os **arquivos completos** da fase.

---

## 16. CAÇA A BUGS (inclua na auditoria e corrija)

Revalide e corrija (com teste para cada item):

1. **Mancha/costura atrás da alça** e **faixas coloridas na borda** da arte (já reportados).
2. **Segunda caneca "nascendo grudada"** ao duplicar; sobreposição/posicionamento errado com inclinação ou modelos de alturas diferentes.
3. **Fundo com proporção errada, escurecido ou que persiste** depois de trocar o tipo de fundo.
4. **Sombra:** serrilhada, cortada nas bordas, piscando entre quadros, ausente no vídeo, errada em fundo transparente ou com a caneca flutuante/inclinada.
5. **Exportação:** quadros pulados, vídeo com tranco no fim do loop, **arte menos nítida nas canecas acompanhantes**, divergência entre prévia e arquivo final.
6. **Reset:** campos que não voltam ao padrão, arte ou fundo que permanecem.
7. **WebGL:** perda de contexto, falha de memória em 4K, comportamento em Safari/iOS e Firefox.
8. **Projetos antigos** com modelos removidos; `.cgstudio` e IndexedDB.
9. **Rótulo "turntable"** em qualquer lugar visível; textos em inglês na interface.
10. **Acessibilidade:** foco visível, navegação por teclado, `aria-label` nos ícones, `prefers-reduced-motion`.

---

## 17. QA FINAL (checklist obrigatório)

- &#x20;Só existem canecas (nenhum squeeze/copo/garrafa em UI, tipos, ilustrações, textos).
- &#x20;Nada **essencial** foi removido; a tabela de decisão está entregue e o que foi retirado está listado no `CHANGELOG`.
- &#x20;Layout **claro (branco/preto/laranja)**, organizado em categorias, com "Essencial" e "Avançado".
- **Resetar tudo** visível, com confirmação, "Desfazer" e reset real.
- &#x20;Caneca nova: **base lisa**, alça encorpada, esmalte realista, arte cobrindo 100% sem mancha atrás da alça.
- &#x20;Rotação: **direita/esquerda/vai e volta**, velocidade em segundos por volta, **loop perfeito** no vídeo.
- **Sombra** configurável e presente em vídeo/imagem (inclusive alfa).
- **4K Ultra** nítido ao ampliar 200% (teste documentado); 60 fps; HEVC quando disponível; PNG em sequência.
- &#x20;Página-guia `/mockup-caneca-3d` + Studio `/mockup-caneca-3d/studio`; pontos de entrada atualizados; controle premium preservado.
- &#x20;Biblioteca de artes na página-guia **e** mantida na home; **Instagram + Facebook** ao lado em todos os lugares.
- &#x20;Responsivo (360/390/768/1280/1920 px), navegação por teclado, contraste AA, Lighthouse da página-guia ≥ 90.
- &#x20;Projetos antigos e `.cgstudio` abrem; migração de modelos removidos funcionando.
- &#x20;Documentação atualizada: `GUIA_ATUAL.md`, `CHANGELOG`, scripts de regressão (`regressions.mjs`).
- **Nenhuma alteração** em deploy, build, Prisma/Neon, autenticação, cobrança ou `package.json` (ou autorização prévia registrada).

---

## 18. ENTREGA FINAL (em linguagem simples)

Ao terminar, entregue:

1. Resumo do que mudou (poucas linhas, sem jargão).
2. **Tabela "antes × depois"** das funções (mantida / movida para Avançado / removida, com o porquê).
3. **Passo a passo simples para subir:** substituir os arquivos → enviar para o GitHub → a Vercel faz o deploy sozinha (sem mexer em configuração).
4. Lista do que ficou pendente ou depende de mim (por exemplo, imagens de demonstração para a página-guia).

---

## 19. RESULTADO ESPERADO

Um Mockup Studio 3D de caneca **com aparência e acabamento de produto profissional**: caneca realista com alça encorpada e fundo liso, interface clara em branco/preto/laranja com tudo organizado, botão de resetar sempre à vista, rotação e sombras totalmente controláveis, **vídeo 4K nítido mesmo ampliado**, página-guia que explica o uso em poucos passos, biblioteca de artes e redes sociais (Instagram e Facebook) bem à vista. **Ninguém deve olhar e pensar "isso foi feito por IA" ou "isso é amador".**