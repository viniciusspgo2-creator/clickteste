# Limites e próxima versão

Esta entrega amplia o editor existente e preserva os exportadores anteriores. Os itens abaixo permanecem parciais ou exigem trabalho adicional.

| Item | Estado e próximo passo |
|---|---|
| 60 fps desktop e celular médio | Não certificado em hardware real. A validação usou Chromium com GPU por software. Medir em aparelhos reais antes de estabelecer meta cumprida. |
| Perspectiva dos 30 fundos | Fotografias 2D originais, com ajuste manual de câmera e posição. A perspectiva da foto não gira junto com o produto; para isso, usar HDRI e cenário 3D calibrado. |
| Fundo fotográfico nativo 4K | Fotos entregues em 1536×1024. Produto é renderizado na resolução de exportação; fotos são ampliadas. Prompts permitem regeneração em maior tamanho. |
| Calibração industrial | Formas, capacidades e áreas são aproximações visuais. Medir os produtos reais e seus gabaritos antes de imprimir; não são moldes certificados de fabricantes. |
| Conicidade e distorção da arte | UV contínuo e proporcional ao modelo, com área parametrizada. Compensação industrial de estampa para tronco de cone requer gabarito específico. |
| Térmica/squeeze | Geometrias próprias simplificadas com tampa; não há rosca interna, válvula, vedação nem desmontagem de produto. |
| Biblioteca de materiais do Rapid | Cerâmica e controles PBR por peça, máscara metálica e cor por parte implementados. Catálogo extenso de papel, couro, madeira, metais e material independente por cada seção fica pendente. |
| Elementos/recortes | Decalque no produto implementado. Recortes e imagens livres no cenário como camadas 2D ainda não implementados. |
| Alça de coração e modelos especiais | Nove formas entregues com alça C quando aplicável. Novas alças, acessórios e modelos de fabricantes ficam pendentes. |
| Cor do produto em degradê | Cores sólidas independentes implementadas. Editor de múltiplas paradas de degradê por parte ainda pendente. |
| Deslocamento físico da superfície | Posição da impressão e sangria implementadas. Displacement real por imagem e controles separados de relevo de cada seção ainda pendentes. |
| Editor livre avançado | Gizmos, atalhos, multisseleção, alinhamento/distribuição e grade de terços presentes. Laço de seleção, guias arrastáveis, snap entre objetos e transformação conjunta via gizmo ainda pendentes; o gizmo opera na peça selecionada principal. |
| Planos | Política de marca d’água no cliente; host deve fornecer plano já autorizado. Não existe nova cobrança ou segurança de assinatura no backend nesta entrega. Acesso premium existente continua como recebido. |
| Compartilhar 3D | Compartilhamento de imagem pelo sistema e projeto portátil disponíveis. Link público 3D, colaboração e sincronização em nuvem exigem backend e não foram implementados. |
| WhatsApp | Web Share depende de navegador/dispositivo e das opções instaladas; não há envio automático nem garantia de o WhatsApp aparecer. Alternativa: baixar imagem e anexar manualmente. |
| Vídeo | MP4 depende de WebCodecs/H.264 ou MediaRecorder disponível; fallback pode gerar WebM. Nenhum navegador é obrigado a oferecer todos os codecs. |
| Pós-processamento | Os efeitos globais existentes continuam opcionais e podem alterar a cor final. Para maior fidelidade, manter efeitos neutros e usar comparação da arte. |
| Portabilidade/histórico | Arquivo salva estado atual e ativos, não toda a pilha de desfazer/refazer. Autosave e projetos locais dependem do armazenamento do navegador. |

O vídeo não abriu o diálogo de exportação nem mostrou uma matriz de planos do Rapid. O aviso observado pede entrada na conta para remover a marca d’água; não comprova exigência de assinatura paga. Não foram inventados formatos, tamanhos ou preços do concorrente.
