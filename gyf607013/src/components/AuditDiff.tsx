import { ArrowRight, User, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/format';
import type { AuditLog } from '@/types';

interface AuditDiffProps {
  log: AuditLog;
  className?: string;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

const FIELD_LABELS: Record<string, string> = {
  status: '状态',
  temperature: '温度',
  duration: '时长',
  actualTime: '实际时间',
  operatorId: '操作人',
  handlerId: '处理人',
  reviewedById: '审核人',
  exceptionNote: '异常说明',
  itemName: '物品名称',
  scheduledTime: '计划时间',
};

export default function AuditDiff({ log, className }: AuditDiffProps) {
  const fieldLabel = FIELD_LABELS[log.fieldName] ?? log.fieldName;
  const oldStr = formatValue(log.oldValue);
  const newStr = formatValue(log.newValue);
  const isBoundary = log.isBoundaryAudit;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 shadow-card transition hover:shadow-card-hover',
        isBoundary ? 'border-warm-200 bg-warm-50' : 'border-ink-200 bg-white',
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-700">
            {fieldLabel}
          </span>
          {isBoundary && (
            <span className="inline-flex items-center gap-1 rounded-md bg-warm-100 px-2 py-0.5 text-xs font-medium text-warm-600">
              <AlertTriangle className="h-3 w-3" />
              边界值变更
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-ink-500">
          <Clock className="h-3 w-3" />
          {formatDate(log.operatedAt, true)}
        </div>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <div
          className={cn(
            'flex-1 rounded-lg border px-3 py-2 text-sm',
            isBoundary ? 'border-danger-200 bg-danger-50 text-danger-700 line-through' : 'border-ink-200 bg-ink-50 text-ink-500 line-through'
          )}
        >
          <div className="mb-0.5 text-xs text-ink-400">变更前</div>
          {oldStr}
        </div>
        <ArrowRight className="h-4 w-4 flex-shrink-0 text-ink-400" />
        <div
          className={cn(
            'flex-1 rounded-lg border px-3 py-2 text-sm',
            isBoundary ? 'border-warm-300 bg-warm-100 text-warm-700 font-medium' : 'border-mint-200 bg-mint-50 text-mint-700'
          )}
        >
          <div className="mb-0.5 text-xs text-ink-400">变更后</div>
          {newStr}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-ink-500">
        <User className="h-3.5 w-3.5" />
        <span>操作人：{log.operatorName}</span>
      </div>
    </div>
  );
}
