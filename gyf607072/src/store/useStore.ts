import { create } from "zustand";
import type { StoreState, RecordStatus, UserRole, FoodRecord } from "@/types";
import { mockRecords } from "@/data/mockRecords";

export const useStore = create<StoreState>((set, get) => ({
  records: mockRecords,
  currentRole: "parent",
  activeFilter: "all",
  parentNote: "沐沐今天有点湿疹，饮食请格外注意，海鲜和易发食物请避开",
  parentNoteUpdatedAt: "2026-06-08 09:12",
  needsReconfirm: true,

  setRole: (role: UserRole) => set({ currentRole: role }),

  setFilter: (filter: RecordStatus | "all") => set({ activeFilter: filter }),

  getRecordById: (id: string) => {
    return get().records.find((r) => r.id === id);
  },

  addSupplement: (recordId: string, content: string, addedBy: string) => {
    set((state) => ({
      records: state.records.map((r) => {
        if (r.id !== recordId) return r;
        const now = new Date().toLocaleString("zh-CN", { hour12: false });
        return {
          ...r,
          supplements: [
            ...r.supplements,
            {
              id: `s-${Date.now()}`,
              content,
              addedBy,
              addedAt: now,
              addedAfterClose: r.isClosed,
            },
          ],
        };
      }),
    }));
  },

  reconfirmAll: () => {
    set({ needsReconfirm: false });
  },

  reviseRecord: (recordId: string, newStatus: RecordStatus, reason: string, operatorName: string) => {
    set((state) => ({
      records: state.records.map((r) => {
        if (r.id !== recordId) return r;
        const now = new Date().toLocaleString("zh-CN", { hour12: false });
        const statusLabel: Record<string, string> = {
          normal: "人工复核：确认正常",
          revised: "人工改判：调整结论",
          abnormal: "维持异常状态",
        };
        return {
          ...r,
          status: newStatus,
          auditLogs: [
            ...r.auditLogs,
            {
              id: `a-${Date.now()}`,
              action: "manual_review",
              actionLabel: statusLabel[newStatus] || "人工处理",
              operatorName,
              timestamp: now,
              handlerMissing: false,
              reason,
            },
          ],
        } as FoodRecord;
      }),
    }));
  },
}));
