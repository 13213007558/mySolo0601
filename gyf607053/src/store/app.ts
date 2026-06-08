import { create } from 'zustand'
import type {
  User,
  UserRole,
  Baby,
  BorrowReturnRecord,
  SupplyItem,
  ClassSummary,
  AuditLog,
} from '../../shared/types'

export const ROLE_LABELS: Record<UserRole, string> = {
  waiter: '现场服务员',
  kitchen: '厨房/后场',
  manager: '餐厅店长',
  supervisor: '主管',
}

export const STATUS_LABELS: Record<string, string> = {
  clean: '已消毒',
  in_use: '使用中',
  dirty: '待清洗',
  exception: '异常',
  quarantine: '隔离中',
}

export const STATUS_COLORS: Record<string, string> = {
  clean: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  in_use: 'bg-sky-100 text-sky-700 border-sky-200',
  dirty: 'bg-amber-100 text-amber-700 border-amber-200',
  exception: 'bg-rose-100 text-rose-700 border-rose-200',
  quarantine: 'bg-violet-100 text-violet-700 border-violet-200',
}

interface AppState {
  currentUser: User | null
  babies: Baby[]
  records: BorrowReturnRecord[]
  items: SupplyItem[]
  classSummaries: ClassSummary[]
  auditLogs: AuditLog[]
  unresolvedExceptions: BorrowReturnRecord[]
  liveConnected: boolean
  setCurrentUser: (u: User | null) => void
  setBabies: (b: Baby[]) => void
  setRecords: (r: BorrowReturnRecord[]) => void
  setItems: (i: SupplyItem[]) => void
  setClassSummaries: (c: ClassSummary[]) => void
  setAuditLogs: (l: AuditLog[]) => void
  setLiveConnected: (c: boolean) => void
  applySnapshot: (data: {
    records?: BorrowReturnRecord[]
    items?: SupplyItem[]
    babies?: Baby[]
    unresolved?: BorrowReturnRecord[]
  }) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  babies: [],
  records: [],
  items: [],
  classSummaries: [],
  auditLogs: [],
  unresolvedExceptions: [],
  liveConnected: false,
  setCurrentUser: (u) => set({ currentUser: u }),
  setBabies: (babies) => set({ babies }),
  setRecords: (records) =>
    set({
      records,
      unresolvedExceptions: records.filter((r) => r.hasException && !r.exceptionResolved),
    }),
  setItems: (items) => set({ items }),
  setClassSummaries: (classSummaries) => set({ classSummaries }),
  setAuditLogs: (auditLogs) => set({ auditLogs }),
  setLiveConnected: (liveConnected) => set({ liveConnected }),
  applySnapshot: (data) =>
    set((state) => {
      const records = data.records || state.records
      return {
        records,
        items: data.items || state.items,
        babies: data.babies || state.babies,
        unresolvedExceptions:
          data.unresolved || records.filter((r) => r.hasException && !r.exceptionResolved),
      }
    }),
}))
