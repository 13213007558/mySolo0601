import { cn } from '@/lib/utils';
import { STATUS_LABELS, type RecordStatus } from '@/types';

interface StatusBadgeProps {
  status: RecordStatus;
  className?: string;
}

const statusStyles: Record<RecordStatus, string> = {
  pending: 'bg-status-orange/10 text-status-orange border-status-orange/30',
  approved: 'bg-status-green/10 text-status-green border-status-green/30',
  rejected: 'bg-status-red/10 text-status-red border-status-red/30',
  cross_shift: 'bg-status-yellow/10 text-status-yellow border-status-yellow/30',
  bad_data: 'bg-status-red/20 text-status-red border-status-red/40',
  archived: 'bg-status-gray/10 text-status-gray border-status-gray/30',
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
