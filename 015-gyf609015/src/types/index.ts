export type SampleStatus = 'available' | 'pending' | 'rejected'

export type ConfirmAction = 'confirm' | 'reject'

export interface Batch {
  id: string
  sampleId: string
  batchNo: string
  entryBatchNo: string
  entryPhoto: string
  entryDate: string
  quantity: string
  remark: string
}

export interface ConfirmRecord {
  id: string
  sampleId: string
  batchId: string
  action: ConfirmAction
  confirmer: string
  confirmerRole: string
  confirmerPhone: string
  confirmDate: string
  description: string
}

export interface Sample {
  id: string
  sampleNo: string
  version: string
  materialType: string
  specification: string
  manufacturer: string
  manufacturerContact: string
  manufacturerPhone: string
  sealPhoto: string
  sealDate: string
  sealConfirmer: string
  remark: string
  status: SampleStatus
  createdAt: string
  updatedAt: string
  batches: Batch[]
  confirmRecords: ConfirmRecord[]
}

export interface SampleFormData {
  sampleNo: string
  version: string
  materialType: string
  specification: string
  manufacturer: string
  manufacturerContact: string
  manufacturerPhone: string
  sealPhoto: string
  sealDate: string
  sealConfirmer: string
  remark: string
  status: SampleStatus
  batches: Batch[]
}

export interface ValidationError {
  field: string
  message: string
  type: 'error' | 'warning'
}

export interface FilterState {
  status: 'all' | SampleStatus
  keyword: string
  dateStart: string
  dateEnd: string
}

export interface UIState {
  selectedSampleId: string | null
  isDetailDrawerOpen: boolean
  isFormDrawerOpen: boolean
  editingSample: Sample | null
  isExportDialogOpen: boolean
}

export const STATUS_OPTIONS: { value: SampleStatus | 'all'; label: string; color: string }[] = [
  { value: 'all', label: '全部状态', color: 'cool-gray' },
  { value: 'available', label: '可用', color: 'amber-gold' },
  { value: 'pending', label: '待确认', color: 'warn-orange' },
  { value: 'rejected', label: '退回', color: 'alert-red' },
]

export const MATERIAL_OPTIONS = [
  '氟碳喷涂铝板',
  '阳极氧化铝板',
  '粉末喷涂铝板',
  '石材面板',
  'Low-E中空玻璃',
  '夹胶玻璃',
  '铝合金型材',
  '不锈钢板',
  '陶土板',
  '其他',
]
