import type { OperationHistory } from '@/types';
import { Clock, User, RotateCcw, Eye, Send, FilePlus, ArrowRight } from 'lucide-react';

interface HistoryTimelineProps {
  history: OperationHistory[];
}

const actionLabels: Record<string, string> = {
  submit: '提交结论',
  withdraw: '撤回结论',
  review: '复核通过',
  resubmit: '重新提交',
  supplement: '补录标注',
  import: '导入数据',
};

const actionColors: Record<string, string> = {
  submit: 'bg-blue-500',
  withdraw: 'bg-red-500',
  review: 'bg-emerald-500',
  resubmit: 'bg-orange-500',
  supplement: 'bg-yellow-500',
  import: 'bg-purple-500',
};

export const HistoryTimeline = ({ history }: HistoryTimelineProps) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-industrial-textMuted">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>暂无操作历史</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-industrial-border" />
      <div className="space-y-4">
        {history.map((item, index) => (
          <div key={item.id} className="relative pl-10 animate-fadeIn" style={{ animationDelay: `${index * 0.05}s` }}>
            <div
              className={`absolute left-0 top-1 w-8 h-8 rounded-full ${actionColors[item.action]} flex items-center justify-center text-white`}
            >
              {item.action === 'withdraw' && <RotateCcw className="w-4 h-4" />}
              {item.action === 'review' && <Eye className="w-4 h-4" />}
              {item.action === 'submit' && <Send className="w-4 h-4" />}
              {item.action === 'resubmit' && <Send className="w-4 h-4" />}
              {item.action === 'supplement' && <FilePlus className="w-4 h-4" />}
              {item.action === 'import' && <FilePlus className="w-4 h-4" />}
            </div>

            <div className="card-industrial">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-industrial-textMuted" />
                  <span className="font-medium text-industrial-text">{item.operator}</span>
                  <span className={`badge ${actionColors[item.action]}/20 border ${actionColors[item.action]}/50 text-white`}>
                    {actionLabels[item.action]}
                  </span>
                </div>
                <span className="text-xs text-industrial-textMuted">{item.operatedAt}</span>
              </div>

              {item.oldReason && (
                <div className="mb-2 p-2 bg-industrial-bg rounded border border-industrial-border">
                  <div className="text-xs text-industrial-textMuted mb-1">旧理由：</div>
                  <div className="text-sm text-industrial-textMuted italic line-through">
                    {item.oldReason}
                  </div>
                </div>
              )}

              {item.oldReason && item.newRemark && (
                <div className="flex items-center justify-center my-2">
                  <ArrowRight className="w-4 h-4 text-industrial-primaryLight" />
                </div>
              )}

              {item.newRemark && (
                <div className="p-2 bg-industrial-primary/10 rounded border border-industrial-primary/30">
                  <div className="text-xs text-industrial-primaryLight mb-1">新备注：</div>
                  <div className="text-sm text-industrial-text">{item.newRemark}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
