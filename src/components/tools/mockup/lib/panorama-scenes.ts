import catalog from "./panorama-catalog.json";
import { registerEnvironment, getEnvironment } from "./environment-registry";
import { useMockupStore } from "../state/store";
export { catalog as PANORAMA_SCENES };
export type PanoramaScene = typeof catalog[number];
const cached = new Map<string, Promise<string>>();

export async function loadPanoramaEnvironment(scene: PanoramaScene, lightingOnly = false) {
  const key = scene.id + (lightingOnly ? ":light" : ":scene");
  let pending = cached.get(key);
  if (!pending) {
    pending = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(()=>controller.abort(),35_000);
      try {
        const response = await fetch(lightingOnly ? scene.lightHdr : scene.hdr, { signal:controller.signal });
        if (!response.ok) throw new Error("O ambiente não pôde ser carregado. Tente novamente.");
        const blob = await response.blob();
        if (controller.signal.aborted) throw new Error("O carregamento demorou. Verifique sua conexão.");
        return await registerEnvironment(blob, `Poly Haven · ${scene.label}`);
      } finally { clearTimeout(timer); }
    })();
    cached.set(key, pending);
    pending.catch(()=>{ if(cached.get(key)===pending)cached.delete(key); });
  }
  const id = await pending;
  if (!getEnvironment(id)) { cached.delete(key); throw new Error("Selecione o ambiente novamente."); }
  return id;
}
