import axios from 'axios';

const http = axios.create({
  baseURL: '/',
  timeout: 15000,
});

export interface Baby {
  id: number;
  name: string;
  room_no: string;
  bed_no: string;
  mother_name?: string;
}

export interface MilkRecord {
  id: number;
  baby_id: number;
  baby_name?: string;
  room_no?: string;
  bed_no?: string;
  mother_name?: string;
  record_date: string;
  record_time: string;
  shift: string;
  milk_amount: number;
  milk_type: string;
  photo_path?: string;
  status: 'pending' | 'normal' | 'abnormal';
  abnormal_reason?: string;
  handler?: string;
  reviewer?: string;
  review_note?: string;
  review_time?: string;
  created_at?: string;
  updated_at?: string;
  is_dirty?: number;
  dirty_reason?: string;
  photo_missing?: number;
  dirty_flag?: string;
  issues?: string[];
}

export interface PageResult<T> {
  total: number;
  page: number;
  pageSize: number;
  list: T[];
}

export interface QueryParams {
  baby_id?: string;
  record_date_from?: string;
  record_date_to?: string;
  status?: string;
  shift?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export const api = {
  getBabies: () => http.get<Baby[]>('/api/babies').then(r => r.data),
  getRecords: (params: QueryParams) =>
    http.get<PageResult<MilkRecord>>('/api/records', { params }).then(r => r.data),
  getRecord: (id: number | string) =>
    http.get<MilkRecord>(`/api/records/${id}`).then(r => r.data),
  createRecord: (data: Partial<MilkRecord>) =>
    http.post<MilkRecord>('/api/records', data).then(r => r.data),
  updateRecord: (id: number | string, data: Partial<MilkRecord>) =>
    http.put<MilkRecord>(`/api/records/${id}`, data).then(r => r.data),
  reviewRecord: (id: number | string, data: {
    status?: string;
    reviewer?: string;
    review_note?: string;
    abnormal_reason?: string;
  }) => http.post<MilkRecord>(`/api/records/${id}/review`, data).then(r => r.data),
  markDirty: (id: number | string, reason: string) =>
    http.post(`/api/records/${id}/mark-dirty`, { reason }).then(r => r.data),
  deleteRecord: (id: number | string) =>
    http.delete(`/api/records/${id}`).then(r => r.data),
  uploadPhoto: (file: File) => {
    const form = new FormData();
    form.append('photo', file);
    return http.post<{ url: string; filename: string; size: number }>(
      '/api/upload/photo', form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ).then(r => r.data);
  },
  getStats: () => http.get('/api/records/summary/stats').then(r => r.data),
  getExportUrl: (params: QueryParams) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
    });
    return `/api/export/records?${qs.toString()}`;
  },
};

export const STATUS_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '待复核', value: 'pending' },
  { label: '正常', value: 'normal' },
  { label: '异常', value: 'abnormal' },
];

export const STATUS_MAP: Record<string, { text: string; color: string }> = {
  pending: { text: '待复核', color: 'gold' },
  normal: { text: '正常', color: 'green' },
  abnormal: { text: '异常', color: 'red' },
};

export const SHIFT_OPTIONS = [
  { label: '全部班次', value: 'all' },
  { label: '白班', value: '白班' },
  { label: '小夜', value: '小夜' },
  { label: '大夜', value: '大夜' },
];
