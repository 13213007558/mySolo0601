import type {
  User,
  Baby,
  SupplyItem,
  BorrowReturnRecord,
  AuditLog,
  UserRole,
} from '../../shared/types'

export const STORE_ID = 'store-001'

export const mockUsers: User[] = [
  {
    id: 'u-waiter-01',
    name: '李小芳',
    role: 'waiter',
    phone: '13812345678',
    storeId: STORE_ID,
  },
  {
    id: 'u-waiter-02',
    name: '王小刚',
    role: 'waiter',
    phone: '13987654321',
    storeId: STORE_ID,
  },
  {
    id: 'u-kitchen-01',
    name: '张大厨',
    role: 'kitchen',
    phone: '13600001111',
    storeId: STORE_ID,
  },
  {
    id: 'u-manager-01',
    name: '陈店长',
    role: 'manager',
    phone: '13700002222',
    storeId: STORE_ID,
  },
  {
    id: 'u-supervisor-01',
    name: '赵主管',
    role: 'supervisor',
    phone: '13500003333',
    storeId: STORE_ID,
  },
]

export const mockBabies: Baby[] = [
  {
    id: 'b-001',
    name: '小乐乐',
    className: '海豚班',
    parentPhone: '13800001001',
    parentName: '乐乐妈妈',
    ageMonths: 18,
  },
  {
    id: 'b-002',
    name: '小米粒',
    className: '海豚班',
    parentPhone: '13800001002',
    parentName: '米粒爸爸',
    ageMonths: 24,
  },
  {
    id: 'b-003',
    name: '豆包',
    className: '海豚班',
    parentPhone: '138-0000-1003',
    parentName: '豆包奶奶',
    ageMonths: 15,
  },
  {
    id: 'b-004',
    name: '糖糖',
    className: '企鹅班',
    parentPhone: '(138)00001004',
    parentName: '糖糖妈妈',
    ageMonths: 30,
  },
  {
    id: 'b-005',
    name: '团团',
    className: '企鹅班',
    parentPhone: '138 0000 1005',
    parentName: '团团爷爷',
    ageMonths: 20,
  },
  {
    id: 'b-006',
    name: '圆圆',
    className: '企鹅班',
    parentPhone: '13800001006',
    parentName: '圆圆妈妈',
    ageMonths: 28,
  },
  {
    id: 'b-007',
    name: '布丁',
    className: '考拉班',
    parentPhone: '13800001007',
    parentName: '布丁爸爸',
    ageMonths: 12,
  },
  {
    id: 'b-008',
    name: '果冻',
    className: '考拉班',
    parentPhone: '13800001008',
    parentName: '果冻外婆',
    ageMonths: 10,
  },
]

export const mockItems: SupplyItem[] = [
  { id: 'i-001', code: 'BL-0001', name: '蓝色安抚奶嘴', category: '奶嘴', status: 'clean' },
  { id: 'i-002', code: 'BL-0002', name: '硅胶软勺套装', category: '餐具', status: 'in_use', babyId: 'b-001' },
  { id: 'i-003', code: 'BL-0003', name: '不锈钢辅食碗', category: '餐具', status: 'dirty' },
  { id: 'i-004', code: 'BL-0004', name: 'PP喝水杯', category: '水杯', status: 'clean' },
  { id: 'i-005', code: 'BL-0005', name: '硅胶围兜', category: '围兜', status: 'in_use', babyId: 'b-002' },
  { id: 'i-006', code: 'BL-0006', name: '奶瓶240ml', category: '奶瓶', status: 'exception' },
  { id: 'i-007', code: 'BL-0007', name: '磨牙咬胶', category: '牙胶', status: 'clean' },
  { id: 'i-008', code: 'BL-0008', name: '恒温感温勺', category: '餐具', status: 'in_use', babyId: 'b-004' },
  { id: 'i-009', code: 'BL-0009', name: '防滑学习筷', category: '餐具', status: 'quarantine' },
  { id: 'i-010', code: 'BL-0010', name: '吸管杯360ml', category: '水杯', status: 'clean' },
  { id: 'i-011', code: 'BL-0011', name: '硅胶餐盘', category: '餐具', status: 'in_use', babyId: 'b-005' },
  { id: 'i-012', code: 'BL-0012', name: '便携奶粉格', category: '配件', status: 'in_use', babyId: 'b-008' },
]

