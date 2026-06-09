import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  FileWarning,
  AlertOctagon,
  Ban,
  MessageSquare,
  Send,
} from 'lucide-react';
import { useBracketStore } from '@/store/useBracketStore';
import { ERROR_TYPE_LABELS } from '@/types';
import type { ProblemRecord } from '@/types';

const errorTypeIcons = {
  missing_data: FileWarning,
  format_error: XCircle,
  status_conflict: AlertOctagon,
  angle_abnormal: Ban,
};

interface ProblemCardProps {
  record: ProblemRecord;
  index: number;
}

const ProblemCard: React.FC<ProblemCardProps> = ({ record, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [resolveNote, setResolveNote] = useState('');
  const resolveProblem = useBracketStore((state) => state.resolveProblem);
  const ErrorIcon = errorTypeIcons[record.errorType] || AlertTriangle;

  const handleResolve = () => {
    if (resolveNote.trim()) {
      resolveProblem(record.id, resolveNote);
      setResolveNote('');
    }
  };

  return (
    <div
      className={`bg-white border-l-4 border-orange-500 rounded-r-lg shadow-sm mb-3 overflow-hidden transition-all duration-300 ${
        record.isResolved ? 'opacity-60' : 'hover:shadow-md'
      }`}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      <div
        className={`p-4 cursor-pointer ${record.isResolved ? 'bg-green-50' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded ${
              record.isResolved ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              {record.isResolved ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <ErrorIcon className="w-5 h-5 text-orange-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-slate-800">{record.bracketNo}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                  record.isResolved
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {ERROR_TYPE_LABELS[record.errorType]}
                </span>
                {record.isResolved && (
                  <span className="text-xs text-green-600 font-mono">已解决</span>
                )}
              </div>
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">{record.errorDetail}</p>
              <p className="text-xs text-slate-400 mt-2 font-mono">
                <Clock className="w-3 h-3 inline mr-1" />
                {new Date(record.createdAt).toLocaleString('zh-CN')}
              </p>
            </div>
          </div>
          {expanded ? (
            <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-slate-400 flex-shrink-0" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50">
          <div className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 font-mono">位置:</span>
                <span className="text-slate-700 ml-1">{record.location}</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono">当前角度:</span>
                <span className="text-red-600 ml-1 font-mono">{record.currentAngle}°</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono">目标角度:</span>
                <span className="text-slate-700 ml-1 font-mono">{record.targetAngle}°</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono">版本:</span>
                <span className="text-slate-700 ml-1 font-mono">{record.version}</span>
              </div>
            </div>

            {record.remark && (
              <div className="text-xs bg-yellow-50 p-2 rounded border border-yellow-200">
                <span className="text-yellow-700 font-mono">备注: </span>
                <span className="text-yellow-800">{record.remark}</span>
              </div>
            )}

            {record.isResolved ? (
              <div className="text-xs bg-green-50 p-2 rounded border border-green-200">
                <span className="text-green-700 font-mono">解决备注: </span>
                <span className="text-green-800">{record.resolveNote}</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="输入解决备注..."
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResolve();
                  }}
                  disabled={!resolveNote.trim()}
                  className="px-4 py-2 bg-orange-500 text-white rounded text-sm font-mono font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Send className="w-4 h-4" />
                  解决
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const ProblemRecordsPanel: React.FC = () => {
  const problemRecords = useBracketStore((state) => state.problemRecords);
  const isProblemPanelCollapsed = useBracketStore((state) => state.isProblemPanelCollapsed);
  const toggleProblemPanel = useBracketStore((state) => state.toggleProblemPanel);
  const pageStatus = useBracketStore((state) => state.pageStatus);

  const activeProblems = problemRecords.filter((r) => !r.isResolved);
  const resolvedProblems = problemRecords.filter((r) => r.isResolved);

  const showWarning = pageStatus === 'all_problem' || pageStatus === 'only_problem';

  return (
    <div
      className={`bg-orange-50 border-l-2 border-orange-200 flex flex-col transition-all duration-300 ${
        isProblemPanelCollapsed ? 'w-12' : 'w-80'
      }`}
    >
      <div className="p-3 bg-orange-100 border-b border-orange-200 flex items-center justify-between">
        {!isProblemPanelCollapsed ? (
          <>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h2 className="font-mono font-bold text-orange-800 text-sm">问题记录区</h2>
              <span className="text-xs px-2 py-0.5 bg-orange-500 text-white rounded-full font-mono">
                {activeProblems.length}
              </span>
            </div>
            <button
              onClick={toggleProblemPanel}
              className="p-1 hover:bg-orange-200 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-orange-600" />
            </button>
          </>
        ) : (
          <button
            onClick={toggleProblemPanel}
            className="p-1 hover:bg-orange-200 rounded transition-colors mx-auto"
            title="展开问题记录区"
          >
            <ChevronLeft className="w-4 h-4 text-orange-600" />
          </button>
        )}
      </div>

      {!isProblemPanelCollapsed && (
        <>
          {showWarning && (
            <div className="p-3 bg-orange-500 text-white text-xs font-mono border-b border-orange-600 animate-pulse">
              ⚠️ {pageStatus === 'all_problem'
                ? '本次导入全部为问题记录，请逐一处理'
                : '正常区无记录，请在问题区处理后数据将自动移入'}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3">
            {activeProblems.length === 0 && resolvedProblems.length === 0 ? (
              <div className="text-center py-8 text-orange-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-mono">暂无问题记录</p>
              </div>
            ) : (
              <>
                {activeProblems.length > 0 && (
                  <div>
                    <p className="text-xs font-mono text-orange-600 mb-2 px-1">
                      待处理 ({activeProblems.length})
                    </p>
                    {activeProblems.map((record, index) => (
                      <ProblemCard key={record.id} record={record} index={index} />
                    ))}
                  </div>
                )}

                {resolvedProblems.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-mono text-green-600 mb-2 px-1">
                      已解决 ({resolvedProblems.length})
                    </p>
                    {resolvedProblems.map((record, index) => (
                      <ProblemCard
                        key={record.id}
                        record={record}
                        index={index + activeProblems.length}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
