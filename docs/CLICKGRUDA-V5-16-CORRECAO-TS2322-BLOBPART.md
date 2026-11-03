# Click & Gruda V5.16 — correção de build TS2322 (BlobPart)

**Base:** V5.15 (inclui as evoluções V3 → V5.15). **Destino:** somente `clickteste` (staging). **Nenhuma operação feita em produção, Neon ou R2.**

## Causa confirmada

O erro reportado no deploy V5.14 foi:

```text
src/lib/creative/image-export-integrity.ts(74,19): error TS2322:
Type 'Uint8Array<ArrayBufferLike>' is not assignable to type 'BlobPart'.
```

No V5.15, o mesmo trecho persistia, agora na linha 104. O `new Blob([modified])` recebia um `Uint8Array` cujo tipo genérico é `ArrayBufferLike`, potencialmente incluindo `SharedArrayBuffer`. O construtor `Blob` exige um `ArrayBuffer`/view com buffer aceito pelas declarações DOM das versões recentes do TypeScript. O compilador parava antes de gerar o build.

## Correção aplicada

Em `src/lib/creative/image-export-integrity.ts`, `addPngDpiMetadata` copia os bytes calculados para um `new ArrayBuffer(modified.byteLength)` e passa **esse ArrayBuffer** a `new Blob([owned], { type: 'image/png' })`.

- Sem `as unknown as BlobPart` ou outras coerções arriscadas.
- Preserva bytes e metadados PNG/pHYs de 300 DPI, sem recompressão de pixels.
- Mantém APIs, caminhos, Prisma, componentes, geometria 3D e dados de clientes inalterados.

`tests/v516-blob-arraybuffer-types.mjs` inclui três verificações para impedir regressão no construtor e garantir igualdade byte a byte da saída.

## Verificações realmente executadas

- `NODE_PATH=$(npm root -g) npm run verify:creative`: **207/207 testes aprovados**.
- `node scripts/verify-source.mjs`: **273 fontes, 676 imports relativos resolvidos, zero ausentes**.
- `tsc --noEmit --strict --skipLibCheck --target es2022 --lib es2022,dom,dom.iterable --module esnext src/lib/creative/image-export-integrity.ts`: **aprovado** com o compilador disponível neste ambiente (TS 5.8.3).
- O ZIP FULL foi reempacotado com a pasta raiz `clicktools-main/` e verificado por CRC.

## Limites de homologação

- **Não foi possível obter um build completo do Next.js neste ambiente:** a instalação das dependências via npm não terminou (registro remoto indisponível); por isso não afirmamos que `next build` ou o pipeline da Vercel já passaram.
- A autorização do projeto `clickteste` no conector Vercel está incompleta para consultar/publicar deployments da equipe (403). Nenhum deploy foi executado.
- Continuam dependentes de testes em ambiente publicado/navegador: MP4 real com WebCodecs, integração com provedor IA, caneca 3D contra referência física, PSD/PDF complexos e aparelhos móveis. Os testes de regressão não substituem esses testes end-to-end.

## Instalação e próximo passo no projeto de testes

1. Extrair **esta V5.16 FULL**, substituindo a V5.14/V5.15 no código da `clickteste` (não misturar arquivos de duas versões). O conteúdo do ZIP já está sob `clicktools-main/`.
2. Confirmar que `src/lib/creative/image-export-integrity.ts` contém `new ArrayBuffer(modified.byteLength)` e `new Blob([owned]`.
3. Executar na CI ou Vercel da `clickteste`: `npm ci`, `npm run verify:creative`, `npx prisma generate`, `npx tsc --noEmit`, `npm run build`.
4. Testar exportações PNG, JPEG, WebP (incluindo 300 DPI), vídeo MP4 e recuperação de projetos em browser real.
5. Somente após build e homologação, considerar promoção em produção. **Não exige migração de banco nem variáveis de ambiente novas.**
