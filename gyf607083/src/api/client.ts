import { 
  ClassWithStats, 
  Baby, 
  SupplyRecord, 
  AuditLog, 
  User, 
  HandleExceptionRequest, 
  PartialSuccessResponse, 
  CreateManualRecordRequest,
  ExportOptions,
  UserRole
} from '../../shared/types';

const API_BASE = '/api';

let currentRole: UserRole = 'customer_service';
let currentUserId: string = 'user3';

export function setCurrentRole(role: UserRole) {
  currentRole = role;
}

export function setCurrentUserId(id: string) {
  currentUserId = id;
}

export function getCurrentRole(): UserRole {
  return currentRole;
}

export function getCurrentUserId(): string {
  return currentUserId;
}

async function request<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    'x-user-role': currentRole,
    'x-user-id': currentUserId,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || '请求失败');
  }

  return data;
}

export const api = {
  classes: {
    getAll: () => request<{ success: boolean; data: ClassWithStats[] }>('/classes'),
    getById: (id: string) => request<{ success: boolean; data: ClassWithStats & { babies: Baby[] } }>(`/classes/${id}`),
    getStats: (id: string) => request<{ success: boolean; data: any }>(`/classes/${id}/stats`),
  },

  babies: {
    getAll: (classId?: string) => 
      request<{ success: boolean; data: Baby[] }>(`/babies${classId ? `?classId=${classId}` : ''}`),
    getById: (id: string) => 
      request<{ success: boolean; data: Baby & { records: SupplyRecord[] } }>(`/babies/${id}`),
    getRecords: (id: string, status?: string) => 
      request<{ success: boolean; data: SupplyRecord[] }>(`/babies/${id}/records${status ? `?status=${status}` : ''}`),
  },

  supplyRecords: {
    getAll: (params?: { classId?: string; babyId?: string; status?: string; includeManual?: boolean }) => {
      const query = new URLSearchParams();
      if (params?.classId) query.append('classId', params.classId);
      if (params?.babyId) query.append('babyId', params.babyId);
      if (params?.status) query.append('status', params.status);
      if (params?.includeManual === false) query.append('includeManual', 'false');
      return request<{ success: boolean; data: SupplyRecord[] }>(`/supply-records${query.toString() ? `?${query.toString()}` : ''}`);
    },
    getById: (id: string) => request<{ success: boolean; data: SupplyRecord }>(`/supply-records/${id}`),
    getPending: () => request<{ success: boolean; data: SupplyRecord[] }>('/supply-records/pending'),
    getExceptions: () => request<{ success: boolean; data: SupplyRecord[] }>('/supply-records/exceptions'),
    handleException: (data: HandleExceptionRequest) => 
      request<PartialSuccessResponse>('/supply-records/handle', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    createManual: (data: CreateManualRecordRequest) =>
      request<{ success: boolean; data?: SupplyRecord; message: string }>('/supply-records/manual', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  audit: {
    getAll: (params?: { entityType?: string; entityId?: string; operatorId?: string; startTime?: string; endTime?: string }) => {
      const query = new URLSearchParams();
      if (params?.entityType) query.append('entityType', params.entityType);
      if (params?.entityId) query.append('entityId', params.entityId);
      if (params?.operatorId) query.append('operatorId', params.operatorId);
      if (params?.startTime) query.append('startTime', params.startTime);
      if (params?.endTime) query.append('endTime', params.endTime);
      return request<{ success: boolean; data: AuditLog[] }>(`/audit${query.toString() ? `?${query.toString()}` : ''}`);
    },
    getById: (id: string) => request<{ success: boolean; data: AuditLog }>(`/audit/${id}`),
    getByEntity: (entityType: string, entityId: string) => 
      request<{ success: boolean; data: AuditLog[] }>(`/audit/entity/${entityType}/${entityId}`),
  },

  export: {
    preview: (options: ExportOptions) =>
      request<{ success: boolean; data: { headers: string[]; rows: any[] } }>('/export/preview', {
        method: 'POST',
        body: JSON.stringify(options),
      }),
    excel: (options: ExportOptions) =>
      fetch(`${API_BASE}/export/excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentRole,
          'x-user-id': currentUserId,
        },
        body: JSON.stringify(options),
      }).then(res => {
        if (!res.ok) throw new Error('导出失败');
        return res.blob();
      }),
    json: (options: ExportOptions) =>
      fetch(`${API_BASE}/export/json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentRole,
          'x-user-id': currentUserId,
        },
        body: JSON.stringify(options),
      }).then(res => {
        if (!res.ok) throw new Error('导出失败');
        return res.blob();
      }),
  },

  users: {
    getAll: (role?: string) =>
      request<{ success: boolean; data: User[] }>(`/users${role ? `?role=${role}` : ''}`),
    getById: (id: string) => request<{ success: boolean; data: User }>(`/users/${id}`),
  },

  health: () => request<{ success: boolean; message: string }>('/health'),
};
