# Click & Gruda V4.5 — relatório técnico de staging

## Escopo desta rodada

### 1. Templates e máscaras
- **Corrigido**: `.cgtemplate` normalmente possui máscaras do tamanho do cenário inteiro. Agora a caneca amostra a região correspondente às próprias coordenadas no cenário. Isso corrige a deformação espacial observada quando a máscara inteira era espremida para dentro do retângulo da caneca.
- `maskSpace: "canvas"`: máscara alinhada ao cenário; aplica-se às máscaras vindas de templates. `maskSpace: "element"` (ou omitido): máscara local ao objeto; aplica-se aos uploads manuais.
- Mover/redimensionar a caneca altera a região amostrada, sem recriar ou deformar o arquivo da máscara. O cache leva a posição e as dimensões em conta.
- Limitação conhecida: máscaras alinhadas ao cenário assumem transformações retangulares. Perspectiva 3D e oclusão real de uma mão exigem foto/máscara preparada e avaliação visual do resultado, especialmente em objetos rotacionados.

### 2. MP4
- Verificação antecipada de dimensões e intervalo da linha do tempo, mantendo o limite de até 20 segundos e tamanho máximo correspondente a 1280 × 720, 24 quadros/s, sem áudio.
- Erro amigável quando vídeo local/externo não possui quadros válidos ou está bloqueado por CORS.
- A seleção do codec H.264 continua dependente de WebCodecs no navegador do cliente. Sem WebCodecs não há exportação MP4, e o projeto permanece editável.

### 3. Segurança dos templates
- Assinaturas PNG/JPEG/WebP validadas antes de converter bytes de arquivos de template em imagens; evita tentar interpretar HTML/SVG disfarçados como imagem raster.
- Preservados limites de quantidade de entradas, tamanho ZIP e imagens descompactadas. Nenhum arquivo do cliente é enviado ao servidor.

## Testes executáveis
```
npm run verify:creative
python tests/v44-browser.py
python tests/v45-mask-browser.py
```
A validação de imports está incluída em `verify:creative`. No ambiente de desenvolvimento foram executados testes isolados Node e Chromium para confirmar a lógica e os pixels de máscaras. A tentativa de testar a codificação H.264 completa em uma origem HTTP localhost foi bloqueada por política do ambiente, então **não constitui homologação MP4**.

## Checklist de deploy na `clickteste`
1. Rodar `npm ci` e `npm run build` no ambiente de staging.
2. Criar um template inteligente com imagem de mãos/primeiro plano e máscara grande no tamanho do cenário. Enviar caneca, movimentá-la e comparar prévia versus PNG exportado.
3. Verificar imagens/máscaras manuais (máscara do próprio objeto), inclusive após trocar template.
4. Exportar MP4 de 5, 10 e 20 segundos em Chrome e Edge, com vídeo horizontal e vertical, conferir reprodução, qualidade, duração, alinhamento e cancelamento.
5. Verificar o assistente com chave de API habilitada e confirmar que ele solicita aprovação antes de ações.
6. Comparar a alça Live Sub e os materiais cerâmicos em vista frontal/lateral com referência real. Esta versão **não alterou** a geometria da alça nem promete reprodução exata.

## Restrições
- Não há novas migrações Prisma ou variáveis de ambiente obrigatórias nesta atualização.
- Não há homologação do build Next.js neste ambiente: dependências npm não estavam instaladas.
- Não considerar todos os PSD/PDF editáveis: o suporte permanece limitado à estrutura do arquivo e aos formatos já documentados.
- Os uploads do usuário permanecem no navegador; o acervo administrativo continua no servidor.
