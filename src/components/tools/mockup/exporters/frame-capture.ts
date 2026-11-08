/* ============================================================
   Captura de frames offscreen — motor compartilhado por todos
   os exportadores (imagem, vídeo, GIF, ZIP e folha).
   Salva o estado do renderer, permite animar câmera/textura por
   frame, respeita pós-processamento e restaura tudo no fim.
   ============================================================ */

import * as THREE from "three";
import { renderBaseArt, baseExportSize } from "../lib/base-art-canvas";
import { getStudioPlan } from "../lib/entitlements";
import {
  mugsGroup,
  settleFloaters,
  studioRefs,
  visibleMugBounds,
} from "../scene/studio-refs";
import { alignBackdrop } from "../scene/bg-image";
import { isEditorOverlay } from "../scene/object-interaction";
import { useMockupStore, type MugState } from "../state/store";
import { renderArtCanvas, canvasHeightFor } from "../lib/art-canvas";
import { CANVAS_W_EXPORT, resolvePrintArea } from "../lib/config";

export class ExportError extends Error {}

export interface FrameOpts {
  width: number;
  height: number;
  transparent?: boolean;
  /** Only for export-to-editor: omit all floor/contact shadows while preserving ceramic shading. */
  hideGroundShadow?: boolean;
  /** overrides do estado da caneca p/ render da folha (lote de variantes) */
  mugOverride?: Partial<MugState>;
  /** desliga o supersampling (gravação em tempo real precisa ser leve) */
  noSupersample?: boolean;
  /** Troca apenas o cenário por branco durante esta captura. */
  whiteBackground?: boolean;
  /** teto do supersampling (vídeo usa 1,5: memória/GPU sob pressão) */
  ssCap?: number;
}

export interface FrameSession {
  gl: THREE.WebGLRenderer;
  scene: THREE.Scene;
  width: number;
  height: number;
  ssWidth: number;
  ssHeight: number;
  oldSize: THREE.Vector2;
  oldPR: number;
  oldBg: THREE.Color | THREE.Texture | null;
  oldClearColor: THREE.Color;
  oldClearAlpha: number;
  oldControlsEnabled?: boolean;
  oldRenderTarget: THREE.WebGLRenderTarget | null;
  oldViewport: THREE.Vector4;
  oldScissor: THREE.Vector4;
  oldScissorTest: boolean;
  oldAutoClear: boolean;
  oldOverrideMaterial: THREE.Material | null;
  textureSwaps: { material: THREE.MeshPhysicalMaterial; original: THREE.Texture; temporary: THREE.CanvasTexture }[];
  ended: boolean;
  usingWhite: boolean;
  tex: THREE.CanvasTexture | null;
  previewCanvas: HTMLCanvasElement | null; // canvas original de preview (restaurado no fim)
  artCanvas: HTMLCanvasElement | null;
  hidden: THREE.Object3D[];
  ground: THREE.Mesh | null;
  oldGroundMat: THREE.Material | undefined;
  shadowMat: THREE.ShadowMaterial | null;
  usingTransparent: boolean;
  usingFx: boolean;
  mugOverride: Partial<MugState>;
  lastRenderKey: string;
  baseTextures: { tex: THREE.CanvasTexture; preview: HTMLCanvasElement }[];
  companionTextures: {
    tex: THREE.CanvasTexture;
    preview: HTMLCanvasElement;
    canvas: HTMLCanvasElement;
    art: import("../state/store").ArtState;
    mug: MugState;
  }[];
}

export function detectWebCodecs(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof VideoEncoder !== "undefined" &&
    typeof VideoFrame !== "undefined"
  );
}

