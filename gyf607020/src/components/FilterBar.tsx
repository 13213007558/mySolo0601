import { Search, RotateCcw, Download, Phone, Calendar, Filter } from 'lucide-react';
import { useStore, buildQuery } from '@/store/useStore';
import type { RecordStatus } from '@shared/types';

const statusOptions: { value: RecordStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待复核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'bad_data', label: '坏数据' },
];

export default function FilterBar({ onExport }: { onExport: () => void }) {
  const { filters, setFilters, resetFilters, normalCount, fetchRecords } = useStore();

  return (
    <div className="bg-white rounded-card p-5 shadow-card border border-cream-200 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-brand-500" />
        <h3 className="font-serif font-medium text-gray-800">筛选条件</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-xs text-gray-500 flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" />
            家长手机号
          </label>
          <input
            type="text"
            value={filters.phone || ''}
            placeholder="输入手机号搜索，支持模糊匹配"
            onChange={(e) => setFilters({ phone: e.target.value })}
            className="w-full px-3 py-2 border border-cream-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all bg-cream-50/50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">状态</label>
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ status: (e.target.value as RecordStatus) || undefined })}
            className="w-full px-3 py-2 border border-cream-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all bg-cream-50/50 appearance-none"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
              {o.label}
            </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            开始日期
          </label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => setFilters({ startDate: e.target.value })}
            className="w-full px-3 py-2 border border-cream-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all bg-cream-50/50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">结束日期</label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => setFilters({ endDate: e.target.value })}
            className="w-full px-3 py-2 border border-cream-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all bg-cream-50/50"
          />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-4 flex-wrap">
        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!filters.includeBadData}
            onChange={(e) => setFilters({ includeBadData: e.target.checked })}
            className="w-4 h-4 text-brand-500 border-cream-300 rounded focus:ring-brand-400"
          />
          包含坏数据（已隔离）
        </label>
        <div className="flex-1" />
        <button
          onClick={resetFilters}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-cream-300 text-gray-600 hover:bg-cream-100 hover:text-gray-800 text-sm transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          重置
        </button>
        <button
          onClick={() => fetchRecords()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-400 text-white shadow hover:bg-brand-500 hover:-translate-y-0.5 hover:shadow-md text-sm font-medium transition-all"
        >
          <Search className="w-4 h-4" />
          查询
        </button>
        <button
          onClick={onExport}
          disabled={normalCount === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500 text-white shadow hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-md text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          <Download className="w-4 h-4" />
          导出家长交接表（{normalCount} 条）
        </button>
      </div>
    </div>
  );
}

export { buildQuery };
