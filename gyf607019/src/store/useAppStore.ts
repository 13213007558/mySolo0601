import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AuthorizationRecord,
  HistoryChange,
  MaterialAttachment,
  AuditLog,
  AuthorizationStatus,
  CurrentUser,
  ExportConfig,
} from '@/types';
import { FIELD_LABELS } from '@/types';
import { MOCK_RECORDS, MOCK_HISTORY, MOCK_MATERIALS, MOCK_AUDIT_LOGS, CURRENT_USER } from '@/data/mockData';
import { generateId, nowDateTime, computeFieldDiffs, isPrivateField, validatePhone } from '@/utils';
import { performExport as doExportUtil } from '@/utils/export';

interface AppState {
  currentUser: CurrentUser;
  records: AuthorizationRecord[];
  history: HistoryChange[];
  materials: MaterialAttachment[];
  auditLogs: AuditLog[];
  selectedRecordIds: string[];
  searchKeyword: string;
  filterStatus: AuthorizationStatus | 'all';
  filterHasException: boolean | null;
  filterSupplemented: boolean | null;

  setSearchKeyword: (k: string) => void;
  setFilterStatus: (s: AuthorizationStatus | 'all') => void;
  setFilterHasException: (v: boolean | null) => void;
  setFilterSupplemented: (v: boolean | null) => void;
  toggleSelectRecord: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;

  getRecordById: (id: string) => AuthorizationRecord | undefined;
  getHistoryByRecordId: (id: string) => HistoryChange[];
  getMaterialsByRecordId: (id: string) => MaterialAttachment[];
  getAuditByRecordId: (id: string) => AuditLog[];

