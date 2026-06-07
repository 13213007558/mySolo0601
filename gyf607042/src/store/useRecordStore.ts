import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  TrackRecord,
  RecordStatus,
  FilterKey,
  Stats,
  RectificationLog,
  Ingredient,
  MealType,
  SupplementDiff,
} from '@/types';
import { sampleRecords } from '@/data/sampleData';
import { matchTaboos } from '@/utils/tabooEngine';
import { validateRecord, maskName } from '@/utils/validationEngine';

interface RecordState {
  records: TrackRecord[];
  filter: FilterKey;
  getById: (id: string) => TrackRecord | undefined;
  setFilter: (f: FilterKey) => void;
  filteredRecords: () => TrackRecord[];
  stats: () => Stats;
  setStatus: (
    id: string,
    status: RecordStatus,
    operator: string,
    note?: string,
    overrideReason?: string
  ) => void;
  addRectificationLog: (id: string, log: Omit<RectificationLog, 'id' | 'timestamp'>) => void;
  addManualRecord: (data: {
    roomNo: string;
    babyNameRaw: string;
    motherPhone: string;
    mealType: MealType;
    mealDate: string;
    photoCaption: string;
    photoUrl?: string;
    ingredients: Ingredient[];
    note: string;
    operator: string;
  }) => void;
  resetToSampleData: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

function autoStatusFromTaboos(matches: unknown[]): RecordStatus {
  return matches.length > 0 ? 'abnormal' : 'normal';
}

export const useRecordStore = create<RecordState>()(
  persist(
    (set, get) => ({
      records: sampleRecords,
      filter: 'all',
      getById: (id) => get().records.find((r) => r.id === id),
      setFilter: (f) => set({ filter: f }),
      filteredRecords: () => {
        const { records, filter } = get();
        const sorted = [...records].sort((a, b) => {
          if (a.mealDate !== b.mealDate) return b.mealDate.localeCompare(a.mealDate);
          return b.createdAt.localeCompare(a.createdAt);
        });
        if (filter === 'all') return sorted;
        return sorted.filter((r) => r.status === filter);
      },
      stats: () => {
        const { records } = get();
        return {
          total: records.length,
          normal: records.filter((r) => r.status === 'normal').length,
          abnormal: records.filter((r) => r.status === 'abnormal').length,
          manualOverridden: records.filter((r) => r.status === 'manual_overridden').length,
          pending: records.filter((r) => r.status === 'pending').length,
        };
      },
      setStatus: (id, status, operator, note, overrideReason) => {
        set((state) => ({
          records: state.records.map((r) => {
            if (r.id !== id) return r;
            const updated: TrackRecord = {
              ...r,
              status,
              overrideReason: overrideReason ?? r.overrideReason,
              updatedAt: new Date().toISOString(),
              rectificationLogs: [
                ...r.rectificationLogs,
                {
                  id: uid(),
                  action: status === 'manual_overridden' ? 'override' : 'status_change',
                  operator,
                  note:
                    note ??
                    (status === 'normal'
                      ? '复核通过，状态改为正常'
                      : status === 'abnormal'
                      ? '确认存在禁忌风险'
                      : status === 'manual_overridden'
                      ? '人工改判'
                      : '状态变更'),
                  timestamp: new Date().toISOString(),
                },
              ],
            };
            return updated;
          }),
        }));
      },
      addRectificationLog: (id, log) => {
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id
              ? {
                  ...r,
                  updatedAt: new Date().toISOString(),
                  rectificationLogs: [
                    ...r.rectificationLogs,
                    { ...log, id: uid(), timestamp: new Date().toISOString() },
                  ],
                }
              : r
          ),
        }));
      },
      addManualRecord: (data) => {
        const taboosMatched = matchTaboos(data.ingredients);
        const status = autoStatusFromTaboos(taboosMatched);
        const babyName = maskName(data.babyNameRaw);
        const validationIssues = validateRecord({
          motherPhone: data.motherPhone,
          babyNameRaw: data.babyNameRaw,
          babyName,
        });
        const now = new Date().toISOString();
        const diffs: SupplementDiff[] = [
          { field: '记录来源', before: '（无）', after: '手工补录' },
          { field: '宝宝姓名', before: '（未录入）', after: babyName },
          { field: '照片说明', before: '（无）', after: data.photoCaption || '手工补录，无原图' },
        ];
        const newRecord: TrackRecord = {
          id: `rec-${uid()}`,
          roomNo: data.roomNo,
          babyName,
          babyNameRaw: data.babyNameRaw,
          motherPhone: data.motherPhone,
          mealType: data.mealType,
          mealDate: data.mealDate,
          photoUrl:
            data.photoUrl ||
            'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=baby%20food%20manual%20supplement%20record%20warm%20bowl%20simple&image_size=square',
          photoCaption: data.photoCaption || '手工补录，无原图',
          status,
          ingredients: data.ingredients,
          taboosMatched,
          validationIssues,
          rectificationLogs: [
            {
              id: uid(),
              action: 'manual_entry',
              operator: data.operator,
              note: data.note || '手工补录该条记录',
              timestamp: now,
            },
          ],
          supplementDiffs: diffs,
          isManualEntry: true,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ records: [newRecord, ...state.records] }));
      },
      resetToSampleData: () => {
        set({ records: sampleRecords, filter: 'all' });
      },
    }),
    {
      name: 'baby-food-taboo-tracker',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ records: state.records, filter: state.filter }),
    }
  )
);
