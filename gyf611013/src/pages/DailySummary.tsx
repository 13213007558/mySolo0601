import { useState } from 'react'
import { Calendar, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { useTruffleStore } from '@/store'
import { dogs } from '@/data/mock'

export default function DailySummary() {
  const { hotspots, selectedDate, setSelectedDate, getHotspotsByDog } = useTruffleStore()
  const [toast, setToast] = useState(false)

  const dayHotspots = hotspots.filter((h) => {
    const d = new Date(h.detectedAt).toISOString().split('T')[0]
    return d === selectedDate
  })

  const total = dayHotspots.length
  const confirmed = dayHotspots.filter((h) => h.status === 'confirmed').length
  const rejected = dayHotspots.filter((h) => h.status === 'expired' || h.status === 'mismatch').length
  const complianceRate = total > 0 ? ((confirmed / total) * 100).toFixed(1) : '0.0'

  const dogRows = dogs.map((dog) => {
    const dHotspots = getHotspotsByDog(dog.id, selectedDate)
    const dTotal = dHotspots.length
    const dConfirmed = dHotspots.filter((h) => h.status === 'confirmed').length
    const dRejected = dHotspots.filter((h) => h.status === 'expired' || h.status === 'mismatch').length
    const dOverLimit = dHotspots.filter((h) => h.status === 'over_limit').length
    const dRate = dTotal > 0 ? (dConfirmed / dTotal) * 100 : 0
    return { dog, total: dTotal, confirmed: dConfirmed, rejected: dRejected, overLimit: dOverLimit, rate: dRate }
  })

  const handlePush = () => {
    setToast(true)
    setTimeout(() => setToast(false), 2000)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-forest-800">日终汇总</h1>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-forest-600" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-bark-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-bark-200">
          <p className="text-bark-500 text-xs mb-1">总热点</p>
          <p className="text-2xl font-bold text-forest-800">{total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-bark-200">
          <div className="flex items-center gap-1 mb-1">
            <CheckCircle size={14} className="text-green-600" />
            <p className="text-bark-500 text-xs">已确认</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{confirmed}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-bark-200">
          <div className="flex items-center gap-1 mb-1">
            <XCircle size={14} className="text-red-500" />
            <p className="text-bark-500 text-xs">已驳回</p>
          </div>
          <p className="text-2xl font-bold text-red-500">{rejected}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-bark-200">
          <div className="flex items-center gap-1 mb-1">
            <AlertTriangle size={14} className="text-amber-500" />
            <p className="text-bark-500 text-xs">合规率</p>
          </div>
          <p className="text-2xl font-bold text-amber-500">{complianceRate}%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-bark-200 overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-forest-800 text-white">
              <th className="text-left px-4 py-3">犬只</th>
              <th className="text-center px-3 py-3">总数</th>
              <th className="text-center px-3 py-3">确认</th>
              <th className="text-center px-3 py-3">驳回</th>
              <th className="text-center px-3 py-3">超限</th>
              <th className="text-center px-4 py-3">合规率</th>
            </tr>
          </thead>
          <tbody>
            {dogRows.map((row) => (
              <tr key={row.dog.id} className="border-b border-bark-100 last:border-0 hover:bg-bark-50">
                <td className="px-4 py-3 font-medium text-forest-800">
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-2 align-middle"
                    style={{ backgroundColor: row.dog.avatarColor }}
                  />
                  {row.dog.name}
                </td>
                <td className="text-center px-3 py-3">{row.total}</td>
                <td className="text-center px-3 py-3 text-green-600">{row.confirmed}</td>
                <td className="text-center px-3 py-3 text-red-500">{row.rejected}</td>
                <td className="text-center px-3 py-3 text-amber-600">{row.overLimit}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-bark-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all"
                        style={{ width: `${row.rate}%` }}
                      />
                    </div>
                    <span className="text-xs text-bark-600 w-12 text-right">{row.rate.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handlePush}
          className="bg-forest-800 hover:bg-forest-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          推送给负责人
        </button>
      </div>

      {toast && (
        <div className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle size={18} />
          推送成功
        </div>
      )}
    </div>
  )
}
