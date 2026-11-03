## V5.14 — Integridade das imagens exportadas e 300 DPI (staging)

- Exportação PNG/JPEG/WebP confere assinatura real antes do download; impede salvar PNG fallback com extensão `.webp` ou `.jpg`.
- Metadados PNG de estampa: um único chunk `pHYs` correto com 300 DPI, removendo DPI antigo mesmo depois de outros chunks; mantém IDAT e demais metadados, recalcula CRC e rejeita PNG estruturalmente truncado.
- 10 novos testes, inclusive `exportDesign` integrado; 193/193 testes aprovados, 676 imports relativos sem problemas e prova real no Chromium com bytes, metadados e pixel intacto.
- Sem alterações de schema, API, produção ou configuração de variáveis. Build Next.js completo e homologação integrada ainda pendentes em CI/`clickteste` (Prisma local indisponível).
- Relatório: `docs/CLICKGRUDA-V5-14-INTEGRIDADE-IMAGENS-DPI.md`.

## V5.13 — Timeout completo no recebimento de perguntas do assistente (staging)

- O corpo da solicitação do assistente agora tem **prazo máximo de 8 segundos**, inclusive uploads fragmentados sem `Content-Length`. Conexões interrompidas também liberam a leitura e retornam HTTP 408 quando o servidor ainda pode responder.
- Preserva o limite de 4096 bytes para perguntas, validação JSON/MIME e a privacidade do projeto; limpa leitores, listeners e timer nas falhas.
- Sete novos testes de regressão, incluindo uma chamada real do handler da rota com corpo suspenso e confirmação de que o provedor não foi chamado. **183/183 testes aprovados, 675 imports locais resolvidos, tipagem estrita isolada aprovada.**
- Sem alterações Neon/R2 e sem deploy; build Next.js completo, API real e cenários browser end-to-end continuam pendentes.
- Relatório: `docs/CLICKGRUDA-V5-13-REQUESTS-ASSISTENTE.md`.

## V5.12 — Resiliência real do assistente IA (staging)

- Timeout de 15 s do endpoint agora protege desde a conexão até o **final do corpo HTTP** da resposta do provedor, inclusive JSON fragmentado.
- Leitura de resposta limitada a 16 KiB, inclusive quando o provedor não envia `Content-Length`; UTF-8/JSON inválidos geram fallback seguro sem expor credenciais.
- Interface do assistente: POST limitado a 20 s, GET de disponibilidade limitado a 6 s, sem spinner preso ou respostas antigas sobrescrevendo perguntas recentes.
- 9 testes de regressão novos e integração com provedor simulado: **176/176** testes aprovados, **675** imports internos resolvidos, tipagem isolada do novo módulo aprovada.
- Nenhuma migração Neon, nenhuma nova variável, nenhum deploy realizado. Build Next.js completo e conexão com API real ainda precisam de homologação na `clickteste`.
- Relatório: `docs/CLICKGRUDA-V5-12-ASSISTENTE-RESILIENCIA.md`.

## V5.11 — Fontes confiáveis e intervalo MP4 seguro (staging)

- Carregamento de fontes premium com prazo de 12 segundos, detecção de fonte ausente, limpeza do recurso em falhas e repetição após erro.
- O Editor mantém prévias tolerantes, mas exportação em modo `strict` deixa de aceitar silenciosamente uma fonte substituta quando a fonte pedida falha.
- Espera por `document.fonts.ready` limitada; exportação passa a informar erro claro em conexões instáveis.
- MP4 com início do trecho fora da duração real agora é rejeitado em vez de exportar um clipe inesperado dos últimos instantes.
- 167 testes automatizados aprovados, 674 imports verificados, tipagem isolada aprovada e prova de timeout/erro no Chromium.
- **Limite:** build Next.js e reprodução MP4 real ainda pendentes de homologação na `clickteste`. Sem migração Neon, sem alteração de variáveis e sem deploy.
- Relatório: `docs/CLICKGRUDA-V5-11-FONTES-MP4-HOMOLOGACAO.md`.

