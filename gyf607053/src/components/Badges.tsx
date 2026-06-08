import { STATUS_COLORS, STATUS_LABELS } from '../store/app'
import type { ItemStatus } from '../../shared/types'

export function StatusBadge({ status }: { status: ItemStatus | string }) {
  const color = STATUS_COLORS[status] || 'bg-ink-100 text-ink-700 border-ink-200'
  const label = STATUS_LABELS[status] || status
  return <span className={`chip ${color}`}>{label}</span>
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    waiter: 'bg-sky-50 text-sky-700 border-sky-200',
    kitchen: 'bg-amber-50 text-amber-700 border-amber-200',
    manager: 'bg-violet-50 text-violet-700 border-violet-200',
    supervisor: 'bg-rose-50 text-rose-700 border-rose-200',
  }
  const labelMap: Record<string, string> = {
    waiter: '现场服务员',
    kitchen: '厨房/后场',
    manager: '餐厅店长',
    supervisor: '主管',
  }
  return <span className={`chip ${map[role] || map.waiter}`}>{labelMap[role] || role}</span>
}

export function SourceBadge({ source }: { source: string }) {
  if (source === 'manual') {
    return <span className="chip bg-orange-50 text-orange-700 border-orange-200">手工补录</span>
  }
  return <span className="chip bg-ink-50 text-ink-700 border-ink-200">扫码</span>
}

export function ActionBadge({ action }: { action: string }) {
  if (action === 'borrow') {
    return <span className="chip bg-sky-50 text-sky-700 border-sky-200">借出</span>
  }
  return <span className="chip bg-warm-50 text-warm-700 border-warm-200">归还</span>
}
