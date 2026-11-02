# Validação do Mockup Studio V2

Data: 27/10/2026. O fluxo verificado foi abrir o Studio, escolher arte e cores, mudar a vista, girar/pausar a peça e exportar a cena. O editor processa esse fluxo no navegador.

## Verificações de código e instalação

| Verificação | Resultado |
| --- | --- |
| Instalação limpa | `npm ci --ignore-scripts --no-audit --no-fund` passou com 930 pacotes |
| Prisma | Cliente gerado localmente; nenhuma migração ou alteração no banco |
| TypeScript do projeto inteiro | `tsc --noEmit --pretty false` passou sem erros |
| ESLint geral | Passou sem erros; oito avisos preexistentes de navegação em `src/app/page.tsx`, `components/site/header.tsx` e `components/site/home.tsx` |
| Módulo e editor de PDF | ESLint passou sem erros e sem avisos |
| Regressões | 19 testes passaram, incluindo as seis formas, dimensões exatas da Clássica, borda, rebaixo, soldas, materiais comuns, metadados PNG, histórico, travas e projetos |
| Auditoria estática existente | Passou; a exigência antiga de fundo plano foi substituída pelos testes de geometria da V2 |
| Build de produção local | `next build --webpack` verificado com a versão fixada do Next.js 16.4.1 |

O `package-lock.json` recebido falhava no `npm ci`: faltavam entradas de peers como `yjs`/`ajv` e havia uma resolução inconsistente de `picomatch`. O lock foi reparado sem alterar as dependências declaradas no `package.json` nem a versão fixada do Next. A mudança de versão efetiva foi a resolução transitiva de `picomatch` de 2.3.2 para 4.0.7 no nível correto, mantendo 2.3.2 onde requerido. A instalação limpa foi repetida com o lock reparado.

O build usa fontes locais de teste pelo mecanismo oficial de fixtures do Next para evitar depender do download externo de fontes neste ambiente. A configuração de fontes entregue permanece a original. O typecheck foi executado separadamente, pois a configuração de build recebida ignora erros de tipos. O comando `npm run build`, que também executa `prisma db push`, não foi usado para não escrever em banco.

## Navegador e renderização

Chromium 153 com WebGL via SwiftShader, viewport de desktop 1400 × 900 e celulares simulados de 390 × 844 e 320 × 740. O movimento reduzido foi usado para a conferência visual; as transições de câmera respeitam essa preferência.

| Verificação | Evidência |
| --- | --- |
| Inicialização | Cena WebGL e material físico carregaram; nenhum erro de aplicação observado |
| Cores | Corpo azul e alça azul geraram a mesma cor de entrada `#225bc4`; parâmetros PBR conferidos iguais. A alça branca permaneceu branca ao ser escolhida separadamente |
| Interface | Atalhos de arte, modo 360°, ajuste manual recolhido, menu móvel, gaveta de propriedades e botão de exportar exercitados |
| Vistas | Frente, Lateral / Alça, Costas, Perspectiva 3D e Topo / Interior conferidas em relação à orientação da peça |
| Giro e pausa | O ângulo visível antes e depois da pausa foi idêntico; a pose foi persistida no estado |
| PNG branco | Imagem decodificada de 384 × 384 px, supersampling 4×; canto RGBA `[255,255,255,255]` |
| PNG transparente | Imagem decodificada de 384 × 384 px; canto RGBA `[0,0,0,0]`; centro da caneca opaco |
| PNG com cenário | Renderização decodificada com o cenário corrente |
| 300 DPI | Chunk `pHYs` com 11811 pixels/metro nos dois eixos e unidade física igual a 1; preset Print configurou 3000 × 3000 px |
| Restauração | Fundo, textura de preview, controles, pixel ratio e estado de exportação restaurados |
| Falha simulada | Exceção induzida na captura; cena e controles restaurados no `finally` |
| Efeitos | Exportação com pós-processamento gerou PNG; RenderPass voltou a usar a câmera do preview |
| GIF | GIF de teste de 96 × 96 px, quatro quadros; arquivo de 2833 bytes; sessão restaurada |
| Lote | ZIP de teste com uma imagem PNG 128 × 128; 2680 bytes; sessão restaurada |
| Mobile | Sem overflow horizontal em 390 e 320 px; menu, propriedades e exportação acessíveis |
| Vídeo com alfa | Suíte existente codificou e decodificou 60 quadros em 2,5 s; alfa de fundo 0, região opaca 255 e região semitransparente 128 confirmados no navegador e FFmpeg |

Dados resumidos da conferência estão em `validacao/qa-v2.json`. Capturas de tela internas de teste não fazem parte do pacote.

## Alcance e limites

A conferência de interface usa um harness local com o mesmo componente, sem autenticação e banco de produção. O portão Premium e suas APIs permanecem no projeto original; seu funcionamento em produção não foi exercitado. Não houve deploy.

A saída de 3000 × 3000 foi conferida como configuração do preset. Os testes reais de PNG/300 DPI no navegador usaram 384 × 384; não foi realizado um ensaio de carga de todas as dimensões, codecs, aparelhos, HDRIs, efeitos ou combinações de modelos. A suíte de alfa usa um padrão de teste sintético. Não foi certificado desempenho de vídeo 4K/20 s ou 60 fps em hardware real, nem a correspondência de cores com uma impressora física.

## Repetir as verificações

```sh
npm ci
npx prisma generate
npx tsc --noEmit --pretty false
npm run lint
node --test docs/mockup-studio/regressions.mjs
node docs/mockup-studio/scope-qa.mjs
```

A suíte `alpha-video-regressions.mjs` requer Playwright/Chromium e FFmpeg. O build normal do projeto continua seguindo seu script existente; a verificação desta entrega não modifica variáveis, hospedagem ou dados.
