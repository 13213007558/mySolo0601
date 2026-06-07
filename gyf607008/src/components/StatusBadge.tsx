import type { RecordStatus } from '@shared/types';

interface Props {
  status: RecordStatus;
}

const config: Record<RecordStatus, { label: string; dot: string; text: string; bg: string; border: string }> = {
  normal: {
    label: '正常',
    dot: 'bg-status-normal',
    text: 'text-status-normal',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-800/60',
  },
  pending: {
    label: '待复核',
    dot: 'bg-status-pending',
    text: 'text-status-pending',
    bg: 'bg-amber-950/40',
    border: 'border-amber-800/60',
  },
  abnormal: {
    label: '异常',
    dot: 'bg-status-abnormal',
    text: 'text-status-abnormal',
    bg: 'bg-red-950/40',
    border: 'border-red-800/60',
  },
};

export function StatusBadge({ status }: Props) {
  const c = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
