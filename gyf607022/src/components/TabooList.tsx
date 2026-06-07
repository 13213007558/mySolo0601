import { AlertTriangle, AlertCircle } from "lucide-react";
import type { TabooMatch } from "@/types";

export default function TabooList({ taboos }: { taboos: TabooMatch[] }) {
  if (!taboos || taboos.length === 0) {
    return (
      <div className="card p-5 bg-milkgreen-50/50 border-milkgreen-100">
        <div className="flex items-center gap-2 text-milkgreen-600">
          <AlertCircle size={18} />
          <span className="font-medium">未检测到任何辅食禁忌项</span>
        </div>
        <p className="text-sm text-mistblue-400 mt-1">当前三日食材清单均在安全范围内</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {taboos.map((t) => (
        <div
          key={t.id}
          className={
            t.severity === "danger"
              ? "card p-4 bg-coral-50/80 border-coral-200"
              : "card p-4 bg-orange-50/70 border-orange-200"
          }
        >
          <div className="flex items-start gap-3">
            <div
              className={
                t.severity === "danger"
                  ? "w-10 h-10 rounded-xl bg-coral-400 text-white flex items-center justify-center flex-shrink-0"
                  : "w-10 h-10 rounded-xl bg-orange-400 text-white flex items-center justify-center flex-shrink-0"
              }
            >
              <AlertTriangle size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-800">{t.ingredientName}</span>
                <span
                  className={
                    t.severity === "danger"
                      ? "chip bg-coral-100 text-coral-500 border-coral-300"
                      : "chip bg-orange-100 text-orange-500 border-orange-200"
                  }
                >
                  {t.severity === "danger" ? "高风险" : "中风险"}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{t.tabooReason}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
