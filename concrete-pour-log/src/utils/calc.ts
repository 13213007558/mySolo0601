import dayjs from 'dayjs'
import type { PourRecord, TimelineItem, AbnormalRecord, RecordStatus, FilterState } from '@/types'
import { ABNORMAL_TYPE_LABELS, SLUMP_MIN, SLUMP_MAX, TEMP_MIN, TEMP_MAX } from '@/types'

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

export function getNowString(): string {
  return dayjs().format('YYYY-MM-DD HH:mm:ss')
}

export function isSameDay(time1: string, time2: string): boolean {
  return dayjs(time1).isSame(dayjs(time2), 'day')
}

export function formatTime(time: string): string {
  return dayjs(time).format('MM-DD HH:mm')
}

export function formatDate(time: string): string {
  return dayjs(time).format('YYYY-MM-DD')
}

export function formatDateTime(time: string): string {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

export function isOvernight(start: string, end: string): boolean {
  return !dayjs(start).isSame(dayjs(end), 'day')
}

export function calcDuration(start: string, end: string): number {
  return dayjs(end).diff(dayjs(start), 'minute')
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins} 分钟`
  return `${hours} 小时 ${mins} 分`
}

export function checkSlumpBoundary(slump: number): { isNormal: boolean; direction?: 'low' | 'high'; message?: string } {
  if (slump < SLUMP_MIN) {
    return { isNormal: false, direction: 'low', message: `坍落度 ${slump}mm 低于下限 ${SLUMP_MIN}mm` }
  }
  if (slump > SLUMP_MAX) {
    return { isNormal: false, direction: 'high', message: `坍落度 ${slump}mm 高于上限 ${SLUMP_MAX}mm` }
  }
  return { isNormal: true }
}

export function checkTempBoundary(temp?: number): { isNormal: boolean; direction?: 'low' | 'high'; message?: string } {
  if (temp === undefined || temp === null) return { isNormal: true }
  if (temp < TEMP_MIN) {
    return { isNormal: false, direction: 'low', message: `入模温度 ${temp}℃ 低于下限 ${TEMP_MIN}℃` }
  }
  if (temp > TEMP_MAX) {
    return { isNormal: false, direction: 'high', message: `入模温度 ${temp}℃ 高于上限 ${TEMP_MAX}℃` }
  }
  return { isNormal: true }
}

export function validateRecord(record: Omit<PourRecord, 'id' | 'abnormals' | 'samples' | 'status' | 'createdAt' | 'updatedAt'>): AbnormalRecord[] {
  const abnormals: AbnormalRecord[] = []

  const slumpCheck = checkSlumpBoundary(record.slump)
  if (!slumpCheck.isNormal) {
    abnormals.push({
      id: generateId(),
      recordId: '',
      type: 'slump_out',
      typeLabel: ABNORMAL_TYPE_LABELS.slump_out,
      description: slumpCheck.message || '',
      severity: slumpCheck.direction === 'high' ? 'medium' : 'high',
      handled: false
    })
  }

  if (record.temperature !== undefined && record.temperature !== null) {
    const tempCheck = checkTempBoundary(record.temperature)
    if (!tempCheck.isNormal) {
      abnormals.push({
        id: generateId(),
        recordId: '',
        type: 'temp_abnormal',
        typeLabel: ABNORMAL_TYPE_LABELS.temp_abnormal,
        description: tempCheck.message || '',
        severity: 'medium',
        handled: false
      })
    }
  }

  if (!record.hasPhoto) {
    abnormals.push({
      id: generateId(),
      recordId: '',
      type: 'missing_photo',
      typeLabel: ABNORMAL_TYPE_LABELS.missing_photo,
      description: '缺少现场照片',
      severity: 'low',
      handled: false
    })
  }

  if (!record.gradeMatch) {
    abnormals.push({
      id: generateId(),
      recordId: '',
      type: 'grade_mismatch',
      typeLabel: ABNORMAL_TYPE_LABELS.grade_mismatch,
      description: '混凝土标号与设计不符',
      severity: 'high',
      handled: false
    })
  }

  return abnormals
}

export function detectDuplicateTrucks(records: PourRecord[]): AbnormalRecord[] {
  const abnormals: AbnormalRecord[] = []
  const truckMap = new Map<string, PourRecord[]>()

  records.forEach((r) => {
    const key = `${r.truckNo}-${dayjs(r.arriveTime).format('YYYY-MM-DD')}`
    const list = truckMap.get(key) || []
    list.push(r)
    truckMap.set(key, list)
  })

  truckMap.forEach((list) => {
    if (list.length > 1) {
      list.forEach((r, idx) => {
        if (idx === 0) return
        abnormals.push({
          id: generateId(),
          recordId: r.id,
          type: 'duplicate',
          typeLabel: ABNORMAL_TYPE_LABELS.duplicate,
          description: `同日同车号出现 ${list.length} 次，疑似补录重复（第 ${idx + 1} 条）`,
          severity: 'low',
          handled: false
        })
      })
    }
  })

  return abnormals
}

export function determineStatus(record: PourRecord, recordAbnormals: AbnormalRecord[]): RecordStatus {
  const active = recordAbnormals.filter((a) => !a.handled)
  if (active.length === 0) return 'normal'

  const hasHigh = active.some((a) => a.severity === 'high')
  const hasMissingPhoto = active.some((a) => a.type === 'missing_photo')

  if (hasHigh) return 'abnormal'
  if (hasMissingPhoto && active.length === 1) return 'missing_photo'
  return 'warning'
}

export function buildTimeline(records: PourRecord[], position?: string): TimelineItem[] {
  const filtered = position ? records.filter((r) => r.position === position) : records
  const items: TimelineItem[] = []

  filtered.forEach((record) => {
    items.push({
      id: `${record.id}-arrive`,
      time: record.arriveTime,
      type: 'arrive',
      typeLabel: '到场',
      recordId: record.id,
      title: `车号 ${record.truckNo} 到场`,
      description: `${record.grade} · ${record.volume}m³ · ${record.component}`
    })

    if (record.startPourTime) {
      items.push({
        id: `${record.id}-start`,
        time: record.startPourTime,
        type: 'start_pour',
        typeLabel: '开始浇筑',
        recordId: record.id,
        title: `开始浇筑`,
        description: `${record.component} · ${record.grade}`
      })
    }

    if (record.endPourTime) {
      const dur = record.startPourTime ? calcDuration(record.startPourTime, record.endPourTime) : 0
      items.push({
        id: `${record.id}-end`,
        time: record.endPourTime,
        type: 'end_pour',
        typeLabel: '浇筑完成',
        recordId: record.id,
        title: `浇筑完成`,
        description: `${dur > 0 ? `用时 ${formatDuration(dur)}` : ''}`
      })
    }

    record.samples.forEach((s) => {
      items.push({
        id: `${record.id}-sample-${s.id}`,
        time: s.madeTime,
        type: 'sample_made',
        typeLabel: '试块留置',
        recordId: record.id,
        title: `留置 ${s.type} 试块`,
        description: `${s.groupNo} · ${s.count} 组`
      })
    })

    record.abnormals.forEach((a) => {
      items.push({
        id: `${record.id}-abnormal-${a.id}`,
        time: record.arriveTime,
        type: 'abnormal',
        typeLabel: '异常',
        recordId: record.id,
        title: `${a.typeLabel}${a.handled ? '（已处理）' : ''}`,
        description: a.description,
        severity: a.severity
      })
    })

    if (record.manualCorrection) {
      items.push({
        id: `${record.id}-correction`,
        time: record.correctedAt || record.updatedAt,
        type: 'correction',
        typeLabel: '人工更正',
        recordId: record.id,
        title: `人工更正：${record.correctedBy || '未知操作人'}`,
        description: record.manualCorrection
      })
    }
  })

  return items.sort((a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf())
}

export function groupByPosition(records: PourRecord[]): Record<string, PourRecord[]> {
  const groups: Record<string, PourRecord[]> = {}
  records.forEach((r) => {
    if (!groups[r.position]) groups[r.position] = []
    groups[r.position].push(r)
  })
  return groups
}

export function groupByDate(records: PourRecord[]): Record<string, PourRecord[]> {
  const groups: Record<string, PourRecord[]> = {}
  records.forEach((r) => {
    const date = dayjs(r.arriveTime).format('YYYY-MM-DD')
    if (!groups[date]) groups[date] = []
    groups[date].push(r)
  })
  return groups
}

export function calculateStats(records: PourRecord[]) {
  const totalVolume = records.reduce((sum, r) => sum + r.volume, 0)
  const abnormalCount = records.filter((r) => r.status === 'abnormal' || r.status === 'warning').length
  const missingPhotoCount = records.filter((r) => r.status === 'missing_photo').length
  const sampleCount = records.reduce((sum, r) => sum + r.samples.length, 0)
  const abnormalItems = records.flatMap((r) => r.abnormals.filter((a) => !a.handled)).length

  const gradeDist: Record<string, number> = {}
  records.forEach((r) => {
    gradeDist[r.grade] = (gradeDist[r.grade] || 0) + r.volume
  })

  return {
    totalRecords: records.length,
    totalVolume: Math.round(totalVolume * 10) / 10,
    truckCount: new Set(records.map((r) => r.truckNo)).size,
    abnormalCount,
    missingPhotoCount,
    sampleCount,
    abnormalItems,
    gradeDistribution: gradeDist,
    positions: Array.from(new Set(records.map((r) => r.position))).sort(),
    grades: Array.from(new Set(records.map((r) => r.grade))).sort()
  }
}

export function filterRecords(records: PourRecord[], filter: FilterState): PourRecord[] {
  return records.filter((r) => {
    if (filter.position.length > 0 && !filter.position.includes(r.position)) return false
    if (filter.grade.length > 0 && !filter.grade.includes(r.grade)) return false
    if (filter.status.length > 0 && !filter.status.includes(r.status)) return false
    if (filter.truckNo && !r.truckNo.toLowerCase().includes(filter.truckNo.toLowerCase())) return false
    if (filter.onlyAbnormal && r.status === 'normal') return false
    if (filter.onlyMissingPhoto && r.status !== 'missing_photo') return false
    if (filter.dateFrom) {
      const from = dayjs(filter.dateFrom).startOf('day')
      if (dayjs(r.arriveTime).isBefore(from)) return false
    }
    if (filter.dateTo) {
      const to = dayjs(filter.dateTo).endOf('day')
      if (dayjs(r.arriveTime).isAfter(to)) return false
    }
    return true
  })
}
