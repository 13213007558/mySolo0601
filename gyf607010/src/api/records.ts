import type {
  MilkRecord,
  ChangeHistory,
  CreateRecordInput,
  UpdateRecordInput,
  RecordFilter,
  ReviewPayload,
  WithdrawPayload,
  RecordWithHistory,
} from '@shared/types';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(data?.error || data?.errors?.join('；') || `请求失败 (${res.status})`);
  }
  return data as T;
}

export const recordsApi = {
  list: (filter: RecordFilter = {}) => {
    const qs = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v) qs.set(k, String(v));
    });
    const url = qs.toString() ? `/api/records?${qs.toString()}` : '/api/records';
    return request<MilkRecord[]>(url);
  },
  get: (id: string) => request<RecordWithHistory>(`/api/records/${id}`),
  getHistory: (id: string) => request<ChangeHistory[]>(`/api/records/${id}/history`),
  create: (body: CreateRecordInput) =>
    request<MilkRecord>('/api/records', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: UpdateRecordInput) =>
    request<MilkRecord>(`/api/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  review: (id: string, body: ReviewPayload) =>
    request<MilkRecord>(`/api/records/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  withdraw: (id: string, body: WithdrawPayload) =>
    request<MilkRecord>(`/api/records/${id}/withdraw`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
