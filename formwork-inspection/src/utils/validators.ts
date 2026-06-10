import dayjs from 'dayjs'
import type { Threshold, UnitType, CheckPoint, PointStatus } from '@/types'

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

export function getNowString(): string {
  return dayjs().format('YYYY-MM-DD HH:mm:ss')
}

export function formatTime(ts: string): string {
  if (!ts) return '-'
  return dayjs(ts).format('MM-DD HH:mm')
}

export function formatDateTime(ts: string): string {
  if (!ts) return '-'
  return dayjs(ts).format('YYYY-MM-DD HH:mm')
}

export interface ParsedMeasure {
  numeric: number | null
  unit: UnitType | null
  display: string
  warning?: 'unit_mismatch' | 'invalid' | 'empty' | 'mixed' | 'empty_value'
}

export function parseMeasuredValue(raw: string | undefined | null, requiredUnit: UnitType): ParsedMeasure {
  if (!raw || raw.trim() === '') {
    return { numeric: null, unit: null, display: '', warning: 'empty' }
  }

  const text = raw.trim()

  const mMatch = text.match(/^([\d.]+)\s*(m|米)$/i)
  const cmMatch = text.match(/^([\d.]+)\s*(cm|厘米)$/i)
  const mmMatch = text.match(/^([\d.]+)\s*(mm|毫米)?$/i)
  const nmMatch = text.match(/^([\d.]+)\s*(N[·.]m|牛米)?$/i)

  let numeric: number | null = null
  let unit: UnitType | null = null

  if (mMatch) {
    numeric = parseFloat(mMatch[1]) * 1000
    unit = 'm'
  } else if (cmMatch) {
    numeric = parseFloat(cmMatch[1]) * 10
    unit = 'cm'
  } else if (mmMatch) {
    numeric = parseFloat(mmMatch[1])
    unit = 'mm'
  } else if (nmMatch) {
    numeric = parseFloat(nmMatch[1])
    unit = 'N·m'
  } else {
    const pure = parseFloat(text)
    if (!isNaN(pure)) {
      numeric = pure
      if (requiredUnit === 'N·m') unit = 'N·m'
      else if (requiredUnit === '%') unit = '%'
      else unit = 'mm'
    }
  }

  if (numeric === null || isNaN(numeric)) {
    return { numeric: null, unit: null, display: text, warning: 'invalid' }
  }

  const hasUnit = /[米毫厘cm]/.test(text) || /m(?![·m])/i.test(text) || /N[·.]m/i.test(text)
  let warning: ParsedMeasure['warning'] = undefined

  if (hasUnit && requiredUnit === 'mm' && !/mm|毫米/.test(text)) {
    warning = 'mixed'
  } else if (unit !== requiredUnit && requiredUnit !== 'none' && requiredUnit !== 'mm') {
    warning = 'unit_mismatch'
  }

  return { numeric, unit, display: text, warning }
}

export function toCanonical(numeric: number | null, fromUnit: UnitType | null, targetUnit: UnitType): number | null {
  if (numeric === null) return null
  if (fromUnit === targetUnit) return numeric

  if (targetUnit === 'mm') {
    if (fromUnit === 'm') return numeric * 1000
    if (fromUnit === 'cm') return numeric * 10
  }
  return numeric
}

export interface ThresholdResult {
  isOk: boolean
  reason?: string
  direction?: 'low' | 'high'
}

export function checkThreshold(numeric: number | null, threshold: Threshold): ThresholdResult {
  if (numeric === null) return { isOk: false, reason: '缺少实测值' }

  if (threshold.min !== undefined) {
    const pass = threshold.minExclusive ? numeric > threshold.min : numeric >= threshold.min
    if (!pass) return { isOk: false, direction: 'low', reason: `实测 ${numeric} 低于下限 ${threshold.min}` }
  }
  if (threshold.max !== undefined) {
    const pass = threshold.maxExclusive ? numeric < threshold.max : numeric <= threshold.max
    if (!pass) return { isOk: false, direction: 'high', reason: `实测 ${numeric} 高于上限 ${threshold.max}` }
  }
  return { isOk: true }
}

export function toDisplayValue(numeric: number | null | undefined, unit: UnitType): string {
  if (numeric === null || numeric === undefined) return '-'
  if (unit === 'mm') return `${numeric} mm`
  if (unit === 'cm') return `${numeric / 10} cm`
  if (unit === 'm') return `${numeric / 1000} m`
  if (unit === 'N·m') return `${numeric} N·m`
  if (unit === '%') return `${numeric}%`
  return String(numeric)
}

export interface WarningInfo {
  level: 'error' | 'warning' | 'info'
  message: string
  type: 'threshold' | 'unit' | 'photo' | 'duplicate' | 'empty'
}

