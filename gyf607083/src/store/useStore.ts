import { create } from 'zustand';
import { 
  ClassWithStats, 
  Baby, 
  SupplyRecord, 
  AuditLog, 
  User, 
  UserRole,
  HandleExceptionRequest,
  CreateManualRecordRequest,
  ExportOptions,
  PartialSuccessResponse
} from '../../shared/types';
import { api, setCurrentRole, setCurrentUserId, getCurrentRole, getCurrentUserId } from '../api/client';

interface StoreState {
  classes: ClassWithStats[];
  babies: Baby[];
  supplyRecords: SupplyRecord[];
  auditLogs: AuditLog[];
  users: User[];
  currentRole: UserRole;
  currentUserId: string;
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
  refreshKey: number;

  setCurrentRole: (role: UserRole) => void;
  setCurrentUserId: (id: string) => void;
  triggerRefresh: () => void;

  loadClasses: () => Promise<void>;
  loadBabies: (classId?: string) => Promise<void>;
  loadBabyDetail: (id: string) => Promise<Baby & { records: SupplyRecord[] } | null>;
  loadSupplyRecords: (params?: { classId?: string; babyId?: string; status?: string }) => Promise<void>;
  loadExceptionRecords: () => Promise<void>;
  loadAuditLogs: (params?: any) => Promise<void>;
  loadUsers: () => Promise<void>;

  handleException: (data: HandleExceptionRequest) => Promise<PartialSuccessResponse>;
  createManualRecord: (data: CreateManualRecordRequest) => Promise<{ success: boolean; data?: SupplyRecord; message: string }>;

  exportExcel: (options: ExportOptions) => Promise<void>;
  exportJson: (options: ExportOptions) => Promise<void>;

  clearError: (key: string) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  classes: [],
  babies: [],
  supplyRecords: [],
  auditLogs: [],
  users: [],
  currentRole: getCurrentRole(),
  currentUserId: getCurrentUserId(),
  loading: {},
  error: {},
  refreshKey: 0,

  setCurrentRole: (role: UserRole) => {
    setCurrentRole(role);
    set({ currentRole: role });
  },

  setCurrentUserId: (id: string) => {
    setCurrentUserId(id);
    set({ currentUserId: id });
  },

  triggerRefresh: () => {
    set(state => ({ refreshKey: state.refreshKey + 1 }));
  },

  loadClasses: async () => {
    set(state => ({ loading: { ...state.loading, classes: true } }));
    try {
      const response = await api.classes.getAll();
      set({ classes: response.data, error: { ...get().error, classes: null } });
    } catch (error: any) {
      set({ error: { ...get().error, classes: error.message } });
    } finally {
      set(state => ({ loading: { ...state.loading, classes: false } }));
    }
  },

  loadBabies: async (classId?: string) => {
    set(state => ({ loading: { ...state.loading, babies: true } }));
    try {
      const response = await api.babies.getAll(classId);
      set({ babies: response.data, error: { ...get().error, babies: null } });
    } catch (error: any) {
      set({ error: { ...get().error, babies: error.message } });
    } finally {
      set(state => ({ loading: { ...state.loading, babies: false } }));
    }
  },

  loadBabyDetail: async (id: string) => {
    set(state => ({ loading: { ...state.loading, babyDetail: true } }));
    try {
      const response = await api.babies.getById(id);
      set({ error: { ...get().error, babyDetail: null } });
      return response.data;
    } catch (error: any) {
      set({ error: { ...get().error, babyDetail: error.message } });
      return null;
    } finally {
      set(state => ({ loading: { ...state.loading, babyDetail: false } }));
    }
  },

  loadSupplyRecords: async (params?: { classId?: string; babyId?: string; status?: string }) => {
    set(state => ({ loading: { ...state.loading, supplyRecords: true } }));
    try {
      const response = await api.supplyRecords.getAll(params);
      set({ supplyRecords: response.data, error: { ...get().error, supplyRecords: null } });
    } catch (error: any) {
      set({ error: { ...get().error, supplyRecords: error.message } });
    } finally {
      set(state => ({ loading: { ...state.loading, supplyRecords: false } }));
    }
  },

  loadExceptionRecords: async () => {
    set(state => ({ loading: { ...state.loading, exceptionRecords: true } }));
    try {
      const response = await api.supplyRecords.getExceptions();
      set({ supplyRecords: response.data, error: { ...get().error, exceptionRecords: null } });
    } catch (error: any) {
      set({ error: { ...get().error, exceptionRecords: error.message } });
    } finally {
      set(state => ({ loading: { ...state.loading, exceptionRecords: false } }));
    }
  },

  loadAuditLogs: async (params?: any) => {
    set(state => ({ loading: { ...state.loading, auditLogs: true } }));
    try {
      const response = await api.audit.getAll(params);
      set({ auditLogs: response.data, error: { ...get().error, auditLogs: null } });
    } catch (error: any) {
      set({ error: { ...get().error, auditLogs: error.message } });
    } finally {
      set(state => ({ loading: { ...state.loading, auditLogs: false } }));
    }
  },

  loadUsers: async () => {
    set(state => ({ loading: { ...state.loading, users: true } }));
    try {
      const response = await api.users.getAll();
      set({ users: response.data, error: { ...get().error, users: null } });
    } catch (error: any) {
      set({ error: { ...get().error, users: error.message } });
    } finally {
      set(state => ({ loading: { ...state.loading, users: false } }));
    }
  },

  handleException: async (data: HandleExceptionRequest) => {
    set(state => ({ loading: { ...state.loading, handleException: true } }));
    try {
      const response = await api.supplyRecords.handleException(data);
      set({ error: { ...get().error, handleException: null } });
      get().triggerRefresh();
      return response;
    } catch (error: any) {
      set({ error: { ...get().error, handleException: error.message } });
      throw error;
    } finally {
      set(state => ({ loading: { ...state.loading, handleException: false } }));
    }
  },

  createManualRecord: async (data: CreateManualRecordRequest) => {
    set(state => ({ loading: { ...state.loading, createManual: true } }));
    try {
      const response = await api.supplyRecords.createManual(data);
      set({ error: { ...get().error, createManual: null } });
      get().triggerRefresh();
      return response;
    } catch (error: any) {
      set({ error: { ...get().error, createManual: error.message } });
      throw error;
    } finally {
      set(state => ({ loading: { ...state.loading, createManual: false } }));
    }
  },

  exportExcel: async (options: ExportOptions) => {
    set(state => ({ loading: { ...state.loading, export: true } }));
    try {
      const blob = await api.export.excel(options);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `用品发放记录_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      set({ error: { ...get().error, export: error.message } });
      throw error;
    } finally {
      set(state => ({ loading: { ...state.loading, export: false } }));
    }
  },

  exportJson: async (options: ExportOptions) => {
    set(state => ({ loading: { ...state.loading, export: true } }));
    try {
      const blob = await api.export.json(options);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `用品发放记录_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      set({ error: { ...get().error, export: error.message } });
      throw error;
    } finally {
      set(state => ({ loading: { ...state.loading, export: false } }));
    }
  },

  clearError: (key: string) => {
    set(state => ({ error: { ...state.error, [key]: null } }));
  },
}));
