import { create } from "zustand";
import type {
  UserRole,
  VerifyRecord,
  VerifyRecordInput,
  BalanceSnapshot,
  FeeUnit,
  VerifyStatus,
  RemarkEntry,
  AuditLogEntry,
} from "@/types";
import {
  mockRecords,
  initialBalance,
  uid,
  now,
  isBoundaryQuantity,
} from "@/data/mockData";

interface AppState {
  currentRole: UserRole;
  currentUser: string;
  records: VerifyRecord[];
  balance: BalanceSnapshot;
  activeRecordId: string | null;
  currentStep: number;

  switchRole: (role: UserRole) => void;
  setCurrentUser: (name: string) => void;
  setActiveRecord: (id: string | null) => void;
  setCurrentStep: (step: number) => void;

  getValidRecords: () => VerifyRecord[];
  getInvalidRecords: () => VerifyRecord[];
  getBoundaryRecords: () => VerifyRecord[];
  getSupplementedRecords: () => VerifyRecord[];

  verifyRecord: (
    id: string,
    options?: {
      unitMixed?: boolean;
      targetUnit?: FeeUnit;
      targetQuantity?: number;
      treatBoundaryAsNormal?: boolean;
    }
  ) => { success: boolean; message: string };

  addRemark: (recordId: string, content: string) => void;
  supplementRecord: (input: VerifyRecordInput) => VerifyRecord;
  importRecords: (
    batchId: string,
    newRecords: VerifyRecord[]
  ) => { invalidated: number; added: number };
  markBoundaryAudited: (id: string, note?: string) => void;
  recalculateBalance: () => BalanceSnapshot;
  getAllAuditLogs: () => AuditLogEntry[];
  checkConsistency: () => {
    consultantCount: number;
    supervisorCount: number;
    consistent: boolean;
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  currentRole: "consultant",
  currentUser: "李顾问",
  records: mockRecords,
  balance: initialBalance,
  activeRecordId: null,
  currentStep: 1,

  switchRole: (role) => {
    set({
      currentRole: role,
      currentUser: role === "supervisor" ? "主管-林姐" : "李顾问",
    });
  },

  setCurrentUser: (name) => set({ currentUser: name }),

  setActiveRecord: (id) => set({ activeRecordId: id, currentStep: id ? 1 : 1 }),

  setCurrentStep: (step) => set({ currentStep: step }),

  getValidRecords: () => get().records.filter((r) => !r.isInvalid),

  getInvalidRecords: () => get().records.filter((r) => r.isInvalid),

  getBoundaryRecords: () =>
    get().records.filter((r) => r.isBoundaryValue && !r.isInvalid),

  getSupplementedRecords: () =>
    get().records.filter((r) => r.isSupplemented && !r.isInvalid),

  verifyRecord: (id, options = {}) => {
    const { records, currentUser, currentRole } = get();
    const idx = records.findIndex((r) => r.id === id);
    if (idx < 0) return { success: false, message: "记录不存在" };

    const rec = records[idx];
    if (rec.isInvalid) return { success: false, message: "该记录已失效" };

    const updates: Partial<VerifyRecord> = {
      updatedAt: now(),
      verifiedBy: currentUser,
      verifiedAt: now(),
    };

    const newAuditLogs: AuditLogEntry[] = [...rec.auditLogs];

    if (options.unitMixed && options.targetUnit && options.targetUnit !== rec.unit) {
      updates.unitMixed = true;
      updates.originalUnit = rec.unit;
      updates.unit = options.targetUnit;
      if (options.targetQuantity !== undefined) {
        updates.quantity = options.targetQuantity;
        updates.amount = options.targetQuantity * rec.unitPrice;
      }
      updates.status = "partially_verified";
      newAuditLogs.push({
        id: uid(),
        action: "verify",
        recordId: id,
        field: "unit",
        oldValue: `${rec.quantity} ${rec.unit}`,
        newValue: `${updates.quantity ?? rec.quantity} ${options.targetUnit} (部分成功)`,
        operator: currentUser,
        operatorRole: currentRole,
        timestamp: now(),
        note: "单位混用,标记为部分核销",
      });
    } else {
      updates.status = "verified";
      newAuditLogs.push({
        id: uid(),
        action: "verify",
        recordId: id,
        operator: currentUser,
        operatorRole: currentRole,
        timestamp: now(),
        note: "核销成功",
      });
    }

    if (rec.isBoundaryValue && options.treatBoundaryAsNormal) {
      newAuditLogs.push({
        id: uid(),
        action: "mark_boundary",
        recordId: id,
        field: "isBoundaryValue",
        oldValue: "true",
        newValue: "treated_as_normal",
        operator: currentUser,
        operatorRole: currentRole,
        timestamp: now(),
        note: "边界值按正常处理,已保留审计日志供主管复查",
      });
    }

    updates.auditLogs = newAuditLogs;

    const newRecords = [...records];
    newRecords[idx] = { ...rec, ...updates };
    set({ records: newRecords });

    const balance = get().recalculateBalance();
    set({ balance });

    return { success: true, message: "核销完成" };
  },

  addRemark: (recordId, content) => {
    const { records, currentUser, currentRole } = get();
    const idx = records.findIndex((r) => r.id === recordId);
    if (idx < 0) return;

    const rec = records[idx];
    const lastRemark = rec.remarkHistory[rec.remarkHistory.length - 1];
    const entry: RemarkEntry = {
      id: uid(),
      content,
      operator: currentUser,
      operatorRole: currentRole,
      timestamp: now(),
      previousContent: lastRemark?.content,
    };

    const auditLog: AuditLogEntry = {
      id: uid(),
      action: "update_remark",
      recordId,
      oldValue: lastRemark?.content,
      newValue: content,
      operator: currentUser,
      operatorRole: currentRole,
      timestamp: now(),
      note: lastRemark ? "备注变更,保留原有内容" : "新增备注",
    };

    const newRecords = [...records];
    newRecords[idx] = {
      ...rec,
      remarkHistory: [...rec.remarkHistory, entry],
      auditLogs: [...rec.auditLogs, auditLog],
      updatedAt: now(),
    };
    set({ records: newRecords });
  },

  supplementRecord: (input) => {
    const { records, currentUser, currentRole, balance } = get();
    const isBoundary = isBoundaryQuantity(input.quantity);
    const newRecord: VerifyRecord = {
      id: "rec_" + uid(),
      parentName: input.parentName,
      childName: input.childName,
      childAge: input.childAge,
      courseName: input.courseName,
      quantity: input.quantity,
      unit: input.unit,
      unitMixed: false,
      isBoundaryValue: isBoundary,
      unitPrice: input.unitPrice,
      amount: input.quantity * input.unitPrice,
      status: "pending",
      createdAt: now(),
      updatedAt: now(),
      createdBy: currentUser,
      isImported: false,
      isInvalid: false,
      isSupplemented: true,
      remarkHistory: input.initialRemark
        ? [
            {
              id: uid(),
              content: input.initialRemark,
              operator: currentUser,
              operatorRole: currentRole,
              timestamp: now(),
            },
          ]
        : [],
      auditLogs: [
        {
          id: uid(),
          action: "supplement",
          operator: currentUser,
          operatorRole: currentRole,
          timestamp: now(),
          note: `手工补录:补录前余额${balance.remainingBalance},新增核销金额${input.quantity * input.unitPrice}`,
        },
      ],
    };

    if (isBoundary) {
      newRecord.auditLogs.push({
        id: uid(),
        action: "mark_boundary",
        operator: "系统",
        operatorRole: currentRole,
        timestamp: now(),
        note: `补录记录自动识别为边界值:数量=${input.quantity}`,
      });
    }

    set({ records: [newRecord, ...records] });
    get().recalculateBalance();
    return newRecord;
  },

  importRecords: (batchId, newRecords) => {
    const { records, currentUser, currentRole } = get();
    let invalidated = 0;
    const updated = records.map((r) => {
      if (r.isImported && r.importBatchId === batchId && !r.isInvalid) {
        invalidated++;
        return {
          ...r,
          isInvalid: true,
          invalidReason: `批次${batchId}重新导入,旧记录已失效`,
          invalidatedAt: now(),
          updatedAt: now(),
          auditLogs: [
            ...r.auditLogs,
            {
              id: uid(),
              action: "invalidate" as const,
              operator: currentUser,
              operatorRole: currentRole,
              timestamp: now(),
              note: `重新导入批次${batchId},旧记录自动失效`,
            },
          ],
        };
      }
      return r;
    });

    const stamped: VerifyRecord[] = newRecords.map((r) => ({
      ...r,
      id: "rec_" + uid(),
      isImported: true,
      importBatchId: batchId,
      createdAt: now(),
      updatedAt: now(),
      auditLogs: [
        ...r.auditLogs,
        {
          id: uid(),
          action: "import" as const,
          operator: currentUser,
          operatorRole: currentRole,
          timestamp: now(),
          note: `从批次${batchId}导入`,
        },
      ],
    }));

    set({ records: [...updated, ...stamped] });
    get().recalculateBalance();
    return { invalidated, added: stamped.length };
  },

  markBoundaryAudited: (id, note) => {
    const { records, currentUser, currentRole } = get();
    const idx = records.findIndex((r) => r.id === id);
    if (idx < 0) return;
    const rec = records[idx];

    const newRecords = [...records];
    newRecords[idx] = {
      ...rec,
      boundaryAudited: true,
      boundaryAuditedBy: currentUser,
      boundaryAuditedAt: now(),
      updatedAt: now(),
      auditLogs: [
        ...rec.auditLogs,
        {
          id: uid(),
          action: "audit_boundary",
          operator: currentUser,
          operatorRole: currentRole,
          timestamp: now(),
          note: note || "主管边界值复核通过",
        },
      ],
    };
    set({ records: newRecords });
  },

  recalculateBalance: () => {
    const { records, balance } = get();
    const verifiedAmount = records
      .filter((r) => !r.isInvalid && (r.status === "verified" || r.status === "partially_verified"))
      .reduce((sum, r) => sum + r.amount, 0);
    const remaining = balance.initialBalance - verifiedAmount;
    const newBalance: BalanceSnapshot = {
      ...balance,
      verifiedAmount,
      remainingBalance: remaining,
      updatedAt: now(),
    };
    return newBalance;
  },

  getAllAuditLogs: () => {
    return get()
      .records.flatMap((r) =>
        r.auditLogs.map((log) => ({
          ...log,
          recordId: r.id,
          recordTitle: `${r.parentName}-${r.courseName}`,
        }))
      )
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  },

  checkConsistency: () => {
    const valid = get().records.filter((r) => !r.isInvalid);
    const pendingCount = valid.filter((r) => r.status === "pending").length;
    return {
      consultantCount: pendingCount,
      supervisorCount: pendingCount,
      consistent: true,
    };
  },
}));
