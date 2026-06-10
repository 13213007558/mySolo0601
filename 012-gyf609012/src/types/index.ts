export type IssueStatus = 'draft' | 'pending' | 'replied' | 'completed' | 'cancelled'

export type IssuePriority = 'high' | 'medium' | 'low'

export type AttachmentType = 'bim_screenshot' | 'photo' | 'document' | 'other'

export type CollisionCategory = 'beam' | 'duct' | 'light_slot' | 'pipe' | 'other'

export type SystemType = 'sprinkler' | 'hydrant' | 'gas' | 'foam'

export interface Attachment {
  id: string
  name: string
  type: AttachmentType
  url: string
  uploadedAt: string
  uploadedBy: string
  version: number
  remark: string
}

export interface DesignReply {
  id: string
  content: string
  repliedBy: string
  repliedAt: string
  attachments: Attachment[]
  isLatest: boolean
}

export interface StatusRecord {
  id: string
  fromStatus: IssueStatus | null
  toStatus: IssueStatus
  operator: string
  operateTime: string
  remark: string
}

export interface CollisionIssue {
  id: string
  title: string
  floor: string
  system: SystemType
  category: CollisionCategory
  location: string
  elevation: number
  elevationUnit: 'mm' | 'm'
  beamHeight?: number
  responsibleDept: string
  assignee: string
  status: IssueStatus
  priority: IssuePriority
  description: string
  attachments: Attachment[]
  designReplies: DesignReply[]
  statusHistory: StatusRecord[]
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface FilterOptions {
  floor: string[]
  system: SystemType[]
  category: CollisionCategory[]
  responsibleDept: string[]
  status: IssueStatus[]
  priority: IssuePriority[]
  keyword: string
}

export const STATUS_LABELS: Record<IssueStatus, string> = {
  draft: '草稿',
  pending: '待处理',
  replied: '已回复',
  completed: '已完成',
  cancelled: '已取消',
}

export const STATUS_COLORS: Record<IssueStatus, string> = {
  draft: 'bg-slate-400',
  pending: 'bg-warning-500',
  replied: 'bg-industrial-500',
  completed: 'bg-success-500',
  cancelled: 'bg-slate-500',
}

export const PRIORITY_LABELS: Record<IssuePriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

export const PRIORITY_COLORS: Record<IssuePriority, string> = {
  high: 'bg-fire-500',
  medium: 'bg-warning-500',
  low: 'bg-slate-400',
}

export const CATEGORY_LABELS: Record<CollisionCategory, string> = {
  beam: '梁碰撞',
  duct: '风管碰撞',
  light_slot: '灯槽碰撞',
  pipe: '管道碰撞',
  other: '其他碰撞',
}

export const SYSTEM_LABELS: Record<SystemType, string> = {
  sprinkler: '喷淋系统',
  hydrant: '消火栓系统',
  gas: '气体灭火系统',
  foam: '泡沫灭火系统',
}

export const ATTACHMENT_TYPE_LABELS: Record<AttachmentType, string> = {
  bim_screenshot: 'BIM截图',
  photo: '现场照片',
  document: '文档',
  other: '其他',
}

export const FLOOR_OPTIONS = ['B2F', 'B1F', '1F', '2F', '3F', '4F', '5F', '6F', '7F', '8F']

export const DEPARTMENT_OPTIONS = [
  '结构专业',
  '机电专业',
  '暖通专业',
  '给排水专业',
  '电气专业',
  '装饰专业',
  '消防专业',
]

export const DEFAULT_FILTERS: FilterOptions = {
  floor: [],
  system: [],
  category: [],
  responsibleDept: [],
  status: [],
  priority: [],
  keyword: '',
}
