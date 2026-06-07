import type { DataStatus } from '@shared/types';

const config: Record<DataStatus | 'all', { label: string; cls: string; dot: string }> = {
  all: { label: '全部', cls: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  normal: { label: '正常', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  pending_review: { label: '待复核', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  dirty: { label: '脏数据', cls: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  empty: { label: '空数据', cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  missing_material: { label: '缺材料', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};

export default function StatusBadge({ status, size = 'md' }: { status: DataStatus | 'all'; size?: 'sm' | 'md' }) {
  const c = config[status];
  const sizeCls = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${c.cls} ${sizeCls} font-medium`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${status === 'pending_review' ? 'animate-pulseSoft' : ''}`}></span>
      {c.label}
    </span>
  );
}
