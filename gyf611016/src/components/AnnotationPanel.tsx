import { useGradingStore } from "@/store/gradingStore";
import {
  Trash2,
  ChevronDown,
  ChevronRight,
  Edit3,
  AlertTriangle,
  X,
  Check,
} from "lucide-react";
import { useState } from "react";
import {
  getAnnotationColor,
  getAnnotationTypeName,
  getSeverityName,
  cn,
} from "@/utils";
import type { Annotation } from "@/types";

export function AnnotationPanel() {
  const annotations = useGradingStore((s) => s.annotations);
  const selectedAnnotationId = useGradingStore((s) => s.selectedAnnotationId);
  const selectAnnotation = useGradingStore((s) => s.selectAnnotation);
  const deleteAnnotation = useGradingStore((s) => s.deleteAnnotation);
  const updateAnnotation = useGradingStore((s) => s.updateAnnotation);
  const saveVersion = useGradingStore((s) => s.saveVersion);
  const generateCertificate = useGradingStore((s) => s.generateCertificate);
  const calculateProgress = useGradingStore((s) => s.calculateProgress);
  const isProgressComplete = useGradingStore((s) => s.isProgressComplete);
  const setViewMode = useGradingStore((s) => s.setViewMode);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [versionComment, setVersionComment] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const toggleExpand = (id: string) =>
    setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const grouped = {
    crack: annotations.filter((a) => a.type === "crack"),
    impurity: annotations.filter((a) => a.type === "impurity"),
    inclusion: annotations.filter((a) => a.type === "inclusion"),
  };

  const renderGroup = (
    type: "crack" | "impurity" | "inclusion",
    items: Annotation[]
  ) => {
    if (items.length === 0) return null;
    return (
      <div key={type} className="mb-3">
        <div className="flex items-center gap-2 mb-1.5 px-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: getAnnotationColor(type) }}
          />
          <span className="text-xs font-semibold text-gray-700">
            {getAnnotationTypeName(type)}
          </span>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>
        <div className="space-y-1">
          {items.map((a) => {
            const isSelected = selectedAnnotationId === a.id;
            const isExpanded = expanded[a.id];
            return (
              <div
                key={a.id}
                className={cn(
                  "rounded-xl border transition-all duration-200 overflow-hidden",
                  isSelected
                    ? "border-jade-400 bg-jade-50/60 shadow-sm"
                    : "border-gray-100 bg-white/50 hover:border-jade-200"
                )}
              >
                <div
                  className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer"
                  onClick={() => selectAnnotation(a.id)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(a.id);
                    }}
                    className="p-0.5 rounded hover:bg-gray-100 text-gray-400"
                  >
                    {isExpanded ? (
                      <ChevronDown size={12} />
                    ) : (
                      <ChevronRight size={12} />
                    )}
                  </button>
                  <span
                    className="text-xs font-medium flex-1 truncate"
                    style={{ color: getAnnotationColor(a.type) }}
                  >
                    {a.label}
                  </span>
                  <span
                    className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-full font-medium",
                      a.severity === "severe"
                        ? "bg-red-100 text-red-700"
                        : a.severity === "moderate"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {getSeverityName(a.severity)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAnnotation(a.id);
                    }}
                    className="p-0.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                {isExpanded && (
                  <div className="px-3 pb-2.5 pt-1 space-y-2 border-t border-gray-50 bg-white/70">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">
                        严重程度
                      </label>
                      <div className="flex gap-1">
                        {(["minor", "moderate", "severe"] as const).map(
                          (sev) => (
                            <button
                              key={sev}
                              onClick={() =>
                                updateAnnotation(a.id, { severity: sev })
                              }
                              className={cn(
                                "flex-1 text-[10px] py-1 rounded-lg font-medium transition-all",
                                a.severity === sev
                                  ? sev === "severe"
                                    ? "bg-red-500 text-white"
                                    : sev === "moderate"
                                    ? "bg-amber-500 text-white"
                                    : "bg-emerald-500 text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              )}
                            >
                              {getSeverityName(sev)}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">
                        内部备注
                      </label>
                      <textarea
                        defaultValue={a.note || ""}
                        onBlur={(e) =>
                          updateAnnotation(a.id, { note: e.target.value })
                        }
                        placeholder="输入关于此标注的备注信息..."
                        className="w-full text-[11px] px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-100 focus:border-jade-300 focus:outline-none resize-none"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                      <Edit3 size={10} />
                      <span>{a.points.length} 个顶点</span>
                      <span>·</span>
                      <span>
                        版本 {a.version}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const progress = calculateProgress();
  const complete = isProgressComplete();

  return (
    <div className="p-3 rounded-2xl bg-white/70 backdrop-blur-md border border-jade-100 shadow-md flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-jade-700">标注列表</div>
        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          共 {annotations.length} 项
        </span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 -mr-1 space-y-0.5">
        {annotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
            <AlertTriangle size={32} className="mb-2 opacity-40" />
            <div className="text-xs">暂无标注</div>
            <div className="text-[10px] mt-1 text-gray-400">
              请在左侧工具栏选择标注工具开始标注
            </div>
          </div>
        ) : (
          <>
            {renderGroup("crack", grouped.crack)}
            {renderGroup("impurity", grouped.impurity)}
            {renderGroup("inclusion", grouped.inclusion)}
          </>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => setShowSaveDialog(true)}
            disabled={annotations.length === 0}
            className="flex-1 text-xs py-2 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            保存版本
          </button>
          <button
            onClick={() => setViewMode("version_compare")}
            disabled={annotations.length === 0}
            className="flex-1 text-xs py-2 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            版本对比
          </button>
        </div>
        <button
          onClick={() => generateCertificate()}
          disabled={!complete}
          className={cn(
            "w-full text-sm py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5",
            complete
              ? "bg-gradient-to-r from-jade-600 to-jade-500 text-white shadow-lg shadow-jade-600/30 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          )}
        >
          {complete ? <Check size={14} /> : <X size={14} />}
          {complete
            ? progress === 100
              ? "生成分级证书"
              : "继续完成标注"
            : `完成度 ${progress}% 后可生成`}
        </button>
      </div>

      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 w-80 shadow-2xl">
            <div className="text-sm font-semibold text-gray-800 mb-3">
              保存标注版本
            </div>
            <textarea
              value={versionComment}
              onChange={(e) => setVersionComment(e.target.value)}
              placeholder="输入此版本的变更说明..."
              className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:border-jade-400 focus:outline-none resize-none mb-4"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setVersionComment("");
                }}
                className="flex-1 text-xs py-2 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                取消
              </button>
              <button
                onClick={() => {
                  saveVersion(versionComment || "未填写备注");
                  setShowSaveDialog(false);
                  setVersionComment("");
                }}
                className="flex-1 text-xs py-2 rounded-xl font-medium bg-jade-600 text-white hover:bg-jade-700 transition-all"
              >
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
