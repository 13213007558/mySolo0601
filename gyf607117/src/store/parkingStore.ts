import { create } from 'zustand';
import type { ParkingStore, ParkingSpot, OperationHistory, Screenshot, SpotStatus, AlertType } from '../types';
import { mockSpots, mockHistory, mockUser } from '../data/mockData';

const generateId = () => Math.random().toString(36).substr(2, 9);

const getStoredData = () => {
  try {
    const stored = localStorage.getItem('parking-data');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    return null;
  }
  return null;
};

const storedData = getStoredData();

export const useParkingStore = create<ParkingStore>((set, get) => ({
  spots: storedData?.spots || mockSpots,
  history: storedData?.history || mockHistory,
  currentUser: mockUser,
  expandedSpotId: null,
  filterStatus: 'all',

  setExpandedSpotId: (id) => set({ expandedSpotId: id }),
  setFilterStatus: (status) => set({ filterStatus: status }),

  addScreenshot: (spotId, screenshotData) => {
    const { spots, history, currentUser } = get();
    const newScreenshot: Screenshot = {
      ...screenshotData,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };

    const updatedSpots = spots.map((spot) =>
      spot.id === spotId
        ? {
            ...spot,
            screenshots: [...spot.screenshots, newScreenshot],
            lastUpdated: new Date().toISOString(),
          }
        : spot
    );

    const historyEntry: OperationHistory = {
      id: generateId(),
      spotId,
      spotNumber: spots.find((s) => s.id === spotId)!.spotNumber,
      operator: currentUser.name,
      operatorRole: currentUser.role,
      operationType: 'screenshot_upload',
      timestamp: new Date().toISOString(),
      reason: screenshotData.remark || '手工上传截图',
      beforeData: {},
      afterData: {},
      screenshotAfter: screenshotData.url,
    };

    const newHistory = [historyEntry, ...history];

    set({ spots: updatedSpots, history: newHistory });
    localStorage.setItem('parking-data', JSON.stringify({ spots: updatedSpots, history: newHistory }));
  },

  updateSpotValues: (spotId, exportValue, actualValue, reason) => {
    const { spots, history, currentUser } = get();
    const spot = spots.find((s) => s.id === spotId);
    if (!spot) return;

    const beforeData = {
      exportValue: spot.exportValue,
      actualValue: spot.actualValue,
      status: spot.status,
      hasAlert: spot.hasAlert,
      alertType: spot.alertType,
    };

    const hasMismatch = exportValue !== actualValue;
    const newStatus: SpotStatus = hasMismatch
      ? 'mismatch'
      : actualValue === 1
      ? spot.chargePower ? 'charging' : 'occupied'
      : 'available';

    const newAlertType: AlertType = hasMismatch ? 'export_mismatch' : (spot.alertType === 'offline' || spot.alertType === 'long_occupation' ? spot.alertType : null);

    const afterData: Partial<ParkingSpot> = {
      exportValue,
      actualValue,
      status: newStatus,
      hasAlert: hasMismatch || spot.alertType === 'offline' || spot.alertType === 'long_occupation',
      alertType: newAlertType,
      lastUpdated: new Date().toISOString(),
    };

    const updatedSpots = spots.map((s) =>
      s.id === spotId ? { ...s, ...afterData } : s
    );

    const historyEntry: OperationHistory = {
      id: generateId(),
      spotId,
      spotNumber: spot.spotNumber,
      operator: currentUser.name,
      operatorRole: currentUser.role,
      operationType: 'export_correction',
      timestamp: new Date().toISOString(),
      reason,
      beforeData,
      afterData,
    };

    const newHistory = [historyEntry, ...history];

    set({ spots: updatedSpots, history: newHistory });
    localStorage.setItem('parking-data', JSON.stringify({ spots: updatedSpots, history: newHistory }));
  },

  manualEntry: (spotId, data, screenshotUrl, reason) => {
    const { spots, history, currentUser } = get();
    const spot = spots.find((s) => s.id === spotId);
    if (!spot) return;

    const beforeData = {
      exportValue: spot.exportValue,
      actualValue: spot.actualValue,
      status: spot.status,
      hasAlert: spot.hasAlert,
      alertType: spot.alertType,
    };

    const hasMismatch = (data.exportValue ?? spot.exportValue) !== (data.actualValue ?? spot.actualValue);
    const newActualValue = data.actualValue ?? spot.actualValue;
    const newExportValue = data.exportValue ?? spot.exportValue;

    const newStatus: SpotStatus = hasMismatch
      ? 'mismatch'
      : newActualValue === 1
      ? (data.chargePower ?? spot.chargePower) ? 'charging' : 'occupied'
      : 'available';

    const newAlertType: AlertType = hasMismatch ? 'export_mismatch' : (spot.alertType === 'offline' || spot.alertType === 'long_occupation' ? spot.alertType : null);

    const afterData: Partial<ParkingSpot> = {
      exportValue: newExportValue,
      actualValue: newActualValue,
      status: newStatus,
      hasAlert: hasMismatch || spot.alertType === 'offline' || spot.alertType === 'long_occupation',
      alertType: newAlertType,
      lastUpdated: new Date().toISOString(),
      ...data,
    };

    const newScreenshot: Screenshot = {
      id: generateId(),
      url: screenshotUrl,
      timestamp: new Date().toISOString(),
      source: 'manual',
      uploadedBy: currentUser.name,
      remark: reason,
    };

    const updatedSpots = spots.map((s) =>
      s.id === spotId
        ? {
            ...s,
            ...afterData,
            screenshots: [...s.screenshots, newScreenshot],
          }
        : s
    );

    const historyEntry: OperationHistory = {
      id: generateId(),
      spotId,
      spotNumber: spot.spotNumber,
      operator: currentUser.name,
      operatorRole: currentUser.role,
      operationType: 'manual_entry',
      timestamp: new Date().toISOString(),
      reason,
      beforeData,
      afterData,
      screenshotBefore: spot.screenshots[spot.screenshots.length - 1]?.url,
      screenshotAfter: screenshotUrl,
    };

    const newHistory = [historyEntry, ...history];

    set({ spots: updatedSpots, history: newHistory });
    localStorage.setItem('parking-data', JSON.stringify({ spots: updatedSpots, history: newHistory }));
  },

  getAlertCount: () => {
    const { spots } = get();
    return spots.filter((s) => s.hasAlert).length;
  },

  getMismatchCount: () => {
    const { spots } = get();
    return spots.filter((s) => s.alertType === 'export_mismatch').length;
  },
}));
