import { Search, Filter, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import type { AuthStatus } from '@shared/types';
import { AUTH_STATUS_LABEL } from '@shared/types';

export default function FilterBar() {
  const { filters, setFilters, classes } = useAuthStore();
  const allStatuses: AuthStatus[] = ['pending', 'authorized', 'partial', 'revoked', 'expired', 'bad_data'];

  return (
    <div className="bg-white rounded-card shadow-card border border-cream-200 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mr-1">
          <Filter className="w-4 h-4" /> 筛选：
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="搜索婴幼儿姓名"
            value={filters.babyName || ''}
            onChange={(e) => setFilters({ babyName: e.target.value || undefined })}
            className="pl-8 pr-8 py-1.5 text-sm border border-cream-200 rounded-lg bg-cream-50 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300 w-44"
          />
          {filters.babyName && (
            <button
              onClick={() => setFilters({ babyName: undefined })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <select
          value={filters.className || ''}
          onChange={(e) => setFilters({ className: e.target.value || undefined })}
          className="py-1.5 px-3 text-sm border border-cream-200 rounded-lg bg-cream-50 focus:outline-none focus:ring-2 focus:ring-brand-200"
        >
          <option value="">全部班级</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={filters.status || ''}
          onChange={(e) => setFilters({ status: (e.target.value as AuthStatus) || undefined })}
          className="py-1.5 px-3 text-sm border border-cream-200 rounded-lg bg-cream-50 focus:outline-none focus:ring-2 focus:ring-brand-200"
        >
          <option value="">全部状态</option>
          {allStatuses.map((s) => (
            <option key={s} value={s}>
              {AUTH_STATUS_LABEL[s]}
            </option>
          ))}
        </select>

        <label className="inline-flex items-center gap-1.5 text-sm text-gray-600 select-none cursor-pointer py-1.5 px-2 rounded-lg hover:bg-cream-50">
          <input
            type="checkbox"
            checked={!!filters.includeBadData}
            onChange={(e) => setFilters({ includeBadData: e.target.checked || undefined })}
            className="accent-brand-500"
          />
          包含已隔离坏数据
        </label>
      </div>
    </div>
  );
}
