import { cn } from '@/utils';
import type { AuthStatus } from '@shared/types';
import { AUTH_STATUS_LABEL, AUTH_STATUS_COLOR } from '@shared/types';

interface Props {
  status: AuthStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
        AUTH_STATUS_COLOR[status],
        className,
      )}
    >
      {AUTH_STATUS_LABEL[status]}
    </span>
  );
}
