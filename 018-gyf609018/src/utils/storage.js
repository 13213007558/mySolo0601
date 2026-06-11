const STORAGE_KEY = 'waterproof_test_records_v1'
const INIT_FLAG_KEY = 'waterproof_test_initialized_v1'

export function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    console.error('加载本地数据失败:', e)
    return null
  }
}

export function saveRecords(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (e) {
    console.error('保存本地数据失败:', e)
    return false
  }
}

export function clearRecords() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(INIT_FLAG_KEY)
}

export function isInitialized() {
  return localStorage.getItem(INIT_FLAG_KEY) === '1'
}

export function markInitialized() {
  localStorage.setItem(INIT_FLAG_KEY, '1')
}

export function generateId() {
  return 'rec_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
