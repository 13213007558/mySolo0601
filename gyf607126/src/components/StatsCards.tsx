import { FileText, AlertTriangle, CheckCircle, Clock, DollarSign, FileWarning } from 'lucide-react';
import { useContractStore } from '../store/contractStore';
import { useMemo } from 'react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const StatsCards = () => {
  const contracts = useContractStore((state) => state.contracts);
  const getStats = useContractStore((state) => state.getStats);
  const stats = useMemo(() => getStats(), [contracts, getStats]);

  const cards = useMemo(() => [
    {
      label: '合同总数',
      value: stats.total,
      icon: <FileText className="w-6 h-6" />,
      gradient: 'from-energy-50 to-white',
      iconColor: 'text-energy-600',
      iconBg: 'bg-energy-100',
      suffix: '份',
    },
    {
      label: '合同总金额',
      value: formatCurrency(stats.totalAmount),
      icon: <DollarSign className="w-6 h-6" />,
      gradient: 'from-emerald-50 to-white',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
    },
    {
      label: '审核通过',
      value: stats.byStatus['审核通过'] || 0,
      icon: <CheckCircle className="w-6 h-6" />,
      gradient: 'from-green-50 to-white',
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      suffix: '份',
    },
    {
      label: '待审核',
      value: stats.byStatus['待审核'] || 0,
      icon: <Clock className="w-6 h-6" />,
      gradient: 'from-amber-50 to-white',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      suffix: '份',
    },
    {
      label: '存在异常',
      value: stats.anomalyCount,
      icon: <AlertTriangle className="w-6 h-6" />,
      gradient: 'from-rose-50 to-white',
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-100',
      suffix: '份',
      highlight: stats.anomalyCount > 0,
    },
    {
      label: '附件缺失',
      value: stats.attachmentMissing,
      icon: <FileWarning className="w-6 h-6" />,
      gradient: 'from-orange-50 to-white',
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-100',
      suffix: '份',
      highlight: stats.attachmentMissing > 0,
    },
  ], [stats]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`stat-card bg-gradient-to-br ${card.gradient} animate-slide-up`}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="relative z-10">
            <div className={`inline-flex p-2.5 rounded-xl ${card.iconBg} ${card.iconColor} mb-3`}>
              {card.icon}
            </div>
            <div className="stat-value animate-number">
              {card.value}
              {card.suffix && <span className="text-sm font-normal text-slate-500 ml-1">{card.suffix}</span>}
            </div>
            <div className="stat-label mt-1">{card.label}</div>
            {card.highlight && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
