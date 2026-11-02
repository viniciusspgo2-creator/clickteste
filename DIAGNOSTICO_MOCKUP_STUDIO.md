> Histórico da versão anterior. Para o estado desta entrega, consulte `STUDIO_MOCKUP_V2.md` e `docs/mockup-studio/VALIDACAO_V2.md`.

# Diagnóstico inicial — Mockup Studio 3D

Data: 23/10/2026. Fonte primária: os 8.337 registros de linha do módulo original, documentação interna e 17 prints enviados. Esta análise precedeu a alteração dos componentes. A implementação final está no CHANGELOG.

## Inventário completo do módulo recebido

1. Arte: upload PNG/JPG/WebP/SVG/AVIF; arrastar e soltar; Ctrl+V; exemplo procedural; preencher/conter/esticar; escala; posição horizontal com wrap; posição vertical; rotação; espelhar; repetir 1–4 vezes; área prensa, altura cheia, forno ou personalizada (largura, altura, posição); encaixar por largura ou altura; texto na caneca (cor, tamanho, altura); DPI efetivo e alertas.
2. Produto: uma geometria de cerâmica 325 ml, corpo Lathe com parede, interior, borda arredondada e pé; alça C com seção elíptica; branca, colorida e mágica; cor combinada alça/interior; calor, direção e dissolução da revelação; animação de revelação e comparação fria; rotação Y e inclinação limitada X/Z; escala e altura do herói.
3. Multicaneca: até três acompanhantes; arte compartilhada; cor, variante, calor, visibilidade da arte, X/Z, rotação Y e escala individuais; Duo, Trio, Quarteto e Vitrine; distribuição e correção automática de sobreposição.
4. Cena: branco, escuro, gradiente, sólido, imagem ou alfa; cor e ângulo do gradiente; chão contínuo, flutuante, pedestal, espelhado, base redonda e base quadrada; brilho de fundo; flutuação; sombras projetada e de contato.
5. Fundo por imagem: upload 25 MB, redução 4096 px; cover/contain/stretch; zoom; X/Y; rotação; espelho; blur; brilho; ajuste direto com guias e snap; reset por duplo clique; casar luz com cor média; oito cenários procedurais regeneráveis.
6. Luz: seis presets; temperatura Kelvin; intensidade, rotação, suavidade e ambiente; luz principal, preenchimento, recorte, softbox e ambiente HDR procedural com Lightformers.
7. Câmera: lente 24–100 mm; 12 vistas com transição; órbita, pan, zoom; giro automático e velocidade; foco por F/duplo clique; enquadrar grupo; grade de terços; fullscreen.
8. Efeitos de cena: ativação opcional, seis estilos, exposição, contraste, saturação, temperatura, bloom, vinheta e filme.
9. Imagem: PNG/JPG/WebP, até 8192 px, proporções quadrada, retrato, story, paisagem, Pinterest, catálogo e custom; multiplicadores de resolução; qualidade; alfa em PNG/WebP; supersampling e enquadramento.
10. Vídeo: MP4 H.264 com WebCodecs/mp4-muxer, fallback MediaRecorder; giro, órbita, zoom e revelação; duração, fps e quatro resoluções.
11. GIF: paleta adaptativa, loop, largura 360/480/640 e fps 10/15/20; mesmos movimentos.
12. Lote: ângulos × variantes fria/quente em ZIP; progresso; PNG ou JPG.
13. Folha para sublimação: 300/600 DPI, guias, margem de segurança, modo de volta completa, espelhamento e texto.
14. Marca d’água: texto, posição de canto, opacidade e tamanho; aplicada no motor compartilhado.
15. Projetos: IndexedDB, miniatura, salvar/abrir/renomear/duplicar/excluir; arte original e fundo; autosave 25 segundos e pagehide; restauração da última sessão; histórico coalescido de 60 passos.
16. Operação: desktop com dois painéis, mobile com abas, estados de carregamento/erro de upload, recuperação WebGL, atalhos Ctrl+Z/Shift+Z/Y, R, F, Espaço e Ctrl+V.

## Bugs e limites confirmados no código