export const mockRecords: BorrowReturnRecord[] = [
  {
    id: 'r-001',
    itemId: 'i-002',
    itemCode: 'BL-0002',
    itemName: '硅胶软勺套装',
    babyId: 'b-001',
    babyName: '小乐乐',
    className: '海豚班',
    action: 'borrow',
    source: 'scan',
    processorId: 'u-waiter-01',
    processorName: '李小芳',
    processorRole: 'waiter',
    storeId: STORE_ID,
    handledAt: '2026-06-08T08:30:00.000Z',
    hasException: false,
  },
  {
    id: 'r-002',
    itemId: 'i-005',
    itemCode: 'BL-0005',
    itemName: '硅胶围兜',
    babyId: 'b-002',
    babyName: '小米粒',
    className: '海豚班',
    action: 'borrow',
    source: 'scan',
    processorId: 'u-waiter-01',
    processorName: '李小芳',
    processorRole: 'waiter',
    storeId: STORE_ID,
    handledAt: '2026-06-08T08:35:00.000Z',
    hasException: false,
  },
  {
    id: 'r-003',
    itemId: 'i-006',
    itemCode: 'BL-0006',
    itemName: '奶瓶240ml',
    babyId: 'b-003',
    babyName: '豆包',
    className: '海豚班',
    action: 'return',
    source: 'scan',
    processorId: 'u-waiter-02',
    processorName: '王小刚',
    processorRole: 'waiter',
    storeId: STORE_ID,
    handledAt: '2026-06-08T10:15:00.000Z',
    hasException: true,
    exceptionType: '损坏',
    exceptionNote: '奶嘴有裂痕，需要更换',
    exceptionResolved: false,
  },
  {
    id: 'r-004',
    itemId: 'i-008',
    itemCode: 'BL-0008',
    itemName: '恒温感温勺',
    babyId: 'b-004',
    babyName: '糖糖',
    className: '企鹅班',
    action: 'borrow',
    source: 'scan',
    processorId: 'u-waiter-02',
    processorName: '王小刚',
    processorRole: 'waiter',
    storeId: STORE_ID,
    handledAt: '2026-06-08T09:00:00.000Z',
    hasException: false,
  },
  {
    id: 'r-005',
    itemId: 'i-011',
    itemCode: 'BL-0011',
    itemName: '硅胶餐盘',
    babyId: 'b-005',
    babyName: '团团',
    className: '企鹅班',
    action: 'borrow',
    source: 'scan',
    processorId: 'u-waiter-01',
    processorName: '李小芳',
    processorRole: 'waiter',
    storeId: STORE_ID,
    handledAt: '2026-06-08T09:10:00.000Z',
    hasException: false,
  },
  {
    id: 'r-006',
    itemId: 'i-003',
    itemCode: 'BL-0003',
    itemName: '不锈钢辅食碗',
    babyId: 'b-006',
    babyName: '圆圆',
    className: '企鹅班',
    action: 'return',
    source: 'scan',
    processorId: 'u-waiter-02',
    processorName: '王小刚',
    processorRole: 'waiter',
    storeId: STORE_ID,
    handledAt: '2026-06-08T11:20:00.000Z',
    hasException: false,
  },
  {
    id: 'r-007',
    itemId: 'i-009',
    itemCode: 'BL-0009',
    itemName: '防滑学习筷',
    babyId: 'b-007',
    babyName: '布丁',
    className: '考拉班',
    action: 'return',
    source: 'manual',
    processorId: 'u-waiter-01',
    processorName: '李小芳',
    processorRole: 'waiter',
    storeId: STORE_ID,
    handledAt: '2026-06-08T10:45:00.000Z',
    hasException: true,
    exceptionType: '丢失',
    exceptionNote: '宝宝用餐后未找到，疑似被家长误带',
    exceptionResolved: true,
    resolvedBy: 'u-manager-01',
    resolvedByName: '陈店长',
    resolvedAt: '2026-06-08T11:00:00.000Z',
    resolvedNote: '已联系家长确认，明天送回，先行隔离',
    remark: '手工补录：扫码设备临时故障',
  },
  {
    id: 'r-008',
    itemId: 'i-012',
    itemCode: 'BL-0012',
    itemName: '便携奶粉格',
    babyId: 'b-008',
    babyName: '果冻',
    className: '考拉班',
    action: 'borrow',
    source: 'manual',
    processorId: 'u-waiter-02',
    processorName: '王小刚',
    processorRole: 'waiter',
    storeId: STORE_ID,
    handledAt: '2026-06-08T11:30:00.000Z',
    hasException: false,
    remark: '手工补录：家长带宝宝临时到店，扫码枪不在手边',
  },
]

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'a-001',
    userId: 'u-manager-01',
    userName: '陈店长',
    userRole: 'manager',
    action: 'export_records',
    targetType: 'BorrowReturnRecord',
    targetId: 'all',
    accessedAt: '2026-06-08T12:00:00.000Z',
    exportContext: true,
    note: '导出了今日借还记录清单，包含脱敏手机号',
  },
]

