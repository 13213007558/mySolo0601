import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { FollowUpRecord, AuditLog, FilterParams, ParentVisibleInfo, InternalInfo, ExportMeta, AuditChange } from './types';
import { mockRecords, mockAuditLogs } from './mockData';

interface AppState {
  records: FollowUpRecord[];
  auditLogs: AuditLog[];
  currentFilters: FilterParams;
  selectedRecordId: string | null;
  currentUser: { id: string; name: string; role: 'nurse' | 'teacher' };
  exportHistory: ExportMeta[];
  lastExportCountMismatch: { exportId: string; pageCount: number; exportedCount: number; reason: string } | null;
}

type Action =
  | { type: 'SET_FILTERS'; payload: FilterParams }
  | { type: 'SELECT_RECORD'; payload: string | null }
  | { type: 'ADD_RECORD'; payload: { record: FollowUpRecord; auditLog: AuditLog } }
  | { type: 'UPDATE_RECORD'; payload: { record: FollowUpRecord; auditLog: AuditLog } }
  | { type: 'REVIEW_RECORD'; payload: { record: FollowUpRecord; auditLog: AuditLog } }
  | { type: 'MARK_EXPORT'; payload: ExportMeta }
  | { type: 'SET_EXPORT_MISMATCH'; payload: AppState['lastExportCountMismatch'] };

const defaultFilters: FilterParams = {
  keyword: '',
  status: 'all',
  dataQuality: 'all',
  startDate: '',
  endDate: '',
  isManualEntry: null,
  reviewed: null,
};

