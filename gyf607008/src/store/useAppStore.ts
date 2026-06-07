import { create } from 'zustand';
import type {
  InfantRecord,
  AuditLog,
  RecordFilters,
  AuditFilters,
  ExportOptions,
  ExportReport,
} from '@shared/types';
import { recordsApi, auditApi, exportApi } from '@/lib/api';

interface AppState {
  currentOperator: string;
  records: InfantRecord[];
  selectedRecordIds: string[];
  auditLogs: AuditLog[];
  filters: RecordFilters;
  auditFilters: AuditFilters;
  loading: boolean;
  error: string | null;
  lastExportReport: ExportReport | null;

  setCurrentOperator: (name: string) => void;
  setFilters: (filters: Partial<RecordFilters>) => void;
  setAuditFilters: (filters: Partial<AuditFilters>) => void;
  setSelectedRecordIds: (ids: string[]) => void;
  toggleSelectedId: (id: string) => void;

  fetchRecords: () => Promise<void>;
  fetchRecord: (id: string) => Promise<InfantRecord | undefined>;
  createRecord: (data: Partial<InfantRecord>) => Promise<InfantRecord>;
  updateRecord: (id: string, data: Partial<InfantRecord>) => Promise<InfantRecord>;
  reviewRecord: (id: string) => Promise<InfantRecord>;
  batchReview: () => Promise<void>;

  fetchAuditLogs: () => Promise<void>;
  fetchRecordAuditLogs: (recordId: string) => Promise<AuditLog[]>;

  exportRecords: (opts: Omit<ExportOptions, 'operator'>) => Promise<ExportReport>;
  clearExportReport: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentOperator: '刘老师（夜班）',
  records: [],
  selectedRecordIds: [],
  auditLogs: [],
  filters: {},
  auditFilters: {},
  loading: false,
  error: null,
  lastExportReport: null,

  setCurrentOperator: (name) => set({ currentOperator: name }),
  setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
  setAuditFilters: (filters) => set((s) => ({ auditFilters: { ...s.auditFilters, ...filters } })),
  setSelectedRecordIds: (ids) => set({ selectedRecordIds: ids }),
  toggleSelectedId: (id) =>
    set((s) => ({
      selectedRecordIds: s.selectedRecordIds.includes(id)
        ? s.selectedRecordIds.filter((i) => i !== id)
        : [...s.selectedRecordIds, id],
    })),

  fetchRecords: async () => {
    set({ loading: true, error: null });
    try {
      const data = await recordsApi.list(get().filters);
      set({ records: data });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchRecord: async (id) => {
    const cached = get().records.find((r) => r.id === id);
    if (cached) return cached;
    try {
      const data = await recordsApi.get(id);
      set((s) => ({
        records: s.records.some((r) => r.id === id)
          ? s.records.map((r) => (r.id === id ? data : r))
          : [...s.records, data],
      }));
      return data;
    } catch {
      return undefined;
    }
  },

  createRecord: async (data) => {
    set({ loading: true, error: null });
    const operator = get().currentOperator;
    try {
      const created = await recordsApi.create({ ...data, createdBy: operator });
      set((s) => ({ records: [created, ...s.records] }));
      return created;
    } finally {
      set({ loading: false });
    }
  },

  updateRecord: async (id, data) => {
    set({ loading: true, error: null });
    const operator = get().currentOperator;
    try {
      const updated = await recordsApi.update(id, { ...data, updatedBy: operator });
      set((s) => ({
        records: s.records.map((r) => (r.id === id ? updated : r)),
      }));
      return updated;
    } finally {
      set({ loading: false });
    }
  },

  reviewRecord: async (id) => {
    set({ loading: true, error: null });
    const operator = get().currentOperator;
    try {
      const updated = await recordsApi.review(id, operator);
      set((s) => ({
        records: s.records.map((r) => (r.id === id ? updated : r)),
      }));
      return updated;
    } finally {
      set({ loading: false });
    }
  },

  batchReview: async () => {
    const ids = get().selectedRecordIds;
    set({ loading: true, error: null });
    try {
      const results = await Promise.all(ids.map((id) => recordsApi.review(id, get().currentOperator)));
      set((s) => {
        const updatedMap = new Map(results.map((r) => [r.id, r]));
        return {
          records: s.records.map((r) => updatedMap.get(r.id) || r),
          selectedRecordIds: [],
        };
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchAuditLogs: async () => {
    set({ loading: true, error: null });
    try {
      const data = await auditApi.list(get().auditFilters);
      set({ auditLogs: data });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchRecordAuditLogs: async (recordId) => {
    try {
      return await auditApi.byRecord(recordId);
    } catch {
      return [];
    }
  },

  exportRecords: async (opts) => {
    set({ loading: true, error: null });
    try {
      const report = await exportApi.export({ ...opts, operator: get().currentOperator });
      set({ lastExportReport: report });
      return report;
    } finally {
      set({ loading: false });
    }
  },

  clearExportReport: () => set({ lastExportReport: null }),
}));
