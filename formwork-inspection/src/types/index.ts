export type PointStatus = 'pending' | 'passed' | 'failed' | 'rectified' | 'need_photo'

export type CheckItemType =
  | 'pole_spacing'
  | 'sweep_rod'
  | 'torque'
  | 'cross_brace'
  | 'base_plate'
  | 'upright_vertical'
  | 'top_uplift'
  | 'level_rod'
  | string

export type UnitType = 'mm' | 'cm' | 'm' | 'N·m' | '%' | 'none'

export interface Threshold {
  min?: number
  max?: number
  minExclusive?: boolean
  maxExclusive?: boolean
  requiredUnit: UnitType
  description: string
}

export interface RectificationRecord {
  id: string
  pointId: string
  timestamp: string
  operator: string
  oldValue?: string
  newValue?: string
  oldStatus: PointStatus
  newStatus: PointStatus
  note: string
  photoIds: string[]
}

export interface PhotoAttachment {
  id: string
  pointId: string
  dataUrl: string
  uploadedAt: string
  uploadedBy: string
  caption: string
  isRectification: boolean
}

export interface CheckPoint {
  id: string
  area: string
  subArea: string
  code: string
  type: CheckItemType
  typeLabel: string
  positionNote: string
  requiredValue: string
  requiredNumeric?: number
  requiredUnit: UnitType
  threshold: Threshold
  measuredValue?: string
  measuredNumeric?: number
  measuredUnit?: UnitType
  measuredAt?: string
  measuredBy?: string
  status: PointStatus
  note?: string
  hasPhoto: boolean
  createdAt: string
  updatedAt: string
  rectificationHistory: RectificationRecord[]
  photos: PhotoAttachment[]
  responsible: string
}

export const STATUS_LABELS: Record<PointStatus, string> = {
  pending: '待检',
  passed: '通过',
  failed: '不合格',
  rectified: '已整改',
  need_photo: '缺照片'
}

export const STATUS_COLORS: Record<PointStatus, string> = {
  pending: '#6B7280',
  passed: '#059669',
  failed: '#DC2626',
  rectified: '#0891B2',
  need_photo: '#D97706'
}

export const STATUS_BG: Record<PointStatus, string> = {
  pending: 'bg-gray-100 text-gray-700 border-gray-300',
  passed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  rectified: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  need_photo: 'bg-amber-50 text-amber-700 border-amber-200'
}

export const TYPE_LABELS: Record<CheckItemType, string> = {
  pole_spacing: '立杆间距',
  sweep_rod: '扫地杆设置',
  torque: '扣件扭矩',
  cross_brace: '剪刀撑',
  base_plate: '底座垫板',
  upright_vertical: '立杆垂直度',
  top_uplift: '顶托外伸',
  level_rod: '水平杆步距'
}

export const DEFAULT_THRESHOLDS: Record<CheckItemType, Threshold> = {
  pole_spacing: { max: 1200, requiredUnit: 'mm', description: '≤ 1200 mm' },
  sweep_rod: { max: 200, requiredUnit: 'mm', description: '距地 ≤ 200 mm' },
  torque: { min: 40, max: 65, requiredUnit: 'N·m', description: '40 ~ 65 N·m' },
  cross_brace: { requiredUnit: 'none', description: '连续设置' },
  base_plate: { requiredUnit: 'none', description: '必须设置垫板' },
  upright_vertical: { max: 15, requiredUnit: 'mm', description: '≤ 15 mm / 2m 靠尺' },
  top_uplift: { max: 300, requiredUnit: 'mm', description: '≤ 300 mm' },
  level_rod: { max: 1500, requiredUnit: 'mm', description: '≤ 1500 mm' }
}
