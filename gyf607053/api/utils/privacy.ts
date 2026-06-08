import type { UserRole } from '../../shared/types'
import { PRIVACY_MASK_RULES } from '../data/store.js'
import type { AuditLog } from '../../shared/types'
import { db } from '../data/store.js'

export function maskPhone(phone: string, pattern: 'middle' | 'last4' | 'full' | 'none'): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (pattern === 'none') return phone
  if (pattern === 'full') return '***'
  if (digits.length < 7) return phone.replace(/./g, '*')
  if (pattern === 'last4') {
    return digits.slice(0, 3) + '****' + digits.slice(-4)
  }
  return digits.slice(0, 3) + '****' + digits.slice(-2)
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '')
}

export function validatePhoneFormat(phone: string): boolean {
  const normalized = normalizePhone(phone)
  return /^1[3-9]\d{9}$/.test(normalized)
}

export interface PhoneBatchResult {
  valid: Array<{ original: string; normalized: string }>
  invalid: Array<{ original: string; reason: string }>
}

export function batchValidatePhones(phones: string[]): PhoneBatchResult {
  const result: PhoneBatchResult = { valid: [], invalid: [] }
  phones.forEach((p) => {
    const normalized = normalizePhone(p)
    if (validatePhoneFormat(normalized)) {
      result.valid.push({ original: p, normalized })
    } else {
      result.invalid.push({ original: p, reason: `格式不符合要求：已清洗为 ${normalized || '[空]'}` })
    }
  })
  return result
}

export function applyPrivacyMask<T extends Record<string, unknown>>(
  obj: T,
  role: UserRole,
  context: { userId: string; userName: string; isExport: boolean },
): T {
  const rule = PRIVACY_MASK_RULES[role]
  if (rule.pattern === 'none' || rule.fields.length === 0) {
    return obj
  }
  const masked = { ...obj } as Record<string, unknown>
  for (const field of rule.fields) {
    if (typeof masked[field] === 'string') {
      const originalValue = masked[field] as string
      masked[field] = maskPhone(originalValue, rule.pattern)
      if (context.isExport) {
        const auditLog: AuditLog = {
          id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId: context.userId,
          userName: context.userName,
          userRole: role,
          action: 'privacy_field_access_export',
          targetType: obj.constructor?.name || 'Object',
          targetId: String((obj as unknown as { id?: string }).id || 'unknown'),
          fieldName: field,
          originalValue,
          accessedAt: new Date().toISOString(),
          exportContext: true,
          note: `导出时对字段 ${field} 应用脱敏规则 ${rule.pattern}`,
        }
        db.addAuditLog(auditLog)
      }
    }
  }
  return masked as unknown as T
}

export function applyPrivacyMaskToList<T extends Record<string, unknown>>(
  list: T[],
  role: UserRole,
  context: { userId: string; userName: string; isExport: boolean },
): T[] {
  return list.map((item) => applyPrivacyMask(item, role, context))
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}
