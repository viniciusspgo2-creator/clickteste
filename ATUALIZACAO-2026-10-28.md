# Atualização Click & Gruda — página inicial, painel Admin e áudio

## Página inicial
- Áudio original `public/audio/apresentacao-click-studio-3d.mp3` (cerca de 37 segundos).
- Player acessível com play/pause, andamento, reiniciar e tempo. `preload="none"` e **sem autoplay**: reprodução somente depois de clique do visitante, inclusive em dispositivos móveis.
- Layout da hero com o mascote do usuário, referência ao Studio 3D e destaque para uma estampa de caneca.
- Duas faixas contínuas de artes enviadas pelo usuário, com pausa no hover/foco; fotos otimizadas em WebP.
- Alinhamento tipográfico do preço R$ 47,90 e ajustes de legibilidade.

## Painel Admin
- Organização responsiva e correção do layout espremido.
- Códigos universais com 1 a 100 usuários distintos por navegador, e opções rápidas 10/30/40/50/100.
- Capacidade editável no Admin; novos dispositivos são bloqueados ao atingir o limite.
- Ao reduzir o limite, vínculos excedentes são revogados para manter a nova capacidade.
- Controle de sessões separado para códigos universais e individuais.

## Como publicar
1. Faça backup do código e do banco antes de atualizar.
2. Mantenha seu `.env` e sua pasta `.git`; substitua os arquivos do projeto pelos deste ZIP.
3. Faça `npm install`/`npm ci` para instalar as dependências no ambiente de build.
4. **Importante para códigos universais:** a alteração de estrutura de `AccessCode` e `AccessCodeUse` exige atualizar o Prisma no banco (`npx prisma db push` ou seu processo de migração). O script `npm run build` deste projeto já inclui `prisma generate` e `prisma db push` antes do `next build`; revise as permissões do banco e faça backup primeiro.
5. Confirme que o build concluiu e faça o deploy na Vercel.
6. Teste na página inicial o play/pause, a barra e o áudio no mobile; no Admin, crie um código de teste com 10 usuários e verifique o bloqueio do 11º navegador.

## Validação realizada aqui
- Confirmada a duração e integridade do MP3 (aprox. 36,7 s).
- Os arquivos TypeScript alterados passaram em uma verificação de sintaxe.
- Não foi possível executar a verificação completa do projeto (`next build`) neste ambiente: a cópia temporária de `node_modules` continha diretórios vazios e faltavam tipos. Por isso, a compilação final e o deploy devem ser confirmados no seu ambiente de build.
