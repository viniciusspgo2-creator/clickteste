# Click & Gruda V5.14 — Integridade de imagem e DPI

Status: **staging / pendente de homologação na clickteste**. Base: V5.13.

## Diagnóstico reproduzido

- `canvas.toBlob()` pode retornar PNG quando o formato JPEG/WebP solicitado não está disponível. O fluxo anterior confiava no formato solicitado e oferecia um arquivo com extensão incompatível com seus bytes.
- O gravador de metadados PNG para impressão 300 DPI substituía um chunk `pHYs` existente somente quando ele estava imediatamente após `IHDR`. Um `pHYs` depois de outro chunk auxiliar podia resultar em duplicação ou DPI ambíguo.

## Correções

1. Novo módulo `src/lib/creative/image-export-integrity.ts`. Examina a **assinatura real dos bytes** de PNG, JPEG ou WebP antes de permitir que o Editor ofereça o download com a extensão solicitada. Se o navegador retornar um formato diferente, interrompe a exportação e indica a causa. Não converte o arquivo silenciosamente, não envia mídia para o servidor.
2. Em PNG para estampa 21×9,5 cm (2480×1122) ou área visível 19×8,5 cm (2244×1004), com escala 100%, insere exatamente um chunk `pHYs` indicando 300 DPI (11.811 pixels/metro). Um `pHYs` antigo é removido independentemente de sua posição; outros chunks e dados IDAT são mantidos; o CRC é recalculado.
3. PNG corrompido, truncado ou sem `IEND` é rejeitado no estágio de metadados, em vez de ser distribuído sem identificação correta.
4. Atualização dos testes existentes que importam o módulo `design.ts` de forma isolada e 10 testes novos, incluindo integração `exportDesign` com fallback PNG simulado.

## Verificações locais

- `npm run verify:creative`: **193/193 testes aprovados**.
- `node scripts/verify-source.mjs`: **273 arquivos de código; 676 imports relativos verificados; 0 caminhos ausentes**.
- `tsc --noEmit --strict --target ES2022 --module esnext --moduleResolution bundler --lib ES2022,DOM --skipLibCheck src/lib/creative/image-export-integrity.ts`: **aprovado**.
- Chromium real: PNG, JPEG e WebP de `canvas.toBlob` foram identificados corretamente; PNG com 300 DPI reabriu com `createImageBitmap` e preservou o pixel vermelho; PNG disfarçado de WebP foi rejeitado.
- ZIP: validar presença do módulo, novo teste, pacote e relatório, bem como a integridade de todas as entradas.

## Limites de homologação

- Estas verificações confirmam tipo de arquivo e integridade **estrutural dos metadados**; não garantem a fidelidade colorimétrica de toda impressora ou RIP.
- `npm run build` parou antes da etapa Next.js porque o executável `prisma` não existe neste ambiente sem dependências npm. O build completo / tsc integrado ainda depende de CI e deploy na `clickteste`.
- MP4 completo via WebCodecs, agente com provedor real, fidelidade fotográfica da caneca, PSD/PDF complexos e uso mobile ainda precisam de testes integrados.
- Não executar migrações nem alterar Neon, buckets R2, projeto de produção ou variáveis.

## Roteiro rápido para clickteste

1. Instalar V5.14 somente no repositório de teste; confirmar CI e build TypeScript do Next.
2. No Editor, exportar PNG 2480×1122 e confirmar resolução física 300 DPI no software de impressão.
3. Exportar WebP e JPEG, abrir cada arquivo em outro visualizador e confirmar a extensão correta.
4. Testar com arte contendo texto, máscara e imagem; confirmar que nada ficou ausente e que os projetos antigos continuam abrindo.
5. Repetir a exportação no navegador/telefone relevante e registrar qualquer mensagem de formato indisponível.

