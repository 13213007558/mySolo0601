import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BalanceCard } from "@/components/balance/BalanceCard";
import { RecordList } from "@/components/records/RecordList";
import { VerifyFlow } from "@/components/verify/VerifyFlow";
import type { VerifyRecord } from "@/types";

const WorkbenchPage = () => {
  const setActiveRecord = useAppStore((s) => s.setActiveRecord);
  const setCurrentStep = useAppStore((s) => s.setCurrentStep);
  const activeRecordId = useAppStore((s) => s.activeRecordId);
  const allRecords = useAppStore((s) => s.records);
  const records = useMemo(
    () => allRecords.filter((r) => !r.isInvalid),
    [allRecords]
  );
  const active = useMemo(
    () => records.find((r) => r.id === activeRecordId),
    [records, activeRecordId]
  );

  const handleSelect = (rec: VerifyRecord) => {
    setActiveRecord(rec.id);
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-4 space-y-5">
            <BalanceCard />
            <Sidebar onStepClick={setCurrentStep} />
          </div>

          <div className="xl:col-span-8 flex flex-col gap-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <RecordList onSelect={handleSelect} />
            </div>

            <VerifyFlow />
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white/50 p-5">
          <div className="text-xs text-stone-500 leading-relaxed">
            <strong className="text-stone-700">💡 操作指引（新人按此流程操作）：</strong>
            ① 从右侧列表选择一条"待核销"记录 → ② 按左侧 5 步引导依次核对信息、确认数量单位、检查边界值标记、补充备注 → ③ 点击"确认核销"。
            遇到单位混用系统会自动标为"部分核销"；遇到边界值按正常处理也会保留审计日志供主管复查。
            {active && (
              <span className="ml-1 text-brand-700">
                当前已选中 <strong>{active.parentName}</strong> 的核销记录
              </span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkbenchPage;
