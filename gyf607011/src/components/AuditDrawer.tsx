import { useEffect } from 'react';
import { X, History, RotateCcw } from 'lucide-react';
import { useAuditStore } from '../stores/auditStore';
import type { AuditLog } from '../../shared/types';

interface AuditDrawerProps {
  open: boolean;
  onClose: () => void;
  recordId: string;
  recordTitle: string;
}

const operationLabels: Record<AuditLog['operationType'], { label: string; color: string }> = {
  create: { label: '创建', color: 'bg-medical-100 text-medical-700' },
  update: { label: '修改', color: 'bg-blue-100 text-blue-700' },
  delete: { label: '删除', color: 'bg-red-100 text-red-700' },
  'manual-entry': { label: '手工补录', color: 'bg-warm-100 text-warm-700' },
  rollback: { label: '回退', color: 'bg-gray-200 text-gray-700' },
};

export default function AuditDrawer({ open, onClose, recordId, recordTitle }: AuditDrawerProps) {
  const { fetchByRecord, logsByRecord, loading } = useAuditStore();
  const logs = logsByRecord[recordId] ?? [];

  useEffect(() => {
    if (open && recordId) {
      fetchByRecord(recordId);
    }
  }, [open, recordId, fetchByRecord]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  if (!open) return null;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', { hour12: false });
  };

  return (
    <div className="fixed inset-0 z-50 animate-dissolve">
      <div className="absolute inset-0 bg-medical-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-warm-50 shadow-2xl flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-medical-100">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-medical-600" />
            <div>
              <h3 className="font-serif text-base font-semibold text-medical-800">审计历史</h3>
              <p className="text-xs text-medical-500">{recordTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-medical-500 hover:bg-medical-50 hover:text-medical-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-medical-500">加载中...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-medical-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-40" />
              暂无审计记录
            </div>
          ) : (
            logs.map((log, i) => {
              const op = operationLabels[log.operationType];
              return (
                <div
                  key={log.id}
                  className="bg-white rounded-xl p-4 shadow-soft border border-medical-50 animate-fade-in-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${op.color}`}>
                      {log.isAutoRollback && <RotateCcw className="w-3 h-3" />}
                      {op.label}
                      {log.isAutoRollback && '· 自动回退'}
                    </span>
                    <span className="text-xs text-medical-500">{formatTime(log.operatedAt)}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-sm text-medical-600 font-medium">{log.fieldName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {log.oldValue !== null && log.oldValue !== undefined ? (
                      <span className="px-2.5 py-1 rounded bg-gray-100 text-gray-500 line-through font-mono text-xs">
                        {String(log.oldValue)}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded bg-gray-50 text-gray-400 text-xs italic">无值</span>
                    )}
                    <span className="text-medical-400">→</span>
                    {log.newValue !== null && log.newValue !== undefined ? (
                      <span className="px-2.5 py-1 rounded bg-medical-50 text-medical-700 font-mono text-xs font-semibold">
                        {String(log.newValue)}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded bg-gray-50 text-gray-400 text-xs italic">清空</span>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-medical-50 text-xs text-medical-500">
                    处理人：<span className="font-medium text-medical-700">{log.operator}</span>
                    {log.isAutoRollback && (
                      <span className="ml-2 text-warm-600">（状态回退后审计保留）</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
