import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UsersRound, AlertTriangle, Sparkles } from 'lucide-react'
import { api } from '../lib/api'
import { useAppStore } from '../store/app'
import { StatusBadge } from '../components/Badges'
import type { Baby, ClassSummary, BorrowReturnRecord } from '../../shared/types'

export default function Classes() {
  const navigate = useNavigate()
  const summaries = useAppStore((s) => s.classSummaries)
  const setClassSummaries = useAppStore((s) => s.setClassSummaries)
  const setBabies = useAppStore((s) => s.setBabies)
  const setRecords = useAppStore((s) => s.setRecords)
  const [active, setActive] = useState<string | null>(null)
  const [detail, setDetail] = useState<{ className: string; babies: Baby[]; records: BorrowReturnRecord[] } | null>(null)

  useEffect(() => {
    api.listClasses().then(setClassSummaries)
  }, [setClassSummaries])

  const sortedSummaries = useMemo(
    () => [...summaries].sort((a, b) => a.className.localeCompare(b.className, 'zh')),
    [summaries],
  )

  const openClass = async (name: string) => {
    setActive(name)
    const d = await api.getClassDetail(name)
    setDetail(d)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">班级页</h1>
          <p className="muted mt-1">异常处理后，班级汇总与宝宝列表会同步更新</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {sortedSummaries.map((c) => (
          <ClassCard
            key={c.className}
            summary={c}
            active={active === c.className}
            onClick={() => openClass(c.className)}
          />
        ))}
      </div>

      {detail && (
        <div className="card p-5 animate-floatUp">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title">{detail.className} · 详情</div>
            <button
              onClick={() => {
                setActive(null)
                setDetail(null)
              }}
              className="text-xs text-ink-500 hover:text-ink-900"
            >
              收起
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <div>
              <div className="text-xs font-medium text-ink-500 mb-3 flex items-center gap-2">
                <UsersRound size={14} /> 班级宝宝 ({detail.babies.length})
              </div>
              <div className="space-y-1.5">
                {detail.babies.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => navigate(`/baby/${b.id}`)}
                    className="w-full text-left flex items-center justify-between rounded-xl border border-ink-100 hover:border-brand-300 hover:bg-brand-50/40 px-3.5 py-2.5 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium text-ink-900">{b.name}</div>
                      <div className="text-xs text-ink-500">
                        家长 {b.parentName} · {b.parentPhone}
                      </div>
                    </div>
                    <div className="text-xs text-ink-500">{b.ageMonths}月 →</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-ink-500 mb-3 flex items-center gap-2">
                <Sparkles size={14} /> 今日借还记录 ({detail.records.length})
              </div>
              <div className="space-y-1.5 max-h-[420px] overflow-auto pr-1">
                {detail.records.map((r) => (
                  <div
                    key={r.id}
                    className={`rounded-xl border px-3.5 py-2.5 ${
                      r.hasException && !r.exceptionResolved
                        ? 'border-rose-200 bg-rose-50/50'
                        : 'border-ink-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-ink-900">{r.itemName}</span>
                      <span className={`chip ${
                        r.action === 'borrow' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-warm-50 text-warm-700 border-warm-200'
                      }`}>
                        {r.action === 'borrow' ? '借出' : '归还'}
                      </span>
                      {r.hasException && !r.exceptionResolved && (
                        <span className="chip bg-rose-50 text-rose-700 border-rose-200">
                          <AlertTriangle size={11} /> {r.exceptionType}
                        </span>
                      )}
                      {r.hasException && r.exceptionResolved && (
                        <span className="chip bg-emerald-50 text-emerald-700 border-emerald-200">
                          已解决 · {r.resolvedByName}
                        </span>
                      )}
                      <span className="chip bg-ink-50 text-ink-700 border-ink-200">处理人：{r.processorName}</span>
                    </div>
                    <div className="text-xs text-ink-500 mt-1">
                      {r.babyName} · {r.source === 'manual' ? '手工补录' : '扫码'} · {new Date(r.handledAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ClassCard({
  summary,
  active,
  onClick,
}: {
  summary: ClassSummary
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`card p-5 text-left hover:shadow-glow transition-all ${
        active ? 'ring-2 ring-brand-500 border-brand-300' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold text-ink-900">{summary.className}</div>
        <div className="flex items-center gap-1 text-xs text-ink-500">
          <UsersRound size={14} /> {summary.babyCount} 个宝宝
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <MiniStat label="使用中" value={summary.itemsInUse} tone="sky" />
        <MiniStat label="已消毒" value={summary.itemsClean} tone="emerald" />
        <MiniStat label="待清洗" value={summary.itemsDirty} tone="amber" />
        <MiniStat label="异常" value={summary.itemsException} tone="rose" />
      </div>
    </button>
  )
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone: 'sky' | 'emerald' | 'amber' | 'rose' }) {
  const map: Record<string, string> = {
    sky: 'bg-sky-50 text-sky-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  }
  return (
    <div className={`rounded-xl py-2 ${map[tone]}`}>
      <div className="text-lg font-semibold leading-none">{value}</div>
      <div className="text-[11px] mt-1 opacity-80">{label}</div>
    </div>
  )
}
