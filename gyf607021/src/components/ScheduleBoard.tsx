import { useStore, useBabyMap } from '../store';
import {
  getStatusBadgeColor,
  getStatusLabel,
  getQualityBadgeColor,
  getQualityLabel,
  downloadCSV,
  exportToCSV,
} from '../utils';
import { useMemo, useState } from 'react';
import {
  Search,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Plus,
  History,
  FileText,
  Thermometer,
  UserCircle,
  ShieldAlert,
} from 'lucide-react';
import BabyDetailDrawer from './BabyDetailDrawer';
import SupplementModal from './SupplementModal';
import AuditLogPanel from './AuditLogPanel';
import type { MorningCheckRecord } from '../types';
import dayjs from 'dayjs';

type DataFilter = 'all' | 'empty' | 'dirty' | 'normal' | 'withdrawn' | 'supplement';

export default function ScheduleBoard() {
  const {
    morningChecks,
    babies,
    thermometerRecords,
    leaveRequests,
    appointments,
    auditLogs,
    filterByPhone,
  } = useStore();
  const babyMap = useBabyMap();

  const [phoneFilter, setPhoneFilter] = useState('');
  const [dataFilter, setDataFilter] = useState<DataFilter>('all');
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(null);
  const [supplementTarget, setSupplementTarget] = useState<MorningCheckRecord | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  const [exportResult, setExportResult] = useState<{ pageCount: number; exportCount: number; match: boolean } | null>(null);

  const filtered = useMemo(() => {
    let list = filterByPhone(phoneFilter);
    if (dataFilter === 'empty') list = list.filter((r) => r.dataQuality === 'empty');
    if (dataFilter === 'dirty') list = list.filter((r) => r.dataQuality === 'dirty');
    if (dataFilter === 'normal') list = list.filter((r) => r.dataQuality === 'normal');
    if (dataFilter === 'withdrawn') list = list.filter((r) => r.status === 'withdrawn');
    if (dataFilter === 'supplement') list = list.filter((r) => r.isManualSupplement);
    return list;
  }, [morningChecks, phoneFilter, dataFilter, filterByPhone]);

  const stats = useMemo(() => {
    const total = morningChecks.length;
    const normal = morningChecks.filter((r) => r.dataQuality === 'normal').length;
    const empty = morningChecks.filter((r) => r.dataQuality === 'empty').length;
    const dirty = morningChecks.filter((r) => r.dataQuality === 'dirty').length;
    const withdrawn = morningChecks.filter((r) => r.status === 'withdrawn').length;
    const supplemented = morningChecks.filter((r) => r.isManualSupplement).length;
    return { total, normal, empty, dirty, withdrawn, supplemented };
  }, [morningChecks]);

  const handleExport = () => {
    const { csv, count, filename } = exportToCSV(filtered, babyMap);
    const pageCount = filtered.length;
    const match = count === pageCount;
    setExportResult({ pageCount, exportCount: count, match });
    downloadCSV(csv, filename);
    setTimeout(() => setExportResult(null), 4000);
  };

  const selectedRecord = selectedBabyId
    ? morningChecks.find((r) => r.babyId === selectedBabyId) ?? null
    : null;
  const selectedBaby = selectedBabyId ? babyMap[selectedBabyId] ?? null : null;
  const selectedThermo = selectedBabyId
    ? thermometerRecords.filter((t) => t.babyId === selectedBabyId)
    : [];
  const selectedLeaves = selectedBabyId
    ? leaveRequests.filter((l) => l.babyId === selectedBabyId)
    : [];
  const selectedAppts = selectedBabyId
    ? appointments.filter((a) => a.babyId === selectedBabyId)
    : [];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-brand-500 to-pink-500 text-white px-6 py-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Thermometer size={22} />
              婴幼儿晨检复核排程板 · 门店售后版
            </h1>
            <p className="text-sm text-brand-100 mt-1">
              {dayjs().format('YYYY年MM月DD日')} · 当前操作员：李店长（门店售后）
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAudit(true)}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition px-3 py-2 rounded-lg text-sm"
            >
              <ShieldAlert size={16} />
              审计日志
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full px-6 py-5 flex-1">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
          <StatCard label="今日总记录" value={stats.total} icon={<FileText size={18} />} color="bg-slate-50 text-slate-700 border-slate-200" />
          <StatCard label="正常数据" value={stats.normal} icon={<CheckCircle size={18} />} color="bg-emerald-50 text-emerald-700 border-emerald-200" />
          <StatCard label="空数据" value={stats.empty} icon={<XCircle size={18} />} color="bg-gray-50 text-gray-600 border-gray-300" />
          <StatCard label="脏数据" value={stats.dirty} icon={<AlertTriangle size={18} />} color="bg-red-50 text-red-600 border-red-200" />
          <StatCard label="已撤回" value={stats.withdrawn} icon={<History size={18} />} color="bg-rose-50 text-rose-700 border-rose-200" />
          <StatCard label="已补录" value={stats.supplemented} icon={<Plus size={18} />} color="bg-indigo-50 text-indigo-700 border-indigo-200" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                placeholder="按家长手机号筛选（例如：13800000001）"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <FilterChip active={dataFilter === 'all'} onClick={() => setDataFilter('all')} label="全部" />
              <FilterChip active={dataFilter === 'normal'} onClick={() => setDataFilter('normal')} label="正常数据" />
              <FilterChip active={dataFilter === 'empty'} onClick={() => setDataFilter('empty')} label="空数据" />
              <FilterChip active={dataFilter === 'dirty'} onClick={() => setDataFilter('dirty')} label="脏数据" />
              <FilterChip active={dataFilter === 'withdrawn'} onClick={() => setDataFilter('withdrawn')} label="已撤回" />
              <FilterChip active={dataFilter === 'supplement'} onClick={() => setDataFilter('supplement')} label="已补录" />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-gray-500">
                页面显示：<span className="font-semibold text-gray-700">{filtered.length}</span> 条
              </span>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
              >
                <Download size={16} />
                导出CSV给客服
              </button>
            </div>
          </div>

          {exportResult && (
            <div
              className={`mt-3 px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                exportResult.match
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}
            >
              {exportResult.match ? (
                <><CheckCircle size={16} /> 导出成功：页面 {exportResult.pageCount} 条 = 导出 {exportResult.exportCount} 条，数量完全一致</>
              ) : (
                <><AlertTriangle size={16} /> 异常：页面 {exportResult.pageCount} 条 ≠ 导出 {exportResult.exportCount} 条</>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">宝宝信息</th>
                  <th className="text-left px-4 py-3 font-medium">班级 / 家长</th>
                  <th className="text-left px-4 py-3 font-medium">体温</th>
                  <th className="text-left px-4 py-3 font-medium">状态</th>
                  <th className="text-left px-4 py-3 font-medium">数据质量</th>
                  <th className="text-left px-4 py-3 font-medium">快速备注</th>
                  <th className="text-left px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <UserCircle size={48} className="text-gray-300" />
                        <div>当前筛选条件下暂无记录</div>
                        <div className="text-xs">请调整手机号或数据质量筛选条件</div>
                      </div>
                    </td>
                  </tr>
                )}
                {filtered.map((r) => {
                  const b = babyMap[r.babyId];
                  const isDirty = r.dataQuality === 'dirty';
                  const isEmpty = r.dataQuality === 'empty';
                  const rowBg = isDirty
                    ? 'bg-red-50/40 hover:bg-red-50'
                    : isEmpty
                    ? 'bg-gray-50/50 hover:bg-gray-50'
                    : 'hover:bg-gray-50';
                  return (
                    <tr key={r.id} className={`border-b border-gray-50 transition ${rowBg}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm"
                            style={{ background: b?.avatarColor ?? '#9ca3af' }}
                          >
                            {b?.name?.slice(0, 1) ?? '?'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800 flex items-center gap-1.5">
                              {b?.name}
                              {r.isManualSupplement && (
                                <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-200">补录</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">{b?.nickname} · {b?.gender === 'male' ? '男' : '女'} · {b?.ageMonths}月龄</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700">{b?.className}</div>
                        <div className="text-xs text-gray-400">{b?.parentName} · {b?.parentPhone}</div>
                      </td>
                      <td className="px-4 py-3">
                        {r.temperature !== undefined ? (
                          <div className={`font-mono font-semibold ${isDirty ? 'text-red-600' : r.temperature >= 37.3 ? 'text-orange-600' : 'text-emerald-600'}`}>
                            {r.temperature.toFixed(1)}℃
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded text-xs border ${getStatusBadgeColor(r.status)}`}>
                          {getStatusLabel(r.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border w-fit ${getQualityBadgeColor(r.dataQuality)}`}>
                            {r.dataQuality === 'dirty' && <AlertTriangle size={12} />}
                            {r.dataQuality === 'empty' && <XCircle size={12} />}
                            {r.dataQuality === 'normal' && <CheckCircle size={12} />}
                            {getQualityLabel(r.dataQuality)}
                          </span>
                          {r.dirtyReason && (
                            <div className="text-[11px] text-red-500 max-w-[200px] truncate" title={r.dirtyReason}>
                              ⚠ {r.dirtyReason}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <div className="text-gray-700 truncate" title={r.quickNote ?? ''}>{r.quickNote || <span className="text-gray-300">—</span>}</div>
                        <div className="text-[11px] text-gray-400 truncate" title={r.remark ?? ''}>{r.remark || ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedBabyId(r.babyId)}
                            className="text-brand-600 hover:text-brand-700 flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-brand-50 transition"
                          >
                            <Eye size={14} /> 详情
                          </button>
                          {(isEmpty || isDirty) && (
                            <button
                              onClick={() => setSupplementTarget(r)}
                              className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-indigo-50 transition"
                            >
                              <Plus size={14} /> 补录
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-400 flex flex-wrap gap-4">
          <span>💡 提示：早高峰可能只记了一句备注，点击"详情"可反查到体温枪原始记录与请假条照片。</span>
          <span>🔍 导出记录数量 = 页面显示数量，确保客服核对无遗漏。</span>
          <span>🛡 已确认记录被撤回时自动保留完整审计快照，方便主管复查。</span>
        </div>
      </div>

      <BabyDetailDrawer
        open={!!selectedBabyId}
        onClose={() => setSelectedBabyId(null)}
        baby={selectedBaby}
        record={selectedRecord}
        thermometerRecords={selectedThermo}
        leaveRequests={selectedLeaves}
        appointments={selectedAppts}
      />

      <SupplementModal
        open={!!supplementTarget}
        onClose={() => setSupplementTarget(null)}
        record={supplementTarget}
        baby={supplementTarget ? babyMap[supplementTarget.babyId] : null}
      />

      <AuditLogPanel open={showAudit} onClose={() => setShowAudit(false)} logs={auditLogs} babies={babies} />
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${color}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs opacity-80">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs border transition ${
        active
          ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
          : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-600'
      }`}
    >
      {label}
    </button>
  );
}
