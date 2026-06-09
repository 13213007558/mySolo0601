import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FuseAlarm, HistoryRecord, ProcessStatus, AlarmStatus } from '@/types';
import { mockFuseAlarms, generateId } from '@/data/mockData';
import { importFromJson, mergeImportData } from '@/utils/import';
import { exportToJson } from '@/utils/export';

interface AlarmState {
  alarms: FuseAlarm[];
  selectedAlarmId: string | null;
  filterStatus: AlarmStatus | 'all';
  filterProcess: ProcessStatus | 'all';
  searchText: string;
  expandedCardId: string | null;
  showPhotoCompare: boolean;
  comparePhotoIds: { before: string; after: string } | null;
}

interface AlarmActions {
  setSelectedAlarm: (id: string | null) => void;
  setFilterStatus: (status: AlarmStatus | 'all') => void;
  setFilterProcess: (status: ProcessStatus | 'all') => void;
  setSearchText: (text: string) => void;
  toggleCardExpand: (id: string | null) => void;
  setShowPhotoCompare: (show: boolean, ids?: { before: string; after: string }) => void;
  submitConclusion: (id: string, conclusion: string, reason: string, operator: string) => void;
  withdrawConclusion: (id: string, remark: string, supervisor: string) => void;
  resubmitConclusion: (id: string, conclusion: string, reason: string, note: string, operator: string) => void;
  addManualPhoto: (id: string, photoUrl: string, filename: string, uploader: string, remark: string) => void;
  updateProcessedValue: (id: string, value: string) => void;
  exportData: () => void;
  importData: (file: File) => Promise<void>;
  resetToMock: () => void;
  getFilteredAlarms: () => FuseAlarm[];
  getStats: () => { total: number; abnormal: number; pending: number; completed: number };
}

const STORAGE_KEY = 'fuse-alarm-wall-data-v1';

