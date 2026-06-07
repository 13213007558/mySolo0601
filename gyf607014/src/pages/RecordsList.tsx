import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Filter, ChevronDown, ChevronUp, FileText, User,
  AlertCircle, ArrowRightLeft, Plus, Download, X,
} from 'lucide-react';
import { useRecordsStore } from '../store/useRecordsStore';
import StatCard from '../components/StatCard';
import { StatusPill, SourceChip } from '../components/Badges';
import { formatDate, truncate } from '../utils/format';
import type { RecordStatus, DataSource } from '../../shared/types';

export default function RecordsList() {
  const { records, stats, filters, loading, fetchRecords, fetchStats, setFilters, exportRecords } =
    useRecordsStore();
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState(filters.search || '');

  useEffect(() => {
    fetchStats();
    fetchRecords();
  }, [fetchStats, fetchRecords]);

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters({ search: search || undefined });
      fetchRecords();
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const statCards = [
    { label: '待复核', value: stats.pending, icon: <ClockSimple />, gradient: 'bg-gradient-to-r from-amber-400 to-amber-500' },
    { label: '已复核', value: stats.reviewed, icon: <CheckSimple />, gradient: 'bg-gradient-to-r from-teal-400 to-teal-600' },
    { label: '异常记录', value: stats.exception, icon: <AlertCircle className="h-5 w-5" />, gradient: 'bg-gradient-to-r from-rose-400 to-rose-500' },
    { label: '手工补录', value: stats.supplemented, icon: <Plus className="h-5 w-5" />, gradient: 'bg-gradient-to-r from-violet-400 to-violet-500' },
  ];

  const applyFilter = (key: string, v: string | undefined) => {
    setFilters({ [key]: v } as any);
    setTimeout(() => fetchRecords(), 0);
  };

  const clearFilters = () => {
    setFilters({});
    setSearch('');
    setTimeout(() => fetchRecords(), 0);
  };

  const hasActiveFilter = Object.values(filters).some((v) => v !== undefined && v !== '');

  return (
    <div className="mx-auto max-w-[1440px] px-8 py-8">
      <div className="mb-6 flex items-end justify-between opacity-0 animate-fadeUp">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-teal-700">对账台首页</h1>
          <p className="mt-1 text-sm text-slate2-500">
            每条改期记录均包含来源文件、处理人、当前状态与最近一次人工说明，方便追溯复核。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/supplement" className="btn-primary">
            <Plus className="h-4 w-4" />
            手工补录
          </Link>
          <button
            className="btn-secondary"
            onClick={() => exportRecords({ format: 'csv', operator: '王园长' })}
          >
            <Download className="h-4 w-4" />
            导出 CSV
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-4">
        {statCards.map((c, i) => (
          <StatCard key={c.label} {...c} delay={i} />
        ))}
      </div>

      <div className="card overflow-hidden opacity-0 animate-fadeUp animate-delay-200">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-500/8 p-4">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate2-400" />
              <input
                className="input-field pl-9"
                placeholder="搜索婴幼儿、家长、课程或来源文件..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className={`btn-ghost ${showFilter ? 'bg-teal-50 text-teal-600' : ''}`}
              onClick={() => setShowFilter(!showFilter)}
            >
              <Filter className="h-4 w-4" />
              筛选
              {showFilter ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {hasActiveFilter && (
              <button className="btn-ghost text-amber-600 hover:bg-amber-50" onClick={clearFilters}>
                <X className="h-4 w-4" />
                清除筛选
              </button>
            )}
          </div>
          <div className="text-xs text-slate2-400">
            共 <span className="font-medium text-teal-600">{records.length}</span> 条记录
          </div>
        </div>

        {showFilter && (
          <div className="grid grid-cols-4 gap-4 border-b border-teal-500/8 bg-cream-50/60 p-4">
            <FilterSelect
              label="记录状态"
              value={filters.status}
              onChange={(v) => applyFilter('status', v)}
              options={[
                { v: '', l: '全部状态' },
                { v: 'pending', l: '待复核' },
                { v: 'reviewed', l: '已复核' },
                { v: 'exception', l: '异常' },
                { v: 'supplemented', l: '已补录' },
              ]}
            />
            <FilterSelect
              label="数据来源"
              value={filters.dataSource}
              onChange={(v) => applyFilter('dataSource', v)}
              options={[
                { v: '', l: '全部来源' },
                { v: 'normal', l: '正常录入' },
                { v: 'supplement', l: '手工补录' },
                { v: 'corrupted', l: '坏数据' },
              ]}
            />
            <div>
              <label className="label">起始日期</label>
              <input
                type="date"
                className="input-field"
                value={filters.dateFrom || ''}
                onChange={(e) => applyFilter('dateFrom', e.target.value || undefined)}
              />
            </div>
            <div>
              <label className="label">截止日期</label>
              <input
                type="date"
                className="input-field"
                value={filters.dateTo || ''}
                onChange={(e) => applyFilter('dateTo', e.target.value || undefined)}
              />
            </div>
          </div>
        )}

        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead>
              <tr className="border-b border-teal-500/10 bg-cream-100/60 text-left text-xs font-medium uppercase tracking-wider text-slate2-500">
                <th className="px-4 py-3">婴幼儿 / 课程</th>
                <th className="px-4 py-3">改期</th>
                <th className="px-4 py-3">来源文件</th>
                <th className="px-4 py-3">处理人</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">数据来源</th>
                <th className="px-4 py-3 min-w-[260px]">最近人工说明</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading && records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate2-400">
                    加载中...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate2-400">
                    暂无匹配的记录
                  </td>
                </tr>
              ) : (
                records.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`group border-b border-teal-500/5 transition-colors hover:bg-teal-50/40 ${
                      i % 2 === 1 ? 'bg-cream-50/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-teal-700">{r.infantName}</div>
                      <div className="mt-0.5 text-xs text-slate2-500">
                        {r.infantAge}月龄 · {r.courseName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate2-500 line-through">{formatDate(r.originalDate)}</span>
                        <ArrowRightLeft className="h-3 w-3 text-teal-400" />
                        <span className="font-medium text-teal-600">{formatDate(r.newDate)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={r.sourceFileUrl || '#'}
                        className="inline-flex items-center gap-1 rounded-md text-xs text-teal-600 underline-offset-2 hover:text-teal-700 hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span className="max-w-[180px] truncate" title={r.sourceFile}>
                          {truncate(r.sourceFile, 22)}
                        </span>
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate2-600">
                        <User className="h-3.5 w-3.5 text-teal-400" />
                        {r.operator}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={r.status as RecordStatus} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <SourceChip source={r.dataSource as DataSource} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="group/note relative">
                        <div className="max-w-[260px] truncate text-xs text-slate2-600" title={r.latestNote}>
                          {r.latestNote || <span className="text-slate2-400 italic">暂无说明</span>}
                        </div>
                        {r.latestNote && r.latestNote.length > 24 && (
                          <div className="invisible absolute left-0 top-full z-20 mt-1 w-72 rounded-md border border-teal-500/10 bg-white p-2.5 text-xs text-slate2-600 shadow-cardHover opacity-0 transition group-hover/note:visible group-hover/note:opacity-100">
                            {r.latestNote}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/records/${r.id}`} className="btn-ghost !py-1.5 !px-2.5 text-xs">
                        查看详情
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string; value?: string; onChange: (v: string) => void; options: { v: string; l: string }[];
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="input-field" value={value || ''} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
    </div>
  );
}

function ClockSimple() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function CheckSimple() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
