import { useState, useMemo } from 'react';
import { useScheduleStore, statusLabel } from '@/store/useScheduleStore';
import type { Schedule, ScheduleStatus } from '../../shared/types';
import { X, Wrench, AlertCircle } from 'lucide-react';

export default function ManualCorrection({
  scheduleId,
  onClose,
}: {
  scheduleId: string;
  onClose: () => void;
}) {
  const manualCorrect = useScheduleStore((s) => s.manualCorrect);
  const schedules = useScheduleStore((s) => s.schedules);
  const selected: Schedule | null = useMemo(
    () => schedules.find((x) => x.id === scheduleId) ?? null,
    [schedules, scheduleId]
  );
  const [note, setNote] = useState('');
  const [newStatus, setNewStatus] = useState<ScheduleStatus>('confirmed');

  const submit = () => {
    if (!note.trim()) return;
    manualCorrect(scheduleId, note.trim(), newStatus);
    onClose();
  };

  const statuses: ScheduleStatus[] = [
    'scheduled',
    'confirmed',
    'in_progress',
    'completed',
    'manually_corrected',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-teal-500/20 bg-gradient-to-br from-[#16232a] to-[#0f1220] p-5 shadow-2xl ring-1 ring-teal-500/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <Wrench className="h-4 w-4 text-teal-300" />
              <h3 className="text-base font-semibold text-white">人工更正</h3>
            </div>
            <p className="mt-0.5 text-[11px] text-white/40">
              用于主管复核后修正系统判定（如照片误判、异常误报）。更正后原状态与原因全部可追溯。
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {selected && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2 text-[11px] text-white/60">
            <AlertCircle className="h-3.5 w-3.5 text-teal-300" />
            当前排程：{selected.id} · {selected.childName}（{selected.childNickname}）· 原状态：
            <span className="font-semibold text-white/80">{statusLabel[selected.status]}</span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] text-white/60">更正后状态</label>
            <div className="flex flex-wrap gap-1.5">
              {statuses.map((st) => (
                <button
                  key={st}
                  onClick={() => setNewStatus(st)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                    newStatus === st
                      ? 'border-teal-500/40 bg-teal-500/15 text-teal-200'
                      : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {statusLabel[st]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-white/60">更正说明（必填，将写入审计日志）</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="例如：系统误判照片不合格，人工复核确认照片清晰可用..."
              className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-teal-500/40 focus:bg-white/[0.07]"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="max-w-xs text-[10px] text-white/30">
            更正后将同时写入审计日志与备注历史，主管可复盘完整人工更正路径
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-[12px] text-white/70 hover:bg-white/10"
            >
              取消
            </button>
            <button
              onClick={submit}
              disabled={!note.trim()}
              className="rounded-xl border border-teal-500/30 bg-teal-500/15 px-4 py-1.5 text-[12px] text-teal-200 transition hover:bg-teal-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              提交更正
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
