import { useEffect, useState } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import type { ReviewLog } from '@shared/types';
import { formatDate, formatStatus } from '@/utils/format';
import { statusColor } from '@/utils/format';

interface Props {
  recordId: string;
}

export default function ReviewTimeline({ recordId }: Props) {
  const [logs, setLogs] = useState<ReviewLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/records/${recordId}/review-logs`);
        if (res.ok) {
          setLogs(await res.json());
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [recordId]);

  if (loading) return <div className="text-sm text-gray-400">加载操作日志...</div>;
  if (logs.length === 0) {
    return (
      <div className="bg-cream-50 rounded-card p-5 border border-cream-200 text-center text-sm text-gray-500">
        暂无复核操作日志
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card shadow-card border border-cream-200 p-5 animate-fade-in">
      <h3 className="font-serif text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-brand-500" />
        复核操作日志
      </h3>
      <ol className="relative border-l-2 border-cream-200 ml-3 space-y-5">
        {logs.map((log) => (
          <li key={log.id} className="ml-5 relative">
            <span className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-white border-2 border-brand-400 ring-4 ring-brand-50" />
            <div className="bg-cream-50 rounded-lg p-3 border border-cream-100">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(
                    log.fromStatus
                  )} opacity-60`}
                >
                  {formatStatus(log.fromStatus)}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(
                    log.toStatus
                  )}`}
                >
                  {formatStatus(log.toStatus)}
                </span>
                <span className="text-xs text-gray-500 ml-auto">{formatDate(log.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700">
                <span className="text-gray-500">处理人：</span>
                <span className="font-medium">{log.handlerName}</span>
              </p>
              {log.reason && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="text-gray-500">原因：</span>
                  {log.reason}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
