import dayjs from 'dayjs'
import type {
  InspectionRecord,
  InspectionStatus,
  ScaffoldType,
  ProblemLevel,
  FilterState,
  PhotoAttachment
} from '@/types'

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

export function getNowString(): string {
  return dayjs().format('YYYY-MM-DD HH:mm:ss')
}

export function formatDate(ts: string): string {
  if (!ts) return '-'
  return dayjs(ts).format('YYYY-MM-DD')
}

export function formatDateTime(ts: string): string {
  if (!ts) return '-'
  return dayjs(ts).format('YYYY-MM-DD HH:mm')
}

export function formatTime(ts: string): string {
  if (!ts) return '-'
  return dayjs(ts).format('MM-DD HH:mm')
}

export function isOverdue(deadline: string, status: InspectionStatus): boolean {
  if (!deadline) return false
  if (status === 'passed' || status === 'closed') return false
  return dayjs(deadline).isBefore(dayjs(), 'day')
}

export function daysOverdue(deadline: string): number {
  if (!deadline) return 0
  return dayjs().diff(dayjs(deadline), 'day')
}

export function daysUntilDeadline(deadline: string): number {
  if (!deadline) return 0
  return dayjs(deadline).diff(dayjs(), 'day')
}

export interface ValidationResult {
  canPass: boolean
  reasons: string[]
}

export function validateForPass(record: InspectionRecord): ValidationResult {
  const reasons: string[] = []

  if (record.status !== 'rechecking' && record.status !== 'rectifying') {
    reasons.push('当前状态不允许直接通过')
  }

  const hasAfterPhoto = record.photos.some((p) => p.phase === 'after' || p.phase === 'recheck')
  if (!hasAfterPhoto) {
    reasons.push('缺少整改后照片')
  }

  if (record.returnCount >= 2) {
    reasons.push(`已退回 ${record.returnCount} 次，需特别注意`)
  }

  return {
    canPass: reasons.length === 0,
    reasons
  }
}

export function detectRepeatProblems(records: InspectionRecord[]): Array<{ key: string; ids: string[]; count: number }> {
  const map = new Map<string, string[]>()

  records.forEach((r) => {
    const key = `${r.building}|${r.floor}|${r.scaffoldType}|${r.problemTitle}`
    const list = map.get(key) || []
    list.push(r.id)
    map.set(key, list)
  })

  const result: Array<{ key: string; ids: string[]; count: number }> = []
  map.forEach((ids, key) => {
    if (ids.length > 1) {
      result.push({ key, ids, count: ids.length })
    }
  })
  return result
}

export function filterRecords(records: InspectionRecord[], filter: Partial<FilterState>): InspectionRecord[] {
  return records.filter((r) => {
    if (filter.status && filter.status.length > 0 && !filter.status.includes(r.status)) return false
    if (filter.scaffoldType && filter.scaffoldType.length > 0 && !filter.scaffoldType.includes(r.scaffoldType)) return false
    if (filter.building && r.building !== filter.building) return false
    if (filter.problemLevel && filter.problemLevel.length > 0 && !filter.problemLevel.includes(r.problemLevel)) return false
    if (filter.team && r.responsibleTeam !== filter.team) return false
    if (filter.onlyOverdue && !isOverdue(r.deadline, r.status)) return false
    if (filter.onlyNoPhoto) {
      const hasPhoto = r.photos.length > 0
      if (hasPhoto) return false
    }
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase()
      const hay = `${r.code} ${r.building} ${r.floor} ${r.location} ${r.problemTitle} ${r.problemDescription} ${r.responsibleTeam} ${r.foreman}`.toLowerCase()
      if (!hay.includes(kw)) return false
    }
    return true
  })
}

export function calcStats(records: InspectionRecord[]) {
  const total = records.length
  const found = records.filter((r) => r.status === 'found').length
  const rectifying = records.filter((r) => r.status === 'rectifying').length
  const rechecking = records.filter((r) => r.status === 'rechecking').length
  const passed = records.filter((r) => r.status === 'passed' || r.status === 'closed').length
  const returned = records.filter((r) => r.status === 'returned').length
  const overdue = records.filter((r) => isOverdue(r.deadline, r.status)).length
  const noPhoto = records.filter((r) => r.photos.length === 0).length

  const repeatSet = new Set(
    detectRepeatProblems(records).flatMap((d) => d.ids)
  )
  const repeatCount = repeatSet.size

  const closeRate = total === 0 ? 0 : Math.round((passed / total) * 1000) / 10

  return {
    total,
    found,
    rectifying,
    rechecking,
    passed,
    returned,
    overdue,
    noPhoto,
    repeatCount,
    closeRate
  }
}

