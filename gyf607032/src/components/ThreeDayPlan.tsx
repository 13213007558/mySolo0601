import { AlertTriangle, UtensilsCrossed } from 'lucide-react';
import type { DayPlan, MealItem } from '@/types';

interface MealRowProps {
  label: string;
  meal: MealItem;
  warnings?: string[];
}

function MealRow({ label, meal, warnings }: MealRowProps) {
  const hasWarning = warnings && warnings.length > 0;
  return (
    <div className={`py-2.5 px-3 rounded-lg ${hasWarning ? 'bg-coral-50 border border-coral-100' : 'bg-slate-50'}`}>
      <div className="flex items-start gap-2">
        <span className="text-xs font-medium text-slate-500 w-10 shrink-0 mt-0.5">{label}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-slate-800 font-medium">
            {meal.name || '（未安排）'}
          </div>
          {meal.ingredients.length > 0 && (
            <div className="mt-0.5 text-xs text-slate-500">
              食材：{meal.ingredients.join('、')}
            </div>
          )}
          {meal.note && (
            <div className="mt-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded inline-block">
              📝 {meal.note}
            </div>
          )}
          {hasWarning && warnings!.map((w, i) => (
            <div key={i} className="mt-1 text-xs text-coral-600 flex items-center gap-1">
              <AlertTriangle size={11} />
              {w}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ThreeDayPlanProps {
  plan: DayPlan[];
  detectedIssues?: string[];
}

export default function ThreeDayPlan({ plan, detectedIssues = [] }: ThreeDayPlanProps) {
  const matchWarnings = (date: string, mealLabel: string): string[] => {
    return detectedIssues
      .filter((issue) => issue.startsWith(date) && issue.includes(mealLabel))
      .map((issue) => issue.split('：').slice(1).join('：'));
  };

  return (
    <div className="space-y-5">
      {plan.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          <UtensilsCrossed size={32} className="mx-auto mb-2 opacity-40" />
          暂无食材安排数据
        </div>
      ) : (
        plan.map((day) => (
          <div key={day.date} className="card p-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-mint-500 rounded-full" />
              {day.date}
            </h4>
            <div className="space-y-2">
              <MealRow label="早餐" meal={day.breakfast} warnings={matchWarnings(day.date, '早餐')} />
              <MealRow label="午餐" meal={day.lunch} warnings={matchWarnings(day.date, '午餐')} />
              <MealRow label="晚餐" meal={day.dinner} warnings={matchWarnings(day.date, '晚餐')} />
              <MealRow label="加餐" meal={day.snack} warnings={matchWarnings(day.date, '加餐')} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
