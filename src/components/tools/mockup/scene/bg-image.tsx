/* ============================================================
   Fundo com IMAGEM do usuário — fixo na tela (não gira quando a
   câmera orbita), como uma foto de estúdio. Implementado como um
   quad na raiz da cena, realinhado à câmera ativa a cada render
   (preview, imagem, vídeo, GIF, lote). O cenário aparece
   ENQUADRADO — um quadro com o aspecto da saída selecionada,
   centralizado, com margem e borda visível — igual ao slot do
   Editor 2D. O encaixe é calculado contra o quadro, não contra a
   viewport. Na exportação o quadro preenche o canvas (fill 1),
   então a exportação é exatamente a composição. Layer própria:
   não aparece em reflexos do piso.
   ============================================================ */

"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useMockupStore } from "../state/store";
import { studioRefs } from "./studio-refs";
import { getBackgroundImage } from "../lib/background-registry";
import { EXPORT_RATIOS } from "../lib/config";

/** Fração da viewport ocupada pelo quadro do cenário (0.86 na prévia; 1 na exportação, que é o próprio quadro). */
export const FRAME_FILL = 0.86;
/** Raio aproximado da caneca com alça (mesmo valor usado pela câmera). */
export const FRAME_MUG_RADIUS = 7.6;

/** Aspecto (w/h) do quadro de composição = aspecto da saída selecionada. */
export function getFrameAspect(): number {
  const es = useMockupStore.getState().exportSettings;
  const ratio = EXPORT_RATIOS.find((r) => r.id === es.ratioId);
  if (ratio) return ratio.w / ratio.h;
  if (es.customW > 0 && es.customH > 0) return es.customW / es.customH;
  return 1;
}

export interface FrameNdc {
  /** metade da altura do quadro em NDC */
  fh: number;
  /** metade da largura do quadro em NDC */
  fw: number;
  /** aspecto do quadro (w/h) */
  fa: number;
}

/** Limites do quadro do cenário em NDC, ou null sem cenário enquadrado. */
export function frameNdcBounds(camera: THREE.PerspectiveCamera): FrameNdc | null {
  const st = useMockupStore.getState();
  if (st.bg.type !== "image" || !st.bg.imageId || !getBackgroundImage(st.bg.imageId)) return null;
  const fa = getFrameAspect();
  const fill = studioRefs.exporting ? 1 : FRAME_FILL;
  const aspect = camera.aspect || 1;
  const fh = Math.min(fill, (fill * aspect) / fa);
  const fw = (fh * fa) / aspect;
  return { fh, fw, fa };
}

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const frag = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uFrameAspect; // aspecto do quadro (w/h)
  uniform float uImgAspect;   // aspecto da imagem (w/h)
  uniform int uFit;           // 0=cobrir 1=conter 2=esticar
  uniform float uZoom;
  uniform vec2 uOffset;
  uniform float uRot;
  uniform float uMirror;
  uniform float uBlur;
  uniform float uBright;
  uniform float uContrast;
  uniform float uVignette;
  uniform vec2 uTexel;
  varying vec2 vUv;

  vec2 toUv(vec2 p) {
    // p: -0.5..0.5 no quadro com x pré-escalado (espaço quadrado)
    float ia = uImgAspect;
    float fa = uFrameAspect;
    if(uFit==2)return vec2(p.x/fa,p.y)/uZoom+0.5+uOffset;
    float scale=(uFit==0)?max(fa/ia,1.0):min(fa/ia,1.0);
    return vec2(p.x/(ia*scale),p.y/scale)/uZoom+0.5+uOffset;
  }

  void main() {
    vec2 p = vUv - 0.5;
    p.x *= uFrameAspect;
    float c = cos(uRot);
    float s = sin(uRot);
    p = mat2(c, -s, s, c) * p;
    if (uMirror > 0.5) p.x = -p.x;

    vec3 col;
    if (uBlur > 0.05) {
      // desfoque barato: centro + 8 amostras em círculo
      vec2 px = uTexel * uBlur;
      col = texture2D(uMap, toUv(p)).rgb * 2.0;
      float total = 2.0;
      for (int i = 0; i < 8; i++) {
        float a = float(i) * 0.7853981634;
        vec2 off = vec2(cos(a), sin(a)) * px;
        col += texture2D(uMap, toUv(p + off)).rgb;
        total += 1.0;
      }
      col /= total;
    } else {
      col = texture2D(uMap, toUv(p)).rgb;
    }

    col=(col-0.18)*(1.0+uContrast)+0.18;
    col*=1.0-uVignette*smoothstep(0.18,0.72,length(vUv-0.5));
    gl_FragColor = vec4(max(col * uBright,0.0), 1.0);
    #include <colorspace_fragment>
  }
