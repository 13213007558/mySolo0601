import { useNavigate } from 'react-router-dom'
import { Dog } from 'lucide-react'
import { useTruffleStore } from '@/store'
import { farmers } from '@/data/mock'

export default function DogList() {
  const navigate = useNavigate()
  const dogs = useTruffleStore((s) => s.dogs)
  const getTodayConfirmedCount = useTruffleStore((s) => s.getTodayConfirmedCount)
  const getDailyLimit = useTruffleStore((s) => s.getDailyLimit)

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest-800 text-white">
          <Dog size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-forest-800">犬只档案</h1>
          <p className="text-sm text-bark-500">共 {dogs.length} 只犬只</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {dogs.map((dog) => {
          const farmer = farmers.find((f) => f.id === dog.farmerId)
          const confirmed = getTodayConfirmedCount(dog.id)
          const limit = getDailyLimit(dog.id)
          const ratioPct = Math.round(dog.shareRatio * 100)

          return (
            <div
              key={dog.id}
              onClick={() => navigate(`/dogs/${dog.id}`)}
              className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: dog.avatarColor }}
                >
                  {dog.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-forest-800">{dog.name}</h3>
                  <p className="truncate text-xs text-bark-400">{dog.breed}</p>
                </div>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span className="text-bark-400">项圈ID</span>
                <span className="text-right font-medium text-bark-700">{dog.collarId}</span>
                <span className="text-bark-400">寻松人</span>
                <span className="text-right font-medium text-bark-700">{farmer?.name ?? '—'}</span>
              </div>

              <div className="mb-2">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-bark-400">分成比例</span>
                  <span className="font-medium text-amber-500">{ratioPct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{ width: `${ratioPct}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-bark-400">
                  日上限 <span className="font-medium text-bark-700">{limit}</span>
                </span>
                <span className="font-medium text-forest-800">
                  今日已确认 <span className="text-amber-500">{confirmed}</span>
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