  updateRecord: (id: string, updates: Partial<AuthorizationRecord>, reason: string) => {
    success: boolean;
    phoneIssues: string[];
  };
  addRecord: (record: Omit<AuthorizationRecord, 'id' | 'createdAt' | 'updatedAt'>, isSupplement?: boolean) => AuthorizationRecord;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'createdAt'>) => void;
  performExport: (config: ExportConfig) => void;
  resetStore: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: CURRENT_USER,
      records: MOCK_RECORDS,
      history: MOCK_HISTORY,
      materials: MOCK_MATERIALS,
      auditLogs: MOCK_AUDIT_LOGS,
      selectedRecordIds: [],
      searchKeyword: '',
      filterStatus: 'all',
      filterHasException: null,
      filterSupplemented: null,

      setSearchKeyword: (k) => set({ searchKeyword: k }),
      setFilterStatus: (s) => set({ filterStatus: s }),
      setFilterHasException: (v) => set({ filterHasException: v }),
      setFilterSupplemented: (v) => set({ filterSupplemented: v }),

      toggleSelectRecord: (id) =>
        set((s) => ({
          selectedRecordIds: s.selectedRecordIds.includes(id)
            ? s.selectedRecordIds.filter((x) => x !== id)
            : [...s.selectedRecordIds, id],
        })),
      clearSelection: () => set({ selectedRecordIds: [] }),
      selectAll: () => set((s) => ({ selectedRecordIds: s.records.map((r) => r.id) })),

      getRecordById: (id) => get().records.find((r) => r.id === id),
      getHistoryByRecordId: (id) =>
        get()
          .history.filter((h) => h.recordId === id)
          .sort((a, b) => b.changedAt.localeCompare(a.changedAt)),
      getMaterialsByRecordId: (id) => get().materials.filter((m) => m.recordId === id),
      getAuditByRecordId: (id) =>
        get()
          .auditLogs.filter((a) => a.recordId === id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

      updateRecord: (id, updates, reason) => {
        const state = get();
        const oldRec = state.records.find((r) => r.id === id);
        if (!oldRec) return { success: false, phoneIssues: [] };

        const phoneIssues: string[] = [];
        let finalUpdates = { ...updates };

        if (updates.authorizerPhone !== undefined) {
          const phoneResult = validatePhone(updates.authorizerPhone);
          if (phoneResult.partialSuccess) {
            phoneIssues.push(...phoneResult.issues);
            finalUpdates.authorizerPhone = phoneResult.normalizedValue;
          } else if (!phoneResult.valid) {
            phoneIssues.push(...phoneResult.issues);
          }
          finalUpdates.phoneValidationIssues = phoneIssues.length > 0 ? phoneIssues : undefined;
          if (phoneResult.partialSuccess && !updates.status) {
            finalUpdates.status = 'partial';
          }
        }

        const newRec: AuthorizationRecord = { ...oldRec, ...finalUpdates, updatedAt: nowDateTime() };
        if ((updates.status === 'approved' || updates.status === 'rejected' || finalUpdates.status === 'approved' || finalUpdates.status === 'rejected' || finalUpdates.status === 'partial') && !oldRec.reviewTime) {
          newRec.reviewTime = nowDateTime();
          newRec.reviewedBy = state.currentUser.id;
          newRec.reviewedByName = state.currentUser.name;
        }

        const diffs = computeFieldDiffs(oldRec, newRec);
        const newHistoryEntries: HistoryChange[] = diffs.map((d) => ({
          id: generateId('h'),
          recordId: id,
          fieldName: d.fieldName,
          fieldLabel: d.fieldLabel,
          oldValue: d.oldValue,
          newValue: d.newValue,
          changedBy: state.currentUser.id,
          changedByName: state.currentUser.name,
          changeReason: reason,
          changedAt: nowDateTime(),
        }));

        const fieldsInvolved = diffs.map((d) => d.fieldName);
        const containsPrivate = fieldsInvolved.some(isPrivateField);

        set({
          records: state.records.map((r) => (r.id === id ? newRec : r)),
          history: [...state.history, ...newHistoryEntries],
          auditLogs: [
            ...state.auditLogs,
            {
              id: generateId('a'),
              recordId: id,
              actionType: 'edit',
              operatorId: state.currentUser.id,
              operatorName: state.currentUser.name,
              containsPrivateData: containsPrivate,
              desensitized: false,
              fieldsInvolved,
              ipAddress: '192.168.1.10',
              createdAt: nowDateTime(),
            },
          ],
        });

        return { success: true, phoneIssues };
      },

      addRecord: (record, isSupplement = false) => {
        const state = get();
        const now = nowDateTime();
        let phoneIssues: string[] = [];
        let finalRecord = { ...record };

        const phoneResult = validatePhone(record.authorizerPhone);
        if (phoneResult.partialSuccess) {
          phoneIssues = phoneResult.issues;
          finalRecord.authorizerPhone = phoneResult.normalizedValue;
          if (finalRecord.status === 'approved') finalRecord.status = 'partial';
        }
        finalRecord.phoneValidationIssues = phoneIssues.length > 0 ? phoneIssues : undefined;

        const newRec: AuthorizationRecord = {
          ...finalRecord,
          id: generateId('rec'),
          isSupplemented: isSupplement,
          createdAt: now,
          updatedAt: now,
        } as AuthorizationRecord;

        const supplementHistory: HistoryChange = {
          id: generateId('h'),
          recordId: newRec.id,
          fieldName: 'isSupplemented',
          fieldLabel: '是否手工补录',
          oldValue: 'false',
          newValue: 'true',
          changedBy: state.currentUser.id,
          changedByName: state.currentUser.name,
          changeReason: isSupplement ? `手工补录：${record.supplementSource || '离线数据录入'}` : '新建授权记录',
          changedAt: now,
        };

        set({
          records: [newRec, ...state.records],
          history: [...state.history, supplementHistory],
        });

        return newRec;
      },

      addAuditLog: (log) => {
        set((s) => ({
          auditLogs: [
            ...s.auditLogs,
            { ...log, id: generateId('a'), createdAt: nowDateTime() },
          ],
        }));
      },

      performExport: (config) => {
        const state = get();
        doExportUtil(state.records, state.history, config);

        const targetRecords = config.recordIds && config.recordIds.length > 0
          ? state.records.filter((r) => config.recordIds!.includes(r.id))
          : state.records;

        const containsPrivate = config.fields.some(isPrivateField);

        set((s) => ({
          auditLogs: [
            ...s.auditLogs,
            {
              id: generateId('a'),
              actionType: 'export',
              operatorId: s.currentUser.id,
              operatorName: s.currentUser.name,
              exportFormat: config.format,
              containsPrivateData: containsPrivate,
              desensitized: config.desensitizePrivate,
              fieldsInvolved: config.fields,
              ipAddress: '192.168.1.10',
              createdAt: nowDateTime(),
            },
          ],
        }));

        void targetRecords;
      },

      resetStore: () => {
        set({
          records: MOCK_RECORDS,
          history: MOCK_HISTORY,
          materials: MOCK_MATERIALS,
          auditLogs: MOCK_AUDIT_LOGS,
          selectedRecordIds: [],
          searchKeyword: '',
          filterStatus: 'all',
          filterHasException: null,
          filterSupplemented: null,
        });
      },
    }),
    {
      name: 'child-care-auth-wall',
      partialize: (state) => ({
        records: state.records,
        history: state.history,
        materials: state.materials,
        auditLogs: state.auditLogs,
      }),
    },
  ),
);
