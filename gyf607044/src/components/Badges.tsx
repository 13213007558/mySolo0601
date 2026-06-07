import { STATUS_COLOR, STATUS_LABEL } from '@/types';
import type { RecordStatus } from '@/types';

export function StatusBadge({ status }: { status: RecordStatus }) {
  return (
    <span className={`badge ${STATUS_COLOR[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function SourceBadge({ type }: { type: 'parent_submit' | 'manual_entry' | 'file_import' }) {
  const map = {
    parent_submit: 'bg-primary/20 text-pink-700',
    manual_entry: 'bg-secondary/15 text-secondary-dark',
    file_import: 'bg-warn/30 text-amber-800',
  } as const;
  const label = {
    parent_submit: '家长录入',
    manual_entry: '手工补录',
    file_import: '文件导入',
  } as const;
  return <span className={`badge ${map[type]}`}>{label[type]}</span>;
}

export function CorruptedBadge() {
  return (
    <span className="badge bg-red-100 text-red-700 border border-red-200">
      ⚠ 异常记录
    </span>
  );
}
