import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  AlertTriangle,
  Check,
  Sparkles,
  HandCoins,
  RotateCcw,
  Baby as BabyIcon,
  Search,
} from 'lucide-react'
import { api, formatDateTime } from '../lib/api'
import { useAppStore } from '../store/app'
import { StatusBadge, ActionBadge, SourceBadge } from '../components/Badges'
import type {
  BorrowReturnAction,
  BorrowReturnRecord,
  SupplyItem,
  Baby,
} from '../../shared/types'

export default function Onsite() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const items = useAppStore((s) => s.items)
  const babies = useAppStore((s) => s.babies)
  const records = useAppStore((s) => s.records)
  const unresolved = useAppStore((s) => s.unresolvedExceptions)
  const setItems = useAppStore((s) => s.setItems)
  const setBabies = useAppStore((s) => s.setBabies)
  const setRecords = useAppStore((s) => s.setRecords)

  const [showCreate, setShowCreate] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.listItems(), api.listBabies(), api.listRecords()]).then(
      ([i, b, r]) => {
        setItems(i)
        setBabies(b)
        setRecords(r)
      },
    )
  }, [setItems, setBabies, setRecords])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  const recentRecords = useMemo(
    () => records.slice(0, 8),
    [records],
  )

  const filteredBabies = useMemo(() => {
    const k = keyword.trim().toLowerCase()
    if (!k) return babies
    return babies.filter(
      (b) =>
        b.name.toLowerCase().includes(k) ||
        b.className.toLowerCase().includes(k) ||
        b.parentName.toLowerCase().includes(k),
    )
  }, [babies, keyword])

  const handleResolve = async (recordId: string) => {
    if (!currentUser) return
    const r = await api.resolveException(recordId, '现场已处理，已隔离物品')
    if (r) {
      const list = await api.listRecords()
      setRecords(list)
      showToast('异常已处理，班级页、宝宝详情、后台、导出已同步更新')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">餐厅现场版</h1>
          <p className="muted mt-1">扫码/手工补录借还，处理异常，状态实时同步至厨房和后场</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary"
          >
            <Sparkles size={16} /> 扫码/手工借还
          </button>
          <button
            onClick={() => navigate('/classes')}
            className="btn-secondary"
          >
            <BabyIcon size={16} /> 查看班级
          </button>
        </div>
      </div>

      {unresolved.length > 0 && (
        <div className="card p-5 border-rose-200 bg-rose-50/40">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-rose-600" />
            <div className="section-title text-rose-800">待处理异常 ({unresolved.length})</div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {unresolved.map((r) => (
              <div key={r.id} className="bg-white rounded-xl p-4 border border-rose-100">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink-900">{r.itemName}</span>
                      <ActionBadge action={r.action} />
                      <SourceBadge source={r.source} />
                    </div>
                    <div className="muted mt-1 text-xs">
                      {r.babyName} · {r.className} · {formatDateTime(r.handledAt)}
                    </div>
                    <div className="mt-2 text-sm text-rose-700">
                      <span className="font-medium">{r.exceptionType}</span>
                      {r.exceptionNote && `：${r.exceptionNote}`}
                    </div>
                    <div className="mt-1 text-xs text-ink-500">
                      处理人：{r.processorName}
                    </div>
                  </div>
                  <button
                    onClick={() => handleResolve(r.id)}
                    className="btn-primary !py-2 !px-3 text-xs"
                  >
                    <Check size={14} /> 标记已处理
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-5">
        <SummaryCard
          label="今日借还记录"
          value={records.length}
          accent="from-brand-500 to-brand-700"
          icon={<HandCoins size={20} />}
        />
        <SummaryCard
          label="使用中物品"
          value={items.filter((i) => i.status === 'in_use').length}
          accent="from-sky-500 to-sky-700"
          icon={<RotateCcw size={20} />}
        />
        <SummaryCard
          label="待处理异常"
          value={unresolved.length}
          accent="from-rose-500 to-rose-700"
          icon={<AlertTriangle size={20} />}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title">最近借还</div>
            <button
              onClick={() => navigate('/records')}
              className="text-xs text-brand-700 hover:underline"
            >
              查看全部 →
            </button>
          </div>
          <div className="divide-y divide-ink-100 -mx-2">
            {recentRecords.length === 0 ? (
              <div className="py-8 text-center muted">暂无记录，点击右上角开始操作</div>
            ) : (
              recentRecords.map((r) => (
                <RecordRow
                  key={r.id}
                  record={r}
                  onResolve={handleResolve}
                  onOpenBaby={() => navigate(`/baby/${r.babyId}`)}
                />
              ))
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title">宝宝名单</div>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="input !pl-8 !py-1.5 text-xs w-40"
                placeholder="搜索姓名/班级"
              />
            </div>
          </div>
          <div className="space-y-1.5 max-h-[420px] overflow-auto pr-1">
            {filteredBabies.map((b) => (
              <button
                key={b.id}
                onClick={() => navigate(`/baby/${b.id}`)}
                className="w-full text-left flex items-center justify-between rounded-lg px-2.5 py-2 hover:bg-brand-50 transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-ink-900">{b.name}</div>
                  <div className="text-xs text-ink-500">
                    {b.className} · 家长 {b.parentName} {b.parentPhone}
                  </div>
                </div>
                <div className="text-xs text-ink-500">{b.ageMonths}月</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {showCreate && (
        <CreateRecordModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            Promise.all([api.listItems(), api.listRecords()]).then(([i, r]) => {
              setItems(i)
              setRecords(r)
            })
            showToast('记录已创建，厨房/后场状态已实时更新')
            setShowCreate(false)
          }}
          babies={babies}
          items={items}
        />
      )}

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 card px-5 py-3 border-brand-200 bg-brand-50 text-brand-900 shadow-lg animate-floatUp">
          {toast}
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: number
  icon: React.ReactNode
  accent: string
}) {
  return (
    <div className="card p-5 overflow-hidden relative">
      <div className={`absolute -right-8 -top-8 w-28 h-28 rounded-full bg-gradient-to-br ${accent} opacity-10`} />
      <div className="relative">
        <div className="flex items-center gap-2 text-ink-500 text-sm mb-2">
          {icon}
          {label}
        </div>
        <div className="text-3xl font-semibold text-ink-900 tracking-tight">{value}</div>
      </div>
    </div>
  )
}

function RecordRow({
  record,
  onResolve,
  onOpenBaby,
}: {
  record: BorrowReturnRecord
  onResolve: (id: string) => void
  onOpenBaby: () => void
}) {
  return (
    <div className="flex items-center gap-3 px-2 py-3 hover:bg-ink-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-ink-900">{record.itemName}</span>
          <span className="text-xs text-ink-500">#{record.itemCode}</span>
          <ActionBadge action={record.action} />
          <SourceBadge source={record.source} />
          {record.hasException && (
            <span
              className={`chip ${
                record.exceptionResolved
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {record.exceptionResolved ? `已解决·${record.resolvedByName}` : `异常·${record.exceptionType}`}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-ink-500 flex-wrap">
          <button onClick={onOpenBaby} className="hover:text-brand-700 hover:underline">
            {record.babyName}
          </button>
          <span>·</span>
          <span>{record.className}</span>
          <span>·</span>
          <span>{formatDateTime(record.handledAt)}</span>
          <span>·</span>
          <span className="font-medium text-ink-700">处理人：{record.processorName}</span>
        </div>
      </div>
      {record.hasException && !record.exceptionResolved && (
        <button
          onClick={() => onResolve(record.id)}
          className="btn-primary !py-1.5 !px-3 text-xs"
        >
          处理
        </button>
      )}
    </div>
  )
}

function CreateRecordModal({
  onClose,
  onCreated,
  babies,
  items,
}: {
  onClose: () => void
  onCreated: () => void
  babies: Baby[]
  items: SupplyItem[]
}) {
  const [action, setAction] = useState<BorrowReturnAction>('borrow')
  const [source, setSource] = useState<'scan' | 'manual'>('scan')
  const [itemId, setItemId] = useState('')
  const [babyId, setBabyId] = useState('')
  const [hasException, setHasException] = useState(false)
  const [exceptionType, setExceptionType] = useState('损坏')
  const [exceptionNote, setExceptionNote] = useState('')
  const [remark, setRemark] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!itemId || !babyId) return
    setSubmitting(true)
    await api.createRecord({
      itemId,
      babyId,
      action,
      source,
      hasException,
      exceptionType: hasException ? exceptionType : undefined,
      exceptionNote: hasException ? exceptionNote : undefined,
      remark: remark || undefined,
    })
    setSubmitting(false)
    onCreated()
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-floatUp">
      <div className="card p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-5">
          <div className="section-title text-lg">新增借还记录</div>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900 text-xl">
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="label">操作类型</label>
            <div className="grid grid-cols-2 gap-2">
              {(['borrow', 'return'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setAction(a)}
                  className={`rounded-xl py-2 text-sm border transition-colors ${
                    action === a
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-ink-700 border-ink-200 hover:bg-ink-50'
                  }`}
                >
                  {a === 'borrow' ? '借出' : '归还'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">录入方式</label>
            <div className="grid grid-cols-2 gap-2">
              {(['scan', 'manual'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setSource(a)}
                  className={`rounded-xl py-2 text-sm border transition-colors ${
                    source === a
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-ink-700 border-ink-200 hover:bg-ink-50'
                  }`}
                >
                  {a === 'scan' ? '扫码' : '手工补录'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="label">物品</label>
          <select className="input" value={itemId} onChange={(e) => setItemId(e.target.value)}>
            <option value="">请选择物品</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.code} · {i.name} · [{i.status}]
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="label">宝宝</label>
          <select className="input" value={babyId} onChange={(e) => setBabyId(e.target.value)}>
            <option value="">请选择宝宝</option>
            {babies.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} · {b.className}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hasException}
            onChange={(e) => setHasException(e.target.checked)}
            className="w-4 h-4 rounded border-ink-200"
          />
          <span className="text-sm text-ink-700">该次借还有异常</span>
        </label>

        {hasException && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="label">异常类型</label>
              <select
                className="input"
                value={exceptionType}
                onChange={(e) => setExceptionType(e.target.value)}
              >
                <option>损坏</option>
                <option>丢失</option>
                <option>污渍</option>
                <option>过期</option>
                <option>其他</option>
              </select>
            </div>
            <div>
              <label className="label">异常说明</label>
              <input
                className="input"
                value={exceptionNote}
                onChange={(e) => setExceptionNote(e.target.value)}
                placeholder="简单描述"
              />
            </div>
          </div>
        )}

        <div className="mb-5">
          <label className="label">备注</label>
          <input
            className="input"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder={source === 'manual' ? '手工补录原因（如扫码设备临时故障）' : '可选'}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">取消</button>
          <button onClick={submit} disabled={submitting || !itemId || !babyId} className="btn-primary">
            <Plus size={16} /> 提交
          </button>
        </div>
      </div>
    </div>
  )
}
