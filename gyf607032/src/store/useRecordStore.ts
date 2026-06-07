import { create } from 'zustand';
import type { FoodRecord, HistoryEntry, RecordStatus } from '@/types';
import { mockRecords, FORBIDDEN_INGREDIENTS } from '@/data/mockData';

interface RecordStore {
  records: FoodRecord[];
  showBadData: boolean;
  selectedRecordId: string | null;
  statusFilter: RecordStatus | 'all';

  setStatusFilter: (s: RecordStatus | 'all') => void;
  toggleBadData: () => void;
  selectRecord: (id: string | null) => void;
  getFilteredRecords: () => FoodRecord[];
  getRecordById: (id: string) => FoodRecord | undefined;
  addParentNote: (recordId: string, note: string, parentNote: string) => void;
  overrideStatus: (recordId: string, reason: string) => void;
  withdrawRecord: (recordId: string, reason: string, operator: string) => void;
}

function detectIssues(record: FoodRecord): string[] {
  const issues: string[] = [];
  const allergySet = new Set(record.allergies);

  record.threeDayPlan.forEach((day) => {
    const meals = [day.breakfast, day.lunch, day.dinner, day.snack];
    meals.forEach((meal) => {
      meal.ingredients.forEach((ing) => {
        record.allergies.forEach((allergy) => {
          const forbidden = FORBIDDEN_INGREDIENTS[allergy] || [];
          if (forbidden.some((f) => ing.includes(f) || f.includes(ing))) {
            issues.push(
              `${day.date} ${
                meal === day.breakfast
                  ? '早餐'
                  : meal === day.lunch
                  ? '午餐'
                  : meal === day.dinner
                  ? '晚餐'
                  : '加餐'
              }：${meal.name} 含「${ing}」，与${allergy}冲突`
            );
          }
        });
      });
    });
  });

  allergySet;
  return Array.from(new Set(issues));
}

function nowString(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export const useRecordStore = create<RecordStore>((set, get) => ({
  records: mockRecords,
  showBadData: false,
  selectedRecordId: null,
  statusFilter: 'all',

  setStatusFilter: (s) => set({ statusFilter: s }),
  toggleBadData: () => set((s) => ({ showBadData: !s.showBadData })),
  selectRecord: (id) => set({ selectedRecordId: id }),

  getFilteredRecords: () => {
    const { records, showBadData, statusFilter } = get();
    return records.filter((r) => {
      if (!showBadData && r.isBadData) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  },

  getRecordById: (id) => get().records.find((r) => r.id === id),

  addParentNote: (recordId, note, parentNote) =>
    set((state) => {
      const entry: HistoryEntry = {
        id: genId('H'),
        timestamp: nowString(),
        operator: '当前顾问',
        action: 'note_add',
        note,
        parentNote,
      };
      return {
        records: state.records.map((r) =>
          r.id === recordId
            ? { ...r, history: [...r.history, entry], updatedAt: nowString() }
            : r
        ),
      };
    }),

  overrideStatus: (recordId, reason) =>
    set((state) => {
      const entry: HistoryEntry = {
        id: genId('H'),
        timestamp: nowString(),
        operator: '当前顾问',
        action: 'override',
        fromStatus: state.records.find((r) => r.id === recordId)?.status,
        toStatus: 'overridden',
        reason,
      };
      return {
        records: state.records.map((r) =>
          r.id === recordId
            ? {
                ...r,
                status: 'overridden' as RecordStatus,
                history: [...r.history, entry],
                updatedAt: nowString(),
              }
            : r
        ),
      };
    }),

  withdrawRecord: (recordId, reason, operator) =>
    set((state) => {
      const target = state.records.find((r) => r.id === recordId);
      const entry: HistoryEntry = {
        id: genId('H'),
        timestamp: nowString(),
        operator,
        action: 'withdraw',
        fromStatus: target?.status,
        toStatus: 'withdrawn',
        reason,
      };
      return {
        records: state.records.map((r) =>
          r.id === recordId
            ? {
                ...r,
                status: 'withdrawn' as RecordStatus,
                withdrawInfo: {
                  withdrawReason: reason,
                  withdrawOperator: operator,
                  withdrawTime: nowString(),
                },
                history: [...r.history, entry],
                updatedAt: nowString(),
              }
            : r
        ),
      };
    }),
}));

export { detectIssues };
