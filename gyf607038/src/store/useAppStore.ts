import { create } from 'zustand';
import type {
  InfantRecord,
  HistoryVersion,
  AuditLog,
  RecordFilters,
  AuditFilters,
  NewRecordInput,
  RecordStatus,
  AuditAction,
  UserRole,
  AppendedMaterial,
} from '@/utils/types';
import {
  STORAGE_KEYS,
  loadFromStorage,
  saveToStorage,
  createMockData,
  uid,
  exportToCSV,
  downloadCSV,
} from '@/utils/helpers';
import { FIELD_LABEL } from '@/utils/types';

interface CurrentUser {
  name: string;
  role: UserRole;
}

interface AppState {
  records: InfantRecord[];
  histories: HistoryVersion[];
  audits: AuditLog[];
  currentUser: CurrentUser;

  init: () => void;
  setCurrentUser: (user: CurrentUser) => void;

  getRecords: (filters?: RecordFilters) => InfantRecord[];
  getRecordById: (id: string) => InfantRecord | undefined;
  getHistoriesByRecordId: (recordId: string) => HistoryVersion[];
  getAudits: (filters?: AuditFilters) => AuditLog[];

  createRecord: (input: NewRecordInput) => InfantRecord;
  updateRecord: (id: string, patch: Partial<InfantRecord>, reason?: string) => void;
  reviewRecord: (id: string, status: RecordStatus, reason?: string) => void;
  appendMaterial: (id: string, content: string) => void;
  markBadData: (id: string, reason: string) => void;
  setNoHandlerReason: (id: string, reason: string) => void;

  exportRecords: (filters?: RecordFilters) => void;

  addAudit: (action: AuditAction, recordId?: string, summary?: string, snapshot?: string) => void;
}

function matchRecord(r: InfantRecord, f: RecordFilters): boolean {
  if (f.status && r.status !== f.status) return false;
  if (f.batchNo && !r.batchNo.toLowerCase().includes(f.batchNo.toLowerCase())) return false;
  if (f.phone && !r.phone.includes(f.phone)) return false;
  if (f.keyword) {
    const kw = f.keyword.toLowerCase();
    const hit =
      r.infantName.toLowerCase().includes(kw) ||
      r.parentName.toLowerCase().includes(kw) ||
      r.batchNo.toLowerCase().includes(kw) ||
      r.phone.includes(kw);
    if (!hit) return false;
  }
  return true;
}

function matchAudit(a: AuditLog, f: AuditFilters): boolean {
  if (f.action && a.action !== f.action) return false;
  if (f.operator && !a.operator.includes(f.operator)) return false;
  if (f.dateFrom && a.createdAt < f.dateFrom) return false;
  if (f.dateTo && a.createdAt > f.dateTo + 'T23:59:59') return false;
  if (f.keyword) {
    const kw = f.keyword.toLowerCase();
    if (!a.summary.toLowerCase().includes(kw) && !a.operator.toLowerCase().includes(kw)) return false;
  }
  return true;
}

