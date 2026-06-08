export type UserRole = 'waiter' | 'kitchen' | 'manager' | 'supervisor'

export interface User {
  id: string
  name: string
  role: UserRole
  phone: string
  storeId: string
}

export interface Baby {
  id: string
  name: string
  className: string
  parentPhone: string
  parentName: string
  ageMonths: number
}

export type ItemStatus = 'clean' | 'in_use' | 'dirty' | 'exception' | 'quarantine'
export type BorrowReturnAction = 'borrow' | 'return'
export type RecordSource = 'scan' | 'manual'

export interface SupplyItem {
  id: string
  code: string
  name: string
  category: string
  status: ItemStatus
  babyId?: string
  lastCleanedAt?: string
}

export interface BorrowReturnRecord {
  id: string
  itemId: string
  itemCode: string
  itemName: string
  babyId: string
  babyName: string
  className: string
  action: BorrowReturnAction
  source: RecordSource
  processorId: string
  processorName: string
  processorRole: UserRole
  storeId: string
  handledAt: string
  hasException: boolean
  exceptionType?: string
  exceptionNote?: string
  exceptionResolved?: boolean
  resolvedBy?: string
  resolvedByName?: string
  resolvedAt?: string
  resolvedNote?: string
  remark?: string
}

export interface PrivacyFieldMaskConfig {
  role: UserRole
  fields: string[]
  maskPattern: 'middle' | 'last4' | 'full' | 'none'
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  userRole: UserRole
  action: string
  targetType: string
  targetId: string
  fieldName?: string
  originalValue?: string
  accessedAt: string
  exportContext?: boolean
  note?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  partialSuccess?: boolean
  failedItems?: Array<{ id: string; reason: string }>
}

export interface ClassSummary {
  className: string
  babyCount: number
  itemsInUse: number
  itemsClean: number
  itemsDirty: number
  itemsException: number
}
