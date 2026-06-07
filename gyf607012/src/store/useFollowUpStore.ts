import { create } from "zustand";
import type {
  FollowUpRecord,
  RecordStatus,
  StatusFilter,
  HistoryEntry,
  DayMeals,
  InfantInfo,
} from "@/types";
import { mockRecords } from "@/data/mockData";
import { generateId, nowISO } from "@/utils/format";

const STORAGE_KEY = "v1:follow-up-records";

interface FollowUpState {
  records: FollowUpRecord[];
  statusFilter: StatusFilter;
  searchKeyword: string;
  initFromStorage: () => void;
  setStatusFilter: (filter: StatusFilter) => void;
  setSearchKeyword: (kw: string) => void;
  getFilteredRecords: () => FollowUpRecord[];
  getRecordById: (id: string) => FollowUpRecord | undefined;
  reviseRecord: (
    id: string,
    newStatus: RecordStatus,
    reason: string,
    operator: string
  ) => void;
  addManualRecord: (params: {
    infant: InfantInfo;
    followUpDate: string;
    threeDayMeals: DayMeals[];
    initialStatus: RecordStatus;
    parentNote?: string;
    manualEntryNote: string;
    operator: string;
  }) => void;
  resetToMock: () => void;
}

function persist(records: FollowUpRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
}

function loadFromStorage(): FollowUpRecord[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FollowUpRecord[];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return null;
  } catch {
    return null;
  }
}

export const useFollowUpStore = create<FollowUpState>((set, get) => ({
  records: [],
  statusFilter: "all",
  searchKeyword: "",

  initFromStorage: () => {
    const stored = loadFromStorage();
    if (stored) {
      set({ records: stored });
    } else {
      set({ records: [...mockRecords] });
      persist(mockRecords);
    }
  },

  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setSearchKeyword: (kw) => set({ searchKeyword: kw }),

  getFilteredRecords: () => {
    const { records, statusFilter, searchKeyword } = get();
    let result = [...records];
    if (statusFilter !== "all") {
      result = result.filter((r) => {
        if (statusFilter === "manual") return r.isManualEntry;
        if (statusFilter === "revised") return r.status === "revised";
        return r.status === statusFilter;
      });
    }
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.infant.name.toLowerCase().includes(kw) ||
          (r.parentNote && r.parentNote.toLowerCase().includes(kw))
      );
    }
    result.sort(
      (a, b) =>
        new Date(b.followUpDate).getTime() - new Date(a.followUpDate).getTime()
    );
    return result;
  },

  getRecordById: (id) => get().records.find((r) => r.id === id),

  reviseRecord: (id, newStatus, reason, operator) => {
    const { records } = get();
    const idx = records.findIndex((r) => r.id === id);
    if (idx < 0) return;
    const target = records[idx];
    const oldStatusLabel =
      target.status === "revised"
        ? "已人工改判"
        : target.status === "abnormal"
          ? "异常"
          : target.status === "manual"
            ? "手工补录"
            : "正常";
    const newStatusLabel =
      newStatus === "normal"
        ? "正常（人工改判）"
        : newStatus === "abnormal"
          ? "异常（人工改判）"
          : "已人工改判";

    const historyEntry: HistoryEntry = {
      id: generateId("h"),
      timestamp: nowISO(),
      operator,
      field: "status",
      fieldLabel: "审核状态",
      oldValue: oldStatusLabel,
      newValue: newStatusLabel,
      reason,
    };

    const updated: FollowUpRecord = {
      ...target,
      status: "revised",
      reviseReason: reason,
      updatedAt: nowISO(),
      lastOperator: operator,
      reviewTime: nowISO(),
      history: [...target.history, historyEntry],
    };

    const next = [...records];
    next[idx] = updated;
    set({ records: next });
    persist(next);
  },

  addManualRecord: ({
    infant,
    followUpDate,
    threeDayMeals,
    initialStatus,
    parentNote,
    manualEntryNote,
    operator,
  }) => {
    const historyEntry: HistoryEntry = {
      id: generateId("h"),
      timestamp: nowISO(),
      operator,
      field: "recordStatus",
      fieldLabel: "记录来源",
      oldValue: "（不存在）",
      newValue: "手工补录",
      reason: manualEntryNote,
    };

    const newRec: FollowUpRecord = {
      id: generateId("rec"),
      infant,
      followUpDate,
      updatedAt: nowISO(),
      status: initialStatus === "manual" ? "manual" : initialStatus,
      parentNote,
      threeDayMeals,
      history: [historyEntry],
      isManualEntry: true,
      manualEntryNote,
      lastOperator: operator,
      reviewTime: nowISO(),
    };

    const next = [newRec, ...get().records];
    set({ records: next });
    persist(next);
  },

  resetToMock: () => {
    set({ records: [...mockRecords] });
    persist(mockRecords);
  },
}));
