# Click & Gruda V5.11 — Fontes confiáveis e intervalos MP4 (STAGING)

**Base:** V5.10. **Ambiente de destino:** somente `clickteste`. **Produção não alterada.**

## Problemas reais identificados

1. A fonte premium do Google Fonts aguardava indefinidamente `link.onload` e/ou `document.fonts.load()`. Se a conexão do navegador ou o serviço de fontes não respondessem, a renderização ou a exportação podia ficar presa.
2. A renderização com `strict:true` do Editor ignorava erro da fonte da mesma forma que a prévia, podendo salvar uma estampa com fonte substituta sem avisar.
3. Ao pedir trecho de vídeo começando DEPOIS da duração real do arquivo, o MP4 selecionava silenciosamente o último décimo de segundo, produzindo clipe válido mas não solicitado.

## Correções aplicadas

- `src/lib/creative/typefaces.ts`: espera limitada a 12 s por fonte curada. Falha explícita em timeout do CSS, erro do CSS, `FontFaceSet.load()` ou quando nenhuma face da família foi disponibilizada; remove o `<link>` com falha e permite nova tentativa na mesma sessão. Pedidos simultâneos para a mesma fonte continuam compartilhados.
- `waitForFontLayout()`: proteção contra pendência indefinida de `document.fonts.ready`, com mensagem ao usuário em vez de exportação silenciosa com alteração tipográfica.
- `src/lib/creative/design.ts`: prévia tolera indisponibilidade e usa fallback para permitir edição; exportação `strict` exige concluir o carregamento das fontes selecionadas. Saída PNG/JPEG/WebP aguarda o layout das fontes dentro do limite de tempo.
- `src/lib/creative/video-templates.ts`: início do intervalo fora da duração do vídeo passa a gerar erro claro. Mantido o limite de 20 segundos e o cálculo de FPS, sem alterar codificação H.264, perfil nem resolução.
- `tests/v42-export-integrity.mjs`: expectativa atualizada para a espera limitada de fontes; `tests/v511-font-video-safety.mjs`: 11 casos novos de regressão.

## Verificações realizadas

- `npm run verify:creative`: **167 de 167 testes aprovados**.
- `node scripts/verify-source.mjs`: **271 arquivos de código, 674 imports locais e zero ausentes**.
- `tsc --noEmit --strict --target es2022 --module esnext --lib es2022,dom --skipLibCheck src/lib/creative/typefaces.ts`: **aprovado**.
- Chromium (navegador real, testes de comportamento isolados): `document.fonts.ready` disponível, erro em folha de estilos simulado e interrupção por timeout em cerca de 32 ms no teste de prazo curto — **aprovado**.
- Integridade do ZIP verificada após o empacotamento.

## O que estes testes NÃO comprovam

- O build completo Next.js **não foi executado** localmente: `npm run build` parou em `prisma: not found` porque `node_modules` não está disponível neste ambiente.
- A prova no Chromium usa erros de rede simulados, não garante disponibilidade real do Google Fonts nem todas as fontes premium em computadores dos assinantes.
- A codificação e reprodução de MP4 WebCodecs em 720p/1080p **ainda precisam de homologação na `clickteste`**.
- Esta rodada não altera a geometria da alça, a luz/cerâmica, Neon, Cloudflare R2 ou dados de assinantes.

## Checklist para homologar na `clickteste`

1. Compilar o projeto completo no ambiente Vercel/GitHub Actions com dependências instaladas e verificar TypeScript.
2. No Editor, selecionar texto com fontes `Inter`, `Poppins` e `Great Vibes`, exportar PNG e comparar visualmente letras, acentos e tamanhos com a prévia.
3. Repetir com acesso a Google Fonts bloqueado via ferramentas de rede do navegador: verificar que a exportação falha com mensagem e que a arte original permanece intacta.
4. Reativar a rede e tentar a mesma exportação: confirmar que a fonte volta a carregar.
5. Adicionar MP4 mais curto do que o valor `start` escolhido: verificar aviso em vez de clipe fora da posição.
6. Exportar um intervalo válido de vídeo de até 20 s (720p e, onde suportado, 1080p); reproduzir arquivo no próprio navegador e em reprodutor externo.
7. Executar teste em desktop e celular; conferir comportamento com conexões lentas e projetos com múltiplas imagens.

## Pendências gerais ainda abertas

Homologação real MP4 e API da IA, fidelidade fotográfica da caneca/alça, PSD/PDF complexos, revisão integral de idiomas e desempenho mobile. **Não publicar em produção sem esta homologação.**
