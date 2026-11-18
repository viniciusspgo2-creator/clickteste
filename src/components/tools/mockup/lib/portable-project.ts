import { getEnvironment, registerEnvironment } from "./environment-registry";
import { useMockupStore } from "../state/store";
import { decodeArtDataUrl, getArtBlob, loadArtBlob } from "./art-registry";
import { getBgBlob, loadBgBlob, ensureScenes } from "./background-registry";
import { blobToDataUrl } from "./projects-db";
import { downloadBlob } from "../exporters/image-exporter";
/** Portable assets are embedded. No project data or artwork is sent to a server. */
export async function exportPortableProject() {
  const s = useMockupStore.getState();
  const ids = [s.art, ...s.companions.map((c) => c.art)]
    .filter(Boolean)
    .flatMap((a) => [a?.imageId, a?.decalImageId, a?.baseImageId])
    .filter(Boolean) as string[];
  const assets: Record<string, string> = {};
  for (const id of new Set(ids)) {
    const b = await getArtBlob(id);
    if (b) assets[id] = await blobToDataUrl(b);
  }
  const b = await getBgBlob(s.bg.imageId);
  const background = b ? await blobToDataUrl(b) : null;
  const env = getEnvironment(s.light.hdriId);
  const environment = env
    ? { name: env.name, data: await blobToDataUrl(env.blob) }
    : null;
  const state = {
    projectName: s.projectName,
    art: s.art,
    mug: s.mug,
    companions: s.companions,
    layerOrder: s.layerOrder,
    light: s.light,
    bg: s.bg,
    camera: s.camera,
    exportSettings: s.exportSettings,
    fx: s.fx,
    watermark: s.watermark,
    video: s.video,
    gif: s.gif,
  };
  downloadBlob(
    new Blob(
      [
        JSON.stringify({
          format: "clickgruda-studio",
          version: 1,
          state,
          assets,
          background,
          environment,
        }),
      ],
      { type: "application/json" },
    ),
    "meu-mockup.cgstudio",
  );
}
export async function importPortableProject(file: File) {
  if (file.size > 150 * 1024 * 1024)
    throw new Error("Projeto muito grande (máximo 150 MB).");
  const p = JSON.parse(await file.text());
  if (
    p.format !== "clickgruda-studio" ||
    p.version !== 1 ||
    !p.state?.art ||
    !p.state?.mug ||
    !Array.isArray(p.state.companions) ||
    p.state.companions.length > 7
  )
    throw new Error("Este arquivo não é um projeto compatível.");
  const remap: Record<string, string> = {};
  for (const [id, data] of Object.entries(p.assets ?? {})) {
    if (typeof data !== "string") throw new Error("Imagem inválida");
    const original = decodeArtDataUrl(data);
    const extension = original.type.split("/")[1].replace("svg+xml", "svg").replace("jpeg", "jpg");
    const e = await loadArtBlob(original, `arte.${extension}`);
    remap[id] = e.id;
  }
  if (p.environment?.data) {
    const data = p.environment.data;
    if (
      typeof data !== "string" ||
      !/^data:[a-zA-Z0-9/+.-]*;base64,/.test(data)
    )
      throw new Error("HDRI inválido.");
    const binary = atob(data.split(",")[1]);
    p.state.light.hdriId = await registerEnvironment(
      new Blob([Uint8Array.from(binary, (x) => x.charCodeAt(0))]),
      p.environment.name ?? "ambiente.hdr",
    );
  } else if (p.state.light) p.state.light.hdriId = null;
  for (const key of ["imageId", "decalImageId", "baseImageId"])
    p.state.art[key] = remap[p.state.art[key]] ?? null;
  p.state.companions = p.state.companions.map((c: any) => ({
    ...c,
    art: c.art
      ? {
          ...c.art,
          imageId: remap[c.art.imageId] ?? null,
          decalImageId: remap[c.art.decalImageId] ?? null,
          baseImageId: remap[c.art.baseImageId] ?? null,
        }
      : undefined,
  }));
  if (p.background) {
    const e = await loadBgBlob(decodeArtDataUrl(p.background), "fundo.png");
    p.state.bg.imageId = e.id;
  } else if (p.state.bg?.imageId?.startsWith("scene-"))
    ensureScenes(p.state.bg.imageId);
  else if (p.state.bg) p.state.bg.imageId = null;
  useMockupStore.getState().resetAll();
  useMockupStore.getState().hydrate(p.state);
  useMockupStore.getState().frameAll();
}
