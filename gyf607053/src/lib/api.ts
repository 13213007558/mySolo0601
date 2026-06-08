import type {
  User,
  Baby,
  BorrowReturnRecord,
  SupplyItem,
  ClassSummary,
  AuditLog,
  ApiResponse,
  BorrowReturnAction,
} from '../../shared/types'
import { useAppStore } from '../store/app'

const API_BASE = '/api'

function getAuthHeaders(): Record<string, string> {
  const user = useAppStore.getState().currentUser
  if (!user) return {}
  return {
    'x-user-id': user.id,
    'x-user-name': encodeURIComponent(user.name),
    'x-user-role': user.role,
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> | undefined),
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (path.includes('/export')) {
    return { success: true } as ApiResponse<T>
  }
  return (await res.json()) as ApiResponse<T>
}

export const api = {
  async listUsers(): Promise<User[]> {
    const r = await request<{ id: string; name: string; role: string; storeId: string }[]>('/auth/users')
    return (r.data || []) as unknown as User[]
  },

  async login(userId: string): Promise<User | null> {
    const r = await request<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    })
    return r.data || null
  },

  async listBabies(): Promise<Baby[]> {
    const r = await request<Baby[]>('/core/babies')
    return r.data || []
  },

  async getBabyDetail(id: string): Promise<{ baby: Baby; records: BorrowReturnRecord[] } | null> {
    const r = await request<{ baby: Baby; records: BorrowReturnRecord[] }>(`/core/babies/${id}`)
    return r.data || null
  },

  async listClasses(): Promise<ClassSummary[]> {
    const r = await request<ClassSummary[]>('/core/classes')
    return r.data || []
  },

  async getClassDetail(name: string): Promise<{ className: string; babies: Baby[]; records: BorrowReturnRecord[] } | null> {
    const r = await request<{ className: string; babies: Baby[]; records: BorrowReturnRecord[] }>(
      `/core/classes/${encodeURIComponent(name)}`,
    )
    return r.data || null
  },

  async listItems(): Promise<SupplyItem[]> {
    const r = await request<SupplyItem[]>('/core/items')
    return r.data || []
  },

  async markItemClean(itemId: string): Promise<SupplyItem | null> {
    const r = await request<SupplyItem>(`/core/items/${itemId}/clean`, { method: 'POST' })
    return r.data || null
  },

  async listRecords(params?: {
    babyId?: string
    className?: string
    unresolved?: boolean
  }): Promise<BorrowReturnRecord[]> {
    const qs = new URLSearchParams()
    if (params?.babyId) qs.set('babyId', params.babyId)
    if (params?.className) qs.set('className', params.className)
    if (params?.unresolved) qs.set('unresolved', 'true')
    const r = await request<BorrowReturnRecord[]>(`/core/records${qs.toString() ? '?' + qs.toString() : ''}`)
    return r.data || []
  },

  async createRecord(payload: {
    itemId: string
    babyId: string
    action: BorrowReturnAction
    source?: 'scan' | 'manual'
    hasException?: boolean
    exceptionType?: string
    exceptionNote?: string
    remark?: string
  }): Promise<BorrowReturnRecord | null> {
    const r = await request<BorrowReturnRecord>('/core/records', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return r.data || null
  },

  async resolveException(recordId: string, note: string): Promise<BorrowReturnRecord | null> {
    const r = await request<BorrowReturnRecord>(`/core/records/${recordId}/resolve-exception`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    })
    return r.data || null
  },

  async batchImportBabies(items: Array<{
    name: string
    className: string
    parentPhone: string
    parentName: string
  }>): Promise<ApiResponse<{ imported: number; total: number }>> {
    return request('/core/babies/batch-import', {
      method: 'POST',
      body: JSON.stringify({ items }),
    })
  },

  async listAuditLogs(exportOnly?: boolean): Promise<AuditLog[]> {
    const r = await request<AuditLog[]>(`/core/audit-logs${exportOnly ? '?export=true' : ''}`)
    return r.data || []
  },

  buildExportUrl(): string {
    const user = useAppStore.getState().currentUser
    const qs = new URLSearchParams()
    if (user) {
      qs.set('userId', user.id)
      qs.set('userName', encodeURIComponent(user.name))
      qs.set('role', user.role)
    }
    return `${API_BASE}/core/records/export?${qs.toString()}`
  },

  exportRecords(): void {
    const a = document.createElement('a')
    a.href = api.buildExportUrl()
    a.download = ''
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  },

  subscribeEvents(onMessage: (type: string, data: unknown) => void): () => void {
    const es = new EventSource(`${API_BASE}/events/stream`)
    es.onopen = () => useAppStore.getState().setLiveConnected(true)
    es.onerror = () => useAppStore.getState().setLiveConnected(false)
    es.onmessage = null
    es.addEventListener('hello', (e) => onMessage('hello', JSON.parse(e.data)))
    es.addEventListener('snapshot', (e) => onMessage('snapshot', JSON.parse(e.data)))
    es.addEventListener('update', (e) => onMessage('update', JSON.parse(e.data)))
    return () => {
      es.close()
      useAppStore.getState().setLiveConnected(false)
    }
  },
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
