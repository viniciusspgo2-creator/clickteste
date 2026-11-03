import * as THREE from "three";
import type { MugState } from "../state/store";
import { DEFAULT_CERAMIC_FINISH } from "../lib/ceramic-finishes";

/** A dielectric glaze above the pigment, shared by body, handle and bottom. */
export const CERAMIC_PBR = {
  roughness: DEFAULT_CERAMIC_FINISH.roughness,
  metalness: 0,
  clearcoat: 1,
  clearcoatRoughness: DEFAULT_CERAMIC_FINISH.clearcoatRoughness!,
  reflectivity: 0.5,
  ior: 1.52,
  specularIntensity: DEFAULT_CERAMIC_FINISH.specularIntensity!,
} as const;

const finite = (value: number | undefined, fallback: number, max: number) =>
  THREE.MathUtils.clamp(Number.isFinite(value) ? value! : fallback, 0, max);

export function createCeramicMaterial(
  mug: Pick<MugState,
    | "roughness" | "clearcoat" | "reflection" | "faithfulColor"
    | "clearcoatRoughness" | "specularIntensity" | "glazeStrength"
  >,
  options: {
    color?: THREE.ColorRepresentation;
    map?: THREE.Texture;
    metalMask?: THREE.Texture;
  } = {},
): THREE.MeshPhysicalMaterial {
  const reflection = finite(mug.reflection, DEFAULT_CERAMIC_FINISH.reflection, 3);
  const faithful = mug.faithfulColor && !options.metalMask;
  const material = new THREE.MeshPhysicalMaterial({
    ...CERAMIC_PBR,
    color: new THREE.Color(options.color ?? "#ffffff"),
    specularColor: new THREE.Color(0xffffff),
    roughness: Math.max(0.01, finite(mug.roughness, CERAMIC_PBR.roughness, 1)),
    clearcoat: finite(mug.clearcoat, CERAMIC_PBR.clearcoat, 1),
    clearcoatRoughness: finite(mug.clearcoatRoughness, CERAMIC_PBR.clearcoatRoughness, 1),
    specularIntensity: finite(mug.specularIntensity, CERAMIC_PBR.specularIntensity, 1),
    envMapIntensity: reflection,
    map: options.map ?? null,
    metalness: options.metalMask ? 1 : 0,
    metalnessMap: options.metalMask ?? null,
    // Keep one output/exposure pipeline for faithful ink, physical materials
    // and EffectComposer. Disabling this silently disabled exposure controls.
    toneMapped: true,
  });

  material.onBeforeRender = (_renderer, scene) => {
    // Three r186 replaces a material's envMapIntensity with the scene value
    // when envMap is null. An explicit map lets BOTH controls work, including
    // zero reflections, while still following HDRI changes and environment gain.
    if (material.envMap !== scene.environment) {
      material.envMap = scene.environment;
      material.needsUpdate = true;
    }
    material.envMapRotation.copy(scene.environmentRotation);
    material.envMapIntensity = reflection * scene.environmentIntensity;
  };

  material.onBeforeCompile = (shader) => {
    shader.uniforms.ceramicGlazeStrength = {
      value: finite(mug.glazeStrength, DEFAULT_CERAMIC_FINISH.glazeStrength!, 3),
    };
    shader.fragmentShader =
      "uniform float ceramicGlazeStrength;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      `// Separate pigment from the dielectric reflection ABOVE it.
      vec3 ceramicDiffuseEnergy = totalDiffuse;
      #ifdef USE_CLEARCOAT
        ceramicDiffuseEnergy *= (1.0 - material.clearcoat * Fcc);
      #endif
      vec3 ceramicReflection = max(outgoingLight - ceramicDiffuseEnergy - totalEmissiveRadiance, vec3(0.0));
      ${faithful ? `// Neutral illumination protects the hue of the original ink. A soft
      // shoulder leaves highlight headroom even on pure white ceramic: the
      // old screen blend multiplied reflections by (1-white), erasing them.
      vec3 ceramicResponse = totalDiffuse / max(diffuseColor.rgb, vec3(0.0001));
      float ceramicShade = max(dot(ceramicResponse, vec3(0.2126, 0.7152, 0.0722)), 0.0);
      float ceramicDiffuseGain = 0.92 * ceramicShade / (ceramicShade + 0.22);
      vec3 ceramicBase = diffuseColor.rgb * ceramicDiffuseGain;` :
      "vec3 ceramicBase = ceramicDiffuseEnergy;"}
      // Add the real PBR highlights; do not screen-blend or bake them into art.
      // Renderer tone mapping handles HDR energy identically in preview/export.
      outgoingLight = ceramicBase + ceramicReflection * ceramicGlazeStrength + totalEmissiveRadiance;
      #include <opaque_fragment>`,
    );
  };
  material.customProgramCacheKey = () => `clickgruda-ceramic-v6-${faithful ? "faithful" : "physical"}`;
  return material;
}
