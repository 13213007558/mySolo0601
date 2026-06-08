import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Ingredient } from "@/types";
import { cn } from "@/utils/uiHelpers";

const severityText: Record<string, string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
};

const severityClass: Record<string, string> = {
  low: "bg-sunset-100 text-sunset-500",
  medium: "bg-sunset-100 text-sunset-500",
  high: "bg-baby-100 text-baby-500",
};

export default function IngredientList({ ingredients }: { ingredients: Ingredient[] }) {
  return (
    <div className="space-y-2">
      {ingredients.map((ing) => (
        <div
          key={ing.id}
          className={cn(
            "flex items-start gap-3 p-3 rounded-xl2 border",
            ing.isTaboo
              ? "bg-baby-50 border-baby-100"
              : "bg-white border-cream-200"
          )}
        >
          <div className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-lg",
            ing.isTaboo ? "bg-baby-100" : "bg-sage-100"
          )}>
            {ing.emoji || "🍽"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-ink-800">{ing.name}</span>
              <span className="text-xs text-ink-700/50">{ing.category}</span>
              {ing.isTaboo ? (
                <span className={cn("chip", severityClass[ing.severity || "medium"])}>
                  <AlertTriangle size={10} />
                  {severityText[ing.severity || "medium"]}
                </span>
              ) : (
                <span className="chip bg-sage-100 text-sage-700">
                  <CheckCircle2 size={10} />
                  安全
                </span>
              )}
            </div>

            {ing.isTaboo && (
              <div className="mt-2 space-y-1">
                {ing.tabooReason && (
                  <p className="text-xs text-baby-500">
                    禁忌原因：{ing.tabooReason}
                  </p>
                )}
                {ing.suggestion && (
                  <p className="text-xs text-sunset-500 bg-sunset-100/50 px-2 py-1 rounded inline-block">
                    建议：{ing.suggestion}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
