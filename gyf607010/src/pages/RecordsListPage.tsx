import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Download,
  Search,
  AlertCircle,
  Clock,
  CheckCircle2,
  Ban,
  Eye,
  Pencil,
  RotateCcw,
} from 'lucide-react';
import { recordsApi } from '@/api/records';
import StatusBadge from '@/components/StatusBadge';
import RecordFormModal from '@/components/RecordFormModal';
import { ToastHost, showToast } from '@/components/Toast';
import { formatDateTime, downloadCsv } from '@/utils/format';
import type { MilkRecord, RecordStatus, RecordFilter } from '@shared/types';
import {
  RecordStatusLabel,
  ShiftLabel,
  FeedingMethodLabel,
} from '@shared/types';

const statusList: (RecordStatus | 'all')[] = ['all', 'pending', 'confirmed', 'withdrawn', 'conflict'];

function statusCount(list: MilkRecord[], s: RecordStatus) {
  return list.filter((r) => r.status === s).length;
}

const statsConfig = [
  {
    key: 'pending' as const,
    label: '待复核',
    icon: Clock,
    accent: 'from-amber-400 to-amber-600',
  },
  {
    key: 'confirmed' as const,
    label: '已确认',
    icon: CheckCircle2,
    accent: 'from-emerald-400 to-emerald-600',
  },
  {
    key: 'conflict' as const,
    label: '预约冲突',
    icon: AlertCircle,
    accent: 'from-rose-400 to-rose-600',
  },
  {
    key: 'withdrawn' as const,
    label: '已撤回',
    icon: Ban,
    accent: 'from-slate-400 to-slate-600',
  },
];

