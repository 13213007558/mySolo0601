import type { RebarItem, RebarSpec, DiffStatus } from '@/types'
import { parseRebarSpec, generateId, isBadRow } from './specParser'

interface RawRow {
  [key: string]: any
}

export function normalizeKey(key: string): string {
  const keyMap: Record<string, string> = {
    '楼栋': 'building',
    '楼栋号': 'building',
    'building': 'building',
    '构件': 'component',
    '构件名称': 'component',
    'component': 'component',
    '规格': 'spec',
    '钢筋规格': 'spec',
    'spec': 'spec',
    '数量': 'qty',
    '下料数量': 'qty',
    '实收数量': 'qty',
    'qty': 'qty',
    'quantity': 'qty',
    '单位': 'unit',
    'unit': 'unit',
    '备注': 'remark',
    'remark': 'remark',
    '行号': 'lineNumber',
    'lineNumber': 'lineNumber'
  }
  return keyMap[key] || key
}

export function parseRawRows(rows: RawRow[], batchId: string, type: 'plan' | 'actual'): {
  items: RebarItem[]
  badRows: { id: string; batchId: string; type: 'plan' | 'actual'; lineNumber: number; rawData: string; reason: string }[]
} {
  const items: RebarItem[] = []
  const badRows: any[] = []

  rows.forEach((row, index) => {
    const normalized: Record<string, any> = {}
    for (const key of Object.keys(row)) {
      normalized[normalizeKey(key)] = row[key]
    }

    const { isBad, reason } = isBadRow(normalized)

    if (isBad) {
      badRows.push({
        id: generateId(),
        batchId,
        type,
        lineNumber: normalized.lineNumber || index + 1,
        rawData: JSON.stringify(normalized),
        reason
      })
      return
    }

    const specRaw = String(normalized.spec || '')
    const spec = parseRebarSpec(specRaw)
    const qty = parseFloat(String(normalized.qty || '0'))

    items.push({
      id: generateId(),
      batchId,
      building: String(normalized.building || ''),
      component: String(normalized.component || ''),
      specRaw,
      spec,
      plannedQty: type === 'plan' ? qty : 0,
      actualQty: type === 'actual' ? qty : 0,
      diffQty: 0,
      unit: '根',
      status: 'pending',
      remark: String(normalized.remark || ''),
      source: type,
      lineNumber: normalized.lineNumber || index + 1
    })
  })

  return { items, badRows }
}

export function calculateDiff(planItems: RebarItem[], actualItems: RebarItem[]): RebarItem[] {
  const result: RebarItem[] = []
  const matchedActualIds = new Set<string>()

  for (const plan of planItems) {
    let bestMatch: RebarItem | null = null
    let bestMatchScore = 0

    for (const actual of actualItems) {
      if (matchedActualIds.has(actual.id)) continue

      const score = matchScore(plan, actual)
      if (score > bestMatchScore && score >= 50) {
        bestMatchScore = score
        bestMatch = actual
      }
    }

    if (bestMatch) {
      matchedActualIds.add(bestMatch.id)
      const mergedItem: RebarItem = {
        ...plan,
        actualQty: bestMatch.actualQty,
        diffQty: bestMatch.actualQty - plan.plannedQty,
        source: 'both',
        status: calculateStatus(bestMatch.actualQty - plan.plannedQty)
      }
      result.push(mergedItem)
    } else {
      result.push({
        ...plan,
        diffQty: -plan.plannedQty,
        status: 'shortage'
      })
    }
  }

  for (const actual of actualItems) {
    if (!matchedActualIds.has(actual.id)) {
      result.push({
        ...actual,
        diffQty: actual.actualQty,
        status: 'surplus'
      })
    }
  }

  return result
}

function matchScore(a: RebarItem, b: RebarItem): number {
  let score = 0

  if (a.building && b.building && a.building === b.building) {
    score += 20
  }

  if (a.component && b.component && a.component === b.component) {
    score += 20
  }

  if (a.spec.isValid && b.spec.isValid &&
      a.spec.grade === b.spec.grade &&
      Math.abs(a.spec.diameter - b.spec.diameter) < 0.01) {
    score += 50
  }

  if (a.specRaw && b.specRaw && a.specRaw.toLowerCase() === b.specRaw.toLowerCase()) {
    score += 10
  }

  return score
}

function calculateStatus(diff: number): DiffStatus {
  if (diff === 0) return 'matched'
  if (diff > 0) return 'surplus'
  return 'shortage'
}

export function groupByBuilding(items: RebarItem[]): Record<string, RebarItem[]> {
  const groups: Record<string, RebarItem[]> = {}
  for (const item of items) {
    const key = item.building || '未分类'
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
}

export function groupByComponent(items: RebarItem[]): Record<string, RebarItem[]> {
  const groups: Record<string, RebarItem[]> = {}
  for (const item of items) {
    const key = item.component || '未分类'
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
}

export function groupByDiameter(items: RebarItem[]): Record<number, RebarItem[]> {
  const groups: Record<number, RebarItem[]> = {}
  for (const item of items) {
    const key = item.spec.diameter || 0
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
}

export function aggregateStats(items: RebarItem[]) {
  const total = items.length
  const shortage = items.filter((i) => i.status === 'shortage').length
  const surplus = items.filter((i) => i.status === 'surplus').length
  const matched = items.filter((i) => i.status === 'matched').length
  const pending = items.filter((i) => i.status === 'pending').length
  const bad = items.filter((i) => i.status === 'bad').length

  const totalPlanned = items.reduce((sum, i) => sum + i.plannedQty, 0)
  const totalActual = items.reduce((sum, i) => sum + i.actualQty, 0)
  const totalDiff = items.reduce((sum, i) => sum + i.diffQty, 0)

  return { total, shortage, surplus, matched, pending, bad, totalPlanned, totalActual, totalDiff }
}

export function filterItems(items: RebarItem[], filter: {
  building?: string[]
  component?: string[]
  status?: string[]
  specKeyword?: string
  diffMin?: number | null
  diffMax?: number | null
  onlyUnresolved?: boolean
}): RebarItem[] {
  return items.filter((item) => {
    if (filter.building && filter.building.length > 0 && item.building) {
      if (!filter.building.includes(item.building)) return false
    }

    if (filter.component && filter.component.length > 0 && item.component) {
      if (!filter.component.includes(item.component)) return false
    }

    if (filter.status && filter.status.length > 0) {
      if (!filter.status.includes(item.status)) return false
    }

    if (filter.specKeyword && filter.specKeyword.trim()) {
      const kw = filter.specKeyword.toLowerCase()
      const inSpec = item.specRaw.toLowerCase().includes(kw) ||
                     item.spec.grade.toLowerCase().includes(kw) ||
                     String(item.spec.diameter).includes(kw)
      if (!inSpec) return false
    }

    if (filter.diffMin !== null && filter.diffMin !== undefined) {
      if (item.diffQty < filter.diffMin) return false
    }

    if (filter.diffMax !== null && filter.diffMax !== undefined) {
      if (item.diffQty > filter.diffMax) return false
    }

    if (filter.onlyUnresolved && item.judgment) {
      return false
    }

    return true
  })
}
