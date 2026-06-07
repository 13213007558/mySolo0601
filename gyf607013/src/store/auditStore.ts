import { create } from 'zustand';
import type { AuditLog } from '@/types';
import { api } from '@/utils/api';

interface FetchLogsParams {
  recordId?: string;
  isBoundaryAudit?: boolean;
  operatorId?: string;
}

interface AuditApiResponse {
  success: boolean;
  data: AuditLog[];
}

interface AuditState {
  logs: AuditLog[];
  loading: boolean;
  error: string | null;
  fetchLogs: (params?: FetchLogsParams) => Promise<void>;
  addLog: (log: AuditLog) => void;
  clearLogs: () => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  logs: [],
  loading: false,
  error: null,
  fetchLogs: async (params) => {
    set({ loading: true, error: null });
    try {
      const query = new URLSearchParams();
      if (params?.recordId) query.set('recordId', params.recordId);
      if (params?.isBoundaryAudit !== undefined)
        query.set('isBoundaryAudit', String(params.isBoundaryAudit));
      if (params?.operatorId) query.set('operatorId', params.operatorId);
      const queryStr = query.toString();
      const url = `/audit-logs${queryStr ? `?${queryStr}` : ''}`;
      const res = await api<AuditApiResponse>(url);
      const data = (res as AuditApiResponse)?.data ?? (res as unknown as AuditLog[]);
      set({ logs: Array.isArray(data) ? data : [], loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取审计日志失败', loading: false });
    }
  },
  addLog: (log) => set((state) => ({ logs: [log, ...state.logs] })),
  clearLogs: () => set({ logs: [] }),
}));
