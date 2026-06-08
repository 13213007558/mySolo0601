import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  UserRole,
  ExpenseRecord,
  AuditLog,
  AuditLogType,
  ImportBatch,
  RecordStatus,
} from '../../shared/types';
import { SAMPLE_RECORDS } from '../data/sampleData';
import {
  generateId,
  validatePhones,
  downloadCSV,
  escapeCSV,
  maskPhone,
} from '../utils/helpers';
import type { PhoneValidationResult } from '../utils/helpers';

interface AppState {
  currentRole: UserRole | null;
  currentUserName: string;
  records: ExpenseRecord[];
  auditLogs: AuditLog[];
  importBatches: ImportBatch[];
  isInitialized: boolean;

  setRole: (role: UserRole, name?: string) => void;
  clearRole: () => void;

  addRecord: (record: Omit<ExpenseRecord, 'id' | 'createdAt'>) => string;
  updateRecord: (id: string, patch: Partial<ExpenseRecord>) => void;
  updateRecordStatus: (id: string, status: RecordStatus, operatorName: string) => void;
  supplementRecord: (
    originalId: string,
    supplement: Omit<ExpenseRecord, 'id' | 'createdAt'>,
    remark: string,
    operatorName: string,
  ) => string;

  validatePhone: (rawInput: string) => PhoneValidationResult;

  addAuditLog: (log: {
    type: AuditLogType;
    targetRecordId?: string;
    details: string;
    fieldsExposed?: string[];
  }) => void;

  importSampleData: () => {
    added: number;
    skipped: number;
    duplicates: number;
    batchId: string;
  };

  exportRecords: (includePrivacy: boolean) => void;

  getFilteredRecords: () => ExpenseRecord[];

  getStatistics: () => {
    totalAmount: number;
    pendingCount: number;
    verifiedCount: number;
    overdueCount: number;
    balanceAmount: number;
  };

  resetAllData: () => void;
}

