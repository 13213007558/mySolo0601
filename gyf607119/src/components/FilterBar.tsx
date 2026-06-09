import { Filter, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useGateStore } from '../store/useGateStore';
import { FilterType } from '../types';
import { cn } from '@/lib/utils';

const filters: { key: FilterType; label: string; icon: typeof Filter }[] = [
  { key: 'all', label: '全部', icon: Filter },
  { key: 'normal', label: '正常', icon: CheckCircle },
  { key: 'abnormal', label: '异常', icon: AlertTriangle },
  { key: 'pending', label: '待巡检', icon: Clock },
];

export function FilterBar() {
  const { filter, setFilter } = useGateStore();

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm text-industrial-gray-600 font-medium mr-2">状态筛选：</span>
      {filters.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setFilter(key)}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 border-2 font-medium transition-all duration-150',
            filter === key
              ? 'bg-industrial-blue-500 border-industrial-blue-600 text-white'
              : 'bg-white border-industrial-gray-300 text-industrial-gray-700 hover:bg-industrial-gray-50'
          )}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