/** capacidade do H.264 no navegador (WebCodecs) */
export async function checkH264Support(
  width: number,
  height: number,
): Promise<boolean> {
  if (!detectWebCodecs()) return false;
  try {
    const configs = [
      {
        codec: "avc1.640033",
        width,
        height,
        framerate: 60,
        bitrate: 70_000_000,
      },
      {
        codec: "avc1.64002a",
        width,
        height,
        framerate: 60,
        bitrate: 24_000_000,
      },
      {
        codec: "avc1.640028",
        width,
        height,
        framerate: 30,
        bitrate: 12_000_000,
      },
      {
        codec: "avc1.4d0028",
        width,
        height,
        framerate: 30,
        bitrate: 12_000_000,
      },
      {
        codec: "avc1.42E01E",
        width,
        height,
        framerate: 30,
        bitrate: 12_000_000,
      },
    ];
    for (const cfg of configs) {
      const r = await VideoEncoder.isConfigSupported(cfg as VideoEncoderConfig);
      if (r.supported) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Prepara o renderer para renderizar frames offscreen de width×height.
 * Faz upgrade da textura da arte para 4096px e esconde fundo se transparente.
 */
export function beginFrames(
  width: number,
  height: number,
  opts: Omit<FrameOpts, "width" | "height"> = {},
): FrameSession {
  const { gl, scene } = studioRefs;
  if (studioRefs.exporting)
    throw new ExportError("Outra exportação está em andamento.");
  if (!gl || !scene)
    throw new ExportError(
      "Cena ainda não carregada. Aguarde um instante e tente de novo.",
    );
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1
  )
    throw new ExportError("Escolha uma largura e uma altura válidas.");
  if (gl.getContext().isContextLost())
    throw new ExportError(
      "O 3D está sendo restaurado. Aguarde e tente novamente.",
    );
  const context = gl.getContext();
  const maxBuffer = Math.min(
    gl.capabilities.maxTextureSize || 4096,
    Number(context.getParameter(context.MAX_RENDERBUFFER_SIZE)) || 4096,
    8192,
  );
  if (width > maxBuffer || height > maxBuffer)
    throw new ExportError(
      `Este dispositivo permite até ${maxBuffer} px por lado. Reduza o tamanho da imagem.`,
    );
  const mobile = /android|iphone|ipad|mobile/i.test(navigator.userAgent);
  const fx = useMockupStore.getState().fx;
  const usingFx = !opts.transparent && fx.enabled && !!studioRefs.composer;
  // 4× por eixo quando há memória; a saída mantém o tamanho escolhido.
  // Vídeo mantém seu próprio teto. Nunca aumentamos o buffer além da GPU.
  const ssCap = Math.max(1, Math.min(opts.ssCap ?? 2, usingFx ? 2 : 4));
  const pixelBudget = mobile ? 8_500_000 : usingFx ? 20_000_000 : 40_000_000;
  const ss = opts.noSupersample
    ? 1
    : Math.max(
        1,
        Math.min(
          ssCap,
          maxBuffer / width,
          maxBuffer / height,
          Math.sqrt(pixelBudget / (width * height)),
        ),
      );
  const session: FrameSession = {
    gl,
    scene,
    width,
    height,
    ssWidth: Math.floor(width * ss),
    ssHeight: Math.floor(height * ss),
    oldSize: gl.getSize(new THREE.Vector2()),
    oldPR: gl.getPixelRatio(),
    oldBg: scene.background,
    oldClearColor: gl.getClearColor(new THREE.Color()),
    oldClearAlpha: gl.getClearAlpha(),
    oldControlsEnabled: studioRefs.controls?.enabled,
    oldRenderTarget: gl.getRenderTarget(),
    oldViewport: gl.getViewport(new THREE.Vector4()),
    oldScissor: gl.getScissor(new THREE.Vector4()),
    oldScissorTest: gl.getScissorTest(),
    oldAutoClear: gl.autoClear,
    oldOverrideMaterial: scene.overrideMaterial,
    textureSwaps: [],
    ended: false,
    tex: null,
    previewCanvas: null,
    artCanvas: null,
    hidden: [],
    ground: scene.getObjectByName("ground") as THREE.Mesh | null,
    oldGroundMat: undefined,
    shadowMat: null,
    usingTransparent: !!opts.transparent,
    usingWhite: !!opts.whiteBackground && !opts.transparent,
    usingFx,
    mugOverride: opts.mugOverride ?? {},
    lastRenderKey: "",
    companionTextures: [],
    baseTextures: [],
  };
  studioRefs.exporting = true;
  studioRefs.exportTransparent = session.usingTransparent;
  if (studioRefs.controls) studioRefs.controls.enabled = false;
  try {
    const st = useMockupStore.getState();
    const group = mugsGroup(scene);
    const body = group?.getObjectByName("mug-body") as THREE.Mesh | undefined;
    const material = body?.material as THREE.MeshPhysicalMaterial | undefined;
    if (
      material?.map &&
      (material.map as THREE.CanvasTexture).isCanvasTexture
    ) {
      session.previewCanvas = material.map.image as HTMLCanvasElement;
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(
        gl.capabilities.maxTextureSize || 4096,
        width * height > 1920 * 1080 && !mobile ? 8192 : CANVAS_W_EXPORT,
      );
      canvas.height = canvasHeightFor(
        canvas.width,
        resolvePrintArea(st.art),
        st.mug.model,
      );
      renderWithOverride(canvas, session.mugOverride);
      session.artCanvas = canvas;
      session.tex = installExportTexture(session, material!, canvas);
    }
    group?.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.name !== "mug-body-comp") return;
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      const tex = mat.map as THREE.CanvasTexture;
      if (!tex?.isCanvasTexture) return;
      const companion = st.companions.find(
        (c) => c.id === mesh.userData.objectId,
      );
      if (!companion) return;
      const art = companion.showArt
        ? (companion.art ?? st.art)
        : { ...(companion.art ?? st.art), imageId: null, text: "" };
      const mug = { ...st.mug, ...companion } as MugState;
      const canvas = document.createElement("canvas");
      canvas.width =
        session.artCanvas?.width ??
        Math.min(gl.capabilities.maxTextureSize || 4096, CANVAS_W_EXPORT);
      canvas.height = canvasHeightFor(canvas.width, undefined, mug.model);
      renderArtCanvas(canvas, art, mug);
      const exportTexture = installExportTexture(session, mat, canvas);
      session.companionTextures.push({
        tex: exportTexture,
        preview: tex.image as HTMLCanvasElement,
        canvas,
        art,
        mug,
      });

    });
    const bases: THREE.Mesh[] = [];
    group?.traverse(o => { if (o.name === "mug-base-print" && o.visible) bases.push(o as THREE.Mesh); });
    const baseSide = baseExportSize(Math.max(width, height), gl.capabilities.maxTextureSize || 4096, bases.length, mobile);
    for (const mesh of bases) {
      const tex = (mesh.material as THREE.MeshPhysicalMaterial).map as THREE.CanvasTexture | null;
      if (!tex?.isCanvasTexture) continue;
      const companion = st.companions.find(c => c.id === mesh.userData.objectId);
      const art = companion?.art ?? st.art;
      const canvas = renderBaseArt(art, { ...st.mug, ...companion } as MugState, baseSide);
      if (!canvas) continue;
      const temporary = installExportTexture(session, mesh.material as THREE.MeshPhysicalMaterial, canvas);
      session.baseTextures.push({ tex: temporary, preview: tex.image as HTMLCanvasElement });
    }
    const hide = (o: THREE.Object3D | undefined) => {
      if (o?.visible) {
        o.visible = false;
        session.hidden.push(o);
      }
    };
    scene.traverse((o) => {
      if (isEditorOverlay(o)) hide(o);
    });
    settleFloaters(scene);
    if (opts.hideGroundShadow && session.usingTransparent) {
      // The editor applies its own shadow, adjusted for the destination background.
      // Only scene-contact shadows are hidden; light/shading on the ceramic remains.
      scene.traverse(o => {
        if (o.name === "ground" || o.name === "float-shadow" || o.name === "studio-contact-shadows") hide(o);
      });
    }
    if (session.usingTransparent || session.usingWhite) {
      scene.background = session.usingWhite ? new THREE.Color("#ffffff") : null;
      for (const name of ["backdrop", "glowboard", "bg-image", "environment-backdrop"])
        hide(scene.getObjectByName(name));
      if (session.usingTransparent) hide(scene.getObjectByName("pedestal"));
      if (
        session.ground &&
        !opts.hideGroundShadow &&
        !(session.ground.material instanceof THREE.ShadowMaterial)
      ) {
        session.oldGroundMat = session.ground.material as THREE.Material;
        session.shadowMat = new THREE.ShadowMaterial({
          transparent: true,
          opacity: 0.09,
        });
        session.ground.material = session.shadowMat;
      }
    }
    gl.setRenderTarget(null);
    gl.setScissorTest(false);
    scene.overrideMaterial = null;
    gl.setPixelRatio(1);
    gl.setSize(session.ssWidth, session.ssHeight, false);
    gl.setClearColor(
      session.usingWhite ? 0xffffff : 0x000000,
      session.usingTransparent ? 0 : 1,
    );
    return session;
  } catch (e) {
    endFrames(session);
    throw e;
  }
}

