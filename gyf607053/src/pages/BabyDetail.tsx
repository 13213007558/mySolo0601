import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  AlertTriangle,
  Check,
  Phone,
  User,
  Calendar,
} from 'lucide-react'
import { api, formatDateTime } from '../lib/api'
import { useAppStore } from '../store/app'
import { ActionBadge, SourceBadge, StatusBadge } from '../components/Badges'
import type { Baby, BorrowReturnRecord } from '../../shared/types'

export default function BabyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const setRecords = useAppStore((s) => s.setRecords)
  const [data, setData] = useState<{ baby: Baby; records: BorrowReturnRecord[] } | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!id) return
    setLoading(true)
    const d = await api.getBabyDetail(id)
    setData(d)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [id])

  const handleResolve = async (recordId: string) => {
    if (!currentUser) return
    const r = await api.resolveException(recordId, '店长复查后确认处理')
    if (r) {
      const list = await api.listRecords()
      setRecords(list)
      load()
    }
  }

  if (loading || !data) {
    return <div className="muted">加载中...</div>
  }

  const { baby, records } = data

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="text-sm text-ink-500 hover:text-brand-700 flex items-center gap-1">
        <ArrowLeft size={14} /> 返回
      </button>

      <div className="card p-6 flex items-start gap-5 flex-wrap">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-2xl font-semibold shadow-soft">
          {baby.name.slice(0, 1)}
        </div>
        <div className="flex-1 min-w-[240px]">
          <h1 className="page-title">{baby.name}</h1>
          <div className="mt-2 grid sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-ink-700">
              <User size={14} className="text-ink-500" /> {baby.className}
            </div>
            <div className="flex items-center gap-2 text-ink-700">
              <Calendar size={14} className="text-ink-500" /> {baby.ageMonths} 月龄
            </div>
            <div className="flex items-center gap-2 text-ink-700">
              <Phone size={14} className="text-ink-500" /> {baby.parentName} {baby.parentPhone}
            </div>
          </div>
          <div className="mt-3 text-xs text-ink-500">
            注：手机号已按您的角色 <span className="font-medium text-ink-700">{currentUser?.role}</span> 进行脱敏显示；导出时同样按此规则脱敏并留存审计。
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="section-title">借还与异常记录</div>
          <div className="text-xs text-ink-500">共 {records.length} 条</div>
        </div>

        {records.length === 0 ? (
          <div className="py-10 text-center muted">暂无记录</div>
        ) : (
          <div className="divide-y divide-ink-100 -mx-2">
            {records.map((r) => (
              <div key={r.id} className="px-2 py-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-ink-900">{r.itemName}</span>
                      <span className="text-xs text-ink-500">#{r.itemCode}</span>
                      <ActionBadge action={r.action} />
                      <SourceBadge source={r.source} />
                      {r.hasException ? (
                        r.exceptionResolved ? (
                          <span className="chip bg-emerald-50 text-emerald-700 border-emerald-200">
                            已解决 · {r.resolvedByName}
                          </span>
                        ) : (
                          <span className="chip bg-rose-50 text-rose-700 border-rose-200">
                            <AlertTriangle size={11} /> 异常 · {r.exceptionType}
                          </span>
                        )
                      ) : null}
                    </div>
                    <div className="mt-1.5 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-ink-500">
                      <div>处理时间：{formatDateTime(r.handledAt)}</div>
                      <div>处理人：<span className="font-medium text-ink-700">{r.processorName}</span>（{r.processorRole}）</div>
                      <div>物品状态：<StatusBadge status={r.action === 'borrow' ? 'in_use' : r.hasException ? 'exception' : 'dirty'} /></div>
                      <div>班级：{r.className}</div>
                    </div>
                    {r.hasException && (
                      <div className="mt-2 text-xs text-rose-700 bg-rose-50/60 rounded-lg px-3 py-2 inline-block">
                        <span className="font-medium">异常说明：</span>{r.exceptionNote}
                        {r.resolvedNote && (
                          <span className="ml-2 text-emerald-700">
                            <span className="font-medium">处理说明：</span>{r.resolvedNote}（{formatDateTime(r.resolvedAt!)}）
                          </span>
                        )}
                      </div>
                    )}
                    {r.remark && (
                      <div className="mt-1.5 text-xs text-ink-500">备注：{r.remark}</div>
                    )}
                  </div>
                  {r.hasException && !r.exceptionResolved && (currentUser?.role === 'manager' || currentUser?.role === 'supervisor') && (
                    <button onClick={() => handleResolve(r.id)} className="btn-primary !py-1.5 !px-3 text-xs">
                      <Check size={14} /> 标记已处理
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
