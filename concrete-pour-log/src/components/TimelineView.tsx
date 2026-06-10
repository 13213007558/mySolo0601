import { Clock, Truck, Play, Square, FlaskConical, AlertTriangle, Edit3 } from 'lucide-react'
import { usePourStore } from '@/store/usePourStore'
import { buildTimeline, formatTime } from '@/utils/calc'
import type { TimelineItem } from '@/types'

const typeConfig: Record<TimelineItem['type'], { icon: any; color: string; bgColor: string }> = {
  arrive: { icon: Truck, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  start_pour: { icon: Play, color: 'text-green-600', bgColor: 'bg-green-100' },
  end_pour: { icon: Square, color: 'text-gray-600', bgColor: 'bg-gray-200' },
  sample_made: { icon: FlaskConical, color: 'text-sky-600', bgColor: 'bg-sky-100' },
  abnormal: { icon: AlertTriangle, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  correction: { icon: Edit3, color: 'text-purple-600', bgColor: 'bg-purple-100' }
}

const severityColors = {
  low: 'border-amber-300 bg-amber-50',
  medium: 'border-orange-400 bg-orange-50',
  high: 'border-red-500 bg-red-50'
}

export default function TimelineView() {
  const records = usePourStore((s) => s.records)
  const filter = usePourStore((s) => s.filter)
  const selectRecord = usePourStore((s) => s.selectRecord)
  const selectedId = usePourStore((s) => s.selectedId)

  const filtered = records.filter((r) => {
    if (filter.position.length > 0 && !filter.position.includes(r.position)) return false
    if (filter.grade.length > 0 && !filter.grade.includes(r.grade)) return false
    if (filter.status.length > 0 && !filter.status.includes(r.status)) return false
    if (filter.truckNo && !r.truckNo.includes(filter.truckNo)) return false
    if (filter.onlyAbnormal && r.status === 'normal') return false
    if (filter.onlyMissingPhoto && r.status !== 'missing_photo') return false
    return true
  })

  const position = filter.position.length === 1 ? filter.position[0] : undefined
  const timeline = buildTimeline(filtered, position)

  const dates = Array.from(new Set(timeline.map((t) => t.time.slice(0, 10)))).sort()

  return (
    <div className="bg-white rounded-xl border border-concrete-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-accent" />
        <h3 className="font-semibold text-concrete-900">时间线</h3>
        <span className="text-xs text-concrete-400">({timeline.length} 个事件)</span>
      </div>

      <div className="max-h-96 overflow-y-auto pr-2">
        {timeline.length === 0 ? (
          <p className="text-center text-concrete-400 py-8 text-sm">暂无时间线数据</p>
        ) : (
          dates.map((date) => (
            <div key={date} className="mb-4">
              <p className="text-xs font-medium text-concrete-500 mb-2 sticky top-0 bg-white py-1 z-10">
                {date}
              </p>
              <div className="space-y-2">
                {timeline
                  .filter((t) => t.time.startsWith(date))
                  .map((item) => {
                    const config = typeConfig[item.type]
                    const Icon = config.icon
                    const isSelected = selectedId === item.recordId

                    return (
                      <div
                        key={item.id}
                        onClick={() => selectRecord(item.recordId)}
                        className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-accent bg-opacity-10 border border-accent'
                            : 'hover:bg-concrete-50 border border-transparent'
                        } ${
                          item.type === 'abnormal' && item.severity
                            ? severityColors[item.severity].replace('bg-', 'border-').replace('-50', '-200') + ' bg-opacity-30'
                            : ''
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${config.bgColor} flex-shrink-0`}>
                          <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-concrete-900">{item.title}</span>
                          </div>
                          <p className="text-xs text-concrete-500 mt-0.5 truncate">
                            {item.description}
                          </p>
                          <p className="text-xs text-concrete-400 mt-1">{formatTime(item.time)}</p>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
