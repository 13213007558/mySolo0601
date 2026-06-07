import type { RecordStatus, AuditAction } from '@/utils/types';
import { STATUS_LABEL, STATUS_COLOR, ACTION_LABEL, ACTION_COLOR } from '@/utils/types';

export function StatusBadge({ status }: { status: RecordStatus }) {
  return <span className={`badge ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function ActionBadge({ action }: { action: AuditAction }) {
  return <span className={`badge ${ACTION_COLOR[action]}`}>{ACTION_LABEL[action]}</span>;
}
