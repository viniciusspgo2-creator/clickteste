/* ============================================================
   Exportador de vídeo (MP4 / WebM com alfa) e GIF animado.
   MP4: WebCodecs VideoEncoder + mp4-muxer (H.264, in-memory).
   Fallback: MediaRecorder (MP4 no Safari, WebM no resto).
   GIF: gifenc com paleta adaptativa por frame.
   ============================================================ */

import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import * as THREE from "three";
import {
  applyWatermark,
  beginFrames,
  captureFrame,
  checkH264Support,
  detectWebCodecs,
  endFrames,
  ExportError,
  fitCamera,
  renderFrame,
  sceneCenter,
  setMugOverride,
  type FrameSession,
} from "./frame-capture";
import { mugsGroup } from "../scene/studio-refs";
import { useMockupStore, type VideoAnim } from "../state/store";
import { createAlphaVideoEncoder } from "./alpha-video-encoder";

export const VIDEO_RESOLUTIONS: Record<
  string,
  { w: number; h: number; label: string }
> = {
  sq1080: { w: 1080, h: 1080, label: "Quadrado 1080" },
  hd: { w: 1280, h: 720, label: "HD 720p" },
  vertical: { w: 1080, h: 1920, label: "Story 1080×1920" },
  wide: { w: 1920, h: 1080, label: "Full HD 1920×1080" },
  qhd: { w: 2560, h: 1440, label: "2K QHD" },
  uhd: { w: 3840, h: 2160, label: "4K UHD" },
  story4k: { w: 2160, h: 3840, label: "Story 4K" },
  square4k: { w: 2160, h: 2160, label: "Quadrado 4K" },
  feed: { w: 1080, h: 1350, label: "Feed 4:5" },
  feed4k: { w: 2160, h: 2700, label: "Feed 4K 4:5" },
};

export interface AnimOpts {
  anim: VideoAnim;
  duration: number;
  fps: number;
  transparent?: boolean;
  onProgress?: (p: number) => void;
  quality?: "fast" | "high" | "ultra";
  direction?: "right" | "left" | "pingpong";
  turns?: number;
  signal?: AbortSignal;
}

/* ---------------- caminho de câmera ---------------- */

const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

/* ---------------- mesa giratória (turntable) ---------------- */

/**
 * GIRO PROFISSIONAL — a CANECA gira sobre o próprio eixo (mesa giratória
 * de estúdio), com câmera, luzes e cenário parados:
 *  - o enquadramento não oscila um milímetro (câmera fixa);
 *  - os reflexos varrem o esmalte de forma natural (o look premium dos
 *    vídeos de produto);
 *  - a sombra de contato da alça varre o chão como numa mesa real;
 *  - velocidade angular constante e loop perfeito.
 */
interface Turntable {
  objects: { obj: THREE.Object3D; rot0: number }[];
}

function beginTurntable(scene: THREE.Scene): Turntable {
  const objects: Turntable["objects"] = [];
  mugsGroup(scene)?.traverse(obj => {
    if (obj.name === "mug-float" && obj.visible) objects.push({ obj, rot0: obj.rotation.y });
  });
  return { objects };
}

function videoAngle(t: number, opts: Pick<AnimOpts, "turns" | "direction">) {
  const turns = Math.max(0.5, Math.min(3, opts.turns ?? 1));
  const cycle = (opts.direction === "pingpong")
    ? (1 - Math.cos(t * Math.PI * 2 * turns)) * 0.5
    : t * turns;
  return Math.PI * 2 * (opts.direction === "left" ? -cycle : cycle);
}

function checkCancelled(signal?: AbortSignal) {
  if (signal?.aborted) throw new ExportError("Exportação cancelada pelo usuário.");
}

function applyTurntable(tt: Turntable, angle: number) {
  for (const { obj, rot0 } of tt.objects) obj.rotation.y = rot0 - angle;
}

function endTurntable(tt: Turntable | null) {
  if (!tt) return;
  for (const { obj, rot0 } of tt.objects) obj.rotation.y = rot0;
}

/**
 * Espera o contexto WebGL ser restaurado (queda por GPU fraca/driver).
 * Segurança: resolve mesmo assim após 4 s para nunca travar a exportação.
 */
function waitForContext(gl: THREE.WebGLRenderer): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    gl.domElement.addEventListener("webglcontextrestored", finish, {
      once: true,
    });
    setTimeout(finish, 4000);
  });
}

