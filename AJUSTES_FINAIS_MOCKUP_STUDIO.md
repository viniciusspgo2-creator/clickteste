# Mockup Studio — ajustes finais

Atualização de 27/10/2026 sobre a entrega V2. O ZIP contém o projeto completo.

## Estampa e bordas

A estampa cobre toda a face externa, incluindo o chanfro inferior, até o limite da parede vertical. O lábio arredondado e o interior usam exclusivamente a cor da cerâmica do interior; o anel de apoio e o rebaixo inferior continuam sem impressão externa. A impressão própria do fundo continua disponível.

As fronteiras têm UVs separados e normais contínuas. Uma pequena extensão da última linha da textura impede que a filtragem forme um filete branco no pé. Os modos de altura cheia e 360° preenchem a parede; o preset de prensa e as medidas personalizadas continuam respeitando as margens escolhidas.

## Duas ou mais canecas

- **Duo** e a composição rápida de duas peças usam o mesmo arranjo: canecas do mesmo tamanho, lado a lado, com posições simétricas e enquadramento automático.
- **Distribuir sem encostar** monta uma fileira centralizada, com espaço para as alças. **Enquadrar tudo** e **Centralizar** recuperam o conjunto inteiro.
- As vistas rápidas enquadram todas as peças quando a cena contém várias canecas.
- **Mover cenário**, junto ao botão de giro, permite arrastar a câmera com o botão esquerdo ou com um dedo. O botão direito e o gesto com dois dedos continuam disponíveis. Não há o antigo limite de coordenadas que prendia o deslocamento do cenário.
- O enquadramento considera o formato do canvas, ignora os contornos de seleção e reserva espaço para as alças durante o giro.
- **Girar todas 360°** anima cada caneca no próprio eixo, com o mesmo relógio. Pausar mantém os ângulos e retomar continua a partir deles. Vídeos e GIFs também giram todas as peças e restauram as poses no final.

## Cerâmica mais brilhante

Em **Cerâmica e acabamento**, escolha **Acetinado**, **Sublimação**, **Alto brilho** ou **Vitrificado**. Refine intensidade do brilho, nitidez do verniz, camada de verniz, polimento da cerâmica e reflexos do estúdio.

**Aplicar acabamento a todas** iguala os materiais das canecas da cena. Corpo, alça e borda usam a mesma receita de material. O modo de preservação de cor mantém a base da estampa e amplia os reflexos do esmalte conforme o acabamento escolhido. Projetos antigos recebem os valores padrão dos novos parâmetros.

## Atualização e validação

Substitua os arquivos do projeto pela versão deste ZIP, preservando sua configuração de ambiente. Execute `npm ci` e a geração local do Prisma conforme o fluxo habitual do projeto. Esta atualização não exige novas dependências nem alterações no banco de dados.

O relatório desta rodada está em [docs/mockup-studio/VALIDACAO_FINAL.md](docs/mockup-studio/VALIDACAO_FINAL.md). A implementação anterior da V2 continua documentada em [STUDIO_MOCKUP_V2.md](STUDIO_MOCKUP_V2.md).
