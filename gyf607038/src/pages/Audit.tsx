import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, RotateCcw, Shield } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ActionBadge } from '@/components/Badges';
import type { AuditFilters, AuditAction } from '@/utils/types';
import { ROLE_LABEL } from '@/utils/types';
import { formatDateTime } from '@/utils/helpers';

export default function Audit() {
  const { getAudits, currentUser } = useAppStore();
  const auditsState = useAppStore((s) => s.audits);
  const [filters, setFilters] = useState<AuditFilters>({});

  const audits = useMemo(() => getAudits(filters), [getAudits, filters, auditsState]);

  const reset = () => setFilters({});
  const setField = <K extends keyof AuditFilters>(k: K, v: AuditFilters[K]) =>
    setFilters({ ...filters, [k]: v });

  const isPrincipal = currentUser.role === 'principal';

  return (
    <div className="space-y-5">
      {!isPrincipal && (
        <div className="card border-warn-200 bg-warn-50/60 px-4 py-3 text-sm text-warn-700">
          当前以「课程顾问」身份查看，仅园长可进行审计管理。可点击右上角切换身份。
        </div>
      )}

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Search size={15} className="text-slate-400" />
            <input
              className="input w-56"
              placeholder="搜索摘要/操作人"
              value={filters.keyword || ''}
              onChange={(e) => setField('keyword', e.target.value)}
            />
          </div>
          <select
            className="input w-36"
            value={filters.action || ''}
            onChange={(e) => setField('action', (e.target.value as AuditAction) || '')}
          >
            <option value="">全部操作</option>
            <option value="create">新增</option>
            <option value="update">修改</option>
            <option value="review">复核</option>
            <option value="append">追加材料</option>
            <option value="export">导出</option>
          </select>
          <input
            className="input w-40"
            placeholder="操作人"
            value={filters.operator || ''}
            onChange={(e) => setField('operator', e.target.value)}
          />
          <input
            type="date"
            className="input w-40"
            value={filters.dateFrom || ''}
            onChange={(e) => setField('dateFrom', e.target.value)}
          />
          <span className="text-slate-400 text-sm">至</span>
          <input
            type="date"
            className="input w-40"
            value={filters.dateTo || ''}
            onChange={(e) => setField('dateTo', e.target.value)}
          />
          <button onClick={reset} className="btn-ghost">
            <RotateCcw size={14} /> 重置
          </button>
          <div className="flex-1" />
          <div className="text-sm text-slate-500">
            共 <span className="font-semibold text-slate-700">{audits.length}</span> 条审计记录
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-th w-44">时间</th>
              <th className="table-th w-28">操作</th>
              <th className="table-th w-32">操作人</th>
              <th className="table-th w-24">角色</th>
              <th className="table-th">操作摘要</th>
              <th className="table-th w-32">关联记录</th>
            </tr>
          </thead>
          <tbody>
            {audits.length === 0 && (
              <tr>
                <td colSpan={6} className="table-td text-center text-slate-400 py-10">
                  暂无符合条件的审计记录
                </td>
              </tr>
            )}
            {audits.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="table-td text-xs text-slate-500">{formatDateTime(a.createdAt)}</td>
                <td className="table-td"><ActionBadge action={a.action} /></td>
                <td className="table-td">
                  <div className="flex items-center gap-1.5">
                    <Shield size={13} className="text-slate-400" />
                    {a.operator}
                  </div>
                </td>
                <td className="table-td text-xs text-slate-500">{ROLE_LABEL[a.operatorRole]}</td>
                <td className="table-td">{a.summary}</td>
                <td className="table-td">
                  {a.recordId ? (
                    <Link to={`/record/${a.recordId}`} className="text-brand-700 hover:underline text-xs">
                      查看记录
                    </Link>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