/**
 * Robustez por frame: se o contexto caiu (GPU fraca), espera restaurar e
 * força a re-subida da textura da folha — os frames nunca saem brancos.
 */
async function ensureContext(session: FrameSession) {
  const ctx = session.gl.getContext();
  if (ctx && !ctx.isContextLost()) return;
  await waitForContext(session.gl);
  if (session.tex) session.tex.needsUpdate = true;
}

/**
 * Trajetória da câmera por frame.
 * IMPORTANTE: `baseOffset` é o vetor CENTRO→CÂMERA original (imutável).
 * Nunca derivamos o offset da posição atual da câmera — o bug antigo fazia
 * exatamente isso e a rotação COMPUNHA a cada frame (devagar no início,
 * ultra-rápido no fim). Aqui cada frame parte do offset original.
 * No anim “giro” a câmera fica PARADA (a caneca é que gira — turntable).
 */
function applyCameraPath(
  anim: VideoAnim,
  t: number,
  cam: THREE.PerspectiveCamera,
  baseOffset: THREE.Vector3,
  center: THREE.Vector3,
  heatOverride: (v: number) => void,
) {
  const offset = baseOffset.clone();
  const dist = baseOffset.length();

  if (anim === "giro") {
    // câmera fixa no enquadramento original — a caneca gira (turntable)
    cam.position.copy(center).add(offset);
  } else if (anim === "orbita") {
    const a = Math.sin(t * Math.PI * 2) * THREE.MathUtils.degToRad(46);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
    const bob = Math.sin(t * Math.PI * 4) * dist * 0.045;
    cam.position
      .copy(center)
      .add(offset)
      .add(new THREE.Vector3(0, bob, 0));
  } else if (anim === "zoom") {
    const k = 1.28 - 0.34 * easeInOut(t);
    const a = Math.sin(t * Math.PI * 2) * THREE.MathUtils.degToRad(10);
    const off = offset
      .clone()
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), a)
      .normalize()
      .multiplyScalar(dist * k);
    cam.position.copy(center).add(off);
  } else {
    // revelacao — câmera parada, calor 0→1 com curva suave
    cam.position.copy(center).add(offset);
    heatOverride(easeInOut(t));
  }
  cam.lookAt(center);
  cam.updateMatrixWorld();
}

/* ---------------- MP4 ---------------- */

export interface VideoResult {
  blob: Blob;
  filename: string;
  mimeType: string;
  width: number;
  height: number;
  engine: "webcodecs" | "mediarecorder";
}

export async function exportVideo(
  resolution: string,
  animOpts: AnimOpts,
): Promise<VideoResult> {
  const res = VIDEO_RESOLUTIONS[resolution] ?? VIDEO_RESOLUTIONS.wide;
  if (!Number.isFinite(animOpts.duration) || animOpts.duration < 3 || animOpts.duration > 20)
    throw new ExportError("Escolha um vídeo de 3 a 20 segundos.");
  if (![24, 30, 60].includes(animOpts.fps)) throw new ExportError("Taxa de quadros inválida.");
  if (animOpts.signal?.aborted) throw new ExportError("Exportação cancelada.");
  // Nunca faz fallback opaco quando o usuário solicitou transparência.
  if (animOpts.transparent) return exportVideoAlpha(res.w, res.h, animOpts);
  const supported = await checkH264Support(res.w, res.h);
  if (supported) return exportVideoWebCodecs(res.w, res.h, animOpts);
  if (typeof MediaRecorder !== "undefined") {
    if (res.w * res.h > 1920 * 1080)
      throw new ExportError("Seu navegador não oferece codificação 2K/4K com qualidade confiável. Escolha Full HD ou use Chrome/Edge atualizado.");
    return exportVideoMediaRecorder(res.w, res.h, animOpts);
  }
  throw new ExportError(
    "Seu navegador não suporta exportar vídeo. Use o Chrome ou Edge atualizados — ou exporte um GIF.",
  );
}

