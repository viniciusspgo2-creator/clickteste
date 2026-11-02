# Software open source pesquisado — Click & Gruda V3

Pesquisa e verificação em GitHub e fontes oficiais, 02/11/2026. Licenças referem-se **ao código**, não a imagens, fontes, músicas ou templates distribuídos por terceiros.

| Projeto | URL | Licença | Uso/decisão |
| --- | --- | --- | --- |
| Three.js | https://github.com/mrdoob/three.js | MIT | **Já usado**, modelagem e render 3D |
| React Three Fiber | https://github.com/pmndrs/react-three-fiber | MIT | **Já usado**, componentes React no WebGL |
| Drei | https://github.com/pmndrs/drei | MIT | **Já usado**, auxiliares 3D |
| Konva | https://github.com/konvajs/konva | MIT | Avaliado para Editor 2D; **não adicionado** nesta fase para evitar novas dependências sem build de testes |
| react-konva | https://github.com/konvajs/react-konva | MIT | Avaliado; dependente de compatibilidade com React 19.3, **não adicionado** |
| Fabric.js | https://github.com/fabricjs/fabric.js | MIT | Alternativa de engine 2D, **não incluído** nesta fase |
| PDF.js | https://github.com/mozilla/pdf.js | Apache-2.0 | **Já usado** e aproveitado para rasterização de PDF no cliente |
| ag-psd | https://github.com/Agamnentzar/ag-psd | MIT | Candidato futuro a parser PSD com limitações de camada; **não incluído** |
| @webtoon/psd | https://github.com/webtoon/psd | MIT | Alternativa PSD para benchmark posterior; **não incluído** |
| Lucide | https://github.com/lucide-icons/lucide | ISC/MIT nos ícones originários Feather | **Já usado** em toda interface |
| lottie-web | https://github.com/airbnb/lottie-web | MIT | Para reproduzir Lottie após etapa de pipeline de animação; **não incluído** |
| dotlottie-web | https://github.com/LottieFiles/dotlottie-web | MIT | Alternativa futuro animador Lottie; **não incluído** |
| react-postprocessing | https://github.com/pmndrs/react-postprocessing | MIT | Candidato para melhorias de pós-processamento GPU; **não incluído** |
| postprocessing | https://github.com/pmndrs/postprocessing | Zlib | Avaliado; permissivo, mas **não adicionado** |
| ffmpeg.wasm | https://github.com/ffmpegwasm/ffmpeg.wasm | MIT para wrapper; verificar codec/FFmpeg conforme build | Candidato para conversão local MP4/WebM; **não incluído** |
| three-mesh-bvh | https://github.com/gkjohnson/three-mesh-bvh | MIT | Candidato para otimizar picking de malhas complexas; **não incluído** |

## Descartados para inclusão automática

- **Polotno**: SDK de editor comercial, apesar de se apoiar em Konva. Não se trata de código reutilizável sob MIT.
- **tldraw SDK**: licença própria; produção requer chave/licença. Não integrar sob premissa de open source permissivo.
- **glTF Sample Models**: licenças de cada modelo variam; não copiar pacote integral sem auditoria modelo a modelo.

O editor desta fase usa **Canvas 2D nativo**, sem incorporar código de terceiros além das dependências já presentes no ZIP. O R2 SigV4 foi implementado com API nativa `node:crypto`, sem copiar um SDK de terceiros.
