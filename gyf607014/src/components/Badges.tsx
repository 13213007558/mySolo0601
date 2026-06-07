import type { RecordStatus, DataSource, ExceptionType } from '../../shared/types';
import {
  statusLabel,
  statusColor,
  sourceLabel,
  sourceColor,
  exceptionLabel,
  exceptionColor,
} from '../utils/format';
import { AlertTriangle, CheckCircle, Clock, FileEdit } from 'lucide-react';

const statusIcon: Record<RecordStatus, any> = {
  pending: Clock,
  reviewed: CheckCircle,
  exception: AlertTriangle,
  supplemented: FileEdit,
};

export function StatusPill({ status, size = 'md' }: { status: RecordStatus; size?: 'sm' | 'md' }) {
  const Icon = statusIcon[status];
  const cls = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`status-pill border ${statusColor[status]} ${cls}`}>
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {statusLabel[status]}
    </span>
  );
}

export function SourceChip({ source }: { source: DataSource }) {
  return <span className={`chip ${sourceColor[source]} border`}>{sourceLabel[source]}</span>;
}

export function ExceptionTag({ type }: { type: ExceptionType }) {
  return (
    <span className={`status-pill border ${exceptionColor[type]} px-2 py-0.5 text-[11px]`}>
      {exceptionLabel[type]}
    </span>
  );
}
