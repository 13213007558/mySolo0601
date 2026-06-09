import { useAlarmStore } from '@/store/useAlarmStore';
import { AlertTriangle, Clock, CheckCircle, Eye, XCircle } from 'lucide-react';

export const DataOverview = () => {
  const stats = useAlarmStore((state) => state.stats);

  const statItems = [
    { label: '告警总数', value: stats.total, icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
    { label: '待处理', value: stats.pending, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-900/20' },
    { label: '处理中', value: stats.processing, icon: Clock, color: 'text-orange-400', bg: 'bg-orange-900/20' },
    { label: '已处理', value: stats.completed, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/20' },
    { label: '已复核', value: stats.reviewed, icon: Eye, color: 'text-emerald-400', bg: 'bg-emerald-900/20' },
    { label: '已撤回', value: stats.withdrawn, icon: XCircle, color: 'text-red-400', bg: 'bg-red-900/20' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {statItems.map((item, index) => (
        <div
          key={item.label}
          className="card-industrial relative overflow-hidden animate-fadeIn"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <div className={`absolute inset-0 ${item.bg} opacity-30`} />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <span className="text-xs text-industrial-textMuted">{item.label}</span>
            </div>
            <div className={`font-mono text-3xl font-bold ${item.color}`}>
              {item.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