## V5.10 — carregamento de imagens com tempo limite e recuperação segura (staging)

- Cria `src/lib/creative/async-image-load.ts` com carregamento de imagem limitado a 15 segundos por recurso e falha explícita para imagem sem dimensões. Um recurso inacessível não mantém a prévia, a exportação ou a restauração do projeto pendentes indefinidamente.
- `design.ts`: utiliza carregador compartilhado, permite tentar novamente após erro e protege o cache: uma solicitação antiga não apaga a promessa de carregamento mais recente após limpar a sessão.
- `project-media-check.ts`: limita a 12 segundos o diagnóstico de cada imagem ou máscara durante a abertura de projetos `.cgdesign` ou recuperação local; continua preservando a arte atual se houver falha de mídia.
- Oito testes de regressão novos, incluindo timeout, imagem sem dimensões, falha de rede simulada, resposta tardia, projeto com máscara quebrada e limpeza de cache após troca de documento.
- Teste em Chromium real com PNG válido, PNG inválido e imagem simulada sem resposta. **Nenhum deploy foi executado.**
- Não altera Neon/Prisma, variáveis de ambiente, Studio 3D, formatos de exportação nem configuração de infraestrutura.

## V5.9 — Integridade real de amostras MP4 (staging)

- A validação final do vídeo agora cruza `stsz` (tamanho dos quadros), `stsc` (mapa de chunks), `stco`/`co64` (offsets) e `mdat` (dados reais), impedindo download quando quadros declarados extrapolam os bytes do arquivo.
- Aceita arquivos MP4 H.264 legítimos com `moov` antes ou depois de `mdat`, sem assumir a ordem das caixas.
- Status de progresso 100% apenas depois da verificação do MP4, evitando mensagem enganosa antes da conclusão.
- Oito testes novos cobrem vídeos reais, amostras adulteradas e regressão. Sem alteração de banco ou variáveis.
- O verificador estrutural não decodifica o fluxo H.264 completo: reprodução real continua dependendo de homologação no navegador.

## V5.8 — Segurança de importações e seleção de arquivos (staging)

- Sessões de composição invalidam uploads assíncronos quando o usuário reseta, abre outro arquivo ou troca para um novo template; decodificação tardia de imagem não insere camadas num projeto novo.
- Máscaras e arquivos MP4 locais, PDFs/PSDs e carregamento de fontes respeitam a mesma proteção. Fontes são aplicadas ao texto inicialmente selecionado, se ele ainda existir.
- Consultas antigas à biblioteca administrativa não sobrescrevem resultados de buscas mais recentes.
- Transferência Studio → Editor protegida contra resultado atrasado, preservando URLs com preset e handoff juntos.
- Dez novos testes de regressão; 140/140 aprovados. 270 arquivos de código e 672 imports verificados. Sem migração/variáveis novas.
- Build Next.js completo ainda não foi executado localmente: dependências npm/Prisma indisponíveis.

## V5.7 — Rascunhos protegidos contra gravações concorrentes (staging)

- Serializa salvamentos automáticos e exclusão do IndexedDB; invalida gravações antigas após reset ou troca de projeto.
- Restauração automática só aplica o rascunho se a composição não foi editada enquanto os dados eram carregados.
- Inspeção de imagem/máscara antes de restaurar rascunhos; referências temporárias obsoletas são descartadas com aviso.
- 130/130 testes locais; 671 imports resolvidos; prova isolada de concorrência no Chromium. Build Next.js completo ainda pendente de dependências.
- Relatório: `docs/CLICKGRUDA-V5-7-HOMOLOGACAO-RASCUNHOS.md`.

## V5.6 — Recuperação segura de projetos e prevenção de perda de trabalho (staging)

