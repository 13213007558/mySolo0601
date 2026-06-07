import { useState } from 'react';
import {
  ArrowLeft,
  Baby,
  CalendarClock,
  CheckCircle,
  ClipboardCopy,
  Clock4,
  Download,
  FileWarning,
  MessageSquareText,
  Phone,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  User,
  Volume2,
  XCircle,
} from 'lucide-react';
import { toast } from '@/lib/utils';
import type { FoodRecord } from '@/types';
import { STATUS_LABEL } from '@/types';
import { useRecordStore } from '@/store/useRecordStore';
import StatusBadge from './StatusBadge';
import ThreeDayPlan from './ThreeDayPlan';
import HistoryTimeline from './HistoryTimeline';
import {
  copySummaryToClipboard,
  downloadSummary,
} from '@/utils/exportSummary';

interface RecordDetailProps {
  record: FoodRecord;
  onBack: () => void;
}

export default function RecordDetail({ record, onBack }: RecordDetailProps) {
  const { addParentNote, overrideStatus, withdrawRecord } = useRecordStore();
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [parentNote, setParentNote] = useState('');
  const [consultantNote, setConsultantNote] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');
  const [operatorName, setOperatorName] = useState(record.consultant);

  const handleAddNote = () => {
    if (!consultantNote.trim() && !parentNote.trim()) {
      toast('请至少填写一项备注内容', 'error');
      return;
    }
    addParentNote(record.id, consultantNote.trim(), parentNote.trim());
    setParentNote('');
    setConsultantNote('');
    setShowNoteForm(false);
    toast('备注已添加', 'success');
  };

  const handleOverride = () => {
    if (!overrideReason.trim()) {
      toast('请填写人工改判理由', 'error');
      return;
    }
    overrideStatus(record.id, overrideReason.trim());
    setOverrideReason('');
    setShowOverrideForm(false);
    toast('状态已人工改判', 'success');
  };

  const handleWithdraw = () => {
    if (!withdrawReason.trim()) {
      toast('请填写撤回原因', 'error');
      return;
    }
    withdrawRecord(record.id, withdrawReason.trim(), operatorName.trim() || '当前顾问');
    setWithdrawReason('');
    setShowWithdrawForm(false);
    toast('记录已撤回', 'success');
  };

  const handleCopy = async () => {
    try {
      await copySummaryToClipboard(record);
      toast('摘要已复制到剪贴板，可直接粘贴转发', 'success');
    } catch {
      toast('复制失败，请重试', 'error');
    }
  };

  const handleDownload = () => {
    downloadSummary(record);
    toast('摘要已下载', 'success');
  };

  const latest = useRecordStore((s) => s.getRecordById(record.id)) || record;

  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 z-20 bg-gradient-to-b from-cream-50 to-cream-50/90 backdrop-blur-sm -mx-4 px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button onClick={onBack} className="btn btn-ghost -ml-2">
            <ArrowLeft size={16} />
            返回列表
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="btn btn-secondary">
              <ClipboardCopy size={14} />
              复制摘要
            </button>
            <button onClick={handleDownload} className="btn btn-primary">
              <Download size={14} />
              导出摘要
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-900 font-display">
                    {latest.babyName || '（未填写姓名）'}
                  </h2>
                  <StatusBadge status={latest.status} />
                  {latest.isManualEntry && (
                    <span className="chip bg-butter-100 text-amber-700 border-amber-200">
                      <Sparkles size={11} />
                      手工补录
                    </span>
                  )}
                  {latest.isBadData && (
                    <span className="chip bg-slate-100 text-slate-500 border-slate-200">
                      <FileWarning size={11} />
                      隔离坏数据
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  档案编号：{latest.id}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {latest.status === 'abnormal' && (
                  <button
                    onClick={() => setShowOverrideForm(true)}
                    className="btn btn-secondary"
                  >
                    <CheckCircle size={14} />
                    人工改判
                  </button>
                )}
                {latest.status !== 'withdrawn' && !latest.isBadData && (
                  <button
                    onClick={() => setShowWithdrawForm(true)}
                    className="btn btn-danger"
                  >
                    <XCircle size={14} />
                    撤回确认
                  </button>
                )}
                <button onClick={() => setShowNoteForm(true)} className="btn btn-primary">
                  <MessageSquareText size={14} />
                  补充备注
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="label flex items-center gap-1">
                  <Baby size={11} />
                  宝宝月龄
                </div>
                <div className="text-sm text-slate-800">
                  {latest.babyAgeMonths > 0 ? `${latest.babyAgeMonths} 个月` : '—'}
                </div>
              </div>
              <div>
                <div className="label flex items-center gap-1">
                  <ShieldAlert size={11} />
                  过敏史
                </div>
                <div className="text-sm text-slate-800">
                  {latest.allergies.length ? latest.allergies.join('、') : '无'}
                </div>
              </div>
              <div>
                <div className="label flex items-center gap-1">
                  <User size={11} />
                  家长
                </div>
                <div className="text-sm text-slate-800">
                  {latest.parentName || '—'}
                </div>
              </div>
              <div>
                <div className="label flex items-center gap-1">
                  <Phone size={11} />
                  联系电话
                </div>
                <div className="text-sm text-slate-800">
                  {latest.parentPhone || '—'}
                </div>
              </div>
              <div>
                <div className="label flex items-center gap-1">
                  <Volume2 size={11} />
                  试听课程
                </div>
                <div className="text-sm text-slate-800">
                  {latest.trialCourse || '—'}
                </div>
              </div>
              <div>
                <div className="label flex items-center gap-1">
                  <CalendarClock size={11} />
                  预约编号
                </div>
                <div className="text-sm text-slate-800">
                  {latest.appointmentId || '—'}
                </div>
              </div>
            </div>

            {latest.originalPromise && (
              <div className="mt-4 p-3 rounded-lg bg-cream-100 border border-cream-200">
                <div className="text-xs font-medium text-amber-700 mb-1 flex items-center gap-1">
                  <Sparkles size={12} />
                  最初承诺（不因状态变化丢失）
                </div>
                <div className="text-sm text-slate-700">{latest.originalPromise}</div>
              </div>
            )}
          </div>

          {latest.conflictInfo && (
            <div className="card p-5 border-orange-200 bg-orange-50/50">
              <h3 className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                <ShieldAlert size={16} className="text-orange-600" />
                预约冲突详情
              </h3>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="label text-orange-600">冲突预约号</div>
                  <div className="text-slate-800">{latest.conflictInfo.conflictingAppointmentId}</div>
                </div>
                <div>
                  <div className="label text-orange-600">冲突课程</div>
                  <div className="text-slate-800">{latest.conflictInfo.conflictingCourse}</div>
                </div>
                <div>
                  <div className="label text-orange-600">冲突时段</div>
                  <div className="text-slate-800">{latest.conflictInfo.conflictingTime}</div>
                </div>
              </div>
              <p className="mt-3 text-xs text-orange-700 bg-white/60 p-2.5 rounded-lg">
                建议：联系家长确认改期，或协调其他老师在空闲时段重新安排。
              </p>
            </div>
          )}

          {latest.withdrawInfo && (
            <div className="card p-5 border-slate-300 bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <RotateCcw size={16} className="text-slate-500" />
                撤回确认详情
              </h3>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="label">撤回人</div>
                  <div className="text-slate-800">{latest.withdrawInfo.withdrawOperator}</div>
                </div>
                <div>
                  <div className="label">撤回时间</div>
                  <div className="text-slate-800">{latest.withdrawInfo.withdrawTime}</div>
                </div>
              </div>
              <div className="mt-3 p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="label">撤回原因</div>
                <div className="text-sm text-slate-700">{latest.withdrawInfo.withdrawReason}</div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-mint-500 rounded-full" />
              三日食材安排
              {latest.detectedIssues && latest.detectedIssues.length > 0 && (
                <span className="chip bg-coral-100 text-coral-700 border-coral-200 ml-auto">
                  <ShieldAlert size={11} />
                  检测到 {latest.detectedIssues.length} 项冲突
                </span>
              )}
            </h3>
            <ThreeDayPlan plan={latest.threeDayPlan} detectedIssues={latest.detectedIssues} />
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-amber-500 rounded-full" />
              变更历史时间线
            </h3>
            <HistoryTimeline history={latest.history} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5 sticky top-20">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Clock4 size={14} />
              操作记录
            </h3>
            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>创建时间</span>
                <span className="text-slate-700">{latest.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span>最近更新</span>
                <span className="text-slate-700">{latest.updatedAt}</span>
              </div>
              <div className="flex justify-between">
                <span>负责顾问</span>
                <span className="text-slate-700">{latest.consultant}</span>
              </div>
              <div className="flex justify-between">
                <span>当前状态</span>
                <span className="text-slate-700">{STATUS_LABEL[latest.status]}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <p className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">导出说明</span><br />
                导出的摘要为纯文本格式，可直接复制粘贴给同事，
                包含所有关键信息和家长原话，不含内部字段名。
              </p>
            </div>
          </div>
        </div>
      </div>

      {showNoteForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 animate-fade-in">
          <div className="card p-5 w-full max-w-md animate-slide-up">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">补充备注</h3>
            <p className="text-xs text-slate-500 mb-4">家长临时改口或新增信息，请分别记录</p>

            <div className="space-y-3">
              <div>
                <div className="label">家长原话（选填）</div>
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="例：宝宝最近拉肚子，鸡蛋先停一周"
                  value={parentNote}
                  onChange={(e) => setParentNote(e.target.value)}
                />
              </div>
              <div>
                <div className="label">顾问补充（选填）</div>
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="例：已告知调整食谱，后续跟进"
                  value={consultantNote}
                  onChange={(e) => setConsultantNote(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-secondary" onClick={() => setShowNoteForm(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleAddNote}>
                保存备注
              </button>
            </div>
          </div>
        </div>
      )}

      {showOverrideForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 animate-fade-in">
          <div className="card p-5 w-full max-w-md animate-slide-up">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">人工改判状态</h3>
            <p className="text-xs text-slate-500 mb-4">
              当前状态：<span className="font-medium">{STATUS_LABEL[latest.status]}</span> → 将改为：<span className="font-medium text-amber-700">人工改判</span>
            </p>

            <div>
              <div className="label">改判理由（必填）</div>
              <textarea
                className="textarea"
                rows={3}
                placeholder="请详细说明改判原因，如：家长确认某食材可食用、食材已替换等"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-secondary" onClick={() => setShowOverrideForm(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleOverride}>
                确认改判
              </button>
            </div>
          </div>
        </div>
      )}

      {showWithdrawForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 animate-fade-in">
          <div className="card p-5 w-full max-w-md animate-slide-up">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">撤回确认记录</h3>
            <p className="text-xs text-slate-500 mb-4">
              撤回后状态将变为「已撤回」，原记录和承诺都会保留。
            </p>

            <div className="space-y-3">
              <div>
                <div className="label">撤回人</div>
                <input
                  className="input"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                />
              </div>
              <div>
                <div className="label">撤回原因（必填）</div>
                <textarea
                  className="textarea"
                  rows={3}
                  placeholder="例：家长临时取消、宝宝身体不适等"
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-secondary" onClick={() => setShowWithdrawForm(false)}>
                取消
              </button>
              <button className="btn btn-danger" onClick={handleWithdraw}>
                确认撤回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
