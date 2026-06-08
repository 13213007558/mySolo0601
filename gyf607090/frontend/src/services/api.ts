import axios from 'axios';
import type {
  Child,
  MilkRecord,
  RecordDetail,
  TherapyFeedback,
  SuspiciousRecord,
  RecordStatus,
  RecordSource,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export interface FilterParams {
  startDate?: string;
  endDate?: string;
  childId?: number;
  status?: RecordStatus;
  source?: RecordSource;
  page?: number;
  pageSize?: number;
}

export interface CreateRecordParams {
  childId: number;
  recordDate: string;
  amount: number;
  source: RecordSource;
  parentMessage?: string;
  paperNote?: string;
  operator: string;
}

export interface UpdateRecordParams {
  amount?: number;
  status?: RecordStatus;
  reason?: string;
  changeNote: string;
  operator: string;
}

export interface ReviewParams {
  newStatus: Exclude<RecordStatus, 'PENDING' | 'SUSPICIOUS'>;
  newAmount?: number;
  newReason: string;
  reviewNote: string;
  reviewer: string;
}

export interface FeedbackParams {
  recordId: number;
  childId: number;
  content: string;
  therapist: string;
}

export interface HandleSuspiciousParams {
  handledNote: string;
  handledBy: string;
  action: 'confirm' | 'reject';
  newAmount?: number;
  newReason?: string;
}

export const childApi = {
  list: () => api.get<Child[]>('/children'),
};

export const recordApi = {
  list: (params: FilterParams) =>
    api.get<{ data: MilkRecord[]; total: number; page: number; pageSize: number }>('/records', {
      params,
    }),
  detail: (id: number) => api.get<RecordDetail>(`/records/${id}`),
  create: (data: CreateRecordParams) => api.post<MilkRecord>('/records', data),
  update: (id: number, data: UpdateRecordParams) =>
    api.put<MilkRecord>(`/records/${id}`, data),
  review: (id: number, data: ReviewParams) =>
    api.post<MilkRecord>(`/records/${id}/review`, data),
  export: (params: FilterParams) =>
    api.get('/records/export/csv', { params, responseType: 'blob' }),
};

export const feedbackApi = {
  get: (recordId: number) => api.get<TherapyFeedback | null>(`/feedback/${recordId}`),
  save: (data: FeedbackParams) => api.post<TherapyFeedback>('/feedback', data),
};

export const suspiciousApi = {
  list: () => api.get<SuspiciousRecord[]>('/suspicious'),
  handle: (id: number, data: HandleSuspiciousParams) =>
    api.post<SuspiciousRecord>(`/suspicious/${id}/handle`, data),
};

export const statsApi = {
  summary: () =>
    api.get<{ total: number; pending: number; confirmed: number; reviewed: number; suspicious: number; rejected: number }>(
      '/stats/summary'
    ),
};