export const useAppStore = create<AppState>((set, get) => ({
  records: [],
  histories: [],
  audits: [],
  currentUser: { name: '李顾问', role: 'consultant' },

  init: () => {
    let records = loadFromStorage<InfantRecord[]>(STORAGE_KEYS.records, []);
    let histories = loadFromStorage<HistoryVersion[]>(STORAGE_KEYS.histories, []);
    let audits = loadFromStorage<AuditLog[]>(STORAGE_KEYS.audits, []);
    const currentUser = loadFromStorage<CurrentUser>(STORAGE_KEYS.currentUser, {
      name: '李顾问',
      role: 'consultant' as UserRole,
    });

    if (records.length === 0) {
      const mock = createMockData();
      records = mock.records;
      histories = mock.histories;
      audits = mock.audits;
      saveToStorage(STORAGE_KEYS.records, records);
      saveToStorage(STORAGE_KEYS.histories, histories);
      saveToStorage(STORAGE_KEYS.audits, audits);
    }

    set({ records, histories, audits, currentUser });
  },

  setCurrentUser: (user) => {
    saveToStorage(STORAGE_KEYS.currentUser, user);
    set({ currentUser: user });
  },

  getRecords: (filters) => {
    const all = get().records.filter((r) => !r.isBadData);
    if (!filters) return all;
    return all.filter((r) => matchRecord(r, filters));
  },

  getRecordById: (id) => {
    return get().records.find((r) => r.id === id);
  },

  getHistoriesByRecordId: (recordId) => {
    return get().histories
      .filter((h) => h.recordId === recordId)
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  },

  getAudits: (filters) => {
    const all = [...get().audits].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (!filters) return all;
    return all.filter((a) => matchAudit(a, filters));
  },

  createRecord: (input) => {
    const { currentUser } = get();
    const now = new Date().toISOString();
    const record: InfantRecord = {
      id: uid(),
      ...input,
      status: 'pending',
      isBadData: false,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser.name,
      lastUpdatedBy: currentUser.name,
    };
    const records = [record, ...get().records];
    set({ records });
    saveToStorage(STORAGE_KEYS.records, records);

    get().addAudit(
      'create',
      record.id,
      `新增婴幼儿记录：${record.infantName}（${record.batchNo}）`,
      JSON.stringify(record),
    );
    return record;
  },

  updateRecord: (id, patch, reason) => {
    const { currentUser, records, histories } = get();
    const now = new Date().toISOString();
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) return;
    const old = records[idx];
    const updated = { ...old, ...patch, updatedAt: now, lastUpdatedBy: currentUser.name };

    const newHistories: HistoryVersion[] = [];
    (Object.keys(patch) as (keyof InfantRecord)[]).forEach((key) => {
      const oldVal = old[key];
      const newVal = patch[key];
      if (String(oldVal) !== String(newVal)) {
        newHistories.push({
          id: uid(),
          recordId: id,
          fieldName: key as string,
          fieldLabel: FIELD_LABEL[key] || (key as string),
          oldValue: oldVal == null ? '' : String(oldVal),
          newValue: newVal == null ? '' : String(newVal),
          operator: currentUser.name,
          changedAt: now,
          changeReason: reason,
        });
      }
    });

    const nextRecords = [...records];
    nextRecords[idx] = updated;
    const nextHistories = [...histories, ...newHistories];

    set({ records: nextRecords, histories: nextHistories });
    saveToStorage(STORAGE_KEYS.records, nextRecords);
    saveToStorage(STORAGE_KEYS.histories, nextHistories);

    if (newHistories.length > 0) {
      const summaryFields = newHistories.map((h) => h.fieldLabel).join('、');
      get().addAudit(
        'update',
        id,
        `修改记录 ${updated.batchNo} 的字段：${summaryFields}${reason ? '（' + reason + '）' : ''}`,
      );
    }
  },

  reviewRecord: (id, status, reason) => {
    const { getRecordById } = get();
    const record = getRecordById(id);
    if (!record) return;
    get().updateRecord(id, { status } as Partial<InfantRecord>, reason || '状态复核');
  },

  appendMaterial: (id, content) => {
    const { currentUser, records, audits } = get();
    const now = new Date().toISOString();
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) return;
    const old = records[idx];
    const material: AppendedMaterial = {
      id: uid(),
      content,
      operator: currentUser.name,
      appendedAt: now,
    };
    const appendedMaterials = [...(old.appendedMaterials || []), material];
    const updated = {
      ...old,
      appendedMaterials,
      updatedAt: now,
      lastUpdatedBy: currentUser.name,
    };
    const nextRecords = [...records];
    nextRecords[idx] = updated;
    set({ records: nextRecords });
    saveToStorage(STORAGE_KEYS.records, nextRecords);

    const audit: AuditLog = {
      id: uid(),
      recordId: id,
      action: 'append',
      operator: currentUser.name,
      operatorRole: currentUser.role,
      summary: `已${old.status === 'closed' ? '关闭' : ''}记录 ${old.batchNo} 追加材料：${content.slice(0, 30)}${content.length > 30 ? '...' : ''}`,
      createdAt: now,
      detailSnapshot: content,
    };
    const nextAudits = [...audits, audit];
    set({ audits: nextAudits });
    saveToStorage(STORAGE_KEYS.audits, nextAudits);
  },

  markBadData: (id, reason) => {
    get().updateRecord(id, { isBadData: true, badDataReason: reason, status: 'invalid' } as Partial<InfantRecord>, '标记为坏数据');
  },

  setNoHandlerReason: (id, reason) => {
    get().updateRecord(id, { noHandlerReason: reason } as Partial<InfantRecord>, '补充无处理人原因');
  },

  exportRecords: (filters) => {
    const data = get().getRecords(filters);
    const csv = exportToCSV(data);
    const date = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `婴幼儿批次记录_${date}.csv`);
    get().addAudit('export', undefined, `导婴幼儿批次记录共 ${data.length} 条`);
  },

  addAudit: (action, recordId, summary, snapshot) => {
    const { currentUser, audits } = get();
    const audit: AuditLog = {
      id: uid(),
      recordId,
      action,
      operator: currentUser.name,
      operatorRole: currentUser.role,
      summary: summary || `${action} 操作`,
      createdAt: new Date().toISOString(),
      detailSnapshot: snapshot,
    };
    const next = [...audits, audit];
    set({ audits: next });
    saveToStorage(STORAGE_KEYS.audits, next);
  },
}));
