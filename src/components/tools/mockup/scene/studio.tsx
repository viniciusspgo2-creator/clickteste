/* ============================================================
   Estúdio: iluminação (Environment + Lightformers + luzes reais),
   fundos (branco puro, escuro, gradiente, cor, imagem, sem fundo),
   chão (contínuo / flutuante / pedestal / espelhado) e sombras que
   crescem junto com o grupo de canecas.
   ============================================================ */

"use client";

import { useEffect, useMemo, useRef, type ComponentProps } from "react";
import * as THREE from "three";
import {
  ContactShadows,
  Environment,
  Lightformer,
  MeshReflectorMaterial,
} from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { useMockupStore } from "../state/store";
import {
  FLOAT_LIFT,
  LIGHT_PRESETS,
  PEDESTAL_H,
  PLATE_H,
  detectMobile,
  groupFootprint,
  kelvinToRgb,
} from "../lib/config";
import { getEnvironment } from "../lib/environment-registry";
import { getBackgroundAvg } from "../lib/background-registry";
import {
  buildPedestalGeometry,
  buildRoundPlateGeometry,
  buildSquarePlateGeometry,
} from "./mug-geometry";
import { studioRefs } from "./studio-refs";
import { MUG_CONTACT_LAYER, sceneFootprint } from "./scene-layout";
import { createSoftboxTexture } from "./softbox";
import { projectedShadowPose } from "../lib/shadow-pose";

function configureContactCamera(group: THREE.Group | null) {
  group?.traverse(object => {
    if ((object as THREE.Camera).isCamera) object.layers.set(MUG_CONTACT_LAYER);
  });
}
function ContactPass(props: ComponentProps<typeof ContactShadows>) {
  const group = useRef<THREE.Group>(null);
  // ContactShadows builds its camera after the forwarded group ref is attached.
  // Configure the actual camera before either depth pass, including remounts.
  useFrame(() => configureContactCamera(group.current), -100);
  return <ContactShadows {...props} ref={group} />;
}

let rectAreaReady = false;
function ensureRectArea() {
  if (!rectAreaReady) {
    RectAreaLightUniformsLib.init();
    rectAreaReady = true;
  }
}

const rgbCss = ([r, g, b]: [number, number, number]) =>
  `rgb(${Math.round(Math.min(1, r / kelvinToRgb(6500)[0]) * 255)},${Math.round(Math.min(1, g / kelvinToRgb(6500)[1]) * 255)},${Math.round(Math.min(1, b / kelvinToRgb(6500)[2]) * 255)})`;

/* ---------------- Luzes ---------------- */