async function exportVideoAlpha(
  w: number,
  h: number,
  { anim, duration, fps, onProgress, ...extra }: AnimOpts,
): Promise<VideoResult> {
  if (anim === "revelacao" && useMockupStore.getState().mug.variant !== "magic")
    throw new ExportError("A animação de revelação só funciona na caneca mágica. Escolha outro movimento.");
  let encoder: Awaited<ReturnType<typeof createAlphaVideoEncoder>> | undefined;
  let session: FrameSession | undefined;
  let tt: Turntable | null = null;
  try {
    encoder = await createAlphaVideoEncoder(w, h, fps);
    session = beginFrames(w, h, { transparent: true, ssCap: extra.quality === "fast" ? 1 : 2 });
    const base = fitCamera(session);
    const center = sceneCenter(session.scene);
    const baseOffset = new THREE.Vector3().subVectors(base.position, center);
    tt = anim === "giro" ? beginTurntable(session.scene) : null;
    const total = Math.max(2, Math.round(duration * fps));
    for (let i = 0; i < total; i++) {
      await ensureContext(session);
      checkCancelled(extra.signal);
      const t = i / total;
      if (tt) applyTurntable(tt, videoAngle(t, extra));
      applyCameraPath(anim, t, base, baseOffset, center, (v) =>
        setMugOverride(session!, { magicHeat: v }));
      renderFrame(session, base);
      // A cópia ocorre antes de ceder o controle: preserveDrawingBuffer=false.
      // captureFrame também aplica a marca d'água e reduz o supersampling.
      const frame = await captureFrame(session, w, h);
      await encoder.encode(frame, Math.round(i * 1e6 / fps), i % (fps * 2) === 0);
      onProgress?.((i + 1) / total * 0.95);
      if (i % 3 === 2) await new Promise((resolve) => setTimeout(resolve, 0));
    }
    const blob = await encoder.finalize(total);
    if (!blob.size) throw new ExportError("O vídeo saiu vazio. Tente uma resolução menor.");
    onProgress?.(1);
    return {
      blob, filename: `mockup-caneca-${anim}-${h}p-alfa-${Date.now()}.webm`,
      mimeType: "video/webm", width: w, height: h, engine: "webcodecs",
    };
  } catch (e) {
    throw e instanceof ExportError ? e : new ExportError(
      e instanceof Error ? e.message : "Não foi possível gerar o vídeo com ALFA.");
  } finally {
    encoder?.close();
    endTurntable(tt);
    if (session) endFrames(session);
  }
}

/** Captura direta antes de o navegador limpar o framebuffer.
 * Reutiliza o mesmo canvas e aplica marca d'água, sem criar PNGs temporários
 * nem fazer decode de uma imagem em cada quadro de vídeo. */
