import { Search, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { useRecordStore } from '../store/useRecordStore';
import { STATUS_LABEL } from '../utils/format';
import type { RecordStatus, FilterOptions } from '../types';
import { useMemo, useState } from 'react';

export function FilterBar() {
  const { filters, setFilters, resetFilters, records } = useRecordStore();
  const [collapsed, setCollapsed] = useState(false);

  const handlers = useMemo(
    () => Array.from(new Set(records.map((r) => r.handler))).sort(),
    [records],
  );

  const statusOptions: Array<{ value: RecordStatus | 'all' | 'exclude_bad'; label: string }> = [
    { value: 'exclude_bad', label: '排除坏数据' },
    { value: 'all', label: '全部状态' },
    { value: 'pending', label: STATUS_LABEL.pending },
    { value: 'promised', label: STATUS_LABEL.promised },
    { value: 'rescheduled', label: STATUS_LABEL.rescheduled },
    { value: 'completed', label: STATUS_LABEL.completed },
    { value: 'cancelled', label: STATUS_LABEL.cancelled },
    { value: 'bad_data', label: STATUS_LABEL.bad_data },
  ];

  const hasActive =
    filters.status !== 'exclude_bad' ||
    filters.handler ||
    filters.keyword ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.showBadData;

  return (
    <div className="card p-4 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-ink-500" />
          <span className="text-sm font-semibold text-ink-700">筛选条件</span>
          {hasActive && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[11px] text-amber-600 hover:text-amber-700 font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              重置
            </button>
          )}
        </div>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-ink-400 hover:text-ink-600"
        >
          {collapsed ? <X className="w-4 h-4" /> : <X className="w-4 h-4 rotate-45" />}
        </button>
      </div>

      {!collapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <label className="label">关键词搜索</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                className="input pl-9"
                placeholder="姓名 / 电话 / 来源文件 / 备注..."
                value={filters.keyword}
                onChange={(e) => setFilters({ keyword: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">状态</label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) =>
                setFilters({
                  status: e.target.value as FilterOptions['status'],
                })
              }
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">处理人</label>
            <select
              className="input"
              value={filters.handler}
              onChange={(e) => setFilters({ handler: e.target.value })}
            >
              <option value="">全部处理人</option>
              {handlers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">包含坏数据</label>
            <label className="inline-flex items-center gap-2 text-sm text-ink-700 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={filters.showBadData}
                onChange={(e) => setFilters({ showBadData: e.target.checked })}
                className="w-4 h-4 accent-amber-500"
              />
              展示已标记的坏数据行（灰显）
            </label>
          </div>

          <div>
            <label className="label">原承诺日期（起）</label>
            <input
              type="date"
              className="input"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ dateFrom: e.target.value })}
            />
          </div>

          <div>
            <label className="label">原承诺日期（止）</label>
            <input
              type="date"
              className="input"
              value={filters.dateTo}
              onChange={(e) => setFilters({ dateTo: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
