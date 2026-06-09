import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useRecordStore } from '../store/useRecordStore';
import type { RecordStatus } from '../types';

const statusOptions: { value: RecordStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'normal', label: '正常' },
  { value: 'abnormal', label: '异常' },
  { value: 'crossday', label: '跨日' },
  { value: 'duplicate', label: '重复' },
  { value: 'manual', label: '补录' }
];

export const FilterPanel: React.FC = () => {
  const { filter, setFilter, records } = useRecordStore();

  const statusCounts = React.useMemo(() => {
    const counts: Record<RecordStatus, number> = {
      normal: 0,
      abnormal: 0,
      crossday: 0,
      duplicate: 0,
      manual: 0
    };
    records.forEach(r => {
      counts[r.status]++;
    });
    return counts;
  }, [records]);

  const handleStatusChange = (status: RecordStatus | 'all') => {
    if (status === 'all') {
      const { status: _, ...rest } = filter;
      setFilter(rest);
    } else {
      setFilter({ status });
    }
  };

  const handleGunCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      const { gunCode: _, ...rest } = filter;
      setFilter(rest);
    } else {
      setFilter({ gunCode: value });
    }
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    const currentRange = filter.dateRange || ['', ''];
    const newRange: [string, string] = [...currentRange];
    
    if (type === 'start') {
      newRange[0] = value;
    } else {
      newRange[1] = value;
    }

    if (!newRange[0] && !newRange[1]) {
      const { dateRange: _, ...rest } = filter;
      setFilter(rest);
    } else {
      setFilter({ dateRange: newRange });
    }
  };

  const clearFilters = () => {
    setFilter({});
  };

  const hasActiveFilters = filter.status || filter.gunCode || filter.dateRange;

  return (
    <div className="p-4 bg-bgdark-800/50 border-b border-bgdark-700">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-gray-400">
          <Filter size={16} />
          <span className="text-sm font-medium">筛选</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {statusOptions.map(option => {
            const isActive = filter.status === option.value || 
              (option.value === 'all' && !filter.status);
            const count = option.value === 'all' 
              ? records.length 
              : statusCounts[option.value as RecordStatus];
            
            return (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value as RecordStatus | 'all')}
                className={`px-3 py-1.5 text-sm border-2 transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-700 border-primary-500 text-white'
                    : 'bg-bgdark-700 border-bgdark-600 text-gray-300 hover:bg-bgdark-600'
                }`}
              >
                {option.label}
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-black/20 rounded">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="h-6 w-px bg-bgdark-600" />

        <div className="flex items-center gap-2">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="搜索枪编号..."
            value={filter.gunCode || ''}
            onChange={handleGunCodeChange}
            className="input-field w-40 py-1.5 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">日期范围:</label>
          <input
            type="date"
            value={filter.dateRange?.[0] || ''}
            onChange={(e) => handleDateChange('start', e.target.value)}
            className="input-field w-auto py-1.5 text-sm"
          />
          <span className="text-gray-500">至</span>
          <input
            type="date"
            value={filter.dateRange?.[1] || ''}
            onChange={(e) => handleDateChange('end', e.target.value)}
            className="input-field w-auto py-1.5 text-sm"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 transition-colors"
          >
            <X size={14} />
            清除筛选
          </button>
        )}
      </div>
    </div>
  );
};
