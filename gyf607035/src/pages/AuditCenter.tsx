import { useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { AuditLogTable } from "@/components/audit/AuditLogTable";
import { BoundaryReviewPanel } from "@/components/audit/BoundaryReviewPanel";
import { ConsistencyCheck } from "@/components/audit/ConsistencyCheck";
import { useAppStore } from "@/store/useAppStore";
import { Navigate } from "react-router-dom";
import { ShieldCheck, FileDown, RefreshCcw } from "lucide-react";
import { useState } from "react";

const AuditCenterPage = () => {
  const role = useAppStore((s) => s.currentRole);
  const importRecords = useAppStore((s) => s.importRecords);
  const allRecords = useAppStore((s) => s.records);
  const invalidRecords = useMemo(
    () => allRecords.filter((r) => r.isInvalid),
    [allRecords]
  );
  const [toast, setToast] = useState<string | null>(null);

  if (role !== "supervisor") {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-md mx-auto mt-32 text-center px-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-danger-50 flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-danger-500" />
          </div>
          <h2 className="mt-5 font-display text-2xl text-stone-900">无权限访问</h2>
          <p className="text-sm text-stone-500 mt-2 leading-relaxed">
            审计中心仅主管角色可查看。请在右上角切换为"主管"角色后重试。
          </p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  const simulateImport = () => {
    const batchId = "batch_sample_001";
    const existing = invalidRecords.filter((r) => r.importBatchId === batchId);
    const res = importRecords(batchId, [
      {
        id: "sim_" + Date.now(),
        parentName: "导入演示-孙女士",
        childName: "小禾",
        childAge: "4岁",
        courseName: "乐高搭建课(导入样例)",
        quantity: 4,
        unit: "section",
        unitMixed: false,
        isBoundaryValue: false,
        unitPrice: 250,
        amount: 1000,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "系统导入",
        isImported: true,
        importBatchId: batchId,
        isInvalid: false,
        isSupplemented: false,
        remarkHistory: [],
        auditLogs: [],
      },
    ]);
    setToast(
      `重新导入批次 ${batchId}：新增 ${res.added} 条，旧批次 ${res.invalidated + existing.length} 条已自动失效（历史仍可追溯）`
    );
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-[1400px] mx-auto px-6 py-6">
        {toast && (
          <div className="fixed top-20 right-6 z-50 max-w-md bg-stone-900 text-white text-sm rounded-2xl shadow-xl px-4 py-3 animate-scale-in flex items-start gap-2">
            <FileDown className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="leading-relaxed">{toast}</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl text-stone-900">审计中心</h1>
              <p className="text-sm text-stone-500 -mt-0.5">
                主管视图 · 完整审计日志、边界值复核、数据口径一致性校验
              </p>
            </div>
          </div>
          <button
            onClick={simulateImport}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition"
          >
            <RefreshCcw className="w-4 h-4" />
            模拟重新导入样例数据
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          <div className="xl:col-span-3 space-y-5">
            <AuditLogTable />
          </div>
          <div className="xl:col-span-2 space-y-5">
            <ConsistencyCheck />
            <BoundaryReviewPanel />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuditCenterPage;
