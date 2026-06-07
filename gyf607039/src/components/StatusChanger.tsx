import { useState } from 'react';
import { useScheduleStore, statusLabel } from '@/store/useScheduleStore';
import type { ScheduleStatus } from '../../shared/types';
import { X, RotateCcw } from 'lucide-react';

export default function StatusChanger({
  scheduleId,
  current,
  onClose,
}: {
  scheduleId: string;
  current: ScheduleStatus;
  onClose: () => void;
}) {
  const updateStatus = useScheduleStore((s) => s.updateStatus);
  const [status, setStatus] = useState<ScheduleStatus>(current);
  const [reason, setReason] = useState('');

  const submit = () => {
    updateStatus(scheduleId, status, reason.trim() || undefined);
    onClose();
  };

  const statuses: ScheduleStatus[] = [
    'scheduled',
    'confirmed',
    'in_progress',
    'completed',
    'failed',
    'cancelled',
    'manually_corrected',
  ];

  const needsReason = status === 'failed' || status === 'cancelled';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1f2e] to-[#0f1220] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <RotateCcw className="h-4 w-4 text-sky-300" />
              <h3 className="text-base font-semibold text-white">变更排程状态</h3>
            </div>
            <p className="mt-0.5 text-[11px] text-white/40">
              当前状态：<b className="text-white/70">{statusLabel[current]}</b> — 每次变更均会写入审计日志
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] text-white/60">目标状态</label>
            <div className="flex flex-wrap gap-1.5">
              {statuses.map((st) => (
                <button
                  key={st}
                  onClick={() => setStatus(st)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                    status === st
                      ? 'border-sky-500/40 bg-sky-500/15 text-sky-200'
                      : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {statusLabel[st]}
                </button>
              ))}
            </div>
          </div>

          {needsReason && (
            <div>
              <label className="mb-1 block text-[11px] text-white/60">
                原因{status === 'failed' ? '（失败必填，将计入失败路径复盘）' : '（必填）'}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="例如：授权接送人照片缺失且家长未按时补交..."
                className="w-full rounded-xl border border-rose-500/20 bg-rose-500/[0.05] p-2.5 text-sm text-white placeholder-rose-200/30 outline-none focus:border-rose-500/40"
              />
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-[12px] text-white/70 hover:bg-white/10"
          >
            取消
          </button>
          <button
            onClick={submit}
            disabled={needsReason && !reason.trim()}
            className="rounded-xl border border-sky-500/30 bg-sky-500/15 px-4 py-1.5 text-[12px] text-sky-200 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            确认变更
          </button>
        </div>
      </div>
    </div>
  );
}