| Achado | Evidência inicial | Tratamento |
|---|---|---|
| Margem branca no pé/borda | Padrão usa 0,62 a 9,32 cm; parede/borda chega a 9,505 cm | Área completa passa a ser padrão; prensa permanece opcional |
| “360°” incompleto | GAP_MIN_CM=1,9 | Volta completa sem vão obrigatório |
| Cores alteradas | ACES aplicado à textura sRGB sob luzes quentes e grading global | Saída sRGB, tone mapping neutro e modo de cor preservada no material |
| Verniz não ajustável por peça | Roughness/clearcoat/specular fixos em MugMesh | Material independente e sliders |
| Mancha atrás da alça | UV e wrap usam faixas externas; gap obrigatório é visível como remendo | Costura no verso, UV contínuo e modo sem gap; filtros de cor corrigidos |
| Caneca extra grudada ou afastada à força | Correção usa herói fixo em 0,0 e ignora inclinação, altura/modelo | Duplicação conservadora; posicionamento livre sem correção invasiva |
| Peça sempre presa ao centro | Herói sem X/Z; acompanhantes sem X/Z completos de rotação | Objetos independentes e gizmos |
| Fundo com proporção incorreta | Conversão de UV não divide a largura por aspecto da imagem | Crop por aspecto correto nos três modos |
| Fundo escurecido | Shader amostra sRGB decodificado e não aplica transformação de saída | Conversão de saída explícita |
| Fundo antigo persiste | useFrame define visible apenas por existência de textura | Respeita tipo de fundo e transparência de exportação |
| Chão circular | Pedestal e bases são circulares por escolha; contínuo já era plano sem borda | Contínuo permanece padrão, bases opcionais preservadas |
| Controles desorganizados | 4 seções na esquerda e 3 na direita sem biblioteca por contexto | Navegação de biblioteca e inspetor da seleção |
| “turntable” | Termo presente em nomes/comentários internos; não localizado como rótulo visível nesta versão | UI usa “Girar automaticamente”; nomes internos não aparecem |
| Somente um modelo | Branca/colorida/mágica são variantes do mesmo corpo | Nove formas procedurais, sem depender de modelos externos |
| Perda futura de arte independente | Persistência recebida salva um único blob de arte | Imagens de todas as peças incorporadas ao projeto |
| Exportação de acompanhantes menos nítida | Apenas mug-body recebe textura 4096 no beginFrames | Todas as peças recebem textura de exportação e restauração |

Os sintomas enviados pelo usuário foram tratados como relatos até haver evidência no código ou teste. Sem acesso ao ambiente publicado, não se atribui cada relato a uma causa única.

## Referência e comparação comportamental

O app público do Rapid foi aberto e seus controles de Artes, Principal/Decalque/Base e máscara metálica foram observados. A cena permaneceu em “Carregando…” no navegador disponível, portanto não foi possível completar um mockup ou verificar a animação de entrada ali. Os prints demonstram cores por parte, material, luzes, fundo/mesa e composições. Não foram copiados código, modelos, ícones, marcas ou fotografias do concorrente.

Atualização após receber o vídeo: a gravação de 3min01s foi inspecionada em quadros e trechos ampliados. O documento `docs/mockup-studio/ESPECIFICACAO_FUNCIONAL_RAPIDMOCKUP.md` registra 120 controles/ações com tempos e incertezas; ele prevalece para a descrição do concorrente. A tabela abaixo reúne o diagnóstico inicial e o estado final das ações.

“Não confirmado” significa que as fontes disponíveis não permitem afirmar presença ou ausência. Esta tabela não inventa funções dos concorrentes.

