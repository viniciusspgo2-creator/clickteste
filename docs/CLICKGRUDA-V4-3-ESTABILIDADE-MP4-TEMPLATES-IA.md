# Click & Gruda V4.3 — Estabilidade MP4, Templates, IA e Alça

**Alvo:** conta Vercel `clickteste` (staging). **Base:** V4.2. **Não substitui a produção original.**

## Mudanças efetivas

1. **MP4:** `waitForVideoData` e `seekVideoFrame` agora têm tempo limite, cancelamento via `AbortSignal`, limpeza de listeners e mensagens identificáveis quando o vídeo não é decodificado. A exportação rejeita duração ausente, inválida ou infinita e início/fim não numéricos. O limite de canvases simultâneos foi reduzido para preservar memória, com alternativa de renderização em sequência quando o projeto contém muitas camadas.
2. **Templates inteligentes:** validação estrutural do `manifest.json` antes da leitura das imagens; verificação da área de encaixe; escala consistente de sombras, borrões, contornos, efeitos tipográficos e posições animadas ao mudar o tamanho do layout; máscara automática anterior removida apenas quando não pertence ao novo template.
3. **Assistente IA:** leitura limitada a 4 KiB de JSON **efetivamente recebidos**, inclusive sem Content-Length, com erros claros para corpo inválido e formato incorreto. O assistente continua sugerindo apenas ações do módulo correspondente e precisa de confirmação do cliente; ainda depende de `OPENAI_API_KEY` para consultas externas. A limitação por IP segue local à instância, não distribuída.
4. **Alça Live Sub:** as pontas da geometria são afiladas dentro da parede cerâmica para reduzir tampas aparentes na junção da alça. Os demais modelos de alça não foram modificados. A fotografia frontal não permite afirmar exatidão milimétrica em todos os ângulos.

## Arquivos atualizados

- `src/lib/creative/video-templates.ts`
- `src/lib/creative/smart-templates.ts`
- `src/lib/creative/assistant-request.ts` (novo)
- `src/app/api/creative-assistant/route.ts`
- `src/components/tools/mockup/scene/mug-geometry.ts`
- `tests/v37-feature-checks.mjs` (test fixture adaptada à validação de JSON)
- `tests/v43-reliability.mjs` (novo)
- `package.json` (ampliação do comando de testes)
- Este relatório

## Verificação realizada no ambiente de desenvolvimento

- `node scripts/verify-source.mjs` — sintaxe e resolução de imports internos, aprovado.
- `npm run verify:creative` — testes TypeScript transpilados por módulo, incluindo seis novos testes V4.3; aprovado.
- `python tests/v39-browser.py` e `python tests/v42-browser.py` — testes isolados de renderização e máscaras no Chromium; aprovados. **Não equivalem a uma execução end-to-end do aplicativo Next.js.**

## Não homologado

- `npm run build` completo: dependências npm/Prisma não puderam ser instaladas integralmente no ambiente desta edição. Validar no pipeline da Vercel.
- O MP4 H.264 em navegadores reais precisa ser testado em `clickteste` com vídeo de entrada real, WebCodecs disponível e cancelamento durante a exportação. Sem áudio.
- A renderização 3D completa e a alça sob vários ângulos precisam de teste visual: mudanças geométricas não comprovam fidelidade exata à foto.
- A IA real precisa de configuração de chave e testes no ambiente autorizado. Sem chave, o guia local permanece disponível.

## Checklist rápido de homologação na clickteste

1. Confirmar status READY com `npm run build` e ausência de erros TypeScript.
2. No Editor, importar um vídeo MP4 H.264 de 5–10s, aplicar um texto animado, exportar, abrir o MP4 resultante e comparar posições e tamanho.
3. Repetir e cancelar durante o processamento: a exportação deve parar sem baixar arquivo incompleto.
4. Aplicar dois templates inteligentes consecutivos, um com máscara e outro sem: o segundo não pode herdar máscara do primeiro.
5. Testar troca de formato de template com texto e sombra: tamanhos e posições devem permanecer proporcionais.
6. Girar a caneca com alça Live Sub em 360°, testar inclinação e verificar a junção superior e inferior da alça.
7. Sem `OPENAI_API_KEY`, validar modo guia; se configurada, confirmar ações apenas após aprovação, erros de payload e limite de uso.

**Banco de dados:** nenhuma migração Prisma incluída nesta versão. **Privacidade:** os uploads de clientes permanecem locais, sem novo armazenamento de imagens do usuário no servidor.
