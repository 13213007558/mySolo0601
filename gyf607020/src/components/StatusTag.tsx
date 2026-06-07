import type { RecordStatus } from '@shared/types';
import { formatStatus, statusColor } from '@/utils/format';

interface Props {
  status: RecordStatus;
}

export default function StatusTag({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor(
        status
      )}`}
    >
      {formatStatus(status)}
    </span>
  );
}
