> Entrega final de 27/10/2026: [ajustes finais](../../AJUSTES_FINAIS_MOCKUP_STUDIO.md) e [validação final](VALIDACAO_FINAL.md).

# Atualização V2 — 27/10/2026

A Clássica agora tem corpo cilíndrico, borda arredondada, fundo rebaixado e material compartilhado com a alça. O painel prioriza tamanho/alinhamento da arte e paleta visual. A barra do palco reúne giro 360°, cinco vistas e centralização. Coordenadas ficam em **Avançado (Modo Manual)**.

Em **Exportar imagem**, escolha Redes, Stories ou Print 300 DPI e depois Cenário atual, Branco ou Transparente. Vídeo, GIF, lote, folha e projetos continuam disponíveis nas respectivas abas. No celular, as ações do cabeçalho ficam no menu de três pontos.

Leia [STUDIO_MOCKUP_V2.md](../../STUDIO_MOCKUP_V2.md) e [VALIDACAO_V2.md](VALIDACAO_V2.md) para as alterações e a verificação desta entrega. As seções abaixo registram os recursos e o histórico anterior.

---

# Mockup Studio 3D — guia atualizado (25/10/2026)

**Rotas:** `/mockup-caneca-3d` apresenta o produto; `/mockup-caneca-3d/studio` abre o editor com o **mesmo portão premium** da home. Links antigos da home foram atualizados. O Studio mantém seus projetos `.cgstudio` e autosave local.

**Primeiro uso:** escolha **Arte** no trilho esquerdo → envie ou cole sua estampa (Ctrl+V) → **Caneca** para escolher Clássica 325 ml (padrão), Quadrada, Cônica, Chopp, Latte ou Xícara → **Cena** para fundo → **Luz e sombra** → **Câmera** para giro → **Exportar**.

**Exportação de vídeo:** agora permite selecionar entre **3 e 20 segundos** (atalhos 5/10/15/20 s), 24/30/60 fps, resolução Full HD, QHD e 4K (inclui 4:5, vertical e quadrado). Níveis Rápida, Alta, Ultra. O formato efetivo, bitrate e resolução dependem do suporte WebCodecs, WebGL e memória do seu navegador/dispositivo. Em aparelhos incompatíveis, reduza para Full HD; não há promessa de 4K em todos os navegadores. Vídeo com ALFA permanece WebM, somente quando o encoder VP9 com alfa separado está disponível.

**Giro:** botão na barra do palco e painel Câmera; sentido Direita/Esquerda/Vai e volta, segundos por volta, ajuste de voltas no vídeo. O Studio move a caneca no preview sem rotacionar a câmera junto. A exportação de giro amostra frames sem repetir a pose inicial na emenda.

**Tema:** claro por padrão, branco/preto/laranja; alternância para tema escuro na barra superior. **Resetar tudo** confirma antes de restaurar e oferece **Manter a arte que enviei** e **Desfazer**. A busca por ajustes abre com Ctrl+K.

**Presets:** cores de caneca, cenas básicas, fundos prontos, efeitos e uma configuração pessoal salva no navegador. Para sua biblioteca use o botão **Biblioteca** no topo.

**Atenção:** o arquivo continua local. Antes de trocar de computador ou limpar dados do navegador, salve o arquivo `.cgstudio`. Projetos que mencionam recipientes antigos fora da linha de canecas são migrados para **Clássica 325 ml**.

---

## Informações e atalhos da versão anterior

# Mockup Studio — guia da versão atual

## Começar

O acesso continua pelo fluxo premium existente no aplicativo. Abra o Studio, use uma arte de exemplo ou envie seu PNG/JPG/WebP/SVG/AVIF pela biblioteca Artes. Também é possível colar com Ctrl+V ou soltar o arquivo no canvas. Arquivos de arte e fundo são processados no navegador; os fundos integrados são carregados como ativos estáticos.

1. Em Bases, escolha a forma e a variante. As bases de apoio redonda/quadrada antigas continuam disponíveis em Cena.
2. Em Artes, aplique a imagem à peça selecionada. Use Preencher, Ajustar ou Esticar; abra ajustes, área de impressão e camadas de impressão conforme necessário.
3. Nas propriedades à direita, configure posição, rotação, escala, cores, acabamento e ajustes da arte. A comparação antes/depois remove temporariamente os ajustes da arte.
4. Escolha uma composição na faixa inferior. Selecione uma caneca com clique; Shift+clique acrescenta/remove peças da seleção. O painel Camadas oferece seleção e ordenação.
5. Use gizmos Mover/Girar/Escalar para editar a peça ativa. Campos numéricos permitem rotações livres e altura. Travar impede alterações; Ocultar mantém a peça no projeto.
6. Em Fundos, escolha foto original ou envie a sua. Ajuste enquadramento, brilho, desfoque, contraste e vinheta. Em Cena, personalize luz, HDRI, chão, câmera, efeitos e variantes avançadas.
7. Renomeie o projeto, salve pelo ícone de disquete ou exporte um `.cgstudio` em Artes → Arquivo de projeto. O arquivo portátil leva as imagens e o ambiente HDRI junto.
8. Abra Exportar: Imagem, Vídeo, GIF, Lote e Folha de sublimação. O lote da biblioteca Fundos gera a mesma cena sobre os fundos marcados.

