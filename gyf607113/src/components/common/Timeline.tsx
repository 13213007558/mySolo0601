import { Clock, User, FileText } from 'lucide-react';
import type { StatusHistory } from '@/types';
import { statusLabels, statusColors } from '@/types';
import { formatDate } from '@/utils/storage';

interface TimelineProps {
  histories: StatusHistory[];
  maxItems?: number;
}

const Timeline = ({ histories, maxItems }: TimelineProps) => {
  const displayHistories = maxItems ? histories.slice(0, maxItems) : histories;

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-industrial-500 via-industrial-600 to-industrial-800" />

      <div className="space-y-6">
        {displayHistories.map((history, index) => (
          <div
            key={history.id}
            className="relative pl-12 animate-fade-in-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div
              className={`absolute left-2 w-5 h-5 rounded-full border-2 border-industrial-900 ${statusColors[history.newStatus]} shadow-lg transition-transform hover:scale-125 duration-200`}
            />

            <div className="card-industrial p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-sm ${statusColors[history.oldStatus]} text-white`}
                  >
                    {statusLabels[history.oldStatus]}
                  </span>
                  <span className="text-industrial-400">→</span>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-sm ${statusColors[history.newStatus]} text-white`}
                  >
                    {statusLabels[history.newStatus]}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-industrial-400">
                  <Clock className="w-3 h-3" />
                  {formatDate(history.timestamp)}
                </div>
              </div>

              <p className="text-white font-medium mb-2">{history.reason}</p>

              {history.remark && (
                <div className="flex items-start gap-2 mt-2 pt-2 border-t border-industrial-700/50">
                  <FileText className="w-4 h-4 text-industrial-400 mt-0.5" />
                  <p className="text-sm text-industrial-300">{history.remark}</p>
                </div>
              )}

              <div className="flex items-center gap-1 mt-2 text-xs text-industrial-400">
                <User className="w-3 h-3" />
                操作人: {history.operator}
              </div>
            </div>
          </div>
        ))}

        {maxItems && histories.length > maxItems && (
          <div className="pl-12 text-center py-2">
            <span className="text-industrial-400 text-sm">还有 {histories.length - maxItems} 条历史记录</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
