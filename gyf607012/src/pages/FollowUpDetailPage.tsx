import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Baby,
  Calendar,
  User,
  Clock,
  Edit3,
  MessageSquareText,
  FileEdit,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useFollowUpStore } from "@/store/useFollowUpStore";
import StatusTag from "@/components/StatusTag";
import MealTable from "@/components/MealTable";
import HistoryTimeline from "@/components/HistoryTimeline";
import ReviseModal from "@/components/ReviseModal";
import ExportModal from "@/components/ExportModal";
import { buildExportSummary } from "@/utils/export";
import {
  formatDate,
  formatDateTime,
  formatGender,
  mealLabel,
} from "@/utils/format";

export default function FollowUpDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { initFromStorage, getRecordById, reviseRecord } = useFollowUpStore();
  const [showRevise, setShowRevise] = useState(false);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  const record = getRecordById(id);

  if (!record) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card p-8 text-center">
          <p className="text-gray-500 mb-4">未找到对应的随访记录</p>
          <button className="btn-primary" onClick={() => navigate("/")}>
            <ArrowLeft size={16} />
            返回列表
          </button>
        </div>
      </div>
    );
  }

  const canRevise = record.status !== "revised";
  const abnormalCount = record.threeDayMeals.reduce(
    (acc, day) => acc + day.meals.filter((m) => m.isAbnormal).length,
    0
  );

  const exportSummary = buildExportSummary([record]);

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => navigate("/")}
              className="btn-secondary !px-3 !py-2">
              <ArrowLeft size={16} />
              返回
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowExport(true)}
                className="btn-secondary">
                导出摘要
              </button>
              {canRevise ? (
                <button
                  onClick={() => setShowRevise(true)}
                  className={
                    record.status === "abnormal" ? "btn-primary" : "btn-danger"
                  }>
                  <Edit3 size={16} />
                  人工改判
                </button>
              ) : (
                <span className="tag tag-revised !px-3 !py-1.5">
                  <Edit3 size={12} />
                  已完成人工改判
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 space-y-5">
            <section className="card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-serif text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <Baby size={22} className="text-medical-600" />
                      {record.infant.name}
                    </h2>
                    <span className="text-sm text-gray-500">
                      {record.infant.ageMonths}月龄 · {formatGender(record.infant.gender)}
                    </span>
                    <StatusTag
                      status={record.status}
                      isManual={record.isManualEntry}
                    />
                    {abnormalCount > 0 && (
                      <span className="tag bg-orange-50 text-status-abnormal border border-orange-200">
                        <AlertCircle size={12} />
                        {abnormalCount} 项风险
                      </span>
                    )}
                    {record.status === "normal" && (
                      <span className="tag bg-green-50 text-status-normal border border-green-200">
                        <CheckCircle2 size={12} />
                        食材审核通过
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={14} />
                      随访日期 {formatDate(record.followUpDate)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={14} />
                      最后更新 {formatDateTime(record.updatedAt)}
                    </span>
                    {record.lastOperator && (
                      <span className="inline-flex items-center gap-1">
                        <User size={14} />
                        复核人 {record.lastOperator}
                      </span>
                    )}
                    {record.reviewTime && (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={14} />
                        复核时间 {formatDateTime(record.reviewTime)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {record.isManualEntry && record.manualEntryNote && (
                <div className="mt-4 border-l-4 border-status-manual bg-amber-50/70 rounded-r-xl px-4 py-3">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-status-manual mb-1">
                    <FileEdit size={14} />
                    手工补录说明
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {record.manualEntryNote}
                  </p>
                </div>
              )}

              {record.parentNote && (
                <div className="mt-4 border-l-4 border-medical-400 bg-medical-50/50 rounded-r-xl px-4 py-3">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-medical-700 mb-1">
                    <MessageSquareText size={14} />
                    家长补充信息
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {record.parentNote}
                  </p>
                </div>
              )}

              {record.reviseReason && (
                <div className="mt-4 border-l-4 border-status-revised bg-indigo-50/60 rounded-r-xl px-4 py-3">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-status-revised mb-1">
                    <Edit3 size={14} />
                    人工改判理由
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed italic">
                    {record.reviseReason}
                  </p>
                </div>
              )}
            </section>

            <section className="card p-5">
              <h3 className="section-title">
                <Calendar size={18} className="text-medical-600" />
                三日辅食食材表
              </h3>
              <MealTable days={record.threeDayMeals} />
              {abnormalCount > 0 && (
                <div className="mt-4 p-3 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="text-sm font-medium text-status-abnormal mb-1">
                    ⚠ 风险提示
                  </div>
                  <ul className="text-xs text-gray-700 space-y-0.5 list-disc list-inside">
                    {record.threeDayMeals.flatMap((day) =>
                      day.meals
                        .filter((m) => m.isAbnormal)
                        .map((m) => (
                          <li key={`${day.date}-${m.meal}`}>
                            {formatDate(day.date)} {mealLabel[m.meal]}：{m.food}
                            {m.remark ? `（${m.remark}）` : ""}
                          </li>
                        ))
                    )}
                  </ul>
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-2 space-y-5">
            <section className="card p-5">
              <h3 className="section-title">
                <Clock size={18} className="text-medical-600" />
                状态流转
              </h3>
              <div className="space-y-0">
                {[...record.history]
                  .sort(
                    (a, b) =>
                      new Date(a.timestamp).getTime() -
                      new Date(b.timestamp).getTime()
                  )
                  .map((entry, idx, arr) => (
                    <div key={entry.id} className="relative pl-7 pb-4 last:pb-0">
                      {idx !== arr.length - 1 && (
                        <div className="absolute left-[9px] top-5 bottom-0 w-px bg-gray-200" />
                      )}
                      <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-medical-100 border-2 border-medical-500 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-medical-600" />
                      </div>
                      <div className="text-sm">
                        <div className="font-medium text-gray-800">
                          {entry.newValue}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {entry.operator} · {formatDateTime(entry.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            <section className="card p-5">
              <h3 className="section-title">
                <Edit3 size={18} className="text-medical-600" />
                变更历史
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                所有操作均已留痕，可查看旧值、处理人和复核时间
              </p>
              <HistoryTimeline history={record.history} />
            </section>
          </div>
        </div>
      </main>

      <ReviseModal
        open={showRevise}
        onClose={() => setShowRevise(false)}
        currentStatus={record.status}
        onSubmit={(newStatus, reason, operator) =>
          reviseRecord(id, newStatus, reason, operator)
        }
      />
      <ExportModal
        open={showExport}
        onClose={() => setShowExport(false)}
        summary={exportSummary}
      />
    </div>
  );
}