- Pré-verificação de imagens, máscaras e vídeo antes de abrir backups `.cgdesign` e projetos do histórico local; falhas nas camadas impedem substituir a arte corrente.
- Resultado de importação obsoleto é descartado caso o usuário tenha editado a arte ou iniciado outro carregamento.
- Confirmação ao abrir outro projeto sobre uma composição em andamento e ao sair da tela com alterações não salvas.
- Decodificação paralela limitada a três mídias, reutilizando checagem de referências repetidas.
- 124 testes automatizados aprovados, 670 imports internos verificados e prova visual isolada no Chromium. Build Next.js completo pendente.
- Relatório: `docs/CLICKGRUDA-V5-6-RECUPERACAO-SEGURA.md`.

## V5.5 — Proteção do backup local e projetos portáteis (staging)

- Exportação `.cgdesign` agora incorpora imagens, máscaras e vídeos que utilizam referências `blob:`/HTTPS, com erro explícito para recursos não recuperáveis.
- Salvamento manual no navegador preserva mídias temporárias dentro do limite de armazenamento; rascunho automático não promete salvar URLs `blob:` vencidas.
- Importação de `.cgdesign` antigo com URLs temporárias avisa sobre a incompatibilidade.
- Validação reforçada de SVG base64 contra conteúdo ativo/referências externas.
- 116 testes locais aprovados e teste de backup com `FileReader` no Chromium; build Next.js completo pendente de dependências npm.
- Relatório: `docs/CLICKGRUDA-V5-5-BACKUP-PORTATIL-SEGURANCA.md`.

## V5.4 — Transições seguras de templates e build preventivo (staging)

- Corrige concorrência ao importar templates inteligentes pelo Admin, por upload ou pelo exemplo; ignora resultados obsoletos em vez de sobrescrever o trabalho.
- Fundos comuns não substituem edições feitas durante a carga e preservam máscaras autorais ao limpar máscaras automáticas.
- Workflow GitHub Actions com testes de regressão, checagem TypeScript e build sem execução de migrações.
- 110/110 testes locais e 665 imports conferidos; build Next.js não executado por dependências ausentes (`prisma: not found`).

## V5.0 — Diagnóstico local do MP4 antes da exportação (staging)

- Novo botão de compatibilidade H.264, que verifica codec, vídeo decodificável, leitura/CORS e resolução sem iniciar renderização de MP4.
- Mesmo cálculo de trecho de vídeo na checagem e no exportador; resultado cancela/é descartado ao trocar arquivo, intervalo, resolução ou FPS.
- Avisos de compatibilidade traduzidos em PT/EN/ES e status honesto de indisponibilidade temporária do provedor IA, com guia local.
- 86 testes locais aprovados, incluindo a regressão V4.9, e 659 imports internos sem problemas. Build Next.js completo e H.264 real ainda pendentes na Vercel.

## V4.9 — MP4 Full HD opcional e correções TS da Vercel (staging)

- Editor: MP4 H.264 em 720p ou até 1080p, 24/30 fps; os controles de exportação e a inspeção usam os mesmos parâmetros.
- Exportador: perfis de H.264 ajustados para nível/resolução, mantendo 720p como padrão leve.
- Build TS: corrigida importação ausente de `checkBeforeExport` e acesso seguro a `doc.video` opcional.
- Testes de regressão novos; relatório em `docs/CLICKGRUDA-V4-9-FULLHD-CORRECOES-TS.md`.
- Build Next.js completo e exportação MP4 em produção **não homologados** nesta rodada.

## V4.8 — Exportação para sublimação e importação local (staging)

- Exportação PNG/JPEG/WebP com opção de espelhamento horizontal **somente na saída**; prévia e projeto ficam inalterados. Desligada por padrão e com aviso sobre espelhamento duplo na impressora.
- PSD: manter camadas raster ocultas importadas no painel Camadas, com transparência, nome e visibilidade editável; orçamento cumulativo de pixels verificado antes de descompactar os canais.
- PDF: pré-inspeção do total de páginas antes de rasterizar; não apagar regiões horizontais sobre textos girados, preservando o raster nesses casos.
- Inclusão de testes automatizados de regressão e teste de pixels no Chromium para espelhamento/PSD oculto.
- Sem novas dependências, migrações ou mudanças de variáveis de ambiente. Build Next.js integrado pendente de homologação na `clickteste`.

