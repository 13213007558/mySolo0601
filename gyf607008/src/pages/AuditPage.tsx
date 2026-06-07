import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  FileEdit,
  Pencil,
  Download,
  UserCheck,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Filter,
  Eye,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { AuditAction, AuditLog } from '@shared/types';

export function AuditPage() {
  const auditLogs = useAppStore((s) => s.auditLogs);
  const auditFilters = useAppStore((s) => s.auditFilters);
  const setAuditFilters = useAppStore((s) => s.setAuditFilters);
  const fetchAuditLogs = useAppStore((s) => s.fetchAuditLogs);
  const loading = useAppStore((s) => s.loading);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const getActionMeta = (action: AuditAction) => {
    switch (action) {
      case 'create':
        return { label: '创建', icon: <FileEdit size={11} />, cls: 'text-sky-400 bg-sky-950/50 border-sky-800/50' };
      case 'update':
        return { label: '修改', icon: <Pencil size={11} />, cls: 'text-amber-400 bg-amber-950/50 border-amber-800/50' };
      case 'review':
        return { label: '复核', icon: <UserCheck size={11} />, cls: 'text-emerald-400 bg-emerald-950/50 border-emerald-800/50' };
      case 'export':
        return { label: '导出', icon: <Download size={11} />, cls: 'text-purple-400 bg-purple-950/50 border-purple-800/50' };
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-night-surface/50 border-b border-night-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold flex items-center gap-1.5">
              <History size={15} className="text-accent-amber" />
              历史审计
            </h1>
            <p className="text-[11px] text-night-muted mt-0.5">
              共 {auditLogs.length} 条操作记录 · 客服主管可追溯所有操作人、时间与变更内容
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAuditLogs()}
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
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-night-border grid grid-cols-5 gap-3">
            <div>
              <label className="block text-[10px] text-night-muted mb-1">操作人</label>
              <input
                value={auditFilters.operator || ''}
                onChange={(e) => setAuditFilters({ operator: e.target.value })}
                placeholder="如 刘老师"
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-[10px] text-night-muted mb-1">操作类型</label>
              <select
                value={auditFilters.action || ''}
                onChange={(e) => setAuditFilters({ action: e.target.value as AuditAction | '' })}
                className="form-input"
              >
                <option value="">全部</option>
                <option value="create">创建</option>
                <option value="update">修改</option>
                <option value="review">复核</option>
                <option value="export">导出</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-night-muted mb-1">记录 ID</label>
              <input
                value={auditFilters.recordId || ''}
                onChange={(e) => setAuditFilters({ recordId: e.target.value })}
                placeholder="如 rec-xxx"
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-[10px] text-night-muted mb-1">开始日期</label>
              <input
                type="date"
                value={auditFilters.dateFrom || ''}
                onChange={(e) => setAuditFilters({ dateFrom: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-[10px] text-night-muted mb-1">结束日期</label>
              <input
                type="date"
                value={auditFilters.dateTo || ''}
                onChange={(e) => setAuditFilters({ dateTo: e.target.value })}
                className="form-input"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-night-surface/95 backdrop-blur border-b border-night-border">
            <tr className="text-night-muted text-left">
              <th className="px-4 py-2.5 w-8"></th>
              <th className="px-3 py-2.5 font-medium">时间</th>
              <th className="px-3 py-2.5 font-medium">操作类型</th>
              <th className="px-3 py-2.5 font-medium">操作人</th>
              <th className="px-3 py-2.5 font-medium">宝宝姓名</th>
              <th className="px-3 py-2.5 font-medium">记录 ID</th>
              <th className="px-3 py-2.5 font-medium">变更字段数</th>
              <th className="px-3 py-2.5 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log, idx) => {
              const meta = getActionMeta(log.action);
              const expanded = expandedIds.has(log.id);
              return (
                <>
                  <tr
                    key={log.id}
                    className={`border-b border-night-border/60 hover:bg-night-border/30 ${
                      idx % 2 === 1 ? 'bg-night-surface/20' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      {log.fieldChanges.length > 0 && (
                        <button
                          onClick={() => toggleExpand(log.id)}
                          className="text-night-muted hover:text-night-text"
                        >
                          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-night-muted text-[11px]">{log.timestamp}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${meta.cls}`}>
                        {meta.icon}
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-night-text">{log.operator}</td>
                    <td className="px-3 py-2.5 text-night-text font-medium">{log.babyName}</td>
                    <td className="px-3 py-2.5 font-mono text-night-muted text-[11px]">{log.recordId}</td>
                    <td className="px-3 py-2.5 text-night-muted">{log.fieldChanges.length} 项</td>
                    <td className="px-3 py-2.5">
                      <Link
                        to={`/records/${log.recordId}`}
                        className="p-1.5 rounded text-night-muted hover:text-night-text hover:bg-night-border/60 inline-flex"
                        title="查看记录"
                      >
                        <Eye size={13} />
                      </Link>
                    </td>
                  </tr>
                  {expanded && log.fieldChanges.length > 0 && (
                    <tr className="bg-night-bg border-b border-night-border/60">
                      <td colSpan={8} className="px-8 py-3">
                        <div className="text-[10px] text-night-muted mb-2">变更明细：</div>
                        <div className="space-y-1.5">
                          {log.fieldChanges.map((fc, i) => (
                            <FieldDiffRow key={i} field={fc.field} oldValue={fc.oldValue} newValue={fc.newValue} />
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {auditLogs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-night-muted text-xs">
                  暂无审计记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FieldDiffRow({ field, oldValue, newValue }: { field: string; oldValue: string; newValue: string }) {
  return (
    <div className="flex items-start gap-3 text-xs">
      <span className="w-40 shrink-0 text-night-muted font-mono pt-0.5">{field}</span>
      <div className="flex-1 flex items-start gap-2 flex-wrap">
        {oldValue && (
          <span className="px-2 py-0.5 rounded bg-red-950/40 border border-red-800/40 text-red-300 line-through break-all max-w-md">
            {oldValue}
          </span>
        )}
        {oldValue && newValue && <span className="text-night-muted pt-0.5">→</span>}
        <span className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 break-all max-w-md">
          {newValue || '(空)'}
        </span>
      </div>
    </div>
  );
}
