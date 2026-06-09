import React, { useState, useMemo, useCallback } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
} from 'recharts';
import { useShadowStore } from '@/store/useShadowStore';
import { DEFAULT_THRESHOLD } from '@/utils/mockData';
import { TrendingDown, Sun, CloudRain } from 'lucide-react';

interface ChartDataPoint {
  date: string;
  avgShadowHours: number;
  avgEfficiency: number;
  recordCount: number;
  dangerCount: number;
  warningCount: number;
}

export const RangeChart: React.FC = () => {
  const { records, filterRange, setFilterRange, thresholdConfig } = useShadowStore();
  const [brushStartIndex, setBrushStartIndex] = useState<number | null>(null);
  const [brushEndIndex, setBrushEndIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    const activeRecords = records.filter(r => !r.isDeleted);
    const dateMap = new Map<string, {
      shadowSum: number;
      efficiencySum: number;
      count: number;
      dangerCount: number;
      warningCount: number;
    }>();

    activeRecords.forEach(record => {
      const existing = dateMap.get(record.recordDate) || {
        shadowSum: 0,
        efficiencySum: 0,
        count: 0,
        dangerCount: 0,
        warningCount: 0,
      };
      existing.shadowSum += record.shadowHours;
      existing.efficiencySum += record.powerEfficiency;
      existing.count += 1;
      if (record.status === 'danger') existing.dangerCount += 1;
      if (record.status === 'warning') existing.warningCount += 1;
      dateMap.set(record.recordDate, existing);
    });

    const data: ChartDataPoint[] = [];
    const sortedDates = Array.from(dateMap.keys()).sort();
    
    sortedDates.forEach(date => {
      const d = dateMap.get(date)!;
      data.push({
        date: date.slice(5),
        avgShadowHours: Math.round((d.shadowSum / d.count) * 10) / 10,
        avgEfficiency: Math.round((d.efficiencySum / d.count) * 10) / 10,
        recordCount: d.count,
        dangerCount: d.dangerCount,
        warningCount: d.warningCount,
      });
    });

    return data;
  }, [records]);

  const handleBrushChange = useCallback((brushData: { startIndex?: number; endIndex?: number }) => {
    if (brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      setBrushStartIndex(brushData.startIndex);
      setBrushEndIndex(brushData.endIndex);
      
      const allDates = Array.from(new Set(records.filter(r => !r.isDeleted).map(r => r.recordDate))).sort();
      const startDate = allDates[brushData.startIndex];
      const endDate = allDates[brushData.endIndex];
      
      if (startDate && endDate) {
        setFilterRange({ start: startDate, end: endDate });
      }
    }
  }, [records, setFilterRange]);

  const handleClearFilter = () => {
    setFilterRange(null);
    setBrushStartIndex(null);
    setBrushEndIndex(null);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      return (
        <div className="bg-white border-2 border-primary-200 rounded-lg shadow-xl p-3 min-w-[200px]">
          <p className="font-mono text-sm font-semibold text-primary-800 mb-2">2026-{label}</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1 text-gray-600">
                <CloudRain size={12} className="text-warning-500" />
                平均阴影
              </span>
              <span className="font-mono font-semibold text-warning-600">{data.avgShadowHours}h</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1 text-gray-600">
                <Sun size={12} className="text-success-500" />
                平均效率
              </span>
              <span className="font-mono font-semibold text-success-600">{data.avgEfficiency}%</span>
            </div>
            <div className="border-t border-gray-100 pt-1.5 mt-1.5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">屋顶总数</span>
                <span className="font-mono text-gray-700">{data.recordCount}</span>
              </div>
              {data.dangerCount > 0 && (
                <div className="flex items-center justify-between gap-4 text-danger-600">
                  <span>危险状态</span>
                  <span className="font-mono font-semibold">{data.dangerCount}</span>
                </div>
              )}
              {data.warningCount > 0 && (
                <div className="flex items-center justify-between gap-4 text-warning-600">
                  <span>警告状态</span>
                  <span className="font-mono font-semibold">{data.warningCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border-2 border-primary-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-primary-800">阴影趋势分析</h3>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-warning-400"></span>
              阴影时长
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-success-500"></span>
              发电效率
            </span>
          </div>
        </div>
        {filterRange && (
          <button
            onClick={handleClearFilter}
            className="flex items-center gap-1 px-3 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            清除筛选 ({filterRange.start} ~ {filterRange.end})
          </button>
        )}
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 40, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="shadowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#d1d5db' }}
              interval="preserveStartEnd"
            />
            
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: '#f59e0b' }}
              tickLine={false}
              axisLine={{ stroke: '#fcd34d' }}
              domain={[0, 'auto']}
              label={{ value: '小时', angle: -90, position: 'insideLeft', style: { fill: '#f59e0b', fontSize: 11 } }}
            />
            
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: '#10b981' }}
              tickLine={false}
              axisLine={{ stroke: '#6ee7b7' }}
              domain={[0, 100]}
              label={{ value: '效率%', angle: 90, position: 'insideRight', style: { fill: '#10b981', fontSize: 11 } }}
            />

            <ReferenceLine
              yAxisId="left"
              y={thresholdConfig.warningShadowHours}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              strokeWidth={1}
              label={{ value: `警戒${thresholdConfig.warningShadowHours}h`, position: 'insideTopRight', fill: '#f59e0b', fontSize: 10 }}
            />
            
            <ReferenceLine
              yAxisId="left"
              y={thresholdConfig.dangerShadowHours}
              stroke="#ef4444"
              strokeDasharray="5 5"
              strokeWidth={1}
              label={{ value: `红线${thresholdConfig.dangerShadowHours}h`, position: 'insideTopLeft', fill: '#ef4444', fontSize: 10 }}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '5 5' }} />

            <Bar
              yAxisId="left"
              dataKey="avgShadowHours"
              fill="url(#shadowGradient)"
              stroke="#f59e0b"
              strokeWidth={2}
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            />
            
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgEfficiency"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 6, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
            />

            <Brush
              dataKey="date"
              height={30}
              stroke="#365d8f"
              fill="#f0f4f9"
              startIndex={brushStartIndex ?? 0}
              endIndex={brushEndIndex ?? chartData.length - 1}
              onChange={handleBrushChange}
              travellerWidth={12}
            >
              <ComposedChart>
                <Bar dataKey="avgShadowHours" fill="#b8c9df" maxBarSize={8} />
              </ComposedChart>
            </Brush>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {filterRange && (
        <div className="mt-3 p-2 bg-primary-50 rounded border border-primary-100 flex items-center gap-2 text-xs text-primary-700">
          <TrendingDown size={14} />
          <span>当前筛选区间：{filterRange.start} 至 {filterRange.end}，数据已自动同步到下方表格</span>
        </div>
      )}
    </div>
  );
};
