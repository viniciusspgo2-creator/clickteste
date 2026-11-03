# Click & Gruda V5.4 — Integridade de templates e CI

**Status:** staging. Entrega de código para testar no projeto `clickteste`; não foi realizado deploy nem modificação de banco de dados.

## Mudanças desta versão

1. **Carregamentos assíncronos seguros.** Todas as formas de aplicar um `.cgtemplate` — acervo do Admin, upload do usuário e pacote de demonstração — capturam a revisão do documento e o identificador do pedido. Se o documento mudar durante a leitura, ou se houver uma escolha mais recente, o resultado antigo é descartado, sem sobrescrever a composição.
2. **Fundos e layouts sem corrida de carregamento.** A escolha de um novo fundo invalida pedidos anteriores; o Editor não injeta um fundo atrasado sobre uma arte que foi modificada. A leitura duplicada de imagens de fundo no acervo foi removida.
3. **Máscaras automáticas isoladas.** Ao sair de um template inteligente e usar uma cena comum, o Editor remove apenas a máscara vinculada ao template antigo. Máscaras aplicadas manualmente a objetos continuam presentes. Nenhum arquivo local é enviado ao servidor nessas transições.
4. **GitHub Actions para impedir regressões.** `.github/workflows/verify-clickgruda.yml` executa instalação pelo lockfile, verificação de imports, testes, geração do Prisma Client, tipagem completa e build. O workflow usa `DATABASE_URL` de exemplo sem credenciais de produção e não executa migrações nem faz deploy.
5. **Cinco novos testes** verificam rejeição de carregamentos antigos, proteção contra mudanças, integridade das máscaras, cobertura dos três caminhos de importação e o pipeline CI.

## Evidências da execução local

- `npm run verify:creative`: **110/110 testes passaram**.
- `node scripts/verify-source.mjs`: **266 arquivos de código, 665 imports locais, 0 problemas**.
- `npm run build`: **não concluído**, interrompido em `prisma: not found`, por falta de dependências `node_modules` neste ambiente. Nenhuma confirmação de build Next.js ou teste end-to-end é reivindicada.

## Como validar na clickteste

1. Subir o conteúdo de `clicktools-main/` somente para o repositório de testes, incluindo a pasta `.github/workflows/`.
2. Conferir o resultado de **Actions → Click & Gruda — Check de código e build**. Se o build CI exigir variáveis de tempo de compilação, ajustar somente o ambiente de teste, sem colocar credenciais reais em commits/logs.
3. No Editor, abrir um template inteligente grande e, durante a leitura, editar um texto ou escolher outro template; a seleção antiga não pode substituir o trabalho mais recente.
4. Trocar um template com máscara automática por um fundo comum, confirmando que a caneca continua, a máscara anterior desaparece e máscaras manuais não são removidas.
5. Testar exportação PNG/MP4 e a integração com o Studio em desktop e celular. Não considerar homologado apenas pelo status `Ready` na Vercel.

## Pendências importantes

Ainda faltam testes integrados e validação visual do realismo/alça 3D, exportação MP4 no navegador publicado, agente de IA com provedor real, compatibilidade PDF/PSD com documentos complexos, auditoria completa de traduções e desempenho em dispositivos móveis. Não há garantia de fidelidade geométrica exata da caneca a partir de uma única fotografia.

**Banco:** não foram alterados Prisma Schema, migrações ou rotas administrativas. Esta atualização não exige `prisma db push`.
