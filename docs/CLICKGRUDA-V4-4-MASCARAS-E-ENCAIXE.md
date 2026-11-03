# Click & Gruda V4.4 — Máscaras profissionais e reencaixe seguro

## Objetivo

Tornar o Editor especializado em canecas mais confiável para compor mockups sobre cenários reais, especialmente situações com mãos, caixas de presente e objetos em primeiro plano. **Não altera o banco de dados.** Arquivos particulares continuam no navegador do usuário, sem upload à aplicação.

## O que mudou

1. **Máscaras com dois modos** na aba Propriedades de cada imagem:
   - **Preto e branco** (padrão anterior): branco revela; preto oculta, considerando a transparência do PNG.
   - **Transparência do PNG**: a área opaca revela o objeto, mesmo se for preta; a transparente oculta.
   - **Inverter**: alterna o que fica visível sem modificar o arquivo original.
2. **Templates inteligentes `.cgtemplate`** aceitam `maskMode` (`luminance`/`alpha`) e `maskInvert` (boolean) no `manifest.json`. Pacotes antigos, sem esses campos, continuam no modo preto/branco.
3. **Reencaixe da caneca** redimensiona junto sombra, deslocamentos, desfoque e contorno. Reencaixar sem uma máscara nova mantém a máscara que o usuário aplicou manualmente; trocar um template pode remover apenas a máscara identificada como automática do template anterior.
4. **Cache de efeitos** diferencia modo/inversão, evitando reaproveitar composição errada depois de alterar o controle.
5. **Validação de projetos** `.cgdesign` não permite valores inesperados nos campos novos. Controles e instruções em português, inglês e espanhol.

## Exemplo de manifesto

```json
{
  "format": "clickgruda-smart-template",
  "version": 1,
  "name": "Caneca em uma embalagem",
  "width": 1080,
  "height": 1350,
  "background": "cenario.webp",
  "foreground": "maos.webp",
  "mask": "mascara.png",
  "maskMode": "alpha",
  "maskInvert": false,
  "slot": { "x": 0.25, "y": 0.32, "w": 0.50, "h": 0.40 }
}
```

Os arquivos referenciados devem estar dentro do ZIP `.cgtemplate`, com nomes correspondentes. O `slot` é proporcional (0 a 1). Para um PNG com máscara preta e branca, use `"maskMode":"luminance"` ou omita a opção. A posição da caneca permanece ajustável no Editor.

## Testes realizados

- `node scripts/verify-source.mjs`: verificação de sintaxe de fontes TS/JS e resolução de imports internos.
- `node --test tests/v36-feature-checks.mjs ... tests/v44-mask-composition.mjs`: 55 testes de regressão e novas regras de máscara/reencaixe.
- `python tests/v44-browser.py`: Chromium isolado; máscara transparente/preto opaco testada nos modos luminância, alfa e alfa invertido. Amostras de alfa: `[0,0]`, `[255,0]`, `[0,255]`.
- `vercel.json` não foi alterado; o comando continua `npm run build`.

## Limitações e validação necessária na `clickteste`

- Não foi possível executar **`npm ci && npm run build` integralmente** neste ambiente porque as dependências de produção não estavam instaladas/recuperáveis. Os testes acima são úteis, mas não substituem a compilação Next.js na Vercel.
- Validar importação de `.cgtemplate` com fotos e máscaras reais, em desktop e mobile; verificar camadas, reencaixes 90/100/110%, a exportação PNG e também MP4.
- PDF/PSD complexos, IA remota, áudio em MP4 e a reprodução milimétrica da alça Live Sub permanecem fora desta atualização e **não estão homologados**.
- Nunca executar `prisma db push` em produção para instalar esta versão: **não houve alteração no schema**.

## Arquivos alterados (principais)

- `src/lib/creative/design.ts`
- `src/lib/creative/effect-cache.ts`
- `src/lib/creative/smart-templates.ts`
- `src/lib/creative/validate-project.ts`
- `src/components/creative/creative-editor.tsx`
- `src/components/creative/creative.css`
- `src/components/platform/language-provider.tsx`
- `tests/v44-mask-composition.mjs`, `tests/v44-browser.py` e ajustes pontuais em dois testes antigos
- `package.json`, `CHANGELOG.md`
