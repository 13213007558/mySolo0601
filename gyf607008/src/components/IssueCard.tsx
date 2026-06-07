import { AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react';
import type { DataIssue } from '@shared/types';

interface Props {
  issue: DataIssue;
}

export function IssueCard({ issue }: Props) {
  const isError = issue.severity === 'error';
  return (
    <div
      className={`border rounded-md p-3 ${
        isError
          ? 'border-red-800/60 bg-red-950/30'
          : 'border-amber-800/60 bg-amber-950/30'
      }`}
    >
      <div className="flex items-start gap-2">
        <div className={isError ? 'text-red-400 mt-0.5' : 'text-amber-400 mt-0.5'}>
          {issue.type === 'privacy_leak' ? (
            <ShieldAlert size={16} />
          ) : isError ? (
            <AlertCircle size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${isError ? 'text-red-300' : 'text-amber-300'}`}>
            {issue.message}
          </div>
          <div className="mt-1.5 text-xs text-night-muted leading-relaxed">
            <span className="text-night-muted/70">原因：</span>
            {issue.reason}
          </div>
          <div className="mt-1 text-[10px] text-night-muted/60 font-mono">
            字段：{issue.field} · 类型：{issue.type}
          </div>
        </div>
      </div>
    </div>
  );
}
