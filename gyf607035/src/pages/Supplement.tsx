import { useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { SupplementForm } from "@/components/supplement/SupplementForm";
import { useAppStore } from "@/store/useAppStore";
import { UNIT_LABELS } from "@/types";
import { UserPlus2, FileText } from "lucide-react";
import { formatMoney } from "@/data/mockData";
import { StatusBadge } from "@/components/common/StatusBadge";

const SupplementPage = () => {
  const allRecords = useAppStore((s) => s.records);
  const supplemented = useMemo(
    () => allRecords.filter((r) => r.isSupplemented && !r.isInvalid),
    [allRecords]
  );

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-sm">
            <UserPlus2 className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl text-stone-900">手工补录</h1>
            <p className="text-sm text-stone-500 -mt-0.5">
              录入历史遗漏的核销记录，系统自动展示补录前后差异对比
            </p>
          </div>
        </div>

        <SupplementForm />

        {supplemented.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden animate-fade-in-up stagger-4">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-stone-500" />
              <h3 className="font-display text-base text-stone-900">
                已补录记录（{supplemented.length}条）
              </h3>
              <span className="text-[11px] text-stone-500">
                可点击顶部"核销工作台"进行后续核销处理
              </span>
            </div>
            <div className="divide-y divide-stone-100">
              {supplemented.map((r) => (
                <div key={r.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
                    <UserPlus2 className="w-4.5 h-4.5 text-accent-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-900">
                        {r.parentName} · {r.childName}
                      </span>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {r.courseName} · {r.quantity} {UNIT_LABELS[r.unit]} × {formatMoney(r.unitPrice)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-lg text-stone-900">
                      {formatMoney(r.amount)}
                    </div>
                    {r.remarkHistory[0] && (
                      <div className="text-[11px] text-stone-500 mt-0.5 max-w-xs truncate">
                        {r.remarkHistory[0].content}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SupplementPage;
