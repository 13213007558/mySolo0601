import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
  Cell,
} from 'recharts';
import { TrendingUp, AlertTriangle, Download } from 'lucide-react';
import { useForecastStore } from '../store/useForecastStore';
import { generateChartData } from '../data/mockData';
import { exportChartData } from '../utils/export';

export const ForecastChart = () => {
  const { chartRecordId, records } = useForecastStore();

  const selectedRecord = useMemo(
    () => records.find(r => r.id === chartRecordId),
    [records, chartRecordId]
  );

  const hasRevised = selectedRecord?.revisedValue !== undefined;
  const chartData = useMemo(() => generateChartData(hasRevised), [hasRevised]);

  const handleExportChart = () => {
    exportChartData(chartData, selectedRecord?.deviceName || '负荷曲线');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const deviation = payload.find((p: any) => p.dataKey === 'deviation');
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium text-slate-700 mb-2">{label}:00</p>
          {payload.map((entry: any, index: number) => {
            if (entry.dataKey === 'deviation') return null;
            return (
              <p key={index} className="text-xs" style={{ color: entry.color }}>
                {entry.name}: {entry.value.toFixed(2)} MW
              </p>
            );
          })}
          {deviation && (
            <p className={`text-xs mt-1 font-medium ${
              Math.abs(deviation.value) > 5 ? 'text-red-600' : 
              Math.abs(deviation.value) > 3 ? 'text-orange-600' : 'text-green-600'
            }`}>
              偏差: {deviation.value > 0 ? '+' : ''}{deviation.value.toFixed(2)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg mx-6 mt-4 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <TrendingUp size={20} className="text-blue-600" />
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              {selectedRecord ? `${selectedRecord.deviceName} - 负荷曲线对比` : '负荷预测曲线对比'}
            </h3>
            {selectedRecord && (
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedRecord.revisedValue ? (
                  <span className="inline-flex items-center gap-1">
                    <AlertTriangle size={12} className="text-orange-500" />
                    已补录日前预测修正，偏差率 {selectedRecord.deviationRate > 0 ? '+' : ''}{selectedRecord.deviationRate.toFixed(2)}%
                  </span>
                ) : (
                  <span>原始预测偏差率 {selectedRecord.deviationRate > 0 ? '+' : ''}{selectedRecord.deviationRate.toFixed(2)}%</span>
                )}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">点击列表行查看对应曲线</span>
          <button
            onClick={handleExportChart}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded transition-colors"
          >
            <Download size={14} />
            导出曲线数据
          </button>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => `${v}:00`}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              label={{ value: 'MW', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
              iconType="line"
            />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />

            <Line
              type="monotone"
              dataKey="forecast"
              name="原始预测"
              stroke="#165DFF"
              strokeWidth={2}
              dot={false}
              animationDuration={800}
            />

            {hasRevised && (
              <Line
                type="monotone"
                dataKey="revised"
                name="日前预测修正"
                stroke="#FF7D00"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={false}
                animationDuration={800}
              />
            )}

            <Line
              type="monotone"
              dataKey="actual"
              name="实际曲线"
              stroke="#64748b"
              strokeWidth={2}
              dot={false}
              animationDuration={800}
            />

            <Scatter dataKey="actual" name="偏差点">
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={Math.abs(entry.deviation) > 5 ? '#F53F3F' : 'transparent'}
                  r={Math.abs(entry.deviation) > 5 ? 4 : 0}
                />
              ))}
            </Scatter>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-2 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-blue-600" />
          <span className="text-xs text-slate-600">原始预测</span>
        </div>
        {hasRevised && (
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-orange-500" style={{ borderStyle: 'dashed', borderTopWidth: 2 }} />
            <span className="text-xs text-slate-600">日前预测修正</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-slate-500" />
          <span className="text-xs text-slate-600">实际曲线</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs text-slate-600">偏差超±5%</span>
        </div>
      </div>
    </div>
  );
};
