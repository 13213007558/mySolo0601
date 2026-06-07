import { useEffect, useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import type { AuthStatus, RecordSource, CreateRecordBody, BabySummary } from '@shared/types';
import { STATUS_LABEL, SOURCE_LABEL } from '@/utils/format';

interface Props {
  open: boolean;
  onClose: () => void;
  preselectedBabyId?: string;
}

export default function AddRecordModal({ open, onClose, preselectedBabyId }: Props) {
  const { summaries, addRecord } = useAuthStore();
  const [babyId, setBabyId] = useState('');
  const [status, setStatus] = useState<AuthStatus>('authorized');
  const [source, setSource] = useState<RecordSource>('manual');
  const [operatorName, setOperatorName] = useState('夜班老师');
  const [remark, setRemark] = useState('');
  const [photoPresent, setPhotoPresent] = useState(true);
  const [anomalyReason, setAnomalyReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setBabyId(preselectedBabyId || summaries[0]?.baby.id || '');
      setStatus('authorized');
      setSource('manual');
      setRemark('');
      setPhotoPresent(true);
      setAnomalyReason('');
      setSubmitting(false);
    }
  }, [open, preselectedBabyId, summaries]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!babyId || !operatorName.trim()) return;
    setSubmitting(true);
    const body: CreateRecordBody = {
      babyId,
      status,
      source,
      operatorName: operatorName.trim(),
      remark: remark.trim() || undefined,
      photoPresent,
      anomalyReason: anomalyReason.trim() || undefined,
      recordedAt: Date.now(),
    };
    const ok = await addRecord(body);
    setSubmitting(false);
    if (ok) onClose();
  }

  const babyOptions: BabySummary[] = summaries;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="fade-in-up w-full max-w-lg rounded-2xl border border-night-500/80 bg-night-700/95 shadow-soft"
      >
        <div className="flex items-center justify-between border-b border-night-500/60 px-5 py-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-night-50">补录授权记录</h3>
            <p className="mt-0.5 text-xs text-night-200">系统会自动生成新版本，旧版本完整保留</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-night-200 transition hover:bg-night-500/60 hover:text-night-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-night-200">宝宝姓名</label>
            <select
              value={babyId}
              onChange={(e) => setBabyId(e.target.value)}
              required
              className="w-full rounded-md border border-night-400/60 bg-night-800 px-3 py-2 text-sm text-night-50 outline-none focus:border-amber-500/80"
            >
              {babyOptions.map((s) => (
                <option key={s.baby.id} value={s.baby.id}>
                  {s.baby.name}（{s.baby.className}）
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-night-200">授权状态</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AuthStatus)}
                className="w-full rounded-md border border-night-400/60 bg-night-800 px-3 py-2 text-sm text-night-50 outline-none focus:border-amber-500/80"
              >
                {(Object.keys(STATUS_LABEL) as AuthStatus[]).map((k) => (
                  <option key={k} value={k}>{STATUS_LABEL[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-night-200">来源</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as RecordSource)}
                className="w-full rounded-md border border-night-400/60 bg-night-800 px-3 py-2 text-sm text-night-50 outline-none focus:border-amber-500/80"
              >
                {(Object.keys(SOURCE_LABEL) as RecordSource[]).map((k) => (
                  <option key={k} value={k}>{SOURCE_LABEL[k]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-night-200">操作人</label>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              required
              placeholder="如：夜班-刘老师"
              className="w-full rounded-md border border-night-400/60 bg-night-800 px-3 py-2 text-sm text-night-50 outline-none focus:border-amber-500/80"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-night-200">备注</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={2}
              placeholder="例如：家长昨夜微信撤回授权，邮件晚到补录"
              className="w-full rounded-md border border-night-400/60 bg-night-800 px-3 py-2 text-sm text-night-50 outline-none focus:border-amber-500/80"
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-night-500/50 bg-night-800/60 px-3 py-2">
            <div>
              <div className="text-sm text-night-50">照片已归档</div>
              <div className="text-[11px] text-night-300">取消勾选将使该条记录不计入汇总统计</div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={photoPresent}
                onChange={(e) => setPhotoPresent(e.target.checked)}
              />
              <div className="h-5 w-9 rounded-full bg-night-500 transition peer-checked:bg-amber-500 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-night-50 after:transition after:peer-checked:translate-x-4" />
            </label>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-night-200">异常原因（如有）</label>
            <input
              type="text"
              value={anomalyReason}
              onChange={(e) => setAnomalyReason(e.target.value)}
              placeholder="填写后该条记录将被标记为异常且不计入正常汇总"
              className="w-full rounded-md border border-night-400/60 bg-night-800 px-3 py-2 text-sm text-night-50 outline-none focus:border-danger/80 placeholder:text-night-400"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-night-500/60 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-night-400/60 bg-night-600 px-4 py-1.5 text-sm text-night-100 transition hover:bg-night-500"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-4 py-1.5 text-sm font-medium text-night-900 transition hover:bg-amber-400 disabled:opacity-60"
          >
            <Plus size={14} />
            {submitting ? '提交中…' : '确认补录（自动升版本）'}
          </button>
        </div>
      </form>
    </div>
  );
}
