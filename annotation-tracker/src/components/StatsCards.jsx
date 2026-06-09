import { FileText, Clock, CheckCircle2, AlertTriangle, UserCheck, RefreshCw } from 'lucide-react';
import { ANNOTATION_STATUS_LABELS } from '../db';

export function StatsCards({ stats, onRefresh, refreshing }) {
  if (!stats) return null;

  const statItems = [
    {
      label: '总批注数',
      value: stats.total,
      icon: <FileText className="w-6 h-6 text-blue-600" />,
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100'
    },
    {
      label: '待分派',
      value: stats.pending,
      icon: <Clock className="w-6 h-6 text-amber-600" />,
      bgColor: 'bg-amber-50',
      iconBg: 'bg-amber-100'
    },
    {
      label: '已回复',
      value: (stats.byStatus.replied || 0) + (stats.byStatus.closed || 0),
      icon: <CheckCircle2 className="w-6 h-6 text-green-600" />,
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100'
    },
    {
      label: '处理中',
      value: (stats.byStatus.assigned || 0) + (stats.byStatus.in_progress || 0),
      icon: <UserCheck className="w-6 h-6 text-purple-600" />,
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100'
    },
    {
      label: '有问题',
      value: stats.hasError,
      icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
      bgColor: 'bg-red-50',
      iconBg: 'bg-red-100'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {statItems.map((item, index) => (
        <div key={index} className={`card p-4 ${item.bgColor} border-0`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">{item.label}</p>
              <p className="text-2xl font-bold text-slate-800">{item.value}</p>
            </div>
            <div className={`w-12 h-12 ${item.iconBg} rounded-lg flex items-center justify-center`}>
              {item.icon}
            </div>
          </div>
        </div>
      ))}
      
      <div className="card p-4 flex items-center justify-center">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="btn-secondary w-full"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          刷新数据
        </button>
      </div>
    </div>
  );
}

export function StatusDistribution({ stats }) {
  if (!stats) return null;

  const statuses = [
    { key: 'pending', label: ANNOTATION_STATUS_LABELS.pending, color: 'bg-slate-500' },
    { key: 'assigned', label: ANNOTATION_STATUS_LABELS.assigned, color: 'bg-blue-500' },
    { key: 'in_progress', label: ANNOTATION_STATUS_LABELS.in_progress, color: 'bg-amber-500' },
    { key: 'replied', label: ANNOTATION_STATUS_LABELS.replied, color: 'bg-green-500' },
    { key: 'closed', label: ANNOTATION_STATUS_LABELS.closed, color: 'bg-gray-400' }
  ];

  const total = stats.total || 1;

  return (
    <div className="card p-4 mb-6">
      <h3 className="font-medium text-slate-700 mb-4">状态分布</h3>
      <div className="space-y-3">
        {statuses.map(status => {
          const count = stats.byStatus[status.key] || 0;
          const percentage = Math.round((count / total) * 100);
          
          return (
            <div key={status.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-600">{status.label}</span>
                <span className="text-sm font-medium text-slate-800">
                  {count} ({percentage}%)
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${status.color} rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
