import type { CollisionIssue } from '@/types'

const STORAGE_KEY = 'fire_sprinkler_collision_issues'

export function loadIssuesFromStorage(): CollisionIssue[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Failed to load issues from localStorage:', e)
  }
  return []
}

export function saveIssuesToStorage(issues: CollisionIssue[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues))
  } catch (e) {
    console.error('Failed to save issues to localStorage:', e)
  }
}

export function clearIssuesStorage(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

export function convertElevation(value: number, fromUnit: 'mm' | 'm', toUnit: 'mm' | 'm'): number {
  if (fromUnit === toUnit) return value
  if (fromUnit === 'mm' && toUnit === 'm') return value / 1000
  if (fromUnit === 'm' && toUnit === 'mm') return value * 1000
  return value
}

export function formatElevation(value: number, unit: 'mm' | 'm'): string {
  if (unit === 'mm') {
    return `${value.toFixed(0)} mm`
  }
  return `${value.toFixed(3)} m`
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
