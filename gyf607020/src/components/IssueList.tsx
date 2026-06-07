import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { DataIssue } from '@shared/types';
import { issueLabel, issueColor } from '@/utils/format';

interface Props {
  issues: DataIssue[];
}

export default function IssueList({ issues }: Props) {
  if (!issues || issues.length === 0) return null;

  return (
    <div className="bg-rose-50/60 border border-rose-200 rounded-card p-4 space-y-3 animate-fade-in">
      <div className="flex items-center gap-2 text-rose-700 font-medium text-sm">
        <AlertTriangle className="w-4 h-4" />
        <span>检测到 {issues.length} 项数据质量问题</span>
      </div>
      <ul className="space-y-2.5">
        {issues.map((issue, idx) => (
          <li key={idx} className="bg-white rounded-lg p-3 border border-rose-100">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${issueColor(
                      issue.type
                    )}`}
                  >
                    {issueLabel(issue)}
                  </span>
                  <span className="text-xs text-gray-500">字段：{issue.field}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{issue.reason}</p>
                {issue.originalValue && (
                  <div className="mt-2 text-xs space-y-1">
                    <div className="flex gap-2">
                      <span className="text-gray-500">原始值：</span>
                      <code className="bg-rose-100 px-1.5 py-0.5 rounded text-rose-700">
                        {issue.originalValue}
                      </code>
                    </div>
                    {issue.expectedFormat && (
                      <div className="flex gap-2">
                        <span className="text-gray-500">期望格式：</span>
                        <code className="bg-green-100 px-1.5 py-0.5 rounded text-green-700">
                          {issue.expectedFormat}
                        </code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-rose-600 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5" />
        以上问题在导出家长交接表时会自动脱敏或标注，请复核确认
      </p>
    </div>
  );
}
