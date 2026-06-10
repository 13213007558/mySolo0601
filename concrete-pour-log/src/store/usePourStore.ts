import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PourRecord, FilterState, AbnormalRecord, CubeSample } from '@/types'
import { generateId, getNowString, validateRecord, determineStatus, detectDuplicateTrucks, calculateStats, filterRecords } from '@/utils/calc'
import { MOCK_RECORDS } from '@/utils/mockData'

interface PourStore {
  records: PourRecord[]
  filter: FilterState
  selectedId: string | null
  showForm: boolean
  editingRecord: PourRecord | null
  showDetail: boolean
  showReport: boolean

  setFilter: (partial: Partial<FilterState>) => void
  resetFilter: () => void
  selectRecord: (id: string | null) => void
  setShowDetail: (show: boolean) => void
  setShowForm: (show: boolean, record?: PourRecord | null) => void
  setShowReport: (show: boolean) => void

  addRecord: (record: Omit<PourRecord, 'id' | 'samples' | 'abnormals' | 'status' | 'createdAt' | 'updatedAt'> & { samples?: CubeSample[] }) => void
  updateRecord: (id: string, updates: Partial<PourRecord>) => void
  deleteRecord: (id: string) => void
  addSample: (recordId: string, sample: Omit<CubeSample, 'id' | 'recordId'>) => void
  handleAbnormal: (recordId: string, abnormalId: string, reason: string, handler: string) => void
  correctRecord: (recordId: string, correction: string, correctedBy: string) => void
  clearAll: () => void
  loadMock: () => void
  refreshStatus: () => void
}

const defaultFilter: FilterState = {
  position: [],
  grade: [],
  status: [],
  dateFrom: null,
  dateTo: null,
  truckNo: '',
  onlyAbnormal: false,
  onlyMissingPhoto: false
}

export const usePourStore = create<PourStore>()(
  persist(
    (set, get) => ({
      records: [],
      filter: defaultFilter,
      selectedId: null,
      showForm: false,
      editingRecord: null,
      showDetail: false,
      showReport: false,

      setFilter: (partial) => {
        set((state) => ({ filter: { ...state.filter, ...partial } }))
      },

      resetFilter: () => {
        set({ filter: defaultFilter })
      },

      selectRecord: (id) => {
        set({ selectedId: id, showDetail: id !== null })
      },

      setShowDetail: (show) => {
        set({ showDetail: show, selectedId: show ? get().selectedId : null })
      },

      setShowForm: (show, record = null) => {
        set({ showForm: show, editingRecord: record })
      },

      setShowReport: (show) => {
        set({ showReport: show })
      },

      addRecord: (recordData) => {
        const now = getNowString()
        const id = generateId()

        const baseAbnormals = validateRecord(recordData as any)
        baseAbnormals.forEach((a) => { a.recordId = id })

        const samples = recordData.samples?.map((s) => ({
          ...s,
          id: generateId(),
          recordId: id
        })) || []

        const newRecord: PourRecord = {
          id,
          ...recordData,
          samples,
          abnormals: baseAbnormals,
          status: 'normal',
          createdAt: now,
          updatedAt: now
        }

        newRecord.status = determineStatus(newRecord, newRecord.abnormals)

        set((state) => {
          const newRecords = [...state.records, newRecord]
          const dupAbnormals = detectDuplicateTrucks(newRecords)

          dupAbnormals.forEach((dup) => {
            const idx = newRecords.findIndex((r) => r.id === dup.recordId)
            if (idx >= 0) {
              newRecords[idx] = {
                ...newRecords[idx],
                abnormals: [...newRecords[idx].abnormals, dup],
                status: determineStatus(newRecords[idx], [...newRecords[idx].abnormals, dup])
              }
            }
          })

          return { records: newRecords }
        })
      },

      updateRecord: (id, updates) => {
        const now = getNowString()
        set((state) => {
          const newRecords = state.records.map((r) => {
            if (r.id !== id) return r

            const updated = { ...r, ...updates, updatedAt: now }
            const newAbnormals = validateRecord(updated as any)
            newAbnormals.forEach((a) => { a.recordId = id })

            const existingHandled = r.abnormals.filter((a) => a.handled || a.type === 'duplicate')
            const allAbnormals = [...newAbnormals, ...existingHandled]

            return {
              ...updated,
              abnormals: allAbnormals,
              status: determineStatus(updated, allAbnormals)
            }
          })

          const dupAbnormals = detectDuplicateTrucks(newRecords)
          dupAbnormals.forEach((dup) => {
            const idx = newRecords.findIndex((r) => r.id === dup.recordId)
            if (idx >= 0) {
              const hasDup = newRecords[idx].abnormals.some((a) => a.type === 'duplicate' && a.description === dup.description)
              if (!hasDup) {
                newRecords[idx] = {
                  ...newRecords[idx],
                  abnormals: [...newRecords[idx].abnormals, dup],
                  status: determineStatus(newRecords[idx], [...newRecords[idx].abnormals, dup])
                }
              }
            }
          })

          return { records: newRecords }
        })
      },

      deleteRecord: (id) => {
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
          showDetail: state.selectedId === id ? false : state.showDetail
        }))
      },

      addSample: (recordId, sample) => {
        const now = getNowString()
        set((state) => ({
          records: state.records.map((r) => {
            if (r.id !== recordId) return r
            const newSample = { ...sample, id: generateId(), recordId }
            return { ...r, samples: [...r.samples, newSample], updatedAt: now }
          })
        }))
      },

      handleAbnormal: (recordId, abnormalId, reason, handler) => {
        const now = getNowString()
        set((state) => {
          const newRecords = state.records.map((r) => {
            if (r.id !== recordId) return r
            const newAbnormals = r.abnormals.map((a) => {
              if (a.id !== abnormalId) return a
              return { ...a, handled: true, handleReason: reason, handler, handleTime: now }
            })
            const updated = { ...r, abnormals: newAbnormals, updatedAt: now }
            return { ...updated, status: determineStatus(updated, newAbnormals) }
          })
          return { records: newRecords }
        })
      },

      correctRecord: (recordId, correction, correctedBy) => {
        const now = getNowString()
        set((state) => ({
          records: state.records.map((r) => {
            if (r.id !== recordId) return r
            return {
              ...r,
              manualCorrection: correction,
              correctedBy,
              correctedAt: now,
              updatedAt: now
            }
          })
        }))
      },

      clearAll: () => {
        set({
          records: [],
          selectedId: null,
          showDetail: false,
          showForm: false
        })
      },

      loadMock: () => {
        set({
          records: MOCK_RECORDS,
          selectedId: null,
          showDetail: false
        })
      },

      refreshStatus: () => {
        const state = get()
        const refreshed = state.records.map((r) => ({
          ...r,
          status: determineStatus(r, r.abnormals)
        }))
        set({ records: refreshed })
      }
    }),
    {
      name: 'concrete-pour-storage-v1',
      partialize: (state) => ({ records: state.records })
    }
  )
)

export { calculateStats }
