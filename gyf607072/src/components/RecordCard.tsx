import { useNavigate } from "react-router-dom";
import { Clock, User, ChevronRight } from "lucide-react";
import type { FoodRecord } from "@/types";
import { cn, statusBadgeClass, statusText } from "@/utils/uiHelpers";
import { useStore } from "@/store/useStore";

interface Props {
  record: FoodRecord;
}

export default function RecordCard({ record }: Props) {
  const navigate = useNavigate();
  const currentRole = useStore((s) => s.currentRole);

  const isInvalid = record.status === "invalid";

  const tabooItems = record.ingredients.filter((i) => i.isTaboo);

  return (
    <div
      onClick={() => !isInvalid && navigate(`/record/${record.id}`)}
      className={cn(
        "card-base p-4 cursor-pointer animate-fade-in relative overflow-hidden",
        isInvalid && "opacity-40 pointer-events-none grayscale"
      )}
    >
      {record.supplements.some((s) => s.addedAfterClose) && (
        <div className="absolute top-0 right-0 w-3 h-3 bg-sunset-300 rotate-45 translate-x-1.5 -translate-y-1.5" />
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-display font-bold text-lg text-ink-800">{record.mealPeriodLabel}</span>
          <span className="text-sm text-ink-700/60">{record.dateLabel}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn("chip", statusBadgeClass(record.status))}>
            {statusText(record.status)}
          </span>
          {tabooItems.length > 0 && currentRole !== "elder" && (
            <span className="chip bg-baby-100 text-baby-500">
              {tabooItems.length} 项禁忌
            </span>
          )}
          {record.manualEdit && (
            <span className="chip bg-cream-200 text-ink-700">含补录</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {record.ingredients.length === 0 ? (
          <span className="text-sm text-gray-400 italic">无有效食材数据</span>
        ) : (
          record.ingredients.map((ing) => (
            <span
              key={ing.id}
              className={cn(
                "chip text-sm",
                ing.isTaboo
                  ? "bg-baby-100 text-baby-500 line-through decoration-2"
                  : "bg-cream-100 text-ink-700"
              )}
            >
              {ing.emoji} {ing.name}
            </span>
          ))
        )}
      </div>

      {currentRole !== "elder" && (
        <div className="flex items-center justify-between pt-2 border-t border-cream-200">
          <div className="flex items-center gap-4 text-xs text-ink-700/60">
            <span className="flex items-center gap-1">
              <User size={12} />
              {record.handlerName}
            </span>
            {record.auditLogs.length > 0 && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {record.auditLogs[record.auditLogs.length - 1].timestamp.split(" ")[1]}
              </span>
            )}
          </div>
          <ChevronRight size={16} className="text-ink-700/30" />
        </div>
      )}
    </div>
  );
}
