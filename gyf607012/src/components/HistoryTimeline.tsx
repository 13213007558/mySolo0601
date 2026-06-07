import { History, ArrowRight, User, Clock } from "lucide-react";
import type { HistoryEntry } from "@/types";
import { formatDateTime } from "@/utils/format";

interface Props {
  history: HistoryEntry[];
}

export default function HistoryTimeline({ history }: Props) {
  const sorted = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-0">
      {sorted.map((entry, idx) => (
        <div key={entry.id} className="relative pl-8 pb-6 last:pb-0">
          {idx !== sorted.length - 1 && (
            <div className="absolute left-[11px] top-6 bottom-0 w-px bg-gray-200" />
          )}
          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-medical-200 flex items-center justify-center">
            <History size={11} className="text-medical-600" />
          </div>
          <div className="card p-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-2">
              <span className="inline-flex items-center gap-1">
                <User size={12} /> {entry.operator}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={12} /> {formatDateTime(entry.timestamp)}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">
                {entry.fieldLabel}
              </span>
              <span className="mx-2 inline-flex items-center gap-1 text-gray-400">
                <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600 text-xs">
                  {entry.oldValue}
                </span>
                <ArrowRight size={12} />
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    entry.field === "status" || entry.field === "recordStatus"
                      ? "bg-medical-50 text-medical-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                  {entry.newValue}
                </span>
              </span>
            </div>
            {entry.reason && (
              <blockquote className="mt-2.5 border-l-2 border-medical-300 pl-3 text-sm text-gray-600 bg-gray-50 py-2 pr-3 italic leading-relaxed">
                {entry.reason}
              </blockquote>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
