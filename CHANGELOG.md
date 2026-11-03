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
