import { create } from 'zustand';
import type {
  User,
  OverviewStats,
  ExceptionRecord,
  ClassInfo,
  Baby,
  DisinfectionRecord,
  TimelineEvent,
  AuditLog,
  HandleExceptionResponse,
} from '@shared/types';

interface ApiState {
  currentUser: User | null;
  stats: OverviewStats | null;
  exceptions: ExceptionRecord[];
  classes: ClassInfo[];
  babiesByClass: Record<string, Baby[]>;
  babyDetail: Record<string, Baby | null>;
  babyTimeline: Record<string, TimelineEvent[]>;
  babyExceptions: Record<string, ExceptionRecord[]>;
  auditLogs: AuditLog[];
  records: DisinfectionRecord[];
  exportConfig: { fields: { key: string; label: string; category: string; privacy?: boolean }[] } | null;
  selectedRole: User['role'];
}

interface ApiActions {
  fetchCurrentUser: () => Promise<void>;
  setRole: (r: User['role']) => void;
  fetchStats: () => Promise<void>;
  fetchExceptions: (status?: string) => Promise<void>;
  handleException: (id: string, handleMeasure: string) => Promise<HandleExceptionResponse | null>;
  fetchClasses: () => Promise<void>;
  fetchBabies: (classId: string) => Promise<void>;
  fetchBabyDetail: (id: string) => Promise<void>;
  fetchBabyTimeline: (id: string) => Promise<void>;
  fetchBabyExceptions: (id: string) => Promise<void>;
  fetchAuditLogs: () => Promise<void>;
  fetchRecords: (q?: { classId?: string; babyId?: string; status?: string }) => Promise<void>;
  fetchExportConfig: () => Promise<void>;
  createManualRecord: (payload: Partial<DisinfectionRecord>) => Promise<{ id: string } | null>;
  reviewAudit: (id: string, comment: string) => Promise<boolean>;
  generateExport: (fields: string[], format: 'csv' | 'json') => Promise<void>;
  refreshAll: () => Promise<void>;
}

const DEFAULT_HEADERS = () => ({
  'Content-Type': 'application/json',
  'X-User-Id':
    appStore.getState().selectedRole === 'supervisor'
      ? 'u_supervisor'
      : appStore.getState().selectedRole === 'teacher'
        ? 'u_teacher'
        : appStore.getState().selectedRole === 'admin'
          ? 'u_admin'
          : 'u_disinfector',
});

export const appStore = create<ApiState & ApiActions>((set, get) => ({
  currentUser: null,
  stats: null,
  exceptions: [],
  classes: [],
  babiesByClass: {},
  babyDetail: {},
  babyTimeline: {},
  babyExceptions: {},
  auditLogs: [],
  records: [],
  exportConfig: null,
  selectedRole: 'supervisor',

  setRole: (r) => {
    set({ selectedRole: r });
    get().refreshAll();
  },

  fetchCurrentUser: async () => {
    const res = await fetch('/api/auth/me', { headers: DEFAULT_HEADERS() });
    const data = (await res.json()) as User;
    set({ currentUser: data });
  },

  fetchStats: async () => {
    const res = await fetch('/api/stats/overview', { headers: DEFAULT_HEADERS() });
    set({ stats: (await res.json()) as OverviewStats });
  },

  fetchExceptions: async (status) => {
    const url = status ? `/api/exceptions?status=${status}` : '/api/exceptions';
    const res = await fetch(url, { headers: DEFAULT_HEADERS() });
    set({ exceptions: (await res.json()) as ExceptionRecord[] });
  },

  handleException: async (id, handleMeasure) => {
    const res = await fetch(`/api/exceptions/${id}`, {
      method: 'PUT',
      headers: DEFAULT_HEADERS(),
      body: JSON.stringify({ handleMeasure }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as HandleExceptionResponse;
    get().refreshAll();
    return data;
  },

  fetchClasses: async () => {
    const res = await fetch('/api/classes', { headers: DEFAULT_HEADERS() });
    set({ classes: (await res.json()) as ClassInfo[] });
  },

  fetchBabies: async (classId) => {
    const res = await fetch(`/api/classes/${classId}/babies`, { headers: DEFAULT_HEADERS() });
    const list = (await res.json()) as Baby[];
    set((s) => ({ babiesByClass: { ...s.babiesByClass, [classId]: list } }));
  },

  fetchBabyDetail: async (id) => {
    const res = await fetch(`/api/babies/${id}`, { headers: DEFAULT_HEADERS() });
    const data = (await res.json()) as Baby;
    set((s) => ({ babyDetail: { ...s.babyDetail, [id]: data } }));
  },

  fetchBabyTimeline: async (id) => {
    const res = await fetch(`/api/babies/${id}/timeline`, { headers: DEFAULT_HEADERS() });
    const data = (await res.json()) as TimelineEvent[];
    set((s) => ({ babyTimeline: { ...s.babyTimeline, [id]: data } }));
  },

  fetchBabyExceptions: async (id) => {
    const res = await fetch(`/api/babies/${id}/exceptions`, { headers: DEFAULT_HEADERS() });
    const data = (await res.json()) as ExceptionRecord[];
    set((s) => ({ babyExceptions: { ...s.babyExceptions, [id]: data } }));
  },

  fetchAuditLogs: async () => {
    const res = await fetch('/api/audit-logs', { headers: DEFAULT_HEADERS() });
    set({ auditLogs: (await res.json()) as AuditLog[] });
  },

  fetchRecords: async (q) => {
    const params = new URLSearchParams();
    if (q?.classId) params.set('classId', q.classId);
    if (q?.babyId) params.set('babyId', q.babyId);
    if (q?.status) params.set('status', q.status);
    const res = await fetch(`/api/records?${params.toString()}`, { headers: DEFAULT_HEADERS() });
    set({ records: (await res.json()) as DisinfectionRecord[] });
  },

  fetchExportConfig: async () => {
    const res = await fetch('/api/export/config', { headers: DEFAULT_HEADERS() });
    set({ exportConfig: (await res.json()) as ApiState['exportConfig'] });
  },

  createManualRecord: async (payload) => {
    const res = await fetch('/api/records', {
      method: 'POST',
      headers: DEFAULT_HEADERS(),
      body: JSON.stringify({ ...payload, isManual: true }),
    });
    if (!res.ok) return null;
    get().refreshAll();
    return (await res.json()) as { id: string };
  },

  reviewAudit: async (id, comment) => {
    const res = await fetch(`/api/audit-logs/${id}/review`, {
      method: 'PUT',
      headers: DEFAULT_HEADERS(),
      body: JSON.stringify({ comment }),
    });
    if (res.ok) get().fetchAuditLogs();
    return res.ok;
  },

  generateExport: async (fields, format) => {
    const res = await fetch('/api/export/generate', {
      method: 'POST',
      headers: DEFAULT_HEADERS(),
      body: JSON.stringify({ fields, format }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disinfection-export.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  },

  refreshAll: async () => {
    await Promise.all([
      get().fetchCurrentUser(),
      get().fetchStats(),
      get().fetchExceptions(),
      get().fetchClasses(),
      get().fetchAuditLogs(),
      get().fetchRecords(),
    ]);
  },
}));
