export type RiskLevel = 'high' | 'medium' | 'low'

export type BoxType = '一级配电箱' | '二级配电箱' | '三级配电箱' | '开关箱'

export type DispatchStatus = 'none' | 'dispatched' | 'rectified' | 'reviewed'

export type AnomalyType = 'qr_failed' | 'leak_out_of_range' | 'duplicate_box' | ''

export interface LeakProtectionTest {
  id: string
  ratedCurrent: number
  testCurrent: number
  actionTimeMs: number
  isNormal: boolean
}

export interface QRCodePhoto {
  id: string
  photoUrl: string
  qrCode: string
  qrRecognized: boolean
}

export interface DispatchOrder {
  id: string
  status: DispatchStatus
  assignee: string
  createdAt: string
  deadline: string
  description: string
}

export interface ReviewOpinion {
  id: string
  reviewer: string
  content: string
  createdAt: string
  result: 'pass' | 'fail' | 'pending'
}

export interface InspectionRecord {
  id: string
  areaLevel1: string
  areaLevel2: string
  areaLevel3: string
  boxType: BoxType
  boxId: string
  riskLevel: RiskLevel
  isAnomaly: boolean
  anomalyType: AnomalyType
  inspectionDate: string
  inspector: string
  location: string
  leakTests: LeakProtectionTest[]
  qrPhotos: QRCodePhoto[]
  dispatchOrder: DispatchOrder | null
  reviewOpinions: ReviewOpinion[]
}

export interface FilterState {
  areaLevel1: string
  areaLevel2: string
  areaLevel3: string
  boxTypes: BoxType[]
  riskLevels: RiskLevel[]
}

export interface WeeklyReport {
  generatedAt: string
  period: string
  totalRecords: number
  anomalyCount: number
  riskSummary: { high: number; medium: number; low: number }
  dispatchSummary: { none: number; dispatched: number; rectified: number; reviewed: number }
  anomalyDetails: { id: string; boxId: string; anomalyType: string }[]
  records: InspectionRecord[]
}
