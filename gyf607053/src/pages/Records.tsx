import { useEffect, useMemo, useState } from 'react'
import {
  ClipboardList,
  Filter,
  AlertTriangle,
  Search,
  Download,
  HandCoins,
  RotateCcw,
} from 'lucide-react'
import { api, formatDateTime } from '../lib/api'
import { useAppStore } from '../store/app'
import { ActionBadge, SourceBadge, StatusBadge } from '../components/Badges'
import type { BorrowReturnRecord } from '../../shared/types'

export default function Records() {
  const records = useAppStore((s) => s.records)
  const setRecords = useAppStore((s) => s.setRecords)
  const [filter, setFilter] = useState<'all' | 'borrow' | 'return' | 'exception'>('all')
  const [source, setSource] = useState<'all' | 'scan' | 'manual'>('all')
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    api.listRecords().then(setRecords)
  }, [setRecords])

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filter === 'borrow' && r.action !== 'borrow') return false
      if (filter === 'return' && r.action !== 'return') return false
      if (filter === 'exception' && !r.hasException) return false
      if (source === 'scan' && r.source !== 'scan') return false
      if (source === 'manual' && r.source !== 'manual') return false
      if (keyword) {
        const k = keyword.toLowerCase()
        return (
          r.babyName.toLowerCase().includes(k) ||
          r.itemName.toLowerCase().includes(k) ||
          r.itemCode.toLowerCase().includes(k) ||
          r.className.toLowerCase().includes(k) ||
          r.processorName.toLowerCase().includes(k)
        )
      }
      return true
    })
  }, [records, filter, source, keyword])

  const manualCount = records.filter((r) => r.source === 'manual').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">借还扫码记录</h1>
          <p className="muted mt-1">
            每条记录都显示 <span className="font-medium text-ink-700">处理人</span>，
            包括手工补录（当前样例中 {manualCount} 条）
          </p>
        </div>
        <button onClick={() => api.exportRecords()} className="btn-secondary">
          <Download size={16} /> 导出清单
        </button>
      </div>

      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            className="input !pl-8 !py-2 text-xs w-56"
            placeholder="搜索宝宝/物品/处理人/班级"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-500">
          <Filter size={14} /> 操作：
        </div>
        <div className="flex gap-1">
          {([
            ['all', '全部'],
            ['borrow', '借出'],
            ['return', '归还'],
            ['exception', '异常'],
          ] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                filter === k
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-ink-700 border-ink-200 hover:bg-ink-50'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-500 ml-2">来源：</div>
        <div className="flex gap-1">
          {([
            ['all', '全部'],
            ['scan', '扫码'],
            ['manual', '手工补录'],
          ] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setSource(k)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                source === k
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-ink-700 border-ink-200 hover:bg-ink-50'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-ink-500 flex items-center gap-1">
          <ClipboardList size={14} /> 共 {filtered.length} 条
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-50 text-xs text-ink-500">
                <th className="text-left px-5 py-3 font-medium">时间</th>
                <th className="text-left px-5 py-3 font-medium">物品</th>
                <th className="text-left px-5 py-3 font-medium">宝宝 / 班级</th>
                <th className="text-left px-5 py-3 font-medium">操作</th>
                <th className="text-left px-5 py-3 font-medium">来源</th>
                <th className="text-left px-5 py-3 font-medium">处理人</th>
                <th className="text-left px-5 py-3 font-medium">异常</th>
                <th className="text-left px-5 py-3 font-medium">解决</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map((r) => (
                <RecordRow key={r.id} r={r} />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-ink-500 py-10">
                    暂无匹配的记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function RecordRow({ r }: { r: BorrowReturnRecord }) {
  return (
    <tr className="hover:bg-ink-50/60 transition-colors">
      <td className="px-5 py-3 text-xs text-ink-500 whitespace-nowrap">{formatDateTime(r.handledAt)}</td>
      <td className="px-5 py-3">
        <div className="font-medium text-ink-900">{r.itemName}</div>
        <div className="text-xs text-ink-500">#{r.itemCode}</div>
      </td>
      <td className="px-5 py-3">
        <div className="text-ink-900">{r.babyName}</div>
        <div className="text-xs text-ink-500">{r.className}</div>
      </td>
      <td className="px-5 py-3">
        <ActionBadge action={r.action} />
      </td>
      <td className="px-5 py-3">
        <SourceBadge source={r.source} />
      </td>
      <td className="px-5 py-3">
        <div className="text-sm text-ink-900">
          <HandCoins size={13} className="inline mr-1 text-brand-600" />
          {r.processorName}
        </div>
        <div className="text-xs text-ink-500">{r.processorRole}</div>
      </td>
      <td className="px-5 py-3">
        {r.hasException ? (
          <div className="flex items-center gap-1 text-rose-700 text-sm">
            <AlertTriangle size={13} /> {r.exceptionType}
          </div>
        ) : (
          <span className="text-ink-500 text-xs">无</span>
        )}
      </td>
      <td className="px-5 py-3">
        {r.exceptionResolved ? (
          <div>
            <div className="text-xs text-emerald-700 font-medium">已解决</div>
            <div className="text-[11px] text-ink-500">{r.resolvedByName} · {formatDateTime(r.resolvedAt!)}</div>
          </div>
        ) : r.hasException ? (
          <span className="text-rose-600 text-xs">待处理</span>
        ) : (
          <span className="text-ink-500 text-xs">—</span>
        )}
      </td>
    </tr>
  )
}
