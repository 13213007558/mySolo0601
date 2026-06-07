import type { AuthStatus, RecordSource } from '@shared/types';

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const STATUS_LABEL: Record<AuthStatus, string> = {
  authorized: '已授权',
  revoked: '已撤回',
  pending: '待确认',
  missing: '资料缺失',
};

export const SOURCE_LABEL: Record<RecordSource, string> = {
  original: '原始记录',
  supplement: '补录材料',
  manual: '手工补录',
  revocation_notice: '撤回通知',
};

export function statusColor(status: AuthStatus): string {
  switch (status) {
    case 'authorized': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'revoked':    return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    case 'pending':    return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'missing':    return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  }
}

export function sourceColor(source: RecordSource): string {
  switch (source) {
    case 'original':          return 'text-slate-300';
    case 'supplement':        return 'text-amber-300';
    case 'manual':            return 'text-orange-300';
    case 'revocation_notice': return 'text-rose-300';
  }
}
