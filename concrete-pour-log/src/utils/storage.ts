const STORAGE_KEY = 'concrete-pour-records-v1'
const SETTINGS_KEY = 'concrete-pour-settings-v1'

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return defaultValue
    return JSON.parse(raw) as T
  } catch {
    return defaultValue
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('localStorage save error:', e)
  }
}

export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(SETTINGS_KEY)
}

export { STORAGE_KEY, SETTINGS_KEY }
