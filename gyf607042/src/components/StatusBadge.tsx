import type { RecordStatus } from '@/types';

interface Props {
  status: RecordStatus;
  size?: 'sm' | 'md';
}

const config: Record<RecordStatus, { label: string; className: string }> = {
  normal: {
    label: '正常',
    className:
      'bg-sage-100 text-sage-600 border-sage-200 ring-sage-100',
  },
  abnormal: {
    label: '异常',
    className:
      'bg-coral-50 text-coral-500 border-coral-200 ring-coral-100',
  },
  manual_overridden: {
    label: '人工改判',
    className:
      'bg-amber-50 text-amber2-500 border-amber-200/60 ring-amber-100/60',
  },
  pending: {
    label: '待审核',
    className:
      'bg-warm-100 text-warm-700 border-warm-200 ring-warm-100',
  },
};

export default function StatusBadge({ status, size = 'sm' }: Props) {
  const { label, className } = config[status];
  const sizeCls =
    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm font-medium';
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border ${sizeCls} ${className} ring-1 ring-inset tracking-wide`}
    >
      <span
        className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
          status === 'normal'
            ? 'bg-sage-400'
            : status === 'abnormal'
            ? 'bg-coral-400'
            : status === 'manual_overridden'
            ? 'bg-amber2-500'
            : 'bg-warm-500'
        } ${status === 'pending' ? 'animate-pulseSoft' : ''}`}
      />
      {label}
    </span>
  );
}
