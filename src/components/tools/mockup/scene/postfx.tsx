/* ============================================================
   Pós-processamento — grading cinematográfico (LUTs), bloom,
   vinheta e granulado via EffectComposer do three.js.
   Montado somente quando fx.enabled (assumindo o render loop).
   ============================================================ */

"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { useMockupStore, type FxState } from "../state/store";
import { studioRefs } from "./studio-refs";

/* ---------------- LUT presets ---------------- */

export const FX_LUTS: {
  id: FxState["lut"];
  label: string;
  patch: Partial<FxState>;
}[] = [
  {
    id: "none",
    label: "Nenhum",
    patch: {
      contrast: 0,
      saturation: 0,
      temperature: 0,
      vignette: 0,
      bloom: 0,
      grain: 0,
    },
  },
  {
    id: "vivo",
    label: "Vivo",
    patch: {
      contrast: 0.12,
      saturation: 0.28,
      temperature: 0.04,
      vignette: 0.12,
      bloom: 0.12,
      grain: 0,
    },
  },
  {
    id: "quente",
    label: "Quente",
    patch: {
      contrast: 0.08,
      saturation: 0.16,
      temperature: 0.35,
      vignette: 0.2,
      bloom: 0.1,
      grain: 0.04,
    },
  },
  {
    id: "frio",
    label: "Frio",
    patch: {
      contrast: 0.1,
      saturation: 0.05,
      temperature: -0.35,
      vignette: 0.18,
      bloom: 0.08,
      grain: 0.04,
    },
  },
  {
    id: "cinema",
    label: "Cinema",
    patch: {
      contrast: 0.18,
      saturation: -0.12,
      temperature: -0.08,
      vignette: 0.35,
      bloom: 0.16,
      grain: 0.16,
    },
  },
  {
    id: "pb",
    label: "P&B",
    patch: {
      contrast: 0.2,
      saturation: -1,
      temperature: 0,
      vignette: 0.3,
      bloom: 0.1,
      grain: 0.18,
    },
  },
];

/* ---------------- shader de grading ---------------- */

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uContrast: { value: 0 },
    uSaturation: { value: 0 },
    uTemperature: { value: 0 },
    uVignette: { value: 0 },
    uGrain: { value: 0 },
    uTime: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uContrast;
    uniform float uSaturation;
    uniform float uTemperature;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uTime;
    varying vec2 vUv;

    // ruído barato estável por pixel/frame
    float hash(vec2 p) {
      return fract(sin(dot(p + uTime, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec4 c = texture2D(tDiffuse, vUv);

      // temperatura: desloca canais (quente puxa R/B para baixo, frio o contrário)
      float t = uTemperature;
      c.r *= 1.0 + t * 0.18;
      c.b *= 1.0 - t * 0.18;
      c.g *= 1.0 + abs(t) * 0.015;

      // contraste em torno do meio-tom linear
      c.rgb = (c.rgb - 0.18) * (1.0 + uContrast) + 0.18;

      // saturação (luma coerente com Rec.709)
      float luma = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      c.rgb = mix(vec3(luma), c.rgb, 1.0 + uSaturation);

      // vinheta elíptica suave
      vec2 d = vUv - 0.5;
      float vig = 1.0 - uVignette * smoothstep(0.28, 0.82, dot(d, d) * 2.4);
      c.rgb *= vig;

      // granulado de filme
      if (uGrain > 0.001) {
        float g = (hash(vUv * vec2(1920.0, 1080.0)) - 0.5) * uGrain * 0.22;
        c.rgb += g * (0.35 + 0.65 * (1.0 - luma));
      }

      gl_FragColor = max(c, 0.0);
    }
  `,
};

export function PostFX() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const fx = useMockupStore((s) => s.fx);

  const passes = useMemo(() => {
    const composer = new EffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(512, 512),
      0.35,
      0.55,
      1.0,
    );
    const gradePass = new ShaderPass(GradeShader);
    const outputPass = new OutputPass();
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(gradePass);
    composer.addPass(outputPass);
    return { composer, renderPass, bloomPass, gradePass };
  }, [gl, scene, camera]);

  // expõe para os exportadores
  useEffect(() => {
    studioRefs.composer = passes.composer;
    studioRefs.renderPass = passes.renderPass;
    studioRefs.gradePass = passes.gradePass;
    studioRefs.bloomPass = passes.bloomPass;
    return () => {
      studioRefs.composer = null;
      studioRefs.renderPass = null;
      studioRefs.gradePass = null;
      studioRefs.bloomPass = null;
    };
  }, [passes]);

  // resize com dpr real do canvas
  useEffect(() => {
    passes.composer.setPixelRatio(dpr);
    passes.composer.setSize(size.width, size.height);
  }, [passes, size.width, size.height, dpr]);

  // uniforms
  useEffect(() => {
    /* eslint-disable react-hooks/immutability */
    const u = passes.gradePass.uniforms;
    u.uContrast.value = fx.contrast;
    u.uSaturation.value = fx.saturation;
    u.uTemperature.value = fx.temperature;
    u.uVignette.value = fx.vignette;
    u.uGrain.value = fx.grain;
    // bloom em domínio HDR: só realces especulares (>1.0 linear) brilham,
    // fundos claros (~0.9) ficam de fora
    passes.bloomPass.strength = fx.bloom * 0.85;
    passes.bloomPass.radius = 0.55;
    passes.bloomPass.threshold = 1.0;
    passes.bloomPass.enabled = fx.bloom > 0.005;
    /* eslint-enable react-hooks/immutability */
  }, [
    passes,
    fx.contrast,
    fx.saturation,
    fx.temperature,
    fx.vignette,
    fx.grain,
    fx.bloom,
  ]);

  // assume o render loop (priority 1 desativa o render automático do R3F)
  useFrame((_, delta) => {
    if (studioRefs.exporting) return;
    // eslint-disable-next-line react-hooks/immutability
    passes.gradePass.uniforms.uTime.value += delta;
    // câmera pode ter sido trocada por animação — RenderPass usa studioRefs
    passes.composer.render(delta);
  }, 1);

  useEffect(
    () => () => {
      passes.composer.dispose();
    },
    [passes],
  );

  return null;
}
