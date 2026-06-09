import { ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface DiffField {
  field: string;
  old: unknown;
  new: unknown;
}

interface DiffViewerProps {
  diffData: Record<string, { old: unknown; new: unknown }>;
  className?: string;
  title?: string;
}

const fieldLabels: Record<string, string> = {
  alarmCode: '告警编号',
  siteName: '站点名称',
  deviceName: '设备名称',
  level: '告警级别',
  description: '告警描述',
  amount: '金额',
  phone: '联系电话',
  status: '处理状态',
};

const levelLabels: Record<string, string> = {
  critical: '严重',
  warning: '警告',
  info: '提示',
};

const statusLabels: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  ignored: '已忽略',
};

function formatValue(field: string, value: unknown): string {
  if (value === undefined || value === null) return '-';
  if (field === 'level') return levelLabels[String(value)] || String(value);
  if (field === 'status') return statusLabels[String(value)] || String(value);
  if (field === 'amount') return `¥${Number(value).toFixed(2)}`;
  return String(value);
}

export function DiffViewer({ diffData, className, title }: DiffViewerProps) {
  const diffFields: DiffField[] = Object.entries(diffData).map(([field, { old, new: newValue }]) => ({
    field,
    old,
    new: newValue,
  }));

  if (diffFields.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4',
          className
        )}
      >
        <CheckCircle className="h-5 w-5 text-emerald-600" />
        <span className="text-sm font-medium text-emerald-800">数据一致，无差异</span>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border border-slate-200 bg-white overflow-hidden', className)}>
      {title && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50">
          <XCircle className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-slate-700">{title}</span>
          <span className="ml-auto text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            检测到 {diffFields.length} 处差异
          </span>
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {diffFields.map((diff) => (
          <div key={diff.field} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {fieldLabels[diff.field] || diff.field}
              </span>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-xs text-red-600 mb-1 font-medium">原有数据</p>
                <p className="text-sm text-red-800 font-mono">{formatValue(diff.field, diff.old)}</p>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="h-5 w-5 text-slate-400" />
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs text-emerald-600 mb-1 font-medium">补录数据</p>
                <p className="text-sm text-emerald-800 font-mono">
                  {formatValue(diff.field, diff.new)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
