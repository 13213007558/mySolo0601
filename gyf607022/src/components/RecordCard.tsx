import { useNavigate } from "react-router-dom";
import { Baby, Phone, CalendarDays, AlertOctagon, Hand } from "lucide-react";
import StatusBadge from "./StatusBadge";
import type { CheckRecord } from "@/types";
import { maskPhone, formatDateTime } from "@/utils/id";
import { cn } from "@/lib/utils";

const BAR_COLOR: Record<string, string> = {
  normal: "bg-milkgreen-400",
  abnormal: "bg-coral-400",
  pending_review: "bg-mistblue-400",
  reviewed: "bg-mistblue-200",
};

export default function RecordCard({ record, index }: { record: CheckRecord; index: number }) {
  const nav = useNavigate();
  const bar = BAR_COLOR[record.status] ?? "bg-gray-300";
  return (
    <div
      onClick={() => nav(`/record/${record.id}`)}
      className={cn(
        "card p-5 cursor-pointer relative pl-6 transition-all hover:shadow-md hover:-translate-y-0.5 animate-fade-in-up",
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className={cn("absolute left-0 top-4 bottom-4 w-1 rounded-r", bar)} />
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-gray-800 font-semibold">
              <Baby size={16} className="text-milkgreen-500" />
              {record.babyName}
              <span className="text-sm font-normal text-mistblue-500">· {record.babyMonthAge} 月龄</span>
            </div>
            <StatusBadge status={record.status} />
            {record.source === "manual" && (
              <span className="chip bg-cream-100 text-cream-500 border-cream-200">
                <Hand size={12} /> 手工补录
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-mistblue-500">
            <div className="flex items-center gap-1.5">
              <Phone size={14} /> {record.parentName} · {maskPhone(record.parentPhone)}
            </div>
            <div className="flex items-center gap-1.5">
              <CalendarDays size={14} /> 对账日：{record.checkDate} · 更新于 {formatDateTime(record.updatedAt)}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-mistblue-400 mb-1">禁忌匹配</div>
          <div
            className={cn(
              "text-2xl font-serif font-semibold",
              record.taboos.length === 0 ? "text-milkgreen-500" : "text-coral-500",
            )}
          >
            {record.taboos.length === 0 ? (
              <span className="flex items-center gap-1 text-lg justify-end">
                0 <span className="text-xs font-normal">条</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 justify-end">
                <AlertOctagon size={18} />
                {record.taboos.length}
                <span className="text-xs font-normal">条</span>
              </span>
            )}
          </div>
          <div className="text-xs text-mistblue-400 mt-1">{record.submitMethod}</div>
        </div>
      </div>
    </div>
  );
}