/** A different-sized canvas needs its own Source and GPU allocation. Never resize
 * the live texture's image: WebGL2 immutable storage may retain/reuse wrong pixels. */
function installExportTexture(session: FrameSession, material: THREE.MeshPhysicalMaterial, canvas: HTMLCanvasElement) {
  const original = material.map!;
  const temporary = new THREE.CanvasTexture(canvas);
  temporary.copy(original as THREE.CanvasTexture);
  temporary.source = new THREE.Source(canvas);
  temporary.needsUpdate = true;
  session.textureSwaps.push({ material, original, temporary });
  material.map = temporary;
  material.needsUpdate = true;
  return temporary;
}

/** renderiza a folha em alta resolução com overrides aplicados */
function renderWithOverride(
  canvas: HTMLCanvasElement,
  override: Partial<MugState>,
) {
  const { art, mug } = useMockupStore.getState();
  renderArtCanvas(canvas, art, { ...mug, ...override }, resolvePrintArea(art));
}

/** atualiza overrides da caneca (ex.: calor da mágica animando); re-renderiza só se mudou */
export function setMugOverride(
  session: FrameSession,
  override: Partial<MugState>,
) {
  session.mugOverride = override;
  if (!session.tex || !session.artCanvas) return;
  const key = JSON.stringify(override);
  if (key === session.lastRenderKey) return;
  session.lastRenderKey = key;
  renderWithOverride(session.artCanvas, override);
  session.tex.needsUpdate = true;
  for (const item of session.companionTextures) {
    renderArtCanvas(item.canvas, item.art, {
      ...item.mug,
      ...(item.mug.variant === "magic" ? override : {}),
    });
    item.tex.needsUpdate = true;
  }
}

