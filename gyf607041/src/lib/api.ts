import type {
  Baby, BabyDetail, DataStatus, TemperatureRecord, LeavePhoto,
  RectificationRecord, ImportAudit, OperationLog, ImportResult, ApiResponse
} from '@shared/types';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const text = await res.text();
  const data: ApiResponse<T> = text ? JSON.parse(text) : { success: false };
  if (!data.success) {
    throw new Error(data.error || data.message || '请求失败');
  }
  return data.data as T;
}

export const api = {
  async getBabies(status?: DataStatus, search?: string): Promise<{ babies: Baby[]; stats: Record<string, number> }> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    const qs = params.toString();
    return request<{ babies: Baby[]; stats: Record<string, number> }>(`/api/babies${qs ? '?' + qs : ''}`);
  },

  async getStats(): Promise<Record<string, number>> {
    return request<Record<string, number>>('/api/babies/stats');
  },

  async getBabyDetail(id: string): Promise<BabyDetail> {
    return request<BabyDetail>(`/api/babies/${id}`);
  },

  async updateBaby(id: string, data: Partial<Baby>): Promise<Baby> {
    return request<Baby>(`/api/babies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async addTemperature(babyId: string, data: Omit<TemperatureRecord, 'id' | 'babyId' | 'isAbnormal'> & { isAbnormal?: boolean }): Promise<TemperatureRecord> {
    return request<TemperatureRecord>(`/api/babies/${babyId}/temperatures`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async addRectification(babyId: string, data: Omit<RectificationRecord, 'id' | 'babyId'>): Promise<RectificationRecord> {
    return request<RectificationRecord>(`/api/babies/${babyId}/rectifications`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateRectification(babyId: string, recordId: string, data: Partial<RectificationRecord>): Promise<RectificationRecord> {
    return request<RectificationRecord>(`/api/babies/${babyId}/rectifications/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async uploadPhoto(babyId: string, file: File, description = ''): Promise<LeavePhoto> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('description', description);
    const res = await fetch(`/api/babies/${babyId}/photos`, { method: 'POST', body: fd });
    const data: ApiResponse<LeavePhoto> = await res.json();
    if (!data.success) throw new Error(data.error || '上传失败');
    return data.data!;
  },

  async updatePhoto(babyId: string, photoId: string, data: Partial<LeavePhoto>): Promise<LeavePhoto> {
    return request<LeavePhoto>(`/api/babies/${babyId}/photos/${photoId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async importExcel(file: File): Promise<ImportResult> {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/audit/import/excel', { method: 'POST', body: fd });
    const data: ApiResponse<ImportResult> = await res.json();
    if (!data.success && res.status !== 206) {
      throw new Error(data.error || data.message || '导入失败');
    }
    return data.data!;
  },

  async getImportAudits(): Promise<ImportAudit[]> {
    return request<ImportAudit[]>('/api/audit/imports');
  },

  async getOperationLogs(targetType?: string, targetId?: string): Promise<OperationLog[]> {
    const params = new URLSearchParams();
    if (targetType) params.set('targetType', targetType);
    if (targetId) params.set('targetId', targetId);
    const qs = params.toString();
    return request<OperationLog[]>(`/api/audit/operations${qs ? '?' + qs : ''}`);
  },
};