## V4.7 — Robustez MP4 e Guia Inteligente (STAGING, 2026-11-03)

- H.264 em contêiner MP4 com formato AVC explícito; perfil Baseline adicional e checagem precoce de compatibilidade.
- Exportação não produz arquivo quando faltam quadros, há falha de muxer ou a saída é vazia; flush com cancelamento e timeout finito.
- Assistente bloqueia resultados atrasados e ações de outro módulo; fallback local imediato se a IA estiver indisponível; ajuda geral PT/EN/ES.
- Testes: 70 testes Node aprovados, 657 imports internos conferidos. Build Next.js e reprodução MP4 real ainda precisam de staging.
- Relatório: `docs/CLICKGRUDA-V4-7-VIDEO-ASSISTENTE.md`.

## V4.6 — Staging (2026-11-03)

- Alça 325 ml: transição de espessura progressiva e junção mais discreta na geometria do estilo de referência.
- Assistente: contexto controlado de até quatro perguntas anteriores, sem transferência de arquivos.
- MP4: validação de seek ainda pendente e encerramento seguro do codificador.
- 66 testes aprovados; build completo não homologado no ambiente local.

## V4.5 — Máscaras ancoradas, exportação MP4 e validação preventiva (staging)
- A máscara do template inteligente agora pode seguir as coordenadas do **cenário inteiro** (`maskSpace: "canvas"`), em vez de esticar ao tamanho da caneca. Máscaras manuais continuam com coordenadas do elemento. A exportação usa a mesma renderização.
- Reencaixar a caneca preserva sua máscara autoral quando não há máscara nova; uma máscara importada do template usa automaticamente o modo de cenário. A chave do cache considera posição e escala para evitar resíduos após mover o mockup.
- MP4: pré-validação de dimensões, início/fim, orçamento de resolução e taxa de quadros; mensagem de CORS ou falha de decodificação mais específica; identificação do limite de 20 s, 24 fps e ausência de áudio na interface.
- Arquivos `.cgtemplate`: validação por assinatura de imagem PNG/JPEG/WebP antes de importar, bloqueando arquivos disfarçados.
- Testes: regressões Node e comparação real de pixels no Chromium. Build Next.js e H.264 completo ainda dependem do deploy de staging.

## V4.4 — Máscaras com alfa, inversão e sombras proporcionais (STAGING)

- Editor: modos de máscara por luminância ou transparência do PNG; opção de inverter, disponíveis em PT/EN/ES.
- Templates inteligentes: manifesto suporta `maskMode` e `maskInvert` mantendo compatibilidade com pacotes anteriores.
- Reencaixe da caneca: sombra, deslocamentos e desfoque acompanham a escala; preserva máscaras manuais.
- Cache e validação de documentos consideram os novos campos. Regressões e teste de pixels em Chromium.
- Relatório: `docs/CLICKGRUDA-V4-4-MASCARAS-E-ENCAIXE.md`.
- Build integral Next.js ainda pendente de validação na Vercel. Não há migração de banco.

## V4.2 — Exportação segura, máscaras eficientes e acabamento fotográfico (staging)

- Editor: não exporta mais PNG/JPEG/WebP quando uma imagem ou máscara visível não puder ser carregada. A mensagem identifica a camada afetada, impedindo arquivos silenciosamente incompletos. O mesmo pré-teste é aplicado a sobreposições do vídeo.
- Editor: cache LRU limitado a 14 milhões de pixels para recolorações e máscaras, reduzindo recomputação de efeitos no MP4. Limpa o cache da sessão quando o usuário reseta o projeto; não altera projetos salvos manualmente.
- MP4: fallback entre perfis H.264 baseline/main/high compatíveis; bitrate adaptado à resolução. A exportação segue sem áudio e limitada a 20 segundos/720p/24 fps.
- Studio 3D: novo preset não destrutivo **Foto realista**, com cerâmica e reflexos mais moderados; o preset de Sublimação permanece o padrão e os acabamentos existentes são preservados.
- QA: 44 testes Node de regressão e novas provas no Chromium para máscara, recoloração, cache, exportação PNG e falha de arquivo. Checagem de tipos isolada nas novas rotinas sem dependências externas.
- Limitação: build Next.js completo indisponível no ambiente, por ausência de pacote npm no cache. **Deploy somente em staging.**

