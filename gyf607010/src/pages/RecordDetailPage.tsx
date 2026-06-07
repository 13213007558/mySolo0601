import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Baby,
  Droplets,
  AlertTriangle,
  Pencil,
  History,
  Clock,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  User,
  Info,
} from 'lucide-react';
import { recordsApi } from '@/api/records';
import StatusBadge from '@/components/StatusBadge';
import RecordFormModal from '@/components/RecordFormModal';
import { ToastHost, showToast } from '@/components/Toast';
import { useAppStore } from '@/store/useAppStore';
import { formatDateTime, displayValue } from '@/utils/format';
import type { ChangeHistory, MilkRecord, RecordWithHistory } from '@shared/types';
import { ShiftLabel, FeedingMethodLabel } from '@shared/types';

const fieldLabels: Record<string, string> = {
  record: '记录',
  status: '状态',
  babyName: '婴儿姓名',
  recordDate: '记录日期',
  shift: '班次',
  milkAmountMl: '奶量(ml)',
  feedingMethod: '喂养方式',
  remark: '备注',
};

const actionLabels: Record<ChangeHistory['action'], string> = {
  create: '新建',
  update: '修改',
  review: '复核',
  withdraw: '撤回',
};

export default function RecordDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);
  const [data, setData] = useState<RecordWithHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');

  const [reviewReason, setReviewReason] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState<'pass' | 'reject' | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const d = await recordsApi.get(id);
      setData(d);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (loading || !data) {
    return (
      <div className="card p-10 text-center text-slate-500">
        {loading ? '加载中…' : '记录不存在'}
      </div>
    );
  }

  const { record, history } = data;

  async function handleReview(pass: boolean) {
    if (!pass && !reviewReason.trim()) {
      showToast('请填写复核原因', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await recordsApi.review(record.id, {
        pass,
        reason: pass ? undefined : reviewReason,
        operator: currentUser,
      });
      showToast(pass ? '复核通过' : '已退回为已撤回状态', 'success');
      setReviewOpen(false);
      setReviewReason('');
      setReviewMode(null);
      load();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdraw() {
    if (!withdrawReason.trim()) {
      showToast('请填写撤回原因', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await recordsApi.withdraw(record.id, {
        reason: withdrawReason,
        operator: currentUser,
      });
      showToast('已撤回该记录', 'success');
      setWithdrawOpen(false);
      setWithdrawReason('');
      load();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <ToastHost />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button className="btn-ghost" onClick={() => navigate('/records')}>
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-2xl font-semibold text-slate-900">记录详情</h2>
              <code className="text-xs text-slate-400">{record.id}</code>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              婴儿：{record.babyName} · {record.recordDate} · {ShiftLabel[record.shift]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={record.status} size="md" />
          {record.status !== 'withdrawn' && (
            <button className="btn-secondary" onClick={() => setEditOpen(true)}>
              <Pencil className="w-4 h-4" />
              修改记录
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold text-slate-900">基本信息</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoItem icon={<Baby className="w-4 h-4" />} label="婴儿姓名" value={record.babyName} />
              <InfoItem icon={<CalendarDays className="w-4 h-4" />} label="记录日期" value={record.recordDate} />
              <InfoItem icon={<Clock className="w-4 h-4" />} label="班次" value={ShiftLabel[record.shift]} />
              <InfoItem icon={<Droplets className="w-4 h-4" />} label="奶量" value={`${record.milkAmountMl} ml`} />
              <InfoItem icon={<Info className="w-4 h-4" />} label="喂养方式" value={FeedingMethodLabel[record.feedingMethod]} />
              <InfoItem icon={<User className="w-4 h-4" />} label="创建人" value={record.createdByName} />
            </div>
            <div className="mt-5 pt-5 border-t border-slate-100">
              <div className="text-xs text-slate-500 mb-1.5">备注</div>
              <div className="text-sm text-slate-700">{record.remark || '—'}</div>
            </div>
          </div>

          {(record.conflictReason || record.withdrawReason) && (
            <div
              className={`card p-5 animate-fade-up ring-1 ${
                record.conflictReason ? 'bg-rose-50/50 ring-rose-100' : 'bg-slate-50 ring-slate-200'
              }`}
              style={{ animationDelay: '60ms' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    record.conflictReason ? 'bg-rose-500' : 'bg-slate-400'
                  } text-white shrink-0`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900">
                    {record.conflictReason ? '预约冲突' : '记录已撤回'}
                  </div>
                  <div className="text-sm text-slate-600 mt-1">
                    {record.conflictReason || record.withdrawReason}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card p-6 animate-fade-up" style={{ animationDelay: '120ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-brand-600" />
              <h3 className="font-serif text-lg font-semibold text-slate-900">状态流转</h3>
            </div>
            <StatusTimeline record={record} history={history} />
          </div>

          <div className="card p-6 animate-fade-up" style={{ animationDelay: '180ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                <h3 className="font-serif text-lg font-semibold text-slate-900">变更历史</h3>
              </div>
              <span className="text-xs text-slate-500">共 {history.length} 条变更</span>
            </div>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200">
                    <th className="table-cell text-left font-medium text-slate-500 text-xs uppercase tracking-wider">时间</th>
                    <th className="table-cell text-left font-medium text-slate-500 text-xs uppercase tracking-wider">操作</th>
                    <th className="table-cell text-left font-medium text-slate-500 text-xs uppercase tracking-wider">字段</th>
                    <th className="table-cell text-left font-medium text-slate-500 text-xs uppercase tracking-wider">旧值</th>
                    <th className="table-cell text-left font-medium text-slate-500 text-xs uppercase tracking-wider">新值</th>
                    <th className="table-cell text-left font-medium text-slate-500 text-xs uppercase tracking-wider">处理人</th>
                    <th className="table-cell text-left font-medium text-slate-500 text-xs uppercase tracking-wider">复核时间</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-cell text-center text-slate-400 py-8">
                        暂无变更记录
                      </td>
                    </tr>
                  ) : (
                    history.map((h) => (
                      <tr key={h.id} className="border-b border-slate-100 last:border-0">
                        <td className="table-cell text-xs text-slate-500 whitespace-nowrap">
                          {formatDateTime(h.operatedAt)}
                        </td>
                        <td className="table-cell">
                          <span
                            className={`tag ${
                              h.action === 'create'
                                ? 'bg-brand-50 text-brand-700'
                                : h.action === 'update'
                                ? 'bg-sky-50 text-sky-700'
                                : h.action === 'review'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {actionLabels[h.action]}
                          </span>
                        </td>
                        <td className="table-cell font-medium text-slate-700">
                          {fieldLabels[h.field] || h.field}
                        </td>
                        <td className="table-cell">
                          {h.oldValue === null || h.oldValue === undefined ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            <span className="text-slate-600">{displayValue(h.oldValue)}</span>
                          )}
                        </td>
                        <td className="table-cell">
                          <span className="font-medium text-slate-800">
                            {h.newValue === null || h.newValue === undefined
                              ? '—'
                              : displayValue(h.newValue)}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm">{h.operatedByName}</div>
                          {h.reason && (
                            <div className="text-xs text-slate-400 mt-0.5">原因：{h.reason}</div>
                          )}
                        </td>
                        <td className="table-cell text-xs text-slate-500 whitespace-nowrap">
                          {h.reviewedAt ? formatDateTime(h.reviewedAt) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 sticky top-24 animate-fade-up" style={{ animationDelay: '80ms' }}>
            <h3 className="font-serif text-lg font-semibold text-slate-900 mb-4">复核操作</h3>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">当前处理人</div>
                <div className="font-medium text-slate-800">{currentUser.name}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">当前状态</div>
                <div className="mt-1">
                  <StatusBadge status={record.status} />
                </div>
              </div>
              {record.reviewedByName && (
                <div className="rounded-lg bg-emerald-50 p-3">
                  <div className="text-xs text-emerald-600">复核人 / 复核时间</div>
                  <div className="font-medium text-emerald-800 mt-0.5">
                    {record.reviewedByName} · {formatDateTime(record.reviewedAt)}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 space-y-2">
              {record.status === 'pending' && (
                <>
                  <button
                    className="btn-primary w-full"
                    onClick={() => {
                      setReviewMode('pass');
                      setReviewOpen(true);
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    复核通过
                  </button>
                  <button
                    className="btn-danger w-full"
                    onClick={() => {
                      setReviewMode('reject');
                      setReviewOpen(true);
                    }}
                  >
                    复核退回（记入已撤回）
                  </button>
                </>
              )}
              {record.status === 'confirmed' && (
                <button className="btn-danger w-full" onClick={() => setWithdrawOpen(true)}>
                  <RotateCcw className="w-4 h-4" />
                  撤回已确认记录
                </button>
              )}
              {record.status === 'conflict' && (
                <p className="text-xs text-slate-500 text-center py-2">
                  预约冲突记录需先在列表中修改后重新复核。
                </p>
              )}
              {record.status === 'withdrawn' && (
                <p className="text-xs text-slate-500 text-center py-2">
                  已撤回记录仅保留审计，不可再操作。
                </p>
              )}
              <Link to="/records" className="btn-secondary w-full">
                <ArrowLeft className="w-4 h-4" />
                返回列表
              </Link>
            </div>
          </div>
        </div>
      </div>

      <RecordFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={load}
        editRecord={record}
      />

      {reviewOpen && reviewMode && (
        <ReviewModal
          mode={reviewMode}
          reason={reviewReason}
          onReasonChange={setReviewReason}
          onCancel={() => {
            setReviewOpen(false);
            setReviewReason('');
            setReviewMode(null);
          }}
          onSubmit={() => handleReview(reviewMode === 'pass')}
          submitting={submitting}
        />
      )}

      {withdrawOpen && (
        <WithdrawModal
          title="撤回已确认记录"
          subtitle="撤回后状态变更为已撤回，原记录与审计历史均保留。"
          reason={withdrawReason}
          onReasonChange={setWithdrawReason}
          onCancel={() => {
            setWithdrawOpen(false);
            setWithdrawReason('');
          }}
          onSubmit={handleWithdraw}
          submitting={submitting}
        />
      )}
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <span className="text-brand-500">{icon}</span>
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

function StatusTimeline({
  record,
  history,
}: {
  record: MilkRecord;
  history: ChangeHistory[];
}) {
  const events: Array<{
    time: string;
    label: string;
    type: 'create' | 'review' | 'withdraw';
    by?: string;
    reason?: string;
  }> = [];
  events.push({
    time: record.createdAt,
    label: '记录创建',
    type: 'create',
    by: record.createdByName,
  });
  const statusChanges = history.filter((h) => h.field === 'status').slice().reverse();
  statusChanges.forEach((h) => {
    let label = '状态变更';
    if (h.action === 'review') {
      label = h.newValue === 'confirmed' ? '复核通过' : '复核退回';
    } else if (h.action === 'withdraw') {
      label = '记录已撤回';
    }
    events.push({
      time: h.operatedAt,
      label,
      type: h.action === 'withdraw' ? 'withdraw' : 'review',
      by: h.operatedByName,
      reason: h.reason,
    });
  });

  const dotColor: Record<string, string> = {
    create: 'bg-brand-500',
    review: 'bg-emerald-500',
    withdraw: 'bg-rose-500',
  };

  return (
    <ol className="relative border-l border-slate-200 ml-2 space-y-5 py-1">
      {events.map((e, idx) => (
        <li key={idx} className="ml-5 relative">
          <span
            className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full ${dotColor[e.type]} ring-4 ring-white`}
          />
          <div className="flex items-baseline justify-between">
            <div className="font-medium text-sm text-slate-800">{e.label}</div>
            <div className="text-xs text-slate-400">{formatDateTime(e.time)}</div>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">处理人：{e.by}</div>
          {e.reason && <div className="text-xs text-slate-500 mt-0.5">原因：{e.reason}</div>}
        </li>
      ))}
    </ol>
  );
}

interface WithdrawModalProps {
  title: string;
  subtitle?: string;
  reason: string;
  onReasonChange: (v: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

function WithdrawModal({
  title,
  subtitle,
  reason,
  onReasonChange,
  onCancel,
  onSubmit,
  submitting,
}: WithdrawModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-up">
        <div className="px-6 pt-6 pb-4">
          <h3 className="font-serif text-lg font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className="px-6 pb-4">
          <label className="label">原因 *</label>
          <textarea
            className="input min-h-[96px]"
            placeholder="请输入撤回原因"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
          />
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-2xl">
          <button className="btn-secondary" onClick={onCancel} disabled={submitting}>
            取消
          </button>
          <button className="btn-primary" onClick={onSubmit} disabled={submitting}>
            {submitting ? '提交中…' : '确认撤回'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ReviewModalProps {
  mode: 'pass' | 'reject';
  reason: string;
  onReasonChange: (v: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

function ReviewModal({
  mode,
  reason,
  onReasonChange,
  onCancel,
  onSubmit,
  submitting,
}: ReviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-up">
        <div className="px-6 pt-6 pb-4">
          <h3 className="font-serif text-lg font-semibold text-slate-900">
            {mode === 'pass' ? '复核通过' : '复核退回'}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'pass'
              ? '通过后状态将变更为已确认。'
              : '退回后状态将变更为已撤回，需填写原因。'}
          </p>
        </div>
        {mode === 'reject' && (
          <div className="px-6 pb-4">
            <label className="label">退回原因 *</label>
            <textarea
              className="input min-h-[96px]"
              placeholder="请说明退回原因"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
            />
          </div>
        )}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-2xl">
          <button className="btn-secondary" onClick={onCancel} disabled={submitting}>
            取消
          </button>
          <button
            className={mode === 'pass' ? 'btn-primary' : 'btn-danger'}
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? '提交中…' : mode === 'pass' ? '确认通过' : '确认退回'}
          </button>
        </div>
      </div>
    </div>
  );
}
