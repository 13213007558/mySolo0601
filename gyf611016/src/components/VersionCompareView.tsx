import { useGradingStore } from "@/store/gradingStore";
import { ArrowLeft, GitCompare, Clock, User, ArrowRightLeft, RefreshCcw } from "lucide-react";
import { formatTimestamp, getAnnotationColor, getAnnotationTypeName } from "@/utils";
import { useState } from "react";
import type { Annotation } from "@/types";

export function VersionCompareView() {
  const versions = useGradingStore((s) => s.versions);
  const annotations = useGradingStore((s) => s.annotations);
  const setViewMode = useGradingStore((s) => s.setViewMode);
  const restoreVersion = useGradingStore((s) => s.restoreVersion);
  const setCompareVersions = useGradingStore((s) => s.setCompareVersions);
  const compareVersionA = useGradingStore((s) => s.compareVersionA);
  const compareVersionB = useGradingStore((s) => s.compareVersionB);
  const currentSlice = useGradingStore((s) => s.currentSlice);

  const [showRestoreConfirm, setShowRestoreConfirm] = useState<number | null>(null);

  const getVersionAnnotations = (vNum: number | null) => {
    if (vNum === null) return annotations;
    const v = versions.find((vv) => vv.version === vNum);
    return v?.annotations || [];
  };

  const annotationsA = getVersionAnnotations(compareVersionA);
  const annotationsB = getVersionAnnotations(compareVersionB);

  const computeDiff = (a: Annotation[], b: Annotation[]) => {
    const diff: Array<{
      type: "added" | "removed" | "changed";
      annA?: Annotation;
      annB?: Annotation;
    }> = [];
    const aIds = new Set(a.map((x) => x.id));
    const bIds = new Set(b.map((x) => x.id));

    a.forEach((ann) => {
      if (!bIds.has(ann.id)) {
        diff.push({ type: "removed", annA: ann });
      } else {
        const bAnn = b.find((x) => x.id === ann.id)!;
        if (
          JSON.stringify(ann.points) !== JSON.stringify(bAnn.points) ||
          ann.severity !== bAnn.severity
        ) {
          diff.push({ type: "changed", annA: ann, annB: bAnn });
        }
      }
    });
    b.forEach((ann) => {
      if (!aIds.has(ann.id)) {
        diff.push({ type: "added", annB: ann });
      }
    });
    return diff;
  };

  const diffs =
    compareVersionA !== null || compareVersionB !== null
      ? computeDiff(annotationsA, annotationsB)
      : [];

  const renderMiniAnnotations = (list: Annotation[], highlightId?: string) => {
    const width = 200;
    const height = 150;
    if (list.length === 0) {
      return (
        <div
          className="flex items-center justify-center text-[10px] text-gray-400"
          style={{ width, height }}
        >
          （无标注）
        </div>
      );
    }
    const xs = list.flatMap((a) => a.points.map((p) => p.x));
    const ys = list.flatMap((a) => a.points.map((p) => p.y));
    const minX = Math.min(...xs) - 50;
    const maxX = Math.max(...xs) + 50;
    const minY = Math.min(...ys) - 50;
    const maxY = Math.max(...ys) + 50;
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const sx = (x: number) => ((x - minX) / rangeX) * (width - 20) + 10;
    const sy = (y: number) => ((y - minY) / rangeY) * (height - 20) + 10;

    return (
      <svg width={width} height={height}>
        {list.map((a) => {
          const path = a.points
            .map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.x)} ${sy(p.y)}`)
            .join(" ") + " Z";
          const isHL = highlightId === a.id;
          return (
            <g key={a.id}>
              <path
                d={path}
                fill={getAnnotationColor(a.type) + (isHL ? "50" : "20")}
                stroke={getAnnotationColor(a.type)}
                strokeWidth={isHL ? 2 : 1}
              />
            </g>
          );
        })}
      </svg>
    );
  };

  type VersionRow = {
    version: number;
    label: string;
    isCurrent: boolean;
    timestamp: number;
    author: string;
    comment: string;
  };
  const allVersions: VersionRow[] = [
    { version: -1, label: "当前工作区", isCurrent: true, timestamp: Date.now(), author: "当前", comment: "未保存的工作" },
    ...versions.map((v) => ({ ...v, isCurrent: false, label: `版本 V${v.version}` })),
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-jade-50 via-white to-amber-50/30">
      <div className="flex items-center justify-between px-6 py-3 border-b border-jade-100 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode("edit")}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-jade-100 text-gray-700 hover:text-jade-700 transition-all"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="text-base font-bold text-gray-800 flex items-center gap-2">
              <GitCompare size={17} className="text-jade-600" />
              标注版本差异对比
            </div>
            <div className="text-xs text-gray-500">{currentSlice.name} · {currentSlice.code}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-5 scrollbar-thin">
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-jade-100 shadow-md overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-jade-50 to-transparent border-b border-jade-50">
              <div className="text-xs font-semibold text-jade-700 mb-2">版本 A（基线）</div>
              <select
                value={compareVersionA ?? -1}
                onChange={(e) =>
                  setCompareVersions(
                    Number(e.target.value) === -1 ? null : Number(e.target.value),
                    compareVersionB
                  )
                }
                className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-gray-200 focus:border-jade-400 focus:outline-none"
              >
                {allVersions.map((v) => (
                  <option key={v.version} value={v.version}>
                    {v.isCurrent ? "🟢 " : `📦 V${v.version} · `}
                    {v.isCurrent ? v.label : `（${v.comment}）· ${formatTimestamp(v.timestamp)}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="p-4 flex flex-col items-center">
              {renderMiniAnnotations(annotationsA)}
              <div className="mt-2 w-full grid grid-cols-3 gap-1.5 text-[10px]">
                <div className="text-center p-1.5 rounded-lg bg-red-50 text-red-700">
                  裂隙 {annotationsA.filter((a) => a.type === "crack").length}
                </div>
                <div className="text-center p-1.5 rounded-lg bg-amber-50 text-amber-700">
                  杂质 {annotationsA.filter((a) => a.type === "impurity").length}
                </div>
                <div className="text-center p-1.5 rounded-lg bg-blue-50 text-blue-700">
                  包裹体 {annotationsA.filter((a) => a.type === "inclusion").length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-jade-100 shadow-md overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-transparent border-b border-amber-50">
              <div className="text-xs font-semibold text-gold-dark mb-2">版本 B（对比）</div>
              <select
                value={compareVersionB ?? -1}
                onChange={(e) =>
                  setCompareVersions(
                    compareVersionA,
                    Number(e.target.value) === -1 ? null : Number(e.target.value)
                  )
                }
                className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-gray-200 focus:border-jade-400 focus:outline-none"
              >
                {allVersions.map((v) => (
                  <option key={v.version} value={v.version}>
                    {v.isCurrent ? "🟢 " : `📦 V${v.version} · `}
                    {v.isCurrent ? v.label : `（${v.comment}）· ${formatTimestamp(v.timestamp)}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="p-4 flex flex-col items-center">
              {renderMiniAnnotations(annotationsB)}
              <div className="mt-2 w-full grid grid-cols-3 gap-1.5 text-[10px]">
                <div className="text-center p-1.5 rounded-lg bg-red-50 text-red-700">
                  裂隙 {annotationsB.filter((a) => a.type === "crack").length}
                </div>
                <div className="text-center p-1.5 rounded-lg bg-amber-50 text-amber-700">
                  杂质 {annotationsB.filter((a) => a.type === "impurity").length}
                </div>
                <div className="text-center p-1.5 rounded-lg bg-blue-50 text-blue-700">
                  包裹体 {annotationsB.filter((a) => a.type === "inclusion").length}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-jade-100 shadow-md overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <ArrowRightLeft size={14} className="text-jade-600" />
              差异分析
            </div>
            {diffs.length > 0 && (
              <div className="flex gap-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  +{diffs.filter((d) => d.type === "added").length} 新增
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  ~{diffs.filter((d) => d.type === "changed").length} 变更
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  -{diffs.filter((d) => d.type === "removed").length} 删除
                </span>
              </div>
            )}
          </div>
          <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto scrollbar-thin">
            {diffs.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-xs">
                {versions.length === 0
                  ? "暂无历史版本，请先在主工作区保存至少一个标注版本"
                  : "两版本完全一致，无差异"}
              </div>
            ) : (
              diffs.map((d, i) => {
                const ann = d.annA || d.annB!;
                return (
                  <div key={i} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50/50">
                    <div
                      className={
                        "w-16 text-[10px] text-center py-1 rounded-lg font-semibold shrink-0 " +
                        (d.type === "added"
                          ? "bg-emerald-100 text-emerald-700"
                          : d.type === "removed"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700")
                      }
                    >
                      {d.type === "added" ? "新增" : d.type === "removed" ? "删除" : "变更"}
                    </div>
                    <div
                      className="w-8 h-8 rounded-lg shrink-0"
                      style={{
                        backgroundColor: getAnnotationColor(ann.type) + "20",
                        border: `1.5px solid ${getAnnotationColor(ann.type)}`,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800">
                        {ann.label} · {getAnnotationTypeName(ann.type)}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {ann.points.length} 个顶点
                        {d.type === "changed" &&
                          d.annA &&
                          d.annB &&
                          ` · 严重度：${d.annA.severity} → ${d.annB.severity}`}
                      </div>
                    </div>
                    {d.type !== "changed" && compareVersionB !== null && (
                      <button
                        onClick={() => setShowRestoreConfirm(compareVersionB!)}
                        className="text-[10px] px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-jade-100 text-gray-600 hover:text-jade-700 transition-all flex items-center gap-1 shrink-0"
                      >
                        <RefreshCcw size={10} />
                        恢复
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-jade-100 shadow-md overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Clock size={14} className="text-jade-600" />
              版本历史记录
            </div>
          </div>
          <div className="p-3 space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
            {versions.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                还没有保存过任何版本，返回主工作区完成标注后点击"保存版本"
              </div>
            ) : (
              versions
                .slice()
                .reverse()
                .map((v) => (
                  <div
                    key={v.version}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-jade-200 hover:bg-jade-50/40 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-jade-100 text-jade-700 flex items-center justify-center font-bold text-sm shrink-0">
                      V{v.version}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800 line-clamp-1">
                        {v.comment}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                        <User size={9} />
                        {v.author}
                        <span>·</span>
                        <Clock size={9} />
                        {formatTimestamp(v.timestamp)}
                        <span>·</span>
                        <span>{v.annotations.length} 项标注</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setCompareVersions(v.version, compareVersionB);
                        }}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-jade-50 text-jade-700 hover:bg-jade-100 transition-all"
                      >
                        设为 A
                      </button>
                      <button
                        onClick={() => {
                          setCompareVersions(compareVersionA, v.version);
                        }}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-50 text-gold-dark hover:bg-amber-100 transition-all"
                      >
                        设为 B
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {showRestoreConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 w-80 shadow-2xl">
            <div className="text-sm font-semibold text-gray-800 mb-2">确认恢复版本？</div>
            <div className="text-xs text-gray-500 mb-4">
              将把工作区标注恢复到 V{showRestoreConfirm} 版本，当前未保存的工作将丢失。
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRestoreConfirm(null)}
                className="flex-1 text-xs py-2 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                取消
              </button>
              <button
                onClick={() => {
                  restoreVersion(showRestoreConfirm);
                  setShowRestoreConfirm(null);
                  setViewMode("edit");
                }}
                className="flex-1 text-xs py-2 rounded-xl font-medium bg-jade-600 text-white hover:bg-jade-700 transition-all"
              >
                确认恢复
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
