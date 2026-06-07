import type { RemarkEntry } from "@/types";
import { ROLE_LABELS } from "@/types";
import { MessageSquare, UserRound, ShieldCheck } from "lucide-react";
import { formatDateTime } from "@/data/mockData";

interface Props {
  remarks: RemarkEntry[];
  compact?: boolean;
}

export const RemarkTimeline = ({ remarks, compact = false }: Props) => {
  if (remarks.length === 0) {
    return (
      <div className={`rounded-xl border border-dashed border-stone-200 ${compact ? "py-4" : "py-8"} text-center`}>
        <MessageSquare className="w-6 h-6 text-stone-300 mx-auto" />
        <p className="text-xs text-stone-400 mt-2">暂无备注记录</p>
      </div>
    );
  }

  return (
    <ol className={`relative ${compact ? "space-y-0" : "space-y-1"}`}>
      {remarks.map((r, idx) => (
        <li key={r.id} className={`relative pl-8 ${compact ? "py-2" : "py-3"} animate-slide-right`} style={{ animationDelay: `${idx * 40}ms` }}>
          {idx < remarks.length - 1 && (
            <div className="absolute left-[11px] top-7 w-px h-[calc(100%-12px)] bg-stone-200" />
          )}
          <div
            className={`absolute left-0 top-2.5 w-6 h-6 rounded-full flex items-center justify-center ${
              r.operatorRole === "supervisor"
                ? "bg-accent-100"
                : "bg-brand-100"
            }`}
          >
            {r.operatorRole === "supervisor" ? (
              <ShieldCheck className="w-3.5 h-3.5 text-accent-600" />
            ) : (
              <UserRound className="w-3.5 h-3.5 text-brand-600" />
            )}
          </div>

          <div
            className={`rounded-xl p-3 ${
              compact ? "bg-stone-50" : "bg-white border border-stone-100"
            }`}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-stone-900">{r.operator}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200/60 text-stone-600">
                  {ROLE_LABELS[r.operatorRole]}
                </span>
                {r.previousContent && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                    内容变更
                  </span>
                )}
              </div>
              <span className="text-[11px] text-stone-400">
                {formatDateTime(r.timestamp)}
              </span>
            </div>

            {r.previousContent && (
              <div className="mt-2 mb-1.5 rounded-lg bg-stone-100 px-2.5 py-1.5">
                <div className="text-[10px] text-stone-500 mb-0.5">之前的承诺 / 备注：</div>
                <div className="text-xs text-stone-500 line-through">
                  {r.previousContent}
                </div>
              </div>
            )}
            <div className="text-sm text-stone-800 leading-relaxed">{r.content}</div>
          </div>
        </li>
      ))}
    </ol>
  );
};
