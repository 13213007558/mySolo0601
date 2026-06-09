import { useMemo } from 'react';
import { ArrowRight, CheckCircle, XCircle, FileText } from 'lucide-react';
import { computeDiff, formatValue, getFieldLabel } from '@/utils/diff';
import type { AuditLog } from '@/types';

interface DiffViewerProps {
  log: AuditLog;
}

export default function DiffViewer({ log }: DiffViewerProps) {
  const diffs = useMemo(() => {
    return computeDiff(log.oldValue, log.newValue);
  }, [log]);

  const changedDiffs = diffs.filter(d => d.changed);
  const unchangedDiffs = diffs.filter(d => !d.changed);

  if (log.operationType === 'create' || log.operationType === 'manual') {
    return (
      <div className="bg-industrial-green/5 border border-industrial-green/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={18} className="text-industrial-green" />
          <span className="font-medium text-industrial-green">新增记录</span>
        </div>
        <div className="space-y-2">
          {log.newValue && Object.entries(log.newValue).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 w-24">{getFieldLabel(key)}:</span>
              <span className="font-mono text-industrial-green">
                {formatValue(key, value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (log.operationType === 'delete') {
    return (
      <div className="bg-industrial-red/5 border border-industrial-red/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <XCircle size={18} className="text-industrial-red" />
          <span className="font-medium text-industrial-red">删除记录</span>
        </div>
        {log.oldValue && (
          <div className="space-y-2">
            {Object.entries(log.oldValue).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 w-24">{getFieldLabel(key)}:</span>
                <span className="font-mono text-industrial-red line-through">
                  {formatValue(key, value)}
                </span>
              </div>
            ))}
          </div>
        )}
        {log.undoReason && (
          <div className="mt-3 pt-3 border-t border-industrial-red/20">
            <p className="text-xs text-gray-500 mb-1">删除原因:</p>
            <p className="text-sm font-mono text-industrial-red">{log.undoReason}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {changedDiffs.length > 0 && (
        <div className="bg-industrial-orange/5 border border-industrial-orange/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <ArrowRight size={18} className="text-industrial-orange" />
            <span className="font-medium text-industrial-orange">变更字段 ({changedDiffs.length})</span>
          </div>
          <div className="space-y-2">
            {changedDiffs.map(diff => (
              <div key={diff.field} className="grid grid-cols-3 gap-2 items-center text-sm">
                <span className="text-gray-500">{getFieldLabel(diff.field)}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-industrial-red bg-industrial-red/10 px-2 py-1 rounded line-through">
                    {formatValue(diff.field, diff.oldValue)}
                  </span>
                  <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="font-mono text-industrial-green bg-industrial-green/10 px-2 py-1 rounded">
                    {formatValue(diff.field, diff.newValue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {unchangedDiffs.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={18} className="text-gray-400" />
            <span className="font-medium text-gray-500">未变更字段</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {unchangedDiffs.slice(0, 6).map(diff => (
              <div key={diff.field} className="flex items-center gap-2">
                <span className="text-gray-400">{getFieldLabel(diff.field)}:</span>
                <span className="font-mono text-gray-500">
                  {formatValue(diff.field, diff.oldValue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {log.undoReason && (
        <div className="bg-industrial-orange/5 border border-industrial-orange/20 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">撤回原因:</p>
          <p className="text-sm font-mono text-industrial-orange">{log.undoReason}</p>
          {log.previousUndoReason && (
            <div className="mt-2 pt-2 border-t border-industrial-orange/20">
              <p className="text-xs text-gray-400 mb-1">历史撤回原因:</p>
              <p className="text-xs font-mono text-gray-500">{log.previousUndoReason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
