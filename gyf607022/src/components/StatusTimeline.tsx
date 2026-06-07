import { CheckCircle2, AlertTriangle, Search, ShieldCheck, RefreshCw, CopyPlus, FileEdit } from "lucide-react";
import type { StatusLog as StatusLogType } from "@/types";
import { formatDateTime } from "@/utils/id";
import { cn } from "@/lib/utils";

const ICONS = {
  status_change: CheckCircle2,
  duplicate_block: CopyPlus,
  refresh_recover: RefreshCw,
  manual_create: FileEdit,
  default: Search,
} as const;

const COLORS: Record<string, string> = {
  status_change: "bg-milkgreen-400 border-milkgreen-400",
  duplicate_block: "bg-coral-400 border-coral-400",
  refresh_recover: "bg-mistblue-400 border-mistblue-400",
  manual_create: "bg-coral-300 border-coral-300",
  default: "bg-mistblue-200 border-mistblue-200",
};

export default function StatusTimeline({ logs }: { logs: StatusLogType[] }) {
  if (!logs || logs.length === 0) {
    return <div className="text-sm text-mistblue-400">暂无状态变更记录</div>;
  }
  const sorted = [...logs].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return (
    <ol className="relative border-l-2 border-cream-200 ml-2 space-y-6">
      {sorted.map((log, idx) => {
        const type = log.type ?? "status_change";
        const Icon = ICONS[type] ?? ICONS.default;
        const color = COLORS[type] ?? COLORS.default;
        return (
          <li key={log.id} className="ml-6 animate-fade-in-up" style={{ animationDelay: `${idx * 80}ms` }}>
            <span
              className={cn(
                "absolute -left-[13px] w-6 h-6 rounded-full border-4 bg-white flex items-center justify-center",
                color,
              )}
            >
              <Icon size={11} className="text-white" />
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-mistblue-400">{formatDateTime(log.timestamp)}</span>
              <span className="chip bg-cream-50 text-mistblue-500 border-cream-200">{log.operator}</span>
              {log.fromStatus && log.toStatus && log.fromStatus !== log.toStatus && (
                <span className="chip bg-milkgreen-50 text-milkgreen-600 border-milkgreen-200">
                  {statusLabel(log.fromStatus)} → {statusLabel(log.toStatus)}
                </span>
              )}
              {log.type === "duplicate_block" && (
                <span className="chip bg-coral-50 text-coral-500 border-coral-200">重复提交拦截</span>
              )}
              {log.type === "refresh_recover" && (
                <span className="chip bg-mistblue-200/40 text-mistblue-500 border-mistblue-200">刷新恢复</span>
              )}
              {log.type === "manual_create" && (
                <span className="chip bg-coral-50 text-coral-400 border-coral-200">手工补录</span>
              )}
            </div>
            <p className="mt-1.5 text-sm text-gray-700 leading-relaxed">{log.reason}</p>
          </li>
        );
      })}
    </ol>
  );
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    normal: "正常",
    abnormal: "异常",
    pending_review: "待复核",
    reviewed: "已复核",
  };
  return map[s] ?? s;
}
