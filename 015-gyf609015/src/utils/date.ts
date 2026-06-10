export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function nowISO(): string {
  return new Date().toISOString()
}

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function compareDate(a: string, b: string): number {
  return new Date(a).getTime() - new Date(b).getTime()
}

export function isDateBefore(a: string, b: string): boolean {
  return compareDate(a, b) < 0
}

export function isDateBetween(date: string, start: string, end: string): boolean {
  if (!start && !end) return true
  const t = new Date(date).getTime()
  if (start && t < new Date(start).getTime()) return false
  if (end && t > new Date(end + ' 23:59:59').getTime()) return false
  return true
}