export function StudioLights() {
  const light = useMockupStore((s) => s.light);
  const castShadow = useMockupStore((s) => s.bg.castShadow);
  const bg = useMockupStore((s) => s.bg);
  const companions = useMockupStore((s) => s.companions);
  const mug = useMockupStore((s) => s.mug);
  const mugScale = mug.scale;
  const mobile = useMemo(() => detectMobile(), []);
  const preset =
    LIGHT_PRESETS.find((p) => p.id === light.preset) ?? LIGHT_PRESETS[0];
  ensureRectArea();

  // a câmera de sombra cresce junto com o grupo (nunca corta a sombra)
  const footprint = sceneFootprint(mug, companions);
  const extent = footprint.extent;
  const shadowTarget = useMemo(() => new THREE.Object3D(), []);
  const softbox = useMemo(() => createSoftboxTexture(), []);
  useEffect(() => () => softbox.dispose(), [softbox]);

  const keyPos = useMemo(() => {
    const [x, y, z] = preset.keyDir;
    const a = THREE.MathUtils.degToRad(light.rotation);
    return new THREE.Vector3(x, y, z).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      a,
    );
  }, [preset.keyDir, light.rotation]);

  const keyColor = useMemo(
    () => rgbCss(kelvinToRgb(preset.keyTemp + light.temperature)),
    [preset, light.temperature],
  );
  const fillColor = useMemo(
    () => rgbCss(kelvinToRgb(preset.fillTemp + light.temperature)),
    [preset, light.temperature],
  );
  const rimColor = useMemo(
    () => rgbCss(kelvinToRgb(preset.rimTemp + light.temperature)),
    [preset, light.temperature],
  );

  // "Combinar luz com o fundo": tinge o ambiente com a cor média da foto
  const matchAvg =
    bg.type === "image" && bg.matchLight ? getBackgroundAvg(bg.imageId) : null;

  // The PMREM capture must follow every control that affects the softboxes.
  const hdr = getEnvironment(light.hdriId)?.texture;
  const envKey = [preset.id, light.rotation, light.intensity, light.temperature,
    light.keyStrength ?? 1, light.fillStrength ?? 1, light.rimStrength ?? 1,
    light.softness].join(":");

  return (
    <>
      <primitive object={shadowTarget} position={[footprint.x, 0, footprint.z]} />
      <ambientLight
        intensity={(matchAvg ? 0.26 : 0.18) * (light.ambientStrength ?? 1)}
        color={matchAvg ? rgbCss(matchAvg) : "#ffffff"}
      />
      {/* luz chave com sombra suave */}
      <directionalLight
        position={[keyPos.x + footprint.x, keyPos.y, keyPos.z + footprint.z]}
        target={shadowTarget}
        intensity={
          preset.keyInt * light.intensity * 1.4 * (light.keyStrength ?? 1)
        }
        color={keyColor}
        castShadow={castShadow}
        shadow-mapSize-width={mobile ? 1024 : 2048}
        shadow-mapSize-height={mobile ? 1024 : 2048}
        shadow-radius={20 + light.softness * 80}
        shadow-blurSamples={12}
        shadow-bias={-0.000035}
        shadow-normalBias={0.007}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-extent, extent, extent, -extent, 0.1, Math.max(120, extent * 6)]}
        />
      </directionalLight>
      {/* preenchimento */}
      <directionalLight
        position={[keyPos.x * -0.9, 7, keyPos.z * 0.6]}
        intensity={
          preset.fillInt * light.intensity * 1.1 * (light.fillStrength ?? 1)
        }
        color={fillColor}
      />
      {/* recorte (rim) atrás */}
      <directionalLight
        position={[keyPos.x * 0.4, 9, keyPos.z * -1.4]}
        intensity={
          preset.rimInt * light.intensity * 0.8 * (light.rimStrength ?? 1)
        }
        color={rimColor}
      />
      {/* softbox retangular real — reflexo de janela na porcelana */}
      <rectAreaLight
        position={[keyPos.x * 0.7, 8.5, keyPos.z * 0.9 + 2]}
        width={3 + light.softness * 5}
        height={10}
        intensity={
          preset.keyInt * light.intensity * 0.7 * (light.keyStrength ?? 1)
        }
        color={keyColor}
        onUpdate={(self) => self.lookAt(0, 4.5, 0)}
      />

      {/* ambiente de estúdio procedural (softboxes refletem no verniz) */}
      {hdr ? (
        <Environment
          map={hdr}
          environmentIntensity={light.envIntensity * light.intensity}
          environmentRotation={[0, THREE.MathUtils.degToRad(light.rotation), 0]}
          background={false}
        />
      ) : (
        <Environment
          key={envKey}
          resolution={mobile ? 384 : 1024}
          frames={1}
          background={false}
          environmentIntensity={light.envIntensity}
        >
          <group
            rotation={[
              0,
              THREE.MathUtils.degToRad(light.rotation),
              0,
            ]}
          >
            {/* Faixa fotográfica vertical: torna o verniz legível sobre a arte. */}
            <Lightformer
              form="rect"
              map={softbox}
              intensity={1.7 * preset.env * light.intensity * (light.keyStrength ?? 1)}
              color="#ffffff"
              position={[-6, 1, 7]}
              scale={[2.4 + light.softness * 1.2, 7, 1]}
              target={[0, 0, 0]}
            />
            {/* softbox principal */}
            <Lightformer
              form="rect"
              map={softbox}
              intensity={2.2 * preset.env * light.intensity * (light.keyStrength ?? 1)}
              color={keyColor}
              position={[-4, 3, 7]}
              scale={[3.5 + light.softness * 3, 7, 1]}
              target={[0, 0, 0]}
            />
            {/* preenchedor vertical */}
            <Lightformer
              form="rect"
              map={softbox}
              intensity={1.1 * preset.env * light.intensity * (light.fillStrength ?? 1)}
              color={fillColor}
              position={[7, 0, 2]}
              scale={[4, 9, 1]}
              target={[0, 0, 0]}
            />
            {/* recorte traseiro */}
            <Lightformer
              form="rect"
              map={softbox}
              intensity={1.5 * preset.env * light.intensity * (light.rimStrength ?? 1)}
              color={rimColor}
              position={[-2, 3, -8]}
              scale={[10, 3, 1]}
              target={[0, 0, 0]}
            />
            {/* teto suave */}
            <Lightformer
              form="rect"
              intensity={1.1 * preset.env * light.intensity * (light.fillStrength ?? 1)}
              color="#ffffff"
              position={[0, 8, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              scale={[12, 12, 1]}
            />
            {/* faixa de chão clara (luz refletida) */}
            <Lightformer
              form="rect"
              intensity={0.45 * preset.env * light.intensity * (light.fillStrength ?? 1)}
              color="#ffffff"
              position={[0, -5, 4]}
              rotation={[-Math.PI / 2, 0, 0]}
              scale={[10, 8, 1]}
            />
          </group>
        </Environment>
      )}
    </>
  );
}

