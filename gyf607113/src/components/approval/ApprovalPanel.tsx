import { useState } from 'react';
import { FileText, User, Clock, RotateCcw, Send, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import type { Approval, Cylinder } from '@/types';
import { approvalStatusLabels } from '@/types';
import { formatDate } from '@/utils/storage';
import { useCylinderStore } from '@/store/useCylinderStore';

interface ApprovalPanelProps {
  cylinder: Cylinder;
  approvals: Approval[];
}

const ApprovalPanel = ({ cylinder, approvals }: ApprovalPanelProps) => {
  const [resubmitForm, setResubmitForm] = useState<{
    parentId: string;
    show: boolean;
    conclusion: string;
    reason: string;
    remark: string;
  }>({ parentId: '', show: false, conclusion: '', reason: '', remark: '' });

  const withdrawApproval = useCylinderStore(state => state.withdrawApproval);
  const resubmitApproval = useCylinderStore(state => state.resubmitApproval);

  const handleWithdraw = (approvalId: string) => {
    if (confirm('确认要撤回此审批结论吗？撤回后可重新提交新的结论。')) {
      withdrawApproval(approvalId, '王主管');
    }
  };

  const handleShowResubmit = (approval: Approval) => {
    setResubmitForm({
      parentId: approval.id,
      show: true,
      conclusion: '',
      reason: '',
      remark: '',
    });
  };

  const handleResubmit = () => {
    if (!resubmitForm.conclusion.trim() || !resubmitForm.reason.trim()) {
      alert('请填写结论和理由');
      return;
    }

    resubmitApproval(
      cylinder.id,
      resubmitForm.parentId,
      resubmitForm.conclusion,
      resubmitForm.reason,
      resubmitForm.remark || undefined,
      '王主管',
      '运维主管'
    );

    setResubmitForm({ parentId: '', show: false, conclusion: '', reason: '', remark: '' });
  };

  const getParentApproval = (parentId: string) => {
    return approvals.find(a => a.id === parentId);
  };

  const statusColors = {
    submitted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    withdrawn: 'bg-red-500/20 text-red-400 border-red-500/30',
    resubmitted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };

  return (
    <div className="space-y-4">
      {approvals.map((approval, index) => {
        const parentApproval = approval.parentApprovalId ? getParentApproval(approval.parentApprovalId) : null;
        return (
          <div
            key={approval.id}
            className={`card-industrial p-5 animate-fade-in-up ${approval.status === 'withdrawn' ? 'opacity-60' : ''}`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {parentApproval && (
              <div className="mb-4 p-3 bg-industrial-800/50 rounded-sm border-l-2 border-amber-500">
                <div className="flex items-center gap-2 text-xs text-amber-400 mb-2">
                  <AlertCircle className="w-3 h-3" />
                  <span>原始审批（已撤回）</span>
                </div>
                <p className="text-sm text-industrial-300 mb-1">
                  <span className="text-industrial-400">原结论：</span>
                  {parentApproval.conclusion}
                </p>
                <p className="text-sm text-industrial-300">
                  <span className="text-industrial-400">原理由：</span>
                  {parentApproval.reason}
                </p>
              </div>
            )}

            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className={`status-badge ${statusColors[approval.status]}`}>
                  {approvalStatusLabels[approval.status]}
                </span>
                <span className="text-white font-medium">{approval.conclusion}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-industrial-400">
                <Clock className="w-3 h-3" />
                {formatDate(approval.timestamp)}
              </div>
            </div>

            <div className="mb-3">
              <p className="text-xs text-industrial-400 mb-1">理由：</p>
              <p className="text-industrial-200">{approval.reason}</p>
            </div>

            {approval.remark && (
              <div className="mb-3 p-3 bg-industrial-800/50 rounded-sm">
                <div className="flex items-center gap-2 text-xs text-industrial-400 mb-1">
                  <FileText className="w-3 h-3" />
                  <span>备注（新追加）</span>
                </div>
                <p className="text-sm text-industrial-300">{approval.remark}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-industrial-700/50">
              <div className="flex items-center gap-2 text-sm text-industrial-400">
                <User className="w-4 h-4" />
                <span>{approval.operator}</span>
                <span className="text-industrial-600">|</span>
                <span className="text-industrial-500">{approval.role}</span>
              </div>

              <div className="flex items-center gap-2">
                {approval.status === 'submitted' && (
                  <>
                    <button
                      onClick={() => handleWithdraw(approval.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded-sm hover:bg-red-500/30 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      撤回结论
                    </button>
                    <button
                      onClick={() => handleShowResubmit(approval)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-sm hover:bg-emerald-500/30 transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      重新提交
                    </button>
                  </>
                )}
                {approval.status === 'withdrawn' && (
                  <button
                    onClick={() => handleShowResubmit(approval)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-sm hover:bg-emerald-500/30 transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    重新提交
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {resubmitForm.show && (
        <div className="card-industrial p-5 border-2 border-emerald-500/30 animate-fade-in-up">
          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-400" />
            重新提交审批结论
          </h4>

          <div className="space-y-4">
            <div>
              <label className="label-text">结论</label>
              <input
                type="text"
                className="input-field"
                placeholder="例如：同意维修"
                value={resubmitForm.conclusion}
                onChange={e => setResubmitForm({ ...resubmitForm, conclusion: e.target.value })}
              />
            </div>

            <div>
              <label className="label-text">理由</label>
              <textarea
                className="input-field min-h-[80px]"
                placeholder="请详细说明理由..."
                value={resubmitForm.reason}
                onChange={e => setResubmitForm({ ...resubmitForm, reason: e.target.value })}
              />
            </div>

            <div>
              <label className="label-text">备注（可选，将作为新备注追加）</label>
              <textarea
                className="input-field min-h-[60px]"
                placeholder="添加备注信息，将作为新备注追加，不会覆盖历史备注..."
                value={resubmitForm.remark}
                onChange={e => setResubmitForm({ ...resubmitForm, remark: e.target.value })}
              />
              <p className="text-xs text-industrial-500 mt-1">
                旧理由将被完整保留，新备注只会追加显示
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleResubmit} className="btn-primary">
                提交新结论
              </button>
              <button
                onClick={() => setResubmitForm({ ...resubmitForm, show: false })}
                className="btn-secondary"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalPanel;
