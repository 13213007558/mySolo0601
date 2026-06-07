import { STATUS_LABEL } from '@/types';
import type { StatusLog } from '@/types';
import { formatDateTime } from '@/utils/helpers';
import { ArrowRight, AlertTriangle } from 'lucide-react';

export function StatusTimeline({ logs }: { logs: StatusLog[] }) {
  if (!logs.length) {
    return <div className="text-sm text-gray-400 py-4">暂无状态变更记录</div>;
  }
  return (
    <ol className="relative pl-2">
      {logs.map((log, i) => (
        <li
          key={log.id}
          className="relative pl-6 pb-6 animate-fade-in-up"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {i < logs.length - 1 && (
            <span className="absolute left-2 top-3 w-px h-full bg-muted" />
          )}
          <span
            className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 ${
              log.isRollback
                ? 'bg-red-100 border-red-400'
                : 'bg-primary/30 border-primary'
            } flex items-center justify-center`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-secondary">
              {log.operator}
            </span>
            <span className="inline-flex items-center gap-1 text-sm text-gray-600">
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs">
                {STATUS_LABEL[log.fromStatus]}
              </span>
              <ArrowRight size={14} className="text-gray-400" />
              <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-xs text-secondary-dark">
                {STATUS_LABEL[log.toStatus]}
              </span>
            </span>
            {log.isRollback && (
              <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                <AlertTriangle size={12} /> 状态回退
              </span>
            )}
          </div>
          <div className="mt-1 text-sm text-gray-600">原因：{log.reason || '-'}</div>
          <div className="mt-0.5 text-xs text-gray-400">
            {formatDateTime(log.createdAt)}
          </div>
        </li>
      ))}
    </ol>
  );
}
