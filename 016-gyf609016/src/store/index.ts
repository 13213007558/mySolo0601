import { create } from 'zustand';
import type { FilterState, StoneRecord, StoneDetail, PhotoAttachment, ReplacementRecord, OperationHistory, ColorGrade, WallStatus } from '@/types';
import { db } from '@/db';
import { v4 as uuid } from 'uuid';

interface StoneStore {
  stones: StoneRecord[];
  selectedIds: Set<string>;
  filter: FilterState;
  currentStone: StoneDetail | null;
  loading: boolean;
  operatorName: string;

  setFilter: (filter: Partial<FilterState>) => void;
  resetFilter: () => void;
  toggleSelect: (id: string) => void;
  toggleSelectAll: (ids: string[]) => void;
  clearSelection: () => void;
  loadStones: () => Promise<void>;
  loadStoneDetail: (id: string) => Promise<void>;
  updateStone: (id: string, updates: Partial<StoneRecord>) => Promise<void>;
  batchUpdateZone: (zone: string) => Promise<void>;
  batchUpdateGrade: (grade: ColorGrade) => Promise<void>;
  addPhoto: (stoneId: string, photo: Omit<PhotoAttachment, 'id'>) => Promise<void>;
  addReplacement: (stoneId: string, replacement: Omit<ReplacementRecord, 'id'>) => Promise<void>;
  confirmReplacement: (replacementId: string, result: 'approved' | 'rejected', confirmer: string) => Promise<void>;
  setOperatorName: (name: string) => void;
}

const defaultFilter: FilterState = {
  batchNo: '',
  facadeZone: '',
  colorGrade: '',
  missingPhoto: false,
  searchText: '',
};

export const useStoneStore = create<StoneStore>((set, get) => ({
  stones: [],
  selectedIds: new Set(),
  filter: { ...defaultFilter },
  currentStone: null,
  loading: false,
  operatorName: localStorage.getItem('stone_operator') || '',

  setFilter: (partial) => {
    set((state) => ({ filter: { ...state.filter, ...partial } }));
  },

  resetFilter: () => {
    set({ filter: { ...defaultFilter } });
  },

  toggleSelect: (id) => {
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    });
  },

  toggleSelectAll: (ids) => {
    set((state) => {
      const allSelected = ids.every((id) => state.selectedIds.has(id));
      const next = new Set(state.selectedIds);
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return { selectedIds: next };
    });
  },

  clearSelection: () => {
    set({ selectedIds: new Set() });
  },

  loadStones: async () => {
    set({ loading: true });
    const stones = await db.stones.toArray();
    set({ stones, loading: false });
  },

  loadStoneDetail: async (id) => {
    set({ loading: true });
    const stone = await db.stones.get(id);
    if (!stone) {
      set({ currentStone: null, loading: false });
      return;
    }
    const photos = await db.photos.where('stoneId').equals(id).toArray();
    const replacements = await db.replacements.where('stoneId').equals(id).toArray();
    const histories = await db.histories.where('stoneId').equals(id).toArray();
    set({
      currentStone: { ...stone, photos, replacements, histories },
      loading: false,
    });
  },

  updateStone: async (id, updates) => {
    const operator = get().operatorName || '系统';
    const old = await db.stones.get(id);
    if (!old) return;

    const now = new Date().toISOString();
    await db.stones.update(id, { ...updates, updatedAt: now });

    const historyEntries: OperationHistory[] = [];
    for (const [key, newVal] of Object.entries(updates)) {
      if (key === 'updatedAt') continue;
      const oldVal = String((old as unknown as Record<string, unknown>)[key] ?? '');
      if (oldVal !== String(newVal)) {
        historyEntries.push({
          id: uuid(),
          stoneId: id,
          operator,
          action: key === 'facadeZone' ? '分区变更' : key === 'colorGrade' ? '色差等级变更' : key === 'wallStatus' ? '状态变更' : `${key}变更`,
          oldValue: oldVal,
          newValue: String(newVal),
          operatedAt: now,
        });
      }
    }
    if (historyEntries.length > 0) {
      await db.histories.bulkAdd(historyEntries);
    }

    await get().loadStones();
  },

  batchUpdateZone: async (zone) => {
    const { selectedIds, operatorName } = get();
    const operator = operatorName || '系统';
    const now = new Date().toISOString();
    const ids = Array.from(selectedIds);

    await db.transaction('rw', [db.stones, db.histories], async () => {
      for (const id of ids) {
        const old = await db.stones.get(id);
        if (!old) continue;
        await db.stones.update(id, { facadeZone: zone, updatedAt: now });
        await db.histories.add({
          id: uuid(),
          stoneId: id,
          operator,
          action: '分区变更',
          oldValue: old.facadeZone,
          newValue: zone,
          operatedAt: now,
        });
      }
    });

    set({ selectedIds: new Set() });
    await get().loadStones();
  },

  batchUpdateGrade: async (grade) => {
    const { selectedIds, operatorName } = get();
    const operator = operatorName || '系统';
    const now = new Date().toISOString();
    const ids = Array.from(selectedIds);

    await db.transaction('rw', [db.stones, db.histories], async () => {
      for (const id of ids) {
        const old = await db.stones.get(id);
        if (!old) continue;
        await db.stones.update(id, { colorGrade: grade, updatedAt: now });
        await db.histories.add({
          id: uuid(),
          stoneId: id,
          operator,
          action: '色差等级变更',
          oldValue: old.colorGrade,
          newValue: grade,
          operatedAt: now,
        });
      }
    });

    set({ selectedIds: new Set() });
    await get().loadStones();
  },

  addPhoto: async (stoneId, photo) => {
    await db.photos.add({ ...photo, id: uuid() });
    await get().loadStoneDetail(stoneId);
  },

  addReplacement: async (stoneId, replacement) => {
    const operator = get().operatorName || '系统';
    const now = new Date().toISOString();
    await db.replacements.add({ ...replacement, id: uuid() });
    await db.histories.add({
      id: uuid(),
      stoneId,
      operator,
      action: '新增替换建议',
      oldValue: '',
      newValue: replacement.suggestion,
      operatedAt: now,
    });
    await get().loadStoneDetail(stoneId);
  },

  confirmReplacement: async (replacementId, result, confirmer) => {
    const now = new Date().toISOString();
    const replacement = await db.replacements.get(replacementId);
    if (!replacement) return;

    await db.replacements.update(replacementId, {
      confirmResult: result,
      confirmedBy: confirmer,
      confirmedAt: now,
    });

    await db.histories.add({
      id: uuid(),
      stoneId: replacement.stoneId,
      operator: confirmer,
      action: '替换确认',
      oldValue: '待确认',
      newValue: result === 'approved' ? '通过' : '不通过',
      operatedAt: now,
    });

    if (result === 'approved') {
      const stone = await db.stones.get(replacement.stoneId);
      if (stone) {
        const oldStatus = stone.wallStatus as WallStatus;
        await db.stones.update(replacement.stoneId, {
          wallStatus: 'replaced' as WallStatus,
          updatedAt: now,
        });
        await db.histories.add({
          id: uuid(),
          stoneId: replacement.stoneId,
          operator: confirmer,
          action: '状态变更',
          oldValue: oldStatus,
          newValue: '已替换',
          operatedAt: now,
        });
      }
    }

    await get().loadStoneDetail(replacement.stoneId);
  },

  setOperatorName: (name) => {
    localStorage.setItem('stone_operator', name);
    set({ operatorName: name });
  },
}));
