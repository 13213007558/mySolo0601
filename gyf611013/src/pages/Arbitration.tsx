import { useState } from 'react'
import { Calendar, Download, FileArchive, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { useTruffleStore } from '@/store'
import { exportArbitrationPackage } from '@/utils/export'
import { dogs } from '@/data/mock'

interface HistoryEntry {
  date: string
  hotspotCount: number
  exportedAt: string
  status: 'success' | 'pending' | 'failed'
}

const mockHistory: HistoryEntry[] = [
  { date: '2026-06-10', hotspotCount: 18, exportedAt: '2026-06-10 18:32', status: 'success' },
  { date: '2026-06-09', hotspotCount: 15, exportedAt: '2026-06-09 18:45', status: 'success' },
  { date: '2026-06-08', hotspotCount: 22, exportedAt: '2026-06-08 19:01', status: 'failed' },
]

export default function Arbitration() {
  const { hotspots, trajectories, selectedDate, setSelectedDate } = useTruffleStore()
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [history] = useState<HistoryEntry[]>(mockHistory)

  const dayHotspots = hotspots.filter((h) => {
    const d = new Date(h.detectedAt).toISOString().split('T')[0]
    return d === selectedDate
  })
  const dayTrajectories = trajectories.filter((t) => t.date === selectedDate)

  const handleExport = async () => {
    setExporting(true)
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 15
      })
    }, 200)

    try {
      await exportArbitrationPackage(dayHotspots, dayTrajectories, dogs, selectedDate)
      clearInterval(interval)
      setProgress(100)
    } catch {
      clearInterval(interval)
      setProgress(0)
    } finally {
      setTimeout(() => {
        setExporting(false)
        setProgress(0)
      }, 800)
    }
  }

  const statusIcon = (status: HistoryEntry['status']) => {
    if (status === 'success') return <CheckCircle size={16} className="text-green-600" />
    if (status === 'pending') return <Clock size={16} className="text-amber-500" />
    return <AlertTriangle size={16} className="text-red-500" />
  }

  const statusLabel = (status: HistoryEntry['status']) => {
    if (status === 'success') return '成功'
    if (status === 'pending') return '进行中'
    return '失败'
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-forest-800 mb-6">争议仲裁中心</h1>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-bark-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-forest-600" />
            <span className="text-sm text-bark-600">仲裁周期</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-bark-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <span className="text-sm text-bark-500">
            当日热点: <span className="font-semibold text-forest-800">{dayHotspots.length}</span>
          </span>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Download size={18} />
          {exporting ? '导出中...' : '一键导出仲裁包'}
        </button>

        {exporting && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-bark-500">导出进度</span>
              <span className="text-xs text-bark-600">{progress}%</span>
            </div>
            <div className="h-2 bg-bark-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-bark-200 overflow-hidden">
        <div className="px-5 py-3 bg-forest-800 text-white flex items-center gap-2">
          <FileArchive size={16} />
          <span className="font-medium text-sm">历史导出记录</span>
        </div>
        <div className="divide-y divide-bark-100">
          {history.map((entry, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center justify-between hover:bg-bark-50">
              <div className="flex items-center gap-3">
                {statusIcon(entry.status)}
                <div>
                  <p className="text-sm font-medium text-forest-800">{entry.date}</p>
                  <p className="text-xs text-bark-500">热点数: {entry.hotspotCount}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-bark-500">{entry.exportedAt}</p>
                <p className={`text-xs font-medium ${entry.status === 'success' ? 'text-green-600' : entry.status === 'pending' ? 'text-amber-500' : 'text-red-500'}`}>
                  {statusLabel(entry.status)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
