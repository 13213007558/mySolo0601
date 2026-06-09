import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useValveStore } from '@/store/valveStore';
import { useViewStore } from '@/store/viewStore';
import AnomalyFeedback from './AnomalyFeedback';
import { RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';

export default function TrendChart() {
  const { filteredRecords } = useValveStore();
  const { anomalyState, chartSyncState, updateChartRenderTimestamp, setChartSyncState, setAnomalyState } = useViewStore();

  const chartData = useMemo(() => {
    const grouped: Record<string, { date: string; avgOpening: number; avgTemp: number; avgPressure: number; count: number; abnormalCount: number }> = {};

    filteredRecords.forEach(record => {
      if (!grouped[record.recordDate]) {
        grouped[record.recordDate] = {
          date: record.recordDate.slice(5),
          avgOpening: 0,
          avgTemp: 0,
          avgPressure: 0,
          count: 0,
          abnormalCount: 0,
        };
      }
      grouped[record.recordDate].avgOpening += record.opening;
      grouped[record.recordDate].avgTemp += record.temperature;
      grouped[record.recordDate].avgPressure += record.pressure;
      grouped[record.recordDate].count += 1;
      if (record.status === 'abnormal') {
        grouped[record.recordDate].abnormalCount += 1;
      }
    });

    return Object.values(grouped)
      .map(g => ({
        ...g,
        avgOpening: Math.round(g.avgOpening / g.count),
        avgTemp: Math.round(g.avgTemp / g.count),
        avgPressure: Number((g.avgPressure / g.count).toFixed(1)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10);
  }, [filteredRecords]);

  const handleRefresh = () => {
    updateChartRenderTimestamp();
    setChartSyncState('synced');
    setAnomalyState(null);
  };

  const isOutdated = chartSyncState === 'outdated';

  return (
    <div className="bg-white rounded-lg shadow-industrial border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary-500" />
          趋势分析图表
        </h3>
        <div className="flex items-center gap-2">
          {isOutdated && (
            <span className="text-xs text-industrial-orange bg-industrial-orange/10 px-2 py-1 rounded flex items-center gap-1">
              <AlertCircle size={12} />
              数据待更新
            </span>
          )}
          <button
            onClick={handleRefresh}
            className={`p-1.5 rounded transition-all ${
              isOutdated
                ? 'bg-industrial-orange text-white hover:bg-industrial-orange/90'
                : 'text-gray-400 hover:text-primary-500 hover:bg-gray-100'
            }`}
            title="刷新图表"
          >
            <RefreshCw size={16} className={isOutdated ? 'animate-spin-slow' : ''} />
          </button>
        </div>
      </div>

      {anomalyState === 'chart_not_sync' && (
        <div className="px-4 pt-4">
          <AnomalyFeedback type="chart_not_sync" />
        </div>
      )}

      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/30">
            <h4 className="text-xs font-medium text-gray-500 mb-3">平均开度 & 温度趋势</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="avgOpening"
                  name="平均开度(%)"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgTemp"
                  name="平均温度(°C)"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ fill: '#ef4444', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/30">
            <h4 className="text-xs font-medium text-gray-500 mb-3">压力分布 & 异常统计</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar
                  dataKey="avgPressure"
                  name="平均压力(MPa)"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="abnormalCount"
                  name="异常记录数"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-4 border border-gray-100 rounded-lg p-3 bg-gray-50/30">
          <h4 className="text-xs font-medium text-gray-500 mb-3">阀门开度分布趋势</h4>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorOpening" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="avgOpening"
                stroke="#1e3a5f"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorOpening)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {chartData.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            暂无数据，请调整筛选条件
          </div>
        )}
      </div>
    </div>
  );
}