const ROLE_USER_NAMES: Record<UserRole, string> = {
  elder: '张奶奶',
  parent: '李妈妈',
  nanny: '王阿姨',
  admin: '刘主管',
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentRole: null,
      currentUserName: '',
      records: [],
      auditLogs: [],
      importBatches: [],
      isInitialized: false,

      setRole: (role, name) => {
        set({
          currentRole: role,
          currentUserName: name || ROLE_USER_NAMES[role],
        });
      },

      clearRole: () => {
        set({ currentRole: null, currentUserName: '' });
      },

      addRecord: (record) => {
        const id = generateId();
        const newRecord: ExpenseRecord = {
          ...record,
          id,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ records: [newRecord, ...s.records] }));
        get().addAuditLog({
          type: 'update',
          targetRecordId: id,
          details: `新增费用记录：${record.category} ${record.amount}元`,
        });
        return id;
      },

      updateRecord: (id, patch) => {
        const before = get().records.find((r) => r.id === id);
        set((s) => ({
          records: s.records.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        }));
        if (before) {
          const changes = Object.entries(patch)
            .map(([k, v]) => `${k}: ${JSON.stringify((before as unknown as Record<string, unknown>)[k])} → ${JSON.stringify(v)}`)
            .join('; ');
          get().addAuditLog({
            type: 'update',
            targetRecordId: id,
            details: `修改记录字段：${changes}`,
          });
        }
      },

      updateRecordStatus: (id, status, operatorName) => {
        const patch: Partial<ExpenseRecord> = { status };
        if (status === 'verified') {
          patch.verifiedAt = new Date().toISOString();
          patch.verifiedBy = operatorName;
        }
        get().updateRecord(id, patch);
        get().addAuditLog({
          type: status === 'verified' ? 'verify' : 'reject',
          targetRecordId: id,
          details: `${operatorName} ${status === 'verified' ? '确认核销' : '驳回'}该记录`,
        });
      },

      supplementRecord: (originalId, supplement, remark, operatorName) => {
        const original = get().records.find((r) => r.id === originalId);
        const beforeSnapshot = original
          ? {
              category: original.category,
              amount: original.amount,
              merchant: original.merchant,
              dueDate: original.dueDate,
            }
          : undefined;

        if (original) {
          set((s) => ({
            records: s.records.map((r) =>
              r.id === originalId ? { ...r, status: 'supplemented' as RecordStatus } : r,
            ),
          }));
        }

        const supplementRecord: ExpenseRecord = {
          ...supplement,
          id: generateId(),
          createdAt: new Date().toISOString(),
          isSupplement: true,
          supplementFromId: originalId,
          supplementRemark: remark,
          beforeSnapshot,
          status: 'verified',
          verifiedAt: new Date().toISOString(),
          verifiedBy: operatorName,
        };
        set((s) => ({ records: [supplementRecord, ...s.records] }));

        get().addAuditLog({
          type: 'supplement',
          targetRecordId: supplementRecord.id,
          details: `${operatorName} 手工补录：${remark}，原记录 ${originalId} 已标记为已补录`,
        });

        return supplementRecord.id;
      },

      validatePhone: (rawInput) => validatePhones(rawInput),

      addAuditLog: (log) => {
        const { currentRole, currentUserName } = get();
        const audit: AuditLog = {
          ...log,
          id: generateId(),
          operatorRole: currentRole || 'admin',
          operatorName: currentUserName || '系统',
          timestamp: new Date().toISOString(),
        };
        set((s) => ({ auditLogs: [audit, ...s.auditLogs] }));
      },

      importSampleData: () => {
        const existingKeys = new Set(get().records.map((r) => r.sampleKey).filter(Boolean));
        const batchId = `BATCH-${Date.now()}`;
        let added = 0;
        let duplicates = 0;
        const addedIds: string[] = [];

        for (const sample of SAMPLE_RECORDS) {
          if (sample.sampleKey && existingKeys.has(sample.sampleKey)) {
            duplicates++;
            continue;
          }
          const id = generateId();
          const record = {
            ...sample,
            id,
            createdAt: new Date().toISOString(),
            importBatchId: batchId,
          } as ExpenseRecord;
          addedIds.push(id);
          set((s) => ({ records: [record, ...s.records] }));
          added++;
        }

        const batch: ImportBatch = {
          id: batchId,
          importedAt: new Date().toISOString(),
          recordsCount: SAMPLE_RECORDS.length,
          duplicatesCount: duplicates,
          skippedCount: 0,
        };
        set((s) => ({ importBatches: [batch, ...s.importBatches] }));

        get().addAuditLog({
          type: 'import',
          details: `导入样例数据批 ${batchId}：共 ${SAMPLE_RECORDS.length} 条，成功 ${added} 条，重复跳过 ${duplicates} 条`,
        });

        return { added, skipped: 0, duplicates, batchId };
      },

      exportRecords: (includePrivacy) => {
        const { records, currentRole, currentUserName } = get();
        const headers = includePrivacy
          ? ['ID', '类别', '金额', '手机号', '商家', '到期日', '状态', '是否补录', '补录备注', '创建时间']
          : ['ID', '类别', '金额', '商家', '到期日', '状态', '是否补录', '创建时间'];

        const rows = records.map((r) => {
          const base = [
            r.id,
            r.category,
            r.amount.toFixed(2),
            includePrivacy ? r.phone || '' : '',
            r.merchant,
            r.dueDate,
            r.status,
            r.isSupplement ? '是' : '否',
            r.supplementRemark || '',
            r.createdAt,
          ];
          return includePrivacy ? base : base.filter((_, i) => i !== 3);
        });

        const csv = [headers, ...rows].map((row) => row.map(escapeCSV).join(',')).join('\n');
        const filename = `婴幼儿费用核销记录_${new Date().toISOString().slice(0, 10)}.csv`;
        downloadCSV(csv, filename);

        if (includePrivacy) {
          get().addAuditLog({
            type: 'export_privacy',
            details: `${currentUserName}(${currentRole}) 导出包含隐私字段(手机号)的费用记录，共 ${records.length} 条`,
            fieldsExposed: ['phone(手机号)'],
          });
        } else {
          get().addAuditLog({
            type: 'update',
            details: `${currentUserName}(${currentRole}) 导出不含隐私字段的费用记录，共 ${records.length} 条`,
          });
        }
      },

      getFilteredRecords: () => {
        const { records, currentRole } = get();
        const all = records.filter((r) => !r.isDeleted);
        if (currentRole === 'admin') return all;
        if (currentRole === 'nanny') return all.filter((r) => r.status === 'pending' || r.status === 'supplemented');
        return all;
      },

      getStatistics: () => {
        const records = get().records.filter((r) => !r.isDeleted);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let totalAmount = 0;
        let pendingCount = 0;
        let verifiedCount = 0;
        let overdueCount = 0;
        let pendingAmount = 0;

        for (const r of records) {
          totalAmount += r.amount;
          if (r.status === 'pending') {
            pendingCount++;
            pendingAmount += r.amount;
          }
          if (r.status === 'verified') verifiedCount++;
          const due = new Date(r.dueDate);
          due.setHours(0, 0, 0, 0);
          if (r.status === 'pending' && due.getTime() < today.getTime()) {
            overdueCount++;
          }
        }

        return {
          totalAmount,
          pendingCount,
          verifiedCount,
          overdueCount,
          balanceAmount: pendingAmount,
        };
      },

      resetAllData: () => {
        set({
          records: [],
          auditLogs: [],
          importBatches: [],
          isInitialized: false,
          currentRole: null,
          currentUserName: '',
        });
      },
    }),
    {
      name: 'baby-expense-app',
      onRehydrateStorage: () => (state) => {
        if (state && !state.isInitialized) {
          const result = state.importSampleData();
          if (result.added > 0) {
            state.isInitialized = true;
          }
        }
      },
    },
  ),
);

export { maskPhone };
