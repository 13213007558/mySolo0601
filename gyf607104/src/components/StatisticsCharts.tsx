import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, AlertTriangle, BarChart3 } from 'lucide-react';
import { useFilteredChartData } from '@/hooks/useFilteredChartData';

const COLORS = ['#E94560', '#FFC93C', '#16C79A', '#0F3460'];

export const StatisticsCharts: React.FC = () => {
  const {
    trendData,
    statusData,
    levelSummary,
    summaryStats,
    hasAnomaly,
    isFilterApplied,
    filteredCount,
    totalCount,
    anomalyMessage,
  } = useFilteredChartData();
  
  return (
    <div className="space-y-4">
      {hasAnomaly && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg animate-pulse-slow">
          <div className="flex items-center gap-2 text-yellow-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{anomalyMessage}</p>
          </div>
          <p className="text-xs text-yellow-600 mt-1">
            当前筛选返回 {filteredCount} 条记录（共 {totalCount} 条），图表已自动切换至全量数据展示。
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="总记录数"
          value={summaryStats.total}
          icon={<BarChart3 className="w-5 h-5" />}
          color="primary"
          subtext={isFilterApplied ? `筛选后 ${filteredCount} 条` : ''}
        />
        <StatCard
          title="已完成"
          value={summaryStats.completed}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
          subtext={`完成率 ${summaryStats.completionRate}%`}
        />
        <StatCard
          title="待处理"
          value={summaryStats.pending}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="orange"
          subtext={`处理中 ${summaryStats.processing} 条`}
        />
        <StatCard
          title="已补录"
          value={summaryStats.supplemented}
          icon={<PieChartIcon className="w-5 h-5" />}
          color="gold"
          subtext={`已撤回 ${summaryStats.withdrawn} 条`}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-primary-700 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              热斑检测趋势
            </h3>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-accent-orange"></span>
                严重 ({levelSummary.严重})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-accent-yellow"></span>
                中等 ({levelSummary.中等})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-accent-green"></span>
                轻微 ({levelSummary.轻微})
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSevere" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E94560" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E94560" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFC93C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FFC93C" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMild" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16C79A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16C79A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="严重"
                  stroke="#E94560"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSevere)"
                  animationDuration={1000}
                />
                <Area
                  type="monotone"
                  dataKey="中等"
                  stroke="#FFC93C"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMedium)"
                  animationDuration={1000}
                />
                <Area
                  type="monotone"
                  dataKey="轻微"
                  stroke="#16C79A"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMild)"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card p-4">
          <h3 className="font-semibold text-lg text-primary-700 flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-primary-500" />
            状态分布
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={1000}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} 条`, '数量']}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {statusData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-gray-600">{item.name}:</span>
                <span className="font-medium text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'primary' | 'green' | 'orange' | 'gold';
  subtext?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtext }) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600 border-primary-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-accent-orange border-orange-200',
    gold: 'bg-amber-50 text-accent-gold border-amber-200',
  };
  
  return (
    <div className={`card p-4 border ${colorClasses[color]} animate-fade-in`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtext && <p className="text-xs opacity-70 mt-1">{subtext}</p>}
        </div>
        <div className="p-3 bg-white/50 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );
};
