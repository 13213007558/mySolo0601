import { useStore } from "@/store/useStore";
import { cn, statusText } from "@/utils/uiHelpers";
import type { RecordStatus } from "@/types";

const filters: { key: RecordStatus | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "normal", label: statusText("normal") },
  { key: "abnormal", label: statusText("abnormal") },
  { key: "pending_review", label: statusText("pending_review") },
  { key: "manually_edited", label: statusText("manually_edited") },
];

export default function StatusFilterTabs() {
  const activeFilter = useStore((s) => s.activeFilter);
  const setFilter = useStore((s) => s.setFilter);
  const records = useStore((s) => s.records);

  const getCount = (key: RecordStatus | "all") => {
    if (key === "all") return records.filter((r) => r.status !== "invalid").length;
    return records.filter((r) => r.status === key).length;
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map((f) => {
        const count = getCount(f.key);
        const isActive = activeFilter === f.key;
        return (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "chip transition-all duration-200 px-3 py-1.5",
              isActive
                ? "bg-ink-800 text-white shadow-sm"
                : "bg-white text-ink-700 hover:bg-cream-100"
            )}
          >
            <span>{f.label}</span>
            <span className={cn(
              "ml-1 px-1.5 py-0.5 rounded-full text-[10px]",
              isActive ? "bg-white/20 text-white" : "bg-cream-200 text-ink-700"
            )}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