| Função | Tenho na entrada | Rapid Mockup | Ação |
|---|---|---|---|
| Produto 3D com órbita | Sim | Sim, fonte pública/prints | Manter/melhorar |
| Interior, alça e cerâmica PBR | Sim | Aparência observada nos prints | Melhorar |
| Cor por corpo/alça/interior | Parcial (alça+interior juntos) | Sim, prints | Implementar cores separadas |
| Cor da base | Não separada | Sim, prints | Implementado: cor da base e imagem inferior separadas |
| Material com brilho/rugosidade/reflexo | Parcial, valores fixos | Sim, prints | Implementar controles |
| Arte principal com UV | Sim | Sim | Melhorar cobertura e cor |
| Decalque independente e arte na base | Não | Sim, abas observadas | Implementados decalque e impressão inferior |
| Máscara metálica por arte | Não | Controle observado; funcionamento não testado | Implementada máscara baseada no alfa da arte |
| Preencher/ajustar/esticar | Sim | Ajustes visuais nos prints; nomes não confirmados | Manter |
| Área de impressão e posição | Sim | Sim, prints | Melhorar e adicionar sangria |
| Texto na caneca | Sim | Não confirmado | Manter |
| Repetição, espelho, DPI e folha para prensa | Sim | Não confirmado | Manter |
| Máx. de canecas e composição | Quatro | Par/trio observados | Ampliar a oito peças e sete presets |
| Movimento XYZ e rotação XYZ por objeto | Parcial | Poses múltiplas observadas | Implementar |
| Trava, ocultar, apagar e duplicar | Parcial | Não confirmado integralmente | Implementar |
| Camadas, multisseleção e alinhamento | Não | Não confirmado | Implementar |
| Histórico e atalhos | Sim, parcial | Não confirmado | Manter/ampliar |
| Mesa e fundo próprio | Sim | Sim, prints | Manter/corrigir |
| Fundo premium por categoria | Oito procedurais | Galeria observada | 30 fotos originais geradas e integradas |
| Desfoque e brilho do fundo | Sim | Sim, prints | Manter; adicionar contraste/vinheta |
| Ambiente e luzes individuais | Rig + controles globais | Sim, prints | Implementados controles individuais e upload HDRI |
| Modelos de canecas e copos | Um corpo | Vários, fonte oficial e prints | Nove formas próprias |
| Imagem com alfa e alta resolução | Sim | Imagem/vídeo oficiais; formatos exatos não confirmados | Manter; preset 4K |
| MP4/GIF/revelação térmica | Sim | Vídeo oficial; GIF não confirmado | Manter |
| ZIP por ângulo/variante | Sim | Não confirmado | Manter |
| Lote por fundos | Não | Não confirmado | Implementar |
| Projeto local e arquivo portátil | IndexedDB | Trabalhos no app; funcionamento não testado | Manter e adicionar .cgstudio |
| Compartilhar prova | Download manual | Botão Compartilhar observado | Web Share com arquivo; fallback download |
| Tema claro/escuro e mobile com gavetas | Parcial | Interface clara observada | Implementar |
| Entrada animada da caneca | Não específica | Confirmada também no vídeo de 00:01–00:03 | Implementada animação própria acessível |

## Outras referências oficiais

- Rapid: https://rapidmockup.net/pt/app/caneca e https://rapidmockup.net/pt/crie-mockups-de-canecas-e-copos — modelos, 3D, personalização, imagem/vídeo.
- Placeit: https://placeit.net/mockups/coffee-mugs e https://placeit.net/learn/tutorials/how-to-create-mockup — fluxo escolher, aplicar, revisar e baixar. Referência de simplicidade e fotografia, sem importar templates.
- Canva: https://www.canva.com/newsroom/news/canva-launches-smartmockups-tool/ — integração de Smartmockups, enquadramento e material/sombra por contexto. A própria página identifica Smartmockups como Canva Mockups.
- Canva: https://www.canva.com/pt_br/help/mockup-design/ — preenchimento, ajuste e recorte inteligente. Referência para controle explícito de encaixe.
- Mediamodifier: https://mediamodifier.com/features — drag-and-drop, edição, templates e apresentação do produto. Referência de biblioteca navegável e exportação.
- Three.js: https://threejs.org/docs/pages/MeshPhysicalMaterial.html e https://threejs.org/manual/en/color-management.html — material físico, clearcoat, espaço de trabalho linear e saída sRGB.

## Fronteiras mantidas

Alterações restritas a `src/components/tools/mockup`, novos ativos em `public/mockup/backgrounds` e documentação. Sem alteração em package.json, lockfiles, build, Vercel, Neon, variáveis, autenticação, deploy ou API de cobrança. O plano é recebido como propriedade do componente; a validação de assinatura continua pertencendo ao host existente.
