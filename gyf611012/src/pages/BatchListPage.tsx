import { useMemo, useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  PlayCircle,
  CalendarDays,
  Building2,
  Hash,
  Layers,
  AlertTriangle,
  ChevronLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SaffronGrade as Grade } from '@/types';
import type { BatchStatus, SaffronGrade } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { dayjs, batchStatusMeta, percentOf } from '@/utils/helpers';

const STATUS_OPTIONS: Array<{ value: BatchStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: '全部状态' },
  { value: 'PENDING', label: '待质检' },
  { value: 'INSPECTING', label: '质检中' },
  { value: 'INSPECTED', label: '质检完成' },
  { value: 'DEGRADED', label: '已降级' },
  { value: 'RETURNED', label: '已退货' },
];

const GRADE_OPTIONS: Array<{ value: SaffronGrade | 'ALL'; label: string }> = [
  { value: 'ALL', label: '全部等级' },
  { value: Grade.GRADE_S, label: '特级 S' },
  { value: Grade.GRADE_A, label: '一级 A' },
  { value: Grade.GRADE_B, label: '二级 B' },
  { value: Grade.GRADE_C, label: '三级 C' },
  { value: Grade.GRADE_D, label: '四级 D' },
  { value: Grade.GRADE_E, label: '五级 E' },
  { value: Grade.GRADE_F, label: '退货 F' },
];

export default function BatchListPage() {
  const navigate = useNavigate();
  const { batches, setActiveBatch } = useAppStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BatchStatus | 'ALL'>('ALL');
  const [gradeFilter, setGradeFilter] = useState<SaffronGrade | 'ALL'>('ALL');

  const filtered = useMemo(() => {
    return batches
      .filter((b) => {
        if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
        if (gradeFilter !== 'ALL' && b.expectedGrade !== gradeFilter) return false;
        if (search) {
          const kw = search.trim().toLowerCase();
          if (
            !b.batchNo.toLowerCase().includes(kw) &&
            !b.supplierName.toLowerCase().includes(kw)
          )
            return false;
        }
        return true;
      })
      .sort((a, b) => dayjs(b.arrivalDate).unix() - dayjs(a.arrivalDate).unix());
  }, [batches, search, statusFilter, gradeFilter]);

  const handleStartInspect = (id: string) => {
    setActiveBatch(id);
    navigate(`/inspect`);
  };

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-hard-ghost !px-3 !py-2"
            title="返回总览台"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink-100 tracking-wide">批次列表</h1>
            <p className="text-sm text-ink-400 mt-1">共 {batches.length} 个批次，已筛选 {filtered.length} 条</p>
          </div>
        </div>
      </div>

      <div className="panel p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              type="text"
              placeholder="搜索批次号 / 供应商名称..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-ink-900 border border-ink-700 pl-10 pr-4 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 font-mono"
            />
          </div>
          <div className="md:col-span-3 flex items-center gap-2">
            <Filter className="w-4 h-4 text-ink-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BatchStatus | 'ALL')}
              className="flex-1 bg-ink-900 border border-ink-700 px-3 py-2.5 text-sm text-ink-100 focus:outline-none focus:border-gold-500"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-ink-500" />
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value as SaffronGrade | 'ALL')}
              className="flex-1 bg-ink-900 border border-ink-700 px-3 py-2.5 text-sm text-ink-100 focus:outline-none focus:border-gold-500"
            >
              {GRADE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-900/60 text-ink-400">
              <tr>
                <th className="px-5 py-3 text-left font-mono font-medium whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" />批次号</span>
                </th>
                <th className="px-5 py-3 text-left font-medium whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />供应商</span>
                </th>
                <th className="px-5 py-3 text-left font-medium whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />到货</span>
                </th>
                <th className="px-5 py-3 text-left font-medium whitespace-nowrap">合同等级</th>
                <th className="px-5 py-3 text-left font-medium whitespace-nowrap">总条数</th>
                <th className="px-5 py-3 text-left font-medium whitespace-nowrap">已检</th>
                <th className="px-5 py-3 text-left font-medium w-36 whitespace-nowrap">质检进度</th>
                <th className="px-5 py-3 text-left font-medium whitespace-nowrap">平均ΔE</th>
                <th className="px-5 py-3 text-left font-medium whitespace-nowrap">超阈数</th>
                <th className="px-5 py-3 text-left font-medium whitespace-nowrap">状态</th>
                <th className="px-5 py-3 text-left font-medium whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-5 py-16 text-center text-ink-500">
                    未找到匹配的批次
                  </td>
                </tr>
              )}
              {filtered.map((b) => {
                const meta = batchStatusMeta(b.status);
                const progress = percentOf(b.inspectedCount, b.totalQuantity);
                const outRatio = percentOf(b.outOfThresholdCount, b.totalQuantity, 0);
                return (
                  <tr key={b.id} className="border-t border-ink-700/60 hover:bg-ink-700/20 transition-colors">
                    <td className="px-5 py-4 font-mono text-ink-200 whitespace-nowrap">{b.batchNo}</td>
                    <td className="px-5 py-4 text-ink-300 max-w-[220px] truncate" title={b.supplierName}>{b.supplierName}</td>
                    <td className="px-5 py-4 text-ink-400 font-mono text-xs whitespace-nowrap">
                      {dayjs(b.arrivalDate).format('YYYY-MM-DD')}
                    </td>
                    <td className="px-5 py-4">
                      <span className="data-chip bg-ink-700 border-ink-600 text-gold-500 font-bold">
                        等级 {b.expectedGrade}
                      </span>
                    </td>
                    <td className="px-5 py-4 led-number text-ink-300 text-center">{b.totalQuantity}</td>
                    <td className="px-5 py-4 led-number text-ink-300 text-center">{b.inspectedCount}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="progress-track flex-1 min-w-[60px]">
                          <div
                            className={`progress-bar ${
                              progress === 100
                                ? outRatio > 20
                                  ? 'bg-saffron-600'
                                  : 'bg-emerald-600'
                                : 'bg-gradient-to-r from-saffron-700 to-gold-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="led-number text-xs text-ink-400 w-10 text-right">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`led-number font-semibold ${
                        b.inspectedCount === 0 ? 'text-ink-500' :
                        b.avgDeltaE > 4 ? 'text-saffron-400 text-shadow-red' :
                        b.avgDeltaE > 2.5 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {b.inspectedCount > 0 ? b.avgDeltaE.toFixed(2) : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {b.inspectedCount > 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="led-number text-ink-200">{b.outOfThresholdCount}</span>
                          {outRatio > 20 && (
                            <span className="relative group">
                              <AlertTriangle className="w-3.5 h-3.5 text-saffron-500" />
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block px-2 py-1 bg-ink-900 border border-ink-700 text-xs text-ink-200 whitespace-nowrap z-10">
                                超阈比例 {'>'} 20%
                              </span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-ink-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`data-chip ${meta.color} border-transparent`}>{meta.label}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {b.status === 'PENDING' || b.status === 'INSPECTING' ? (
                          <button
                            onClick={() => handleStartInspect(b.id)}
                            className="btn-hard-primary !px-3 !py-1.5 !text-xs"
                            title="开始质检"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            质检
                          </button>
                        ) : (
                          <button
                            disabled
                            className="btn-hard-ghost !px-3 !py-1.5 !text-xs opacity-50 cursor-not-allowed"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            质检
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/batches/${b.id}`)}
                          className="btn-hard-ghost !px-3 !py-1.5 !text-xs"
                          title="查看汇总"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          汇总
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
