import { create } from 'zustand';
import type {
  Cylinder,
  StatusHistory,
  Photo,
  Approval,
  SupplementRecord,
  Anomaly,
  CylinderStatus,
  ApprovalStatus,
  SupplementType,
} from '@/types';
import { storage, generateId } from '@/utils/storage';
import { getAllMockData } from '@/utils/mock';

interface CylinderState {
  cylinders: Cylinder[];
  statusHistories: StatusHistory[];
  photos: Photo[];
  approvals: Approval[];
  supplements: SupplementRecord[];
  anomalies: Anomaly[];
  isInitialized: boolean;

  initializeData: () => void;
  resetToMockData: () => void;

  updateCylinderStatus: (
    cylinderId: string,
    newStatus: CylinderStatus,
    operator: string,
    reason: string,
    remark?: string
  ) => void;

  withdrawApproval: (approvalId: string, operator: string) => void;
  resubmitApproval: (
    cylinderId: string,
    parentApprovalId: string,
    conclusion: string,
    reason: string,
    remark: string | undefined,
    operator: string,
    role: string
  ) => void;

  addSupplement: (
    cylinderId: string,
    type: SupplementType,
    beforeData: Record<string, any>,
    afterData: Record<string, any>,
    operator: string,
    exportChecksum?: string
  ) => SupplementRecord;

  updateExportChecksum: (supplementId: string, checksum: string) => void;

  resolveAnomaly: (anomalyId: string) => void;

  getCylinderById: (id: string) => Cylinder | undefined;
  getStatusHistoriesByCylinderId: (cylinderId: string) => StatusHistory[];
  getPhotosByCylinderId: (cylinderId: string) => Photo[];
  getApprovalsByCylinderId: (cylinderId: string) => Approval[];
  getSupplementsByCylinderId: (cylinderId: string) => SupplementRecord[];
  getAnomaliesByCylinderId: (cylinderId: string) => Anomaly[];
  getSupplementById: (id: string) => SupplementRecord | undefined;

  getAllData: () => {
    cylinders: Cylinder[];
    statusHistories: StatusHistory[];
    photos: Photo[];
    approvals: Approval[];
    supplements: SupplementRecord[];
    anomalies: Anomaly[];
  };

  importData: (data: {
    cylinders: Cylinder[];
    statusHistories: StatusHistory[];
    photos: Photo[];
    approvals: Approval[];
    supplements: SupplementRecord[];
    anomalies: Anomaly[];
  }) => void;
}

const STORAGE_KEYS = {
  CYLINDERS: 'cylinders',
  STATUSES: 'statusHistories',
  PHOTOS: 'photos',
  APPROVALS: 'approvals',
  SUPPLEMENTS: 'supplements',
  ANOMALIES: 'anomalies',
  INITIALIZED: 'isInitialized',
};

