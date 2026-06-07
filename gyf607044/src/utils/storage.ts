import { openDB, type IDBPDatabase } from 'idb';

const LS_KEY = 'handover_records_v1';
const LS_DRAFT = 'handover_draft_v1';
const LS_FREEZER = 'handover_freezer_v1';
const LS_EXPORT_LOG = 'handover_export_log_v1';

const IDB_NAME = 'handover_db';
const IDB_VERSION = 1;
const STORE_PHOTOS = 'photos';

let db: IDBPDatabase | null = null;

async function getDb(): Promise<IDBPDatabase> {
  if (db) return db;
  db = await openDB(IDB_NAME, IDB_VERSION, {
    upgrade(d) {
      if (!d.objectStoreNames.contains(STORE_PHOTOS)) {
        d.createObjectStore(STORE_PHOTOS, { keyPath: 'id' });
      }
    },
  });
  return db;
}

export function safeLSGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeLSSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage write failed', e);
  }
}

export function loadRecordsFromLS<T>(): T[] {
  return safeLSGet<T[]>(LS_KEY, []);
}

export function saveRecordsToLS<T>(records: T[]): void {
  safeLSSet(LS_KEY, records);
}

export function loadDraftFromLS<T>(fallback: T): T {
  return safeLSGet<T>(LS_DRAFT, fallback);
}

export function saveDraftToLS<T>(draft: T): void {
  safeLSSet(LS_DRAFT, draft);
}

export function clearDraftLS(): void {
  try {
    localStorage.removeItem(LS_DRAFT);
  } catch {
    /* ignore */
  }
}

export function loadFreezerFromLS<T>(fallback: T): T {
  return safeLSGet<T>(LS_FREEZER, fallback);
}

export function saveFreezerToLS<T>(data: T): void {
  safeLSSet(LS_FREEZER, data);
}

export function loadExportLogsFromLS<T>(): T[] {
  return safeLSGet<T[]>(LS_EXPORT_LOG, []);
}

export function saveExportLogsToLS<T>(logs: T[]): void {
  safeLSSet(LS_EXPORT_LOG, logs);
}

export async function savePhotoToIDB(photo: {
  id: string;
  dataUrl: string;
}): Promise<void> {
  try {
    const d = await getDb();
    await d.put(STORE_PHOTOS, photo);
  } catch (e) {
    console.warn('idb save photo failed, fallback to ls', e);
  }
}

export async function getPhotoFromIDB(
  id: string
): Promise<string | null> {
  try {
    const d = await getDb();
    const r = (await d.get(STORE_PHOTOS, id)) as { dataUrl: string } | undefined;
    return r?.dataUrl ?? null;
  } catch {
    return null;
  }
}

export async function saveAllPhotosToIDB(
  photos: { id: string; dataUrl: string }[]
): Promise<void> {
  await Promise.all(photos.map((p) => savePhotoToIDB(p)));
}
