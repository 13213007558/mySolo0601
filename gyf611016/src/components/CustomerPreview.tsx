import { useGradingStore } from "@/store/gradingStore";
import { ShieldCheck, Award, Eye, Gem, UserCheck, Clock } from "lucide-react";
import { getAnnotationColor, getAnnotationTypeName, formatDate, cn } from "@/utils";

export function CustomerPreview() {
  const currentSlice = useGradingStore((s) => s.currentSlice);
  const annotations = useGradingStore((s) => s.annotations);
  const certificate = useGradingStore((s) => s.certificate);
  const graders = useGradingStore((s) => s.graders);
  const calculateProgress = useGradingStore((s) => s.calculateProgress);

  const progress = calculateProgress();

  return (
    <div className="h-full w-full bg-gradient-to-br from-jade-50 via-white to-amber-50/40 overflow-auto scrollbar-thin">
      <div className="min-h-full px-10 py-8 flex flex-col">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-jade-50 border border-jade-100">
            <Eye size={14} className="text-jade-600" />
            <span className="text-xs font-semibold text-jade-700 tracking-wider">
              客户只读预览 · 无内部备注
            </span>
          </div>
        </div>

        <div className="flex-1 mx-auto max-w-5xl w-full">
          <div className="certificate-paper rounded-3xl shadow-2xl overflow-hidden border-2 border-amber-100">
            <div className="px-12 pt-10 pb-8 text-center border-b-2 border-dashed border-amber-200/70 relative overflow-hidden">
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-48 h-48 border-[14px] border-jade-600 rounded-br-full" />
                <div className="absolute bottom-0 right-0 w-48 h-48 border-[14px] border-gold-primary rounded-tl-full" />
              </div>
              <div className="relative">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-jade-500 to-jade-700 flex items-center justify-center shadow-lg">
                      <Gem size={28} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <h1
                      className="text-3xl font-bold text-jade-800 tracking-[0.25em]"
                      style={{ fontFamily: "'Noto Serif SC', serif" }}
                    >
                      玉石分级鉴定证书
                    </h1>
                    <div className="text-xs text-gray-500 tracking-[0.3em] mt-1">
                      JADE GRADING CERTIFICATE · PREVIEW
                    </div>
                  </div>
                </div>
                <div className="w-56 h-px bg-gradient-to-r from-transparent via-jade-400 to-transparent mx-auto mt-5" />
              </div>
            </div>

            <div className="px-12 py-8 space-y-7">
              <div className="grid grid-cols-5 gap-8">
                <div className="col-span-2 space-y-5">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden border-4 border-white shadow-xl ring-1 ring-jade-100 relative">
                    <img
                      src={currentSlice.imageUrl}
                      alt={currentSlice.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                      <div className="text-[10px] text-gray-400 tracking-wider">样品类别</div>
                      <div className="text-xs font-semibold text-gray-800 mt-0.5">
                        {currentSlice.category}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                      <div className="text-[10px] text-gray-400 tracking-wider">产地溯源</div>
                      <div className="text-xs font-semibold text-gray-800 mt-0.5">
                        {currentSlice.origin}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                      <div className="text-[10px] text-gray-400 tracking-wider">样品重量</div>
                      <div className="text-xs font-semibold text-gray-800 mt-0.5">
                        {currentSlice.weight} 克拉 (ct)
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                      <div className="text-[10px] text-gray-400 tracking-wider">外形尺寸</div>
                      <div className="text-xs font-semibold text-gray-800 mt-0.5">
                        {currentSlice.width}×{currentSlice.height}×{currentSlice.thickness}mm
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-jade-50/50 border border-jade-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <UserCheck size={12} className="text-jade-600" />
                      <div className="text-[10px] font-semibold text-jade-700 tracking-wider">
                        鉴定师信息
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">主检分级师</span>
                        <span className="font-semibold text-gray-800">
                          {certificate?.primaryGrader?.name || graders.primary.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">复核分级师</span>
                        <span className="font-semibold text-gray-800">
                          {certificate?.secondaryGrader?.name || graders.secondary.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-3 space-y-6">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-jade-50 via-white to-amber-50/60 border border-jade-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[11px] text-gray-500 tracking-widest mb-1">
                          综合评定等级
                        </div>
                        <div
                          className="text-4xl font-bold text-jade-700 tracking-wider"
                          style={{ fontFamily: "'Noto Serif SC', serif" }}
                        >
                          {certificate?.grade || "分级中..."}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Clock size={10} className="text-gray-400" />
                          <span className="text-[10px] text-gray-500">
                            鉴定日期：{formatDate(Date.now())}
                          </span>
                        </div>
                      </div>
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-jade-400 to-jade-700 flex items-center justify-center shadow-xl shadow-jade-300/50">
                        <Award size={38} className="text-white" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-gray-500 tracking-widest mb-2.5">
                      鉴定摘要说明
                    </div>
                    <div className="p-5 rounded-xl bg-gray-50/70 border border-gray-100 text-sm leading-relaxed text-gray-700">
                      {certificate?.summary ||
                        `本件${currentSlice.category}样品（编号 ${currentSlice.code}）经透射光分级台检测，正在进行裂隙、杂质与包裹体的系统标注。当前标注完成度 ${progress}%，请等待分级师完成所有标注后出具正式证书。`}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="text-[11px] text-gray-500 tracking-widest">
                        检测项统计
                      </div>
                      <div className="text-[10px] text-gray-400">
                        共检测 {annotations.length} 个特征区域
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <StatBox
                        color="red"
                        label="裂隙 (Cracks)"
                        count={annotations.filter((a) => a.type === "crack").length}
                        hint="透射光下可见裂纹"
                      />
                      <StatBox
                        color="amber"
                        label="杂质 (Impurities)"
                        count={annotations.filter((a) => a.type === "impurity").length}
                        hint="矿物包裹物/杂色"
                      />
                      <StatBox
                        color="blue"
                        label="包裹体 (Inclusions)"
                        count={annotations.filter((a) => a.type === "inclusion").length}
                        hint="气液/固相包裹"
                      />
                    </div>
                  </div>

                  {annotations.length > 0 && (
                    <div>
                      <div className="text-[11px] text-gray-500 tracking-widest mb-2.5">
                        标注详情清单
                      </div>
                      <div className="bg-white/60 border border-gray-100 rounded-xl overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50/80 text-gray-500 text-[10px]">
                              <th className="text-left font-medium px-4 py-2">
                                标注编号
                              </th>
                              <th className="text-left font-medium px-4 py-2">
                                类型
                              </th>
                              <th className="text-left font-medium px-4 py-2">
                                程度
                              </th>
                              <th className="text-right font-medium px-4 py-2">
                                顶点数
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {annotations.slice(0, 12).map((a) => (
                              <tr key={a.id} className="hover:bg-gray-50/50">
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-2.5 h-2.5 rounded"
                                      style={{
                                        backgroundColor: getAnnotationColor(a.type),
                                      }}
                                    />
                                    <span className="font-medium text-gray-800">
                                      {a.label}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-gray-600">
                                  {getAnnotationTypeName(a.type)}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span
                                    className={cn(
                                      "text-[10px] px-2 py-0.5 rounded-full font-medium",
                                      a.severity === "severe"
                                        ? "bg-red-50 text-red-700"
                                        : a.severity === "moderate"
                                        ? "bg-amber-50 text-amber-700"
                                        : "bg-emerald-50 text-emerald-700"
                                    )}
                                  >
                                    {a.severity === "severe"
                                      ? "显著"
                                      : a.severity === "moderate"
                                      ? "中等"
                                      : "轻微"}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-right text-gray-500 font-mono">
                                  {a.points.length}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {certificate?.customerNotes && (
                    <div className="p-4 rounded-2xl bg-jade-50/60 border border-jade-200/60">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Eye size={12} className="text-jade-700" />
                        <div className="text-[10px] font-semibold text-jade-700 tracking-wider">
                          温馨提示
                        </div>
                      </div>
                      <div className="text-xs text-jade-800 leading-relaxed">
                        {certificate.customerNotes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-12 pb-10 pt-4 border-t-2 border-dashed border-amber-200/70">
              <div className="grid grid-cols-2 gap-10">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-jade-50 to-white border border-jade-200">
                  <div className="text-[10px] font-semibold text-jade-700 tracking-[0.2em] mb-3">
                    主分级师签署
                  </div>
                  <div className="flex items-end justify-between pt-4 border-t border-jade-100">
                    <div>
                      <div
                        className={cn(
                          "text-xl font-bold",
                          certificate?.primaryGrader?.signedAt
                            ? "text-jade-800"
                            : "text-gray-300"
                        )}
                        style={{ fontFamily: "'Noto Serif SC', serif" }}
                      >
                        {certificate?.primaryGrader?.name || graders.primary.name}
                      </div>
                      {certificate?.primaryGrader?.signedAt && (
                        <div className="text-[10px] text-jade-600 mt-0.5">
                          {formatDate(certificate.primaryGrader.signedAt)}
                        </div>
                      )}
                    </div>
                    {certificate?.primaryGrader?.signedAt ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                        <ShieldCheck size={11} />
                        已核验
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-400 text-[10px]">
                        待签署
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-200">
                  <div className="text-[10px] font-semibold text-gold-dark tracking-[0.2em] mb-3">
                    副分级师签署
                  </div>
                  <div className="flex items-end justify-between pt-4 border-t border-amber-100">
                    <div>
                      <div
                        className={cn(
                          "text-xl font-bold",
                          certificate?.secondaryGrader?.signedAt
                            ? "text-gold-dark"
                            : "text-gray-300"
                        )}
                        style={{ fontFamily: "'Noto Serif SC', serif" }}
                      >
                        {certificate?.secondaryGrader?.name || graders.secondary.name}
                      </div>
                      {certificate?.secondaryGrader?.signedAt && (
                        <div className="text-[10px] text-gold-primary mt-0.5">
                          {formatDate(certificate.secondaryGrader.signedAt)}
                        </div>
                      )}
                    </div>
                    {certificate?.secondaryGrader?.signedAt ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                        <ShieldCheck size={11} />
                        已核验
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-400 text-[10px]">
                        待签署
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={11} />
                  证书编号：{certificate?.id || `PREVIEW-${currentSlice.code}`}
                </div>
                <div className="tracking-wider">
                  本证书仅对送检样品负责 · 受玉石分级技术规范 JC/T-2025 约束
                </div>
                <div className="flex items-center gap-1.5">
                  <Gem size={11} />
                  玉石分级鉴定中心
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  color,
  label,
  count,
  hint,
}: {
  color: "red" | "amber" | "blue";
  label: string;
  count: number;
  hint: string;
}) {
  const map = {
    red: "from-red-50 to-white border-red-100 text-red-700",
    amber: "from-amber-50 to-white border-amber-100 text-amber-700",
    blue: "from-blue-50 to-white border-blue-100 text-blue-700",
  } as const;
  const dot = {
    red: "bg-crack-red",
    amber: "bg-impurity-amber",
    blue: "bg-inclusion-blue",
  } as const;
  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br border ${map[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${dot[color]}`} />
        <div className="text-[10px] opacity-80 font-medium">{label}</div>
      </div>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-[9px] opacity-60 mt-0.5">{hint}</div>
    </div>
  );
}
