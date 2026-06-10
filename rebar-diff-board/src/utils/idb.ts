import { openDB, IDBPDatabase } from 'idb'
import type { RebarItem, ImportBatch, BadRow, ManualJudgment, FilterState } from '@/types'

const DB_NAME = 'rebar-diff-db'
const DB_VERSION = 1

let db: IDBPDatabase | null = null

export async function initDB(): Promise<IDBPDatabase> {
  if (db) return db

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('items')) {
        const store = db.createObjectStore('items', { keyPath: 'id' })
        store.createIndex('batchId', 'batchId')
        store.createIndex('building', 'building')
        store.createIndex('component', 'component')
        store.createIndex('status', 'status')
      }

      if (!db.objectStoreNames.contains('batches')) {
        const batchStore = db.createObjectStore('batches', { keyPath: 'id' })
        batchStore.createIndex('fingerprint', 'fingerprint')
      }

      if (!db.objectStoreNames.contains('badRows')) {
        const badStore = db.createObjectStore('badRows', { keyPath: 'id' })
        badStore.createIndex('batchId', 'batchId')
      }

      if (!db.objectStoreNames.contains('judgments')) {
        const judgeStore = db.createObjectStore('judgments', { keyPath: 'id' })
        judgeStore.createIndex('itemId', 'itemId')
      }
    }
  })

  return db
}

export async function getDB(): Promise<IDBPDatabase> {
  if (!db) return initDB()
  return db
}

export async function addItem(item: RebarItem): Promise<void> {
  const database = await getDB()
  await database.put('items', item)
}

export async function addItems(items: RebarItem[]): Promise<void> {
  const database = await getDB()
  const tx = database.transaction('items', 'readwrite')
  for (const item of items) {
    tx.store.put(item)
  }
  await tx.done
}

export async function getAllItems(): Promise<RebarItem[]> {
  const database = await getDB()
  return database.getAll('items')
}

export async function getItemsByBatch(batchId: string): Promise<RebarItem[]> {
  const database = await getDB()
  return database.getAllFromIndex('items', 'batchId', batchId)
}

export async function clearItems(): Promise<void> {
  const database = await getDB()
  await database.clear('items')
}

export async function addBatch(batch: ImportBatch): Promise<void> {
  const database = await getDB()
  await database.put('batches', batch)
}

export async function getAllBatches(): Promise<ImportBatch[]> {
  const database = await getDB()
  return database.getAll('batches')
}

export async function getBatchByFingerprint(fingerprint: string): Promise<ImportBatch | undefined> {
  const database = await getDB()
  const results = await database.getAllFromIndex('batches', 'fingerprint', fingerprint)
  return results[0]
}

export async function addBadRows(rows: BadRow[]): Promise<void> {
  const database = await getDB()
  const tx = database.transaction('badRows', 'readwrite')
  for (const row of rows) {
    tx.store.put(row)
  }
  await tx.done
}

export async function getBadRowsByBatch(batchId: string): Promise<BadRow[]> {
  const database = await getDB()
  return database.getAllFromIndex('badRows', 'batchId', batchId)
}

export async function getAllBadRows(): Promise<BadRow[]> {
  const database = await getDB()
  return database.getAll('badRows')
}

export async function addJudgment(judgment: ManualJudgment): Promise<void> {
  const database = await getDB()
  await database.put('judgments', judgment)
}

export async function getJudgmentsByItem(itemId: string): Promise<ManualJudgment[]> {
  const database = await getDB()
  return database.getAllFromIndex('judgments', 'itemId', itemId)
}

export async function getAllJudgments(): Promise<ManualJudgment[]> {
  const database = await getDB()
  return database.getAll('judgments')
}

export async function clearAllData(): Promise<void> {
  const database = await getDB()
  const tx = database.transaction(['items', 'batches', 'badRows', 'judgments'], 'readwrite')
  await tx.objectStore('items').clear()
  await tx.objectStore('batches').clear()
  await tx.objectStore('badRows').clear()
  await tx.objectStore('judgments').clear()
  await tx.done
}

export function calculateFingerprint(rows: any[]): string {
  const sorted = [...rows].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  const str = sorted.map((r) => JSON.stringify(r)).join('|')
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `fp_${Math.abs(hash)}_${rows.length}`
}