## Atalhos

| Atalho | Ação |
|---|---|
| V | Selecionar |
| G | Mover peça |
| E | Girar peça |
| S | Escalar peça |
| A | Mover arte |
| H | Pan da câmera |
| Ctrl/Cmd+D | Duplicar seleção, inicialmente separada |
| Delete/Backspace | Apagar peças selecionadas não travadas |
| Ctrl/Cmd+A | Selecionar todas as peças |
| Ctrl/Cmd+Z | Desfazer |
| Ctrl/Cmd+Y ou Ctrl/Cmd+Shift+Z | Refazer |
| Setas | Mover seleção no plano X/Z; Shift aumenta o passo |
| F | Enquadrar todas as peças |
| R | Girar seleção 45° no eixo Y |
| Espaço | Alternar giro automático |
| Ctrl/Cmd+V | Colar imagem |
| Shift+clique | Alternar peça na seleção múltipla |
| Roda do mouse | Aproximar/afastar a câmera |
| Botão direito arrastado | Pan da câmera |

Atalhos não interceptam a digitação nos campos. O gizmo atua na peça ativa; alinhamento/distribuição e movimentos por seleção atendem à multisseleção. No celular, os painéis abrem em gavetas.

## Saída

Imagem PNG/JPG/WebP, presets 1080×1080, story 1080×1920, paisagem 1920×1080, 4K 3840×2160 e medidas personalizadas do editor existente. PNG e WebP aceitam transparência; JPG recebe fundo. Vídeos dependem do codec oferecido pelo navegador. O fallback MediaRecorder pode entregar WebM. Folha 300/600 DPI usa a área do modelo selecionado; medidas são aproximações visuais e devem ser conferidas no produto físico.

Compartilhar abre o compartilhamento de arquivos do sistema, quando disponível. Para WhatsApp, escolha o aplicativo no seletor do dispositivo. Sem Web Share, a imagem é baixada para anexar manualmente.

Em **Exportar → Vídeo**, ative **ALFA — fundo transparente** para gerar um vídeo WebM VP9 com canal alfa. O fundo, a foto e as bases de apoio são removidos apenas durante a exportação; as peças, sombras e marca d'água são preservadas. Efeitos de tela inteira ficam desativados nesse render. O navegador precisa oferecer WebCodecs/VP9; não há fallback opaco nesse modo. Mais detalhes em [EXPORTACAO-ALFA.md](EXPORTACAO-ALFA.md).

## Plano e integração

`<MockupStudio plan="free" />`, `plan="pro"` ou `plan="premium"` recebe o plano já autorizado pelo host. O padrão premium preserva o portão de acesso original. Free força a marca Click&Gruda; Pro e Premium permitem ajustar a marca existente. Esta política de interface não constitui segurança de cobrança. Nenhum endpoint de autenticação ou assinatura foi alterado.

## Arquitetura

- `mockup-studio.tsx`: shell, sessão, importação e atalhos.
- `ui/workspace.tsx` e `workspace.css`: layout e propriedades contextuais.
- `state/store.ts`: estado, seleção, objetos, composições e histórico.
- `scene/model-geometry.ts`: formas e suporte no chão para rotações.
- `scene/mug.tsx`: textura por peça, materiais, seleção e gizmos.
- `lib/art-canvas.ts` e `art-adjustments.ts`: impressão e ajustes de imagem.
- `lib/environment-registry.ts`: HDRI Radiance sob demanda e registro local.
- `ui/premium-backgrounds.tsx`: biblioteca e lote de fundos.
- `lib/portable-project.ts` e `ui/projects-dialog.tsx`: arquivo portátil, IndexedDB e autosave.
- `exporters/`: motor compartilhado, imagem, vídeo/GIF, lote e folha.

Leia `PROXIMA_VERSAO.md` para os limites explícitos. Nenhuma configuração de deploy, banco, ambiente ou build foi alterada.
