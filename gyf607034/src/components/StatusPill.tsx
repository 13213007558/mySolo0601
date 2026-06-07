import type { RecordStatus } from '../types';
import { STATUS_LABEL, statusColor } from '../utils/format';

interface Props {
  status: RecordStatus;
  size?: 'sm' | 'md';
}

export function StatusPill({ status, size = 'sm' }: Props) {
  const c = statusColor(status);
  const sizeCls =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px]'
      : 'px-2.5 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border font-medium ${c.bg} ${c.text} ${c.border} ${sizeCls}`}
    >
      <span className={`badge-dot ${c.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}
