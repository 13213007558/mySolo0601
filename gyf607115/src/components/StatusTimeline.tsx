import { Clock, User, MessageSquare, Edit3, Download, Camera, AlertCircle } from 'lucide-react';
import type { StatusHistory, OperationHistory } from '../types';
import { ALARM_STATUS_LABELS } from '../types';
import { formatDate } from '../utils/formatters';
import { cn } from '../lib/utils';

interface StatusTimelineProps {
  statusHistories: StatusHistory[];
  operationHistories: OperationHistory[];
  className?: string;
}

type TimelineItem = {
  id: string;
  type: 'status' | 'operation';
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
  operator: string;
  color: string;
};

const operationTypeIcons: Record<string, React.ReactNode> = {
  create: <AlertCircle className="h-4 w-4" />,
  update: <Edit3 className="h-4 w-4" />,
  status_change: <MessageSquare className="h-4 w-4" />,
  export: <Download className="h-4 w-4" />,
  manual_entry: <Camera className="h-4 w-4" />,
};

const operationTypeLabels: Record<string, string> = {
  create: '告警创建',
  update: '信息更新',
  status_change: '状态变更',
  export: '数据导出',
  manual_entry: '手工补录',
};

export function StatusTimeline({
  statusHistories,
  operationHistories,
  className,
}: StatusTimelineProps) {
  const timelineItems: TimelineItem[] = [
    ...statusHistories.map((h) => ({
      id: h.id,
      type: 'status' as const,
      icon: <MessageSquare className="h-4 w-4" />,
      title: `状态变更: ${ALARM_STATUS_LABELS[h.fromStatus]} → ${ALARM_STATUS_LABELS[h.toStatus]}`,
      description: h.reason,
      time: h.createdAt,
      operator: h.operator,
      color: 'bg-blue-500',
    })),
    ...operationHistories.map((h) => ({
      id: h.id,
      type: 'operation' as const,
      icon: operationTypeIcons[h.operationType] || <Clock className="h-4 w-4" />,
      title: operationTypeLabels[h.operationType] || '操作记录',
      description: h.detail,
      time: h.createdAt,
      operator: h.operator,
      color: 'bg-slate-400',
    })),
  ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  if (timelineItems.length === 0) {
    return (
      <div className={cn('py-8 text-center text-slate-400', className)}>
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">暂无操作历史</p>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-200" />

      <div className="space-y-4">
        {timelineItems.map((item, index) => (
          <div key={item.id} className="relative pl-10">
            <div
              className={cn(
                'absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-white',
                item.color
              )}
            >
              {item.icon}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-800">{item.title}</h4>
                  {item.description && (
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <User className="h-3 w-3" />
                    <span>{item.operator}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(item.time)}</span>
                  </div>
                </div>
              </div>
            </div>

            {index < timelineItems.length - 1 && (
              <div className="absolute left-[15px] top-8 w-0.5 h-4 bg-slate-200" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
