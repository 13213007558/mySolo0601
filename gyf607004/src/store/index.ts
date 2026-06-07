import { create } from 'zustand';
import { User, RescheduleRecord, ImportDryRunResult, RecordStatus } from '../types';
import { AuthService } from '../services/AuthService';
import { RecordService } from '../services/RecordService';
import { ImportService } from '../services/ImportService';
import { ExportService } from '../services/ExportService';
import { seedDatabase } from '../db/seed';

interface AppState {
  currentUser: User | null;
  records: RescheduleRecord[];
  loading: boolean;
  error: string | null;
  accessDeniedInfo: { recordId: string; babyName: string; reason: string } | null;
  init: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  loadRecords: (filters?: {
    status?: RecordStatus;
    search?: string;
    includeIsolated?: boolean;
    handlerId?: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<void>;
  createRecord: (
    data: Partial<RescheduleRecord>,
    operator: User
  ) => Promise<RescheduleRecord>;
  updateRecordStatus: (
    id: string,
    newStatus: RecordStatus,
    note?: string
  ) => Promise<void>;
  approveRecord: (id: string, note?: string) => Promise<void>;
  rejectRecord: (id: string, reason: string) => Promise<void>;
  isolateRecord: (id: string, reason: string) => Promise<void>;
  addNoteToRecord: (id: string, note: string) => Promise<void>;
  checkRecordAccess: (
    recordId: string
  ) => Promise<{
    allowed: boolean;
    record?: RescheduleRecord;
    reason?: string;
  }>;
  clearAccessDenied: () => void;
  dryRunImport: (file: File) => Promise<ImportDryRunResult>;
  commitImport: (
    result: ImportDryRunResult
  ) => Promise<{ success: number; failed: number }>;
  exportRecords: (
    format: 'excel' | 'csv',
    records: RescheduleRecord[],
    fields?: string[]
  ) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  records: [],
  loading: false,
  error: null,
  accessDeniedInfo: null,

  init: async () => {
    set({ loading: true, error: null });
    try {
      await seedDatabase();
      const user = await AuthService.getCurrentUser();
      set({ currentUser: user });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '初始化失败' });
    } finally {
      set({ loading: false });
    }
  },

  switchUser: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      await AuthService.setCurrentUser(userId);
      const user = await AuthService.getCurrentUser();
      set({ currentUser: user });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '切换用户失败' });
    } finally {
      set({ loading: false });
    }
  },

  loadRecords: async (filters) => {
    set({ loading: true, error: null });
    try {
      const records = await RecordService.getAll(filters);
      set({ records });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载记录失败' });
    } finally {
      set({ loading: false });
    }
  },

  createRecord: async (data, operator) => {
    set({ loading: true, error: null });
    try {
      const record = await RecordService.create(data, operator);
      return record;
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建记录失败';
      set({ error: message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updateRecordStatus: async (id, newStatus, note) => {
    set({ loading: true, error: null });
    try {
      const { currentUser } = get();
      if (!currentUser) throw new Error('未登录');
      await RecordService.updateStatus(id, newStatus, currentUser, note);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新状态失败' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  approveRecord: async (id, note) => {
    set({ loading: true, error: null });
    try {
      const { currentUser } = get();
      if (!currentUser) throw new Error('未登录');
      await RecordService.approve(id, currentUser, note);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '审批失败' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  rejectRecord: async (id, reason) => {
    set({ loading: true, error: null });
    try {
      const { currentUser } = get();
      if (!currentUser) throw new Error('未登录');
      await RecordService.reject(id, currentUser, reason);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '驳回失败' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  isolateRecord: async (id, reason) => {
    set({ loading: true, error: null });
    try {
      const { currentUser } = get();
      if (!currentUser) throw new Error('未登录');
      await RecordService.isolate(id, currentUser, reason);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '隔离失败' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  addNoteToRecord: async (id, note) => {
    set({ loading: true, error: null });
    try {
      const { currentUser } = get();
      if (!currentUser) throw new Error('未登录');
      await RecordService.addNote(id, note, currentUser);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '添加备注失败' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  checkRecordAccess: async (recordId) => {
    set({ loading: true, error: null });
    try {
      const { currentUser } = get();
      if (!currentUser) return { allowed: false, reason: '未登录' };
      const record = await RecordService.getById(recordId);
      if (!record) return { allowed: false, reason: '记录不存在' };
      const permission = AuthService.canViewRecord(currentUser, record);
      if (!permission.allowed) {
        set({
          accessDeniedInfo: {
            recordId,
            babyName: record.babyName,
            reason: permission.reason || '无权访问',
          },
        });
        await AuthService.logAccessDenied(
          currentUser,
          recordId,
          record.babyName,
          permission.reason || '无权访问'
        );
      }
      return { allowed: permission.allowed, record, reason: permission.reason };
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '检查访问权限失败',
      });
      return { allowed: false, reason: '检查访问权限失败' };
    } finally {
      set({ loading: false });
    }
  },

  clearAccessDenied: () => {
    set({ accessDeniedInfo: null });
  },

  dryRunImport: async (file) => {
    set({ loading: true, error: null });
    try {
      return await ImportService.dryRun(file);
    } catch (err) {
      const message = err instanceof Error ? err.message : '导入预检失败';
      set({ error: message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  commitImport: async (result) => {
    set({ loading: true, error: null });
    try {
      const { currentUser } = get();
      if (!currentUser) throw new Error('未登录');
      const importResult = await ImportService.commitImport(result, currentUser);
      return {
        success: importResult.success.length,
        failed: importResult.failedCount,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : '导入提交失败';
      set({ error: message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  exportRecords: async (format, records, fields) => {
    set({ loading: true, error: null });
    try {
      const { currentUser } = get();
      let blob: Blob;
      if (format === 'excel') {
        blob = await ExportService.exportToExcel(records, fields);
      } else {
        blob = await ExportService.exportToCSV(records, fields);
      }
      const filename = `换班记录_${new Date().toISOString().slice(0, 10)}.${
        format === 'excel' ? 'xlsx' : 'csv'
      }`;
      ExportService.downloadBlob(blob, filename);
      if (currentUser) {
        await ExportService.logExport(
          currentUser.id,
          currentUser.name,
          records.length
        );
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '导出失败' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },
}));
