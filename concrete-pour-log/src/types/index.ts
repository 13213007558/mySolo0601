export type RecordStatus = 'normal' | 'warning' | 'abnormal' | 'missing_photo'

export type PourType = '梁板' | '柱墙' | '基础' | '楼梯' | '后浇带' | string

export type ConcreteGrade = 'C20' | 'C25' | 'C30' | 'C35' | 'C40' | 'C45' | 'C50' | string

export interface CubeSample {
  id: string
  recordId: string
  type: '标准养护' | '同条件养护' | '拆模' | '抗渗'
  groupNo: string
  count: number
  madeTime: string
  remark?: string
}

export interface AbnormalRecord {
  id: string
  recordId: string
  type: 'pump_stop' | 'slump_out' | 'temp_abnormal' | 'missing_photo' | 'grade_mismatch' | 'duplicate'
  typeLabel: string
  description: string
  severity: 'low' | 'medium' | 'high'
  handled: boolean
  handleReason?: string
  handler?: string
  handleTime?: string
}

export interface PourRecord {
  id: string
  truckNo: string
  batchNo: string
  arriveTime: string
  startPourTime?: string
  endPourTime?: string
  position: string
  component: string
  grade: ConcreteGrade
  volume: number
  slump: number
  slumpUnit: string
  temperature?: number
  hasPhoto: boolean
  photoUrl?: string
  gradeMatch: boolean
  inspector: string
  supervisor?: string
  remark?: string
  manualCorrection?: string
  correctedBy?: string
  correctedAt?: string
  samples: CubeSample[]
  abnormals: AbnormalRecord[]
  status: RecordStatus
  createdAt: string
  updatedAt: string
}

export interface FilterState {
  position: string[]
  grade: string[]
  status: RecordStatus[]
  dateFrom: string | null
  dateTo: string | null
  truckNo: string
  onlyAbnormal: boolean
  onlyMissingPhoto: boolean
}

export interface TimelineItem {
  id: string
  time: string
  type: 'arrive' | 'start_pour' | 'end_pour' | 'sample_made' | 'abnormal' | 'correction'
  typeLabel: string
  recordId: string
  title: string
  description: string
  severity?: 'low' | 'medium' | 'high'
}

export interface PourReport {
  date: string
  position: string
  totalVolume: number
  truckCount: number
  gradeDistribution: Record<string, number>
  abnormalCount: number
  missingPhotoCount: number
  records: PourRecord[]
}

export const RECORD_STATUS_LABELS: Record<RecordStatus, string> = {
  normal: '正常',
  warning: '预警',
  abnormal: '异常',
  missing_photo: '缺照片'
}

export const RECORD_STATUS_COLORS: Record<RecordStatus, string> = {
  normal: '#10b981',
  warning: '#f59e0b',
  abnormal: '#ef4444',
  missing_photo: '#8b5cf6'
}

export const ABNORMAL_TYPE_LABELS: Record<string, string> = {
  pump_stop: '停泵异常',
  slump_out: '坍落度超界',
  temp_abnormal: '温度异常',
  missing_photo: '缺照片',
  grade_mismatch: '标号不符',
  duplicate: '重复车次'
}

export const SLUMP_MIN = 120
export const SLUMP_MAX = 220
export const TEMP_MIN = 5
export const TEMP_MAX = 35
