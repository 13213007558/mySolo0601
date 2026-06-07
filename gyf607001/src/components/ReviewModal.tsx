import { useState } from 'react';
import { X, AlertTriangle, Thermometer, PenLine, CheckCircle2, Loader2 } from 'lucide-react';
import type { DailyCheckRecord, CheckStatus } from '../../shared/types';
import { STATUS_LABELS } from '../../shared/types';
import { useAppStore } from '@/store/useAppStore';
import StatusBadge from './StatusBadge';

interface Props {
  open: boolean;
  onClose: () => void;
  record: DailyCheckRecord | null;
  babyName?: string;
}

export default function ReviewModal({ open, onClose, record, babyName }: Props) {
  const submitReview = useAppStore((s) => s.submitReview);
  const [newStatus, setNewStatus] = useState<CheckStatus>('normal');
  const [newReason, setNewReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open || !record) return null;

  const reset = () => {
    setNewStatus('normal');
    setNewReason('');
    setLoading(false);
    setSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!newReason.trim()) return;
    setLoading(true);
    const ok = await submitReview(record.id, newStatus, newReason.trim());
    setLoading(false);
    if (ok) {
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1000);
    }
  };

  const statusOptions: CheckStatus[] = ['normal', 'abnormal', 'pending', 'leave'];
  const maxLen = 200;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-brand-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
              <PenLine className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-gray-900">人工改判</h3>
              <p className="text-sm text-gray-500">
                宝宝：<span className="font-medium text-gray-700">{babyName || '未知'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-10 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center animate-fade-in-up">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <p className="text-lg font-medium text-gray-900">改判已提交</p>
            <p className="text-sm text-gray-500">审计记录已自动生成</p>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800">改判将生成审计记录</p>
                <p className="text-xs text-orange-600 mt-0.5">旧理由与新理由都会被保留，方便主管复查</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-500 mb-2">当前状态与理由</p>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={record.status} size="sm" />
              </div>
              <p className="text-sm text-gray-700">{record.initialReason}</p>
            </div>

            <div>
              <label className="label-text">
                <span className="flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5" />
                  新状态 <span className="text-red-500">*</span>
                </span>
              </label>
              <select
                className="select-field"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as CheckStatus)}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-text">
                <span className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <PenLine className="w-3.5 h-3.5" />
                    新理由 <span className="text-red-500">*</span>
                  </span>
                  <span className={`text-xs ${newReason.length > maxLen ? 'text-red-500' : 'text-gray-400'}`}>
                    {newReason.length}/{maxLen}
                  </span>
                </span>
              </label>
              <textarea
                className="input-field min-h-[100px] resize-none"
                placeholder="请填写详细的改判理由，例如：家长带来医院证明，血常规正常..."
                value={newReason}
                onChange={(e) => setNewReason(e.target.value.slice(0, maxLen))}
              />
              {newReason.length < 10 && newReason.length > 0 && (
                <p className="text-xs text-orange-500 mt-1">建议填写详细理由，方便主管复查</p>
              )}
            </div>
          </div>
        )}

        {!success && (
          <div className="flex gap-3 p-5 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleClose}
              className="btn-secondary flex-1"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !newReason.trim() || newReason.length < 5}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? '提交中...' : '确认改判'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
