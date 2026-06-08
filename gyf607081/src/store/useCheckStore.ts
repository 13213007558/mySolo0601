import { create } from 'zustand';
import {
  Baby,
  TemperatureRecord,
  LeaveNote,
  CheckRecord,
  DataStatus,
  RecordStatus,
  AuditAction,
  StatusChangeTrace
} from '../types';
import {
  mockBabies,
  mockTemperatureRecords,
  mockLeaveNotes,
  mockCheckRecords,
  mockCurrentOperator
} from '../data/mockData';
import { saveWithAudit, processWithPartialSuccess } from '../services/auditService';
import { exportToExcel, getStatusChangesByRecordId } from '../services/exportService';

const CHECK_RECORDS_KEY = 'check_records';
const BABIES_KEY = 'babies';
const TEMP_RECORDS_KEY = 'temp_records';
const LEAVE_NOTES_KEY = 'leave_notes';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  const stored = localStorage.getItem(key);
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem(key, JSON.stringify(fallback));
  return fallback;
}

function saveToStorage<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

interface CheckStore {
  babies: Baby[];
  temperatureRecords: TemperatureRecord[];
  leaveNotes: LeaveNote[];
  checkRecords: CheckRecord[];
  currentOperator: string;
  selectedRecordId: string | null;
  isLoading: boolean;

  initData: () => void;
  getBabyById: (id: string) => Baby | undefined;
  getTemperatureRecordById: (id: string) => TemperatureRecord | undefined;
  getLeaveNoteById: (id: string) => LeaveNote | undefined;
  getCheckRecordById: (id: string) => CheckRecord | undefined;
  getRecordsByDataStatus: (status: DataStatus) => CheckRecord[];
  getRecordsByStatus: (status: RecordStatus) => CheckRecord[];
  getStatusChangesByRecordId: (recordId: string) => StatusChangeTrace[];

  rejectRecord: (recordId: string, reason: string) => Promise<void>;
  reissueRecord: (recordId: string, reason: string) => Promise<void>;
  rejectThenReissue: (
    recordId: string,
    rejectReason: string,
    reissueReason: string
  ) => Promise<void>;

  manualAddRecord: (
    babyId: string,
    temperatureData: Partial<TemperatureRecord>,
    reason: string
  ) => Promise<void>;

  simulateServiceRestart: () => Promise<{
    success: string[];
    failed: Array<{ recordId: string; reason: string; data: unknown }>;
  }>;

  exportRecords: (recordIds?: string[]) => Promise<string>;

  setSelectedRecordId: (id: string | null) => void;
  refreshData: () => void;
}

