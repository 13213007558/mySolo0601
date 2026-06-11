export const MIN_DURATION_HOURS = 24
export const REQUIRED_WATER_DEPTH_CM = 2

export function parseDateTime(str) {
  if (!str) return null
  const t = new Date(str)
  return isNaN(t.getTime()) ? null : t
}

export function formatDateTime(d) {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatDate(d) {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function durationHours(startStr, endStr) {
  const s = parseDateTime(startStr)
  const e = parseDateTime(endStr)
  if (!s || !e || e <= s) return 0
  return (e - s) / (1000 * 60 * 60)
}

export function validateTimeRange(startStr, endStr) {
  const errors = []
  const s = parseDateTime(startStr)
  const e = parseDateTime(endStr)
  if (!s) errors.push('开始时间格式不正确')
  if (!e) errors.push('结束时间格式不正确')
  if (s && e && e <= s) errors.push('结束时间必须晚于开始时间')
  if (s && e) {
    const h = durationHours(startStr, endStr)
    if (h < MIN_DURATION_HOURS) {
      errors.push(`蓄水时长不足${MIN_DURATION_HOURS}小时（当前${h.toFixed(1)}小时）`)
    }
  }
  return errors
}

export function validatePhotoTime(photoTimeStr, endTimeStr) {
  const p = parseDateTime(photoTimeStr)
  const e = parseDateTime(endTimeStr)
  if (p && e && p > e) {
    return '水位照片拍摄时间不能晚于闭水结束时间'
  }
  return null
}

export function getRecordStatus(record) {
  const issues = []
  const timeErrors = validateTimeRange(record.startTime, record.endTime)
  if (timeErrors.length) issues.push({ type: 'time', msg: timeErrors[0] })

  if (record.photoTime) {
    const photoErr = validatePhotoTime(record.photoTime, record.endTime)
    if (photoErr) issues.push({ type: 'photo', msg: photoErr })
  }

  if (record.waterDepthCm !== undefined && record.waterDepthCm !== null) {
    if (record.waterDepthCm < REQUIRED_WATER_DEPTH_CM) {
      issues.push({ type: 'water', msg: `水位不足${REQUIRED_WATER_DEPTH_CM}cm（当前${record.waterDepthCm}cm）` })
    }
  }

  const hasLeak = record.leakConclusion === 'leak'
  const closedLoop = record.retests && record.retests.length > 0 &&
    record.retests[record.retests.length - 1].leakConclusion === 'pass'

  let overall = 'normal'
  if (hasLeak && !closedLoop) overall = 'pending_retest'
  if (issues.length > 0) overall = issues.some(i => i.type === 'time' || i.type === 'photo') ? 'abnormal' : 'warning'
  if (!record.startTime || !record.endTime) overall = 'incomplete'

  return {
    overall,
    issues,
    hasLeak,
    closedLoop,
    retestCount: (record.retests || []).length
  }
}

export const STATUS_LABEL = {
  normal: '正常通过',
  pending_retest: '待复测',
  abnormal: '时间异常',
  warning: '水位不足',
  incomplete: '未完成'
}

export const STATUS_COLOR = {
  normal: '#52c41a',
  pending_retest: '#faad14',
  abnormal: '#ff4d4f',
  warning: '#fa8c16',
  incomplete: '#8c8c8c'
}

export function toLocalInputValue(dateStr) {
  if (!dateStr) return ''
  const d = parseDateTime(dateStr)
  if (!d) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromLocalInputValue(val) {
  if (!val) return ''
  const d = new Date(val)
  return isNaN(d.getTime()) ? '' : d.toISOString()
}

export function nowISO() {
  return new Date().toISOString()
}

export function hoursAgoISO(hours) {
  return new Date(Date.now() - hours * 3600 * 1000).toISOString()
}