## V4.0 — Poses, templates inteligentes e pré-impressão (STAGING)

- Sombra radial do chão se alonga e acompanha a direção de canecas inclinadas/deitadas (múltiplas canecas incluídas). A geometria e a iluminação cerâmica não foram alteradas.
- Reencaixe manual da caneca no slot de template inteligente, preservando proporção, máscara, imagem e demais efeitos. Pode ser desfeito pelo histórico.
- Pré-impressão: verificação local da resolução efetiva de imagens raster e recortes, avisando abaixo de 140 DPI / entre 140 e 220 DPI. Vetores SVG não são marcados como raster.
- Pré-impressão: alerta de texto que ultrapassa a área segura após giro.
- Avisos aparecem na janela de exportação; verificação nunca envia a imagem ao servidor.
- 5 novos testes automatizados, integrados a `npm run verify:creative`.
- Necessário homologar build Next.js e renderização visual no navegador em staging.

## V3.9 — Camadas, pré-impressão e estabilidade
- Aba Camadas, visibilidade, bloqueio e movimentação de cenário sem obstruir a caneca.
- Pré-impressão e histórico com menos cópias de dados base64.
- Testes de renderização no Chromium e verificação pré-build.
- Relatório: `docs/CLICKGRUDA-V3-9-ESTABILIDADE-CAMADAS.md`.

## Mockup Studio — ajustes finais (27/10/2026)

- Estampa somente na parede externa e no chanfro inferior; lábio e interior limpos.
- Duo centralizado, enquadramento do conjunto e comando visível para mover o cenário.
- Giro sincronizado de todas as canecas, incluindo vídeo/GIF, com pausa preservando a pose.
- Acabamentos Acetinado, Sublimação, Alto brilho e Vitrificado; controles de verniz e aplicação em todas as peças.
- 25 regressões passaram; TypeScript, build e lint sem erros. Relatório: `docs/mockup-studio/VALIDACAO_FINAL.md`.

## 27/10/2026 — Mockup Studio V2

Caneca Clássica cilíndrica de 8,2 × 9,55 cm com borda arredondada, fundo rebaixado e alça com junções alargadas. Material cerâmico compartilhado, gestão sRGB, estúdio neutro, sombras suaves, vistas e giro acessíveis no palco. Painel simplificado, exportação por destino e PNG com metadados reais de 300 DPI.

Corrigidos a restauração do preview após exportação, a tipagem do giro de vídeo, um erro de componente estático no editor de PDF e inconsistências anteriores do lockfile que bloqueavam `npm ci`. Consulte `STUDIO_MOCKUP_V2.md` e `docs/mockup-studio/VALIDACAO_V2.md`.

---

## 25/10/2026 — Mockup Studio: refatoração progressiva (sem alteração de deploy)

- Guia indexável `/mockup-caneca-3d` e Studio próprio `/mockup-caneca-3d/studio`, com `PremiumGate` reaproveitado.
- Estúdio com aparência clara por padrão, navegação Arte/Caneca/Cena/Luz/Câmera/Compor/Efeitos/Camadas, busca Ctrl+K e confirmações de reset.
- Reset completo de estado (inclui exportação, marca d’água e GIF) e histórico de desfazer; opção de conservar arquivo de arte.
- Remoção de três recipientes sem alça da lista; migração automática `long`, `thermal`, `squeeze` para caneca clássica ao carregar projetos.
- Base 3D lisa, alça mais robusta e perfis independentes de raio para caneca cônica, chopp, latte, xícara; preservada edição de arte e materiais.
- Controles de giro automático por sentido e segundos por volta, sombreado de contato regulável e mapas de sombra de maior resolução.
- Vídeo ampliado para até 20 segundos com presets, 24/30/60 fps, resoluções 1080p/2K/4K/4:5, níveis de qualidade, bitrate superior e cancelamento (caminho WebCodecs/ALFA); correção da emenda do giro.
- Novos acessos Biblioteca / Instagram / Facebook e atualização dos pontos de entrada da home, header, footer e sitemap.
- Presets de cor e cena, configuração pessoal local; documentação e testes estáticos atualizados.