export const useCylinderStore = create<CylinderState>((set, get) => ({
  cylinders: [],
  statusHistories: [],
  photos: [],
  approvals: [],
  supplements: [],
  anomalies: [],
  isInitialized: false,

  initializeData: () => {
    const isInitialized = storage.get<boolean>(STORAGE_KEYS.INITIALIZED, false);

    if (isInitialized) {
      set({
        cylinders: storage.get<Cylinder[]>(STORAGE_KEYS.CYLINDERS, []),
        statusHistories: storage.get<StatusHistory[]>(STORAGE_KEYS.STATUSES, []),
        photos: storage.get<Photo[]>(STORAGE_KEYS.PHOTOS, []),
        approvals: storage.get<Approval[]>(STORAGE_KEYS.APPROVALS, []),
        supplements: storage.get<SupplementRecord[]>(STORAGE_KEYS.SUPPLEMENTS, []),
        anomalies: storage.get<Anomaly[]>(STORAGE_KEYS.ANOMALIES, []),
        isInitialized: true,
      });
    } else {
      get().resetToMockData();
    }
  },

  resetToMockData: () => {
    const mockData = getAllMockData();
    set(mockData);
    Object.entries(mockData).forEach(([key, value]) => {
      storage.set(key, value);
    });
    storage.set(STORAGE_KEYS.INITIALIZED, true);
    set({ isInitialized: true });
  },

  updateCylinderStatus: (cylinderId, newStatus, operator, reason, remark) => {
    const cylinders = get().cylinders;
    const cylinder = cylinders.find(c => c.id === cylinderId);
    if (!cylinder) return;

    const oldStatus = cylinder.currentStatus;

    const history: StatusHistory = {
      id: generateId(),
      cylinderId,
      oldStatus,
      newStatus,
      operator,
      reason,
      timestamp: new Date().toISOString(),
      remark,
    };

    const updatedCylinders = cylinders.map(c =>
      c.id === cylinderId
        ? { ...c, currentStatus: newStatus, updatedAt: new Date().toISOString() }
        : c
    );

    const updatedHistories = [...get().statusHistories, history];

    set({
      cylinders: updatedCylinders,
      statusHistories: updatedHistories,
    });

    storage.set(STORAGE_KEYS.CYLINDERS, updatedCylinders);
    storage.set(STORAGE_KEYS.STATUSES, updatedHistories);
  },

  withdrawApproval: (approvalId, operator) => {
    const approvals = get().approvals;
    const approval = approvals.find(a => a.id === approvalId);
    if (!approval) return;

    const updatedApprovals = approvals.map(a =>
      a.id === approvalId
        ? { ...a, status: 'withdrawn' as ApprovalStatus }
        : a
    );

    set({ approvals: updatedApprovals });
    storage.set(STORAGE_KEYS.APPROVALS, updatedApprovals);
  },

  resubmitApproval: (
    cylinderId,
    parentApprovalId,
    conclusion,
    reason,
    remark,
    operator,
    role
  ) => {
    const newApproval: Approval = {
      id: generateId(),
      cylinderId,
      conclusion,
      reason,
      remark,
      operator,
      role,
      timestamp: new Date().toISOString(),
      status: 'resubmitted' as ApprovalStatus,
      parentApprovalId,
    };

    const updatedApprovals = [...get().approvals, newApproval];
    set({ approvals: updatedApprovals });
    storage.set(STORAGE_KEYS.APPROVALS, updatedApprovals);

    return newApproval;
  },

  addSupplement: (
    cylinderId,
    type,
    beforeData,
    afterData,
    operator,
    exportChecksum
  ) => {
    const supplement: SupplementRecord = {
      id: generateId(),
      cylinderId,
      type,
      beforeData,
      afterData,
      operator,
      timestamp: new Date().toISOString(),
      exportChecksum,
    };

    const updatedSupplements = [...get().supplements, supplement];
    set({ supplements: updatedSupplements });
    storage.set(STORAGE_KEYS.SUPPLEMENTS, updatedSupplements);

    if (type === 'manual' && afterData.supplementId) {
      const updatedCylinders = get().cylinders.map(c =>
        c.id === cylinderId
          ? {
              ...c,
              supplementId: afterData.supplementId,
              currentStatus: afterData.status || c.currentStatus,
              nextCheckDate: afterData.nextCheckDate || c.nextCheckDate,
              updatedAt: new Date().toISOString(),
            }
          : c
      );
      set({ cylinders: updatedCylinders });
      storage.set(STORAGE_KEYS.CYLINDERS, updatedCylinders);
    }

    return supplement;
  },

  updateExportChecksum: (supplementId, checksum) => {
    const updatedSupplements = get().supplements.map(s =>
      s.id === supplementId ? { ...s, exportChecksum: checksum } : s
    );
    set({ supplements: updatedSupplements });
    storage.set(STORAGE_KEYS.SUPPLEMENTS, updatedSupplements);
  },

  resolveAnomaly: (anomalyId) => {
    const updatedAnomalies = get().anomalies.map(a =>
      a.id === anomalyId ? { ...a, resolved: true } : a
    );
    set({ anomalies: updatedAnomalies });
    storage.set(STORAGE_KEYS.ANOMALIES, updatedAnomalies);
  },

  getCylinderById: (id) => get().cylinders.find(c => c.id === id),

  getStatusHistoriesByCylinderId: (cylinderId) =>
    get()
      .statusHistories.filter(h => h.cylinderId === cylinderId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),

  getPhotosByCylinderId: (cylinderId) =>
    get()
      .photos.filter(p => p.cylinderId === cylinderId)
      .sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime()),

  getApprovalsByCylinderId: (cylinderId) =>
    get()
      .approvals.filter(a => a.cylinderId === cylinderId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),

  getSupplementsByCylinderId: (cylinderId) =>
    get()
      .supplements.filter(s => s.cylinderId === cylinderId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),

  getAnomaliesByCylinderId: (cylinderId) =>
    get()
      .anomalies.filter(a => a.cylinderId === cylinderId)
      .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()),

  getSupplementById: (id) => get().supplements.find(s => s.id === id),

  getAllData: () => ({
    cylinders: get().cylinders,
    statusHistories: get().statusHistories,
    photos: get().photos,
    approvals: get().approvals,
    supplements: get().supplements,
    anomalies: get().anomalies,
  }),

  importData: (data) => {
    set(data);
    Object.entries(data).forEach(([key, value]) => {
      storage.set(key, value);
    });
  },
}));
