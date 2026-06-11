function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    expired: '已作废',
    mismatch: '坐标不匹配',
    over_limit: '超上限',
  }
  return map[status] || status
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: '#D4A017',
    confirmed: '#1B4332',
    expired: '#dc2626',
    mismatch: '#dc2626',
    over_limit: '#9ca3af',
  }
  return map[status] || '#9ca3af'
}
