import { openDB, type IDBPDatabase } from 'idb'
import type { InspectionRecord, PhotoAttachment } from '@/types'

const DB_NAME = 'scaffold-inspection-db'
const DB_VERSION = 1

const STORE_INSPECTIONS = 'inspections'
const STORE_PHOTOS = 'photos'
const STORE_SETTINGS = 'settings'

let db: IDBPDatabase<any> | null = null

export async function initDB(): Promise<IDBPDatabase<any>> {
  if (db) return db

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_INSPECTIONS)) {
        const store = db.createObjectStore(STORE_INSPECTIONS, { keyPath: 'id' })
        store.createIndex('by_building', 'building')
        store.createIndex('by_status', 'status')
        store.createIndex('by_team', 'responsibleTeam')
        store.createIndex('by_deadline', 'deadline')
        store.createIndex('by_created', 'createdAt')
      }
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
        const store = db.createObjectStore(STORE_PHOTOS, { keyPath: 'id' })
        store.createIndex('by_inspection', 'inspectionId')
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' })
      }
    }
  })

  return db
}

export async function getDB(): Promise<IDBPDatabase<any>> {
  if (!db) return initDB()
  return db
}

// inspections
export async function getAllInspections(): Promise<InspectionRecord[]> {
  const db = await getDB()
  const all = await db.getAll(STORE_INSPECTIONS)
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getInspection(id: string): Promise<InspectionRecord | undefined> {
  const db = await getDB()
  return db.get(STORE_INSPECTIONS, id)
}

export async function saveInspection(record: InspectionRecord): Promise<void> {
  const db = await getDB()
  await db.put(STORE_INSPECTIONS, record)
}

export async function deleteInspection(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_INSPECTIONS, id)
}

export async function clearAllInspections(): Promise<void> {
  const db = await getDB()
  await db.clear(STORE_INSPECTIONS)
  await db.clear(STORE_PHOTOS)
}

// photos
export async function savePhoto(photo: PhotoAttachment): Promise<void> {
  const db = await getDB()
  await db.put(STORE_PHOTOS, photo)
}

export async function getPhotosByInspection(inspectionId: string): Promise<PhotoAttachment[]> {
  const db = await getDB()
  const index = db.transaction(STORE_PHOTOS).store.index('by_inspection')
  return index.getAll(inspectionId)
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_PHOTOS, id)
}

// settings
export async function getSetting(key: string): Promise<any> {
  const db = await getDB()
  const result = await db.get(STORE_SETTINGS, key)
  return result?.value
}

export async function saveSetting(key: string, value: any): Promise<void> {
  const db = await getDB()
  await db.put(STORE_SETTINGS, { key, value })
}
