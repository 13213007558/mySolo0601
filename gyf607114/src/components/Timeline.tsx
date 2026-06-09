import { Activity, AlertTriangle, Wrench, Edit3, Play, Square } from 'lucide-react';
import type { TimelineEvent } from '../types';

interface TimelineProps {
  events: TimelineEvent[];
}

export const Timeline = ({ events }: TimelineProps) => {
  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'inspection':
        return Activity;
      case 'status_change':
        return AlertTriangle;
      case 'maintenance':
        return Wrench;
      case 'manual_entry':
        return Edit3;
      case 'start_stop':
        return (event: TimelineEvent) =>
          event.title.includes('启动') ? Play : Square;
      default:
        return Activity;
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'inspection':
        return { bg: 'bg-blue-500', border: 'border-blue-200' };
      case 'status_change':
        return { bg: 'bg-amber-500', border: 'border-amber-200' };
      case 'maintenance':
        return { bg: 'bg-purple-500', border: 'border-purple-200' };
      case 'manual_entry':
        return { bg: 'bg-green-500', border: 'border-green-200' };
      case 'start_stop':
        return { bg: 'bg-gray-500', border: 'border-gray-200' };
      default:
        return { bg: 'bg-gray-500', border: 'border-gray-200' };
    }
  };

  const getTitleColor = (title: string) => {
    if (title.includes('异常')) return 'text-red-700';
    if (title.includes('预警')) return 'text-amber-700';
    if (title.includes('正常')) return 'text-green-700';
    if (title.includes('启动')) return 'text-green-700';
    if (title.includes('停机')) return 'text-red-700';
    if (title.includes('补录')) return 'text-purple-700';
    return 'text-gray-900';
  };

  if (events.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无时间线记录</h3>
        <p className="text-gray-500 text-sm">切换数据模式或导入数据以查看时间线</p>
      </div>
    );
  }

  const displayEvents = events.slice(0, 20);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-semibold text-gray-900">事件时间线</h2>
        <p className="text-sm text-gray-500">最近 {displayEvents.length} 条记录</p>
      </div>
      <div className="p-5 max-h-[600px] overflow-y-auto scrollbar-thin">
        <div className="relative">
          {displayEvents.map((event, index) => {
            const color = getEventColor(event.type);
            getEventIcon(event.type);
            const titleColor = getTitleColor(event.title);

            return (
              <div
                key={event.id}
                className={`timeline-item ${
                  index === displayEvents.length - 1 ? 'pb-0' : ''
                }`}
              >
                <div className={`timeline-dot ${color.bg} ${color.border}`}>
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>

                <div className={`p-3 rounded-lg border ${color.border} bg-white`}>
                  <div className="flex items-start justify-between mb-1.5">
                    <h4 className={`font-medium text-sm ${titleColor}`}>
                      {event.title}
                    </h4>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                      {event.time.slice(5, 16)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{event.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                      {event.pumpCode}
                    </span>
                    {event.operator && (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                        {event.operator}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      event.type === 'manual_entry'
                        ? 'bg-green-100 text-green-700'
                        : event.type === 'start_stop'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {event.type === 'manual_entry' ? '手工' :
                       event.type === 'start_stop' ? '启停' :
                       event.type === 'inspection' ? '巡检' :
                       event.type === 'status_change' ? '状态' : '维护'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
