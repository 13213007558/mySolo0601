import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, User, Tag, Percent, Target } from 'lucide-react'
import { useTruffleStore } from '@/store'
import { getStatusLabel, formatDate } from '@/utils'
import { farmers } from '@/data/mock'

export default function DogDetail() {
  const { dogId } = useParams<{ dogId: string }>()
  const getDogById = useTruffleStore((s) => s.getDogById)
  const getHotspotsByDog = useTruffleStore((s) => s.getHotspotsByDog)
  const getDailyLimit = useTruffleStore((s) => s.getDailyLimit)
  const getTodayConfirmedCount = useTruffleStore((s) => s.getTodayConfirmedCount)

  const dog = dogId ? getDogById(dogId) : undefined
  if (!dog) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-bark-400">未找到犬只信息</p>
      </div>
    )
  }

  const farmer = farmers.find((f) => f.id === dog.farmerId)
  const allHotspots = getHotspotsByDog(dog.id)
  const today = new Date().toISOString().split('T')[0]
  const todayHotspots = getHotspotsByDog(dog.id, today)
  const confirmed = getTodayConfirmedCount(dog.id)
  const limit = getDailyLimit(dog.id)
  const ratioPct = Math.round(dog.shareRatio * 100)

  const dateGroups = new Map<string, { total: number; confirmed: number; rejected: number; overLimit: number }>()
  for (const h of allHotspots) {
    const d = new Date(h.detectedAt).toISOString().split('T')[0]
    const g = dateGroups.get(d) ?? { total: 0, confirmed: 0, rejected: 0, overLimit: 0 }
    g.total++
    if (h.status === 'confirmed') g.confirmed++
    if (h.status === 'expired' || h.status === 'mismatch') g.rejected++
    if (h.status === 'over_limit') g.overLimit++
    dateGroups.set(d, g)
  }
  const historyRows = Array.from(dateGroups.entries()).sort((a, b) => b[0].localeCompare(a[0]))

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      confirmed: 'bg-green-100 text-green-700',
      expired: 'bg-red-100 text-red-700',
      mismatch: 'bg-red-100 text-red-700',
      over_limit: 'bg-gray-100 text-gray-600',
    }
    return (
      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
        {getStatusLabel(status)}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <Link to="/dogs" className="mb-4 inline-flex items-center gap-1 text-sm text-bark-500 hover:text-forest-800">
        <ArrowLeft size={16} />
        返回犬只列表
      </Link>

      <div className="mb-6 flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white"
          style={{ backgroundColor: dog.avatarColor }}
        >
          {dog.name[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-forest-800">{dog.name}</h1>
          <p className="text-sm text-bark-400">{dog.breed}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="mb-1 flex items-center gap-1 text-xs text-bark-400">
            <Tag size={12} /> 项圈ID
          </div>
          <p className="font-medium text-bark-700">{dog.collarId}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="mb-1 flex items-center gap-1 text-xs text-bark-400">
            <User size={12} /> 寻松人
          </div>
          <p className="font-medium text-bark-700">{farmer?.name ?? '—'}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="mb-1 flex items-center gap-1 text-xs text-bark-400">
            <Percent size={12} /> 分成比例
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-500">{ratioPct}%</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-amber-500" style={{ width: `${ratioPct}%` }} />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="mb-1 flex items-center gap-1 text-xs text-bark-400">
            <Target size={12} /> 今日热点
          </div>
          <p className="font-medium text-bark-700">
            <span className="text-amber-500">{confirmed}</span> / {limit}
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-forest-800">热点历史</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-bark-400">
                <th className="pb-2 text-left font-medium">日期</th>
                <th className="pb-2 text-center font-medium">总数</th>
                <th className="pb-2 text-center font-medium">已确认</th>
                <th className="pb-2 text-center font-medium">已驳回</th>
                <th className="pb-2 text-center font-medium">超上限</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.map(([date, g]) => (
                <tr key={date} className="border-b border-gray-50">
                  <td className="py-2 text-bark-700">{date}</td>
                  <td className="py-2 text-center">{g.total}</td>
                  <td className="py-2 text-center text-green-700">{g.confirmed}</td>
                  <td className="py-2 text-center text-red-600">{g.rejected}</td>
                  <td className="py-2 text-center text-gray-500">{g.overLimit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-forest-800">今日热点</h2>
        <div className="space-y-2">
          {todayHotspots.length === 0 && <p className="text-sm text-bark-400">今日暂无热点记录</p>}
          {todayHotspots.map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-xs text-bark-600">{formatDate(h.detectedAt)}</span>
              {statusBadge(h.status)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
