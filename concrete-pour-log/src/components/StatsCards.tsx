import { Droplets, Truck, AlertTriangle, Image as ImageIcon, FlaskConical } from 'lucide-react'
import { usePourStore, calculateStats } from '@/store/usePourStore'

export default function StatsCards() {
  const records = usePourStore((s) => s.records)
  const stats = calculateStats(records)

  const cards = [
    {
      label: '总方量',
      value: `${stats.totalVolume} m³`,
      sub: `${stats.totalRecords} 车次`,
      icon: Droplets,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      label: '不同车号',
      value: stats.truckCount,
      sub: '辆搅拌车',
      icon: Truck,
      color: 'bg-green-50 text-green-600'
    },
    {
      label: '异常条目',
      value: stats.abnormalItems,
      sub: `${stats.abnormalCount} 条记录`,
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-600'
    },
    {
      label: '缺照片',
      value: stats.missingPhotoCount,
      sub: '条记录',
      icon: ImageIcon,
      color: 'bg-purple-50 text-purple-600'
    },
    {
      label: '试块组数',
      value: stats.sampleCount,
      sub: '组留置',
      icon: FlaskConical,
      color: 'bg-sky-50 text-sky-600'
    }
  ]

  return (
    <div className="grid grid-cols-5 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-xl border border-concrete-200 shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-concrete-500 mb-1">{c.label}</p>
              <p className="text-2xl font-bold text-concrete-900">{c.value}</p>
              <p className="text-xs text-concrete-400 mt-1">{c.sub}</p>
            </div>
            <div className={`p-2.5 rounded-lg ${c.color}`}>
              <c.icon className="w-5 h-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
