import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Sample, SampleFormData, Batch, ConfirmRecord, SampleStatus } from '@/types'
import { generateId, nowISO, isDateBefore } from '@/utils/date'
import { getMockSamples } from '@/composables/useMockData'

export const useSampleStore = defineStore('sample', () => {
  const samples = ref<Sample[]>(getMockSamples())

  const allSamples = computed(() => samples.value)

  const samplesCount = computed(() => ({
    total: samples.value.length,
    available: samples.value.filter(s => s.status === 'available').length,
    pending: samples.value.filter(s => s.status === 'pending').length,
    rejected: samples.value.filter(s => s.status === 'rejected').length,
  }))

  function findById(id: string | null): Sample | undefined {
    if (!id) return undefined
    return samples.value.find(s => s.id === id)
  }

  function createSample(data: SampleFormData): Sample {
    const now = nowISO()
    const sample: Sample = {
      id: generateId('sample'),
      sampleNo: data.sampleNo,
      version: data.version,
      materialType: data.materialType,
      specification: data.specification,
      manufacturer: data.manufacturer,
      manufacturerContact: data.manufacturerContact,
      manufacturerPhone: data.manufacturerPhone,
      sealPhoto: data.sealPhoto,
      sealDate: data.sealDate,
      sealConfirmer: data.sealConfirmer,
      remark: data.remark,
      status: data.status,
      createdAt: now,
      updatedAt: now,
      batches: (data.batches || []).map(b => ({
        ...b,
        id: b.id || generateId('batch'),
      })),
      confirmRecords: [],
    }
    samples.value.unshift(sample)
    return sample
  }

  function updateSample(id: string, data: SampleFormData): Sample | undefined {
    const idx = samples.value.findIndex(s => s.id === id)
    if (idx === -1) return undefined
    const existing = samples.value[idx]
    const updated: Sample = {
      ...existing,
      sampleNo: data.sampleNo,
      version: data.version,
      materialType: data.materialType,
      specification: data.specification,
      manufacturer: data.manufacturer,
      manufacturerContact: data.manufacturerContact,
      manufacturerPhone: data.manufacturerPhone,
      sealPhoto: data.sealPhoto,
      sealDate: data.sealDate,
      sealConfirmer: data.sealConfirmer,
      remark: data.remark,
      status: data.status,
      updatedAt: nowISO(),
      batches: (data.batches || []).map(b => ({
        ...b,
        id: b.id || generateId('batch'),
        sampleId: id,
      })),
    }
    samples.value.splice(idx, 1, updated)
    return updated
  }

  function updateSampleStatus(id: string, status: SampleStatus): boolean {
    const s = findById(id)
    if (!s) return false
    s.status = status
    s.updatedAt = nowISO()
    return true
  }

  function addBatch(sampleId: string, batch: Omit<Batch, 'id' | 'sampleId'>): Batch | undefined {
    const s = findById(sampleId)
    if (!s) return undefined
    const newBatch: Batch = {
      ...batch,
      id: generateId('batch'),
      sampleId,
    }
    s.batches.push(newBatch)
    s.updatedAt = nowISO()
    return newBatch
  }

  function removeBatch(sampleId: string, batchId: string): boolean {
    const s = findById(sampleId)
    if (!s) return false
    const before = s.batches.length
    s.batches = s.batches.filter(b => b.id !== batchId)
    s.updatedAt = nowISO()
    return s.batches.length < before
  }

  function addConfirmRecord(sampleId: string, record: Omit<ConfirmRecord, 'id' | 'sampleId'>): ConfirmRecord | undefined {
    const s = findById(sampleId)
    if (!s) return undefined
    const newRecord: ConfirmRecord = {
      ...record,
      id: generateId('rec'),
      sampleId,
    }
    s.confirmRecords.unshift(newRecord)
    s.updatedAt = nowISO()
    if (record.action === 'confirm') {
      s.status = 'available'
    } else if (record.action === 'reject') {
      s.status = 'rejected'
    }
    return newRecord
  }

  function isDuplicateBatchNo(sampleId: string | null, batchNo: string, excludeBatchId?: string): boolean {
    for (const s of samples.value) {
      if (sampleId && s.id === sampleId) continue
      for (const b of s.batches) {
        if (excludeBatchId && b.id === excludeBatchId) continue
        if (b.batchNo.trim() === batchNo.trim()) return true
      }
    }
    return false
  }

  function validateSampleForm(data: SampleFormData, editingId: string | null = null): { field: string; message: string; type: 'error' | 'warning' }[] {
    const errors: { field: string; message: string; type: 'error' | 'warning' }[] = []
    if (!data.sampleNo?.trim()) {
      errors.push({ field: 'sampleNo', message: '样板编号不能为空', type: 'error' })
    }
    if (!data.sealPhoto?.trim()) {
      errors.push({ field: 'sealPhoto', message: '请上传封样色板照片', type: 'error' })
    }
    if (!data.sealDate) {
      errors.push({ field: 'sealDate', message: '封样日期不能为空', type: 'error' })
    }
    const seen = new Map<string, string>()
    for (const b of data.batches || []) {
      if (!b.batchNo?.trim()) {
        errors.push({ field: `batch_${b.id}_batchNo`, message: '厂家批次号不能为空', type: 'error' })
        continue
      }
      if (seen.has(b.batchNo.trim())) {
        errors.push({ field: `batch_${b.id}_batchNo`, message: `厂家批次号与第${seen.get(b.batchNo.trim())}行重复`, type: 'error' })
      } else {
        seen.set(b.batchNo.trim(), b.batchNo)
      }
      if (isDuplicateBatchNo(editingId, b.batchNo, b.id)) {
        errors.push({ field: `batch_${b.id}_batchNo`, message: '该厂家批次号在其他样板中已存在，请核对', type: 'error' })
      }
      if (b.entryDate && data.sealDate && isDateBefore(b.entryDate, data.sealDate)) {
        errors.push({ field: `batch_${b.id}_entryDate`, message: '进场日期不能早于封样日期', type: 'warning' })
      }
      if (!b.entryPhoto?.trim()) {
        errors.push({ field: `batch_${b.id}_entryPhoto`, message: '缺少进场材料照片，请补充', type: 'warning' })
      }
    }
    return errors
  }

  function resetToMock(): void {
    samples.value = getMockSamples()
  }

  return {
    samples,
    allSamples,
    samplesCount,
    findById,
    createSample,
    updateSample,
    updateSampleStatus,
    addBatch,
    removeBatch,
    addConfirmRecord,
    isDuplicateBatchNo,
    validateSampleForm,
    resetToMock,
  }
}, {
  persist: {
    key: 'curtain-wall-samples',
    storage: localStorage,
  },
})
