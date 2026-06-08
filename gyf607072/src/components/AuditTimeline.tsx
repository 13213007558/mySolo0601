import { User, AlertTriangle, Bot, CheckCircle2 } from "lucide-react";
import type { AuditLog } from "@/types";
import { cn } from "@/utils/uiHelpers";

interface Props {
  logs: AuditLog[];
}

function getIcon(action: string) {
  if (action.includes("auto") || action.includes("flag")) return Bot;
  if (action.includes("review") || action.includes("close") || action.includes("confirm")) return CheckCircle2;
  if (action.includes("edit")) return AlertTriangle;
  return User;
}

function getDotColor(log: AuditLog) {
  if (log.handlerMissing) return "bg-gray-300";
  if (log.action.includes("flag") || log.action.includes("abnormal")) return "bg-baby-300";
  if (log.action.includes("review") || log.action.includes("edit")) return "bg-sunset-300";
  if (log.action.includes("confirm") || log.action.includes("close")) return "bg-sage-300";
  return "bg-cream-200";
}

export default function AuditTimeline({ logs }: Props) {
  return (
    <div className="space-y-0">
      <h4 className="font-display font-semibold text-ink-800 mb-4 flex items-center gap-2">
        <User size={16} className="text-sage-500" />
        审计时间线
      </h4>
      <div className="relative pl-1">
        <div className="absolute left-[11px] top-1 bottom-1 w-px bg-cream-200" />
        {logs.map((log, idx) => {
          const Icon = getIcon(log.action);
          const isLast = idx === logs.length - 1;
          return (
            <div key={log.id} className={cn("relative pl-8 pb-5", isLast && "pb-0")}>
              <div
                className={cn(
                  "absolute left-0 top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white",
                  getDotColor(log),
                  log.handlerMissing && "border-dashed border-gray-300 bg-white"
                )}
              >
                <Icon size={12} className={cn(
                  log.handlerMissing ? "text-gray-400" : "text-white"
                )} />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-medium text-ink-800 text-sm">{log.actionLabel}</span>
                  <span className="text-xs text-ink-700/50">{log.timestamp}</span>
                </div>

                {log.handlerMissing ? (
                  <p className="text-xs text-gray-400 italic mt-1 flex items-center gap-1">
                    <AlertTriangle size={10} />
                    处理人信息不可用：{log.handlerMissingReason || "未知原因"}
                  </p>
                ) : (
                  <p className="text-xs text-ink-700/70 mt-1">
                    处理人：<span className="font-medium text-ink-700">{log.operatorName}</span>
                  </p>
                )}

                {log.reason && (
                  <p className="text-xs text-sunset-500 mt-1 bg-sunset-100/50 inline-block px-2 py-0.5 rounded">
                    原因：{log.reason}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