export function groupByBuilding(records: InspectionRecord[]): Record<string, InspectionRecord[]> {
  const groups: Record<string, InspectionRecord[]> = {}
  records.forEach((r) => {
    if (!groups[r.building]) groups[r.building] = []
    groups[r.building].push(r)
  })
  return groups
}

export function groupByTeam(records: InspectionRecord[]): Record<string, InspectionRecord[]> {
  const groups: Record<string, InspectionRecord[]> = {}
  records.forEach((r) => {
    if (!groups[r.responsibleTeam]) groups[r.responsibleTeam] = []
    groups[r.responsibleTeam].push(r)
  })
  return groups
}

export function downloadCSV(filename: string, rows: Array<Record<string, string | number>>, headers: Array<{ key: string; label: string }>) {
  const headerLine = headers.map((h) => h.label).join(',')
  const lines = rows.map((row) =>
    headers.map((h) => {
      const val = row[h.key] ?? ''
      const s = String(val).replace(/"/g, '""')
      return `"${s}"`
    }).join(',')
  )
  const csv = '\uFEFF' + [headerLine, ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function buildWeeklyReportRows(records: InspectionRecord[]): Array<Record<string, string | number>> {
  const result: Array<Record<string, string | number>> = []
  const byBuilding = groupByBuilding(records)

  Object.entries(byBuilding).forEach(([building, buildingRecords]) => {
    const byTeam = groupByTeam(buildingRecords)
    Object.entries(byTeam).forEach(([team, teamRecords]) => {
      const stats = calcStats(teamRecords)
      result.push({
        building,
        team,
        total: stats.total,
        found: stats.found,
        rectifying: stats.rectifying,
        rechecking: stats.rechecking,
        passed: stats.passed,
        returned: stats.returned,
        overdue: stats.overdue,
        closeRate: stats.closeRate + '%'
      })
    })
  })

  return result
}

export const WEEKLY_REPORT_HEADERS = [
  { key: 'building', label: '楼栋' },
  { key: 'team', label: '责任班组' },
  { key: 'total', label: '总问题数' },
  { key: 'found', label: '待整改' },
  { key: 'rectifying', label: '整改中' },
  { key: 'rechecking', label: '待复查' },
  { key: 'passed', label: '已通过' },
  { key: 'returned', label: '已退回' },
  { key: 'overdue', label: '逾期' },
  { key: 'closeRate', label: '闭环率' }
]

export function buildDetailExportRows(records: InspectionRecord[]): Array<Record<string, string | number>> {
  return records.map((r) => ({
    code: r.code,
    building: r.building,
    floor: r.floor,
    location: r.location,
    type: r.scaffoldTypeLabel,
    level: ({ critical: '重大', major: '较大', minor: '一般' } as any)[r.problemLevel],
    title: r.problemTitle,
    description: r.problemDescription,
    status: ({ found: '问题发现', rectifying: '整改中', rechecking: '待复查', passed: '复查通过', returned: '退回重改', closed: '已闭环' } as any)[r.status],
    team: r.responsibleTeam,
    foreman: r.foreman,
    deadline: formatDate(r.deadline),
    overdue: isOverdue(r.deadline, r.status) ? '是' : '否',
    foundAt: formatDateTime(r.foundAt),
    foundBy: r.foundBy,
    photoCount: r.photos.length,
    returnCount: r.returnCount,
    recheckNote: r.recheckNote || ''
  }))
}

export const DETAIL_EXPORT_HEADERS = [
  { key: 'code', label: '编号' },
  { key: 'building', label: '楼栋' },
  { key: 'floor', label: '楼层' },
  { key: 'location', label: '位置' },
  { key: 'type', label: '脚手架类型' },
  { key: 'level', label: '严重等级' },
  { key: 'title', label: '问题标题' },
  { key: 'description', label: '问题描述' },
  { key: 'status', label: '状态' },
  { key: 'team', label: '责任班组' },
  { key: 'foreman', label: '架子工长' },
  { key: 'deadline', label: '整改期限' },
  { key: 'overdue', label: '是否逾期' },
  { key: 'foundAt', label: '发现时间' },
  { key: 'foundBy', label: '发现人' },
  { key: 'photoCount', label: '照片数' },
  { key: 'returnCount', label: '退回次数' },
  { key: 'recheckNote', label: '复查意见' }
]

export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function compressDataUrl(dataUrl: string, maxWidth = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}
