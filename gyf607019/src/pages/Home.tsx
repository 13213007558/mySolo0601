import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, FileDown, CheckSquare, Square, AlertTriangle, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import AuthCard from '@/components/AuthCard';
import { useAppStore } from '@/store/useAppStore';
import type { AuthorizationStatus } from '@/types';
import { STATUS_LABEL } from '@/types';

export default function Home() {
  const navigate = useNavigate();
  const records = useAppStore((s) => s.records);
  const selectedIds = useAppStore((s) => s.selectedRecordIds);
  const searchKeyword = useAppStore((s) => s.searchKeyword);
  const filterStatus = useAppStore((s) => s.filterStatus);
  const filterHasException = useAppStore((s) => s.filterHasException);
  const filterSupplemented = useAppStore((s) => s.filterSupplemented);
  const setSearchKeyword = useAppStore((s) => s.setSearchKeyword);
  const setFilterStatus = useAppStore((s) => s.setFilterStatus);
  const setFilterHasException = useAppStore((s) => s.setFilterHasException);
  const setFilterSupplemented = useAppStore((s) => s.setFilterSupplemented);
  const selectAll = useAppStore((s) => s.selectAll);
  const clearSelection = useAppStore((s) => s.clearSelection);

  const stats = useMemo(() => {
    return {
      total: records.length,
      pending: records.filter((r) => r.status === 'pending').length,
      approved: records.filter((r) => r.status === 'approved').length,
      rejected: records.filter((r) => r.status === 'rejected').length,
      partial: records.filter((r) => r.status === 'partial').length,
      exception: records.filter((r) => r.phoneValidationIssues?.length || r.status === 'partial' || r.status === 'rejected').length,
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (filterSupplemented !== null && r.isSupplemented !== filterSupplemented) return false;
      const hasException = !!r.phoneValidationIssues?.length || r.status === 'partial' || r.status === 'rejected';
      if (filterHasException !== null && hasException !== filterHasException) return false;
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        return (
          r.nickname.toLowerCase().includes(kw) ||
          r.babyName.toLowerCase().includes(kw) ||
          r.authorizerName.toLowerCase().includes(kw) ||
          r.authorizerPhone.includes(kw)
        );
      }
      return true;
    });
  }, [records, filterStatus, filterSupplemented, filterHasException, searchKeyword]);

  const statusOptions: (AuthorizationStatus | 'all')[] = ['all', 'pending', 'approved', 'rejected', 'partial'];

  const statCards = [
    { label: '待复核', value: stats.pending, color: 'warning', icon: Clock },
    { label: '已通过', value: stats.approved, color: 'safety', icon: CheckCircle },
    { label: '已驳回', value: stats.rejected, color: 'danger', icon: XCircle },
    { label: '部分通过', value: stats.partial, color: 'medical', icon: AlertTriangle },
    { label: '异常记录', value: stats.exception, color: 'warning', icon: AlertCircle },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="grid grid-cols-5 gap-4 mb-6">
        {statCards.map((s, idx) => {
          const Icon = s.icon;
          const colorMap: Record<string, string> = {
            safety: 'from-safety-500 to-safety-600',
            warning: 'from-warning-500 to-warning-600',
            danger: 'from-danger-500 to-danger-600',
            medical: 'from-medical-500 to-medical-600',
          };
          return (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-slate-200 shadow-card p-4 flex items-center gap-4 opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[s.color]} text-white flex items-center justify-center shadow-md`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-0.5">{s.label}</div>
                <div className="text-2xl font-serif-sc font-semibold text-slate-800">{s.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索昵称 / 姓名 / 手机号..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as AuthorizationStatus | 'all')}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500 bg-white"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s === 'all' ? '全部状态' : STATUS_LABEL[s]}</option>
              ))}
            </select>
            <select
              value={String(filterHasException)}
              onChange={(e) => setFilterHasException(e.target.value === 'null' ? null : e.target.value === 'true')}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500 bg-white"
            >
              <option value="null">全部异常状态</option>
              <option value="true">仅异常</option>
              <option value="false">无异常</option>
            </select>
            <select
              value={String(filterSupplemented)}
              onChange={(e) => setFilterSupplemented(e.target.value === 'null' ? null : e.target.value === 'true')}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500 bg-white"
            >
              <option value="null">全部补录状态</option>
              <option value="true">仅手工补录</option>
              <option value="false">非补录</option>
            </select>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => (selectedIds.length === filteredRecords.length && selectedIds.length > 0 ? clearSelection() : selectAll())}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {selectedIds.length === filteredRecords.length && selectedIds.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-medical-600" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              全选 ({selectedIds.length}/{filteredRecords.length})
            </button>
            <button
              disabled={selectedIds.length === 0}
              onClick={() => navigate('/export')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-medical-600 hover:bg-medical-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
            >
              <FileDown className="w-4 h-4" />
              批量导出
            </button>
          </div>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-16 text-center">
          <div className="text-5xl mb-3">🔍</div>
          <p className="text-slate-500">未找到匹配的授权记录</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredRecords.map((rec, idx) => (
            <AuthCard key={rec.id} record={rec} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
