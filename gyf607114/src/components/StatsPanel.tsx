import { Gauge, AlertTriangle, CheckCircle, MinusCircle, Edit3 } from 'lucide-react';

interface StatsPanelProps {
  stats: {
    total: number;
    normal: number;
    warning: number;
    abnormal: number;
    empty: number;
    manual: number;
  };
}

export const StatsPanel = ({ stats }: StatsPanelProps) => {
  const statItems = [
    {
      label: '设备总数',
      value: stats.total,
      icon: Gauge,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      label: '运行正常',
      value: stats.normal,
      icon: CheckCircle,
      color: 'bg-status-normal',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      label: '预警状态',
      value: stats.warning,
      icon: AlertTriangle,
      color: 'bg-status-warning',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
    },
    {
      label: '异常告警',
      value: stats.abnormal,
      icon: AlertTriangle,
      color: 'bg-status-abnormal',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
    {
      label: '数据缺失',
      value: stats.empty,
      icon: MinusCircle,
      color: 'bg-status-empty',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
    },
    {
      label: '手工补录',
      value: stats.manual,
      icon: Edit3,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="card p-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">{item.label}</p>
              <p className={`text-2xl font-bold mt-1 ${item.textColor}`}>{item.value}</p>
            </div>
            <div className={`w-10 h-10 ${item.bgColor} rounded-lg flex items-center justify-center`}>
              <item.icon className={`w-5 h-5 ${item.textColor}`} />
            </div>
          </div>
          <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${item.color} rounded-full transition-all duration-500`}
              style={{
                width: stats.total > 0 ? `${(item.value / stats.total) * 100}%` : '0%',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
