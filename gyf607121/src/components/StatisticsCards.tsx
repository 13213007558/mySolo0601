import { FileText, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useStatistics } from '@/store/useMeterStore';

export default function StatisticsCards() {
  const stats = useStatistics();

  const cards = [
    {
      label: '总记录数',
      value: stats.total,
      icon: FileText,
      color: 'primary',
      gradient: 'from-primary-500/20 to-primary-700/10',
      bar: 'bg-gradient-primary',
    },
    {
      label: '正常记录',
      value: stats.normal,
      icon: CheckCircle,
      color: 'success',
      gradient: 'from-status-success/20 to-emerald-700/10',
      bar: 'bg-gradient-success',
    },
    {
      label: '问题记录',
      value: stats.problem,
      icon: AlertTriangle,
      color: 'warning',
      gradient: 'from-status-warning/20 to-amber-700/10',
      bar: 'bg-gradient-warning',
    },
    {
      label: '待拍板',
      value: stats.pending,
      icon: Clock,
      color: 'danger',
      gradient: 'from-status-danger/20 to-red-700/10',
      bar: 'bg-gradient-danger',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={card.label}
          className="stat-card animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50`}
          />
          <div className={`absolute top-0 left-0 right-0 h-1 ${card.bar}`} />

          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-gray-400 font-medium">{card.label}</p>
                <p className="text-3xl font-bold font-mono-tabular mt-1">
                  {card.value.toLocaleString()}
                </p>
              </div>
              <div className={`p-2 rounded-lg bg-${card.color === 'primary' ? 'primary' : card.color === 'success' ? 'status-success' : card.color === 'warning' ? 'status-warning' : 'status-danger'}/20`}>
                <card.icon className={`w-5 h-5 text-${card.color === 'primary' ? 'primary-400' : card.color === 'success' ? 'status-success' : card.color === 'warning' ? 'status-warning' : 'status-danger'}`} />
              </div>
            </div>

            {stats.total > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>占比</span>
                  <span className="font-mono-tabular">
                    {((card.value / stats.total) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 bg-industrial-bg rounded-full overflow-hidden">
                  <div
                    className={`h-full ${card.bar} transition-all duration-700 ease-out`}
                    style={{ width: `${(card.value / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="stat-card col-span-2 lg:col-span-4 border-dashed">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary-500/20 to-status-purple/20">
              <TrendingUp className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">累计计算读数</p>
              <p className="text-2xl font-bold font-mono-tabular">
                {stats.totalReading.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
                <span className="text-sm font-normal text-gray-500 ml-2">kWh</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">已应用分表倍率</p>
            <p className="text-xs text-primary-400 mt-1">数据来源：老周手工补录 + 系统计算</p>
          </div>
        </div>
      </div>
    </div>
  );
}
