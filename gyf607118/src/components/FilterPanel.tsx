import { X, Search, Filter } from 'lucide-react';
import { useBatteryStore } from '../store/batteryStore';
import type { RecordStatus } from '../types';

export const FilterPanel = () => {
  const { filters, setFilters, clearFilters } = useBatteryStore();

  const hasActiveFilters =
    filters.batteryNo ||
    filters.status ||
    filters.dateRange.start ||
    filters.dateRange.end ||
    filters.isAnomaly !== null ||
    filters.hasFormatIssue !== null;

  return (
    <div className="card-industrial">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary-400" />
          <h3 className="font-semibold text-industrial-100">筛选条件</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-industrial-300 hover:text-warning-400 transition-colors"
          >
            <X className="w-3 h-3" />
            清除全部
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-industrial-300 mb-1">电池编号</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-industrial-300" />
            <input
              type="text"
              value={filters.batteryNo}
              onChange={(e) => setFilters({ batteryNo: e.target.value })}
              placeholder="输入编号搜索..."
              className="input-industrial pl-9"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-industrial-300 mb-1">状态</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value as RecordStatus | '' })}
            className="input-industrial"
          >
            <option value="">全部状态</option>
            <option value="pending">待复核</option>
            <option value="normal">正常</option>
            <option value="anomaly">异常</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-industrial-300 mb-1">开始日期</label>
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) =>
                setFilters({ dateRange: { ...filters.dateRange, start: e.target.value } })
              }
              className="input-industrial"
            />
          </div>
          <div>
            <label className="block text-xs text-industrial-300 mb-1">结束日期</label>
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) =>
                setFilters({ dateRange: { ...filters.dateRange, end: e.target.value } })
              }
              className="input-industrial"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-industrial-300 mb-1">数据异常</label>
          <select
            value={filters.isAnomaly === null ? '' : String(filters.isAnomaly)}
            onChange={(e) =>
              setFilters({
                isAnomaly: e.target.value === '' ? null : e.target.value === 'true',
              })
            }
            className="input-industrial"
          >
            <option value="">全部</option>
            <option value="true">仅异常</option>
            <option value="false">仅正常</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-industrial-300 mb-1">编号格式</label>
          <select
            value={filters.hasFormatIssue === null ? '' : String(filters.hasFormatIssue)}
            onChange={(e) =>
              setFilters({
                hasFormatIssue: e.target.value === '' ? null : e.target.value === 'true',
              })
            }
            className="input-industrial"
          >
            <option value="">全部</option>
            <option value="true">有格式问题</option>
            <option value="false">格式正确</option>
          </select>
        </div>
      </div>
    </div>
  );
};
