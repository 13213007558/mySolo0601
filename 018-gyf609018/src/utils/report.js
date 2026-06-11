import { formatDateTime, durationHours, STATUS_LABEL } from './validators.js'

export function buildReportRows(records, statusMap) {
  const rows = []
  records.forEach(r => {
    const st = statusMap[r.id] || { overall: 'unknown', issues: [] }
    const h = durationHours(r.startTime, r.endTime)
    rows.push({
      序号: rows.length + 1,
      楼栋: r.building,
      单元: r.unit || '',
      户号: r.roomNumber,
      房间: r.roomType,
      质量员: r.inspector || '',
      开始时间: formatDateTime(r.startTime),
      结束时间: formatDateTime(r.endTime),
      蓄水时长: h ? `${h.toFixed(1)}小时` : '-',
      水位cm: r.waterDepthCm ?? '-',
      渗漏结论: conclusionLabel(r.leakConclusion),
      渗漏部位: r.leakLocation || '',
      状态: STATUS_LABEL[st.overall] || st.overall,
      异常说明: st.issues.map(i => i.msg).join('；') || '',
      复测次数: (r.retests || []).length,
      最新复测结论: latestRetest(r),
      备注: r.remark || ''
    })
  })
  return rows
}

function conclusionLabel(c) {
  return { pass: '通过', leak: '渗漏', pending: '待定' }[c] || c || '-'
}

function latestRetest(r) {
  if (!r.retests || r.retests.length === 0) return '-'
  const last = r.retests[r.retests.length - 1]
  return conclusionLabel(last.leakConclusion)
}

export function exportCSV(rows, filename) {
  if (!rows || rows.length === 0) {
    alert('暂无数据可导出')
    return
  }
  const headers = Object.keys(rows[0])
  const escape = v => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const headRow = headers.map(escape).join(',')
  const bodyRows = rows.map(r => headers.map(h => escape(r[h])).join(','))
  const csv = '\ufeff' + [headRow, ...bodyRows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `防水闭水试验报告_${Date.now()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function buildReportSummary(records, statusMap) {
  const total = records.length
  let normal = 0, pending = 0, abnormal = 0, warning = 0, incomplete = 0
  records.forEach(r => {
    const s = statusMap[r.id]?.overall
    if (s === 'normal') normal++
    else if (s === 'pending_retest') pending++
    else if (s === 'abnormal') abnormal++
    else if (s === 'warning') warning++
    else incomplete++
  })
  return { total, normal, pending, abnormal, warning, incomplete }
}
