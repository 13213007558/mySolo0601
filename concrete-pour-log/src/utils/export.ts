import type { PourRecord, CubeSample, AbnormalRecord } from '@/types'
import { formatDateTime, formatDate } from '@/utils/calc'

export function exportRecordsCSV(records: PourRecord[], filename?: string) {
  const BOM = '\uFEFF'
  const headers = [
    '车号', '批次号', '到场时间', '开始浇筑', '浇筑完成',
    '部位', '构件', '标号', '方量(m³)',
    '坍落度(mm)', '入模温度(℃)', '有照片', '标号匹配',
    '试验员', '监理', '状态',
    '试块组数', '异常数', '未处理异常',
    '旁站备注', '人工更正'
  ]

  const statusMap: Record<string, string> = {
    normal: '正常',
    warning: '预警',
    abnormal: '异常',
    missing_photo: '缺照片'
  }

  const rows = records.map((r) => [
    r.truckNo,
    r.batchNo,
    r.arriveTime,
    r.startPourTime || '',
    r.endPourTime || '',
    r.position,
    r.component,
    r.grade,
    r.volume.toString(),
    r.slump.toString(),
    r.temperature?.toString() || '',
    r.hasPhoto ? '是' : '否',
    r.gradeMatch ? '是' : '否',
    r.inspector || '',
    r.supervisor || '',
    statusMap[r.status] || r.status,
    r.samples.length.toString(),
    r.abnormals.length.toString(),
    r.abnormals.filter((a) => !a.handled).length.toString(),
    (r.remark || '').replace(/,/g, '，'),
    (r.manualCorrection || '').replace(/,/g, '，')
  ])

  const csv = [
    headers.join(','),
    ...rows.map((r) => r.join(','))
  ].join('\n')

  downloadCSV(BOM + csv, filename || `浇筑记录_${formatDate(records[0]?.arriveTime || new Date().toISOString())}.csv`)
}

export function exportSamplesCSV(records: PourRecord[], filename?: string) {
  const BOM = '\uFEFF'
  const headers = ['车号', '标号', '部位', '构件', '试块类型', '组号', '数量', '制作时间', '备注']

  const samples: CubeSample[] = []
  records.forEach((r) => {
    r.samples.forEach((s) => {
      samples.push(s)
    })
  })

  const rows = samples.map((s) => {
    const record = records.find((r) => r.id === s.recordId)
    return [
      record?.truckNo || '',
      record?.grade || '',
      record?.position || '',
      record?.component || '',
      s.type,
      s.groupNo,
      s.count.toString(),
      s.madeTime,
      s.remark || ''
    ]
  })

  const csv = [
    headers.join(','),
    ...rows.map((r) => r.join(','))
  ].join('\n')

  downloadCSV(BOM + csv, filename || `试块留置记录_${formatDate(records[0]?.arriveTime || new Date().toISOString())}.csv`)
}

export function exportAbnormalsCSV(records: PourRecord[], filename?: string) {
  const BOM = '\uFEFF'
  const headers = [
    '车号', '部位', '构件', '标号',
    '异常类型', '严重程度', '描述',
    '是否处理', '处理方式', '处理人', '处理时间'
  ]

  const abnormals: (AbnormalRecord & { record?: PourRecord })[] = []
  records.forEach((r) => {
    r.abnormals.forEach((a) => {
      abnormals.push({ ...a, record: r })
    })
  })

  const severityMap: Record<string, string> = {
    low: '轻微',
    medium: '中等',
    high: '严重'
  }

  const rows = abnormals.map((a) => [
    a.record?.truckNo || '',
    a.record?.position || '',
    a.record?.component || '',
    a.record?.grade || '',
    a.typeLabel,
    severityMap[a.severity] || a.severity,
    a.description.replace(/,/g, '，'),
    a.handled ? '是' : '否',
    (a.handleReason || '').replace(/,/g, '，'),
    a.handler || '',
    a.handleTime || ''
  ])

  const csv = [
    headers.join(','),
    ...rows.map((r) => r.join(','))
  ].join('\n')

  downloadCSV(BOM + csv, filename || `异常记录_${formatDate(records[0]?.arriveTime || new Date().toISOString())}.csv`)
}

