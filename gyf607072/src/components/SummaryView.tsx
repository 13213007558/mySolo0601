import { useStore } from "@/store/useStore";
import type { FoodRecord } from "@/types";
import { cn, statusBadgeClass, statusText } from "@/utils/uiHelpers";

interface Props {
  record: FoodRecord;
}

export default function SummaryView({ record }: Props) {
  const currentRole = useStore((s) => s.currentRole);
  if (currentRole !== "elder") return null;

  const tabooItems = record.ingredients.filter((i) => i.isTaboo);

  return (
    <div className="card-base p-6 bg-gradient-to-br from-cream-50 to-white animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="font-display text-2xl font-bold text-ink-800 mb-1">
          {record.dateLabel} {record.mealPeriodLabel}
        </h2>
        <span className={cn("chip text-sm px-3 py-1", statusBadgeClass(record.status))}>
          {statusText(record.status)}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-display font-semibold text-ink-800 mb-2">🍽 吃了什么</h3>
          <div className="flex flex-wrap gap-2">
            {record.ingredients.map((i) => (
              <span
                key={i.id}
                className={cn(
                  "text-lg px-3 py-1.5 rounded-full",
                  i.isTaboo
                    ? "bg-baby-100 text-baby-500 line-through"
                    : "bg-sage-100 text-sage-700"
                )}
              >
                {i.emoji} {i.name}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-display font-semibold text-ink-800 mb-2">💡 结论</h3>
          <div className="bg-cream-100 rounded-xl2 p-4">
            {tabooItems.length === 0 ? (
              <p className="text-lg text-sage-700 font-medium">
                ✓ 这一顿没有问题，可以放心。
              </p>
            ) : (
              <div className="space-y-1">
                <p className="text-lg text-baby-500 font-medium">
                  ⚠ 有 {tabooItems.length} 样需要注意：
                </p>
                <ul className="list-disc pl-6 text-ink-700 space-y-0.5">
                  {tabooItems.map((i) => (
                    <li key={i.id} className="text-base">{i.name}：{i.tabooReason}</li>
                  ))}
                </ul>
                <p className="text-sm text-sunset-500 pt-1">爸爸妈妈已经看过了，请放心。</p>
              </div>
            )}
          </div>
        </div>

        {record.parentNote && (
          <div className="bg-baby-50 border border-baby-100 rounded-xl2 p-4">
            <h3 className="text-base font-display font-semibold text-baby-500 mb-1">💬 沐沐妈妈说</h3>
            <p className="text-ink-700">{record.parentNote}</p>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-ink-700/40 mt-6 pt-4 border-t border-cream-200">
        老人视图 · 仅展示关键信息
      </p>
    </div>
  );
}