/** câmera temporária com enquadramento inteligente das canecas */
export function fitCamera(session: FrameSession): THREE.PerspectiveCamera {
  const refCam = studioRefs.camera;
  if (!refCam) throw new ExportError("Câmera indisponível.");
  const bounds = visibleMugBounds(session.scene);
  if (bounds.isEmpty())
    throw new ExportError("Mostre pelo menos uma peça antes de exportar.");
  const center = sceneCenter(session.scene);

  const cam2 = refCam.clone();
  cam2.aspect = session.width / session.height;
  cam2.updateProjectionMatrix();
  // The optional close-up preserves the user's zoom and composition. Automatic
  // framing stays the default and protects the entire group from cropping.
  if (useMockupStore.getState().exportSettings.framing === "current") {
    cam2.updateMatrixWorld();
    return cam2;
  }

  const viewDir = new THREE.Vector3()
    .subVectors(center, refCam.position)
    .normalize();
  const vHalf = THREE.MathUtils.degToRad(cam2.getEffectiveFOV()) / 2;
  const hHalf = Math.atan(Math.tan(vHalf) * cam2.aspect);
  const fitDist =
    (sceneSphereRadius(session.scene) / Math.sin(Math.min(vHalf, hHalf))) *
    1.06;
  const dist = Math.max(refCam.position.distanceTo(center), fitDist);
  cam2.position.copy(center).addScaledVector(viewDir, -dist);
  cam2.lookAt(center);
  return cam2;
}

/**
 * centro do conjunto de canecas — calculado só com os CORPOS (sem a alça):
 * a alça salta para trás e deslocaria a órbita do vídeo, fazendo a caneca
 * "girar meio fora do centro".
 */
export function sceneCenter(scene: THREE.Scene): THREE.Vector3 {
  const group = mugsGroup(scene);
  if (!group) return new THREE.Vector3(0, 4.75, 0);
  const box = new THREE.Box3();
  let has = false;
  group.traverse((o) => {
    const m = o as THREE.Mesh;
    if (
      m.isMesh &&
      m.parent?.visible !== false &&
      m.visible &&
      (m.name === "mug-body" || m.name === "mug-body-comp")
    ) {
      m.updateWorldMatrix(true, false);
      const b = new THREE.Box3().setFromObject(m);
      if (b.isEmpty()) return;
      if (!has) {
        box.copy(b);
        has = true;
      } else {
        box.union(b);
      }
    }
  });
  if (!has) return new THREE.Vector3(0, 4.75, 0);
  return box.getBoundingSphere(new THREE.Sphere()).center;
}

/** raio do conjunto de canecas */
export function sceneSphereRadius(scene: THREE.Scene): number {
  const group = mugsGroup(scene);
  if (!group) return 6.2;
  const box = visibleMugBounds(scene);
  if (box.isEmpty()) return 6.2;
  const r = box.getBoundingSphere(new THREE.Sphere()).radius;
  return Math.max(6.2, r);
}

