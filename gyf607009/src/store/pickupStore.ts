import { create } from 'zustand';
import type {
  PickupRecord,
  AuditLog,
  CorrectionRecord,
  BatchOperationResult,
  PickupStatus,
  PickupType,
  PhoneAuthInfo,
  TempAuntInfo,
  UserRole,
} from '@/types';
import { mockPickupRecords, mockAuditLogs, mockCorrectionRecords } from '@/data/mockData';
import { generateId, nowISO } from '@/utils/report';

const CURRENT_USER = {
  name: '门岗-张建国',
  role: 'duty_officer' as UserRole,
};

const SUPERVISOR = {
  name: '门岗负责人-李明远',
  role: 'gate_supervisor' as UserRole,
};

interface PickupState {
  records: PickupRecord[];
  auditLogs: AuditLog[];
  corrections: CorrectionRecord[];
  selectedRecordId: string | null;
  lastBatchResult: BatchOperationResult | null;
  flashRecordId: string | null;

  selectRecord: (id: string | null) => void;
  setFlash: (id: string | null) => void;
  clearBatchResult: () => void;

  markNormalPicked: (recordId: string, pickupPerson: string) => void;
  markPhoneAuthorized: (recordId: string, info: PhoneAuthInfo, pickupPerson: string) => void;
  markTempAunt: (recordId: string, info: TempAuntInfo) => void;
  markException: (recordId: string, reason: string, conflictNote?: string) => void;
  withdrawRecord: (recordId: string, reason: string) => void;

  batchConfirmPending: (ids: string[]) => BatchOperationResult;

