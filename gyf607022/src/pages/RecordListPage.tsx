import { useState } from "react";
import {
  Baby,
  Search,
  Download,
  FilePlus,
  CheckCircle2,
  AlertTriangle,
  Search as SearchIcon,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { useRecordStore } from "@/store/useRecordStore";
import RecordCard from "@/components/RecordCard";
import StatsCard from "@/components/StatsCard";
import ManualEntryModal from "@/components/ManualEntryModal";
import { buildExportSummary, downloadSummary } from "@/utils/export";
import { useNavigate } from "react-router-dom";

export default function RecordListPage() {
  const filterPhone = useRecordStore((s) => s.filterPhone);
  const setFilterPhone = useRecordStore((s) => s.setFilterPhone);
  const getFilteredRecords = useRecordStore((s) => s.getFilteredRecords);
  const addManualRecord = useRecordStore((s) => s.addManualRecord);
  const resetToMock = useRecordStore((s) => s.resetToMock);
  const corruptedIds = useRecordStore((s) => s.corruptedIds);
  const nav = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const filtered = getFilteredRecords();

  const counts = {
    total: filtered.length,
    normal: filtered.filter((r) => r.status === "normal").length,
    abnormal: filtered.filter((r) => r.status === "abnormal").length,
    pending: filtered.filter((r) => r.status === "pending_review").length,
    reviewed: filtered.filter((r) => r.status === "reviewed").length,
    manual: filtered.filter((r) => r.source === "manual").length,
  };

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2800);
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      showToast("err", "当前筛选结果为空，无法导出");
      return;
    }
    const content = buildExportSummary(filtered);
    const filename = `辅食禁忌对账摘要_${new Date().toISOString().slice(0, 10)}.txt`;
    downloadSummary(filename, content);
    showToast("ok", `已导出 ${filtered.length} 条记录（页面与导出条数一致）`);
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 bg-cream-50/85 backdrop-blur border-b border-cream-100">
        <div className="container px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => nav("/")}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-milkgreen-400 to-milkgreen-500 text-white flex items-center justify-center shadow-soft">
              <Baby size={22} />
            </div>
            <div>
              <h1 className="font-serif text-xl font-semibold text-gray-800 leading-tight">
                婴幼儿辅食禁忌对账台
              </h1>
              <div className="text-xs text-mistblue-400">门店售后版</div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mistblue-400" />
              <input
                type="text"
                placeholder="按家长手机号筛选……"
                className="input-field !pl-9 !py-2 !w-60"
                value={filterPhone}
                onChange={(e) => setFilterPhone(e.target.value)}
              />
            </div>
            <button onClick={() => setModalOpen(true)} className="btn-secondary">
              <FilePlus size={16} />
              手工补录
            </button>
            <button onClick={handleExport} className="btn-primary">
              <Download size={16} />
              导出摘要
              <span className="bg-white/25 px-2 py-0.5 rounded-full text-xs">{counts.total}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container px-6 pt-6">
        {filterPhone && (
          <div className="mb-4 flex items-center gap-2 text-sm text-mistblue-500 flex-wrap">
            <SearchIcon size={14} />
            当前筛选条件：手机号包含「{filterPhone}」，共 {counts.total} 条记录
            <button
              onClick={() => setFilterPhone("")}
              className="text-milkgreen-500 hover:text-milkgreen-600 underline underline-offset-2"
            >
              清除筛选
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            label="正常"
            value={counts.normal}
            icon={<CheckCircle2 size={22} />}
            gradient="bg-gradient-to-br from-milkgreen-50 to-transparent"
          />
          <StatsCard
            label="异常"
            value={counts.abnormal}
            icon={<AlertTriangle size={22} />}
            gradient="bg-gradient-to-br from-coral-50 to-transparent"
          />
          <StatsCard
            label="待复核"
            value={counts.pending}
            icon={<SearchIcon size={22} />}
            gradient="bg-gradient-to-br from-cream-100 to-transparent"
          />
          <StatsCard
            label="已复核"
            value={counts.reviewed}
            icon={<ShieldCheck size={22} />}
            gradient="bg-gradient-to-br from-mistblue-200/40 to-transparent"
          />
        </div>

        {counts.manual > 0 && (
          <div className="mb-4 card p-4 bg-coral-50/50 border-coral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FilePlus size={18} className="text-coral-400" />
              <div>
                <span className="text-sm font-medium text-gray-800">含 {counts.manual} 条手工补录记录</span>
                <span className="text-xs text-mistblue-400 ml-2">可与系统导入记录对比差异</span>
              </div>
            </div>
            <div className="chip bg-coral-100 text-coral-500 border-coral-200">手工补录</div>
          </div>
        )}

        {corruptedIds.length > 0 && (
          <div className="mb-4 card p-4 bg-coral-50 border-coral-200">
            <div className="text-sm text-coral-600">
              ⚠️ 检测到 {corruptedIds.length} 条记录数据损坏，已自动从列表隔离，未污染正常记录。
            </div>
          </div>
        )}

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="card p-16 text-center">
              <div className="font-serif text-lg text-mistblue-500">暂无对账记录</div>
              <div className="text-sm text-mistblue-400 mt-1">请点击右上角「手工补录」创建第一条记录</div>
              <button onClick={resetToMock} className="btn-secondary mt-4">
                <RotateCcw size={14} /> 恢复内置样例数据
              </button>
            </div>
          ) : (
            filtered.map((r, i) => <RecordCard key={r.id} record={r} index={i} />)
          )}
        </div>
      </main>

      <ManualEntryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => {
          const res = addManualRecord(data);
          if (!res.ok) {
            showToast("err", res.error ?? "提交失败");
            return res;
          }
          showToast("ok", "补录成功，已生成对账记录");
          if (res.recordId) {
            setTimeout(() => nav(`/record/${res.recordId}`), 600);
          }
          return res;
        }}
      />

      {toast && (
        <div
          className={
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full shadow-lg animate-fade-in-up text-sm font-medium " +
            (toast.type === "ok" ? "bg-milkgreen-500 text-white" : "bg-coral-500 text-white")
          }
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
