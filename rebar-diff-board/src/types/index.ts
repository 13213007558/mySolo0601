export interface RebarSpec {
  raw: string
  grade: string
  diameter: number
  unitWeight: number
  isValid: boolean
}

export interface RebarItem {
  id: string
  batchId: string
  building: string
  component: string
  specRaw: string
  spec: RebarSpec
  plannedQty: number
  actualQty: number
  diffQty: number
  unit: '根' | '吨' | '米'
  status: DiffStatus
  remark: string
  judgment?: ManualJudgment
  source: 'plan' | 'actual' | 'both'
  lineNumber?: number
}

export type DiffStatus = 'shortage' | 'surplus' | 'matched' | 'pending' | 'bad'

export const DIFF_STATUS_LABELS: Record<DiffStatus, string> = {
  shortage: '少料',
  surplus: '多料',
  matched: '一致',
  pending: '待确认',
  bad: '坏行'
}

export const DIFF_STATUS_COLORS: Record<DiffStatus, string> = {
  shortage: '#DC2626',
  surplus: '#059669',
  matched: '#6B7280',
  pending: '#D97706',
  bad: '#7C3AED'
}

export interface ManualJudgment {
  id: string
  itemId: string
  decision: 'supply' | 'adjust' | 'ignore' | 'confirmed'
  decisionLabel: string
  reason: string
  operator: string
  timestamp: string
  originalDiff: number
}

export interface ImportBatch {
  id: string
  type: 'plan' | 'actual'
  filename: string
  importTime: string
  rowCount: number
  badRowCount: number
  fingerprint: string
}

export interface BadRow {
  id: string
  batchId: string
  type: 'plan' | 'actual'
  lineNumber: number
  rawData: string
  reason: string
}

export interface FilterState {
  building: string[]
  component: string[]
  status: DiffStatus[]
  specKeyword: string
  diffMin: number | null
  diffMax: number | null
  onlyUnresolved: boolean
}