`;

const _dir = new THREE.Vector3();
const _quat = new THREE.Quaternion();

/** Alinha o quadro do cenário com a câmera que vai renderizar o frame.
 * O cenário NÃO cobre mais a viewport inteira: ele é um quadro com o
 * aspecto da saída selecionada, centralizado e com margem — igual ao slot
 * do Editor 2D. Na exportação o quadro preenche o canvas (fill 1), então
 * a exportação é exatamente a composição. A borda escura (bg-frame-border)
 * marca os limites do quadro na prévia. O tamanho do quadro leva em conta
 * o zoom da câmera, para ficar estável na tela. */
export function alignBackdrop(
  scene: THREE.Scene,
  cam: THREE.PerspectiveCamera,
): void {
  const mesh = scene.getObjectByName("bg-image") as THREE.Mesh | null;
  if (!mesh) return;
  const border = scene.getObjectByName("bg-frame-border") as THREE.Mesh | null;
  cam.getWorldDirection(_dir);
  cam.getWorldQuaternion(_quat);
  const fa = getFrameAspect();
  const fill = studioRefs.exporting ? 1 : FRAME_FILL;
  const fovRad = (cam.fov * Math.PI) / 180;
  const tanV = Math.tan(fovRad / 2) / (cam.zoom || 1);
  let halfH = tanV * fill;
  let halfW = halfH * fa;
  const maxHalfW = tanV * fill * cam.aspect;
  if (halfW > maxHalfW) {
    halfW = maxHalfW;
    halfH = halfW / fa;
  }
  const place = (m: THREE.Mesh, dist: number, s: number) => {
    m.quaternion.copy(_quat);
    m.position.copy(cam.position).addScaledVector(_dir, dist);
    m.scale.set(halfW * 2 * s, halfH * 2 * s, 1);
  };
  place(mesh, 1, 1);
  if (border) place(border, 1.002, 1.03);
  const mat = mesh.material as THREE.ShaderMaterial;
  if (mat?.uniforms?.uFrameAspect) mat.uniforms.uFrameAspect.value = fa;
}

export function ImageBackdrop() {
  const bg = useMockupStore((s) => s.bg);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const scene = useThree((s) => s.scene);

  const entry = getBackgroundImage(bg.imageId);

  const texture = useMemo(() => {
    if (!entry) return null;
    // ImageBitmap ignores WebGL's flipY flag. Normalize every source to a
    // canvas so uploads, saved projects and bundled photos share orientation.
    const canvas = document.createElement("canvas");
    canvas.width = entry.width;
    canvas.height = entry.height;
    canvas.getContext("2d")!.drawImage(entry.source, 0, 0);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    return t;
    // Depende da entrada (não só do id): um cenário registrado depois
    // (restauração de projeto) precisa recriar a textura no re-render.
  }, [entry]);

  useEffect(() => () => texture?.dispose(), [texture]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uMap: { value: null },
          uFrameAspect: { value: 1 },
          uImgAspect: { value: 16 / 9 },
          uFit: { value: 0 },
          uZoom: { value: 1 },
          uOffset: { value: new THREE.Vector2(0, 0) },
          uRot: { value: 0 },
          uMirror: { value: 0 },
          uBlur: { value: 0 },
          uBright: { value: 1 },
          uContrast: { value: 0 },
          uVignette: { value: 0 },
          uTexel: { value: new THREE.Vector2(1 / 1920, 1 / 1080) },
        },
      }),
    [],
  );

  const mesh = useMemo(() => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    m.name = "bg-image";
    m.renderOrder = -999;
    m.frustumCulled = false;
    m.layers.set(1);
    m.visible = false;
    return m;
  }, [material]);

  /** Borda escura que marca os limites do quadro do cenário na prévia. */
  const border = useMemo(() => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: 0x171717, depthTest: false, depthWrite: false }),
    );
    m.name = "bg-frame-border";
    m.renderOrder = -1000;
    m.frustumCulled = false;
    m.layers.set(1);
    m.visible = false;
    return m;
  }, []);

  useEffect(() => {
    scene.add(mesh);
    scene.add(border);
    camera.layers.enable(1);
    return () => {
      scene.remove(mesh);
      scene.remove(border);
    };
  }, [scene, mesh, border, camera]);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      material.dispose();
      border.geometry.dispose();
      (border.material as THREE.Material).dispose();
    },
    [mesh, material, border],
  );

  // sincroniza uniforms com o estado
  useEffect(() => {
    const u = material.uniforms;
    // eslint-disable-next-line react-hooks/immutability -- material é um objeto three.js imutável por design
    u.uMap.value = texture;
    u.uImgAspect.value = entry ? entry.width / entry.height : 16 / 9;
    (u.uTexel.value as THREE.Vector2).set(
      1 / (entry?.width ?? 1920),
      1 / (entry?.height ?? 1080),
    );
    u.uFit.value =
      bg.imageFit === "cover" ? 0 : bg.imageFit === "contain" ? 1 : 2;
    u.uZoom.value = bg.imageZoom;
    (u.uOffset.value as THREE.Vector2).set(
      -bg.imageX * 0.45,
      -bg.imageY * 0.45,
    );
    u.uRot.value = (bg.imageRot * Math.PI) / 180;
    u.uMirror.value = bg.imageMirror ? 1 : 0;
    u.uBlur.value = bg.imageBlur;
    u.uBright.value = bg.imageBright;
    u.uContrast.value = bg.imageContrast ?? 0;
    u.uVignette.value = bg.imageVignette ?? 0;
  }, [material, texture, entry, bg]);

  useFrame(() => {
    if (studioRefs.exporting) return;
    // eslint-disable-next-line react-hooks/immutability -- mesh é um objeto three.js
    mesh.visible =
      !!texture && bg.type === "image" && !studioRefs.exportTransparent;
    border.visible = mesh.visible;
    if (mesh.visible) alignBackdrop(scene, camera);
  });

  return null;
}
