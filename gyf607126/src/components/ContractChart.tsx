import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, ComposedChart, Area } from 'recharts';
import { Calendar, TrendingUp } from 'lucide-react';
import { useContractStore } from '../store/contractStore';
import { DateRange } from '../types/contract';

const formatCurrency = (amount: number) => {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}亿`;
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}万`;
  }
  return amount.toString();
};

const monthLabels: Record<string, string> = {
  '2026-01': '1月',
  '2026-02': '2月',
  '2026-03': '3月',
  '2026-04': '4月',
  '2026-05': '5月',
  '2026-06': '6月',
  '2026-07': '7月',
};

export const ContractChart = () => {
  const [chartType, setChartType] = useState<'count' | 'amount' | 'both'>('both');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const getMonthlyStats = useContractStore((state) => state.getMonthlyStats);
  const filters = useContractStore((state) => state.filters);

  const monthlyData = useMemo(() => {
    const data = getMonthlyStats(filters.dateRange || dateRange || undefined);
    return data.map((d) => ({
      ...d,
      monthLabel: monthLabels[d.month] || d.month,
      amountDisplay: formatCurrency(d.amount),
    }));
  }, [getMonthlyStats, dateRange, filters.dateRange]);

  const totalAmount = monthlyData.reduce((sum, d) => sum + d.amount, 0);
  const totalCount = monthlyData.reduce((sum, d) => sum + d.count, 0);

  const quickRanges = [
    { label: '全部', range: null },
    { label: '近3个月', range: { start: '2026-04-01', end: '2026-06-30' } },
    { label: '近半年', range: { start: '2026-01-01', end: '2026-06-30' } },
  ];

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-slate-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name === 'count' ? '合同数量' : '合同金额'}:
              <span className="font-mono font-medium ml-2">
                {entry.name === 'amount' ? formatCurrency(entry.value) : `${entry.value} 份`}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card-industrial p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="section-title flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-energy-600" />
            月度合同趋势
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            共 {totalCount} 份合同，总金额 {formatCurrency(totalAmount)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
            {(['count', 'amount', 'both'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  chartType === type
                    ? 'bg-white text-energy-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {type === 'count' ? '数量' : type === 'amount' ? '金额' : '综合'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <Calendar className="w-4 h-4 text-slate-400 ml-2" />
            {quickRanges.map((r) => (
              <button
                key={r.label}
                onClick={() => {
                  setDateRange(r.range);
                  useContractStore.getState().setFilters({ dateRange: r.range });
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  (r.range === null && dateRange === null) ||
                  (r.range && dateRange && r.range.start === dateRange.start && r.range.end === dateRange.end)
                    ? 'bg-white text-energy-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-80 min-h-[320px] min-w-[800px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={800} minHeight={320}>
          {chartType === 'both' ? (
            <ComposedChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="monthLabel" stroke="#64748b" fontSize={12} />
              <YAxis yAxisId="left" stroke="#64748b" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="count" name="合同数量" fill="#0c81e7" radius={[4, 4, 0, 0]} opacity={0.8} />
              <Line yAxisId="right" type="monotone" dataKey="amount" name="合同金额" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} />
            </ComposedChart>
          ) : chartType === 'count' ? (
            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="monthLabel" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="合同数量" fill="#0c81e7" radius={[6, 6, 0, 0]} />
              <Area type="monotone" dataKey="count" fill="url(#colorCount)" stroke="none" />
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0c81e7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0c81e7" stopOpacity={0} />
                </linearGradient>
              </defs>
            </BarChart>
          ) : (
            <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="monthLabel" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="amount"
                name="合同金额"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', r: 5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
