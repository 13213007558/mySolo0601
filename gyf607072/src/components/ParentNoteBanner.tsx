import { MessageCircleHeart, RefreshCw } from "lucide-react";
import { useStore } from "@/store/useStore";

export default function ParentNoteBanner() {
  const parentNote = useStore((s) => s.parentNote);
  const updatedAt = useStore((s) => s.parentNoteUpdatedAt);
  const needsReconfirm = useStore((s) => s.needsReconfirm);
  const reconfirmAll = useStore((s) => s.reconfirmAll);
  const currentRole = useStore((s) => s.currentRole);

  if (!parentNote) return null;

  return (
    <div className="card-base bg-gradient-to-r from-baby-100/80 via-cream-100 to-baby-100/60 border border-baby-100 p-4 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-baby-300/30 flex items-center justify-center flex-shrink-0">
          <MessageCircleHeart size={20} className="text-baby-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display font-semibold text-ink-800">沐沐妈妈</span>
            <span className="text-xs text-ink-700/50">{updatedAt} 补充</span>
            {needsReconfirm && (
              <span className="chip bg-baby-300/40 text-baby-500 text-[10px] animate-pulse">
                需重新确认
              </span>
            )}
          </div>
          <p className="text-sm text-ink-700 leading-relaxed">{parentNote}</p>
        </div>
        {needsReconfirm && currentRole !== "elder" && (
          <button
            onClick={reconfirmAll}
            className="btn-primary flex items-center gap-1.5 text-sm whitespace-nowrap"
          >
            <RefreshCw size={14} />
            重新确认
          </button>
        )}
      </div>
    </div>
  );
}
