/** Rascunho local do Editor Mockup 2D — autosave no navegador, nunca via API.
 *  Usa o mesmo IndexedDB do handoff Studio 3D (`cg-creative-local-v1`),
 *  mas com a chave `draft`, separada da transferência. Expira em 24 h.
 *  O handoff (?from=mockup) sempre tem prioridade: o rascunho só é
 *  oferecido quando o editor abre sem transferência do Studio 3D. */
const NAME = 'cg-creative-local-v1';
const STORE = 'handoff';
const KEY = 'draft';
const TTL_MS = 24 * 60 * 60 * 1000;

export type DraftLayer = {
  id: string;
  name: string;
  kind: 'mug' | 'logo';
  x: number;
  y: number;
  w: number;
  h: number;
  finish?: Record<string, number>;
  dataUrl: string;
};
export type DraftBg =
  | { kind: 'color'; value: string; label: string }
  | { kind: 'scene'; sceneId: string }
  | { kind: 'image'; label: string; dataUrl: string };
export type EditorDraft = {
  layers: DraftLayer[];
  bg: DraftBg;
  canvasSize: { w: number; h: number };
  guides: { id: string; orientation: 'h' | 'v'; pos: number }[];
  selectedIds: string[];
  savedAt: number;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDraft(draft: EditorDraft): Promise<void> {
  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ ...draft, savedAt: Date.now() }, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function readDraft(): Promise<EditorDraft | null> {
  const db = await openDB();
  try {
    const data = await new Promise<EditorDraft | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve((req.result as EditorDraft | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
    if (!data || !Number.isFinite(data.savedAt) || Date.now() - data.savedAt >= TTL_MS) return null;
    if (!Array.isArray(data.layers)) return null;
    return data;
  } finally {
    db.close();
  }
}

export async function clearDraft(): Promise<void> {
  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
