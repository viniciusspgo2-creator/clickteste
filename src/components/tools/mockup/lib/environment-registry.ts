import * as THREE from "three";
const entries = new Map<
  string,
  { blob: Blob; name: string; texture: THREE.DataTexture }
>();
let seq = 0;
export async function registerEnvironment(blob: Blob, name: string) {
  if (blob.size > 32 * 1024 * 1024)
    throw new Error("O HDRI deve ter no máximo 32 MB.");
  const { RGBELoader } =
    await import("three/examples/jsm/loaders/RGBELoader.js");
  let data: ReturnType<InstanceType<typeof RGBELoader>["parse"]>;
  try {
    data = new RGBELoader().parse(await blob.arrayBuffer());
  } catch {
    throw new Error("HDRI inválido. Use um arquivo Radiance .hdr.");
  }
  if (!data || !data.width || !data.height || data.width > 8192)
    throw new Error("Use um HDRI de até 8192 pixels de largura.");
  const texture = new THREE.DataTexture(
    data.data,
    data.width,
    data.height,
    THREE.RGBAFormat,
    data.type,
  );
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.LinearSRGBColorSpace;
  texture.needsUpdate = true;
  const id = `hdri-${Date.now()}-${++seq}`;
  entries.set(id, { blob, name, texture });
  return id;
}
export const getEnvironment = (id?: string | null) =>
  id ? entries.get(id) : undefined;
