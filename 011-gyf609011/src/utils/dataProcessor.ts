import type { InspectionRecord, LeakProtectionTest, RiskLevel, AnomalyType, BoxType, DispatchStatus } from '@/types'

const NORMAL_ACTION_MIN = 5
const NORMAL_ACTION_MAX = 30

export function evaluateRiskLevel(record: InspectionRecord): RiskLevel {
  if (record.isAnomaly) return 'high'

  const abnormalTests = record.leakTests.filter(t => !t.isNormal)
  if (abnormalTests.length > 0) return 'high'

  const nearBoundaryTests = record.leakTests.filter(
    t => t.actionTimeMs >= 25 || t.actionTimeMs <= 8
  )
  if (nearBoundaryTests.length > 0) return 'medium'

  const hasNoPhotos = record.qrPhotos.length === 0
  const hasUnrecognizedQR = record.qrPhotos.some(p => !p.qrRecognized)
  if (hasNoPhotos || hasUnrecognizedQR) return 'medium'

  return 'low'
}

export function detectAnomalies(record: InspectionRecord): { isAnomaly: boolean; anomalyType: AnomalyType } {
  const qrFailed = record.qrPhotos.some(p => !p.qrRecognized)
  if (qrFailed) return { isAnomaly: true, anomalyType: 'qr_failed' }

  const leakOutOfRange = record.leakTests.some(
    t => t.actionTimeMs > NORMAL_ACTION_MAX || t.actionTimeMs < NORMAL_ACTION_MIN
  )
  if (leakOutOfRange) return { isAnomaly: true, anomalyType: 'leak_out_of_range' }

  return { isAnomaly: record.isAnomaly, anomalyType: record.anomalyType }
}

export function detectDuplicateBoxes(records: InspectionRecord[]): Map<string, string[]> {
  const boxMap = new Map<string, string[]>()
  records.forEach(r => {
    const existing = boxMap.get(r.boxId) || []
    existing.push(r.id)
    boxMap.set(r.boxId, existing)
  })
  const duplicates = new Map<string, string[]>()
  boxMap.forEach((ids, boxId) => {
    if (ids.length > 1) duplicates.set(boxId, ids)
  })
  return duplicates
}

export function validateLeakTest(test: LeakProtectionTest): boolean {
  return test.actionTimeMs >= NORMAL_ACTION_MIN && test.actionTimeMs <= NORMAL_ACTION_MAX
}

export function processImportedData(records: InspectionRecord[]): InspectionRecord[] {
  const duplicates = detectDuplicateBoxes(records)

  return records.map(record => {
    const anomalyResult = detectAnomalies(record)
    const isDuplicate = duplicates.has(record.boxId)
    const updatedRecord = { ...record }

    if (isDuplicate) {
      updatedRecord.isAnomaly = true
      updatedRecord.anomalyType = 'duplicate_box'
    } else if (anomalyResult.isAnomaly) {
      updatedRecord.isAnomaly = true
      updatedRecord.anomalyType = anomalyResult.anomalyType
    }

    updatedRecord.leakTests = updatedRecord.leakTests.map(t => ({
      ...t,
      isNormal: validateLeakTest(t),
    }))

    updatedRecord.riskLevel = evaluateRiskLevel(updatedRecord)
    return updatedRecord
  })
}

export const BOX_TYPES: BoxType[] = ['一级配电箱', '二级配电箱', '三级配电箱', '开关箱']
export const RISK_LEVELS: RiskLevel[] = ['high', 'medium', 'low']
export const DISPATCH_STATUSES: { value: DispatchStatus; label: string }[] = [
  { value: 'none', label: '未派单' },
  { value: 'dispatched', label: '已派单' },
  { value: 'rectified', label: '已整改' },
  { value: 'reviewed', label: '已复查' },
]

export const ANOMALY_TYPE_LABELS: Record<AnomalyType, string> = {
  '': '无',
  qr_failed: '二维码识别失败',
  leak_out_of_range: '漏保动作时间超界',
  duplicate_box: '重复箱体',
}

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  high: '高风险',
  medium: '中风险',
  low: '低风险',
}

export function formatDispatchStatus(status: DispatchStatus): string {
  return DISPATCH_STATUSES.find(s => s.value === status)?.label || status
}