export default function RecordsListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allRecords, setAllRecords] = useState<MilkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MilkRecord | null>(null);
  const [search, setSearch] = useState('');

  const initialStatus = (searchParams.get('status') as RecordStatus) || undefined;
  const [statusFilter, setStatusFilter] = useState<RecordStatus | 'all'>(initialStatus ?? 'all');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [operatorName, setOperatorName] = useState(searchParams.get('operatorName') || '');

  async function load() {
    setLoading(true);
    try {
      const list = await recordsApi.list();
      setAllRecords(list);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filter: RecordFilter = useMemo(() => {
    return {
      babyName: search || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      operatorName: operatorName || undefined,
    };
  }, [search, statusFilter, dateFrom, dateTo, operatorName]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (statusFilter !== 'all') params.status = statusFilter;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (operatorName) params.operatorName = operatorName;
    setSearchParams(params, { replace: true });
  }, [statusFilter, dateFrom, dateTo, operatorName, setSearchParams]);

  const filtered = useMemo(() => {
    return allRecords.filter((r) => {
      if (filter.babyName && !r.babyName.toLowerCase().includes(filter.babyName.toLowerCase()))
        return false;
      if (filter.status && r.status !== filter.status) return false;
      if (filter.dateFrom && r.recordDate < filter.dateFrom) return false;
      if (filter.dateTo && r.recordDate > filter.dateTo) return false;
      if (filter.operatorName) {
        const kw = filter.operatorName.toLowerCase();
        const hit =
          r.createdByName.toLowerCase().includes(kw) ||
          (r.reviewedByName && r.reviewedByName.toLowerCase().includes(kw));
        if (!hit) return false;
      }
      return true;
    });
  }, [allRecords, filter]);

  function handleExport() {
    if (filtered.length === 0) {
      showToast('当前筛选结果为空，无可导出数据', 'error');
      return;
    }
    const header = [
      '序号',
      '婴儿姓名',
      '记录日期',
      '班次',
      '奶量(ml)',
      '喂养方式',
      '状态',
      '原因',
      '处理人',
      '复核人',
      '创建时间',
      '复核时间',
    ];
    const rows = filtered.map((r, idx) => [
      idx + 1,
      r.babyName,
      r.recordDate,
      ShiftLabel[r.shift],
      r.milkAmountMl,
      FeedingMethodLabel[r.feedingMethod],
      RecordStatusLabel[r.status],
      r.conflictReason || r.withdrawReason || '',
      r.createdByName,
      r.reviewedByName || '',
      formatDateTime(r.createdAt),
      formatDateTime(r.reviewedAt),
    ]);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`奶量交接明细_${stamp}.csv`, [header, ...rows]);
    showToast(`已导出 ${filtered.length} 条明细`, 'success');
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(r: MilkRecord) {
    setEditing(r);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <ToastHost />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900">奶量记录管理</h2>
          <p className="text-sm text-slate-500 mt-1">
            家长群留言与纸质交接单的统一电子底账 · 共 {allRecords.length} 条，筛选后 {filtered.length} 条
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={handleExport}>
            <Download className="w-4 h-4" />
            导出明细
          </button>
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            新建记录
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsConfig.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={s.key}
              className="card p-4 animate-fade-up overflow-hidden relative"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${s.accent}`} />
              <div className="flex items-start justify-between pl-2">
                <div>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="font-serif text-3xl font-semibold text-slate-900 mt-1">
                    {statusCount(allRecords, s.key)}
                  </p>
                </div>
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.accent} flex items-center justify-center text-white shadow-sm`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {statusList.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition ${
                statusFilter === s
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'all' ? '全部' : RecordStatusLabel[s]}
              <span className="ml-1.5 opacity-70">
                {s === 'all' ? allRecords.length : statusCount(allRecords, s)}
              </span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索婴儿姓名"
            />
          </div>
          <div>
            <input
              type="date"
              className="input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <input
              type="date"
              className="input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div>
            <input
              className="input"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="处理人姓名"
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="table-cell text-left font-medium text-slate-500 w-12">#</th>
                <th className="table-cell text-left font-medium text-slate-500">婴儿姓名</th>
                <th className="table-cell text-left font-medium text-slate-500">日期</th>
                <th className="table-cell text-left font-medium text-slate-500">班次</th>
                <th className="table-cell text-left font-medium text-slate-500">奶量</th>
                <th className="table-cell text-left font-medium text-slate-500">状态</th>
                <th className="table-cell text-left font-medium text-slate-500">处理人</th>
                <th className="table-cell text-left font-medium text-slate-500">创建时间</th>
                <th className="table-cell text-right font-medium text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="table-cell text-center text-slate-400 py-10">
                    加载中…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="table-cell text-center text-slate-400 py-10">
                    暂无符合条件的记录
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-brand-50/40 transition-colors group relative"
                  >
                    <td className="table-cell text-slate-400">{idx + 1}</td>
                    <td className="table-cell">
                      <div className="font-medium text-slate-800">{r.babyName}</div>
                      <div className="text-xs text-slate-400">
                        {FeedingMethodLabel[r.feedingMethod]}
                      </div>
                    </td>
                    <td className="table-cell">{r.recordDate}</td>
                    <td className="table-cell">{ShiftLabel[r.shift]}</td>
                    <td className="table-cell">
                      <span className="font-semibold text-slate-800">{r.milkAmountMl}</span>
                      <span className="text-xs text-slate-400 ml-1">ml</span>
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="table-cell">
                      <div className="text-sm">{r.createdByName}</div>
                      {r.reviewedByName && (
                        <div className="text-xs text-slate-400">复核 {r.reviewedByName}</div>
                      )}
                    </td>
                    <td className="table-cell text-slate-500 text-xs">
                      {formatDateTime(r.createdAt)}
                    </td>
                    <td className="table-cell text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          className="btn-ghost"
                          onClick={() => navigate(`/records/${r.id}`)}
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                          详情
                        </button>
                        {r.status !== 'withdrawn' && (
                          <button className="btn-ghost" onClick={() => openEdit(r)} title="修改">
                            <Pencil className="w-4 h-4" />
                            修改
                          </button>
                        )}
                        {r.status === 'confirmed' && (
                          <button
                            className="btn-ghost text-rose-600 hover:bg-rose-50"
                            onClick={() => navigate(`/records/${r.id}`)}
                            title="前往详情页撤回"
                          >
                            <RotateCcw className="w-4 h-4" />
                            撤回
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RecordFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        editRecord={editing}
      />
    </div>
  );
}
