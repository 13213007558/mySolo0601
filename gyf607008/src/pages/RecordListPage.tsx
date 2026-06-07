import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  CheckCircle2,
  Eye,
  Pencil,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/StatusBadge';
import { ExportModal } from '@/components/ExportModal';
import type { RecordStatus, RecordSource } from '@shared/types';

export function RecordListPage() {
  const records = useAppStore((s) => s.records);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const fetchRecords = useAppStore((s) => s.fetchRecords);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);
  const selectedRecordIds = useAppStore((s) => s.selectedRecordIds);
  const setSelectedRecordIds = useAppStore((s) => s.setSelectedRecordIds);
  const toggleSelectedId = useAppStore((s) => s.toggleSelectedId);
  const batchReview = useAppStore((s) => s.batchReview);

  const [showFilters, setShowFilters] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const allSelected = records.length > 0 && selectedRecordIds.length === records.length;
  const someSelected = selectedRecordIds.length > 0 && selectedRecordIds.length < records.length;

  const toggleAll = () => {
    if (allSelected || someSelected) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(records.map((r) => r.id));
    }
  };

  const handleBatchReview = async () => {
    await batchReview();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-night-surface/50 border-b border-night-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold">记录列表</h1>
            <p className="text-[11px] text-night-muted mt-0.5">
              共 {records.length} 条记录 · 正常 {records.filter((r) => r.status === 'normal').length} · 待复核{' '}
              {records.filter((r) => r.status === 'pending').length} · 异常{' '}
              {records.filter((r) => r.status === 'abnormal').length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchRecords()}
              className="px-3 py-1.5 text-xs rounded border border-night-border text-night-muted hover:text-night-text hover:bg-night-border/50 flex items-center gap-1.5"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              刷新
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1.5 text-xs rounded border flex items-center gap-1.5 ${
                showFilters
                  ? 'bg-night-border border-night-border text-night-text'
                  : 'border-night-border text-night-muted hover:text-night-text hover:bg-night-border/50'
              }`}
            >
              <Filter size={12} />
              筛选
              <ChevronDown size={12} className={showFilters ? 'rotate-180' : ''} />
            </button>
            <button
              onClick={() => setExportOpen(true)}
              className="px-3 py-1.5 text-xs rounded border border-night-border text-night-muted hover:text-night-text hover:bg-night-border/50 flex items-center gap-1.5"
            >
              <Download size={12} />
              导出全部
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-night-border grid grid-cols-6 gap-3">
            <FilterInput
              label="批次号"
              value={filters.batchNo || ''}
              placeholder="如 BATCH-20260605-A"
              onChange={(v) => setFilters({ batchNo: v })}
            />
            <FilterInput
              label="宝宝姓名"
              value={filters.babyName || ''}
              placeholder="输入姓名"
              onChange={(v) => setFilters({ babyName: v })}
            />
            <FilterSelect
              label="状态"
              value={filters.status || ''}
              options={[
                { v: '', l: '全部' },
                { v: 'normal', l: '正常' },
                { v: 'pending', l: '待复核' },
                { v: 'abnormal', l: '异常' },
              ]}
              onChange={(v) => setFilters({ status: v as RecordStatus | '' })}
            />
            <FilterSelect
              label="数据来源"
              value={filters.source || ''}
              options={[
                { v: '', l: '全部' },
                { v: 'batch', l: '批次记录' },
                { v: 'supplement', l: '临时补充' },
              ]}
              onChange={(v) => setFilters({ source: v as RecordSource | '' })}
            />
            <FilterInput
              label="开始日期"
              type="date"
              value={filters.dateFrom || ''}
              onChange={(v) => setFilters({ dateFrom: v })}
            />
            <FilterInput
              label="结束日期"
              type="date"
              value={filters.dateTo || ''}
              onChange={(v) => setFilters({ dateTo: v })}
            />
          </div>
        )}
      </div>

      {selectedRecordIds.length > 0 && (
        <div className="bg-accent-amber/10 border-b border-accent-amber/30 px-6 py-2 flex items-center justify-between">
          <div className="text-xs text-accent-amber">
            已选择 <span className="font-semibold">{selectedRecordIds.length}</span> 条记录
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedRecordIds([])}
              className="px-3 py-1 text-xs rounded border border-night-border text-night-muted hover:text-night-text"
            >
              取消选择
            </button>
            <button
              onClick={() => setExportOpen(true)}
              className="px-3 py-1 text-xs rounded border border-night-border text-night-muted hover:text-night-text flex items-center gap-1"
            >
              <Download size={11} />
              批量导出
            </button>
            <button
              onClick={handleBatchReview}
              className="px-3 py-1 text-xs rounded bg-night-border text-night-text hover:bg-night-border/80 flex items-center gap-1"
            >
              <CheckCircle2 size={11} />
              批量复核
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {error && (
          <div className="m-4 p-3 bg-red-950/40 border border-red-800/60 rounded text-xs text-red-300 flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {loading && records.length === 0 ? (
          <div className="h-full flex items-center justify-center text-night-muted text-xs">
            <Loader2 size={16} className="animate-spin mr-2" />
            加载中...
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-night-surface/95 backdrop-blur border-b border-night-border">
              <tr className="text-night-muted text-left">
                <th className="px-4 py-2.5 w-8">
                  <input
                    type="checkbox"
                    className="accent-accent-amber"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-3 py-2.5 font-medium">宝宝姓名</th>
                <th className="px-3 py-2.5 font-medium">批次号</th>
                <th className="px-3 py-2.5 font-medium">性别</th>
                <th className="px-3 py-2.5 font-medium">家长手机号</th>
                <th className="px-3 py-2.5 font-medium">来源</th>
                <th className="px-3 py-2.5 font-medium">状态</th>
                <th className="px-3 py-2.5 font-medium">质量问题</th>
                <th className="px-3 py-2.5 font-medium">录入时间</th>
                <th className="px-3 py-2.5 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, idx) => (
                <tr
                  key={r.id}
                  className={`border-b border-night-border/60 hover:bg-night-border/30 transition-colors ${
                    r.status === 'abnormal' ? 'bg-red-950/20' : idx % 2 === 1 ? 'bg-night-surface/20' : ''
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      className="accent-accent-amber"
                      checked={selectedRecordIds.includes(r.id)}
                      onChange={() => toggleSelectedId(r.id)}
                    />
                  </td>
                  <td className="px-3 py-2.5 font-medium text-night-text">{r.babyName || <span className="text-night-muted/50">（未填写）</span>}</td>
                  <td className="px-3 py-2.5 font-mono text-night-muted">
                    {r.batchNo || <span className="text-night-muted/50">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-night-muted">
                    {r.gender === 'male' ? '男' : r.gender === 'female' ? '女' : '—'}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-night-muted">{r.parentPhone || '—'}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        r.source === 'batch'
                          ? 'bg-sky-950/50 text-sky-400 border border-sky-800/50'
                          : 'bg-purple-950/50 text-purple-400 border border-purple-800/50'
                      }`}
                    >
                      {r.source === 'batch' ? '批次' : '临时补充'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-2.5">
                    {r.issues.length > 0 ? (
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
                          r.issues.some((i) => i.severity === 'error')
                            ? 'bg-red-950/50 text-red-400 border border-red-800/50'
                            : 'bg-amber-950/50 text-amber-400 border border-amber-800/50'
                        }`}
                      >
                        {r.issues.some((i) => i.severity === 'error') ? (
                          <AlertCircle size={10} />
                        ) : (
                          <AlertTriangle size={10} />
                        )}
                        {r.issues.length} 项
                      </span>
                    ) : (
                      <span className="text-night-muted/40 text-[10px]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-night-muted font-mono text-[11px]">{r.createdAt}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-0.5">
                      <Link
                        to={`/records/${r.id}`}
                        className="p-1.5 rounded text-night-muted hover:text-night-text hover:bg-night-border/60"
                        title="查看详情"
                      >
                        <Eye size={13} />
                      </Link>
                      <Link
                        to={`/records/${r.id}/edit`}
                        className="p-1.5 rounded text-night-muted hover:text-night-text hover:bg-night-border/60"
                        title="编辑"
                      >
                        <Pencil size={13} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-night-muted text-xs">
                    <Search size={20} className="mx-auto mb-2 opacity-40" />
                    暂无记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} recordIds={selectedRecordIds} />
    </div>
  );
}

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] text-night-muted mb-1">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 px-2 text-xs bg-night-bg border border-night-border rounded focus:border-accent-amber/60 focus:outline-none text-night-text placeholder:text-night-muted/40"
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { v: string; l: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] text-night-muted mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 px-2 text-xs bg-night-bg border border-night-border rounded focus:border-accent-amber/60 focus:outline-none text-night-text"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </div>
  );
}
