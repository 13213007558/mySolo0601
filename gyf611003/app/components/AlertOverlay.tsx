import { AlertTriangle, X } from "lucide-react";
import type { DiveAlert } from "~/data/types";
import { formatTime } from "~/utils/format";

interface Props {
  alerts: DiveAlert[];
  mode: string;
  onAck: (id: string) => void;
  muted: boolean;
  onToggleMute: () => void;
}

export default function AlertOverlay({ alerts, mode, onAck, muted, onToggleMute }: Props) {
  const unacked = alerts.filter(a => !a.acknowledged);
  const hasEmergency = mode === "emergency";
  const hasAlert = hasEmergency || unacked.some(a => a.type === "deviation");

  if (!hasAlert && !unacked.length) return null;

  return (
    <>
      {hasEmergency && (
        <div className="fixed inset-0 pointer-events-none emergency-overlay z-50" />
      )}

      {hasAlert && !hasEmergency && (
        <div className="pointer-events-none fixed inset-0 z-40 animate-pulse-alert rounded-sm" />
      )}

      <div className="fixed top-20 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] space-y-2">
        {unacked.slice(0, 4).map(a => (
          <div
            key={a.id}
            className={`console-card border-2 p-3 flex items-start gap-3
              ${a.type === "emergency"
                ? "border-indicator-red shadow-led-red bg-indicator-red/10"
                : a.type === "deviation"
                ? "border-indicator-amber shadow-led-amber bg-indicator-amber/10"
                : "border-indicator-cyan bg-indicator-cyan/10"}`}
          >
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              a.type === "emergency" ? "text-indicator-red" : a.type === "deviation" ? "text-indicator-amber" : "text-indicator-cyan"
            }`} />
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-wider font-bold text-slate-500 reading-mono mb-0.5">
                {formatTime(a.createdAt)}
                <span className="ml-2">
                  {a.type === "emergency" ? "紧急事件" : a.type === "deviation" ? "偏离告警" : "倒计时结束"}
                </span>
              </div>
              <div className="text-sm font-semibold text-slate-100 leading-snug">{a.message}</div>
            </div>
            <button
              onClick={() => onAck(a.id)}
              className="w-7 h-7 flex items-center justify-center rounded-sm bg-nautical-900/60 border border-nautical-600/70 text-slate-400 hover:text-indicator-cyan hover:border-indicator-cyan transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onToggleMute}
            className={`px-3 py-1 text-[11px] font-semibold rounded-sm border transition-all reading-mono
              ${muted
                ? "border-slate-600 bg-nautical-800 text-slate-500"
                : "border-indicator-amber bg-indicator-amber/10 text-indicator-amber shadow-led-amber"}`}
          >
            {muted ? "🔇 告警音: 关" : "🔔 告警音: 开"}
          </button>
        </div>
      </div>
    </>
  );
}