  createCorrection: (
    recordId: string,
    correctedData: Partial<PickupRecord>,
    reason: string
  ) => void;
  markCorrectionReviewed: (correctionId: string) => void;

  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp' | 'operator' | 'operatorRole'> & { operator?: string; operatorRole?: UserRole }) => void;
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export const usePickupStore = create<PickupState>((set, get) => ({
  records: clone(mockPickupRecords),
  auditLogs: clone(mockAuditLogs),
  corrections: clone(mockCorrectionRecords),
  selectedRecordId: null,
  lastBatchResult: null,
  flashRecordId: null,

  selectRecord: (id) => set({ selectedRecordId: id }),
  setFlash: (id) => {
    set({ flashRecordId: id });
    if (id) setTimeout(() => set({ flashRecordId: null }), 900);
  },
  clearBatchResult: () => set({ lastBatchResult: null }),

  addAuditLog: (log) => {
    const full: AuditLog = {
      id: generateId('A'),
      timestamp: nowISO(),
      operator: log.operator ?? CURRENT_USER.name,
      operatorRole: log.operatorRole ?? CURRENT_USER.role,
      ...log,
    };
    set({ auditLogs: [...get().auditLogs, full] });
  },

  markNormalPicked: (recordId, pickupPerson) => {
    set({
      records: get().records.map((r) =>
        r.id === recordId
          ? { ...r, status: 'picked', pickupType: 'normal', pickupPerson, updatedAt: nowISO(), pickedAt: nowISO() }
          : r
      ),
    });
    get().addAuditLog({ recordId, action: 'update', fieldChanged: 'status', oldValue: 'pending', newValue: 'picked' });
    get().setFlash(recordId);
  },

  markPhoneAuthorized: (recordId, info, pickupPerson) => {
    set({
      records: get().records.map((r) =>
        r.id === recordId
          ? {
              ...r,
              status: 'picked',
              pickupType: 'phone_authorized',
              pickupPerson,
              phoneAuth: info,
              updatedAt: nowISO(),
              pickedAt: nowISO(),
            }
          : r
      ),
    });
    get().addAuditLog({
      recordId,
      action: 'update',
      fieldChanged: 'pickupType',
      oldValue: get().records.find((r) => r.id === recordId)?.pickupType ?? 'pending',
      newValue: 'phone_authorized',
      reason: `电话授权：${info.callerName}（${info.callerPhone}），由 ${pickupPerson} 接走`,
    });
    get().addAuditLog({ recordId, action: 'update', fieldChanged: 'status', oldValue: 'pending', newValue: 'picked' });
    get().setFlash(recordId);
  },

  markTempAunt: (recordId, info) => {
    set({
      records: get().records.map((r) =>
        r.id === recordId
          ? {
              ...r,
              status: 'picked',
              pickupType: 'temp_aunt',
              pickupPerson: info.auntName,
              tempAunt: info,
              updatedAt: nowISO(),
              pickedAt: nowISO(),
            }
          : r
      ),
    });
    get().addAuditLog({
      recordId,
      action: 'update',
      fieldChanged: 'pickupType',
      oldValue: get().records.find((r) => r.id === recordId)?.pickupType ?? 'pending',
      newValue: 'temp_aunt',
      reason: `临时阿姨接送：${info.auntName}（工号${info.auntId}）`,
    });
    get().addAuditLog({ recordId, action: 'update', fieldChanged: 'status', oldValue: 'pending', newValue: 'picked' });
    get().setFlash(recordId);
  },

  markException: (recordId, reason, conflictNote) => {
    set({
      records: get().records.map((r) =>
        r.id === recordId
          ? { ...r, status: 'exception', exceptionReason: reason, conflictNote, updatedAt: nowISO() }
          : r
      ),
    });
    get().addAuditLog({
      recordId,
      action: 'update',
      fieldChanged: 'status',
      oldValue: get().records.find((r) => r.id === recordId)?.status ?? 'pending',
      newValue: 'exception',
      reason,
    });
  },

  withdrawRecord: (recordId, reason) => {
    const rec = get().records.find((r) => r.id === recordId);
    if (!rec) return;
    set({
      records: get().records.map((r) =>
        r.id === recordId
          ? {
              ...r,
              status: 'withdrawn' as PickupStatus,
              withdrawnReason: reason,
              withdrawnBy: SUPERVISOR.name,
              withdrawnAt: nowISO(),
              updatedAt: nowISO(),
            }
          : r
      ),
    });
    get().addAuditLog({
      recordId,
      action: 'withdraw',
      fieldChanged: 'status',
      oldValue: rec.status,
      newValue: 'withdrawn',
      reason,
      operator: SUPERVISOR.name,
      operatorRole: SUPERVISOR.role,
    });
  },

  batchConfirmPending: (ids) => {
    const state = get();
    const succeeded: string[] = [];
    const failed: { recordId: string; reason: string }[] = [];
    const updated = state.records.map((r) => {
      if (!ids.includes(r.id)) return r;
      if (r.isBadRow) {
        failed.push({ recordId: r.id, reason: '坏行，不允许批量确认，需人工处理' });
        return r;
      }
      if (r.status !== 'pending') {
        failed.push({ recordId: r.id, reason: `当前状态为 ${r.status}，不是待接送` });
        return r;
      }
      if (r.pickupType !== 'normal') {
        failed.push({ recordId: r.id, reason: `${r.pickupType} 类型需单独登记凭证，不允许批量确认` });
        return r;
      }
      succeeded.push(r.id);
      return { ...r, status: 'picked' as PickupStatus, pickupPerson: r.authorizedBy, updatedAt: nowISO(), pickedAt: nowISO() };
    });
    set({ records: updated });
    succeeded.forEach((id) => {
      get().addAuditLog({ recordId: id, action: 'batch_pick', fieldChanged: 'status', oldValue: 'pending', newValue: 'picked' });
      get().setFlash(id);
    });
    const result: BatchOperationResult = {
      total: ids.length,
      succeeded: succeeded.length,
      failed: failed.length,
      succeededIds: succeeded,
      failedIds: failed.map((f) => f.recordId),
      failedDetails: failed,
    };
    if (failed.length > 0) {
      get().addAuditLog({
        recordId: succeeded[0] ?? 'BATCH',
        action: 'partial_success',
        reason: `批量确认部分成功：成功 ${succeeded.length} / 失败 ${failed.length}`,
      });
    }
    set({ lastBatchResult: result });
    return result;
  },

  createCorrection: (recordId, correctedData, reason) => {
    const rec = get().records.find((r) => r.id === recordId);
    if (!rec) return;
    const corrected: PickupRecord = { ...clone(rec), ...correctedData, updatedAt: nowISO() };
    const correction: CorrectionRecord = {
      id: generateId('C'),
      recordId,
      originalSnapshot: clone(rec),
      correctedSnapshot: corrected,
      correctedBy: SUPERVISOR.name,
      correctedAt: nowISO(),
      correctionReason: reason,
      isReviewed: false,
    };
    set({ corrections: [...get().corrections, correction] });
    set({
      records: get().records.map((r) => (r.id === recordId ? corrected : r)),
    });
    get().addAuditLog({
      recordId,
      action: 'correct',
      reason,
      operator: SUPERVISOR.name,
      operatorRole: SUPERVISOR.role,
    });
  },

  markCorrectionReviewed: (correctionId) => {
    set({
      corrections: get().corrections.map((c) =>
        c.id === correctionId
          ? { ...c, isReviewed: true, reviewedBy: '托育主管-王主任', reviewedAt: nowISO() }
          : c
      ),
    });
  },
}));

export function useCurrentUser() {
  return CURRENT_USER;
}
export function useSupervisor() {
  return SUPERVISOR;
}

export function useSummary() {
  const records = usePickupStore((s) => s.records);
  return {
    totalExpected: records.filter((r) => !r.isBadRow).length,
    totalPicked: records.filter((r) => r.status === 'picked').length,
    totalException: records.filter((r) => r.status === 'exception' && !r.isBadRow).length,
    totalPhone: records.filter((r) => r.pickupType === 'phone_authorized').length,
    totalTempAunt: records.filter((r) => r.pickupType === 'temp_aunt').length,
    totalWithdrawn: records.filter((r) => r.status === 'withdrawn').length,
    totalBadRows: records.filter((r) => r.isBadRow).length,
    totalPending: records.filter((r) => r.status === 'pending').length,
  };
}

export type { PickupStatus, PickupType };
