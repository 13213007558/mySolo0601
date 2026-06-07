import axios from 'axios';
import type {
  Authorization, SummaryStats, PaginatedResponse, AuditLog,
  ExportRecord, ExportDiffItem, CorrectionRecord, ExportResult
} from 'shared/types.js';

const api = axios.create({ baseURL: '/api', timeout: 15000 });

export interface AuthFilter {
  parentPhone?: string;
  authStatus?: string;
  storeName?: string;
  authType?: string;
  page?: number;
  pageSize?: number;
}

export const authApi = {
  getSummary: (): Promise<SummaryStats> => api.get('/authorizations/summary').then(r => r.data),
  list: (filter: AuthFilter): Promise<PaginatedResponse<Authorization>> =>
    api.get('/authorizations', { params: filter }).then(r => r.data),
  detail: (id: string): Promise<Authorization & { audits: AuditLog[] }> =>
    api.get(`/authorizations/${id}`).then(r => r.data),
  correct: (id: string, body: { beforeData: Record<string, any>; afterData: Record<string, any>; reason: string; operator: string }) =>
    api.post(`/authorizations/${id}/correct`, body).then(r => r.data),
};

export const exportApi = {
  csv: (body: { ids: string[]; operator: string; filterCriteria: Record<string, any>; pageCount: number; allowPartial?: boolean }): Promise<ExportResult> =>
    api.post('/export/csv', body).then(r => r.data),
  markdown: (body: { ids: string[]; operator: string; filterCriteria: Record<string, any>; pageCount: number; allowPartial?: boolean }): Promise<ExportResult> =>
    api.post('/export/markdown', body).then(r => r.data),
  records: (): Promise<ExportRecord[]> => api.get('/export/records').then(r => r.data),
  diff: (id: string): Promise<ExportDiffItem[]> => api.get(`/export/${id}/diff`).then(r => r.data),
};

export const auditApi = {
  timeline: (params?: { action?: string; operator?: string; limit?: number }): Promise<AuditLog[]> =>
    api.get('/audit/timeline', { params }).then(r => r.data),
  failurePaths: (): Promise<any[]> => api.get('/audit/failure-paths').then(r => r.data),
};

export const correctionApi = {
  pending: (): Promise<CorrectionRecord[]> => api.get('/corrections/pending').then(r => r.data),
};

export function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
