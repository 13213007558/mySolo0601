import { useEffect, useMemo } from 'react'
import { Droplets, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react'
import { api, formatDateTime } from '../lib/api'
import { useAppStore } from '../store/app'
import { StatusBadge } from '../components/Badges'
import type { SupplyItem } from '../../shared/types'

export default function Kitchen() {
  const items = useAppStore((s) => s.items)
  const records = useAppStore((s) => s.records)
  const unresolved = useAppStore((s) => s.unresolvedExceptions)
  const setItems = useAppStore((s) => s.setItems)
  const setRecords = useAppStore((s) => s.setRecords)

  useEffect(() => {
    Promise.all([api.listItems(), api.listRecords()]).then(([i, r]) => {
      setItems(i)
      setRecords(r)
    })
  }, [setItems, setRecords])

  const dirtyItems = useMemo(() => items.filter((i) => i.status === 'dirty'), [items])
  const exceptionItems = useMemo(() => items.filter((i) => i.status === 'exception'), [items])
  const quarantineItems = useMemo(() => items.filter((i) => i.status === 'quarantine'), [items])

  const markClean = async (id: string) => {
    await api.markItemClean(id)
    const list = await api.listItems()
    setItems(list)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">厨房 / 后场</h1>
        <p className="muted mt-1">实时看到现场服务员操作后的物品状态，安排清洗与消毒</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <StatCard label="待清洗" value={dirtyItems.length} color="bg-amber-500" icon={<Droplets size={20} />} />
        <StatCard label="异常待处理" value={exceptionItems.length} color="bg-rose-500" icon={<AlertTriangle size={20} />} />
        <StatCard label="隔离中" value={quarantineItems.length} color="bg-violet-500" icon={<ShieldAlert size={20} />} />
        <StatCard label="今日异常记录" value={unresolved.length} color="bg-sky-500" icon={<CheckCircle size={20} />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Section title="待清洗" items={dirtyItems} onClean={markClean} />
        <Section title="异常 / 隔离" items={[...exceptionItems, ...quarantineItems]} onClean={markClean} showException extra={
          unresolved.length > 0 ? (
            <div className="mt-3 card p-4 border-rose-200 bg-rose-50/50">
              <div className="text-sm font-medium text-rose-800 mb-2 flex items-center gap-2">
                <AlertTriangle size={16} /> 未解决异常 ({unresolved.length})
              </div>
              <ul className="space-y-1.5 text-xs text-rose-700">
                {unresolved.map((r) => (
                  <li key={r.id} className="flex justify-between">
                    <span>
                      {r.itemName} · {r.babyName} · {r.exceptionType}
                    </span>
                    <span className="text-rose-500">{formatDateTime(r.handledAt)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null
        } />
      </div>
    </div>
  )
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl ${color} text-white flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <div className="text-sm text-ink-500">{label}</div>
        <div className="text-2xl font-semibold text-ink-900">{value}</div>
      </div>
    </div>
  )
}

function Section({
  title,
  items,
  onClean,
  extra,
  showException,
}: {
  title: string
  items: SupplyItem[]
  onClean: (id: string) => void
  extra?: React.ReactNode
  showException?: boolean
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="section-title">{title}</div>
        <div className="text-xs text-ink-500">{items.length} 件</div>
      </div>
      {items.length === 0 ? (
        <div className="py-10 text-center muted">暂无物品，等待现场归还...</div>
      ) : (
        <div className="space-y-2">
          {items.map((i) => {
            return (
              <div key={i.id} className="flex items-center justify-between rounded-xl border border-ink-100 px-3.5 py-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-ink-900">{i.name}</span>
                    <span className="text-xs text-ink-500">#{i.code}</span>
                    <StatusBadge status={i.status} />
                  </div>
                  <div className="text-xs text-ink-500 mt-0.5">{i.category}</div>
                </div>
                {showException ? (
                  <span className="text-xs text-rose-600 bg-rose-50 rounded-lg px-2 py-1">需先在现场页处理异常</span>
                ) : (
                  <button onClick={() => onClean(i.id)} className="btn-primary !py-1.5 !px-3 text-xs">
                    标记已消毒
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
      {extra}
    </div>
  )
}
