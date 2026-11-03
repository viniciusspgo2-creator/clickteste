import { AlphaWebMMuxer } from "./alpha-webm-muxer";

export async function alphaVideoConfig(
  width: number, height: number, fps: number,
): Promise<VideoEncoderConfig | null> {
  if (typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined")
    return null;
  const base: VideoEncoderConfig = {
    codec: "vp09.00.40.08", width, height, framerate: fps,
    bitrate: Math.round(Math.min(80_000_000, Math.max(15_000_000, width * height * fps * 0.58))),
    latencyMode: "realtime",
    alpha: "discard", // alfa é codificado separadamente; alpha:keep não é universal.
  };
  for (const hardwareAcceleration of ["prefer-software", "no-preference"] as const) {
    try {
      const config = { ...base, hardwareAcceleration };
      if ((await VideoEncoder.isConfigSupported(config)).supported) return config;
    } catch { /* tenta a próxima implementação do navegador */ }
  }
  return null;
}

/** Dois encoders VP9 sincronizados, um para RGB e outro para a máscara A. */
export async function createAlphaVideoEncoder(width: number, height: number, fps: number) {
  const config = await alphaVideoConfig(width, height, fps);
  if (!config)
    throw new Error("Este navegador não suporta vídeo com ALFA. Tente Chrome ou Edge atualizados em um computador, ou desative ALFA para exportar o vídeo normal.");

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Não foi possível preparar os frames transparentes.");
  const muxer = new AlphaWebMMuxer(width, height, fps);
  const ySize = width * height;
  const uvSize = Math.ceil(width / 2) * Math.ceil(height / 2);
  const mask = new Uint8Array(ySize + uvSize * 2);
  mask.fill(128, ySize);
  const colorPlanes = new Uint8Array(mask.length);
  const colorSpace: VideoColorSpaceInit = {
    matrix: "bt709", transfer: "iec61966-2-1", primaries: "bt709", fullRange: false,
  };
  let failure: Error | null = null;
  const onError = (e: DOMException) => { failure = new Error(e.message); };
  const output = (channel: "color" | "alpha") => (chunk: EncodedVideoChunk, metadata?: EncodedVideoChunkMetadata) => {
    try { muxer.addChunk(channel, chunk, metadata); }
    catch (e) { failure = e instanceof Error ? e : new Error(String(e)); }
  };
  const color = new VideoEncoder({ output: output("color"), error: onError });
  const alpha = new VideoEncoder({ output: output("alpha"), error: onError });
  const close = () => {
    if (color.state !== "closed") color.close();
    if (alpha.state !== "closed") alpha.close();
    canvas.width = canvas.height = 0;
  };
  try {
    color.configure(config);
    alpha.configure(config);
  } catch (e) {
    close();
    throw e;
  }

  return {
    async encode(source: HTMLCanvasElement, timestamp: number, keyFrame: boolean) {
      if (failure) throw failure;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(source, 0, 0, width, height);
      // getImageData fornece RGB não premultiplicado: evita halos escuros nas bordas.
      const image = ctx.getImageData(0, 0, width, height);
      const rgba = image.data;
      for (let p = 0; p < ySize; p++) {
        const i = p * 4;
        mask[p] = rgba[i + 3];
        colorPlanes[p] = Math.round(16 + (0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2]) * 219 / 255);
      }
      // Converte explicitamente para BT.709, evitando conversões implícitas de
      // canvas que variam entre implementações do WebCodecs (BT.601/BT.709).
      const chromaWidth = Math.ceil(width / 2);
      for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
          let r = 0, g = 0, b = 0, count = 0;
          for (let dy = 0; dy < 2 && y + dy < height; dy++) {
            for (let dx = 0; dx < 2 && x + dx < width; dx++) {
              const i = ((y + dy) * width + x + dx) * 4;
              r += rgba[i]; g += rgba[i + 1]; b += rgba[i + 2]; count++;
            }
          }
          const p = (y / 2) * chromaWidth + x / 2;
          colorPlanes[ySize + p] = Math.round(128 + (-0.100644 * r - 0.338572 * g + 0.439216 * b) / count);
          colorPlanes[ySize + uvSize + p] = Math.round(128 + (0.439216 * r - 0.398942 * g - 0.040274 * b) / count);
        }
      }
      const init = { timestamp, duration: Math.round(1e6 / fps) };
      const colorFrame = new VideoFrame(colorPlanes, {
        ...init, format: "I420", codedWidth: width, codedHeight: height, colorSpace,
      });
      let alphaFrame: VideoFrame | undefined;
      try {
        // Y recebe o alfa original (0..255), sem conversão RGB→Y de faixa
        // limitada (16..235), que deixaria o fundo visível e a peça translúcida.
        alphaFrame = new VideoFrame(mask, {
          ...init, format: "I420", codedWidth: width, codedHeight: height,
          colorSpace: { matrix: "bt709", transfer: "bt709", primaries: "bt709", fullRange: false },
        });
        color.encode(colorFrame, { keyFrame });
        alpha.encode(alphaFrame, { keyFrame });
      } finally {
        colorFrame.close();
        alphaFrame?.close();
      }
      const start = performance.now();
      while (color.encodeQueueSize > 4 || alpha.encodeQueueSize > 4) {
        if (failure) throw failure;
        if (performance.now() - start > 30_000)
          throw new Error("A codificação ALFA demorou demais. Tente a resolução HD 720p.");
        await new Promise((resolve) => setTimeout(resolve, 4));
      }
    },
    async finalize(total: number) {
      await Promise.all([color.flush(), alpha.flush()]);
      if (failure) throw failure;
      return muxer.finalize(total);
    },
    close,
  };
}
