import { cn } from '@/lib/utils';
import type { DataStatus, ReviewStatus } from '@shared/types';

export const STATUS_META: Record<DataStatus, { label: string; cls: string; dot: string; icon: string }> = {
  normal: { label: '正常', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: '✓' },
  dirty: { label: '异常/脏数据', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', icon: '!' },
  empty: { label: '空数据', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', icon: '○' },
};

export const REVIEW_META: Record<ReviewStatus, { label: string; cls: string }> = {
  pending: { label: '待处理', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  passed: { label: '已通过', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: '已退回', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  supplemented: { label: '已补录', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
};

export function StatusBadge({ status, size = 'md' }: { status: DataStatus; size?: 'sm' | 'md' }) {
  const m = STATUS_META[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 font-medium',
        size === 'sm' ? 'text-xs py-0.5' : 'text-sm py-1',
        m.cls,
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', m.dot)} />
      {m.label}
    </span>
  );
}

export function ReviewBadge({ status }: { status: ReviewStatus }) {
  const m = REVIEW_META[status];
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', m.cls)}>
      {m.label}
    </span>
  );
}