const initialState: AppState = {
  records: mockRecords,
  auditLogs: mockAuditLogs,
  currentFilters: defaultFilters,
  selectedRecordId: null,
  currentUser: { id: 'nurse-01', name: '王护士', role: 'nurse' },
  exportHistory: [],
  lastExportCountMismatch: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_FILTERS':
      return { ...state, currentFilters: action.payload };
    case 'SELECT_RECORD':
      return { ...state, selectedRecordId: action.payload };
    case 'ADD_RECORD':
      return {
        ...state,
        records: [action.payload.record, ...state.records],
        auditLogs: [action.payload.auditLog, ...state.auditLogs],
      };
    case 'UPDATE_RECORD':
      return {
        ...state,
        records: state.records.map(r => (r.id === action.payload.record.id ? action.payload.record : r)),
        auditLogs: [action.payload.auditLog, ...state.auditLogs],
      };
    case 'REVIEW_RECORD':
      return {
        ...state,
        records: state.records.map(r => (r.id === action.payload.record.id ? action.payload.record : r)),
        auditLogs: [action.payload.auditLog, ...state.auditLogs],
      };
    case 'MARK_EXPORT':
      return {
        ...state,
        exportHistory: [action.payload, ...state.exportHistory],
      };
    case 'SET_EXPORT_MISMATCH':
      return { ...state, lastExportCountMismatch: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  getFilteredRecords: () => FollowUpRecord[];
  getRecordById: (id: string) => FollowUpRecord | undefined;
  getAuditLogsForRecord: (recordId: string) => AuditLog[];
  createRecord: (data: { parentVisible: ParentVisibleInfo; internal: InternalInfo; isManualEntry: boolean }) => FollowUpRecord;
  updateRecord: (id: string, changes: Partial<ParentVisibleInfo> & { internal?: Partial<InternalInfo>; reviewComments?: string }) => FollowUpRecord | null;
  reviewRecord: (id: string, result: 'pass' | 'fail', comments: string) => FollowUpRecord | null;
  setFilters: (filters: FilterParams) => void;
  selectRecord: (id: string | null) => void;
  exportRecords: () => { csv: string; meta: ExportMeta };
  getCurrentUser: () => AppState['currentUser'];
}

const AppContext = createContext<AppContextType | null>(null);

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function nowStr() {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function buildChangesFromPartial(
  old: FollowUpRecord,
  partial: Partial<ParentVisibleInfo> & { internal?: Partial<InternalInfo>; reviewComments?: string }
): AuditChange[] {
  const changes: AuditChange[] = [];
  for (const key of Object.keys(partial)) {
    if (key === 'internal') continue;
    const k = key as keyof ParentVisibleInfo;
    const oldVal = old.parentVisible[k];
    const newVal = partial[k];
    const oldStr = oldVal === null || oldVal === undefined ? '' : String(oldVal);
    const newStr = newVal === null || newVal === undefined ? '' : String(newVal);
    if (oldStr !== newStr) {
      changes.push({ field: `parentVisible.${k}`, oldValue: oldStr || null, newValue: newStr || null });
    }
  }
  if (partial.internal) {
    for (const key of Object.keys(partial.internal)) {
      const k = key as keyof InternalInfo;
      const oldVal = old.internal[k];
      const newVal = partial.internal[k];
      const oldStr = Array.isArray(oldVal) ? JSON.stringify(oldVal) : oldVal === null || oldVal === undefined ? '' : String(oldVal);
      const newStr = Array.isArray(newVal) ? JSON.stringify(newVal) : newVal === null || newVal === undefined ? '' : String(newVal);
      if (oldStr !== newStr) {
        changes.push({ field: `internal.${k}`, oldValue: oldStr || null, newValue: newStr || null });
      }
    }
  }
  if (partial.reviewComments !== undefined && partial.reviewComments !== old.reviewComments) {
    changes.push({ field: 'reviewComments', oldValue: old.reviewComments || null, newValue: partial.reviewComments || null });
  }
  return changes;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const getFilteredRecords = useCallback(() => {
    const f = state.currentFilters;
    return state.records.filter(r => {
      if (f.keyword) {
        const kw = f.keyword.toLowerCase();
        const haystack = [
          r.parentVisible.infantName,
          r.parentVisible.guardianName,
          r.parentVisible.vaccineBatch,
          r.parentVisible.vaccineName,
          r.internal.medicalRecordNo,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      if (f.status !== 'all' && r.status !== f.status) return false;
      if (f.dataQuality !== 'all' && r.dataQuality !== f.dataQuality) return false;
      if (f.startDate && r.parentVisible.vaccinationDate < f.startDate) return false;
      if (f.endDate && r.parentVisible.vaccinationDate > f.endDate) return false;
      if (f.isManualEntry !== null && r.isManualEntry !== f.isManualEntry) return false;
      if (f.reviewed === true && !r.reviewedAt) return false;
      if (f.reviewed === false && r.reviewedAt) return false;
      return true;
    });
  }, [state.records, state.currentFilters]);

  const getRecordById = useCallback(
    (id: string) => state.records.find(r => r.id === id),
    [state.records]
  );

  const getAuditLogsForRecord = useCallback(
    (recordId: string) => state.auditLogs.filter(a => a.recordId === recordId).sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [state.auditLogs]
  );

  const getCurrentUser = useCallback(() => state.currentUser, [state.currentUser]);

  const createRecord: AppContextType['createRecord'] = useCallback(
    ({ parentVisible, internal, isManualEntry }) => {
      const id = generateId('rec');
      const auditId = generateId('audit');
      const now = nowStr();
      const changes: AuditChange[] = [
        { field: 'isManualEntry', oldValue: null, newValue: String(isManualEntry) },
        ...Object.entries(parentVisible).map(([k, v]) => ({
          field: `parentVisible.${k}`,
          oldValue: null,
          newValue: Array.isArray(v) ? JSON.stringify(v) : v === null || v === undefined ? null : String(v),
        })),
      ];
      const record: FollowUpRecord = {
        id,
        parentVisible,
        internal,
        status: 'pending_review',
        dataQuality: 'normal',
        isManualEntry,
        createdAt: now,
        createdBy: state.currentUser.name,
        updatedAt: now,
        updatedBy: state.currentUser.name,
        reviewedAt: null,
        reviewedBy: null,
        reviewResult: null,
        reviewComments: '',
        anomalies: [],
        auditLogIds: [auditId],
      };
      const auditLog: AuditLog = {
        id: auditId,
        recordId: id,
        operatorId: state.currentUser.id,
        operatorName: state.currentUser.name,
        action: isManualEntry ? 'manual_entry' : 'create',
        changes,
        timestamp: now,
      };
      dispatch({ type: 'ADD_RECORD', payload: { record, auditLog } });
      return record;
    },
    [state.currentUser]
  );

  const updateRecord: AppContextType['updateRecord'] = useCallback(
    (id, partial) => {
      const old = state.records.find(r => r.id === id);
      if (!old) return null;
      const changes = buildChangesFromPartial(old, partial);
      if (changes.length === 0) return old;
      const now = nowStr();
      const auditId = generateId('audit');
      const updated: FollowUpRecord = {
        ...old,
        parentVisible: { ...old.parentVisible, ...partial },
        internal: { ...old.internal, ...partial.internal },
        reviewComments: partial.reviewComments ?? old.reviewComments,
        updatedAt: now,
        updatedBy: state.currentUser.name,
        auditLogIds: [...old.auditLogIds, auditId],
      };
      const auditLog: AuditLog = {
        id: auditId,
        recordId: id,
        operatorId: state.currentUser.id,
        operatorName: state.currentUser.name,
        action: 'update',
        changes,
        timestamp: now,
      };
      dispatch({ type: 'UPDATE_RECORD', payload: { record: updated, auditLog } });
      return updated;
    },
    [state.records, state.currentUser]
  );

  const reviewRecord: AppContextType['reviewRecord'] = useCallback(
    (id, result, comments) => {
      const old = state.records.find(r => r.id === id);
      if (!old) return null;
      const now = nowStr();
      const auditId = generateId('audit');
      const updated: FollowUpRecord = {
        ...old,
        status: result === 'pass' ? 'reviewed' : 'rejected',
        reviewedAt: now,
        reviewedBy: state.currentUser.name,
        reviewResult: result,
        reviewComments: comments,
        updatedAt: now,
        updatedBy: state.currentUser.name,
        auditLogIds: [...old.auditLogIds, auditId],
      };
      const auditLog: AuditLog = {
        id: auditId,
        recordId: id,
        operatorId: state.currentUser.id,
        operatorName: state.currentUser.name,
        action: 'review',
        changes: [
          { field: 'status', oldValue: old.status, newValue: updated.status },
          { field: 'reviewResult', oldValue: old.reviewResult, newValue: result },
          { field: 'reviewComments', oldValue: old.reviewComments || null, newValue: comments || null },
        ],
        timestamp: now,
      };
      dispatch({ type: 'REVIEW_RECORD', payload: { record: updated, auditLog } });
      return updated;
    },
    [state.records, state.currentUser]
  );

  const setFilters = useCallback((filters: FilterParams) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const selectRecord = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_RECORD', payload: id });
  }, []);

  const exportRecords: AppContextType['exportRecords'] = useCallback(() => {
    const filtered = getFilteredRecords();
    const pageCount = filtered.length;
    const rows = [
      ['档案编号', '婴幼儿姓名', '性别', '出生日期', '监护人', '联系电话', '疫苗名称', '疫苗批号', '接种日期', '接种部位', '下次随访', '状态', '数据质量', '是否补录', '复核人', '复核时间'],
      ...filtered.map(r => [
        r.internal.medicalRecordNo,
        r.parentVisible.infantName,
        r.parentVisible.gender === 'male' ? '男' : '女',
        r.parentVisible.birthDate,
        r.parentVisible.guardianName,
        r.parentVisible.guardianPhone,
        r.parentVisible.vaccineName,
        r.parentVisible.vaccineBatch,
        r.parentVisible.vaccinationDate,
        r.parentVisible.vaccinationSite,
        r.parentVisible.nextFollowUpDate,
        r.status,
        r.dataQuality,
        r.isManualEntry ? '是' : '否',
        r.reviewedBy || '',
        r.reviewedAt || '',
      ]),
    ];
    let simulateMismatch = false;
    let exportedCount = pageCount;
    let mismatchReason = '';
    if (state.currentFilters.dataQuality === 'missing_pages' || filtered.some(r => r.dataQuality === 'missing_pages')) {
      simulateMismatch = true;
      exportedCount = Math.max(0, pageCount - 1);
      mismatchReason = '检测到存在"材料缺页"标记的记录，导出时自动排除了 1 条缺页记录以避免污染下游系统。请在详情页查看具体缺页原因。';
    }
    const csv = rows.slice(0, simulateMismatch ? exportedCount + 1 : undefined).map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const exportId = generateId('exp');
    const now = nowStr();
    const meta: ExportMeta = {
      exportId,
      exportedAt: now,
      exportedBy: state.currentUser.name,
      recordCountInPage: pageCount,
      recordCountExported: exportedCount,
      filtersApplied: { ...state.currentFilters },
    };
    dispatch({ type: 'MARK_EXPORT', payload: meta });
    if (simulateMismatch) {
      dispatch({ type: 'SET_EXPORT_MISMATCH', payload: { exportId, pageCount, exportedCount, reason: mismatchReason } });
    } else {
      dispatch({ type: 'SET_EXPORT_MISMATCH', payload: null });
    }
    return { csv, meta };
  }, [getFilteredRecords, state.currentUser, state.currentFilters]);

  const value: AppContextType = {
    state,
    getFilteredRecords,
    getRecordById,
    getAuditLogsForRecord,
    createRecord,
    updateRecord,
    reviewRecord,
    setFilters,
    selectRecord,
    exportRecords,
    getCurrentUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
