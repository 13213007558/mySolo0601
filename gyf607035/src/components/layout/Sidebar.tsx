import { useAppStore } from "@/store/useAppStore";
import { STEPS } from "@/types";
import { Check } from "lucide-react";

interface Props {
  onStepClick?: (step: number) => void;
}

export const Sidebar = ({ onStepClick }: Props) => {
  const { currentStep, activeRecordId } = useAppStore();
  const enabled = !!activeRecordId;

  return (
    <aside className="w-64 shrink-0 animate-fade-in-up stagger-2">
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
            <span className="text-sm font-bold text-brand-600">5</span>
          </div>
          <div>
            <h3 className="font-display text-lg text-stone-900">核销步骤</h3>
            <p className="text-[11px] text-stone-500">新人按步骤操作,不遗漏</p>
          </div>
        </div>

        <ol className="relative space-y-1 pl-1">
          {STEPS.map((s, idx) => {
            const done = s.id < currentStep;
            const active = s.id === currentStep;
            const clickable = enabled && onStepClick;
            return (
              <li key={s.id} className="relative">
                {idx < STEPS.length - 1 && (
                  <div
                    className={`absolute left-[15px] top-8 w-0.5 h-[calc(100%+4px)] ${
                      done ? "bg-brand-400" : "bg-stone-200"
                    }`}
                  />
                )}
                <button
                  disabled={!clickable}
                  onClick={() => clickable && onStepClick(s.id)}
                  className={`relative flex gap-3 w-full text-left py-2 pr-2 rounded-xl transition-all ${
                    clickable ? "hover:bg-stone-50 cursor-pointer" : "cursor-default"
                  } ${!enabled ? "opacity-50" : ""}`}
                >
                  <div
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      done
                        ? "bg-brand-500 text-white"
                        : active
                        ? "bg-brand-500 text-white ring-4 ring-brand-100 animate-pulse"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {done ? <Check className="w-4 h-4" /> : s.id}
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`text-sm font-medium ${
                        active ? "text-brand-700" : done ? "text-stone-700" : "text-stone-500"
                      }`}
                    >
                      {s.title}
                    </div>
                    <div className="text-[11px] text-stone-400 leading-snug mt-0.5">
                      {s.desc}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>

        {!enabled && (
          <div className="mt-5 rounded-xl bg-stone-50 border border-stone-200 px-3 py-2.5">
            <div className="text-[11px] text-stone-500 leading-relaxed">
              <span className="text-brand-600 font-medium">提示：</span>
              请先从右侧列表选择一条待核销记录
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
