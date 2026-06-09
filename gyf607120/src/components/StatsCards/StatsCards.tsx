import { Receipt, AlertTriangle, Undo2, Users } from 'lucide-react';
import { useReconciliationStore } from '@/store/useReconciliationStore';
import { formatAmount } from '@/utils/formatters';

export const StatsCards = () => {
  const { filteredFlows, refundRecords, driverQueues } = useReconciliationStore();

  const totalCount = filteredFlows.length;
  const anomalyAmount = filteredFlows
    .filter(f => f.status === 'anomaly')
    .reduce((sum, f) => sum + f.amount, 0);
  const refundCount = refundRecords.length;
  const queueCount = driverQueues.filter(q => q.status === 'waiting').length;

  const cards = [
    {
      title: '今日对账笔数',
      value: totalCount,
      suffix: '笔',
      icon: Receipt,
      gradient: 'from-blue-500 to-cyan-500',
      bgGlow: 'shadow-blue-500/20'
    },
    {
      title: '异常金额',
      value: anomalyAmount,
      suffix: '',
      formatter: formatAmount,
      icon: AlertTriangle,
      gradient: 'from-red-500 to-orange-500',
      bgGlow: 'shadow-red-500/20',
      pulse: anomalyAmount > 0
    },
    {
      title: '退款笔数',
      value: refundCount,
      suffix: '笔',
      icon: Undo2,
      gradient: 'from-purple-500 to-pink-500',
      bgGlow: 'shadow-purple-500/20'
    },
    {
      title: '排队车辆',
      value: queueCount,
      suffix: '辆',
      icon: Users,
      gradient: 'from-emerald-500 to-teal-500',
      bgGlow: 'shadow-emerald-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const displayValue = card.formatter 
          ? card.formatter(card.value as number)
          : card.value;
        
        return (
          <div
            key={index}
            className="relative group overflow-hidden bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-500 hover:-translate-y-1"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm text-slate-400">{card.title}</span>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg ${card.bgGlow}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              
              <div className={`flex items-baseline gap-1 ${card.pulse ? 'animate-pulse' : ''}`}>
                <span className="text-3xl font-bold text-white tracking-tight">
                  {displayValue}
                </span>
                {card.suffix && (
                  <span className="text-lg text-slate-400 font-medium">{card.suffix}</span>
                )}
              </div>

              <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${card.gradient} transition-all duration-500 ${
                card.value > 0 ? 'w-full' : 'w-0'
              }`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
