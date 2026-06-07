import { AlertTriangle } from "lucide-react";
import type { DayMeals } from "@/types";
import { formatShortDate, mealLabel } from "@/utils/format";

interface Props {
  days: DayMeals[];
}

export default function MealTable({ days }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-medical-50/60">
            <th className="py-2.5 px-4 text-left font-medium text-gray-600 w-28">
            </th>
            <th className="py-2.5 px-4 text-left font-medium text-gray-600">早餐</th>
            <th className="py-2.5 px-4 text-left font-medium text-gray-600">午餐</th>
            <th className="py-2.5 px-4 text-left font-medium text-gray-600">晚餐</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
          <tr key={day.date} className="border-t border-gray-50">
              <td className="py-3 px-4 font-serif font-medium text-gray-700 align-top">
                {formatShortDate(day.date)}
              </td>
              {(["breakfast", "lunch", "dinner"] as const).map((meal) => {
                const item = day.meals.find((m) => m.meal === meal);
                if (!item) {
                  return (
                    <td key={meal} className="py-3 px-4 text-gray-300 text-gray-300">
                    </td>
                  );
                }
                return (
                  <td key={meal} className="py-3 px-4 align-top">
                    <div
                      className={`${
                        item.isAbnormal
                          ? "bg-orange-50 border border-orange-100 text-orange-800"
                          : "text-gray-700"
                      } rounded-lg px-3 py-2`}>
                      <div className="flex items-start gap-1.5">
                        {item.isAbnormal && (
                          <AlertTriangle
                            size={14}
                            className="mt-0.5 flex-shrink-0 text-status-abnormal"
                          />
                        )}
                        <div>
                          <div className="font-medium">{item.food}</div>
                          {item.remark && (
                            <div className="text-xs mt-0.5 text-gray-500 leading-relaxed">
                              {item.remark}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
