import type {
  MorningReview,
  Baby,
  ExportRow,
  AuditLog,
  ApiResponse,
} from '@shared/types';

const BASE = '/api/reviews';

async function handle<T>(res: Response): Promise<T> {
  const data = (await res.json()) as ApiResponse<T>;
  if (!data.success || !data.data) throw new Error(data.error || '请求失败');
  return data.data;
}

export const api = {
  getExport: () => fetch(`${BASE}/export`).then((r) => handle<ExportRow[]>(r)),
  getBabies: () => fetch('/api/reviews/babies').then((r) => handle<Baby[]>(r)),
  getReviews: () => fetch(BASE).then((r) => handle<MorningReview[]>(r)),
  getReview: (id: string) => fetch(`${BASE}/${id}`).then((r) => handle<MorningReview>(r)),
  getAudit: (id: string) => fetch(`${BASE}/${id}/audit`).then((r) => handle<AuditLog[]>(r)),
  advanceStage: (id: string, stage: MorningReview['reviewStage'], operator: string) =>
    fetch(`${BASE}/${id}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage, operator }),
    }).then((r) => handle<MorningReview>(r)),
  supplement: (
    id: string,
    payload: {
      temperature?: number;
      leaveReason?: string;
      operator: string;
      operatorRole: AuditLog['operatorRole'];
    },
  ) =>
    fetch(`${BASE}/${id}/supplement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((r) => handle<MorningReview>(r)),
  submitPartial: (id: string, operator: string, note: string) =>
    fetch(`${BASE}/${id}/submit-partial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator, note }),
    }).then((r) => handle<MorningReview>(r)),
};
