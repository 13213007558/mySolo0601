const STORAGE_PREFIX = 'formwork-inspection-v1:'

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof localStorage === 'undefined') return defaultValue
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    if (!raw) return defaultValue
    return JSON.parse(raw) as T
  } catch (_e) {
    return defaultValue
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch (e) {
    console.error('storage save error:', e)
  }
}

export function clearStorage(key?: string): void {
  if (typeof localStorage === 'undefined') return
  if (key) {
    localStorage.removeItem(STORAGE_PREFIX + key)
  } else {
    Object.keys(localStorage)
      .filter(function (k) { return k.startsWith(STORAGE_PREFIX) })
      .forEach(function (k) { localStorage.removeItem(k) })
  }
}

export function fileToDataURL(file: File): Promise<string> {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader()
    reader.onload = function () { resolve(String(reader.result || '')) }
    reader.onerror = function () { reject(reader.error) }
    reader.readAsDataURL(file)
  })
}

export function compressDataUrl(dataUrl: string, maxWidth = 1200, quality = 0.8): Promise<string> {
  return new Promise(function (resolve) {
    const img = new Image()
    img.onload = function () {
      let width = img.width
      let height = img.height
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(dataUrl)
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = function () { resolve(dataUrl) }
    img.src = dataUrl
  })
}
