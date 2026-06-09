import { FileText, AlertTriangle, Clock, FileWarning } from 'lucide-react';
import { useValveStore } from '@/store/valveStore';
import { todayStr } from '@/utils/storage';

export default function StatCards() {
  const { records, contracts, getRecordsWithoutContract } = useValveStore();

  const activeRecords = records.filter(r => !r.isDeleted);
  const today = todayStr();

  const todayRecords = activeRecords.filter(r => r.recordDate === today);
  const todayAbnormal = todayRecords.filter(r => r.status === 'abnormal').length;
  const todayManual = todayRecords.filter(r => r.status === 'manual').length;

  const pendingContracts = contracts.filter(c => {
    const matched = activeRecords.some(r => r.contractId === c.id);
    return !matched;
  }).length;

  const pendingRecords = getRecordsWithoutContract().length;

  const stats = [
    {
      icon: FileText,
      label: '今日巡检记录',
      value: todayRecords.length,
      color: 'from-industrial-blue to-primary-400',
      bgColor: 'bg-industrial-blue/10',
      textColor: 'text-industrial-blue',
      trend: todayRecords.length > 10 ? '↑' : '→',
      trendText: todayRecords.length > 10 ? '高于平均' : '正常水平',
    },
    {
      icon: AlertTriangle,
      label: '今日异常记录',
      value: todayAbnormal,
      color: 'from-industrial-red to-industrial-orange',
      bgColor: 'bg-industrial-red/10',
      textColor: 'text-industrial-red',
      trend: todayAbnormal > 2 ? '↑' : '→',
      trendText: todayAbnormal > 2 ? '需关注' : '可控范围',
    },
    {
      icon: Clock,
      label: '今日手工补录',
      value: todayManual,
      color: 'from-industrial-orange to-amber-500',
      bgColor: 'bg-industrial-orange/10',
      textColor: 'text-industrial-orange',
      trend: todayManual > 0 ? '!' : '→',
      trendText: todayManual > 0 ? '已补录' : '无补录',
    },
    {
      icon: FileWarning,
      label: '待匹配合同',
      value: pendingRecords,
      color: 'from-industrial-gray to-slate-500',
      bgColor: 'bg-industrial-gray/10',
      textColor: 'text-industrial-gray',
      trend: pendingRecords > 3 ? '↑' : '→',
      trendText: `${pendingContracts} 份待关联`,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-industrial p-5 border border-gray-100 hover:shadow-industrial-lg transition-shadow duration-300"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="mt-2 text-4xl font-mono font-bold bg-gradient-to-r bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}>
                <span className={`bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </span>
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-sm font-bold ${
                  stat.trend === '↑' ? 'text-industrial-red' :
                  stat.trend === '!' ? 'text-industrial-orange' : 'text-industrial-green'
                }`}>
                  {stat.trend}
                </span>
                <span className="text-xs text-gray-400">{stat.trendText}</span>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon size={24} className={stat.textColor} />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">总计</span>
              <span className="font-mono font-medium text-gray-600">
                {index === 0 && `${activeRecords.length} 条历史记录`}
                {index === 1 && `${activeRecords.filter(r => r.status === 'abnormal').length} 条历史异常`}
                {index === 2 && `${activeRecords.filter(r => r.status === 'manual').length} 条历史补录`}
                {index === 3 && `${contracts.length} 份合同文件`}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
