import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { useReconciliationStore } from '@/store/useReconciliationStore';
import { formatAmount } from '@/utils/formatters';
import { AlertCircle } from 'lucide-react';

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4', '#F97316'];

export const GunUsageChart = () => {
  const { gunInfos, chartFiltersApplied, unappliedFilterReasons } = useReconciliationStore();

  const data = gunInfos.map(gun => ({
    name: gun.gunNo,
    使用次数: gun.todayUsageCount,
    功率: gun.power / 10
  }));

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 relative overflow-hidden">
      {!chartFiltersApplied && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5" />
          图表未同步筛选
        </div>
      )}
      <h4 className="text-sm font-semibold text-white mb-4">枪号使用统计</h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
          <YAxis stroke="#94A3B8" fontSize={11} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontSize: '12px'
            }}
            labelStyle={{ color: '#F8FAFC' }}
          />
          <Bar dataKey="使用次数" fill="#F97316" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const AmountTrendChart = () => {
  const { filteredFlows, chartFiltersApplied } = useReconciliationStore();

  const dateMap = new Map<string, { amount: number; count: number }>();
  filteredFlows.forEach(flow => {
    const date = flow.transactionTime.split(' ')[0];
    const existing = dateMap.get(date) || { amount: 0, count: 0 };
    dateMap.set(date, {
      amount: existing.amount + flow.amount,
      count: existing.count + 1
    });
  });

  const data = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      name: date.slice(5),
      金额: value.amount,
      笔数: value.count
    }));

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 relative overflow-hidden">
      {!chartFiltersApplied && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5" />
          图表未同步筛选
        </div>
      )}
      <h4 className="text-sm font-semibold text-white mb-4">金额趋势</h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
          <YAxis stroke="#94A3B8" fontSize={11} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontSize: '12px'
            }}
            labelStyle={{ color: '#F8FAFC' }}
            formatter={(value: number) => [formatAmount(value), '金额']}
          />
          <Line
            type="monotone"
            dataKey="金额"
            stroke="#06B6D4"
            strokeWidth={2}
            dot={{ fill: '#06B6D4', r: 4 }}
            activeDot={{ r: 6, fill: '#06B6D4' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const AnomalyPieChart = () => {
  const { filteredFlows, chartFiltersApplied } = useReconciliationStore();

  const statusCount = filteredFlows.reduce((acc, flow) => {
    acc[flow.status] = (acc[flow.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = [
    { name: '正常', value: statusCount.normal || 0 },
    { name: '异常', value: statusCount.anomaly || 0 },
    { name: '待处理', value: statusCount.pending || 0 }
  ].filter(d => d.value > 0);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 relative overflow-hidden">
      {!chartFiltersApplied && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5" />
          图表未同步筛选
        </div>
      )}
      <h4 className="text-sm font-semibold text-white mb-4">异常占比</h4>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.name === '正常' ? '#10B981' : entry.name === '异常' ? '#EF4444' : '#F59E0B'}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontSize: '12px'
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px' }}
            formatter={(value) => <span className="text-slate-300">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ChartsRow = () => {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <GunUsageChart />
      <AmountTrendChart />
      <AnomalyPieChart />
    </div>
  );
};
