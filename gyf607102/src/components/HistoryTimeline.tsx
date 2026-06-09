import { Clock, FileText, CheckCircle, XCircle, RotateCcw, Upload, FileJson, ArrowRight } from 'lucide-react';
import type { HistoryRecord } from '@/types';
import { formatDateTime, getActionText } from '@/utils/export';
import { cn } from '@/lib/utils';

const actionIconMap: Record<string, React.ReactNode> = {
  create: <FileText className="h-4 w-4" />,
  submit: <CheckCircle className="h-4 w-4" />,
  withdraw: <XCircle className="h-4 w-4" />,
  resubmit: <RotateCcw className="h-4 w-4" />,
  manual_upload: <Upload className="h-4 w-4" />,
  export: <FileJson className="h-4 w-4" />,
  import: <FileJson className="h-4 w-4" />
};

const actionColorMap: Record<string, string> = {
  create: 'bg-blue-100 text-blue-600',
  submit: 'bg-emerald-100 text-emerald-600',
  withdraw: 'bg-red-100 text-red-600',
  resubmit: 'bg-amber-100 text-amber-600',
  manual_upload: 'bg-purple-100 text-purple-600',
  export: 'bg-gray-100 text-gray-600',
  import: 'bg-gray-100 text-gray-600'
};

export const HistoryTimeline = ({ history }: { history: HistoryRecord[] }) => {
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Clock className="h-4 w-4" />
        处理历史 ({history.length})
      </h4>
      <div className="relative space-y-0">
        {sortedHistory.map((record, index) => (
          <div key={record.id} className="relative flex gap-4 pb-4">
            {index < sortedHistory.length - 1 && (
              <div className="absolute left-[15px] top-8 h-full w-0.5 bg-gray-200" />
            )}
            <div
              className={cn(
                'relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                actionColorMap[record.action] || 'bg-gray-100 text-gray-600'
              )}
            >
              {actionIconMap[record.action] || <Clock className="h-4 w-4" />}
            </div>
            <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-800">{getActionText(record.action)}</span>
                <span className="text-sm text-gray-500">·</span>
                <span className="text-sm text-gray-500">{record.operator}</span>
                <span className="text-sm text-gray-500">·</span>
                <span className="text-sm text-gray-500">{formatDateTime(record.timestamp)}</span>
              </div>
              {record.oldConclusion && (
                <div className="mt-2 space-y-1">
                  <div className="rounded bg-red-50 p-2 text-sm">
                    <span className="font-medium text-red-700">旧结论: </span>
                    <span className="line-through text-red-600">{record.oldConclusion}</span>
                  </div>
                </div>
              )}
              {record.oldReason && (
                <div className="mt-1 rounded bg-red-50 p-2 text-sm">
                  <span className="font-medium text-red-700">旧理由: </span>
                  <span className="line-through text-red-600">{record.oldReason}</span>
                </div>
              )}
              {record.newConclusion && !record.oldConclusion && (
                <div className="mt-2 space-y-1">
                  <div className="rounded bg-emerald-50 p-2 text-sm">
                    <span className="font-medium text-emerald-700">新结论: </span>
                    <span className="text-emerald-700">{record.newConclusion}</span>
                  </div>
                </div>
              )}
              {record.newReason && !record.oldReason && (
                <div className="mt-1 rounded bg-emerald-50 p-2 text-sm">
                  <span className="font-medium text-emerald-700">新理由: </span>
                  <span className="text-emerald-700">{record.newReason}</span>
                </div>
              )}
              {record.oldConclusion && record.newConclusion && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="rounded bg-emerald-50 p-2 text-sm">
                    <span className="font-medium text-emerald-700">新结论: </span>
                    <span className="text-emerald-700">{record.newConclusion}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              )}
              {record.oldReason && record.newReason && (
                <div className="mt-1 rounded bg-emerald-50 p-2 text-sm">
                  <span className="font-medium text-emerald-700">新理由: </span>
                  <span className="text-emerald-700">{record.newReason}</span>
                </div>
              )}
              {record.remark && (
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">备注: </span>
                  {record.remark}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