/* ---------------- Fundo ---------------- */

const backdropVert = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const backdropFrag = /* glsl */ `
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uDir;
  varying vec3 vPos;
  void main() {
    vec3 d = normalize(vPos);
    float t = clamp(dot(d, normalize(uDir)) * 0.5 + 0.5, 0.0, 1.0);
    t = smoothstep(0.08, 0.92, t);
    vec3 col = mix(uB, uA, t);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

/**
 * Converte hex para o espaço que o shader escreve direto no framebuffer
 * (sRGB) — SEM conversão para linear, senão o branco sai queimado/bege.
 */
function hexToVecRaw(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

export function Backdrop() {
  const bg = useMockupStore((s) => s.bg);

  const { uA, uB, uDir } = useMemo(() => {
    let a = "#ffffff";
    let b = "#ffffff";
    let dirAngleDeg = 90;
    if (bg.type === "studio-white") {
      // branco PURO de ponta a ponta (padrão)
      a = "#ffffff";
      b = "#ffffff";
      dirAngleDeg = 90;
    } else if (bg.type === "studio-dark") {
      a = "#2b2721";
      b = "#060505";
      dirAngleDeg = 90;
    } else if (bg.type === "gradient") {
      a = bg.colorA;
      b = bg.colorB;
      dirAngleDeg = bg.angle;
    } else if (bg.type === "solid") {
      a = bg.colorB;
      b = bg.colorB;
    }
    const aRad = THREE.MathUtils.degToRad(dirAngleDeg);
    const dir = new THREE.Vector3(
      Math.cos(aRad) * 0.45,
      1,
      Math.sin(aRad) * 0.45,
    ).normalize();
    return { uA: a, uB: b, uDir: dir };
  }, [bg]);

  const uniforms = {
    uA: { value: hexToVecRaw(uA) },
    uB: { value: hexToVecRaw(uB) },
    uDir: { value: uDir },
  };

  if (bg.type === "transparent" || bg.type === "image") return null;

  return (
    <>
      <mesh name="backdrop" scale={1800} renderOrder={-1000} frustumCulled={false}>
        <sphereGeometry args={[1, 48, 32]} />
        <shaderMaterial
          vertexShader={backdropVert}
          fragmentShader={backdropFrag}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      {(bg.type === "studio-dark" || bg.type === "solid") &&
      bg.glow === true ? (
        <GlowBoard />
      ) : null}
    </>
  );
}

/** brilho suave atrás da caneca — OPCIONAL (ligado no painel Cena) */
function GlowBoard() {
  const tex = useMemo(() => {
    const S = 256;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(S / 2, S / 2, 10, S / 2, S / 2, S / 2);
    g.addColorStop(0, "rgba(255,178,128,0.55)");
    g.addColorStop(0.45, "rgba(232,112,58,0.18)");
    g.addColorStop(1, "rgba(232,112,58,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh name="glowboard" position={[0, 6, -28]}>
      <planeGeometry args={[38, 26]} />
      <meshBasicMaterial
        map={tex}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ---------------- Chão + sombras ---------------- */

/** textura radial suave (usada na sombra difusa do modo flutuante) */
function makeBlobTexture(): THREE.CanvasTexture {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2);
  // White alpha mask, tinted by the selected shadow color; a small dense
  // footprint plus soft penumbra reads naturally on photographed tabletops.
  g.addColorStop(0, "rgba(255,255,255,0.90)");
  g.addColorStop(0.23, "rgba(255,255,255,0.72)");
  g.addColorStop(0.58, "rgba(255,255,255,0.25)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

/** sombra suave no ar (modo flutuante) — mais difusa e fraca quanto mais alta */
export function FloatShadows() {
  const floor = useMockupStore((s) => s.bg.floor);
  const contactEnabled = useMockupStore((s) => s.bg.contactShadow);
  const shadowOpacity = useMockupStore((s) => s.light.shadowOpacity);
  const shadowColor = useMockupStore((s) => s.light.shadowColor);
  const shadowShiftX = useMockupStore(s => s.light.shadowShiftX ?? 0);
  const shadowShiftZ = useMockupStore(s => s.light.shadowShiftZ ?? 0);
  const shadowSpread = useMockupStore(s => s.light.shadowSpread ?? 1);
  const companions = useMockupStore((s) => s.companions);
  const mug = useMockupStore((s) => s.mug);
  const mugPosY = mug.posY;
  const mugScale = useMockupStore((s) => s.mug.scale);
  const tex = useMemo(() => makeBlobTexture(), []);
  useEffect(() => () => tex.dispose(), [tex]);
  const floating = floor === "flutuante";
  if (!contactEnabled || (!floating && floor !== "continuo")) return null;

  const mugs = [
    {
      x: mug.posX ?? 0,
      z: mug.posZ ?? 0,
      id: "hero", hidden: mug.hidden,
      lift: (floating ? FLOAT_LIFT : 0) + mugPosY,
      scale: mugScale, tiltX:mug.tiltX??0, tiltZ:mug.tiltZ??0, rotationY:mug.rotationY??0,
    },
    ...companions
      .filter((c) => !c.hidden)
      .map((c) => ({ id: c.id, hidden: c.hidden, x: c.posX, z: c.posZ,
        lift: (floating ? FLOAT_LIFT : 0) + (c.posY ?? 0), scale: c.scale,
        tiltX:c.tiltX??0, tiltZ:c.tiltZ??0, rotationY:c.rotationY??0 })),
  ].filter(m => !m.hidden);

  return (
    <group name="float-shadow">
      {mugs.map((m) => {
        const soft = 1 + Math.max(0, m.lift) * 0.16;
        const pose = projectedShadowPose(m.tiltX, m.tiltZ, m.rotationY);
        const base = 11 * m.scale * soft * shadowSpread;
        const opacity = floating ? Math.max(0.1, (shadowOpacity ?? 0.44) / (1 + m.lift * 0.4))
          : Math.min(0.82, (shadowOpacity ?? 0.44) * 0.83) / (1 + Math.max(0, m.lift) * 0.35);
        return (
          <group key={m.id} name="mug-ground-shadow" userData={{ objectId: m.id }}
            position={[m.x + shadowShiftX, 0.02, m.z + shadowShiftZ]} rotation={[0, pose.angle, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[base * pose.stretch, base * pose.cross, 1]}>
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial
                map={tex} color={shadowColor ?? "#242424"} transparent opacity={opacity}
                depthWrite={false} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1}
              />
            </mesh>
            {/* Contato suave adicional sob a cerâmica, com mesma orientação
                da caneca. Pertence ao grupo ocultado na captura para o Editor. */}
            <mesh name="mug-contact-penumbra" rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0.005, 0]}
              scale={[base * pose.stretch * 0.47, base * pose.cross * 0.43, 1]}>
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial map={tex} color={shadowColor ?? "#242424"}
                transparent opacity={Math.min(0.25, opacity * 0.34 / (1 + Math.max(0, m.lift) * 0.25))}
                depthWrite={false} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-2} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** plano gigante que só recebe sombra — some contra o fundo em qualquer ângulo */
function ShadowCatcher() {
  const strength = useMockupStore(s => s.light.shadowOpacity ?? 0.44);
  return (
    <mesh
      name="ground"
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[800, 800]} />
      <shadowMaterial transparent opacity={Math.min(0.48, 0.10 + strength * 0.36)} />
    </mesh>
  );
}

/** pedestal redondo premium com bevel — acompanha o tamanho do grupo */
function Pedestal() {
  const companions = useMockupStore((s) => s.companions);
  const mugScale = useMockupStore((s) => s.mug.scale);
  const envIntensity = useMockupStore((s) => s.light.envIntensity);
  const radius = useMemo(
    () =>
      Math.min(30, Math.max(8.5, groupFootprint(companions, mugScale) - 0.6)),
    [companions, mugScale],
  );
  const geo = useMemo(
    () => buildPedestalGeometry(radius, PEDESTAL_H),
    [radius],
  );
  useEffect(() => () => geo.dispose(), [geo]);

  return (
    <group name="pedestal">
      <mesh geometry={geo} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#241c15"
          roughness={0.32}
          metalness={0.08}
          clearcoat={0.85}
          clearcoatRoughness={0.24}
          envMapIntensity={0.4 + envIntensity * 0.5}
        />
      </mesh>
      <ShadowCatcher />
    </group>
  );
}

/** prato redondo de cerâmica clara (base redonda) */
function RoundPlate() {
  const companions = useMockupStore((s) => s.companions);
  const mugScale = useMockupStore((s) => s.mug.scale);
  const envIntensity = useMockupStore((s) => s.light.envIntensity);
  const radius = useMemo(
    () =>
      Math.min(28, Math.max(7.4, groupFootprint(companions, mugScale) - 1.6)),
    [companions, mugScale],
  );
  const geo = useMemo(() => buildRoundPlateGeometry(radius, PLATE_H), [radius]);
  useEffect(() => () => geo.dispose(), [geo]);

  return (
    <group name="pedestal">
      <mesh geometry={geo} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#edeae4"
          roughness={0.28}
          metalness={0.02}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
          envMapIntensity={0.45 + envIntensity * 0.55}
        />
      </mesh>
      <ShadowCatcher />
    </group>
  );
}

/** placa quadrada com cantos arredondados (base quadrada — look premium) */
function SquarePlate() {
  const companions = useMockupStore((s) => s.companions);
  const mugScale = useMockupStore((s) => s.mug.scale);
  const envIntensity = useMockupStore((s) => s.light.envIntensity);
  const size = useMemo(
    () =>
      Math.min(
        52,
        Math.max(15, (groupFootprint(companions, mugScale) - 1.2) * 2),
      ),
    [companions, mugScale],
  );
  const geo = useMemo(() => buildSquarePlateGeometry(size, PLATE_H), [size]);
  useEffect(() => () => geo.dispose(), [geo]);

  return (
    <group name="pedestal">
      <mesh geometry={geo} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#e7e2da"
          roughness={0.3}
          metalness={0.03}
          clearcoat={0.75}
          clearcoatRoughness={0.22}
          envMapIntensity={0.45 + envIntensity * 0.55}
        />
      </mesh>
      <ShadowCatcher />
    </group>
  );
}

/** piso espelhado com reflexo suave (fallback leve no celular) */
function MirrorFloor() {
  const bg = useMockupStore((s) => s.bg);
  const mobile = useMemo(() => detectMobile(), []);
  const color = useMemo(() => {
    switch (bg.type) {
      case "studio-white":
        return "#f4f2ee";
      case "studio-dark":
        return "#100e0c";
      case "solid":
      case "gradient":
        return bg.colorB;
      default:
        return "#191715";
    }
  }, [bg]);

  return (
    <mesh
      name="ground"
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[90, 90]} />
      <MeshReflectorMaterial
        resolution={mobile ? 384 : 1024}
        blur={[mobile ? 200 : 320, mobile ? 60 : 100]}
        mixBlur={0.9}
        mixStrength={mobile ? 1.7 : 3}
        roughness={0.86}
        depthScale={1.1}
        minDepthThreshold={0.9}
        maxDepthThreshold={1.3}
        color={color}
        metalness={0.35}
        mirror={0.55}
      />
    </mesh>
  );
}

export function Ground() {
  const bg = useMockupStore((s) => s.bg);
  const floor = bg.floor ?? "continuo";

  if (floor === "flutuante") return null; // sombras ficam por conta do FloatShadows
  if (floor === "pedestal") return <Pedestal />;
  if (floor === "base-redonda") return <RoundPlate />;
  if (floor === "base-quadrada") return <SquarePlate />;
  if (floor === "espelhado") return <MirrorFloor />;

  // contínuo (padrão): só receptor de sombra — o fundo (branco puro,
  // gradiente, cor sólida ou imagem) aparece por trás sem nenhuma borda
  return <ShadowCatcher />;
}

export function StudioContactShadows() {
  const bg = useMockupStore((s) => s.bg);
  const softness = useMockupStore((s) => s.light.softness);
  const shadowOpacity = useMockupStore((s) => s.light.shadowOpacity);
  const shadowColor = useMockupStore((s) => s.light.shadowColor);
  const shadowShiftX = useMockupStore(s => s.light.shadowShiftX ?? 0);
  const shadowShiftZ = useMockupStore(s => s.light.shadowShiftZ ?? 0);
  const shadowSpread = useMockupStore(s => s.light.shadowSpread ?? 1);
  const companions = useMockupStore((s) => s.companions);
  const mug = useMockupStore((s) => s.mug);
  const mobile = useMemo(() => detectMobile(), []);
  const footprint = useMemo(() => sceneFootprint(mug, companions), [mug, companions]);
  const spread = useMockupStore(s => s.light.shadowSpread ?? 1);
  const shiftX = useMockupStore(s => s.light.shadowShiftX ?? 0);
  const shiftZ = useMockupStore(s => s.light.shadowShiftZ ?? 0);
  const contactScale = useMemo<[number, number]>(() => [footprint.width * spread, footprint.depth * spread], [footprint.width, footprint.depth, spread]);
  const floor = bg.floor ?? "continuo";
  if (!bg.contactShadow || floor === "flutuante") return null;
  const { x, z } = footprint;
  const topY =
    floor === "pedestal"
      ? PEDESTAL_H + 0.002
      : floor === "base-redonda" || floor === "base-quadrada"
        ? PLATE_H + 0.002
        : 0.002;
  return (
    <group name="studio-contact-shadows">
      <ContactPass
        position={[x + shiftX, topY + 0.006, z + shiftZ]}
        opacity={Math.min(1, (shadowOpacity ?? 0.44) * 1.05)}
        scale={contactScale}
        near={-0.05}
        blur={0.7 + softness * 0.6}
        far={0.8}
        resolution={mobile ? 384 : 1024}
        color={shadowColor ?? "#242424"}
        frames={Infinity}
      />
      <ContactPass
        position={[x + shiftX, topY + 0.003, z + shiftZ]}
        opacity={Math.min(1, (shadowOpacity ?? 0.44) * 0.75)}
        scale={contactScale}
        near={-0.05}
        blur={2.2 + softness * 2.4}
        far={4.2}
        resolution={mobile ? 384 : 1024}
        color={shadowColor ?? "#242424"}
        frames={Infinity}
      />
    </group>
  );
}

/* ---------------- util: tempo para animação de flutuar ---------------- */

/** fase estável por id (cada caneca sobe e desce fora de sincronia) */
export function floatPhaseFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000;
  return (h / 1000) * Math.PI * 2;
}

/** hook de referência mutável usada pelo mug.tsx para o sobe-e-desce */
export function useFloatClock() {
  const ref = useRef(0);
  useFrame(({ clock }) => {
    ref.current = clock.elapsedTime;
  });
  return ref;
}

/** reexpõe refs para o mug (evita import cíclico do studioRefs na cena) */
export { studioRefs };
