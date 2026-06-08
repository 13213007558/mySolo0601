import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Gavel,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn, statusBadgeClass, statusText } from "@/utils/uiHelpers";
import IngredientList from "@/components/IngredientList";
import AuditTimeline from "@/components/AuditTimeline";
import DiffViewer from "@/components/DiffViewer";
import SupplementList from "@/components/SupplementList";
import SummaryView from "@/components/SummaryView";
import ExportPanel from "@/components/ExportPanel";
import type { RecordStatus } from "@/types";

export default function RecordDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const record = useStore((s) => s.getRecordById(id));
  const currentRole = useStore((s) => s.currentRole);
  const reviseRecord = useStore((s) => s.reviseRecord);
  const [showRevise, setShowRevise] = useState(false);
  const [reviseStatus, setReviseStatus] = useState<RecordStatus>("normal");
  const [reviseReason, setReviseReason] = useState("");

  const canRevise = currentRole === "parent" && !record?.isClosed;

  const handleRevise = () => {
    if (!reviseReason.trim()) return;
    reviseRecord(id, reviseStatus, reviseReason.trim(), "沐沐妈妈");
    setShowRevise(false);
    setReviseReason("");
  };

  const pathLabel = useMemo(() => {
    if (!record) return "";
    if (record.status === "normal") return "正常路径 ✓ 系统自动匹配通过，无禁忌";
    if (record.status === "abnormal") return "异常路径 ⚠ 命中禁忌规则，等待处理";
    if (record.status === "revised") return "人工改判路径 ✎ 父母介入调整结论";
    if (record.status === "manually_edited") return "手工补录路径 ✎ 育儿嫂修正原始录入";
    return "";
  }, [record]);

  if (!record) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="card-base p-8 text-center max-w-md">
          <AlertTriangle size={40} className="text-baby-300 mx-auto mb-3" />
          <h2 className="font-display text-xl font-bold mb-2">记录不存在</h2>
          <p className="text-ink-700/60 mb-4 text-sm">
            这条记录可能已被删除或 ID 错误。
          </p>
          <button onClick={() => navigate("/")} className="btn-primary">
            返回对账台
          </button>
        </div>
      </div>
    );
  }

  if (currentRole === "elder") {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-4">
          <button
            onClick={() => navigate("/")}
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            <ArrowLeft size={16} /> 返回
          </button>
          <SummaryView record={record} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-cream-100/80 border-b border-cream-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="btn-ghost flex items-center gap-1.5 text-sm py-2 px-3"
          >
            <ArrowLeft size={16} />
            返回
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg font-bold text-ink-800 truncate">
              {record.dateLabel} · {record.mealPeriodLabel}
            </h1>
          </div>
          <span className={cn("chip", statusBadgeClass(record.status))}>
            {statusText(record.status)}
          </span>
          {record.isClosed && (
            <span className="chip bg-ink-700/10 text-ink-700">
              <ShieldCheck size={12} /> 已结案
            </span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div className="card-base p-5 bg-gradient-to-r from-cream-50 to-white">
          <div className="flex items-start gap-2 mb-2">
            <span className="chip bg-sunset-100 text-sunset-500 text-xs">
              当前路径
            </span>
          </div>
          <p className="font-display text-lg font-semibold text-ink-800">{pathLabel}</p>
          {record.parentNote && (
            <div className="mt-3 bg-baby-50 border border-baby-100 rounded-xl px-3 py-2">
              <p className="text-xs text-baby-500 mb-0.5">💬 沐沐妈妈补充（{record.noteUpdatedAt}）</p>
              <p className="text-sm text-ink-700">{record.parentNote}</p>
            </div>
          )}
        </div>

        {canRevise && (
          <div className="card-base p-4 border-2 border-sunset-100 bg-sunset-50/30">
            {!showRevise ? (
              <button
                onClick={() => setShowRevise(true)}
                className="w-full flex items-center justify-center gap-2 btn-primary bg-sunset-300 hover:bg-sunset-500"
              >
                <Gavel size={16} />
                父母人工改判
              </button>
            ) : (
              <div className="space-y-3 animate-slide-up">
                <h4 className="font-display font-semibold text-ink-800 flex items-center gap-2">
                  <Gavel size={16} className="text-sunset-500" />
                  人工改判
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { key: "normal", label: "确认正常", icon: CheckCircle2, cls: "bg-sage-500" },
                    { key: "revised", label: "改判调整", icon: Gavel, cls: "bg-sunset-500" },
                    { key: "abnormal", label: "维持异常", icon: XCircle, cls: "bg-baby-500" },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setReviseStatus(opt.key as RecordStatus)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white transition",
                          reviseStatus === opt.key
                            ? opt.cls + " shadow-md"
                            : "bg-cream-200 text-ink-700 hover:" + opt.cls + " hover:text-white"
                        )}
                      >
                        <Icon size={14} />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  value={reviseReason}
                  onChange={(e) => setReviseReason(e.target.value)}
                  placeholder="请说明改判原因（必填），例如：已确认仅使用蛋黄部分，沐沐耐受..."
                  className="w-full min-h-[80px] bg-white border border-cream-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sage-300 resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowRevise(false)} className="btn-ghost text-sm py-2 px-3">
                    取消
                  </button>
                  <button
                    onClick={handleRevise}
                    disabled={!reviseReason.trim()}
                    className="btn-primary text-sm py-2 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    确认改判
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 space-y-5">
            <div className="card-base p-5">
              <h3 className="font-display text-lg font-bold text-ink-800 mb-3">🍽 食材明细 & 禁忌匹配</h3>
              <IngredientList ingredients={record.ingredients} />
            </div>

            {record.manualEdit && (
              <div className="card-base p-5 border-2 border-sunset-100">
                <DiffViewer edit={record.manualEdit} />
              </div>
            )}

            <div className="card-base p-5">
              <SupplementList
                recordId={record.id}
                supplements={record.supplements}
                isClosed={record.isClosed}
              />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-5">
            <div className="card-base p-5 lg:sticky lg:top-24">
              <AuditTimeline logs={record.auditLogs} />
            </div>
          </div>
        </div>

        <div className="card-base p-5">
          <ExportPanel singleRecord={record} />
        </div>
      </main>
    </div>
  );
}
