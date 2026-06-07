import { useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  FileDown,
  Pencil,
  Eye,
  Search,
  Filter,
  AlertTriangle,
  User,
  Clock,
  FileWarning,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { AuditActionType } from '@/types';
import { useState } from 'react';

const actionLabels: Record<AuditActionType, string> = {
  export: '导出数据',
  view: '查看记录',
  edit: '编辑变更',
  access_privacy: '访问隐私字段',
};

const actionIcons: Record<AuditActionType, any> = {
  export: FileDown,
  view: Eye,
  edit: Pencil,
  access_privacy: ShieldAlert,
};

const actionColors: Record<AuditActionType, string> = {
  export: 'bg-medical-50 text-medical-600 border-medical-200',
  view: 'bg-slate-50 text-slate-600 border-slate-200',
  edit: 'bg-violet-50 text-violet-600 border-violet-200',
  access_privacy: 'bg-warning-50 text-warning-600 border-warning-200',
};

export default function AuditPage() {
  const auditLogs = useAppStore((s) => s.auditLogs);
  const records = useAppStore((s) => s.records);
  const [filterAction, setFilterAction] = useState<AuditActionType | 'all'>('all');
  const [filterPrivacy, setFilterPrivacy] = useState<boolean | null>(null);
  const [keyword, setKeyword] = useState('');

  const filteredLogs = useMemo(() => {
    return auditLogs
      .filter((log) => {
        if (filterAction !== 'all' && log.actionType !== filterAction) return false;
        if (filterPrivacy !== null && log.containsPrivateData !== filterPrivacy) return false;
        if (keyword.trim()) {
          const kw = keyword.trim().toLowerCase();
          return (
            log.operatorName.toLowerCase().includes(kw) ||
            log.fieldsInvolved.some((f) => f.toLowerCase().includes(kw))
          );
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [auditLogs, filterAction, filterPrivacy, keyword]);

  const stats = useMemo(() => ({
    total: auditLogs.length,
    export: auditLogs.filter((l) => l.actionType === 'export').length,
    privacy: auditLogs.filter((l) => l.containsPrivateData).length,
    notDesensitized: auditLogs.filter((l) => l.containsPrivateData && !l.desensitized).length,
  }), [auditLogs]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-5">
        <h1 className="font-serif-sc text-2xl font-semibold text-slate-800">审计日志</h1>
        <p className="text-sm text-slate-500 mt-1">
          所有导出、编辑、查看隐私字段的操作均被永久记录，方便主管复查
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard label="全部操作" value={stats.total} icon={ShieldCheck} color="medical" />
        <StatCard label="导出次数" value={stats.export} icon={FileDown} color="medical" />
        <StatCard label="涉及隐私数据" value={stats.privacy} icon={ShieldAlert} color="warning" />
        <StatCard label="未脱敏导出" value={stats.notDesensitized} icon={FileWarning} color="danger" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索操作人 / 字段名..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value as AuditActionType | 'all')}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500 bg-white"
            >
              <option value="all">全部操作类型</option>
              <option value="export">导出数据</option>
              <option value="edit">编辑变更</option>
              <option value="view">查看记录</option>
              <option value="access_privacy">访问隐私字段</option>
            </select>
            <select
              value={String(filterPrivacy)}
              onChange={(e) => setFilterPrivacy(e.target.value === 'null' ? null : e.target.value === 'true')}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500 bg-white"
            >
              <option value="null">全部隐私状态</option>
              <option value="true">涉及隐私数据</option>
              <option value="false">不含隐私数据</option>
            </select>
          </div>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-16 text-center">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-slate-500">暂无匹配的审计记录</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wide">操作</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wide">操作人</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wide">关联记录</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wide">格式</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wide">隐私数据</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wide">涉及字段</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs uppercase tracking-wide">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log, idx) => {
                const Icon = actionIcons[log.actionType];
                const rec = log.recordId ? records.find((r) => r.id === log.recordId) : null;
                return (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors animate-fade-in-up" style={{ animationDelay: `${idx * 20}ms` }}>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${actionColors[log.actionType]}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {actionLabels[log.actionType]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-medical-100 text-medical-700 text-xs flex items-center justify-center font-medium">
                          {log.operatorName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-slate-700 font-medium">{log.operatorName}</p>
                          <p className="text-xs text-slate-400">{log.ipAddress}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {rec ? (
                        <div>
                          <p className="text-slate-700 font-medium">{rec.nickname}</p>
                          <p className="text-xs text-slate-400">{rec.babyName}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">全量导出</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {log.exportFormat ? (
                        <span className="text-xs font-mono uppercase px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                          {log.exportFormat}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {log.containsPrivateData ? (
                        <div className="flex items-center gap-1.5">
                          {log.desensitized ? (
                            <span className="inline-flex items-center gap-1 text-xs text-safety-600 bg-safety-50 px-2 py-0.5 rounded">
                              <ShieldCheck className="w-3 h-3" /> 已脱敏
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-danger-600 bg-danger-50 px-2 py-0.5 rounded">
                              <AlertTriangle className="w-3 h-3" /> 未脱敏
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <div className="flex flex-wrap gap-1">
                        {log.fieldsInvolved.slice(0, 4).map((f) => (
                          <span key={f} className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                            {f}
                          </span>
                        ))}
                        {log.fieldsInvolved.length > 4 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">
                            +{log.fieldsInvolved.length - 4}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span className="font-mono">{log.createdAt}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5 bg-gradient-to-br from-warning-50 to-danger-50 border border-warning-200 rounded-xl p-4">
        <h3 className="font-serif-sc text-sm font-semibold text-warning-700 mb-2 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          主管复查须知
        </h3>
        <ul className="text-xs text-warning-700/80 space-y-1.5">
          <li>• 重点关注 <strong className="text-danger-600">「未脱敏」</strong> 的导出记录，确认是否符合审批流程</li>
          <li>• 查看「访问隐私字段」操作，确认是否为业务必要</li>
          <li>• 批量导出含隐私字段的操作需重点复核操作人和用途</li>
          <li>• 审计日志不可删除、不可篡改，永久保留</li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  const colorMap: Record<string, string> = {
    medical: 'from-medical-500 to-medical-600',
    warning: 'from-warning-500 to-warning-600',
    danger: 'from-danger-500 to-danger-600',
    safety: 'from-safety-500 to-safety-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} text-white flex items-center justify-center shadow-md`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-xs text-slate-500 mb-0.5">{label}</div>
        <div className="text-2xl font-serif-sc font-semibold text-slate-800">{value}</div>
      </div>
    </div>
  );
}
