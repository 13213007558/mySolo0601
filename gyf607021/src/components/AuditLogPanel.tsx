import { X, ShieldAlert, CheckCircle, AlertTriangle, ArrowRight, FileText, RefreshCw, Sparkles } from 'lucide-react';
import type { AuditLog, Baby } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  logs: AuditLog[];
  babies: Baby[];
}

const actionLabel: Record<string, string> = {
  create: '创建',
  update: '更新',
  confirm: '确认',
  withdraw: '撤回',
  supplement: '手工补录',
  export: '导出',
  review: '主管复核',
};

const actionIcon: Record<string, React.ReactNode> = {
  create: <FileText size={13} />,
  update: <RefreshCw size={13} />,
  confirm: <CheckCircle size={13} />,
  withdraw: <AlertTriangle size={13} />,
  supplement: <Sparkles size={13} />,
  export: <FileText size={13} />,
  review: <ShieldAlert size={13} />,
};

const actionColor: Record<string, string> = {
  create: 'bg-slate-100 text-slate-600 border-slate-200',
  update: 'bg-blue-100 text-blue-600 border-blue-200',
  confirm: 'bg-emerald-100 text-emerald-600 border-emerald-200',
  withdraw: 'bg-rose-100 text-rose-600 border-rose-200',
  supplement: 'bg-indigo-100 text-indigo-600 border-indigo-200',
  export: 'bg-amber-100 text-amber-600 border-amber-200',
  review: 'bg-purple-100 text-purple-600 border-purple-200',
};

export default function AuditLogPanel({ open, onClose, logs, babies }: Props) {
  if (!open) return null;

  const babyMap: Record<string, Baby> = {};
  babies.forEach((b) => (babyMap[b.id] = b));

  const sortedLogs = [...logs].sort((a, b) => (a.operatedAt < b.operatedAt ? 1 : -1));

  const findBabyName = (targetId: string, targetType: string) => {
    if (targetType === 'baby') return babyMap[targetId]?.name || targetId;
    if (targetType === 'morning_check') {
      const match = babies.find((b) => targetId.includes(b.id));
      if (match) return match.name;
      return `晨检记录 ${targetId}`;
    }
    if (targetType === 'appointment') return `预约 ${targetId}`;
    return targetId;
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-3xl bg-white shadow-2xl overflow-y-auto flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">审计日志</h2>
              <p className="text-xs text-gray-400">所有操作均被不可篡改地记录，供主管复查</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 px-5 py-4">
          <div className="relative pl-6">
            <div className="absolute left-[11px] top-0 bottom-0 w-px bg-gray-200" />
            {sortedLogs.map((log) => (
              <div key={log.id} className="relative mb-4">
                <div className={`absolute -left-6 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                  log.action === 'withdraw' ? 'bg-rose-500'
                  : log.action === 'confirm' ? 'bg-emerald-500'
                  : log.action === 'supplement' ? 'bg-indigo-500'
                  : log.action === 'review' ? 'bg-purple-500'
                  : 'bg-gray-400'
                } text-white`}>
                  {actionIcon[log.action]}
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md transition">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs border flex items-center gap-1 ${actionColor[log.action] || 'bg-gray-100'}`}>
                        {actionIcon[log.action]}
                        {actionLabel[log.action] || log.action}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {findBabyName(log.targetId, log.targetType)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{log.operatedAt}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    操作人：<span className="text-gray-700">{log.operator}</span>
                    {log.reason && (
                      <span className="ml-2">· 原因：<span className="text-gray-700">{log.reason}</span></span>
                    )}
                  </div>
                  {(log.beforeSnapshot || log.afterSnapshot) && (
                    <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100 grid grid-cols-2 gap-2 text-[11px]">
                      {log.beforeSnapshot && (
                        <div>
                          <div className="text-gray-400 mb-1 font-medium">变更前</div>
                          <pre className="text-gray-600 whitespace-pre-wrap break-all font-mono leading-relaxed">
                            {JSON.stringify(simplifySnapshot(log.beforeSnapshot), null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.afterSnapshot && (
                        <div>
                          <div className="text-gray-400 mb-1 font-medium flex items-center gap-1">
                            变更后 <ArrowRight size={10} className="text-emerald-500" />
                          </div>
                          <pre className="text-emerald-700 whitespace-pre-wrap break-all font-mono leading-relaxed">
                            {JSON.stringify(simplifySnapshot(log.afterSnapshot), null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function simplifySnapshot(snap: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const keys = ['status', 'temperature', 'confirmedAt', 'reviewedBy', 'reviewedAt', 'remark', 'quickNote', 'dataQuality', 'babyId', 'scheduledAt', 'type', 'reason', 'filterPhone', 'count'];
  keys.forEach((k) => {
    if (snap[k] !== undefined) out[k] = snap[k];
  });
  if (Object.keys(out).length === 0) return snap;
  return out;
}
