import { create } from 'zustand';
import type { InverterStore, SupplementRecord, OriginalSnapshot, StringTemperature } from '../types';
import { mockInverters, mockSnapshots } from '../data/mockData';

const STORAGE_KEYS = {
  SNAPSHOTS: 'inverter_snapshots',
  SUPPLEMENTS: 'supplement_records',
  CLOSED_TIPS: 'tips_closed',
};

export const useInverterStore = create<InverterStore>((set, get) => ({
  inverters: [],
  snapshots: [],
  userSupplements: [],
  closedTips: [],

  initData: () => {
    const storedSnapshots = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
    const storedSupplements = localStorage.getItem(STORAGE_KEYS.SUPPLEMENTS);
    const storedClosedTips = localStorage.getItem(STORAGE_KEYS.CLOSED_TIPS);

    const snapshots: OriginalSnapshot[] = storedSnapshots
      ? JSON.parse(storedSnapshots)
      : mockSnapshots;

    const userSupplements: SupplementRecord[] = storedSupplements
      ? JSON.parse(storedSupplements)
      : [];

    const closedTips: string[] = storedClosedTips
      ? JSON.parse(storedClosedTips)
      : [];

    const invertersWithSupplements = mockInverters.map((inv) => ({
      ...inv,
      supplementRecords: [
        ...inv.supplementRecords,
        ...userSupplements.filter((s) => s.inverterId === inv.id),
      ],
    }));

    if (!storedSnapshots) {
      localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(snapshots));
    }

    set({
      inverters: invertersWithSupplements,
      snapshots,
      userSupplements,
      closedTips,
    });
  },

  addSupplement: (record: SupplementRecord) => {
    const { userSupplements, inverters } = get();
    const newSupplements = [...userSupplements, record];
    localStorage.setItem(STORAGE_KEYS.SUPPLEMENTS, JSON.stringify(newSupplements));

    const updatedInverters = inverters.map((inv) =>
      inv.id === record.inverterId
        ? { ...inv, supplementRecords: [...inv.supplementRecords, record] }
        : inv
    );

    set({ userSupplements: newSupplements, inverters: updatedInverters });
  },

  createSnapshot: (inverterId: string) => {
    const { snapshots, inverters } = get();
    const existingSnapshot = snapshots.find((s) => s.inverterId === inverterId);

    if (existingSnapshot) {
      return;
    }

    const inverter = inverters.find((i) => i.id === inverterId);
    if (!inverter) return;

    const originalData: StringTemperature[] = inverter.stringTemperatures
      .filter((st) => st.source === 'auto')
      .map((st) => ({
        ...st,
        originalTemperature: undefined,
        originalRemark: undefined,
      }));

    const newSnapshot: OriginalSnapshot = {
      id: `snap-${Date.now()}`,
      inverterId,
      originalData,
      snapshotTime: new Date().toISOString(),
    };

    const newSnapshots = [...snapshots, newSnapshot];
    localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(newSnapshots));
    set({ snapshots: newSnapshots });
  },

  getSnapshot: (inverterId: string) => {
    const { snapshots } = get();
    return snapshots.find((s) => s.inverterId === inverterId);
  },

  closeTip: (tipId: string) => {
    const { closedTips } = get();
    const newClosedTips = [...closedTips, tipId];
    localStorage.setItem(STORAGE_KEYS.CLOSED_TIPS, JSON.stringify(newClosedTips));
    set({ closedTips: newClosedTips });
  },

  isTipClosed: (tipId: string) => {
    const { closedTips } = get();
    return closedTips.includes(tipId);
  },
}));
