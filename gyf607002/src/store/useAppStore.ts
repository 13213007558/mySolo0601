import { create } from 'zustand';
import type { BabyRecord, RecordStatus, OverrideInfo, FoodRestriction } from '@/types';
import { initialRecords, initialIngredients, supplementTemplate } from '@/data/mockData';
import { validateAllRecords, validateRecord } from '@/utils/validation';
import type { IngredientItem } from '@/types';

interface AppStore {
  records: BabyRecord[];
  ingredients: IngredientItem[];
  activeDate: string;
  filter: RecordStatus | 'all' | 'supplemented';
  searchKeyword: string;
  supplementTemplate: typeof supplementTemplate;

  setFilter: (f: RecordStatus | 'all' | 'supplemented') => void;
  setSearchKeyword: (k: string) => void;
  setActiveDate: (d: string) => void;

  overrideRecord: (id: string, info: Omit<OverrideInfo, 'time' | 'fromStatus'>) => void;
  addSupplementRecord: (data: {
    name: string;
    ageMonths: number;
    allergyHistory: string;
    supplementReason: string;
    supplementedBy: string;
    restrictions: FoodRestriction[];
  }) => void;
  revalidateAll: () => void;
  resetToInitial: () => void;
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildInitialState() {
  const records = validateAllRecords(initialRecords, initialIngredients);
  return {
    records,
    ingredients: initialIngredients,
    activeDate: todayString(),
    filter: 'all' as const,
    searchKeyword: '',
    supplementTemplate,
  };
}

export const useAppStore = create<AppStore>((set, get) => ({
  ...buildInitialState(),

  setFilter: (f) => set({ filter: f }),
  setSearchKeyword: (k) => set({ searchKeyword: k }),
  setActiveDate: (d) => set({ activeDate: d }),

  overrideRecord: (id, info) =>
    set((state) => {
      const records = state.records.map((r) => {
        if (r.id !== id) return r;
        const fromStatus = r.status;
        const override: OverrideInfo = {
          ...info,
          fromStatus,
          time: new Date().toISOString(),
        };
        return { ...r, status: info.toStatus, override };
      });
      return { records };
    }),

  addSupplementRecord: (data) =>
    set((state) => {
      const newId = `baby-supp-${Date.now()}`;
      const baseRestrictions = data.restrictions.map((r, idx) => ({
        ...r,
        id: `${newId}-res-${idx}`,
      }));
      const draft: BabyRecord = {
        id: newId,
        name: data.name,
        ageMonths: data.ageMonths,
        allergyHistory: data.allergyHistory,
        createdAt: new Date().toISOString(),
        isSupplemented: true,
        supplementReason: data.supplementReason,
        supplementedBy: data.supplementedBy,
        supplementTime: new Date().toISOString(),
        status: 'normal',
        restrictions: baseRestrictions,
        validations: [],
      };
      const { validations, status } = validateRecord(draft, state.ingredients);
      const newRecord: BabyRecord = { ...draft, validations, status };
      return { records: [...state.records, newRecord] };
    }),

  revalidateAll: () =>
    set((state) => ({
      records: validateAllRecords(state.records, state.ingredients),
    })),

  resetToInitial: () => set(buildInitialState()),
}));
