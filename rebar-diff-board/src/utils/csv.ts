import Papa from 'papaparse'
import type { RebarItem, DiffStatus } from '@/types'
import { DIFF_STATUS_LABELS } from '@/types'

export function exportToCSV(items: RebarItem[], filename: string = '钢筋下料差异表.csv') {
  const rows = items.map((item) => ({
    '楼栋': item.building,
    '构件': item.component,
    '规格': item.specRaw,
    '牌号': item.spec.grade,
    '直径(mm)': item.spec.diameter,
    '下料数量': item.plannedQty,
    '实收数量': item.actualQty,
    '差异数量': item.diffQty,
    '单位': item.unit,
    '状态': DIFF_STATUS_LABELS[item.status as DiffStatus] || item.status,
    '备注': item.remark,
    '处理状态': item.judgment ? item.judgment.decisionLabel : '未处理',
    '处理意见': item.judgment?.reason || '',
    '处理人': item.judgment?.operator || '',
    '处理时间': item.judgment?.timestamp || ''
  }))

  const csv = Papa.unparse(rows)
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })

  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function importFromCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        resolve(results.data as any[])
      },
      error: (error) => {
        reject(error)
      }
    })
  })
}

export function generateCSVTemplate(type: 'plan' | 'actual'): string {
  const headers = type === 'plan'
    ? ['楼栋', '构件', '规格', '下料数量', '单位', '备注']
    : ['楼栋', '构件', '规格', '实收数量', '单位', '备注']

  const sampleRows = type === 'plan'
    ? [
        ['1号楼', '梁', 'HRB400E Φ20', '120', '根', '三层梁'],
        ['1号楼', '柱', 'HRB400E Φ25', '80', '根', '框架柱'],
        ['2号楼', '板', 'HRB400E Φ12', '500', '根', '楼板底筋']
      ]
    : [
        ['1号楼', '梁', 'HRB400E Φ20', '115', '根', '实际到场'],
        ['1号楼', '柱', 'HRB400E Φ25', '82', '根', '实际到场'],
        ['2号楼', '板', 'HRB400E Φ12', '480', '根', '实际到场']
      ]

  const rows = [headers, ...sampleRows]
  return Papa.unparse(rows)
}
