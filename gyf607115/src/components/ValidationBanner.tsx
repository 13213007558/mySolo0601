import { useState } from 'react';
import { AlertTriangle, CheckCircle, X, ChevronDown, ChevronUp, Wrench } from 'lucide-react';
import { useValidation } from '../hooks/useValidation';
import { cn } from '../lib/utils';

interface ValidationBannerProps {
  className?: string;
}

export function ValidationBanner({ className }: ValidationBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { issues, issueCounts, hasIssues, fixIssue, getIssueTypeLabel } = useValidation();

  if (!hasIssues) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3',
          className
        )}
      >
        <CheckCircle className="h-5 w-5 text-emerald-600" />
        <span className="text-sm font-medium text-emerald-800">数据校验通过，未发现异常</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-amber-300 bg-amber-50 overflow-hidden transition-all duration-300',
        className
      )}
    >
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-amber-100/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 animate-pulse" />
          <div>
            <span className="text-sm font-medium text-amber-800">
              检测到 {issueCounts.total} 个数据异常
            </span>
            <span className="ml-3 text-xs text-amber-600">
              {issueCounts.errors > 0 && (
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded mr-2">
                  {issueCounts.errors} 个错误
                </span>
              )}
              {issueCounts.warnings > 0 && (
                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                  {issueCounts.warnings} 个警告
                </span>
              )}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-600">
            README不一致: {issueCounts.readme_inconsistency} |
            精度问题: {issueCounts.decimal_precision} |
            手机号泄露: {issueCounts.phone_leak}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-amber-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-amber-600" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-amber-200 bg-amber-50/50 p-4 space-y-3">
          {issues.map((issue, index) => (
            <div
              key={index}
              className={cn(
                'flex items-start justify-between rounded-lg border p-3',
                issue.severity === 'error'
                  ? 'border-red-200 bg-red-50'
                  : 'border-amber-200 bg-white'
              )}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded',
                      issue.severity === 'error'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    )}
                  >
                    {issue.severity === 'error' ? '错误' : '警告'}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    [{getIssueTypeLabel(issue.type)}]
                  </span>
                  <span className="text-sm font-medium text-slate-800">{issue.message}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{issue.details}</p>
                {issue.expectedValue && issue.actualValue && (
                  <div className="mt-2 flex gap-4 text-xs">
                    <span className="text-emerald-600">
                      期望值: <code className="bg-emerald-100 px-1 rounded">{issue.expectedValue}</code>
                    </span>
                    <span className="text-red-600">
                      实际值: <code className="bg-red-100 px-1 rounded">{issue.actualValue}</code>
                    </span>
                  </div>
                )}
                {issue.affectedIds.length > 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    影响ID: {issue.affectedIds.join(', ')}
                  </p>
                )}
              </div>
              {issue.type !== 'decimal_precision' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    issue.affectedIds.forEach((id) => fixIssue(issue.type, id));
                  }}
                  className="ml-4 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                >
                  <Wrench className="h-3 w-3" />
                  一键修复
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
