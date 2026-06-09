import { Search, Filter, X } from 'lucide-react';
import { useForecastStore } from '../store/useForecastStore';
import { statusLabels } from '../data/mockData';

export const FilterPanel = () => {
  const { filters, setFilters, resetFilters, getFilteredRecords } = useForecastStore();
  const filteredCount = getFilteredRecords().length;

  const hasActiveFilters = filters.deviceNo || filters.status || 
    filters.isAbnormal !== null || filters.hasStatusConflict !== null;

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-700">筛选条件</span>
          <span className="text-xs text-slate-400 ml-1">
            (共 {filteredCount} 条记录)
          </span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X size={14} />
            清除筛选
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            placeholder="设备编号..."
            value={filters.deviceNo}
            onChange={(e) => setFilters({ deviceNo: e.target.value })}
            className="w-36 px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">状态:</span>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value })}
            className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors bg-white"
          >
            <option value="">全部</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">异常标记:</span>
          <select
            value={filters.isAbnormal === null ? '' : String(filters.isAbnormal)}
            onChange={(e) => {
              const val = e.target.value;
              setFilters({ isAbnormal: val === '' ? null : val === 'true' });
            }}
            className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors bg-white"
          >
            <option value="">全部</option>
            <option value="true">异常</option>
            <option value="false">正常</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">状态冲突:</span>
          <select
            value={filters.hasStatusConflict === null ? '' : String(filters.hasStatusConflict)}
            onChange={(e) => {
              const val = e.target.value;
              setFilters({ hasStatusConflict: val === '' ? null : val === 'true' });
            }}
            className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors bg-white"
          >
            <option value="">全部</option>
            <option value="true">有冲突</option>
            <option value="false">无冲突</option>
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded">
            <span className="w-2 h-2 bg-orange-500 rounded-full" />
            客服回访异常
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded">
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            多人修改冲突
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            手工补录修正
          </span>
        </div>
      </div>
    </div>
  );
};