class DataStore {
  private users: User[] = [...mockUsers]
  private babies: Baby[] = [...mockBabies]
  private items: SupplyItem[] = [...mockItems]
  private records: BorrowReturnRecord[] = [...mockRecords]
  private auditLogs: AuditLog[] = [...mockAuditLogs]
  private listeners: Set<() => void> = new Set()

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((l) => l())
  }

  getUsers(): User[] {
    return this.users
  }

  getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id)
  }

  getBabies(): Baby[] {
    return this.babies
  }

  getBabyById(id: string): Baby | undefined {
    return this.babies.find((b) => b.id === id)
  }

  getItems(): SupplyItem[] {
    return this.items
  }

  getItemById(id: string): SupplyItem | undefined {
    return this.items.find((i) => i.id === id)
  }

  getItemByCode(code: string): SupplyItem | undefined {
    return this.items.find((i) => i.code === code)
  }

  getRecords(): BorrowReturnRecord[] {
    return [...this.records].sort((a, b) => new Date(b.handledAt).getTime() - new Date(a.handledAt).getTime())
  }

  getRecordsByBabyId(babyId: string): BorrowReturnRecord[] {
    return this.getRecords().filter((r) => r.babyId === babyId)
  }

  getRecordsByClassName(className: string): BorrowReturnRecord[] {
    return this.getRecords().filter((r) => r.className === className)
  }

  getUnresolvedExceptionRecords(): BorrowReturnRecord[] {
    return this.getRecords().filter((r) => r.hasException && !r.exceptionResolved)
  }

  addRecord(record: BorrowReturnRecord): BorrowReturnRecord {
    this.records.push(record)
    if (record.action === 'borrow') {
      const item = this.items.find((i) => i.id === record.itemId)
      if (item) {
        item.status = 'in_use'
        item.babyId = record.babyId
      }
    } else if (record.action === 'return') {
      const item = this.items.find((i) => i.id === record.itemId)
      if (item) {
        if (record.hasException) {
          item.status = 'exception'
        } else {
          item.status = 'dirty'
          item.lastCleanedAt = undefined
        }
        item.babyId = undefined
      }
    }
    this.notify()
    return record
  }

  resolveException(
    recordId: string,
    resolverId: string,
    resolverName: string,
    note: string,
  ): BorrowReturnRecord | undefined {
    const record = this.records.find((r) => r.id === recordId)
    if (!record) return undefined
    record.exceptionResolved = true
    record.resolvedBy = resolverId
    record.resolvedByName = resolverName
    record.resolvedAt = new Date().toISOString()
    record.resolvedNote = note
    const item = this.items.find((i) => i.id === record.itemId)
    if (item) {
      item.status = 'quarantine'
      item.babyId = undefined
    }
    this.notify()
    return record
  }

  markItemClean(itemId: string): SupplyItem | undefined {
    const item = this.items.find((i) => i.id === itemId)
    if (item) {
      item.status = 'clean'
      item.lastCleanedAt = new Date().toISOString()
      this.notify()
    }
    return item
  }

  addAuditLog(log: AuditLog): void {
    this.auditLogs.push(log)
  }

  getAuditLogs(): AuditLog[] {
    return [...this.auditLogs].sort(
      (a, b) => new Date(b.accessedAt).getTime() - new Date(a.accessedAt).getTime(),
    )
  }

  getAuditLogsByExportContext(): AuditLog[] {
    return this.getAuditLogs().filter((l) => l.exportContext)
  }
}

export const db = new DataStore()

export const PRIVACY_MASK_RULES: Record<UserRole, { fields: string[]; pattern: 'middle' | 'last4' | 'full' | 'none' }> = {
  waiter: {
    fields: ['parentPhone', 'phone'],
    pattern: 'middle',
  },
  kitchen: {
    fields: ['parentPhone', 'phone'],
    pattern: 'middle',
  },
  manager: {
    fields: ['parentPhone', 'phone'],
    pattern: 'last4',
  },
  supervisor: {
    fields: [],
    pattern: 'none',
  },
}
