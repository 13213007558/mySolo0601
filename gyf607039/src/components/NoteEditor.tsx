import { useState, useMemo } from 'react';
import { useScheduleStore } from '@/store/useScheduleStore';
import { X, MessageSquarePlus, PenTool, Lock } from 'lucide-react';

export default function NoteEditor({
  scheduleId,
  onClose,
}: {
  scheduleId: string;
  onClose: () => void;
}) {
  const addNote = useScheduleStore((s) => s.addNote);
  const schedules = useScheduleStore((s) => s.schedules);
  const selected = useMemo(
    () => schedules.find((x) => x.id === scheduleId) ?? null,
    [schedules, scheduleId]
  );
  const [content, setContent] = useState('');
  const [isRevision, setIsRevision] = useState(false);
  const [originalPromise, setOriginalPromise] = useState('');

  const submit = () => {
    if (!content.trim()) return;
    addNote(scheduleId, content.trim(), isRevision, isRevision ? originalPromise.trim() || undefined : undefined);
    onClose();
  };

  const lastNote = selected?.notes[selected.notes.length - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1f2e] to-[#0f1220] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <MessageSquarePlus className="h-4 w-4 text-amber-300" />
              <h3 className="text-base font-semibold text-white">追加备注</h3>
            </div>
            <p className="mt-0.5 text-[11px] text-white/40">
              若家长临时改口，请勾选"修订备注"并填入原承诺 — 原承诺将被锁定保留
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] text-white/60">备注内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="例如：家长临时改口，原定外婆接送改由舅舅..."
              className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-amber-500/40 focus:bg-white/[0.07]"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-2.5">
            <input
              type="checkbox"
              checked={isRevision}
              onChange={(e) => {
                setIsRevision(e.target.checked);
                if (e.target.checked && !originalPromise && lastNote) {
                  setOriginalPromise(lastNote.content);
                }
              }}
              className="mt-0.5 h-3.5 w-3.5 accent-amber-500"
            />
            <div>
              <div className="flex items-center gap-1.5 text-[12px] text-white/80">
                <PenTool className="h-3.5 w-3.5 text-amber-300" /> 此为修订备注（家长临时改口）
              </div>
              <p className="mt-0.5 text-[10px] text-white/40">勾选后需填入原承诺，系统将锁定保留以供复查</p>
            </div>
          </label>

          {isRevision && (
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-[11px] text-white/60">
                <Lock className="h-3 w-3 text-amber-300" /> 原承诺（保存后不可抹除）
              </div>
              <textarea
                value={originalPromise}
                onChange={(e) => setOriginalPromise(e.target.value)}
                rows={2}
                placeholder="原来的承诺内容，例如：家长承诺 6/9 前补交外婆照片"
                className="w-full rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-2.5 text-sm text-amber-100 placeholder-amber-200/30 outline-none focus:border-amber-500/40"
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
            disabled={!content.trim()}
            className="rounded-xl border border-amber-500/30 bg-amber-500/15 px-4 py-1.5 text-[12px] text-amber-200 transition hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            保存备注
          </button>
        </div>
      </div>
    </div>
  );
}