function copyFrameFast(session: FrameSession, output: HTMLCanvasElement) {
  const ctx = output.getContext("2d");
  if (!ctx) throw new ExportError("Falha ao preparar o quadro de vídeo.");
  ctx.clearRect(0, 0, output.width, output.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(session.gl.domElement, 0, 0, output.width, output.height);
  applyWatermark(ctx, output.width, output.height);
}

async function exportVideoWebCodecs(
  w: number,
  h: number,
  { anim, duration, fps, onProgress, ...extra }: AnimOpts,
): Promise<VideoResult> {
  // supersampling 1,5× (não 2×): vídeo em movimento esconde o detalhe e a
  // memória de GPU poupada evita perda de contexto WebGL em máquinas fracas
  const session = beginFrames(w, h, { transparent: false, ssCap: extra.quality === "fast" ? 1 : 2 });
  try {
    const base = fitCamera(session);
    const center = sceneCenter(session.scene);
    const isMagic = useMockupStore.getState().mug.variant === "magic";
    if (anim === "revelacao" && !isMagic) {
      throw new ExportError(
        "A animação de revelação só funciona na caneca mágica. Escolha outro movimento.",
      );
    }

    // Seleção de codec conforme perfil e limites da resolução.
    let codec: string | null = null;
    const large = w * h > 1920 * 1080;
    for (const c of (large
      ? ["avc1.640033", "avc1.640032", "avc1.64002a"]
      : ["avc1.64002a", "avc1.640028", "avc1.4d0028", "avc1.42E01E"])) {
      const r = await VideoEncoder.isConfigSupported({
        codec: c,
        width: w,
        height: h,
        framerate: fps,
        bitrate: 10_000_000,
      });
      if (r.supported) {
        codec = c;
        break;
      }
    }
    if (!codec) throw new ExportError("O navegador não suporta H.264 nessa resolução. Escolha Full HD ou use Chrome/Edge atualizados.");

    const pixels = w * h;
    // bitrate generoso: produto parado girando tem fundo limpo — o encoder
    // gasta os bits na caneca; 0,26·px·fps ≈ 9,8 Mbps em 1080²@30
    const qualityFactor = extra.quality === "ultra" ? 1.15 : extra.quality === "fast" ? 0.42 : 0.72;
    const bitrate = Math.round(Math.min(110_000_000,
      Math.max(pixels >= 3840 * 2160 ? 60_000_000 : pixels >= 2560 * 1440 ? 35_000_000 : 20_000_000,
        pixels * fps * qualityFactor)));
    const target = new ArrayBufferTarget();
    const muxer = new Muxer({
      target,
      video: { codec: "avc", width: w, height: h, frameRate: fps },
      fastStart: "in-memory",
    });

    let encError: Error | null = null;
    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => {
        encError = e instanceof Error ? e : new Error(String(e));
      },
    });
    encoder.configure({ codec, width: w, height: h, bitrate, framerate: fps });

    const total = Math.max(2, Math.round(duration * fps));
    const output = document.createElement("canvas");
    output.width = w;
    output.height = h;
    // offset original (imutável) — evita a rotação composta do bug antigo
    const baseOffset = new THREE.Vector3().subVectors(base.position, center);
    // giro = mesa giratória: a caneca gira, a câmera fica parada
    const tt = anim === "giro" ? beginTurntable(session.scene) : null;
    try {
      for (let i = 0; i < total; i++) {
        if (encError) throw encError;
        await ensureContext(session);
        checkCancelled(extra.signal);
        const t = i / total; // renderiza sem duplicar o primeiro quadro
        if (tt) applyTurntable(tt, videoAngle(t, extra));
        applyCameraPath(anim, t, base, baseOffset, center, (v) =>
          setMugOverride(session, { magicHeat: v }),
        );
        renderFrame(session, base);

        copyFrameFast(session, output);
        const frame = new VideoFrame(output, {
          timestamp: Math.round((i * 1e6) / fps),
          duration: Math.round(1e6 / fps),
        });
        encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
        frame.close();

        // respeita o backpressure do encoder
        while (encoder.encodeQueueSize > 6) {
          await new Promise((r) => setTimeout(r, 4));
        }
        onProgress?.((i + 1) / total);
      }
    } finally {
      endTurntable(tt);
    }

    await encoder.flush();
    encoder.close();
    if (encError) throw encError;
    muxer.finalize();

    const blob = new Blob([target.buffer as ArrayBuffer], {
      type: "video/mp4",
    });
    if (!blob.size)
      throw new ExportError("O vídeo saiu vazio. Tente uma resolução menor.");
    return {
      blob,
      filename: `mockup-caneca-${anim}-${h}p-${Date.now()}.mp4`,
      mimeType: "video/mp4",
      width: w,
      height: h,
      engine: "webcodecs",
    };
  } finally {
    endFrames(session);
  }
}

