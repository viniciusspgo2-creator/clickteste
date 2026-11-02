/* ============================================================
   Projetos do Mockup Studio — persistência 100% no dispositivo
   via IndexedDB (estado + arte original + miniatura).
   ============================================================ */

import type {
  ArtState,
  BackgroundState,
  CameraState,
  CompanionMug,
  ExportState,
  FxState,
  GifState,
  LightState,
  MugState,
  VideoState,
  WatermarkState,
} from "../state/store";

export interface ProjectState {
  projectName: string;
  art: Omit<ArtState, "imageId"> & { imageId?: string | null };
  mug: MugState;
  light: LightState;
  bg: BackgroundState;
  camera: CameraState;
  exportSettings: ExportState;
  companions: CompanionMug[];
  layerOrder?: string[];
  fx: FxState;
  watermark: WatermarkState;
  video: VideoState;
  gif: GifState;
}

export interface ProjectArt {
  name: string;
  type: string;
  blob: Blob;
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
}

export interface StoredProject {
  id: string;
  name: string;
  updatedAt: number;
  thumbnail: string; // dataURL jpeg
  state: ProjectState;
  art: ProjectArt | null;
  /** imagem de fundo personalizada (cenários prontos não salvam blob) */
  bgImage?: ProjectArt | null;
  assets?: Record<string, ProjectArt>;
  environment?: { blob: Blob; name: string };
}

const DB_NAME = "mockup-studio";
const STORE = "projects";
const VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(req.error ?? new Error("IndexedDB indisponível"));
  });
  return dbPromise;
}

export async function listProjects(): Promise<StoredProject[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const list = (req.result as StoredProject[]).sort(
        (a, b) => b.updatedAt - a.updatedAt,
      );
      resolve(list);
    };
    req.onerror = () =>
      reject(req.error ?? new Error("Falha ao listar projetos"));
  });
}

export async function getProject(id: string): Promise<StoredProject | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as StoredProject) ?? null);
    req.onerror = () =>
      reject(req.error ?? new Error("Falha ao abrir projeto"));
  });
}

export async function putProject(project: StoredProject): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(project);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Falha ao salvar projeto"));
  });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("Falha ao excluir projeto"));
  });
}

/** codifica qualquer Blob de imagem como dataURL (para miniatura e restore) */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error ?? new Error("Falha ao ler o arquivo"));
    r.readAsDataURL(blob);
  });
}

export function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60000);
  if (min < 1) return "agora mesmo";
  if (min < 60) return `${min} min atrás`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h atrás`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} d atrás`;
  return new Date(ts).toLocaleDateString("pt-BR");
}