export const useCheckStore = create<CheckStore>((set, get) => ({
  babies: [],
  temperatureRecords: [],
  leaveNotes: [],
  checkRecords: [],
  currentOperator: mockCurrentOperator,
  selectedRecordId: null,
  isLoading: false,

  initData: () => {
    const babies = loadFromStorage(BABIES_KEY, mockBabies);
    const temperatureRecords = loadFromStorage(TEMP_RECORDS_KEY, mockTemperatureRecords);
    const leaveNotes = loadFromStorage(LEAVE_NOTES_KEY, mockLeaveNotes);
    const checkRecords = loadFromStorage(CHECK_RECORDS_KEY, mockCheckRecords);

    set({ babies, temperatureRecords, leaveNotes, checkRecords });
  },

  getBabyById: (id: string) => get().babies.find(b => b.id === id),

  getTemperatureRecordById: (id: string) =>
    get().temperatureRecords.find(t => t.id === id),

  getLeaveNoteById: (id: string) => get().leaveNotes.find(l => l.id === id),

  getCheckRecordById: (id: string) => get().checkRecords.find(r => r.id === id),

  getRecordsByDataStatus: (status: DataStatus) =>
    get().checkRecords.filter(r => r.dataStatus === status),

  getRecordsByStatus: (status: RecordStatus) =>
    get().checkRecords.filter(r => r.status === status),

  getStatusChangesByRecordId: (recordId: string) =>
    getStatusChangesByRecordId(recordId),

  rejectRecord: async (recordId: string, reason: string) => {
    const { checkRecords, currentOperator } = get();
    const record = checkRecords.find(r => r.id === recordId);
    if (!record) return;

    const updated = await saveWithAudit(
      record,
      AuditAction.REJECT,
      currentOperator,
      async (r) => ({
        ...r,
        status: RecordStatus.REJECTED,
        currentRemark: reason,
        updatedAt: new Date().toISOString(),
        operator: currentOperator
      })
    );

    const newRecords = checkRecords.map(r => (r.id === recordId ? updated : r));
    saveToStorage(CHECK_RECORDS_KEY, newRecords);
    set({ checkRecords: newRecords });
  },

  reissueRecord: async (recordId: string, reason: string) => {
    const { checkRecords, currentOperator } = get();
    const record = checkRecords.find(r => r.id === recordId);
    if (!record) return;

    const updated = await saveWithAudit(
      record,
      AuditAction.REISSUE,
      currentOperator,
      async (r) => ({
        ...r,
        status: RecordStatus.REISSUED,
        currentRemark: reason,
        updatedAt: new Date().toISOString(),
        operator: currentOperator
      })
    );

    const newRecords = checkRecords.map(r => (r.id === recordId ? updated : r));
    saveToStorage(CHECK_RECORDS_KEY, newRecords);
    set({ checkRecords: newRecords });
  },

  rejectThenReissue: async (
    recordId: string,
    rejectReason: string,
    reissueReason: string
  ) => {
    const { checkRecords, currentOperator } = get();
    let record = checkRecords.find(r => r.id === recordId);
    if (!record) return;

    record = await saveWithAudit(
      record,
      AuditAction.REJECT,
      currentOperator,
      async (r) => ({
        ...r,
        status: RecordStatus.REJECTED,
        currentRemark: rejectReason,
        updatedAt: new Date().toISOString(),
        operator: currentOperator
      })
    );

    let newRecords = checkRecords.map(r => (r.id === recordId ? record : r));
    saveToStorage(CHECK_RECORDS_KEY, newRecords);
    set({ checkRecords: newRecords });

    await new Promise(resolve => setTimeout(resolve, 500));

    record = await saveWithAudit(
      record,
      AuditAction.REISSUE,
      currentOperator,
      async (r) => ({
        ...r,
        status: RecordStatus.REISSUED,
        currentRemark: reissueReason,
        updatedAt: new Date().toISOString(),
        operator: currentOperator
      })
    );

    newRecords = get().checkRecords.map(r => (r.id === recordId ? record : r));
    saveToStorage(CHECK_RECORDS_KEY, newRecords);
    set({ checkRecords: newRecords });
  },

  manualAddRecord: async (
    babyId: string,
    temperatureData: Partial<TemperatureRecord>,
    reason: string
  ) => {
    const {
      babies,
      checkRecords,
      temperatureRecords,
      currentOperator
    } = get();

    const baby = babies.find(b => b.id === babyId);
    if (!baby) return;

    const tempRecord: TemperatureRecord = {
      id: generateId('temp'),
      babyId,
      temperature: temperatureData.temperature || 36.5,
      measureTime: temperatureData.measureTime || new Date().toISOString(),
      measureDevice: temperatureData.measureDevice || '手工补录',
      operator: currentOperator,
      remark: temperatureData.remark || '手工补录',
      photoUrl: temperatureData.photoUrl || '',
      isDirty: false
    };

    const newTempRecords = [...temperatureRecords, tempRecord];
    saveToStorage(TEMP_RECORDS_KEY, newTempRecords);

    const existingRecord = checkRecords.find(
      r => r.babyId === babyId && r.dataStatus === DataStatus.EMPTY
    );

    const now = new Date().toISOString();

    if (existingRecord) {
      const beforeData = JSON.parse(JSON.stringify(existingRecord));

      const updated = await saveWithAudit(
        existingRecord,
        AuditAction.MANUAL_ADD,
        currentOperator,
        async (r) => ({
          ...r,
          temperatureRecordId: tempRecord.id,
          status: RecordStatus.MANUAL,
          dataStatus: DataStatus.NORMAL,
          currentRemark: reason,
          isManual: true,
          manualAddInfo: {
            beforeData,
            afterData: {
              temperatureRecordId: tempRecord.id,
              status: RecordStatus.MANUAL,
              dataStatus: DataStatus.NORMAL,
              currentRemark: reason
            },
            addTime: now,
            operator: currentOperator,
            reason
          },
          updatedAt: now,
          operator: currentOperator
        })
      );

      const newRecords = checkRecords.map(r =>
        r.id === existingRecord.id ? updated : r
      );
      saveToStorage(CHECK_RECORDS_KEY, newRecords);
      set({ checkRecords: newRecords, temperatureRecords: newTempRecords });
    } else {
      const newCheckRecord: CheckRecord = {
        id: generateId('record'),
        babyId,
        temperatureRecordId: tempRecord.id,
        status: RecordStatus.MANUAL,
        dataStatus: DataStatus.NORMAL,
        currentRemark: reason,
        isManual: true,
        manualAddInfo: {
          beforeData: {},
          afterData: {
            temperatureRecordId: tempRecord.id,
            status: RecordStatus.MANUAL,
            dataStatus: DataStatus.NORMAL,
            currentRemark: reason
          },
          addTime: now,
          operator: currentOperator,
          reason
        },
        createdAt: now,
        updatedAt: now,
        operator: currentOperator
      };

      const newRecords = [...checkRecords, newCheckRecord];
      saveToStorage(CHECK_RECORDS_KEY, newRecords);
      set({ checkRecords: newRecords, temperatureRecords: newTempRecords });
    }
  },

  simulateServiceRestart: async () => {
    const { checkRecords, currentOperator } = get();
    const result = await processWithPartialSuccess(checkRecords, currentOperator);

    const failedIds = result.failed.map(f => f.recordId);
    const updatedRecords = checkRecords.map(r => {
      if (failedIds.includes(r.id)) {
        return {
          ...r,
          currentRemark: `${r.currentRemark} [服务重启处理失败: ${result.failed.find(f => f.recordId === r.id)?.reason}]`,
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });

    saveToStorage(CHECK_RECORDS_KEY, updatedRecords);
    set({ checkRecords: updatedRecords });

    return {
      success: result.success,
      failed: result.failed
    };
  },

  exportRecords: async (recordIds?: string[]) => {
    const {
      checkRecords,
      babies,
      temperatureRecords,
      leaveNotes,
      currentOperator
    } = get();

    const recordsToExport = recordIds
      ? checkRecords.filter(r => recordIds.includes(r.id))
      : checkRecords;

    const allChanges: StatusChangeTrace[] = [];
    recordsToExport.forEach(r => {
      const changes = getStatusChangesByRecordId(r.id);
      allChanges.push(...changes);
    });

    const exportId = await exportToExcel(
      recordsToExport,
      babies,
      temperatureRecords,
      leaveNotes,
      allChanges
    );

    return exportId;
  },

  setSelectedRecordId: (id: string | null) => set({ selectedRecordId: id }),

  refreshData: () => {
    get().initData();
  }
}));
