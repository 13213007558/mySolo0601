import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ScrollText, User, Clock, History, Shield } from 'lucide-react';
import {
  AUDIT_ACTION_LABEL,
  AUDIT_ACTION_CLASS,
  formatDateTime,
} from '@/utils/format';
import { applyPrivacyFilter, sanitizeForLog } from '@/utils/privacyFilter';
import type { AuditLog, Role } from '@/types';

export default function AuditPage() {
  const rawLogs = useAppStore((s) => s.auditLogs);
  const allUsers = useAppStore((s) => s.users);
  const allRecords = useAppStore((s) => s.records);
  const allBabies = useAppStore((s) => s.babies);
  const currentUserId = useAppStore((s) => s.currentUserId);

  const role = useMemo<Role>(() => {
    const u = allUsers.find((x) => x.id === currentUserId);
    return u?.role ?? 'nurse';
  }, [allUsers, currentUserId]);

  const usersMap = useMemo(
    () => new Map(allUsers.map((u) => [u.id, u])),
    [allUsers]
  );
  const recordsMap = useMemo(
    () => new Map(allRecords.map((r) => [r.id, r])),
    [allRecords]
  );
  const babiesMap = useMemo(
    () => new Map(allBabies.map((b) => [b.id, b])),
    [allBabies]
  );

  const logs = useMemo<AuditLog[]>(
    () => applyPrivacyFilter(rawLogs, role) as AuditLog[],
    [rawLogs, role]
  );

  useMemo(() => {
    console.log(
      '[AUDIT LOG] 按角色过滤后日志数量（console 输出已脱敏）',
      sanitizeForLog({ count: logs.length, viewerRole: role }, role)
    );
  }, [logs, role]);

  const sortedLogs = useMemo(
    () =>
      [...logs].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [logs]
  );

  const withdrawOrCorrect = useMemo(
    () =>
      sortedLogs.filter(
        (l) => l.action === 'withdraw' || l.action === 'correct'
      ).length,
    [sortedLogs]
  );
  const manualCount = useMemo(
    () => sortedLogs.filter((l) => l.action === 'manual_create').length,
    [sortedLogs]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 tracking-tight">
          审计日志
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          所有操作均写入不可变更的审计追踪，撤回记录保留完整快照供主管复查
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            总操作记录
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-slate-800">
            {sortedLogs.length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <ScrollText className="w-3.5 h-3.5" />
            撤回 / 整改
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-coral-600">
            {withdrawOrCorrect}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            手工补录
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-amber-600">
            {manualCount}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-display font-semibold text-slate-800">完整日志</h2>
          <p className="text-[11px] text-slate-400">
            当前视图：
            {role === 'nurse'
              ? '护理员（已脱敏）'
              : role === 'supervisor'
                ? '主管（完整可见）'
                : '管理员'}
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {sortedLogs.map((log) => {
            const operator = log.operatorId
              ? usersMap.get(log.operatorId)
              : undefined;
            const record = recordsMap.get(log.recordId);
            const baby = record ? babiesMap.get(record.babyId) : undefined;
            const filteredBaby = baby
              ? (applyPrivacyFilter(baby, role) as typeof baby)
              : null;
            return (
              <div
                key={log.id}
                className="p-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`chip ${AUDIT_ACTION_CLASS[log.action]} flex-shrink-0 mt-0.5`}
                  >
                    {AUDIT_ACTION_LABEL[log.action]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        操作人：
                        {operator
                          ? (applyPrivacyFilter(operator, role) as any).name
                          : '—'}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(log.timestamp)}
                      </span>
                      {filteredBaby && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-teal-700">
                            对象：{filteredBaby.name}
                          </span>
                        </>
                      )}
                    </div>
                    {log.reason && (
                      <p className="mt-1.5 text-sm text-slate-700">
                        {log.reason}
                      </p>
                    )}
                    {(log.beforeSnapshot || log.afterSnapshot) && (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-mono">
                        {log.beforeSnapshot && (
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-slate-400 mb-0.5">操作前</p>
                            <pre className="text-slate-600 whitespace-pre-wrap">
                              {JSON.stringify(log.beforeSnapshot, null, 1)}
                            </pre>
                          </div>
                        )}
                        {log.afterSnapshot && (
                          <div className="p-2 bg-teal-50 rounded-lg border border-teal-100">
                            <p className="text-teal-500 mb-0.5">操作后</p>
                            <pre className="text-teal-800 whitespace-pre-wrap">
                              {JSON.stringify(log.afterSnapshot, null, 1)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
