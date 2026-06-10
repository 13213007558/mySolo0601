import { ref } from 'vue'
import type { Sample } from '@/types'
import { maskPhone } from '@/utils/mask'
import { useFilterStore } from '@/stores/filter'

const STATUS_LABEL: Record<string, string> = {
  available: '可用',
  pending: '待确认',
  rejected: '退回',
}

const ACTION_LABEL: Record<string, string> = {
  confirm: '确认',
  reject: '退回',
}

export function useExport() {
  const exportLoading = ref(false)

  function buildCSV(samples: Sample[], useMask = true): string {
    const header = [
      '样板编号',
      '版本',
      '材料类型',
      '规格型号',
      '生产厂家',
      '厂家联系人',
      '厂家联系电话',
      '封样日期',
      '封样确认人',
      '当前状态',
      '厂家批次号',
      '进场批次号',
      '进场日期',
      '进场数量',
      '批次状态',
      '确认人',
      '确认人角色',
      '确认人电话',
      '确认日期',
      '操作',
      '历史说明',
    ]

    const rows: string[][] = []

    for (const s of samples) {
      if (s.batches.length === 0 && s.confirmRecords.length === 0) {
        rows.push([
          s.sampleNo,
          s.version,
          s.materialType,
          s.specification,
          s.manufacturer,
          s.manufacturerContact,
          useMask ? maskPhone(s.manufacturerPhone) : s.manufacturerPhone,
          s.sealDate,
          s.sealConfirmer,
          STATUS_LABEL[s.status] || s.status,
          '', '', '', '', '',
          '', '', '', '', '',
          s.remark || '',
        ])
        continue
      }

      if (s.batches.length > 0) {
        for (const b of s.batches) {
          const relatedRecords = s.confirmRecords.filter(
            r => !r.batchId || r.batchId === b.id,
          )
          if (relatedRecords.length === 0) {
            rows.push([
              s.sampleNo, s.version, s.materialType, s.specification, s.manufacturer,
              s.manufacturerContact,
              useMask ? maskPhone(s.manufacturerPhone) : s.manufacturerPhone,
              s.sealDate, s.sealConfirmer, STATUS_LABEL[s.status] || s.status,
              b.batchNo, b.entryBatchNo, b.entryDate, b.quantity, b.remark || '待确认',
              '', '', '', '', '',
              s.remark || '',
            ])
          } else {
            for (const r of relatedRecords) {
              rows.push([
                s.sampleNo, s.version, s.materialType, s.specification, s.manufacturer,
                s.manufacturerContact,
                useMask ? maskPhone(s.manufacturerPhone) : s.manufacturerPhone,
                s.sealDate, s.sealConfirmer, STATUS_LABEL[s.status] || s.status,
                b.batchNo, b.entryBatchNo, b.entryDate, b.quantity, b.remark || '',
                r.confirmer, r.confirmerRole,
                useMask ? maskPhone(r.confirmerPhone) : r.confirmerPhone,
                r.confirmDate, ACTION_LABEL[r.action] || r.action,
                r.description || s.remark || '',
              ])
            }
          }
        }
      }

      const unboundRecords = s.confirmRecords.filter(r => !r.batchId && s.batches.length === 0)
      for (const r of unboundRecords) {
        rows.push([
          s.sampleNo, s.version, s.materialType, s.specification, s.manufacturer,
          s.manufacturerContact,
          useMask ? maskPhone(s.manufacturerPhone) : s.manufacturerPhone,
          s.sealDate, s.sealConfirmer, STATUS_LABEL[s.status] || s.status,
          '', '', '', '', '',
          r.confirmer, r.confirmerRole,
          useMask ? maskPhone(r.confirmerPhone) : r.confirmerPhone,
          r.confirmDate, ACTION_LABEL[r.action] || r.action,
          r.description || s.remark || '',
        ])
      }
    }

    const escape = (v: string) => {
      if (v == null) return ''
      const s = String(v).replace(/"/g, '""')
      if (/[",\n]/.test(s)) return `"${s}"`
      return s
    }

    const lines = [header.map(escape).join(',')]
    for (const r of rows) lines.push(r.map(escape).join(','))
    return '\uFEFF' + lines.join('\r\n')
  }

  async function downloadCSV(filename: string, useMask = true) {
    exportLoading.value = true
    try {
      const filter = useFilterStore()
      const data = buildCSV(filter.filteredSamples, useMask)
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      exportLoading.value = false
    }
  }

  return {
    exportLoading,
    buildCSV,
    downloadCSV,
  }
}
