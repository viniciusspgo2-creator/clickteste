# Validação dos ajustes finais — 27/10/2026

História verificada: adicionar arte → escolher Duo → enquadrar e mover o cenário → girar e pausar ambas as canecas → aplicar acabamento → exportar.

## Verificações automatizadas

| Verificação | Resultado |
| --- | --- |
| TypeScript do projeto inteiro | Sem erros; executado após terminar o build |
| ESLint do projeto inteiro | Zero erros; oito avisos de navegação anteriores, fora do Studio |
| Regressões do Studio | 25 testes passaram |
| QA estática existente | Passou |
| Build de produção, Next 16.4.1 | Passou; 34 páginas estáticas geradas |

Os testes novos cobrem o limite da estampa no lábio, a cobertura do chanfro inferior, a ausência de triângulos que interpolam entre regiões de impressão e cerâmica, o Duo do painel antigo, a distribuição centralizada, o enquadramento em diferentes proporções, os acabamentos compartilhados e a estabilidade do centro durante diferentes rotações.

O build foi executado diretamente com `next build --webpack`, sem a etapa `prisma db push` presente em `npm run build`. As fontes externas usaram o mesmo fixture local da validação V2; a configuração de fontes entregue não foi alterada. O projeto mantém a configuração anterior que ignora o typecheck dentro do build; por isso o `tsc --noEmit` foi executado separadamente, depois do build.

## Navegador e renderização

Validação em Chromium 153 com WebGL por software, usando os componentes reais num harness local isolado, sem rota de QA no pacote entregue.

- Desktop 1400 × 900: parede estampada até o pé, lábio limpo e Duo centralizado, sem recorte lateral.
- Duo: posições X −7,5 e +7,5; centros projetados simétricos na tela.
- Giro: as duas peças avançaram 2,742374767 rad entre as amostras; a diferença original de 80° foi mantida. As poses foram persistidas ao pausar.
- Arraste real com mouse: o alvo da câmera passou de X 0 para aproximadamente −5,23. Após Centralizar, voltou a `[0, 4.775000095367432, 0]`.
- Modo de cenário livre: botão esquerdo configurado para pan e gesto com um dedo configurado para pan.
- Acabamento Vitrificado aplicado às duas canecas: corpo e alça com roughness 0,025; clearcoat 1; clearcoat roughness 0,015; specular intensity 1; reflexo do ambiente 2; intensidade do brilho 3.
- Viewports de 390 × 844 e 320 × 740: sem rolagem horizontal; os atalhos novos ficam dentro da tela.
- GIF real de 96 × 96, quatro quadros: 7.578 bytes; ambas as canecas mudaram 90° por quadro e retornaram exatamente às poses anteriores; controles e estado de exportação restaurados.
- PNG real de 256 × 256: 18.186 bytes, canto branco RGBA `[255,255,255,255]`, preview e controles restaurados.
- Nenhum erro de aplicação no console. Permanece o aviso de depreciação de `THREE.Clock` da dependência.

Os valores estão em `validacao/qa-final.json`. As capturas de tela foram usadas apenas para inspeção interna.

## Limites desta rodada

O teste móvel verifica o layout em viewports reduzidos, sem certificar desempenho de aparelhos físicos ou executar um gesto de toque real. O gesto de um dedo foi conferido pela configuração do OrbitControls. O GIF e o PNG foram exportados; o MP4 não foi recodificado nesta rodada. O giro de todas as peças usa a mesma função de turntable nos exportadores de vídeo e GIF. A validação de codecs alfa da V2 permanece documentada separadamente.

Não houve teste de carga em 4K, comparação com impressora física nem alteração de banco ou publicação.
