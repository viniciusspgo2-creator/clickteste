/* ============================================================
   Exportador em lote — várias câmeras e/ou variantes da caneca
   num único ZIP (fflate, armazenamento rápido).
   ============================================================ */

import { zipSync, type Zippable } from "fflate";
import { CAMERA_PRESETS } from "../lib/config";
import {
  beginFrames,
  captureFrame,
  endFrames,
  ExportError,
  fitCamera,
  renderFrame,
  sceneSphereRadius,
  setMugOverride,
} from "./frame-capture";
import * as THREE from "three";

export interface BatchOpts {
  /** ids de CAMERA_PRESETS ou 'atual' para a câmera corrente */
  angles: string[];
  /** overrides por variante (ex.: mágica fria/quente) */
  variants: {
    id: string;
    label: string;
    mug: Partial<import("../state/store").MugState>;
  }[];
  width: number;
  height: number;
  format: "png" | "jpeg";
  quality: number;
  transparent: boolean;
  onProgress?: (p: number) => void;
}

export interface BatchResult {
  blob: Blob;
  filename: string;
  count: number;
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function exportBatch(opts: BatchOpts): Promise<BatchResult> {
  if (!opts.angles.length || !opts.variants.length) {
    throw new ExportError("Escolha pelo menos um ângulo e uma variante.");
  }
  const session = beginFrames(opts.width, opts.height, {
    transparent: opts.transparent && opts.format === "png",
  });

  try {
    const files: Zippable = {};
    const ext = opts.format === "png" ? "png" : "jpg";
    const total = opts.angles.length * opts.variants.length;
    let done = 0;

    for (const angleId of opts.angles) {
      // câmera por ângulo — parte do enquadramento inteligente e aplica o preset
      let cam: THREE.PerspectiveCamera;
      if (angleId === "atual") {
        cam = fitCamera(session);
      } else {
        const preset = CAMERA_PRESETS.find((p) => p.id === angleId);
        if (!preset) continue;
        cam = fitCamera(session);
        const targetV = new THREE.Vector3(...preset.target);
        const presetPos = new THREE.Vector3(...preset.pos);
        const dir = presetPos.clone().sub(targetV).normalize();
        const vHalf = THREE.MathUtils.degToRad(cam.fov) / 2;
        const hHalf = Math.atan(Math.tan(vHalf) * cam.aspect);
        const fitDist =
          (sceneSphereRadius(session.scene) /
            Math.sin(Math.min(vHalf, hHalf))) *
          1.02;
        const dist = Math.max(presetPos.distanceTo(targetV), fitDist);
        cam.position.copy(targetV).addScaledVector(dir, dist);
        cam.lookAt(targetV);
        cam.updateMatrixWorld();
      }

      for (const variant of opts.variants) {
        setMugOverride(session, variant.mug);
        renderFrame(session, cam);
        const canvas = await captureFrame(
          session,
          opts.width,
          opts.height,
          opts.format === "jpeg" ? "#ffffff" : undefined,
        );
        const blob = await new Promise<Blob>((res, rej) =>
          canvas.toBlob(
            (b) => (b ? res(b) : rej(new ExportError("Falha ao codificar."))),
            opts.format === "png" ? "image/png" : "image/jpeg",
            opts.quality,
          ),
        );
        const u8 = new Uint8Array(await blob.arrayBuffer());
        const name = `mockup-${slug(angleId)}-${slug(variant.label)}-${opts.width}x${opts.height}.${ext}`;
        files[name] = u8;
        done++;
        opts.onProgress?.(done / total);
      }
    }

    if (!Object.keys(files).length)
      throw new ExportError("Nada para exportar.");
    const zipped = zipSync(files, { level: 0 });
    const blob = new Blob([zipped as BlobPart], { type: "application/zip" });
    return {
      blob,
      filename: `mockups-lote-${total}x-${Date.now()}.zip`,
      count: Object.keys(files).length,
    };
  } finally {
    endFrames(session);
  }
}

/* ---------------- variantes prontas ---------------- */

export function batchVariantsFor(mugVariant: string): BatchOpts["variants"] {
  if (mugVariant === "magic") {
    return [
      { id: "fria", label: "caneca fria", mug: { magicHeat: 0 } },
      { id: "quente", label: "caneca quente", mug: { magicHeat: 1 } },
    ];
  }
  return [{ id: "unica", label: "padrao", mug: {} }];
}
