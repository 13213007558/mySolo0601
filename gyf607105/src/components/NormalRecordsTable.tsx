import React, { useMemo } from 'react';
import {
  ArrowUpDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react';
import { useBracketStore } from '@/store/useBracketStore';
import { RecordRow } from './RecordRow';
import { StatusFeedback } from './StatusFeedback';

export const NormalRecordsTable: React.FC = () => {
  const normalRecords = useBracketStore((state) => state.normalRecords);
  const filterParams = useBracketStore((state) => state.filterParams);
  const updateFilterParams = useBracketStore((state) => state.updateFilterParams);
  const pageStatus = useBracketStore((state) => state.pageStatus);

  const filteredRecords = useMemo(() => {
    return normalRecords.filter((record) => {
      if (filterParams.bracketId && !record.bracketNo.toLowerCase().includes(filterParams.bracketId.toLowerCase())) {
        return false;
      }
      if (filterParams.status && record.status !== filterParams.status) {
        return false;
      }
      if (filterParams.handler && !record.handler.includes(filterParams.handler)) {
        return false;
      }
      if (filterParams.dateFrom && record.processDate < filterParams.dateFrom) {
        return false;
      }
      if (filterParams.dateTo && record.processDate > filterParams.dateTo) {
        return false;
      }
      return true;
    });
  }, [normalRecords, filterParams]);

  const sortedRecords = useMemo(() => {
    const sorted = [...filteredRecords];
    const { sortBy, sortOrder } = filterParams;
    sorted.sort((a, b) => {
      let aVal = a[sortBy as keyof typeof a];
      let bVal = b[sortBy as keyof typeof b];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
    return sorted;
  }, [filteredRecords, filterParams.sortBy, filterParams.sortOrder]);

  const totalPages = Math.ceil(sortedRecords.length / filterParams.pageSize);
  const startIndex = (filterParams.page - 1) * filterParams.pageSize;
  const paginatedRecords = sortedRecords.slice(startIndex, startIndex + filterParams.pageSize);

  const handleSort = (field: string) => {
    const newOrder = filterParams.sortBy === field && filterParams.sortOrder === 'asc' ? 'desc' : 'asc';
    updateFilterParams({ sortBy: field, sortOrder: newOrder });
  };

  const SortHeader = ({ field, label }: { field: string; label: string }) => (
    <th
      className="px-4 py-3 text-left text-xs font-mono font-medium text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 transition-colors ${
          filterParams.sortBy === field ? 'text-[#f59e0b]' : 'text-slate-400'
        }`} />
      </div>
    </th>
  );

  if (pageStatus === 'only_problem') {
    return (
      <StatusFeedback status="only_problem" />
    );
  }

  if (paginatedRecords.length === 0 && filteredRecords.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center text-slate-500">
          <p className="font-mono text-sm">暂无匹配的正常记录</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-auto flex-1">
        <table className="w-full">
          <thead className="bg-slate-100 sticky top-0 z-10 border-b-2 border-slate-200">
            <tr>
              <SortHeader field="bracketNo" label="支架编号" />
              <SortHeader field="installDate" label="安装日期" />
              <SortHeader field="location" label="位置" />
              <SortHeader field="currentAngle" label="当前角度" />
              <SortHeader field="handler" label="处理人" />
              <SortHeader field="processDate" label="处理日期" />
              <SortHeader field="status" label="状态" />
              <SortHeader field="version" label="版本" />
              <th className="px-4 py-3 text-right text-xs font-mono font-medium text-slate-600 uppercase tracking-wider w-20">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {paginatedRecords.map((record, index) => (
              <RecordRow
                key={record.id}
                record={record}
                index={index}
              />
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200">
          <div className="text-sm text-slate-500 font-mono">
            共 {sortedRecords.length} 条记录，第 {filterParams.page} / {totalPages} 页
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => updateFilterParams({ page: 1 })}
              disabled={filterParams.page === 1}
              className="p-1.5 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => updateFilterParams({ page: filterParams.page - 1 })}
              disabled={filterParams.page === 1}
              className="p-1.5 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="px-3 text-sm font-mono text-slate-700">
              {filterParams.page}
            </span>
            <button
              onClick={() => updateFilterParams({ page: filterParams.page + 1 })}
              disabled={filterParams.page === totalPages}
              className="p-1.5 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => updateFilterParams({ page: totalPages })}
              disabled={filterParams.page === totalPages}
              className="p-1.5 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
          <select
            value={filterParams.pageSize}
            onChange={(e) => updateFilterParams({ pageSize: Number(e.target.value), page: 1 })}
            className="ml-2 text-sm border border-slate-300 rounded px-2 py-1 font-mono"
          >
            <option value={5}>5条/页</option>
            <option value={10}>10条/页</option>
            <option value={20}>20条/页</option>
            <option value={50}>50条/页</option>
          </select>
        </div>
      )}
    </div>
  );
};
