import React from 'react';
import { Search, Filter, X, Calendar, Wrench, User } from 'lucide-react';
import type { AcceptanceStatus } from '@/types';
import { ACCEPTANCE_STATUS_LABELS, WORK_TYPES } from '@/types';
import { useAcceptanceStore } from '@/store/acceptanceStore';

export const FilterPanel: React.FC = () => {
  const filter = useAcceptanceStore((state) => state.filter);
  const setFilter = useAcceptanceStore((state) => state.setFilter);
  const resetFilter = useAcceptanceStore((state) => state.resetFilter);
  const currentUser = useAcceptanceStore((state) => state.currentUser);
  const getFilteredRecords = useAcceptanceStore((state) => state.getFilteredRecords);

  const filteredCount = getFilteredRecords().length;

  const statusOptions: AcceptanceStatus[] = ['DRAFT', 'SUBMITTED', 'PENDING_EVIDENCE', 'REJECTED', 'ARCHIVABLE'];

  const toggleStatus = (status: AcceptanceStatus) => {
    const newStatus = filter.status.includes(status)
      ? filter.status.filter((s) => s !== status)
      : [...filter.status, status];
    setFilter({ status: newStatus });
  };

  const toggleWorkType = (workType: string) => {
    const newWorkTypes = filter.workType.includes(workType)
      ? filter.workType.filter((w) => w !== workType)
      : [...filter.workType, workType];
    setFilter({ workType: newWorkTypes });
  };

  const hasActiveFilters =
    filter.status.length > 0 ||
    filter.workType.length > 0 ||
    filter.keyword.trim() !== '' ||
    filter.dateRange !== null ||
    filter.onlyMyRecords;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-concealed-orange" />
          <h3 className="font-semibold text-gray-900">筛选条件</h3>
          <span className="text-xs text-gray-500">({filteredCount} 条)</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilter}
            className="text-xs text-concealed-orange hover:text-concealed-orange-dark flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            重置
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Search className="w-4 h-4 inline mr-1" />
          关键词搜索
        </label>
        <input
          type="text"
          value={filter.keyword}
          onChange={(e) => setFilter({ keyword: e.target.value })}
          placeholder="搜索项目名称、轴线、部位..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-concealed-orange focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          状态
        </label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                ${filter.status.includes(status)
                  ? 'bg-concealed-orange text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {ACCEPTANCE_STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Wrench className="w-4 h-4 inline mr-1" />
          工序类型
        </label>
        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
          {WORK_TYPES.map((workType) => (
            <button
              key={workType}
              onClick={() => toggleWorkType(workType)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors
                ${filter.workType.includes(workType)
                  ? 'bg-concealed-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {workType}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            开始日期
          </label>
          <input
            type="date"
            value={filter.dateRange?.[0] || ''}
            onChange={(e) => {
              const endDate = filter.dateRange?.[1] || '';
              setFilter({
                dateRange: e.target.value || endDate ? [e.target.value, endDate] as [string, string] : null
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-concealed-orange"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            结束日期
          </label>
          <input
            type="date"
            value={filter.dateRange?.[1] || ''}
            onChange={(e) => {
              const startDate = filter.dateRange?.[0] || '';
              setFilter({
                dateRange: startDate || e.target.value ? [startDate, e.target.value] as [string, string] : null
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-concealed-orange"
          />
        </div>
      </div>

      {currentUser && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <input
            type="checkbox"
            id="only-mine"
            checked={filter.onlyMyRecords}
            onChange={(e) => setFilter({ onlyMyRecords: e.target.checked })}
            className="w-4 h-4 text-concealed-orange rounded"
          />
          <label htmlFor="only-mine" className="text-sm text-gray-700 flex items-center gap-1">
            <User className="w-4 h-4" />
            只看我创建的
          </label>
        </div>
      )}
    </div>
  );
};
