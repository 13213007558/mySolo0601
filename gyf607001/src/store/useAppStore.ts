import { create } from 'zustand';
import type { Baby, DailyCheckRecord, AuditLog, ImportResult, CheckStatus } from '../../shared/types';

interface AppState {
  babies: Baby[];
  records: DailyCheckRecord[];
  selectedDate: string;
  selectedClassName: string;
  selectedStatus: string;
  searchKeyword: string;
  importResult: ImportResult | null;
  auditLogs: (AuditLog & { babyName?: string; className?: string })[];
  currentUser: string;

  setSelectedDate: (d: string) => void;
  setSelectedClassName: (c: string) => void;
  setSelectedStatus: (s: string) => void;
  setSearchKeyword: (k: string) => void;
  setImportResult: (r: ImportResult | null) => void;

  fetchBabies: () => Promise<void>;
  fetchRecords: () => Promise<void>;
  fetchAuditLogs: () => Promise<void>;
  getRecordDetail: (id: string) => Promise<DailyCheckRecord | null>;
  getBabyDetail: (id: string) => Promise<{ baby: Baby; records: DailyCheckRecord[] } | null>;
  submitReview: (recordId: string, newStatus: CheckStatus, newReason: string) => Promise<boolean>;
  confirmAudit: (auditId: string) => Promise<boolean>;
  triggerImport: (scenario?: 'normal' | 'dirty' | 'empty') => Promise<ImportResult | null>;
  uploadFile: (file: File) => Promise<ImportResult | null>;
}

const api = async (path: string, options?: RequestInit) => {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) return null;
  return res.json();
};

export const useAppStore = create<AppState>((set, get) => ({
  babies: [],
  records: [],
  selectedDate: new Date().toISOString().split('T')[0],
  selectedClassName: '',
  selectedStatus: '',
  searchKeyword: '',
  importResult: null,
  auditLogs: [],
  currentUser: '保健老师张',

  setSelectedDate: (d) => set({ selectedDate: d }),
  setSelectedClassName: (c) => set({ selectedClassName: c }),
  setSelectedStatus: (s) => set({ selectedStatus: s }),
  setSearchKeyword: (k) => set({ searchKeyword: k }),
  setImportResult: (r) => set({ importResult: r }),

  fetchBabies: async () => {
    const data = await api('/api/babies');
    if (data) set({ babies: data });
  },

  fetchRecords: async () => {
    const { selectedDate, selectedClassName, selectedStatus } = get();
    const params = new URLSearchParams();
    if (selectedDate) params.set('date', selectedDate);
    if (selectedClassName) params.set('className', selectedClassName);
    if (selectedStatus) params.set('status', selectedStatus);
    const data = await api(`/api/records?${params.toString()}`);
    if (data) set({ records: data });
  },

  fetchAuditLogs: async () => {
    const data = await api('/api/audit');
    if (data) set({ auditLogs: data });
  },

  getRecordDetail: async (id) => {
    return api(`/api/records/${id}`);
  },

  getBabyDetail: async (id) => {
    return api(`/api/babies/${id}`);
  },

  submitReview: async (recordId, newStatus, newReason) => {
    const { currentUser } = get();
    const res = await api(`/api/records/${recordId}/review`, {
      method: 'POST',
      body: JSON.stringify({ newStatus, newReason, operatorName: currentUser }),
    });
    if (res?.success) {
      await get().fetchRecords();
      await get().fetchAuditLogs();
      return true;
    }
    return false;
  },

  confirmAudit: async (auditId) => {
    const res = await api(`/api/audit/${auditId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ reviewedBy: '主管王主任' }),
    });
    if (res?.success) {
      await get().fetchAuditLogs();
      return true;
    }
    return false;
  },

  triggerImport: async (scenario = 'normal') => {
    const res = await api('/api/import', {
      method: 'POST',
      body: JSON.stringify({ scenario }),
    });
    if (res) {
      set({ importResult: res });
      await get().fetchRecords();
      return res;
    }
    return null;
  },

  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/import', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data) {
      set({ importResult: data });
      await get().fetchRecords();
      return data;
    }
    return null;
  },
}));
