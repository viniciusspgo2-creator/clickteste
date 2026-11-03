> Histórico da versão anterior. Para o estado desta entrega, consulte `STUDIO_MOCKUP_V2.md` e `docs/mockup-studio/VALIDACAO_V2.md`.

# Validação — Mockup Studio

Data: 23/10/2026. Navegador: Chromium headless, WebGL com SwiftShader (GPU por software). Interface testada em 1500×950 e 390×844, com movimento reduzido na suíte funcional. Os testes não substituem benchmark em hardware real.

## Resultado

| Verificação | Evidência e alcance |
|---|---|
| Typecheck do módulo | Passou com `tsc -p docs/mockup-studio/tsconfig.studio.json --pretty false`; inclui todos os arquivos TypeScript/TSX do módulo e dependências importadas. |
| ESLint do módulo | Passou com `eslint src/components/tools/mockup`. |
| Regressões | Dez testes passaram: área completa e prensa legada; ajustes neutros preservam bytes; alfa/nitidez; clone separado e arte independente; trava; histórico; sete composições; nove geometrias com UV/normais finitas e suporte para rotações; ordem de camadas na restauração; atualização das matrizes pai antes do enquadramento. |
| Interface e seleção | Upload de exemplo, duplicação, trava, arte independente, modelos, poses XYZ, histórico e atalhos Ctrl+D/Delete/Ctrl+Z exercitados. |
| Composições | 1, 2, 3, 4, 3, 2 e 2 peças para solo, par, trio, fileira, leque, empilhadas e kit presente. |
| Imagem | PNG/JPG/WebP de 640×640 gerados e decodificados. Alfa do canto confirmado em PNG/WebP. JPG confirmado opaco. PNG transparente 3840×2160 gerado e decodificado (969.272 bytes na cena de teste). |
| Vídeo | MP4 H.264 de teste 128×128, 4 fps, um segundo, 8.733 bytes. Exercita caminho de codificação e restauração; não é ensaio de carga de vídeo 1080p longo. |
| GIF | 96×96, quatro quadros, um segundo; GIF válido de 27.623 bytes. |
| Lote | ZIP de um ângulo/variante, 8.868 bytes, contagem correta. Biblioteca de fundos usa o mesmo motor de imagem; lote de 30 fotos não foi ensaiado como carga contínua. |
| Folha de impressão | PNG 300 DPI com guias, 3101×1241, 1.825.459 bytes. Dimensões de produto são aproximações e exigem conferência física. |
| Persistência | IndexedDB salvou/reabriu par com arte independente e fundo. `.cgstudio` foi baixado e reimportado com imagem principal, decalque, base e ordem de camadas; duas peças restauradas. |
| HDRI e camadas | Arquivo Radiance sintético válido registrado e aplicado; decalque, base e mapa metálico presentes. Falhas de arquivo têm fallback na interface. |
| Fundos | 30 JPEGs individuais, todos 1536×1024, verificados. Aplicação em canvas conferida visualmente; orientação e crop corrigidos. |
| Responsividade | Temas e gavetas móveis abriram/fecharam sem overflow horizontal do documento. Enquadramento reage à mudança do tamanho do canvas. |
| Planos | Desenho da marca d’água verificado em canvas: Free força a marca mesmo desativada; Pro/Premium respeitam desativação. |
| Console | Nenhum erro de aplicação nas suítes. Avisos de depreciação upstream de Three.Clock/RGBELoader e importação CJS existem; não foram suprimidos. |
| Inspeção visual final | Borda/interior, verniz, suavidade da sombra, layout desktop, fundo fotográfico e gavetas inspecionados em capturas de tela. |
| Escopo | Todos os arquivos originais permanecem no pacote. Comparação byte a byte não encontrou alteração fora do módulo e documentação. package.json, package-lock.json, bun.lock e configurações de Next/TypeScript/ESLint permanecem idênticos. |

## Executar novamente

Com as dependências do projeto já instaladas, na raiz:

```sh
node --test docs/mockup-studio/regressions.mjs
./node_modules/.bin/tsc -p docs/mockup-studio/tsconfig.studio.json --pretty false
./node_modules/.bin/eslint src/components/tools/mockup
```

O arquivo de configuração acima é exclusivo da validação do módulo, sem mudar a configuração de build. A suíte visual usou um harness isolado de desenvolvimento, separado do projeto final, para abrir o componente sem banco, autenticação ou deploy.

## Limites da verificação

O typecheck geral encontrou dois erros fora do escopo:

- `src/app/api/admin/visits/route.ts(54,23)`: TS2322, `{}` não atribuível a `number`.
- `src/lib/db.ts(1,10)`: TS2305, PrismaClient indisponível no cliente Prisma instalado sem executar geração de banco.

Esses arquivos não foram alterados. Não foi executado build, deploy, geração Prisma, migração, alteração de ambiente ou Vercel/Neon. O lockfile recebido não está totalmente sincronizado para `npm ci`; as dependências para a verificação foram instaladas sem executar scripts e sem gravar lockfiles. Esse estado de instalação é anterior ao trabalho do módulo e não foi corrigido por estar fora do escopo autorizado.

Não foi certificado 60 fps, latência de carregamento em celular real, funcionamento de todos os codecs em Safari/Firefox, seletor de compartilhamento do sistema nem todas as combinações de controles. Consulte `PROXIMA_VERSAO.md` para os recursos parciais e pendências.
