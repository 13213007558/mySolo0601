import { useGradingStore } from "@/store/gradingStore";
import {
  ArrowLeft,
  Award,
  Check,
  FileCheck2,
  FileSignature,
  Printer,
  ShieldCheck,
  X,
  AlertCircle,
  Monitor,
  Eye,
  EyeOff,
  FileText,
} from "lucide-react";
import { useState } from "react";
import {
  formatDate,
  getAnnotationColor,
  getAnnotationTypeName,
  getSeverityName,
  cn,
} from "@/utils";

export function CertificateView() {
  const certificate = useGradingStore((s) => s.certificate);
  const currentSlice = useGradingStore((s) => s.currentSlice);
  const graders = useGradingStore((s) => s.graders);
  const setViewMode = useGradingStore((s) => s.setViewMode);
  const signCertificate = useGradingStore((s) => s.signCertificate);
  const submitCertificate = useGradingStore((s) => s.submitCertificate);
  const setCertificateInternalNotes = useGradingStore(
    (s) => s.setCertificateInternalNotes
  );
  const setCertificateCustomerNotes = useGradingStore(
    (s) => s.setCertificateCustomerNotes
  );
  const calculateProgress = useGradingStore((s) => s.calculateProgress);
  const isProgressComplete = useGradingStore((s) => s.isProgressComplete);

  const [showCustomerPreview, setShowCustomerPreview] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  if (!certificate) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-jade-50 via-white to-amber-50/30">
        <div className="text-center">
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <div className="text-gray-500 mb-3">暂无证书数据</div>
          <button
            onClick={() => setViewMode("edit")}
            className="px-4 py-2 rounded-xl bg-jade-600 text-white text-sm font-medium hover:bg-jade-700 transition-all"
          >
            返回工作台
          </button>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();
  const progressOk = isProgressComplete();
  const primarySigned = !!certificate.primaryGrader?.signedAt;
  const secondarySigned = !!certificate.secondaryGrader?.signedAt;
  const canSubmit = progressOk && primarySigned && secondarySigned;

  const handleSubmit = () => {
    const res = submitCertificate();
    setToast({ type: res.success ? "success" : "error", msg: res.message });
    setTimeout(() => setToast(null), 3500);
  };

  const sign = (role: "primary" | "secondary") => {
    if (!progressOk) {
      setToast({ type: "error", msg: `标注完成度仅 ${progress}%，需达100%后方可签署` });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    signCertificate(role);
  };

  const renderStatusBadge = () => {
    const map = {
      draft: { text: "草稿", cls: "bg-gray-100 text-gray-600" },
      pending_review: { text: "待终审", cls: "bg-amber-100 text-amber-700" },
      issued: { text: "已签发", cls: "bg-emerald-100 text-emerald-700" },
      rejected: { text: "已驳回", cls: "bg-red-100 text-red-700" },
    } as const;
    const m = map[certificate.status];
    return (
      <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${m.cls}`}>
        {m.text}
      </span>
    );
  };

  const cracksCount = certificate.annotations.filter((a) => a.type === "crack").length;
  const impurityCount = certificate.annotations.filter((a) => a.type === "impurity").length;
  const inclusionCount = certificate.annotations.filter((a) => a.type === "inclusion").length;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-jade-50 via-white to-amber-50/30">
      <div className="flex items-center justify-between px-6 py-3 border-b border-jade-100 bg-white/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode("edit")}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-jade-100 text-gray-700 hover:text-jade-700 transition-all"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Award size={17} className="text-gold-primary" />
              分级证书草稿
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              {currentSlice.code} · {renderStatusBadge()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCustomerPreview(!showCustomerPreview)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
              showCustomerPreview
                ? "bg-jade-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-jade-100"
            )}
          >
            <Monitor size={13} />
            {showCustomerPreview ? "内部编辑视图" : "客户副屏预览"}
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-medium transition-all"
            onClick={() => window.print()}
          >
            <Printer size={13} />
            打印
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all",
              canSubmit
                ? "bg-gradient-to-r from-emerald-500 to-jade-600 text-white shadow-lg shadow-jade-600/30 hover:shadow-xl"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            <ShieldCheck size={13} />
            签发证书
          </button>
        </div>
      </div>

      {!showCustomerPreview && (
        <div className="px-6 py-3 bg-white/50 border-b border-jade-50 shrink-0 grid grid-cols-4 gap-3">
          <CheckItem ok={progressOk} title="标注完成度" value={`${progress}%`} required="需 100%" />
          <CheckItem ok={primarySigned} title="主分级师签署" value={graders.primary.name} required={primarySigned ? "已签署" : "待签署"} />
          <CheckItem ok={secondarySigned} title="副分级师签署" value={graders.secondary.name} required={secondarySigned ? "已签署" : "待签署"} />
          <CheckItem ok={canSubmit} title="签发状态" value={canSubmit ? "可提交" : "条件不足"} required={certificate.status === "issued" ? "✓ 已签发" : "全部通过后签发"} />
        </div>
      )}

      <div className="flex-1 overflow-auto p-6 scrollbar-thin">
        <div className="mx-auto max-w-3xl">
          <div className="certificate-paper rounded-3xl shadow-2xl overflow-hidden border-2 border-amber-100 relative">
            {certificate.status === "issued" && (
              <div className="absolute top-10 right-10 w-24 h-24 seal-stamp rounded-full flex items-center justify-center z-20 flex-col gap-0.5">
                <div className="text-[10px] opacity-90">玉石分级</div>
                <div className="text-sm font-bold tracking-wider">已签发</div>
                <div className="text-[9px] opacity-90">
                  {certificate.issuedAt ? formatDate(certificate.issuedAt).slice(2, 6) : "----"}
                </div>
              </div>
            )}

            <div className="px-10 pt-10 pb-8 text-center border-b-2 border-dashed border-amber-200/70 relative overflow-hidden">
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-40 h-40 border-[12px] border-jade-600 rounded-br-full" />
                <div className="absolute bottom-0 right-0 w-40 h-40 border-[12px] border-gold-primary rounded-tl-full" />
              </div>
              <div className="relative">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <ShieldCheck size={22} className="text-jade-700" />
                  <h1 className="text-2xl font-bold text-jade-800 tracking-[0.2em]" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                    玉石分级鉴定证书
                  </h1>
                </div>
                <div className="text-[11px] text-gray-500 tracking-widest">
                  JADE GRADING CERTIFICATE · 编号 {certificate.id}
                </div>
                <div className="w-40 h-px bg-gradient-to-r from-transparent via-jade-400 to-transparent mx-auto mt-4" />
              </div>
            </div>

            <div className="px-10 py-7 space-y-6">
              <div className="grid grid-cols-5 gap-6">
                <div className="col-span-2 space-y-4">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden border-4 border-white shadow-lg ring-1 ring-jade-100 relative">
                    <img
                      src={currentSlice.imageUrl}
                      alt={currentSlice.name}
                      className="w-full h-full object-cover"
                    />
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 75" preserveAspectRatio="none">
                      {certificate.annotations.slice(0, 15).map((a, idx) => {
                        const fakePts = Array.from({ length: a.points.length > 0 ? a.points.length : 4 }, (_, i) => ({
                          x: 15 + ((idx * 17 + i * 8) % 70),
                          y: 12 + ((idx * 13 + i * 9) % 50),
                        }));
                        const d = fakePts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ") + " Z";
                        return (
                          <path
                            key={a.id}
                            d={d}
                            fill={getAnnotationColor(a.type) + "28"}
                            stroke={getAnnotationColor(a.type)}
                            strokeWidth="0.5"
                          />
                        );
                      })}
                    </svg>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <InfoCell label="类别" value={currentSlice.category} />
                    <InfoCell label="产地" value={currentSlice.origin} />
                    <InfoCell label="重量" value={`${currentSlice.weight} ct`} />
                    <InfoCell label="尺寸" value={`${currentSlice.width}×${currentSlice.height}×${currentSlice.thickness}mm`} />
                  </div>
                </div>

                <div className="col-span-3 space-y-5">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-jade-50 via-white to-amber-50/60 border border-jade-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[10px] text-gray-500 tracking-widest mb-1">综合评定等级</div>
                        <div
                          className="text-3xl font-bold text-jade-700 tracking-wide"
                          style={{ fontFamily: "'Noto Serif SC', serif" }}
                        >
                          {certificate.grade}
                        </div>
                      </div>
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-jade-400 to-jade-700 flex items-center justify-center shadow-lg shadow-jade-300/50">
                        <Award size={30} className="text-white" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-gray-500 tracking-widest mb-2">鉴定摘要</div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-xs leading-relaxed text-gray-700">
                      {certificate.summary}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] text-gray-500 tracking-widest">缺陷统计</div>
                      <div className="text-[10px] text-gray-400">共 {certificate.annotations.length} 项</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <StatCard color="red" label="裂隙" count={cracksCount} />
                      <StatCard color="amber" label="杂质" count={impurityCount} />
                      <StatCard color="blue" label="包裹体" count={inclusionCount} />
                    </div>
                  </div>

                  {!showCustomerPreview && (
                    <div>
                      <div className="text-[10px] text-gray-500 tracking-widest mb-2">详细标注清单</div>
                      <div className="max-h-44 overflow-y-auto scrollbar-thin space-y-1">
                        {certificate.annotations.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-100 hover:border-jade-200 transition-all"
                          >
                            <div
                              className="w-3 h-3 rounded-md shrink-0"
                              style={{
                                backgroundColor: getAnnotationColor(a.type),
                              }}
                            />
                            <span className="text-[11px] font-medium text-gray-700 flex-1">
                              {a.label}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {getAnnotationTypeName(a.type)}
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
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!showCustomerPreview && certificate.internalNotes !== undefined && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60">
                    <div className="flex items-center gap-1.5 mb-2">
                      <EyeOff size={11} className="text-gold-dark" />
                      <div className="text-[10px] font-semibold text-gold-dark tracking-wider">
                        内部备注（客户不可见）
                      </div>
                    </div>
                    <textarea
                      value={certificate.internalNotes}
                      onChange={(e) => setCertificateInternalNotes(e.target.value)}
                      placeholder="记录仅内部存档的分级师备注、样品背景、复检建议等..."
                      className="w-full text-[11px] p-2.5 rounded-lg bg-white border border-amber-200 focus:border-gold-primary focus:outline-none resize-none placeholder:text-gray-400"
                      rows={3}
                    />
                  </div>
                  <div className="p-4 rounded-2xl bg-jade-50/60 border border-jade-200/60">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Eye size={11} className="text-jade-700" />
                      <div className="text-[10px] font-semibold text-jade-700 tracking-wider">
                        客户可见说明
                      </div>
                    </div>
                    <textarea
                      value={certificate.customerNotes}
                      onChange={(e) => setCertificateCustomerNotes(e.target.value)}
                      placeholder="填写将显示给客户的保养建议、收藏提示等信息..."
                      className="w-full text-[11px] p-2.5 rounded-lg bg-white border border-jade-200 focus:border-jade-500 focus:outline-none resize-none placeholder:text-gray-400"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {showCustomerPreview && certificate.customerNotes && (
                <div className="p-4 rounded-2xl bg-jade-50/60 border border-jade-200/60">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Eye size={11} className="text-jade-700" />
                    <div className="text-[10px] font-semibold text-jade-700 tracking-wider">
                      温馨提示
                    </div>
                  </div>
                  <div className="text-[11px] text-jade-800 leading-relaxed">
                    {certificate.customerNotes}
                  </div>
                </div>
              )}
            </div>

            <div className="px-10 pb-10 pt-2 border-t-2 border-dashed border-amber-200/70">
              <div className="grid grid-cols-2 gap-8">
                <SignBlock
                  title="主分级师签署"
                  role="主检"
                  grader={certificate.primaryGrader || graders.primary}
                  signed={primarySigned}
                  onSign={!showCustomerPreview ? () => sign("primary") : undefined}
                  color="jade"
                />
                <SignBlock
                  title="副分级师签署"
                  role="复核"
                  grader={certificate.secondaryGrader || graders.secondary}
                  signed={secondarySigned}
                  onSign={!showCustomerPreview ? () => sign("secondary") : undefined}
                  color="gold"
                />
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                <div className="flex items-center gap-1.5">
                  <FileCheck2 size={10} />
                  证书编号：{certificate.id}
                </div>
                <div>
                  {certificate.issuedAt
                    ? `签发日期：${formatDate(certificate.issuedAt)}`
                    : certificate.status === "draft"
                    ? "（草稿未签发）"
                    : `出具日期：${formatDate(Date.now())}`}
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={10} />
                  本证书受玉石分级技术规范 JC/T-2025 约束
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-[fadeIn_0.2s_ease]">
          <div
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md text-sm font-medium",
              toast.type === "success"
                ? "bg-emerald-600/95 text-white"
                : "bg-red-600/95 text-white"
            )}
          >
            {toast.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}

function CheckItem({
  ok,
  title,
  value,
  required,
}: {
  ok: boolean;
  title: string;
  value: string;
  required: string;
}) {
  return (
    <div
      className={cn(
        "p-3 rounded-xl border transition-all",
        ok
          ? "bg-emerald-50/70 border-emerald-200"
          : "bg-gray-50/70 border-gray-200"
      )}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <div
          className={cn(
            "w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0",
            ok ? "bg-emerald-500" : "bg-gray-300"
          )}
        >
          {ok ? <Check size={9} /> : <X size={9} />}
        </div>
        <div className="text-[10px] text-gray-600 font-medium">{title}</div>
      </div>
      <div className="text-xs font-semibold text-gray-800 truncate">{value}</div>
      <div className={cn("text-[10px] mt-0.5", ok ? "text-emerald-600" : "text-gray-400")}>
        {required}
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
      <div className="text-[9px] text-gray-400 tracking-wider">{label}</div>
      <div className="text-[11px] font-medium text-gray-800 mt-0.5 truncate">{value}</div>
    </div>
  );
}

function StatCard({
  color,
  label,
  count,
}: {
  color: "red" | "amber" | "blue";
  label: string;
  count: number;
}) {
  const colorMap = {
    red: "from-red-50 to-white border-red-100 text-red-700",
    amber: "from-amber-50 to-white border-amber-100 text-amber-700",
    blue: "from-blue-50 to-white border-blue-100 text-blue-700",
  } as const;
  return (
    <div
      className={`p-3 rounded-xl bg-gradient-to-br border ${colorMap[color]}`}
    >
      <div className="text-[10px] opacity-80">{label}</div>
      <div className="text-xl font-bold mt-0.5">{count}</div>
    </div>
  );
}

function SignBlock({
  title,
  role,
  grader,
  signed,
  onSign,
  color,
}: {
  title: string;
  role: string;
  grader: { name: string; signedAt?: number };
  signed: boolean;
  onSign?: () => void;
  color: "jade" | "gold";
}) {
  const colorCls =
    color === "jade"
      ? "text-jade-700 border-jade-200 from-jade-50 to-white"
      : "text-gold-dark border-amber-200 from-amber-50 to-white";
  const btnCls =
    color === "jade"
      ? "bg-jade-600 hover:bg-jade-700 text-white"
      : "bg-gold-primary hover:bg-gold-dark text-white";

  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-br border ${colorCls}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className={`text-[10px] font-semibold tracking-wider opacity-80`}>{title}</div>
          <div className={`text-[10px] px-2 py-0.5 rounded-full inline-block mt-1 ${signed ? "bg-white/70" : "bg-white/40 opacity-70"}`}>
            职务：{role}
          </div>
        </div>
        {onSign && !signed && (
          <button
            onClick={onSign}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all shadow-sm ${btnCls}`}
          >
            <FileSignature size={11} />
            电子签署
          </button>
        )}
      </div>
      <div className="flex items-end justify-between pt-4 border-t border-current/10">
        <div>
          <div
            className={`text-lg font-bold ${signed ? "" : "opacity-40 grayscale"}`}
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            {grader.name}
          </div>
          {signed && grader.signedAt && (
            <div className="text-[10px] opacity-70 mt-0.5">
              {formatDate(grader.signedAt)} 签署
            </div>
          )}
        </div>
        {signed && (
          <div className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold tracking-wider bg-white/60 border border-current/20 flex items-center gap-1`}>
            <Check size={11} />
            已签
          </div>
        )}
      </div>
    </div>
  );
}
