import { Search, Filter, X } from 'lucide-react';
import { useAlarmStore } from '@/store/useAlarmStore';
import type { AlarmStatus, ProcessStatus } from '@/types';
import { getStatusText, getProcessStatusText } from '@/utils/export';
import { cn } from '@/lib/utils';

const statusOptions: (AlarmStatus | 'all')[] = ['all', 'normal', 'abnormal', 'pending', 'resolved'];
const processOptions: (ProcessStatus | 'all')[] = ['all', 'received', 'processing', 'pending_review', 'completed', 'withdrawn'];

export const StatusFilter = () => {
  const { filterStatus, filterProcess, searchText, setFilterStatus, setFilterProcess, setSearchText } = useAlarmStore();

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索熔丝编号、位置、邮件..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-10 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-600">告警状态:</span>
          <div className="flex flex-wrap gap-1">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'rounded-md border px-3 py-1 text-xs font-medium transition-colors',
                  filterStatus === status
                    ? 'border-blue-700 bg-blue-700 text-white'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600'
                )}
              >
                {status === 'all' ? '全部' : getStatusText(status)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">处理进度:</span>
        <div className="flex flex-wrap gap-1">
          {processOptions.map((status) => (
            <button
              key={status}
              onClick={() => setFilterProcess(status)}
              className={cn(
                'rounded-md border px-3 py-1 text-xs font-medium transition-colors',
                filterProcess === status
                  ? 'border-amber-600 bg-amber-600 text-white'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600'
              )}
            >
              {status === 'all' ? '全部' : getProcessStatusText(status)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