export const useAlarmStore = create<AlarmState & AlarmActions>()(
  persist(
    (set, get) => ({
      alarms: mockFuseAlarms,
      selectedAlarmId: null,
      filterStatus: 'all',
      filterProcess: 'all',
      searchText: '',
      expandedCardId: null,
      showPhotoCompare: false,
      comparePhotoIds: null,

      setSelectedAlarm: (id) => set({ selectedAlarmId: id }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      setFilterProcess: (status) => set({ filterProcess: status }),
      setSearchText: (text) => set({ searchText: text }),
      toggleCardExpand: (id) => set({ expandedCardId: get().expandedCardId === id ? null : id }),
      setShowPhotoCompare: (show, ids) => set({ showPhotoCompare: show, comparePhotoIds: ids || null }),

      submitConclusion: (id, conclusion, reason, operator) => {
        set((state) => {
          const historyRecord: HistoryRecord = {
            id: generateId('HIST'),
            action: 'submit',
            operator,
            timestamp: new Date().toISOString(),
            newConclusion: conclusion,
            newReason: reason,
            remark: '提交处理结论'
          };

          return {
            alarms: state.alarms.map((alarm) =>
              alarm.id === id
                ? {
                    ...alarm,
                    currentConclusion: conclusion,
                    currentReason: reason,
                    processStatus: 'pending_review' as ProcessStatus,
                    status: conclusion.includes('正常') ? 'normal' : 'abnormal',
                    history: [...alarm.history, historyRecord],
                    updatedAt: new Date().toISOString()
                  }
                : alarm
            )
          };
        });
      },

      withdrawConclusion: (id, remark, supervisor) => {
        set((state) => {
          const alarm = state.alarms.find((a) => a.id === id);
          if (!alarm) return state;

          const historyRecord: HistoryRecord = {
            id: generateId('HIST'),
            action: 'withdraw',
            operator: supervisor,
            timestamp: new Date().toISOString(),
            oldConclusion: alarm.currentConclusion,
            oldReason: alarm.currentReason,
            remark
          };

          return {
            alarms: state.alarms.map((a) =>
              a.id === id
                ? {
                    ...a,
                    processStatus: 'withdrawn' as ProcessStatus,
                    currentConclusion: '已撤回，待重新提交',
                    currentReason: '原结论已撤回',
                    supervisorNote: a.supervisorNote ? `${a.supervisorNote}\n${remark}` : remark,
                    history: [...a.history, historyRecord],
                    updatedAt: new Date().toISOString()
                  }
                : a
            )
          };
        });
      },

      resubmitConclusion: (id, conclusion, reason, note, operator) => {
        set((state) => {
          const historyRecord: HistoryRecord = {
            id: generateId('HIST'),
            action: 'resubmit',
            operator,
            timestamp: new Date().toISOString(),
            newConclusion: conclusion,
            newReason: reason,
            remark: note || '重新提交结论'
          };

          return {
            alarms: state.alarms.map((alarm) =>
              alarm.id === id
                ? {
                    ...alarm,
                    currentConclusion: conclusion,
                    currentReason: reason,
                    processStatus: 'pending_review' as ProcessStatus,
                    status: conclusion.includes('正常') ? 'normal' : 'abnormal',
                    history: [...alarm.history, historyRecord],
                    updatedAt: new Date().toISOString()
                  }
                : alarm
            )
          };
        });
      },

      addManualPhoto: (id, photoUrl, filename, uploader, remark) => {
        set((state) => {
          const historyRecord: HistoryRecord = {
            id: generateId('HIST'),
            action: 'manual_upload',
            operator: uploader,
            timestamp: new Date().toISOString(),
            remark: `手工补录照片: ${remark}`
          };

          return {
            alarms: state.alarms.map((alarm) =>
              alarm.id === id
                ? {
                    ...alarm,
                    manualPhotos: [
                      ...alarm.manualPhotos,
                      {
                        id: generateId('PHOTO'),
                        url: photoUrl,
                        filename,
                        uploadedAt: new Date().toISOString(),
                        uploader,
                        isManual: true,
                        remark
                      }
                    ],
                    history: [...alarm.history, historyRecord],
                    updatedAt: new Date().toISOString()
                  }
                : alarm
            )
          };
        });
      },

      updateProcessedValue: (id, value) => {
        set((state) => ({
          alarms: state.alarms.map((alarm) =>
            alarm.id === id
              ? {
                  ...alarm,
                  processedValue: value,
                  updatedAt: new Date().toISOString()
                }
              : alarm
          )
        }));
      },

      exportData: () => {
        const { alarms } = get();
        exportToJson(alarms);
      },

      importData: async (file) => {
        const imported = await importFromJson(file);
        set((state) => {
          const merged = mergeImportData(state.alarms, imported);
          return { alarms: merged };
        });
      },

      resetToMock: () => {
        set({ alarms: mockFuseAlarms });
      },

      getFilteredAlarms: () => {
        const { alarms, filterStatus, filterProcess, searchText } = get();
        return alarms.filter((alarm) => {
          if (filterStatus !== 'all' && alarm.status !== filterStatus) return false;
          if (filterProcess !== 'all' && alarm.processStatus !== filterProcess) return false;
          if (searchText) {
            const search = searchText.toLowerCase();
            return (
              alarm.fuseNo.toLowerCase().includes(search) ||
              alarm.deviceLocation.toLowerCase().includes(search) ||
              alarm.customerEmail.toLowerCase().includes(search) ||
              alarm.emailSubject.toLowerCase().includes(search)
            );
          }
          return true;
        });
      },

      getStats: () => {
        const { alarms } = get();
        return {
          total: alarms.length,
          abnormal: alarms.filter((a) => a.status === 'abnormal').length,
          pending: alarms.filter((a) => a.processStatus === 'processing' || a.processStatus === 'received').length,
          completed: alarms.filter((a) => a.processStatus === 'completed').length
        };
      }
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        alarms: state.alarms
      })
    }
  )
);
