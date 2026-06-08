import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, AlertTriangle, AlertOctagon, UserCheck, ChevronDown, ChevronUp, Eye, EyeOff, Database, RefreshCw } from 'lucide-react';
import { appStore } from '@/store/app';
import type { AuditLog, CompensationTask, UserRole } from '@shared/types';

const actionLabels: Record<AuditLog['action'], string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  handle_exception: '处理异常',
  manual_record: '手工补录',
  history_lost: '历史丢失',
};

const targetLabels: Record<AuditLog['targetType'], string> = {
  record: '消毒记录',
  exception: '异常记录',
  baby: '宝宝信息',
  export: '数据导出',
};

const syncLabels: Record<AuditLog['syncStatus'], { label: string; cls: string; icon: typeof CheckCircle }> = {
  success: { label: '全部同步', cls: 'bg-green-100 text-green-700', icon: CheckCircle },
  partial: { label: '部分同步', cls: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  failed: { label: '同步失败', cls: 'bg-red-100 text-red-700', icon: AlertOctagon },
};

const defaultSync: { label: string; cls: string; icon: typeof CheckCircle } = {
  label: '未知状态', cls: 'bg-gray-100 text-gray-600', icon: Clock,
};

function getActionLabel(action: string): string {
  return (actionLabels as Record<string, string>)[action] || action;
}

function getTargetLabel(target: string): string {
  return (targetLabels as Record<string, string>)[target] || target;
}

function getSyncInfo(status: string): { label: string; cls: string; icon: typeof CheckCircle } {
  return (syncLabels as Record<string, { label: string; cls: string; icon: typeof CheckCircle }>)[status] || defaultSync;
}

function JsonDiff({ before, after }: { before: unknown; after: unknown }) {
  const format = (v: unknown) => {
    if (v === null || v === undefined) return <span className="text-gray-400 italic">空</span>;
    return <span className="font-mono text-xs">{JSON.stringify(v, null, 0)}</span>;
  };

  const entriesB = before && typeof before === 'object' ? Object.entries(before as Record<string, unknown>) : [];
  const entriesA = after && typeof after === 'object' ? Object.entries(after as Record<string, unknown>) : [];
  const keys = new Set([...entriesB.map(([k]) => k), ...entriesA.map(([k]) => k)]);

  return (
    <div className="space-y-1.5">
      {Array.from(keys).map((k) => {
        const bv = (before as Record<string, unknown>)?.[k];
        const av = (after as Record<string, unknown>)?.[k];
        const changed = JSON.stringify(bv) !== JSON.stringify(av);
        return (
          <div key={k} className={`grid grid-cols-3 gap-3 text-xs ${changed ? 'bg-yellow-50 rounded px-2 py-1 -mx-2' : ''}`}>
            <span className="text-gray-500 font-medium">{k}</span>
            <div className={changed ? 'text-red-600 line-through' : 'text-gray-600'}>{format(bv)}</div>
            <div className={changed ? 'text-green-700 font-semibold' : 'text-gray-600'}>{format(av)}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function Audit() {
  const { auditLogs, compensationTasks, selectedRole, reviewAudit, fetchCompensationTasks, retryCompensationTask } = appStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewId, setReviewId] = useState<string | null>(null);
  const isSupervisor = selectedRole === 'supervisor' || selectedRole === 'admin';

  useEffect(() => {
    fetchCompensationTasks();
    const timer = setInterval(() => fetchCompensationTasks(), 10 * 1000);
    return () => clearInterval(timer);
  }, [fetchCompensationTasks]);

  async function doReview() {
    if (!reviewId || !reviewComment.trim()) return;
    await reviewAudit(reviewId, reviewComment.trim());
    setReviewId(null);
    setReviewComment('');
  }

  const statusLabels: Record<CompensationTask['status'], { label: string; cls: string; icon: typeof Clock }> = {
    pending: { label: '等待重试', cls: 'bg-amber-100 text-amber-700', icon: Clock },
    processing: { label: '处理中', cls: 'bg-blue-100 text-blue-700', icon: RefreshCw },
    success: { label: '补偿成功', cls: 'bg-green-100 text-green-700', icon: CheckCircle },
    failed: { label: '补偿失败', cls: 'bg-red-100 text-red-700', icon: AlertOctagon },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif-sc text-2xl font-bold text-gray-800">审计记录</h2>
          <p className="text-sm text-gray-500 mt-1">
            所有操作永久留存，永不删除，用于主管复查与追溯
            {isSupervisor ? '（您可标记复查）' : '（仅主管可标记复查）'}
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-lg bg-gray-50 text-sm text-gray-600 border border-gray-200">
            共 {auditLogs.length} 条
          </span>
        </div>
      </div>

      {isSupervisor && compensationTasks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-700" />
              <h3 className="font-semibold text-amber-800 text-sm">补偿任务队列</h3>
              <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-800 text-xs font-semibold">
                {compensationTasks.filter((t) => t.status !== 'success').length} 待处理
              </span>
            </div>
            <button
              onClick={fetchCompensationTasks}
              className="text-xs text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> 刷新
            </button>
          </div>
          <div className="divide-y divide-amber-100">
            {compensationTasks.map((task) => {
              const s = statusLabels[task.status];
              const StatusIcon = s.icon;
              return (
                <div key={task.id} className="px-5 py-3 grid grid-cols-12 items-center text-sm">
                  <div className="col-span-3 text-xs text-gray-500 font-mono">
                    {task.createdAt ? new Date(task.createdAt).toLocaleString('zh-CN') : '-'}
                  </div>
                  <div className="col-span-2 text-xs text-gray-600">
                    {task.targetType === 'exception' ? '异常记录' : task.targetType}
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${s.cls}`}>
                      <StatusIcon className="w-3 h-3" />
                      {s.label}
                    </span>
                  </div>
                  <div className="col-span-2 text-xs text-gray-600">
                    重试 {task.retryCount}/{task.maxRetries}
                  </div>
                  <div className="col-span-2 text-xs text-gray-500 truncate">
                    {task.lastError || '-'}
                  </div>
                  <div className="col-span-1 text-right">
                    {task.status !== 'success' && task.retryCount < task.maxRetries && (
                      <button
                        onClick={() => retryCompensationTask(task.id)}
                        className="text-xs bg-amber-500 text-white px-2 py-1 rounded hover:bg-amber-600 transition"
                      >
                        手动重试
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="px-5 py-2 bg-amber-50/50 text-xs text-amber-700 border-t border-amber-100">
            补偿任务由系统自动重试（最大{compensationTasks[0]?.maxRetries || 5}次），服务重启后自动加载未完成任务继续执行。
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-600 border-b border-gray-100">
          <div className="col-span-2">操作时间</div>
          <div className="col-span-1">类型</div>
          <div className="col-span-1">对象</div>
          <div className="col-span-2">操作人</div>
          <div className="col-span-2">同步状态</div>
          <div className="col-span-2">变更摘要</div>
          <div className="col-span-2 text-right">操作</div>
        </div>

        <div className="divide-y divide-gray-100">
          {auditLogs.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>暂无审计记录</p>
            </div>
          ) : (
            auditLogs.map((log) => {
              const sync = getSyncInfo(log.syncStatus || '');
              const SyncIcon = sync.icon;
              const isOpen = expanded === log.id;
              const actionLabel = getActionLabel(log.action || '');
              const targetLabel = getTargetLabel(log.targetType || '');
              return (
                <div key={log.id || String(Math.random())}>
                  <div
                    className="grid grid-cols-12 px-5 py-3 text-sm items-center hover:bg-gray-50/60 cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : log.id || '')}
                  >
                    <div className="col-span-2 text-gray-500 text-xs font-mono">
                      {log.operateTime ? new Date(log.operateTime).toLocaleString('zh-CN') : '-'}
                    </div>
                    <div className="col-span-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        log.action === 'history_lost' ? 'bg-amber-100 text-amber-700' : 'bg-primary-50 text-primary'
                      }`}>
                        {actionLabel}
                      </span>
                    </div>
                    <div className="col-span-1 text-gray-600 text-xs">{targetLabel}</div>
                    <div className="col-span-2 text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm">{log.operatorName || '-'}</span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${sync.cls}`}>
                        <SyncIcon className="w-3 h-3" />
                        {sync.label}
                        {log.retryCount > 0 && <span className="ml-1 opacity-80">重试{log.retryCount}</span>}
                      </span>
                    </div>
                    <div className="col-span-2 text-xs text-gray-500 truncate">
                      {log.afterData && typeof log.afterData === 'object'
                        ? Object.keys(log.afterData).slice(0, 3).join(', ') || '-'
                        : '-'}
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      {isSupervisor && (log.action === 'handle_exception' || log.action === 'history_lost') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setReviewId(log.id); }}
                          className="px-2.5 py-1 rounded text-xs font-semibold bg-primary text-white hover:bg-primary-600 transition"
                        >
                          复查
                        </button>
                      )}
                      <span className="text-gray-400">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="bg-gray-50/80 px-5 py-4 border-t border-gray-100">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1 bg-white rounded-lg border border-gray-200 p-4">
                          <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 基本信息
                          </h4>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between"><span className="text-gray-500">日志ID</span><span className="font-mono text-gray-700">{log.id || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">操作类型</span><span className="text-gray-700">{actionLabel}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">目标类型</span><span className="text-gray-700">{targetLabel}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">目标ID</span><span className="font-mono text-gray-700">{log.targetId || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">操作人ID</span><span className="font-mono text-gray-700">{log.operatorId || '-'}</span></div>
                          </div>
                        </div>

                        <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-4">
                          <h4 className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1">
                            {isOpen ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />} 变更详情（变更前 → 变更后）
                          </h4>
                          <div className="grid grid-cols-3 gap-3 text-[11px] text-gray-500 font-semibold pb-1 border-b border-gray-100 mb-2">
                            <span>字段</span>
                            <span>变更前</span>
                            <span>变更后</span>
                          </div>
                          <JsonDiff before={log.beforeData} after={log.afterData} />
                          <p className="text-[11px] text-gray-400 mt-3 pt-2 border-t border-gray-100">
                            注：所有隐私字段在日志存储前已强制脱敏，审计人员仅能查看掩码后内容。
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {reviewId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-primary text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-serif-sc text-lg font-bold">主管复查标记</h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600">
                标记复查后，该异常处理记录将被确认，请填写复查意见。
              </p>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
                placeholder="请填写复查意见..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setReviewId(null); setReviewComment(''); }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  取消
                </button>
                <button
                  onClick={doReview}
                  disabled={!reviewComment.trim()}
                  className="px-5 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-600 disabled:opacity-50 transition"
                >
                  确认复查
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
