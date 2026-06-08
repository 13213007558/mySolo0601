import type {
  ApiResponse,
  AuthorizationRecord,
  AuthorizationRecordWithHistory,
  CreateRecordInput,
  SummaryStats,
  UpdateRecordInput,
} from '../../shared/types';

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(path, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    const json = (await res.json()) as ApiResponse<T>;
    return json as { success: boolean; data?: T; error?: string };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export const api = {
  async getRecords(includeInvalid = false) {
    return request<AuthorizationRecord[]>(
      `/api/authorization/records${includeInvalid ? '?includeInvalid=true' : ''}`,
    );
  },
  async getStats() {
    return request<SummaryStats>('/api/authorization/records/stats');
  },
  async getRecord(id: string) {
    return request<AuthorizationRecordWithHistory>(
      `/api/authorization/records/${id}`,
    );
  },
  async createRecord(input: CreateRecordInput) {
    return request<AuthorizationRecordWithHistory>(
      '/api/authorization/records',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
  },
  async updateRecord(id: string, input: Omit<UpdateRecordInput, 'id'>) {
    return request<AuthorizationRecordWithHistory>(
      `/api/authorization/records/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(input),
      },
    );
  },
  async supplementRecord(id: string, input: CreateRecordInput) {
    return request<AuthorizationRecordWithHistory>(
      `/api/authorization/records/${id}/supplement`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
  },
  async invalidateRecord(id: string, reason: string) {
    return request<AuthorizationRecordWithHistory>(
      `/api/authorization/records/${id}/invalidate`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      },
    );
  },
};
