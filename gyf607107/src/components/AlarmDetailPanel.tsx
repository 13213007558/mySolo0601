import { useState } from 'react';
import { useAlarmStore } from '@/store/useAlarmStore';
import { useHistoryStore } from '@/store/useHistoryStore';
import { useUserStore } from '@/store/useUserStore';
import { maskPhone } from '@/utils/mask';
import type { Alarm } from '@/types';
import { HistoryTimeline } from './HistoryTimeline';
import { DiffViewer } from './DiffViewer';
import { computeDiff } from '@/utils/diff';
import {
  X,
  FilePlus,
  Send,
  RotateCcw,
  Eye,
  Phone,
  MapPin,
  Calendar,
  User,
  AlertTriangle,
} from 'lucide-react';

interface AlarmDetailPanelProps {
  alarm: Alarm;
  onClose: () => void;
  onOpenSupplement: () => void;
}

const statusLabels: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已处理',
  reviewed: '已复核',
  withdrawn: '已撤回',
};

const severityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '严重',
};

export const AlarmDetailPanel = ({ alarm, onClose, onOpenSupplement }: AlarmDetailPanelProps) => {
  const { resubmitAlarm, getSupplementsByAlarmId } = useAlarmStore();
  const { addHistory, getHistoryByAlarmId } = useHistoryStore();
  const { currentUser, canWithdraw, canReview, canExportRaw } = useUserStore();

  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'diff'>('info');
  const [resubmitForm, setResubmitForm] = useState({
    conclusion: '',
    showForm: false,
  });

  const history = getHistoryByAlarmId(alarm.id);
  const supplements = getSupplementsByAlarmId(alarm.id);

  const handleResubmit = () => {
    if (!resubmitForm.conclusion.trim()) {
      alert('请输入新的处理结论');
      return;
    }

    const oldReason = alarm.conclusion;
    resubmitAlarm(alarm.id, resubmitForm.conclusion);
    addHistory({
      alarmId: alarm.id,
      operator: currentUser?.name || '未知',
      action: 'resubmit',
      oldReason,
      newRemark: resubmitForm.conclusion,
    });

    alert('结论已重新提交');
    setResubmitForm({ conclusion: '', showForm: false });
  };

  const handleSubmitConclusion = () => {
    const conclusion = prompt('请输入处理结论：');
    if (!conclusion) return;

    useAlarmStore.getState().updateAlarm(alarm.id, {
      status: 'completed',
      conclusion,
    });
    addHistory({
      alarmId: alarm.id,
      operator: currentUser?.name || '未知',
      action: 'submit',
      newRemark: conclusion,
    });
    alert('结论已提交');
  };

  const latestSupplement = supplements[0];
  let diffs: ReturnType<typeof computeDiff> = [];
  if (latestSupplement) {
    try {
      const before = JSON.parse(latestSupplement.beforeData.replace(/^[~+-] .*$/gm, '{}'));
      const after = JSON.parse(latestSupplement.afterData.replace(/^[~+-] .*$/gm, '{}'));
      if (typeof before === 'object' && typeof after === 'object') {
        diffs = computeDiff(before as Record<string, unknown>, after as Record<string, unknown>);
      }
    } catch {
      // 如果 JSON 解析失败，尝试用原始文本解析 diff
      const beforeLines = latestSupplement.beforeData.split('\n').filter(l => l.trim());
      const afterLines = latestSupplement.afterData.split('\n').filter(l => l.trim());
      diffs = afterLines.map((line, i) => ({
        field: `变更 ${i + 1}`,
        oldValue: beforeLines[i] || '',
        newValue: line,
        type: 'modified' as const,
      }));
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-industrial-card border border-industrial-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fadeIn flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-industrial-border">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-industrial-warning" />
            <h3 className="text-lg font-semibold text-industrial-text">
              {alarm.siteName} - {alarm.bladeNo}
            </h3>
            <span className={`badge severity-${alarm.severity}`}>
              {severityLabels[alarm.severity]}
            </span>
            <span className={`badge status-${alarm.status}`}>
              {statusLabels[alarm.status]}
            </span>
            {alarm.isManualSupplement && (
              <span className="flex items-center gap-1 text-xs text-industrial-warning bg-industrial-warning/10 px-2 py-0.5 rounded">
                <FilePlus className="w-3 h-3" />
                周顾问补录
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-industrial-textMuted hover:text-industrial-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-industrial-border">
          {(['info', 'history', 'diff'] as const).map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-industrial-primaryLight border-b-2 border-industrial-primaryLight'
                  : 'text-industrial-textMuted hover:text-industrial-text'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'info' && '基本信息'}
              {tab === 'history' && `操作历史 (${history.length})`}
              {tab === 'diff' && `补录差异 (${supplements.length})`}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="card-industrial">
                  <div className="flex items-center gap-2 text-industrial-textMuted text-sm mb-2">
                    <MapPin className="w-4 h-4" />
                    站点名称
                  </div>
                  <div className="text-industrial-text font-medium">{alarm.siteName}</div>
                </div>
                <div className="card-industrial">
                  <div className="flex items-center gap-2 text-industrial-textMuted text-sm mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    缺陷类型
                  </div>
                  <div className="text-industrial-text font-medium">{alarm.defectType}</div>
                </div>
                <div className="card-industrial">
                  <div className="flex items-center gap-2 text-industrial-textMuted text-sm mb-2">
                    <User className="w-4 h-4" />
                    处理人
                  </div>
                  <div className="text-industrial-text font-medium">{alarm.handler}</div>
                </div>
                <div className="card-industrial">
                  <div className="flex items-center gap-2 text-industrial-textMuted text-sm mb-2">
                    <Phone className="w-4 h-4" />
                    联系电话
                  </div>
                  <div className="text-industrial-text font-medium font-mono">
                    {canExportRaw ? alarm.contactPhone : maskPhone(alarm.contactPhone)}
                  </div>
                </div>
                <div className="card-industrial">
                  <div className="flex items-center gap-2 text-industrial-textMuted text-sm mb-2">
                    <Calendar className="w-4 h-4" />
                    创建时间
                  </div>
                  <div className="text-industrial-text font-medium">{alarm.createdAt}</div>
                </div>
                <div className="card-industrial">
                  <div className="flex items-center gap-2 text-industrial-textMuted text-sm mb-2">
                    <Calendar className="w-4 h-4" />
                    更新时间
                  </div>
                  <div className="text-industrial-text font-medium">{alarm.updatedAt}</div>
                </div>
              </div>

              {alarm.conclusion && (
                <div className="card-industrial">
                  <div className="text-sm text-industrial-textMuted mb-2">处理结论</div>
                  <div className="text-industrial-text p-3 bg-industrial-bg rounded border border-industrial-border">
                    {alarm.conclusion}
                  </div>
                </div>
              )}

              {alarm.status === 'withdrawn' && !resubmitForm.showForm && (
                <button
                  className="btn-warning flex items-center gap-2 w-full justify-center"
                  onClick={() => setResubmitForm({ ...resubmitForm, showForm: true })}
                >
                  <Send className="w-4 h-4" />
                  重新提交结论
                </button>
              )}

              {alarm.status === 'withdrawn' && resubmitForm.showForm && (
                <div className="card-industrial">
                  <div className="text-sm text-industrial-textMuted mb-2">新的处理结论</div>
                  <textarea
                    className="input-industrial min-h-24 mb-3"
                    placeholder="请输入新的处理结论..."
                    value={resubmitForm.conclusion}
                    onChange={(e) =>
                      setResubmitForm({ ...resubmitForm, conclusion: e.target.value })
                    }
                  />
                  <div className="flex gap-3 justify-end">
                    <button
                      className="btn-industrial"
                      onClick={() => setResubmitForm({ conclusion: '', showForm: false })}
                    >
                      取消
                    </button>
                    <button className="btn-warning" onClick={handleResubmit}>
                      提交
                    </button>
                  </div>
                </div>
              )}

              {alarm.status === 'pending' && (
                <button
                  className="btn-success flex items-center gap-2 w-full justify-center"
                  onClick={handleSubmitConclusion}
                >
                  <Send className="w-4 h-4" />
                  提交处理结论
                </button>
              )}

              {alarm.status === 'completed' && canReview() && (
                <button
                  className="btn-success flex items-center gap-2 w-full justify-center"
                  onClick={() => {
                    const remark = prompt('请输入复核意见：');
                    if (!remark) return;
                    useAlarmStore.getState().reviewAlarm(alarm.id, remark);
                    addHistory({
                      alarmId: alarm.id,
                      operator: currentUser?.name || '未知',
                      action: 'review',
                      oldReason: alarm.conclusion,
                      newRemark: remark,
                    });
                    alert('复核完成');
                  }}
                >
                  <Eye className="w-4 h-4" />
                  复核通过
                </button>
              )}

              {alarm.status === 'completed' && canWithdraw() && (
                <button
                  className="btn-danger flex items-center gap-2 w-full justify-center"
                  onClick={() => {
                    const reason = prompt('请输入撤回理由：');
                    if (!reason) return;
                    useAlarmStore.getState().withdrawAlarm(alarm.id, reason);
                    addHistory({
                      alarmId: alarm.id,
                      operator: currentUser?.name || '未知',
                      action: 'withdraw',
                      oldReason: alarm.conclusion,
                      newRemark: reason,
                    });
                    alert('已撤回结论');
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                  撤回结论
                </button>
              )}

              <button
                className="btn-warning flex items-center gap-2 w-full justify-center"
                onClick={onOpenSupplement}
              >
                <FilePlus className="w-4 h-4" />
                周顾问手工补录标注
              </button>
            </div>
          )}

          {activeTab === 'history' && <HistoryTimeline history={history} />}

          {activeTab === 'diff' && (
            <div className="space-y-4">
              {supplements.length === 0 ? (
                <div className="text-center py-8 text-industrial-textMuted">
                  <FilePlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>暂无补录记录</p>
                </div>
              ) : (
                supplements.map((supp, index) => (
                  <div key={supp.id} className="card-industrial animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FilePlus className="w-4 h-4 text-industrial-warning" />
                        <span className="font-medium text-industrial-text">{supp.author}</span>
                        <span className="text-xs text-industrial-textMuted">{supp.createdAt}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-industrial-warning/10 rounded border border-industrial-warning/30 mb-3">
                      <div className="text-xs text-industrial-warning mb-1">补录说明</div>
                      <div className="text-industrial-text">{supp.content}</div>
                    </div>
                    <DiffViewer diffs={index === 0 ? diffs : []} title={`补录 #${supplements.length - index} 差异`} />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
