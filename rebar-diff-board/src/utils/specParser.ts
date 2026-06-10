import type { RebarSpec } from '@/types'

const GRADE_PATTERNS = [
  /HRB[4-6]00[E]?/gi,
  /HPB[2-3]00/gi,
  /HRBF[4-6]00/gi,
  /CRB[5-6]50/gi,
  /RRB[4-6]00/gi
]

const DIAMETER_PATTERNS = [
  /[ΦφØϕφ]\s*(\d+(?:\.\d+)?)/i,
  /直径\s*(\d+(?:\.\d+)?)/i,
  /d\s*(\d+(?:\.\d+)?)/i,
  /^\s*(\d+(?:\.\d+)?)\s*mm\s*$/i,
  /(\d+(?:\.\d+)?)\s*[毫毫]?米/i
]

const STANDARD_DIAMETERS = [6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 32, 36, 40, 50]

export function parseRebarSpec(raw: string): RebarSpec {
  const result: RebarSpec = {
    raw: raw.trim(),
    grade: '',
    diameter: 0,
    unitWeight: 0,
    isValid: false
  }

  if (!raw || raw.trim() === '') {
    return { ...result, isValid: false }
  }

  const text = raw.trim()

  let grade = ''
  for (const pattern of GRADE_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      grade = match[0].toUpperCase()
      break
    }
  }

  let diameter = 0
  for (const pattern of DIAMETER_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      diameter = parseFloat(match[1])
      break
    }
  }

  if (diameter === 0) {
    const numMatch = text.match(/(\d+(?:\.\d+)?)/)
    if (numMatch) {
      const num = parseFloat(numMatch[1])
      if (num >= 4 && num <= 60) {
        diameter = num
      }
    }
  }

  if (diameter > 0 && diameter < 100) {
    if (grade === '') {
      grade = 'HRB400E'
    }
    const unitWeight = 0.00617 * diameter * diameter
    result.grade = grade
    result.diameter = Math.round(diameter * 100) / 100
    result.unitWeight = Math.round(unitWeight * 10000) / 10000
    result.isValid = STANDARD_DIAMETERS.some((d) => Math.abs(d - diameter) < 0.01) || diameter > 0
  }

  if (diameter === 0 && grade === '') {
    result.isValid = false
  }

  return result
}

export function formatSpec(spec: RebarSpec): string {
  if (!spec.isValid) return spec.raw
  return `${spec.grade} Φ${spec.diameter}`
}

export function parseQuantity(text: string, unitHint?: string): { qty: number; unit: string } {
  const clean = text.trim().replace(/[,，]/g, '')

  const numMatch = clean.match(/(\d+(?:\.\d+)?)/)
  if (!numMatch) return { qty: 0, unit: unitHint || '根' }

  const qty = parseFloat(numMatch[0])

  if (/吨|t|T/.test(clean)) {
    return { qty, unit: '吨' }
  }
  if (/米|m|M/.test(clean) && !/毫米|mm/.test(clean)) {
    return { qty, unit: '米' }
  }
  if (/根|条|支|个/.test(clean)) {
    return { qty, unit: '根' }
  }

  return { qty, unit: unitHint || '根' }
}

export function isBadRow(row: Record<string, any>): { isBad: boolean; reason: string } {
  const specRaw = row['规格'] || row['spec'] || row['钢筋规格'] || ''
  const spec = parseRebarSpec(String(specRaw))

  if (!spec.isValid || spec.diameter === 0) {
    return { isBad: true, reason: `无法解析钢筋规格：${specRaw}` }
  }

  const qtyRaw = row['数量'] || row['qty'] || row['下料数量'] || row['实收数量'] || '0'
  const { qty } = parseQuantity(String(qtyRaw))

  if (qty <= 0) {
    return { isBad: true, reason: `数量无效：${qtyRaw}` }
  }

  return { isBad: false, reason: '' }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

export function getNowString(): string {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}
