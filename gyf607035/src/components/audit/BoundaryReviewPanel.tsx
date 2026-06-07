import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { UNIT_LABELS } from "@/types";
import {
  AlertTriangle,
  ShieldCheck,
  Check,
  User,
} from "lucide-react";
import { formatDateTime, formatMoney } from "@/data/mockData";
import { StatusBadge } from "@/components/common/StatusBadge";

export const BoundaryReviewPanel = () => {
  const allRecords = useAppStore((s) => s.records);
  const boundaryRecords = useMemo(
    () => allRecords.filter((r) => r.isBoundaryValue && !r.isInvalid),
    [allRecords]
  );
  const markAudited = useAppStore((s) => s.markBoundaryAudited);
  const currentUser = useAppStore((s) => s.currentUser);

  const pending = boundaryRecords.filter((r) => !r.boundaryAudited);
  const done = boundaryRecords.filter((r) => r.boundaryAudited);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg text-stone-900">边界值复核</h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              被标记为边界值的记录，即使按正常核销处理也会保留在此供主管复查
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium">
              待复核 {pending.length}
            </span>
            <span className="px-2 py-1 rounded-lg bg-brand-50 text-brand-700 border border-brand-200 text-xs font-medium">
              已复核 {done.length}
            </span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-stone-100 max-h-[440px] overflow-y-auto">
        {boundaryRecords.length === 0 && (
          <div className="py-10 text-center text-sm text-stone-500">
            暂无边界值记录
          </div>
        )}
        {boundaryRecords.map((r) => (
          <div
            key={r.id}
            className={`p-4 ${
              r.boundaryAudited ? "bg-white" : "bg-amber-50/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
                  r.boundaryAudited
                    ? "bg-brand-100"
                    : "bg-amber-100 animate-pulse"
                }`}
              >
                {r.boundaryAudited ? (
                  <ShieldCheck className="w-5 h-5 text-brand-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-stone-900">
                    {r.parentName} · {r.childName}
                  </span>
                  <StatusBadge status={r.status} />
                </div>
                <div className="text-xs text-stone-500 mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                  <span>{r.courseName}</span>
                  <span>数量 {r.quantity} {UNIT_LABELS[r.unit]}（临界值）</span>
                  <span>金额 {formatMoney(r.amount)}</span>
                  <span>创建人 {r.createdBy}</span>
                </div>
                {r.boundaryAudited ? (
                  <div className="mt-2 text-xs inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-brand-50 text-brand-700 border border-brand-100">
                    <Check className="w-3.5 h-3.5" />
                    已由 <strong>{r.boundaryAuditedBy}</strong> 于 {formatDateTime(r.boundaryAuditedAt!)} 复核
                  </div>
                ) : (
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      onClick={() => markAudited(r.id, "主管复核通过")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white text-xs font-semibold shadow-sm hover:shadow-md transition"
                    >
                      <User className="w-3.5 h-3.5" />
                      标记已复核（{currentUser}）
                    </button>
                    <span className="text-[11px] text-stone-500">
                      复核后该记录不再出现在预警中
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
