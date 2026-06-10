import { AlertTriangle, ImageOff, ThermometerSun, Droplets, Repeat, Tag } from 'lucide-react'
import { usePourStore } from '@/store/usePourStore'
import { RECORD_STATUS_LABELS } from '@/types'

interface IssueItem {
  id: string
  recordId: string
  type: string
  typeLabel: string
  description: string
  severity: 'low' | 'medium' | 'high'
  status: string
}

export default function IssuesPanel() {
  const records = usePourStore((s) => s.records)
  const selectRecord = usePourStore((s) => s.selectRecord)
  const setShowDetail = usePourStore((s) => s.setShowDetail)

  const issues: IssueItem[] = records.flatMap((r) => {
    const items: IssueItem[] = r.abnormals
      .filter((a) => !a.handled)
      .map((a) => ({
        id: a.id,
        recordId: r.id,
        type: a.type,
        typeLabel: a.typeLabel,
        description: a.description,
        severity: a.severity,
        status: RECORD_STATUS_LABELS[r.status]
      }))
    return items
  })

  const iconMap: Record<string, any> = {
    pump_stop: AlertTriangle,
    slump_out: Droplets,
    temp_abnormal: ThermometerSun,
    missing_photo: ImageOff,
    grade_mismatch: Tag,
    duplicate: Repeat
  }

  const severityColors = {
    low: 'bg-amber-50 border-amber-200 text-amber-700',
    medium: 'bg-orange-50 border-orange-300 text-orange-700',
    high: 'bg-red-50 border-red-300 text-red-700'
  }

  function handleClick(recordId: string) {
    selectRecord(recordId)
    setShowDetail(true)
  }

  const grouped = {
    high: issues.filter((i) => i.severity === 'high'),
    medium: issues.filter((i) => i.severity === 'medium'),
    low: issues.filter((i) => i.severity === 'low')
  }

  return (
    <div className="bg-white rounded-xl border border-concrete-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold text-concrete-900">问题汇总</h3>
        <span className="text-xs text-concrete-400">({issues.length} 项)</span>
      </div>

      {issues.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-concrete-400">没有待处理的问题 🎉</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          {(['high', 'medium', 'low'] as const).map((sev) => {
            if (grouped[sev].length === 0) return null
            const label = sev === 'high' ? '严重' : sev === 'medium' ? '中等' : '轻微'
            return (
              <div key={sev}>
                <p className={`text-xs font-medium mb-2 ${
                  sev === 'high' ? 'text-red-600' : sev === 'medium' ? 'text-orange-600' : 'text-amber-600'
                }`}>
                  {label} ({grouped[sev].length})
                </p>
                <div className="space-y-2">
                  {grouped[sev].map((issue) => {
                    const Icon = iconMap[issue.type] || AlertTriangle
                    return (
                      <div
                        key={issue.id}
                        onClick={() => handleClick(issue.recordId)}
                        className={`border rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow ${severityColors[sev]}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{issue.typeLabel}</span>
                            </div>
                            <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{issue.description}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