**Validação:** código TypeScript/TSX analisado sintaticamente; testes isolados do estado passaram. **Não foi possível executar build Next.js ou testes visuais de WebGL/WebCodecs**, pois o ZIP não inclui dependências e o acesso ao registro npm falhou por erro de DNS. Compatibilidade 4K e exportação alfa em diferentes navegadores continuam sujeitas a QA em equipamento real.

**Não entregue nesta versão:** codec HEVC, sequências PNG em ZIP, pacote de anúncio em um clique, divisão integral de `ui/panels.tsx` em arquivos menores, aferição Lighthouse, ensaio visual comparativo 200% 4K vs Full HD. Esses itens precisam de continuidade e validação antes de proclamar atendimento integral de todos os critérios do agente.

---

# CHANGELOG — Click&Gruda Mockup Studio

## 25/10/2026 — Vídeo com canal alfa

- Opção **ALFA — fundo transparente** em Exportar → Vídeo, com saída WebM VP9.
- Cor e máscara de transparência codificadas separadamente e combinadas no WebM, incluindo transparência parcial das bordas e sombras.
- Resoluções e movimentos existentes disponíveis; Revelação continua exigindo caneca mágica.
- Marca d'água aplicada no vídeo ALFA; restauração da cena em sucesso ou falha.
- Pós-processamento de tela inteira ignorado em exportações transparentes para preservar o alfa; o loop de pós-processamento não interfere no render de exportação.
- Mensagem de incompatibilidade sem fallback opaco; informação do formato real no aviso de conclusão.
- Teste de regressão com navegador e FFmpeg em `docs/mockup-studio/alpha-video-regressions.mjs`.

## 23/10/2026 — Editor e renderização

### Experiência de edição
- Nova identidade Click&Gruda em laranja e carvão, temas claro/escuro, bibliotecas à esquerda, propriedades da seleção à direita e canvas central.
- Barra superior com nome do projeto, histórico, zoom, salvar e exportar; painéis recolhíveis e gavetas móveis.
- Até oito objetos independentes, com arte por peça, seleção múltipla, posição e rotação XYZ, escala, trava, visibilidade, exclusão e duplicação com separação inicial.
- Gizmos de transformação, snap, alinhamento/distribuição, painel de camadas, sete composições e atalhos descritos no guia.
- Entrada animada própria de 1,25 segundo, respeitando movimento reduzido; enquadramento adaptado ao redimensionar o canvas.

### Produto, arte e luz
- Nove formas procedurais: clássica, quadrada, cônica, chopp, latte, chá, long drink, térmica e squeeze. Variantes branca, colorida e mágica preservadas.
- Borda espessa arredondada e interior aberto; alça com geometria própria; suporte calculado para rotações livres.
- Cerâmica física com clearcoat, rugosidade, reflexo, microtextura e oclusão. Corpo, base, interior e alça com cores separadas.
- Saída sRGB e tone mapping neutro; modo de cor preservada separa a contribuição difusa dos reflexos. A iluminação ainda altera a aparência física da superfície.
- Impressão completa passa a ser padrão. Modos e medidas de prensa existentes permanecem disponíveis; área personalizada e sangria adicionadas.
- Brilho, contraste, saturação, vibração, temperatura, nitidez, opacidade, comparação e reset por arte.
- Decalque adicional, imagem inferior e máscara metálica opcionais.
- Upload Radiance HDRI com carregamento sob demanda e ambiente procedural de fallback. Intensidade individual de luz principal, preenchimento, recorte e ambiente.

