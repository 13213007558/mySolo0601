import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { VerifyRecord } from "@/types";
import { UNIT_LABELS } from "@/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AlertTriangle, UserPlus2, FileWarning, ArrowRight } from "lucide-react";
import { formatDateTime, formatMoney } from "@/data/mockData";

interface Props {
  onSelect: (rec: VerifyRecord) => void;
}

export const RecordList = ({ onSelect }: Props) => {
  const allRecords = useAppStore((s) => s.records);
  const activeId = useAppStore((s) => s.activeRecordId);
  const records = useMemo(
    () => allRecords.filter((r) => !r.isInvalid),
    [allRecords]
  );

  const sorted = [...records].sort(
    (a, b) =>
      (a.status === "pending" ? 0 : 1) - (b.status === "pending" ? 0 : 1) ||
      (b.createdAt < a.createdAt ? -1 : 1)
  );

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden animate-fade-in-up stagger-3">
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
        <div>
          <h3 className="font-display text-lg text-stone-900">待处理核销记录</h3>
          <p className="text-[11px] text-stone-500 mt-0.5">
            共 {sorted.length} 条 · 待核销 {sorted.filter((r) => r.status === "pending").length} 条
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>边界值</span>
          <span className="w-2 h-2 rounded-full bg-accent-500 ml-2" />
          <span>手工补录</span>
        </div>
      </div>

      <div className="divide-y divide-stone-100 max-h-[520px] overflow-y-auto">
        {sorted.map((r, idx) => (
          <button
            key={r.id}
            onClick={() => onSelect(r)}
            style={{ animationDelay: `${idx * 50}ms` }}
            className={`w-full text-left px-5 py-3.5 flex items-center gap-4 group transition-all hover:bg-brand-50/40 ${
              activeId === r.id
                ? "bg-brand-50 border-l-4 border-l-brand-500"
                : "border-l-4 border-l-transparent"
            }`}
          >
            <div className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center text-lg font-display text-stone-600">
              {r.parentName.slice(0, 1)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-stone-900 truncate">
                  {r.parentName} · {r.childName}
                </span>
                {r.isBoundaryValue && !r.boundaryAudited && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5 font-medium">
                    <AlertTriangle className="w-3 h-3" />
                    边界值
                  </span>
                )}
                {r.boundaryAudited && (
                  <span className="text-[10px] text-brand-700 bg-brand-50 border border-brand-200 rounded-full px-1.5 py-0.5 font-medium">
                    已复核
                  </span>
                )}
                {r.unitMixed && (
                  <span className="text-[10px] text-accent-700 bg-accent-50 border border-accent-200 rounded-full px-1.5 py-0.5 font-medium">
                    单位混用
                  </span>
                )}
                {r.isSupplemented && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-accent-600 bg-accent-50 border border-accent-200 rounded-full px-1.5 py-0.5 font-medium">
                    <UserPlus2 className="w-3 h-3" />
                    手工补录
                  </span>
                )}
              </div>
              <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
                <span>{r.courseName}</span>
                <span className="text-stone-300">·</span>
                <span>
                  {r.quantity} {UNIT_LABELS[r.unit]} × {formatMoney(r.unitPrice)}
                </span>
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5">
                创建于 {formatDateTime(r.createdAt)} · {r.createdBy}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-base font-semibold text-stone-900">
                {formatMoney(r.amount)}
              </div>
              <div className="mt-1.5">
                <StatusBadge status={r.status} />
              </div>
            </div>

            <ArrowRight
              className={`w-4 h-4 shrink-0 transition-transform ${
                activeId === r.id ? "text-brand-600 translate-x-0" : "text-stone-300 -translate-x-1 group-hover:translate-x-0"
              }`}
            />
          </button>
        ))}
        {sorted.length === 0 && (
          <div className="px-6 py-10 text-center">
            <FileWarning className="w-10 h-10 mx-auto text-stone-300" />
            <p className="text-sm text-stone-500 mt-2">暂无核销记录</p>
          </div>
        )}
      </div>
    </div>
  );
};
