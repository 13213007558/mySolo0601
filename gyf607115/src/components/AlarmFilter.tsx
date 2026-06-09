import { Search, Filter, RotateCcw, Calendar, Building2 } from 'lucide-react';
import { useAlarmStore } from '../stores/useAlarmStore';
import type { AlarmLevel, AlarmStatus } from '../types';
import { ALARM_LEVEL_LABELS, ALARM_STATUS_LABELS } from '../types';
import { SITES } from '../utils/mockData';
import { cn } from '../lib/utils';

interface AlarmFilterProps {
  className?: string;
}

export function AlarmFilter({ className }: AlarmFilterProps) {
  const { filters, setFilters, resetFilters } = useAlarmStore();

  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-white p-4 shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">筛选条件</span>
        </div>
        <button
          onClick={resetFilters}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          重置
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1.5 block">关键词搜索</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索告警编号、描述、设备..."
              value={filters.keyword}
              onChange={(e) => setFilters({ keyword: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 mb-1.5 block">告警级别</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilters({ level: 'all' })}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded border transition-all',
                filters.level === 'all'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              )}
            >
              全部
            </button>
            {(Object.keys(ALARM_LEVEL_LABELS) as AlarmLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setFilters({ level })}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded border transition-all',
                  filters.level === level
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                )}
              >
                {ALARM_LEVEL_LABELS[level]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 mb-1.5 block">处理状态</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilters({ status: 'all' })}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded border transition-all',
                filters.status === 'all'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              )}
            >
              全部
            </button>
            {(Object.keys(ALARM_STATUS_LABELS) as AlarmStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilters({ status })}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded border transition-all',
                  filters.status === status
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                )}
              >
                {ALARM_STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 mb-1.5 block">
            <Building2 className="inline h-3 w-3 mr-1" />
            站点名称
          </label>
          <select
            value={filters.siteName}
            onChange={(e) => setFilters({ siteName: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部站点</option>
            {SITES.map((site) => (
              <option key={site} value={site}>
                {site}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 mb-1.5 block">
            <Calendar className="inline h-3 w-3 mr-1" />
            时间范围
          </label>
          <div className="space-y-2">
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) =>
                setFilters({ dateRange: { ...filters.dateRange, start: e.target.value } })
              }
              placeholder="开始日期"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) =>
                setFilters({ dateRange: { ...filters.dateRange, end: e.target.value } })
              }
              placeholder="结束日期"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
