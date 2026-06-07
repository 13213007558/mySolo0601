import type { AuthStatus } from '@shared/types';
import { STATUS_LABEL, statusColor } from '@/utils/format';

export default function StatusBadge({ status }: { status: AuthStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors duration-300 ${statusColor(status)}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
