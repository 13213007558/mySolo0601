import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RescheduleRecord, RecordFormData, OperationLog, RecordStatus, DataQualityIssue } from '@/types';
import { mockRecords } from '@/data/mockData';
import { generateId, validateRecord } from '@/utils/validation';

function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

interface RecordState {
  records: RescheduleRecord[];
  initialized: boolean;
  initFromMock: () => void;
  addRecord: (data: RecordFormData, isManual: boolean) => RescheduleRecord;
  updateRecord: (id: string, updates: Partial<RescheduleRecord>) => void;
  updateStatus: (id: string, status: RecordStatus, note: string, operator: string) => void;
  getRecordById: (id: string) => RescheduleRecord | undefined;
  filterByPhone: (phone: string) => RescheduleRecord[];
  filterRecords: (phone: string, status: string, onlyAbnormal: boolean) => RescheduleRecord[];
  getStats: () => { pending: number; processed: number; abnormal: number };
}

export const useRecordStore = create<RecordState>()(
  persist(
    (set, get) => ({
      records: [],
      initialized: false,

      initFromMock: () => {
        if (get().initialized) return;
        set({ records: [...mockRecords], initialized: true });
      },

      addRecord: (data: RecordFormData, isManual: boolean) => {
        const id = generateId();
        const now = formatDate(new Date());
        const allRecords = get().records;
        const issues: DataQualityIssue[] = validateRecord(data, allRecords).map(issue => ({
          ...issue,
          id: issue.id + '_' + Math.random().toString(36).slice(2, 6),
          recordId: id
        }));

        let status: RecordStatus = 'pending';
        if (issues.length > 0) {
          const hasError = issues.some(i => i.severity === 'error');
          status = hasError ? 'abnormal' : 'abnormal';
        }

        const hoursNum = typeof data.hours === 'number' ? data.hours : Number(data.hours);
        const actionType = isManual ? 'manual_create' : 'create';
        const logNote = isManual ? '手工补录入库' : '新建改期申请';

        const newRecord: RescheduleRecord = {
          id,
          sourceFile: data.sourceFile,
          handler: data.handler,
          status,
          latestNote: data.latestNote,
          babyName: data.babyName,
          phone: data.phone,
          originalCourse: data.originalCourse,
          targetCourse: data.targetCourse,
          reason: data.reason,
          unit: data.unit,
          hours: hoursNum || 0,
          operator: data.handler || '系统',
          createdAt: now,
          updatedAt: now,
          isManual,
          issues,
          logs: [
            {
              id: 'log_' + id + '_' + Date.now().toString(36),
              recordId: id,
              action: actionType,
              operator: data.handler || '系统',
              note: logNote,
              timestamp: now
            }
          ]
        };

        set(state => ({ records: [newRecord, ...state.records] }));
        return newRecord;
      },

      updateRecord: (id: string, updates: Partial<RescheduleRecord>) => {
        const now = formatDate(new Date());
        set(state => ({
          records: state.records.map(r =>
            r.id === id ? { ...r, ...updates, updatedAt: now } : r
          )
        }));
      },

      updateStatus: (id: string, status: RecordStatus, note: string, operator: string) => {
        const now = formatDate(new Date());
        const newLog: OperationLog = {
          id: 'log_' + id + '_' + Date.now().toString(36),
          recordId: id,
          action: 'status_update',
          operator,
          note,
          timestamp: now
        };
        set(state => ({
          records: state.records.map(r =>
            r.id === id
              ? { ...r, status, latestNote: note, updatedAt: now, logs: [newLog, ...r.logs] }
              : r
          )
        }));
      },

      getRecordById: (id: string) => {
        return get().records.find(r => r.id === id);
      },

      filterByPhone: (phone: string) => {
        if (!phone.trim()) return get().records;
        return get().records.filter(r => r.phone.includes(phone.trim()));
      },

      filterRecords: (phone: string, status: string, onlyAbnormal: boolean) => {
        let result = get().records;
        if (phone.trim()) {
          result = result.filter(r => r.phone.includes(phone.trim()) || r.babyName.includes(phone.trim()));
        }
        if (status && status !== 'all') {
          result = result.filter(r => r.status === status);
        }
        if (onlyAbnormal) {
          result = result.filter(r => r.issues.length > 0);
        }
        return result;
      },

      getStats: () => {
        const records = get().records;
        return {
          pending: records.filter(r => r.status === 'pending').length,
          processed: records.filter(r => r.status === 'processed').length,
          abnormal: records.filter(r => r.status === 'abnormal').length
        };
      }
    }),
    {
      name: 'dolphin-reschedule-records',
      partialize: (state) => ({ records: state.records, initialized: state.initialized })
    }
  )
);
