import { Eye, Radio } from "lucide-react";
import type { DiveState } from "~/data/types";
import { formatDepth, formatTime } from "~/utils/format";
import { useCountdown, formatMMSS } from "~/hooks/useCountdown";
import type { DecompressionStep } from "~/data/types";
import { stepStatusLabel } from "~/utils/format";

interface Props {
  state: DiveState;
}

function MiniStepStatus({ step }: { step: DecompressionStep }) {
  const { status, remaining, progressPct, deviation } = useCountdown(
    step.plannedDuration,
    step.status === "counting",
    step.startedAt
  );

  const colorMap: Record<string, string> = {
    locked: "bg-slate-700",
    unlocked: "led-cyan",
    arrived: "led-cyan",
    counting: status === "warning" ? "led-amber" : status === "overtime" || status === "alert" ? "led-red animate-pulse" : "led-cyan animate-pulse",
    diverSigned: "led-amber",
    completed: "led-green",
    skipped: "bg-indicator-red",
  };

  const textColor =
    status === "alert"
      ? "text-indicator-red"
      : status === "overtime" || status === "warning"
      ? "text-indicator-amber"
      : step.status === "completed"
      ? "text-indicator-green"
      : step.status === "locked"
      ? "text-slate-600"
      : "text-indicator-cyan";

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-nautical-700/40 last:border-b-0">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colorMap[step.status]}`} />
      <span className="reading-mono text-sm w-12 shrink-0 text-slate-200">{formatDepth(step.plannedDepth)}</span>
      <div className="flex-1 min-w-0">
        {step.status === "counting" ? (
          <div className="relative">
            <div className="h-1.5 rounded-full bg-nautical-700 overflow-hidden">
              <div
                className={`h-full transition-all ${status === "alert" ? "bg-indicator-red" : status === "overtime" ? "bg-indicator-red/70" : status === "warning" ? "bg-indicator-amber" : "bg-indicator-cyan"}`}
                style={{ width: `${Math.min(100, progressPct * 100)}%` }}
              />
            </div>
            <div className={`reading-mono text-xs mt-0.5 ${textColor} tabular-nums`}>
              ⏱ {formatMMSS(remaining)}
              {deviation > 0 && <span className="ml-1 text-indicator-red">+{deviation}s</span>}
            </div>
          </div>
        ) : (
          <div className={`text-[11px] ${textColor}`}>
            {stepStatusLabel(step.status)}
            {step.actualArrivalTime && (
              <span className="ml-1.5 text-slate-500 reading-mono">@{formatTime(step.actualArrivalTime)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SupportPanel({ state }: Props) {
  const plan = state.plan;
  if (!plan) return null;
  const sorted = [...plan.steps].sort((a, b) => a.index - b.index);

  const completedCount = sorted.filter(s => s.status === "completed" || s.status === "skipped").length;
  const totalCount = sorted.length;
  const progressPct = (completedCount / totalCount) * 100;

  return (
    <aside className="console-card p-4 flex flex-col h-full min-h-[480px]">
      <div className="flex items-center justify-between mb-3 pb-3 border-b-2 border-nautical-700/70">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-indicator-cyan animate-pulse" />
          <h3 className="font-bold text-slate-100 tracking-wider">水面支援只读台</h3>
        </div>
        <span className="text-[10px] reading-mono px-2 py-0.5 rounded-sm bg-indicator-cyan/10 text-indicator-cyan border border-indicator-cyan/40 uppercase tracking-wider flex items-center gap-1">
          <Eye className="w-3 h-3" /> View Only
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-end justify-between mb-1.5">
          <span className="text-[11px] uppercase text-slate-500 tracking-wider">整体进度</span>
          <span className="reading-mono text-indicator-cyan font-bold text-sm">{completedCount}/{totalCount} 阶</span>
        </div>
        <div className="h-2 rounded-full bg-nautical-700 overflow-hidden border border-nautical-600/50">
          <div
            className="h-full bg-gradient-to-r from-indicator-cyan to-indicator-green transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="mb-3 text-[10px] uppercase tracking-wider text-slate-500 flex items-center justify-between">
        <span>减压阶梯实时同步</span>
        <span className="text-slate-600 reading-mono">深度↓ / 时间→</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-0 pr-1 -mr-1">
        {sorted.map(s => (
          <MiniStepStatus key={s.id} step={s} />
        ))}
      </div>

      {state.alerts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-nautical-700/60">
          <div className="text-[10px] uppercase tracking-wider text-indicator-amber font-bold mb-1.5">⚠ 告警日志</div>
          <div className="space-y-1 max-h-28 overflow-y-auto text-[11px]">
            {state.alerts.slice(-5).reverse().map(a => (
              <div
                key={a.id}
                className={`flex items-start gap-1.5 py-1 border-l-2 pl-2 ${
                  a.type === "emergency"
                    ? "border-indicator-red text-indicator-red"
                    : "border-indicator-amber text-indicator-amber"
                }`}
              >
                <span className="reading-mono text-slate-500 shrink-0">{formatTime(a.createdAt)}</span>
                <span className="truncate">{a.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