### Fundos e saída
- 30 fotografias originais geradas individualmente, integradas por categoria; oito fundos procedurais anteriores preservados.
- Correções de enquadramento, orientação e gerenciamento de cor do fundo; novos contraste e vinheta, além de controles anteriores.
- Lote da mesma composição em fundos escolhidos, em ZIP PNG 1080×1080.
- PNG, JPG e WebP preservados, preset 4K, transparência PNG/WebP; exportação de todas as peças com textura de maior resolução.
- MP4, GIF, lote por ângulo/variante e folha 300/600 DPI mantidos.
- Arquivo portátil `.cgstudio`, imagens de todas as peças, decalques, base, fundo e HDRI incorporados; ordem de camadas persistida. Projetos antigos continuam aceitos.
- Compartilhamento de arquivo pelo sistema quando disponível; download com orientação para anexar ao WhatsApp como alternativa.
- Política de marca d’água Free/Pro/Premium no cliente, recebendo plano do host. Autenticação e cobrança existentes preservadas.

### Entrega e limites
- Inventário original e comparação: `DIAGNOSTICO_MOCKUP_STUDIO.md`.
- Análise do vídeo: `docs/mockup-studio/ESPECIFICACAO_FUNCIONAL_RAPIDMOCKUP.md`.
- Prompts: `FUNDOS_PROMPTS.md`; resultados e comandos: `VALIDACAO_MOCKUP_STUDIO.md`.
- Limites e evolução: `PROXIMA_VERSAO.md`. Não se declara equivalência integral aos concorrentes.
- Nenhum deploy, migração, alteração de ambiente, dependências, lockfile, configuração de build ou API administrativa/banco.

## V5.1 — Validação de integridade do MP4 (staging)
- Novo `mp4-integrity.ts`: valida contêiner H.264, resolução e amostras antes de entregar download MP4.
- Exportador verifica a estrutura do MP4 depois de finalizar o multiplexador e interrompe downloads incorretos.
- Pré-verificação de vídeo testa também imagens/máscaras das camadas visíveis antes de decodificar.
- Dois MP4s sintéticos de referência em `tests/fixtures`, testes adicionais e relatório `docs/CLICKGRUDA-V5-1-INTEGRIDADE-MP4.md`.
- 92 testes locais aprovados; build Next.js e WebCodecs completos ainda pendentes de homologação na Vercel.

## V5.2 — Geometria da alça e eficiência das sombras de contato (staging)
- Referência 325 ml: pontos de contorno independentes e transição suave das junções à parede cerâmica, sem alterar IDs de modelos antigos.
- Dois passes de sombra de contato são reutilizados em cena estática e atualizados ao mudar pose/iluminação; modo dinâmico preservado no giro e nas ferramentas de transformação.
- Ajuste da resolução enquanto o usuário arrasta objetos para reduzir a carga em GPU mobile.
- Testes de geometria, invalidação de sombra, privacidade da chave de cache e regressões. Consultar `docs/CLICKGRUDA-V5-2-ALCA-SOMBRAS.md`.

## V5.3 — Transferência transparente e segurança da exportação (staging)
- Recorte automático do espaço alfa vazio do PNG ao usar Studio 3D → Editor. Conserva pixels de cerâmica/estampa e uma margem de segurança, sem alterar a composição 3D.
- Transferência ao Editor funciona mesmo quando o tamanho escolhido excede o limite do download comum (a imagem transferida continua limitada a 2400 px).
- Verificação do MIME real no download PNG/JPEG/WebP para evitar arquivo com extensão incorreta.
- Fallback de decodificação local do PNG, testes de regressão e teste isolado no Chromium. Relatório: `docs/CLICKGRUDA-V5-3-TRANSFERENCIA-E-EXPORTACAO.md`.
