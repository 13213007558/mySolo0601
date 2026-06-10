import { Filter, X, Search } from 'lucide-react'
import { usePourStore, calculateStats } from '@/store/usePourStore'
import { RECORD_STATUS_LABELS, RECORD_STATUS_COLORS } from '@/types'
import type { RecordStatus } from '@/types'

export default function FilterBar() {
  const filter = usePourStore((s) => s.filter)
  const setFilter = usePourStore((s) => s.setFilter)
  const resetFilter = usePourStore((s) => s.resetFilter)
  const records = usePourStore((s) => s.records)
  const stats = calculateStats(records)

  const hasActiveFilters =
    filter.position.length > 0 ||
    filter.grade.length > 0 ||
    filter.status.length > 0 ||
    filter.truckNo !== '' ||
    filter.onlyAbnormal ||
    filter.onlyMissingPhoto ||
    filter.dateFrom ||
    filter.dateTo

  function togglePosition(pos: string) {
    const newArr = filter.position.includes(pos)
      ? filter.position.filter((p) => p !== pos)
      : [...filter.position, pos]
    setFilter({ position: newArr })
  }

  function toggleGrade(g: string) {
    const newArr = filter.grade.includes(g)
      ? filter.grade.filter((x) => x !== g)
      : [...filter.grade, g]
    setFilter({ grade: newArr })
  }

  function toggleStatus(st: RecordStatus) {
    const newArr = filter.status.includes(st)
      ? filter.status.filter((s) => s !== st)
      : [...filter.status, st]
    setFilter({ status: newArr })
  }

  const statusOptions: RecordStatus[] = ['normal', 'warning', 'abnormal', 'missing_photo']

  return (
    <div className="bg-white rounded-xl border border-concrete-200 shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-concrete-900">筛选条件</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilter}
            className="text-xs text-accent hover:text-accent-dark flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            重置
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-concrete-400 absolute ml-3" />
        <input
          type="text"
          value={filter.truckNo}
          onChange={(e) => setFilter({ truckNo: e.target.value })}
          placeholder="搜索车号..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-concrete-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-concrete-600 mb-2 block">部位</label>
        <div className="flex flex-wrap gap-2">
          {stats.positions.map((p) => (
            <button
              key={p}
              onClick={() => togglePosition(p)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                filter.position.includes(p)
                  ? 'bg-concrete-700 text-white'
                  : 'bg-concrete-100 text-concrete-600 hover:bg-concrete-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-concrete-600 mb-2 block">标号</label>
        <div className="flex flex-wrap gap-2">
          {stats.grades.map((g) => (
            <button
              key={g}
              onClick={() => toggleGrade(g)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                filter.grade.includes(g)
                  ? 'bg-sky-600 text-white'
                  : 'bg-concrete-100 text-concrete-600 hover:bg-concrete-200'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-concrete-600 mb-2 block">状态</label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((st) => (
            <button
              key={st}
              onClick={() => toggleStatus(st)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                filter.status.includes(st)
                  ? 'text-white'
                  : 'bg-concrete-100 text-concrete-600 hover:bg-concrete-200'
              }`}
              style={{
                backgroundColor: filter.status.includes(st) ? RECORD_STATUS_COLORS[st] : undefined
              }}
            >
              {RECORD_STATUS_LABELS[st]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filter.onlyAbnormal}
            onChange={(e) => setFilter({ onlyAbnormal: e.target.checked })}
            className="w-4 h-4 text-accent rounded focus:ring-accent"
          />
          <span className="text-sm text-concrete-700">仅看异常</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filter.onlyMissingPhoto}
            onChange={(e) => setFilter({ onlyMissingPhoto: e.target.checked })}
            className="w-4 h-4 text-accent rounded focus:ring-accent"
          />
          <span className="text-sm text-concrete-700">仅看缺照片</span>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-concrete-600">日期</label>
        <input
          type="date"
          value={filter.dateFrom || ''}
          onChange={(e) => setFilter({ dateFrom: e.target.value || null })}
          className="flex-1 px-2 py-1.5 text-xs border border-concrete-200 rounded focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <span className="text-concrete-400 text-xs">至</span>
        <input
          type="date"
          value={filter.dateTo || ''}
          onChange={(e) => setFilter({ dateTo: e.target.value || null })}
          className="flex-1 px-2 py-1.5 text-xs border border-concrete-200 rounded focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
    </div>
  )
}
