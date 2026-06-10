export type InspectionStatus =
  | 'found'         // 问题发现
  | 'rectifying'    // 整改中
  | 'rechecking'    // 待复查
  | 'passed'        // 复查通过
  | 'returned'      // 退回重改
  | 'closed'        // 已闭环

export type ScaffoldType =
  | 'external'      // 外架
  | 'internal'      // 内架
  | 'landing'       // 卸料平台
  | 'safetynet'     // 安全网
  | 'stair'         // 爬梯
  | 'wall_anchor'   // 连墙件

export type ProblemLevel = 'critical' | 'major' | 'minor'

export interface PhotoAttachment {
  id: string
  inspectionId: string
  dataUrl: string
  uploadedAt: string
  uploadedBy: string
  caption: string
  phase: 'before' | 'during' | 'after' | 'recheck'
}

export interface DemolitionRequest {
  id: string
  inspectionId: string
  requestedBy: string
  requestedAt: string
  location: string
  reason: string
  scope: string
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedAt?: string
  approvaNote?: string
}

export interface AuditRecord {
  id: string
  inspectionId: string
  timestamp: string
  operator: string
  action: string
  oldValue?: string
  newValue?: string
  oldStatus?: InspectionStatus
  newStatus?: InspectionStatus
  note?: string
}

export interface InspectionRecord {
  id: string
  code: string
  building: string           // 楼栋
  floor: string             // 楼层
  location: string          // 具体位置
  scaffoldType: ScaffoldType
  scaffoldTypeLabel: string

  problemLevel: ProblemLevel
  problemTitle: string
  problemDescription: string

  status: InspectionStatus
  responsibleTeam: string   // 责任班组
  foreman: string           // 架子工长

  deadline: string          // 整改截止时间
  foundAt: string           // 发现时间
  foundBy: string           // 发现人

  rectificationNote?: string
  rectifiedAt?: string
  rectifiedBy?: string

  recheckNote?: string
  recheckedAt?: string
  recheckedBy?: string

  returnCount: number       // 退回次数

  createdAt: string
  updatedAt: string

  photos: PhotoAttachment[]
  demolitionRequests: DemolitionRequest[]
  auditLog: AuditRecord[]
}

export interface FilterState {
  status: InspectionStatus[]
  scaffoldType: ScaffoldType[]
  building: string | null
  problemLevel: ProblemLevel[]
  team: string | null
  keyword: string
  onlyOverdue: boolean
  onlyNoPhoto: boolean
  onlyRepeat: boolean
  dateRange: [string, string] | null
}

export const STATUS_LABELS: Record<InspectionStatus, string> = {
  found: '问题发现',
  rectifying: '整改中',
  rechecking: '待复查',
  passed: '复查通过',
  returned: '退回重改',
  closed: '已闭环'
}

export const STATUS_COLORS: Record<InspectionStatus, string> = {
  found: '#DC2626',
  rectifying: '#F59E0B',
  rechecking: '#8B5CF6',
  passed: '#059669',
  returned: '#EA580C',
  closed: '#6B7280'
}

export const STATUS_BG: Record<InspectionStatus, string> = {
  found: 'bg-red-50 text-red-700 border-red-200',
  rectifying: 'bg-amber-50 text-amber-700 border-amber-200',
  rechecking: 'bg-purple-50 text-purple-700 border-purple-200',
  passed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  returned: 'bg-orange-50 text-orange-700 border-orange-200',
  closed: 'bg-gray-50 text-gray-600 border-gray-200'
}

export const SCAFFOLD_LABELS: Record<ScaffoldType, string> = {
  external: '外脚手架',
  internal: '内支撑架',
  landing: '卸料平台',
  safetynet: '安全网',
  stair: '爬梯',
  wall_anchor: '连墙件'
}

export const LEVEL_LABELS: Record<ProblemLevel, string> = {
  critical: '重大',
  major: '较大',
  minor: '一般'
}

export const LEVEL_COLORS: Record<ProblemLevel, string> = {
  critical: 'text-red-600 bg-red-50',
  major: 'text-amber-600 bg-amber-50',
  minor: 'text-sky-600 bg-sky-50'
}

export const PHASE_LABELS: Record<string, string> = {
  before: '整改前',
  during: '整改中',
  after: '整改后',
  recheck: '复查照'
}
