import type { RecordStatus } from '@/types';
import { STATUS_LABEL, STATUS_COLOR } from '@/types';

interface StatusBadgeProps {
  status: RecordStatus;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span className={`chip ${STATUS_COLOR[status]} ${className}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