export function validatePoint(point: CheckPoint): WarningInfo[] {
  const warnings: WarningInfo[] = []

  if (point.status === 'passed' || point.status === 'rectified') {
    if (!point.hasPhoto && point.photos.length === 0) {
      warnings.push({
        level: 'error',
        message: '该点位缺少验收照片',
        type: 'photo'
      })
    }
  }

  if (point.measuredNumeric !== undefined && point.measuredNumeric !== null) {
    const check = checkThreshold(point.measuredNumeric, point.threshold)
    if (!check.isOk && (point.status === 'passed' || point.status === 'rectified')) {
      warnings.push({
        level: 'error',
        message: check.reason || '实测值超出阈值范围',
        type: 'threshold'
      })
    }
  }

  if (!point.measuredValue && point.status !== 'pending' && point.threshold.requiredUnit !== 'none') {
    warnings.push({
      level: 'warning',
      message: '尚未填写实测值',
      type: 'empty'
    })
  }

  return warnings
}

export function detectDuplicatePoints(points: CheckPoint[]): Array<{ key: string; ids: string[]; area: string; subArea: string; type: string }> {
  const map = new Map<string, string[]>()
  const infoMap = new Map<string, { area: string; subArea: string; type: string }>()

  points.forEach((p) => {
    const key = `${p.area}|${p.subArea}|${p.type}`
    const list = map.get(key) || []
    list.push(p.id)
    map.set(key, list)
    infoMap.set(key, { area: p.area, subArea: p.subArea, type: p.typeLabel })
  })

  const result: Array<{ key: string; ids: string[]; area: string; subArea: string; type: string }> = []
  map.forEach((ids, key) => {
    if (ids.length > 1) {
      const info = infoMap.get(key)!
      result.push({ key, ids, ...info })
    }
  })
  return result
}

export function groupPointsByArea(points: CheckPoint[]): Record<string, CheckPoint[]> {
  const groups: Record<string, CheckPoint[]> = {}
  points.forEach((p) => {
    if (!groups[p.area]) groups[p.area] = []
    groups[p.area].push(p)
  })
  return groups
}

export interface AreaStats {
  total: number
  passed: number
  failed: number
  pending: number
  noPhoto: number
  outOfThreshold: number
  passRate: number
}

export function calcAreaStats(points: CheckPoint[]): AreaStats {
  const total = points.length
  const passed = points.filter((p) => p.status === 'passed' || p.status === 'rectified').length
  const failed = points.filter((p) => p.status === 'failed').length
  const pending = points.filter((p) => p.status === 'pending' || p.status === 'need_photo').length
  const noPhoto = points.filter((p) => !p.hasPhoto && p.photos.length === 0).length
  const outOfThreshold = points.filter((p) => {
    if (p.measuredNumeric === undefined || p.measuredNumeric === null) return false
    return !checkThreshold(p.measuredNumeric, p.threshold).isOk
  }).length

  return {
    total,
    passed,
    failed,
    pending,
    noPhoto,
    outOfThreshold,
    passRate: total === 0 ? 0 : Math.round((passed / total) * 1000) / 10
  }
}

export function filterPoints(
  points: CheckPoint[],
  opts: {
    status?: PointStatus[]
    type?: string[]
    keyword?: string
    area?: string | null
    onlyNoPhoto?: boolean
    onlyOutOfThreshold?: boolean
  }
): CheckPoint[] {
  return points.filter((p) => {
    if (opts.area && p.area !== opts.area) return false
    if (opts.status && opts.status.length > 0 && !opts.status.includes(p.status)) return false
    if (opts.type && opts.type.length > 0 && !opts.type.includes(p.type)) return false
    if (opts.onlyNoPhoto && p.hasPhoto) return false
    if (opts.onlyOutOfThreshold) {
      if (p.measuredNumeric === undefined || p.measuredNumeric === null) return false
      if (checkThreshold(p.measuredNumeric, p.threshold).isOk) return false
    }
    if (opts.keyword) {
      const kw = opts.keyword.toLowerCase()
      const hay = `${p.code} ${p.area} ${p.subArea} ${p.typeLabel} ${p.positionNote} ${p.note || ''} ${p.responsible}`.toLowerCase()
      if (!hay.includes(kw)) return false
    }
    return true
  })
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

export function buildExportRows(points: CheckPoint[]): Array<Record<string, string | number>> {
  return points.map((p) => ({
    code: p.code,
    area: p.area,
    subArea: p.subArea,
    type: p.typeLabel,
    position: p.positionNote,
    required: p.requiredValue,
    measured: p.measuredValue || '-',
    status: ({
      pending: '待检',
      passed: '通过',
      failed: '不合格',
      rectified: '已整改',
      need_photo: '缺照片'
    } as Record<string, string>)[p.status] || p.status,
    note: p.note || '',
    photoCount: p.photos.length,
    responsible: p.responsible,
    measuredAt: p.measuredAt || '',
    measuredBy: p.measuredBy || '',
    historyCount: p.rectificationHistory.length
  }))
}

export const EXPORT_HEADERS = [
  { key: 'code', label: '点位编号' },
  { key: 'area', label: '区域' },
  { key: 'subArea', label: '子区域' },
  { key: 'type', label: '检查项' },
  { key: 'position', label: '位置说明' },
  { key: 'required', label: '要求值' },
  { key: 'measured', label: '实测值' },
  { key: 'status', label: '状态' },
  { key: 'note', label: '备注' },
  { key: 'photoCount', label: '照片数' },
  { key: 'responsible', label: '责任人' },
  { key: 'measuredAt', label: '实测时间' },
  { key: 'measuredBy', label: '实测人' },
  { key: 'historyCount', label: '整改次数' }
]
