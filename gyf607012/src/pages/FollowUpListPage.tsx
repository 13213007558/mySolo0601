import { useEffect, useState } from "react";
import { Search, Plus, Download, RotateCcw, Stethoscope } from "lucide-react";
import { useFollowUpStore } from "@/store/useFollowUpStore";
import type { StatusFilter } from "@/types";
import RecordCard from "@/components/RecordCard";
import ManualEntryModal from "@/components/ManualEntryModal";
import ExportModal from "@/components/ExportModal";
import { buildExportSummary } from "@/utils/export";

const filterOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "abnormal", label: "异常" },
  { value: "revised", label: "已改判" },
  { value: "manual", label: "手工补录" },
  { value: "normal", label: "正常" },
];

export default function FollowUpListPage() {
  const {
    initFromStorage,
    getFilteredRecords,
    statusFilter,
    setStatusFilter,
    searchKeyword,
    setSearchKeyword,
    addManualRecord,
    resetToMock,
  } = useFollowUpStore();

  const [showManual, setShowManual] = useState(false);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  const records = getFilteredRecords();

  const exportSummary = buildExportSummary(records);

  const abnormalCount = records.filter((r) => r.status === "abnormal").length;

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-medical-700 flex items-center justify-center text-white shadow-sm">
                <Stethoscope size={20} />
              </div>
              <div>
                <h1 className="font-serif text-xl font-semibold text-gray-800 leading-tight">
                  婴幼儿辅食禁忌授权库
                </h1>
                <p className="text-xs text-gray-500">儿保随访版 · 社区儿保护士工作台</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (confirm("确认重置为初始样例数据？您的操作将被清除。")) {
                    resetToMock();
                  }
                }}
                className="btn-secondary !px-3 !py-2"
                title="重置为初始样例">
                <RotateCcw size={15} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-4">
            <div className="text-xs text-gray-500">随访记录总数</div>
            <div className="mt-1 text-2xl font-serif font-semibold text-gray-800">
              {records.length}
            </div>
          </div>
          <div className="card p-4 border-l-4 border-status-abnormal">
            <div className="text-xs text-gray-500">待处理异常</div>
            <div className="mt-1 text-2xl font-serif font-semibold text-status-abnormal">
              {abnormalCount}
            </div>
          </div>
          <div className="card p-4 border-l-4 border-status-revised">
            <div className="text-xs text-gray-500">人工改判</div>
            <div className="mt-1 text-2xl font-serif font-semibold text-status-revised">
              {records.filter((r) => r.status === "revised").length}
            </div>
          </div>
          <div className="card p-4 border-l-4 border-status-manual">
            <div className="text-xs text-gray-500">手工补录</div>
            <div className="mt-1 text-2xl font-serif font-semibold text-status-manual">
              {records.filter((r) => r.isManualEntry).length}
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1.5">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === opt.value
                      ? "bg-medical-700 text-white shadow-sm"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex-1 min-w-[200px] ml-auto">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜索婴幼儿姓名或家长备注..."
                  className="input pl-9"
                />
              </div>
            </div>

            <button
              onClick={() => setShowManual(true)}
              className="btn-primary">
              <Plus size={16} />
              手工补录
            </button>
            <button
              onClick={() => setShowExport(true)}
              className="btn-secondary">
              <Download size={16} />
              导出摘要
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {records.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-gray-400 mb-2">暂无匹配的随访记录</div>
              <p className="text-xs text-gray-400">尝试切换筛选条件或搜索关键词</p>
            </div>
          ) : (
            records.map((r) => <RecordCard key={r.id} record={r} />)
          )}
        </div>

        <p className="text-center text-xs text-gray-400 pt-4 pb-8">
          记录按随访日期倒序排列 · 人工改判将保留旧值和理由于变更历史
        </p>
      </main>

      <ManualEntryModal
        open={showManual}
        onClose={() => setShowManual(false)}
        onSubmit={(params) => addManualRecord(params)}
      />
      <ExportModal
        open={showExport}
        onClose={() => setShowExport(false)}
        summary={exportSummary}
      />
    </div>
  );
}
