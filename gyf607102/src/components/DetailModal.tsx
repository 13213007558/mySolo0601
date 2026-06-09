import { useState } from 'react';
import { X, Send, RotateCcw, FileWarning, User, UserCheck, Clock } from 'lucide-react';
import type { FuseAlarm } from '@/types';
import { useAlarmStore } from '@/store/useAlarmStore';
import { formatDateTime, getStatusText, getProcessStatusText } from '@/utils/export';
import { cn } from '@/lib/utils';
import { PhotoGallery } from './PhotoGallery';
import { HistoryTimeline } from './HistoryTimeline';

interface DetailModalProps {
  alarm: FuseAlarm;
  onClose: () => void;
}

export const DetailModal = ({ alarm, onClose }: DetailModalProps) => {
  const { submitConclusion, withdrawConclusion, resubmitConclusion } = useAlarmStore();
  const [conclusion, setConclusion] = useState(alarm.processStatus === 'withdrawn' ? '' : alarm.currentConclusion);
  const [reason, setReason] = useState(alarm.processStatus === 'withdrawn' ? '' : alarm.currentReason);
  const [withdrawRemark, setWithdrawRemark] = useState('');
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [operator, setOperator] = useState(alarm.operator);
  const [supervisor, setSupervisor] = useState(alarm.supervisor);

  const handleSubmit = () => {
    if (!conclusion.trim() || !reason.trim()) {
      alert('请填写结论和理由');
      return;
    }

    if (alarm.processStatus === 'withdrawn') {
      if (confirm('确定要重新提交结论吗？旧理由会保留在历史记录中。')) {
        resubmitConclusion(alarm.id, conclusion, reason, withdrawRemark, operator);
        onClose();
      }
    } else {
      if (confirm('确定要提交处理结论吗？')) {
        submitConclusion(alarm.id, conclusion, reason, operator);
        onClose();
      }
    }
  };

  const handleWithdraw = () => {
    if (!withdrawRemark.trim()) {
      alert('请填写撤回理由');
      return;
    }
    if (confirm('确定要撤回该结论吗？撤回后旧理由会保留在历史记录中。')) {
      withdrawConclusion(alarm.id, withdrawRemark, supervisor);
      setShowWithdrawForm(false);
      setWithdrawRemark('');
    }
  };

  const canSubmit = alarm.processStatus !== 'completed' && alarm.processStatus !== 'pending_review';
  const canWithdraw = alarm.processStatus === 'pending_review' || alarm.processStatus === 'completed';
  const isResubmit = alarm.processStatus === 'withdrawn';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <code className="rounded bg-gray-200 px-2 py-0.5 font-mono text-sm font-semibold text-gray-800">
                {alarm.fuseNo}
              </code>
              {alarm.isYeMasterSample && (
                <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                  叶师傅补录样例
                </span>
              )}
              {alarm.isManualSample && (
                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  人工补录样例
                </span>
              )}
            </div>
            <h2 className="mt-1 text-lg font-semibold text-gray-800">{alarm.deviceLocation}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                状态: {getStatusText(alarm.status)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                进度: {getProcessStatusText(alarm.processStatus)}
              </span>
              {alarm.attachmentLost && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                  <FileWarning className="h-4 w-4" />
                  附件丢失
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">检测值（原始）</p>
                <p className={cn(
                  'mt-1 font-mono text-lg font-semibold',
                  alarm.status === 'abnormal' ? 'text-red-600 line-through' : 'text-gray-800'
                )}>
                  {alarm.originalValue || '-'}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs text-emerald-600">检测值（处理后）</p>
                <p className="mt-1 font-mono text-lg font-semibold text-emerald-700">
                  {alarm.processedValue || '-'}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-gray-700">邮件信息</h3>
              <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-gray-500">发件人</dt>
                  <dd className="font-medium text-gray-800">{alarm.customerEmail}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">接收时间</dt>
                  <dd className="font-medium text-gray-800">{formatDateTime(alarm.receivedAt)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">邮件主题</dt>
                  <dd className="font-medium text-gray-800">{alarm.emailSubject}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">处理人</dt>
                  <dd className="flex items-center gap-1 font-medium text-gray-800">
                    <User className="h-4 w-4" />
                    {alarm.operator}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">主管</dt>
                  <dd className="flex items-center gap-1 font-medium text-gray-800">
                    <UserCheck className="h-4 w-4" />
                    {alarm.supervisor || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">创建时间</dt>
                  <dd className="flex items-center gap-1 font-medium text-gray-800">
                    <Clock className="h-4 w-4" />
                    {formatDateTime(alarm.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">更新时间</dt>
                  <dd className="flex items-center gap-1 font-medium text-gray-800">
                    <Clock className="h-4 w-4" />
                    {formatDateTime(alarm.updatedAt)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">记录ID</dt>
                  <dd className="font-mono text-xs text-gray-800">{alarm.id}</dd>
                </div>
              </dl>
            </div>

            {alarm.supervisorNote && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h3 className="text-sm font-semibold text-amber-800">主管备注</h3>
                <p className="mt-2 text-sm text-amber-700 whitespace-pre-wrap">{alarm.supervisorNote}</p>
              </div>
            )}

            <PhotoGallery photos={alarm.inspectionPhotos} title="原始抽检照片" />

            {alarm.manualPhotos.length > 0 && (
              <PhotoGallery photos={alarm.manualPhotos} title="手工补录照片" showManualBadge={true} />
            )}

            <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-700">处理操作</h3>

              {alarm.currentConclusion && !isResubmit && (
                <div className="rounded-lg bg-white p-4">
                  <p className="text-xs text-gray-500">当前结论</p>
                  <p className="mt-1 font-medium text-gray-800">{alarm.currentConclusion}</p>
                  <p className="mt-2 text-xs text-gray-500">当前理由</p>
                  <p className="mt-1 text-sm text-gray-700">{alarm.currentReason}</p>
                </div>
              )}

              {isResubmit && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-800">该结论已被撤回，请重新填写</p>
                  <p className="mt-1 text-xs text-amber-700">
                    旧结论和理由已保留在历史记录中，不会被覆盖。
                  </p>
                </div>
              )}

              {(canSubmit || isResubmit) && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">处理人</label>
                    <input
                      type="text"
                      value={operator}
                      onChange={(e) => setOperator(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {isResubmit ? '新结论' : '处理结论'}
                    </label>
                    <input
                      type="text"
                      value={conclusion}
                      onChange={(e) => setConclusion(e.target.value)}
                      placeholder="请输入结论（如：已更换熔丝、误报等）"
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {isResubmit ? '新理由' : '处理理由'}
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="请详细说明处理理由..."
                      rows={3}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  {isResubmit && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">备注说明</label>
                      <input
                        type="text"
                        value={withdrawRemark}
                        onChange={(e) => setWithdrawRemark(e.target.value)}
                        placeholder="请说明重新提交的原因..."
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  <button
                    onClick={handleSubmit}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
                  >
                    <Send className="h-4 w-4" />
                    {isResubmit ? '重新提交结论' : '提交处理结论'}
                  </button>
                </div>
              )}

              {canWithdraw && !showWithdrawForm && (
                <button
                  onClick={() => setShowWithdrawForm(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  主管撤回结论
                </button>
              )}

              {canWithdraw && showWithdrawForm && (
                <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-800">撤回结论</p>
                  <p className="text-xs text-red-700">
                    撤回后，旧结论和理由会保留在历史记录中，不会被新备注覆盖。
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">主管</label>
                    <input
                      type="text"
                      value={supervisor}
                      onChange={(e) => setSupervisor(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">撤回理由</label>
                    <textarea
                      value={withdrawRemark}
                      onChange={(e) => setWithdrawRemark(e.target.value)}
                      placeholder="请详细说明撤回原因..."
                      rows={3}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleWithdraw}
                      className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                      确认撤回
                    </button>
                    <button
                      onClick={() => {
                        setShowWithdrawForm(false);
                        setWithdrawRemark('');
                      }}
                      className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              {alarm.attachmentLost && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-800">⚠️ 附件丢失提示</p>
                  <p className="mt-1 text-xs text-amber-700">
                    该记录附件已丢失，但您仍可提交处理结果。所有已填写内容都会自动保存，不会丢失。
                  </p>
                </div>
              )}
            </div>

            <HistoryTimeline history={alarm.history} />
          </div>
        </div>
      </div>
    </div>
  );
};
