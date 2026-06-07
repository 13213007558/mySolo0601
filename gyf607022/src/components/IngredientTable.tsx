import type { Ingredient, TabooMatch } from "@/types";
import { Utensils, Sun, Sunset, Moon, Coffee, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const MEAL_ICON: Record<string, typeof Sun> = {
  早餐: Sun,
  午餐: Utensils,
  晚餐: Sunset,
  加餐: Coffee,
};

const MEAL_ORDER = ["早餐", "加餐", "午餐", "晚餐"];
const DAY_ORDER = ["Day1", "Day2", "Day3"];
const DAY_LABEL: Record<string, string> = { Day1: "第一天", Day2: "第二天", Day3: "第三天" };

export default function IngredientTable({ ingredients, taboos }: { ingredients: Ingredient[]; taboos: TabooMatch[] }) {
  const tabooNames = new Map(taboos.map((t) => [t.ingredientName, t]));
  return (
    <div className="space-y-4">
      {DAY_ORDER.map((day) => {
        const rows = MEAL_ORDER.map((meal) => ({
          meal,
          items: ingredients.filter((i) => i.day === day && i.meal === meal),
        })).filter((r) => r.items.length > 0);
        if (rows.length === 0) return null;
        return (
          <div key={day} className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-milkgreen-50 flex items-center justify-center text-milkgreen-500">
                <Moon size={15} />
              </div>
              <div className="font-serif font-semibold text-gray-800">{DAY_LABEL[day]}</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {rows.map((row) => {
                const Icon = MEAL_ICON[row.meal] ?? Utensils;
                return (
                  <div key={row.meal} className="rounded-xl border border-cream-100 bg-cream-50/60 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-mistblue-500 mb-2">
                      <Icon size={13} /> {row.meal}
                    </div>
                    <ul className="space-y-1.5">
                      {row.items.map((ing) => {
                        const taboo = tabooNames.get(ing.name);
                        return (
                          <li
                            key={ing.id}
                            className={cn(
                              "text-sm flex items-start gap-1.5",
                              taboo?.severity === "danger" && "text-coral-500 font-medium",
                              taboo?.severity === "warning" && "text-orange-500",
                              !taboo && "text-gray-700",
                            )}
                          >
                            {taboo?.severity === "danger" && <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />}
                            {taboo?.severity === "warning" && <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />}
                            {ing.name}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
