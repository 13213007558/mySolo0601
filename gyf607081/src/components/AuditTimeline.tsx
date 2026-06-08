import React from 'react';
import {
  Clock, User, Edit3, XCircle, CheckCircle, Plus, Database, RefreshCw
} from 'lucide-react';
import { AuditLog, AuditAction } from '../types';

interface AuditTimelineProps {
  logs: AuditLog[];
}

const actionConfig: Record<AuditAction, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  [AuditAction.CREATE]: {
    label: '创建记录',
    icon: Plus,
    color: '#3b82f6',
    bgColor: 'bg-blue-50'
  },
  [AuditAction.UPDATE]: {
    label: '更新记录',
    icon: Edit3,
    color: '#8b5cf6',
    bgColor: 'bg-purple-50'
  },
  [AuditAction.REJECT]: {
    label: '拒绝',
    icon: XCircle,
    color: '#ef4444',
    bgColor: 'bg-red-50'
  },
  [AuditAction.REISSUE]: {
    label: '补发',
    icon: CheckCircle,
    color: '#10b981',
    bgColor: 'bg-emerald-50'
  },
  [AuditAction.MANUAL_ADD]: {
    label: '手工补录',
    icon: Plus,
    color: '#f59e0b',
    bgColor: 'bg-amber-50'
  },
  [AuditAction.EXPORT]: {
    label: '导出数据',
    icon: Database,
    color: '#06b6d4',
    bgColor: 'bg-cyan-50'
  },
  [AuditAction.SERVICE_RESTART]: {
    label: '服务重启',
    icon: RefreshCw,
    color: '#6366f1',
    bgColor: 'bg-indigo-50'
  },
  [AuditAction.DATA_RESTORE]: {
    label: '数据恢复',
    icon: Database,
    color: '#ec4899',
    bgColor: 'bg-pink-50'
  }
};

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>暂无审计记录</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-rose-200 via-orange-200 to-rose-200" />

      <div className="space-y-6">
        {logs.map((log, index) => {
          const config = actionConfig[log.action];
          const Icon = config.icon;

          return (
            <div key={log.id} className="relative pl-16" style={{
              animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`
            }}>
              <div
                className={`absolute left-4 w-5 h-5 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${config.bgColor}`}
                style={{
                  backgroundColor: `${config.color}20`,
                  borderColor: config.color
                }}
              >
                <Icon className="w-2.5 h-2.5" style={{ color: config.color }} />
              </div>

              <div className={`p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 ${log.success ? '' : 'border-red-300 bg-red-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{ color: config.color, backgroundColor: `${config.color}15` }}
                    >
                      {config.label}
                    </span>
                    {!log.success && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-red-600 bg-red-100">
                      处理失败
                    </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDateTime(log.timestamp)}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{log.operator}</span>
                </div>

                {log.errorMessage && (
                  <div className="mb-3 p-3 bg-red-50 rounded-lg text-sm text-red-700 border border-red-200">
                    {log.errorMessage}
                  </div>
                )}

                {(log.oldValue || log.newValue) && (
                  <div className="grid grid-cols-2 gap-3">
                    {log.oldValue && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1.5">变更前</p>
                        <pre className="text-xs text-slate-700 whitespace-pre-wrap break-all">
{JSON.stringify(log.oldValue, null, 2).slice(0, 300)}
                          {JSON.stringify(log.oldValue, null, 2).length > 300 ? '...' : ''}
                        </pre>
                      </div>
                    )}
                    {log.newValue && (
                      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                        <p className="text-xs text-emerald-600 mb-1.5 font-medium">变更后</p>
                        <pre className="text-xs text-emerald-800 whitespace-pre-wrap break-all">
{JSON.stringify(log.newValue, null, 2).slice(0, 300)}
                          {JSON.stringify(log.newValue, null, 2).length > 300 ? '...' : ''}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {log.snapshot && !log.oldValue && !log.newValue && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1.5">审计快照</p>
                    <pre className="text-xs text-slate-600 whitespace-pre-wrap break-all">
{JSON.stringify(log.snapshot, null, 2).slice(0, 400)}
                      {JSON.stringify(log.snapshot, null, 2).length > 400 ? '...' : ''}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