/** renderiza um frame (com pós-processamento se ativo) */
export function renderFrame(
  session: FrameSession,
  cam: THREE.PerspectiveCamera,
) {
  if (session.ended) throw new ExportError("A captura já foi encerrada.");
  session.gl.setRenderTarget(null);
  // fundo imagem acompanha a câmera que renderiza (encaixe por quadro)
  alignBackdrop(session.scene, cam);
  const composer = studioRefs.composer;
  const renderPass = studioRefs.renderPass;
  if (session.usingFx && composer && renderPass) {
    renderPass.camera = cam;
    composer.setPixelRatio(1);
    composer.setSize(session.ssWidth, session.ssHeight);
    composer.render();
  } else {
    session.gl.render(session.scene, cam);
  }
}

/** captura o framebuffer atual num canvas 2D com downscale + marca d'água */
export async function captureFrame(
  session: FrameSession,
  w?: number,
  h?: number,
  bgFill?: string,
): Promise<HTMLCanvasElement> {
  const outW = w ?? session.width;
  const outH = h ?? session.height;
  const dataUrl = session.gl.domElement.toDataURL("image/png");
  const img = new Image();
  img.src = dataUrl;
  await img.decode();

  const out = document.createElement("canvas");
  out.width = outW;
  out.height = outH;
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (bgFill) {
    ctx.fillStyle = bgFill;
    ctx.fillRect(0, 0, outW, outH);
  }
  ctx.drawImage(img, 0, 0, outW, outH);
  applyWatermark(ctx, outW, outH);
  return out;
}

/** marca d'água configurável (desenhada por cima do frame) */
export function applyWatermark(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
) {
  const policy = useMockupStore.getState().watermark;
  const wm =
    getStudioPlan() === "free"
      ? {
          ...policy,
          enabled: true,
          text: "Click&Gruda · Mockup Studio",
          opacity: 0.75,
        }
      : policy;
  if (!wm.enabled || !wm.text.trim()) return;
  const fs = Math.max(11, Math.round(W * wm.size));
  ctx.save();
  ctx.font = `700 ${fs}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
  ctx.globalAlpha = Math.max(0.05, Math.min(1, wm.opacity));
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = fs * 0.3;
  ctx.fillStyle = "#ffffff";
  const pad = Math.round(W * 0.026);
  const m = ctx.measureText(wm.text);
  const bottom = wm.position.startsWith("b");
  const right = wm.position.endsWith("r");
  ctx.textAlign = right ? "right" : "left";
  ctx.textBaseline = bottom ? "alphabetic" : "top";
  ctx.fillText(
    wm.text,
    right ? W - pad : pad,
    bottom ? H - pad * 0.6 : pad * 0.8,
  );
  ctx.restore();
}

/** restaura o estado completo do renderer */
export function endFrames(session: FrameSession) {
  const { gl, scene } = session;
  if (session.ended) return;
  session.ended = true;
  try {
    // Restore the original material maps first; temporary Sources never touch them.
    for (const { material, original, temporary } of session.textureSwaps) {
      if (material.map === temporary) { material.map = original; material.needsUpdate = true; }
      temporary.dispose();
    }
    session.textureSwaps = [];
    session.baseTextures = [];
    scene.overrideMaterial = session.oldOverrideMaterial;
    if (session.usingTransparent || session.usingWhite)
      scene.background = session.oldBg;
    for (const o of session.hidden) o.visible = true;
    if (session.ground && session.oldGroundMat)
      session.ground.material = session.oldGroundMat;
    session.shadowMat?.dispose();
    gl.setPixelRatio(session.oldPR);
    gl.setSize(session.oldSize.x, session.oldSize.y, false);
    gl.setClearColor(session.oldClearColor, session.oldClearAlpha);
    gl.autoClear = session.oldAutoClear;
    gl.setRenderTarget(session.oldRenderTarget);
    gl.setViewport(session.oldViewport);
    gl.setScissor(session.oldScissor);
    gl.setScissorTest(session.oldScissorTest);
    if (studioRefs.controls && session.oldControlsEnabled !== undefined)
      studioRefs.controls.enabled = session.oldControlsEnabled;
    const cam = studioRefs.camera;
    if (cam && studioRefs.renderPass) studioRefs.renderPass.camera = cam;
    if (session.usingFx && studioRefs.composer) {
      studioRefs.composer.setPixelRatio(session.oldPR);
      studioRefs.composer.setSize(session.oldSize.x, session.oldSize.y);
    }
    if (cam) {
      settleFloaters(scene);
      alignBackdrop(scene, cam);
      gl.render(scene, cam);
    }
  } finally {
    studioRefs.exporting = false;
    studioRefs.exportTransparent = false;
  }
}

/** dispara o download de um Blob no navegador */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
