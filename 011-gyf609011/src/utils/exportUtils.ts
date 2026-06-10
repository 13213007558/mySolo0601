import type { InspectionRecord, WeeklyReport, RiskLevel } from '@/types'

export function exportAsJSON(records: InspectionRecord[]): void {
  const report = generateWeeklyReport(records)
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `巡查周报_${report.period}.json`)
}

export function exportAsCSV(records: InspectionRecord[]): void {
  const headers = [
    '编号', '区域', '箱体类型', '箱体编号', '风险等级', '是否异常',
    '异常类型', '巡查日期', '巡查人', '漏保测试数', '异常测试数',
    '派单状态', '复查次数',
  ]

  const rows = records.map(r => [
    r.id,
    `${r.areaLevel1}-${r.areaLevel2}-${r.areaLevel3}`,
    r.boxType,
    r.boxId,
    r.riskLevel,
    r.isAnomaly ? '是' : '否',
    r.anomalyType || '无',
    r.inspectionDate,
    r.inspector,
    r.leakTests.length.toString(),
    r.leakTests.filter(t => !t.isNormal).length.toString(),
    r.dispatchOrder ? r.dispatchOrder.status : 'none',
    r.reviewOpinions.length.toString(),
  ])

  const csvContent = '\uFEFF' + [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
  const period = getReportPeriod(records)
  downloadBlob(blob, `巡查周报_${period}.csv`)
}

function generateWeeklyReport(records: InspectionRecord[]): WeeklyReport {
  const riskSummary = { high: 0, medium: 0, low: 0 } as Record<RiskLevel, number>
  const dispatchSummary = { none: 0, dispatched: 0, rectified: 0, reviewed: 0 }

  records.forEach(r => {
    riskSummary[r.riskLevel]++
    if (r.dispatchOrder) {
      dispatchSummary[r.dispatchOrder.status]++
    } else {
      dispatchSummary.none++
    }
  })

  return {
    generatedAt: new Date().toISOString(),
    period: getReportPeriod(records),
    totalRecords: records.length,
    anomalyCount: records.filter(r => r.isAnomaly).length,
    riskSummary: riskSummary as { high: number; medium: number; low: number },
    dispatchSummary,
    anomalyDetails: records
      .filter(r => r.isAnomaly)
      .map(r => ({ id: r.id, boxId: r.boxId, anomalyType: r.anomalyType })),
    records,
  }
}

function getReportPeriod(records: InspectionRecord[]): string {
  if (records.length === 0) return new Date().toISOString().slice(0, 10)
  const dates = records.map(r => r.inspectionDate).sort()
  return `${dates[0]}_${dates[dates.length - 1]}`
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