export function generateReportText(records: PourRecord[]): string {
  const totalVolume = records.reduce((sum, r) => sum + r.volume, 0)
  const abnormalCount = records.filter((r) => r.status !== 'normal').length
  const missingPhotoCount = records.filter((r) => r.status === 'missing_photo').length
  const sampleCount = records.reduce((sum, r) => sum + r.samples.length, 0)
  const unhandledAbnormalCount = records.reduce(
    (sum, r) => sum + r.abnormals.filter((a) => !a.handled).length,
    0
  )

  const dates = Array.from(new Set(records.map((r) => formatDate(r.arriveTime)))).sort()
  const positions = Array.from(new Set(records.map((r) => r.position))).sort()

  let report = ''
  report += '═══════════════════════════════════════\n'
  report += '       混凝土浇筑旁站报告\n'
  report += '═══════════════════════════════════════\n\n'

  report += `统计日期：${dates[0] || '-'}${dates.length > 1 ? ' 至 ' + dates[dates.length - 1] : ''}\n`
  report += `涉及部位：${positions.join('、')}\n`
  report += `记录数量：${records.length} 条\n`
  report += `总 方 量：${totalVolume.toFixed(1)} m³\n`
  report += `试块组数：${sampleCount} 组\n\n`

  report += '───────────────────────────────────────\n'
  report += '一、质量概况\n'
  report += '───────────────────────────────────────\n'
  report += `正常记录：${records.length - abnormalCount} 条 (${((records.length - abnormalCount) / records.length * 100).toFixed(1)}%)\n`
  report += `异常记录：${abnormalCount} 条\n`
  report += `缺照片记录：${missingPhotoCount} 条\n`
  report += `未处理异常项：${unhandledAbnormalCount} 项\n\n`

  report += '───────────────────────────────────────\n'
  report += '二、异常明细\n'
  report += '───────────────────────────────────────\n'

  const allAbnormals: (AbnormalRecord & { record?: PourRecord })[] = []
  records.forEach((r) => {
    r.abnormals.forEach((a) => {
      allAbnormals.push({ ...a, record: r })
    })
  })

  if (allAbnormals.length === 0) {
    report += '无异常记录。\n'
  } else {
    allAbnormals.forEach((a, idx) => {
      report += `${idx + 1}. [${a.typeLabel}] ${a.record?.truckNo || ''} - ${a.record?.position || ''}\n`
      report += `   ${a.description}\n`
      report += `   状态：${a.handled ? '已处理 - ' + a.handleReason : '待处理'}\n\n`
    })
  }

  report += '───────────────────────────────────────\n'
  report += '三、试块留置汇总\n'
  report += '───────────────────────────────────────\n'

  const sampleTypes: Record<string, number> = {}
  records.forEach((r) => {
    r.samples.forEach((s) => {
      sampleTypes[s.type] = (sampleTypes[s.type] || 0) + s.count
    })
  })

  Object.entries(sampleTypes).forEach(([type, count]) => {
    report += `• ${type}：${count} 组\n`
  })

  report += '\n───────────────────────────────────────\n'
  report += '四、缺照片记录（问题项）\n'
  report += '───────────────────────────────────────\n'

  const missingPhotoRecords = records.filter((r) => !r.hasPhoto)
  if (missingPhotoRecords.length === 0) {
    report += '无缺照片记录。\n'
  } else {
    missingPhotoRecords.forEach((r, idx) => {
      report += `${idx + 1}. ${r.truckNo} - ${r.position} ${r.component}\n`
      report += `   到场时间：${formatDateTime(r.arriveTime)}\n`
      report += `   原因：${r.manualCorrection || '未说明'}\n\n`
    })
  }

  report += '\n═══════════════════════════════════════\n'
  report += '报告生成时间：' + formatDateTime(new Date().toISOString()) + '\n'
  report += '═══════════════════════════════════════\n'

  return report
}

export function downloadReport(records: PourRecord[], filename?: string) {
  const report = generateReportText(records)
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `浇筑旁站报告_${formatDate(records[0]?.arriveTime || new Date().toISOString())}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