/** fallback universal: animação capturada via MediaRecorder */
async function exportVideoMediaRecorder(
  w: number,
  h: number,
  { anim, duration, fps, onProgress, ...extra }: AnimOpts,
): Promise<VideoResult> {
  // sem supersampling: a gravação é em tempo real — o render precisa ser leve
  // para manter a cadência uniforme (rotação suave).
  const session = beginFrames(w, h, {
    transparent: false,
    noSupersample: true,
  });
  try {
    const canvas = session.gl.domElement as HTMLCanvasElement & {
      captureStream: (fps: number) => MediaStream;
    };
    if (typeof canvas.captureStream !== "function") {
      throw new ExportError(
        "Seu navegador não suporta gravação de vídeo. Use Chrome, Edge ou Safari recentes.",
      );
    }
    const mimes = [
      "video/mp4;codecs=avc1.42E01E",
      "video/mp4",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    const mimeType = mimes.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
    // captureStream(0) + requestFrame: gravamos EXATAMENTE os frames que
    // renderizamos — o loop do r3f não interfere mais na gravação.
    // Se o navegador não tiver requestFrame, caímos no modo automático.
    let stream = canvas.captureStream(0);
    let track = stream.getVideoTracks()[0] as MediaStreamTrack & {
      requestFrame?: () => void;
    };
    const manual = typeof track?.requestFrame === "function";
    if (!manual) {
      stream = canvas.captureStream(fps);
      track = stream.getVideoTracks()[0] as MediaStreamTrack & {
        requestFrame?: () => void;
      };
    }
    const rec = new MediaRecorder(stream, {      mimeType: mimeType || undefined,
      videoBitsPerSecond: Math.min(60_000_000, Math.max(15_000_000, w * h * fps * 0.3)),
    });
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };

    const base = fitCamera(session);
    const center = sceneCenter(session.scene);
    const baseOffset = new THREE.Vector3().subVectors(base.position, center);
    const tt = anim === "giro" ? beginTurntable(session.scene) : null;
    const done = new Promise<Blob>((resolve) => {
      rec.onstop = () =>
        resolve(new Blob(chunks, { type: mimeType || "video/webm" }));
    });

    rec.start(200);
    // PASSO FIXO por frame (t = i/(total-1)): a rotação avança SEMPRE o mesmo
    // ângulo por frame — uniforme mesmo se o render atrasar; a cadência de
    // relógio abaixo mantém os timestamps do gravador regulares.
    const total = Math.max(2, Math.round(duration * fps));
    const frameMs = 1000 / fps;
    const t0 = performance.now();
    try {
      for (let i = 0; i < total; i++) {
        await ensureContext(session);
        checkCancelled(extra.signal);
      const t = i / total;
        if (tt) applyTurntable(tt, videoAngle(t, extra));
        applyCameraPath(anim, t, base, baseOffset, center, (v) =>
          setMugOverride(session, { magicHeat: v }),
        );
        renderFrame(session, base);
        track.requestFrame?.();
        onProgress?.((i + 1) / total);
        // espera até o instante do PRÓXIMO frame — timestamps uniformes
        const waitMs = t0 + (i + 1) * frameMs - performance.now();
        if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
        else await new Promise((r) => setTimeout(r, 0)); // respira a UI
      }
      // deixa o último frame respirar
      await new Promise((r) => setTimeout(r, 220));
    } finally {
      endTurntable(tt);
      if (rec.state !== "inactive") rec.stop();
    }
    const blob = await done;
    const ext = (mimeType || "video/webm").includes("mp4") ? "mp4" : "webm";
    return {
      blob,
      filename: `mockup-caneca-${anim}-${h}p-${Date.now()}.${ext}`,
      mimeType: mimeType || "video/webm",
      width: w,
      height: h,
      engine: "mediarecorder",
    };
  } finally {
    endFrames(session);
  }
}

/* ---------------- GIF ---------------- */

export interface GifResult {
  blob: Blob;
  filename: string;
  width: number;
  height: number;
}

export async function exportGif(
  width: number,
  animOpts: AnimOpts,
): Promise<GifResult> {
  const { anim, duration, fps, onProgress } = animOpts;
  const isMagic = useMockupStore.getState().mug.variant === "magic";
  if (anim === "revelacao" && !isMagic) {
    throw new ExportError(
      "A animação de revelação só funciona na caneca mágica. Escolha outro movimento.",
    );
  }

  // supersampling 2× para GIF mais nítido
  const rw = Math.min(1280, width * 2);
  const rh = rw;
  const session: FrameSession = beginFrames(rw, rh, { transparent: false });
  try {
    const base = fitCamera(session);
    const center = sceneCenter(session.scene);
    const gif = GIFEncoder();
    const total = Math.max(4, Math.round(duration * fps));
    const baseOffset = new THREE.Vector3().subVectors(base.position, center);
    const tt = anim === "giro" ? beginTurntable(session.scene) : null;

    try {
      for (let i = 0; i < total; i++) {
        await ensureContext(session);
        const t = i / total; // loop perfeito: último frame ≠ primeiro
        if (tt) applyTurntable(tt, t * Math.PI * 2);
        applyCameraPath(anim, t, base, baseOffset, center, (v) =>
          setMugOverride(session, { magicHeat: v }),
        );
        renderFrame(session, base);
        const small = await captureFrame(session, width, width);
        const { data } = small
          .getContext("2d")!
          .getImageData(0, 0, width, width);
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        gif.writeFrame(index, width, width, {
          palette,
          delay: Math.round(1000 / fps),
          repeat: 0,
        });
        onProgress?.((i + 1) / total);
        // deixa a UI respirar
        if (i % 3 === 2) await new Promise((r) => setTimeout(r, 0));
      }
    } finally {
      endTurntable(tt);
    }
    gif.finish();
    const blob = new Blob([gif.bytes() as BlobPart], { type: "image/gif" });
    return {
      blob,
      filename: `mockup-caneca-${anim}-${width}px-${Date.now()}.gif`,
      width,
      height: width,
    };
  } finally {
    endFrames(session);
  }
}

export { detectWebCodecs };
