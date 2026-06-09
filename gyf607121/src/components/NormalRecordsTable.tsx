import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useMeterStore } from '@/store/useMeterStore';
import { MeterRecord } from '@/types';

const PAGE_SIZE = 10;

export default function NormalRecordsTable() {
  const normalRecords = useMeterStore((state) => state.normalRecords);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof MeterRecord>('importedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAndSortedRecords = useMemo(() => {
    let records = [...normalRecords];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      records = records.filter(
        (r) =>
          r.meterNo.toLowerCase().includes(term) ||
          String(r.reading).includes(term)
      );
    }

    records.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal instanceof Date && bVal instanceof Date) {
        return sortDirection === 'asc'
          ? aVal.getTime() - bVal.getTime()
          : bVal.getTime() - aVal.getTime();
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });

    return records;
  }, [normalRecords, searchTerm, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedRecords.length / PAGE_SIZE);
  const paginatedRecords = filteredAndSortedRecords.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSort = (field: keyof MeterRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const totalCalculated = normalRecords.reduce((sum, r) => sum + r.calculatedValue, 0);
  const totalRaw = normalRecords.reduce((sum, r) => sum + r.reading, 0);

  return (
    <div className="card overflow-hidden">
      <div className="p-5 border-b border-industrial-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-success" />
              正常记录
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              共 {normalRecords.length} 条 · 原始读数合计 {totalRaw.toLocaleString()} · 计算后合计{' '}
              <span className="text-status-success font-medium">
                {totalCalculated.toLocaleString('zh-CN', { maximumFractionDigits: 2 })} kWh
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="搜索电表编号..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-field pl-9 py-2 text-sm w-48"
              />
            </div>
            <button className="btn-secondary py-2 text-sm">
              <Filter className="w-4 h-4" />
              筛选
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="table-header">
                <button
                  onClick={() => handleSort('rowIndex')}
                  className="flex items-center gap-1 hover:text-gray-200 transition-colors"
                >
                  序号
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="table-header">
                <button
                  onClick={() => handleSort('meterNo')}
                  className="flex items-center gap-1 hover:text-gray-200 transition-colors"
                >
                  电表编号
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="table-header">
                <button
                  onClick={() => handleSort('reading')}
                  className="flex items-center gap-1 hover:text-gray-200 transition-colors"
                >
                  原始读数
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="table-header">
                <button
                  onClick={() => handleSort('multiplier')}
                  className="flex items-center gap-1 hover:text-gray-200 transition-colors"
                >
                  倍率
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="table-header">
                <button
                  onClick={() => handleSort('calculatedValue')}
                  className="flex items-center gap-1 hover:text-gray-200 transition-colors"
                >
                  计算后数值
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="table-header">
                <button
                  onClick={() => handleSort('readingTime')}
                  className="flex items-center gap-1 hover:text-gray-200 transition-colors"
                >
                  抄表时间
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="table-header">数据来源</th>
              <th className="table-header">操作人</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.length > 0 ? (
              paginatedRecords.map((record, index) => (
                <tr key={record.id} className="table-row group">
                  <td className="table-cell text-gray-500 font-mono text-xs">
                    {record.rowIndex ?? '-'}
                  </td>
                  <td className="table-cell font-mono text-primary-400 font-medium">
                    {record.meterNo}
                  </td>
                  <td className="table-cell font-mono-tabular text-right">
                    {record.reading.toLocaleString()}
                  </td>
                  <td className="table-cell font-mono-tabular text-right text-gray-400">
                    ×{record.multiplier}
                  </td>
                  <td className="table-cell font-mono-tabular text-right font-semibold text-status-success">
                    {record.calculatedValue.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="table-cell text-gray-400">
                    {format(record.readingTime, 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${
                      record.source === 'csv'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : record.source === 'excel'
                        ? 'bg-green-500/10 text-green-400 border-green-500/30'
                        : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                    }`}>
                      {record.source === 'csv' ? 'CSV' : record.source === 'excel' ? 'Excel' : '手工'}
                    </span>
                  </td>
                  <td className="table-cell text-gray-400">{record.operator}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="table-cell text-center py-12 text-gray-500">
                  {searchTerm ? '未找到匹配的记录' : '暂无正常记录，请先导入数据'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-industrial-border flex items-center justify-between">
          <p className="text-sm text-gray-500">
            显示 {(currentPage - 1) * PAGE_SIZE + 1} -{' '}
            {Math.min(currentPage * PAGE_SIZE, filteredAndSortedRecords.length)} 条，
            共 {filteredAndSortedRecords.length} 条
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-secondary py-1.5 px-3 text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-industrial-hover'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary py-1.5 px-3 text-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
