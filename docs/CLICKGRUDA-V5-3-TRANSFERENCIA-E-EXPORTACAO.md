# Click & Gruda V5.3 — transferência limpa e validação de exportação

## Objetivo
Melhorar o uso da caneca renderizada pelo Studio Mockup 3D dentro do Editor de Artes e dos Templates Inteligentes, sem mexer no projeto publicado, no banco de dados ou nas credenciais.

## Alterações nesta rodada
1. **Recorte alfa no envio ao Editor.** `src/lib/creative/transparent-crop.ts` encontra o retângulo visível no PNG gerado pelo Studio, preserva todos os pixels visíveis e adiciona 2,5% de margem. Nenhum dado é enviado ao servidor. A transferência continua no IndexedDB local, como antes.
2. **Encaixe proporcional.** O Editor recebe um PNG cuja caixa é proporcional à caneca em vez do quadro de exportação com grandes margens vazias. Isso melhora a dimensão inicial e o encaixe em templates, sem esticar nem alterar a estampa.
3. **Exportação independente do limite de imagem.** O botão `Enviar mockup para o Editor de Artes` deixa de ser bloqueado pelo limite de resolução da exportação tradicional, pois a transferência já reduz a imagem para no máximo 2400 px por lado. O download tradicional ainda mantém seus limites de segurança.
4. **Formato do download confiável.** `image-exporter.ts` deixa de aceitar silenciosamente um PNG produzido em lugar de JPEG/WebP quando o navegador não implementa o codec solicitado. Mostra erro amigável em vez de salvar um arquivo com extensão incompatível.
5. **Fallback de compatibilidade.** A leitura do PNG tenta `createImageBitmap` e, se necessário, usa uma URL temporária do próprio navegador; recursos são liberados após o recorte.

## Garantias e escopo
- Nenhum upload de cliente é persistido na API, R2 ou Neon; o handoff permanece no navegador.
- Nenhum shader, geometria da caneca, preset, sombra de cena, dado administrativo ou esquema Prisma foi modificado nesta versão.
- Não altera fontes, templates existentes ou a versão original.
- O recorte considera **todos** os pixels não transparentes; se um plano de acesso exige marca d'água, ela continua preservada.
- Não promete fidelidade milimétrica da alça à foto nem homologação integral do MP4, IA ou do Next.js.

## Verificações feitas
- 105/105 testes de regressão, incluindo 7 novos para área alfa, margens e transferência.
- 265 arquivos-fonte e 663 imports internos verificados (`npm run verify:creative`).
- Tipagem isolada de `transparent-crop.ts` (`tsc --noEmit --strict`): passou.
- Chromium real, sem rede: imagem 200×100 com objeto 40×64, recortada em PNG 44×68, mantendo os 2.560 pixels pintados e a região transparente de margem.
- O comando `npm run build` executou a checagem de fontes/imports e parou em `prisma: not found`, por ausência de dependências no ambiente local; **build Next.js não homologado**.

## Checklist na Vercel `clickteste`
1. Garanta que o repositório contém `src/lib/creative/transparent-crop.ts` e `tests/v53-transparent-handoff.mjs`.
2. Faça deploy de teste e verifique TypeScript e build.
3. No Studio, escolha caneca com arte, fundo transparente e use **Enviar mockup para o Editor**.
4. Confirme que a caneca chega sem sombras de chão e sem grandes áreas transparentes desnecessárias, mantendo a marca d'água quando aplicável.
5. Troque entre dois templates inteligentes, reencaixe, gire e exporte PNG. Confirme fidelidade e proporção.
6. Exporte WebP e JPEG no navegador usado e confira a extensão e o conteúdo real.
7. Teste um navegador desktop e um celular antes de promover qualquer deploy.

**Deploy:** apenas na `clickteste`; nenhuma migração no Neon e nenhuma variável obrigatória nova.
