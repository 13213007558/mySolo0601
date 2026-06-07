import type {
  InfantRecord,
  AuditLog,
  RecordFilters,
  AuditFilters,
  ExportOptions,
  ExportReport,
} from '@shared/types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = (await res.json()) as ApiResponse<T>;
  if (!body.success || !body.data) {
    throw new Error(body.error || '请求失败');
  }
  return body.data;
}

export const recordsApi = {
  list: (filters?: RecordFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v) params.set(k, String(v));
    });
    return request<InfantRecord[]>(`/api/records?${params.toString()}`);
  },
  get: (id: string) => request<InfantRecord>(`/api/records/${id}`),
  create: (data: Partial<InfantRecord>) =>
    request<InfantRecord>('/api/records', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<InfantRecord>) =>
    request<InfantRecord>(`/api/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  review: (id: string, operator: string) =>
    request<InfantRecord>(`/api/records/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ operator }),
    }),
};

export const auditApi = {
  list: (filters?: AuditFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v) params.set(k, String(v));
    });
    return request<AuditLog[]>(`/api/audit?${params.toString()}`);
  },
  byRecord: (recordId: string) =>
    request<AuditLog[]>(`/api/audit/record/${recordId}`),
};

export const exportApi = {
  export: (opts: ExportOptions) =>
    request<ExportReport>('/api/export', {
      method: 'POST',
      body: JSON.stringify(opts),
    }),
};
