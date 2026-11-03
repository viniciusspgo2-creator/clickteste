# Click & Gruda V5.2 — Alça de referência e sombras de contato

Status: **STAGING / não homologado em navegador publicado**. Trabalho realizado sobre a V5.1, exclusivamente numa cópia do código.

## Implementação

1. **Alça 325 ml:** perfil de pontos de controle consolidado em `src/components/tools/mockup/lib/reference-handle-profile.ts`, com duas junções embutidas na parede cerâmica de raio 4,1 cm. Ajustei a posição relativa dos apoios (superior e inferior), o arco externo em D e o perfil da seção para uma transição de quinta ordem, sem salto brusco de espessura próximo à parede. Reduzi a expansão geométrica dos apoios e suavizei as faces da seção. Essa calibração é uma aproximação a partir da fotografia frontal; não é reprodução exata de peça física sem vistas lateral e traseira e medidas.
2. **Sombras de contato:** o Studio mantinha *dois passes de profundidade contínuos* (`frames={Infinity}`) mesmo com todos os objetos parados. A função pura `contactShadowRenderBudget` agora permite capturas reutilizáveis (`frames=2`) em cena estática, com remount dos passes quando mudam pose, tamanho, modelo/alça, cenários e iluminação. Ferramentas Mover/Girar/Escalar e rotação automática mantêm os passes contínuos.
3. **Dispositivos mais modestos:** apenas durante manipulação contínua, a resolução das sombras de contato se adapta ao dispositivo (768 desktop / 320 mobile). Fora da manipulação, permanecem 1024 desktop / 384 mobile, como na V5.1.
4. **Privacidade e compatibilidade:** a chave do cache de sombra usa somente números/identificadores de pose e luz; não inclui artes, imagens, arquivos de upload nem dados pessoais. IDs de alça, projetos salvos, parâmetros de exportação, banco e APIs permanecem compatíveis.

## Arquivos principais

- `src/components/tools/mockup/scene/studio.tsx`
- `src/components/tools/mockup/scene/mug-geometry.ts`
- `src/components/tools/mockup/lib/reference-handle-section.ts`
- `src/components/tools/mockup/lib/reference-handle-profile.ts` (novo)
- `src/components/tools/mockup/lib/contact-shadow-policy.ts` (novo)
- `tests/v52-mug-realism-shadow-budget.mjs` (novo)
- `tests/v41-video-glaze-template.mjs` (atualização de asserção da estrutura refatorada)
- `package.json`, `CHANGELOG.md`

## Validação realizada

- `npm run verify:creative` — **98/98** testes de regressão aprovados, incluindo os seis novos.
- `node scripts/verify-source.mjs` — auditoria de imports internos aprovada.
- `tsc --noEmit --strict ... <arquivos puros V5.2>` — compilação de tipos dos módulos puros aprovada.
- Análise sintática TypeScript/TSX dos arquivos alterados, sem diagnósticos de sintaxe.

**Não executados neste ambiente:** build Next.js/Prisma completo (dependências npm ausentes), renderização WebGL integrada, exportação 4K real, testes em dispositivo móvel, comparação fotogramétrica em três ângulos. Essas validações são necessárias antes da produção.

## Checklist na `clickteste`

1. Conferir a alça **Referência 325 ml** em Frente, Lateral/Alça, Costas e Perspectiva 3D. Verificar as duas junções e a abertura sem faixas ou buracos.
2. Mover e inclinar a caneca: a sombra deve acompanhar sem duplicação, salto, ou ficar presa à posição anterior.
3. Deixar a caneca parada no modo Selecionar: verificar visualmente sombra, desempenho e reflexos. Alternar a iluminação e os acabamentos para forçar nova captura.
4. Ativar giro 360°: sombra deve atualizar durante a animação.
5. Testar no celular, incluindo mudança de câmera, seleção, troca de cenário e captura PNG.
6. Confirmar que projetos antigos com alças Clássica e Arredondada mantêm o aspecto anterior e que os templates continuam operando.

## Deploy e segurança

Substitua somente o projeto de staging `clickteste`, mantendo a versão publicada intacta. Sem migração do banco, sem novos segredos ou variáveis. Execute o build na Vercel e analise erros de TypeScript antes de promover qualquer versão.
