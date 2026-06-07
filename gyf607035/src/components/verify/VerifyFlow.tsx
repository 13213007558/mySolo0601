import { useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { STEPS, UNIT_LABELS } from "@/types";
import type { FeeUnit } from "@/types";
import {
  AlertTriangle,
  CheckCircle2,
  Check,
  ChevronRight,
  ArrowLeft,
  User,
  Baby,
  GraduationCap,
  Hash,
  Layers,
  FileText,
  CircleCheckBig,
  Sparkles,
} from "lucide-react";
import { formatMoney } from "@/data/mockData";
import { RemarkTimeline } from "@/components/remark/RemarkTimeline";
import { RemarkInput } from "@/components/remark/RemarkInput";

const FieldRow = ({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: any;
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div className="flex items-start gap-3 py-2.5">
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
        highlight ? "bg-accent-50" : "bg-stone-100"
      }`}
    >
      <Icon className={`w-4.5 h-4.5 ${highlight ? "text-accent-600" : "text-stone-500"}`} />
    </div>
    <div className="flex-1">
      <div className="text-[11px] text-stone-500 uppercase tracking-wide">{label}</div>
      <div
        className={`text-sm mt-0.5 ${
          highlight ? "text-accent-700 font-semibold" : "text-stone-800 font-medium"
        }`}
      >
        {value}
      </div>
    </div>
  </div>
);

export const VerifyFlow = () => {
  const {
    activeRecordId,
    records,
    currentStep,
    setCurrentStep,
    currentRole,
    verifyRecord,
  } = useAppStore();

  const [selectedUnit, setSelectedUnit] = useState<FeeUnit | null>(null);
  const [partialQty, setPartialQty] = useState<number | null>(null);
  const [treatBoundaryAsNormal, setTreatBoundaryAsNormal] = useState(false);
  const [remarkDraft, setRemarkDraft] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const rec = useMemo(
    () => records.find((r) => r.id === activeRecordId),
    [records, activeRecordId]
  );

  if (!rec) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px] animate-fade-in-up stagger-3">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-stone-100 flex items-center justify-center">
            <FileText className="w-10 h-10 text-stone-300" />
          </div>
          <h3 className="mt-4 font-display text-xl text-stone-700">选择一条记录开始核销</h3>
          <p className="text-sm text-stone-500 mt-1 max-w-xs mx-auto leading-relaxed">
            从左侧列表选择待处理记录，系统将按 5 步标准流程引导你完成核销
          </p>
        </div>
      </div>
    );
  }

  const step = STEPS[currentStep - 1];
  const isLast = currentStep === STEPS.length;
  const isFirst = currentStep === 1;

  const next = () => {
    if (isLast) return;
    setCurrentStep(currentStep + 1);
  };
  const prev = () => {
    if (isFirst) return;
    setCurrentStep(currentStep - 1);
  };

  const submit = () => {
    const opts: any = {};
    if (rec.unitMixed || (selectedUnit && selectedUnit !== rec.unit)) {
      opts.unitMixed = true;
      if (selectedUnit) opts.targetUnit = selectedUnit;
      if (partialQty !== null) opts.targetQuantity = partialQty;
    }
    if (rec.isBoundaryValue && treatBoundaryAsNormal) {
      opts.treatBoundaryAsNormal = true;
    }
    const res = verifyRecord(rec.id, opts);
    if (res.success) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setCurrentStep(1);
      }, 1600);
    }
  };

  if (showSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px] animate-scale-in">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-xl shadow-brand-200">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h3 className="mt-5 font-display text-2xl text-stone-900">核销成功</h3>
          <p className="text-sm text-stone-500 mt-2">
            {rec.parentName} · {rec.courseName} 已完成核销
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4 animate-fade-in-up stagger-3">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-medium">
                步骤 {currentStep}/{STEPS.length}
              </span>
              <h3 className="font-display text-lg text-stone-900">{step.title}</h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">{step.desc}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-stone-500">核销金额</div>
            <div className="font-display text-2xl text-stone-900">
              {formatMoney(
                partialQty !== null ? partialQty * rec.unitPrice : rec.amount
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {currentStep === 1 && (
            <div className="grid grid-cols-2 gap-x-8">
              <FieldRow icon={User} label="家长姓名" value={rec.parentName} />
              <FieldRow icon={Baby} label="幼儿 / 年龄" value={`${rec.childName} · ${rec.childAge}`} />
              <FieldRow icon={GraduationCap} label="课程名称" value={rec.courseName} />
              <FieldRow icon={Hash} label="创建人 / 时间" value={`${rec.createdBy}`} />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
                  <div className="text-xs text-stone-500">数量</div>
                  <div className="font-display text-2xl text-stone-900 mt-1">
                    {rec.quantity}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
                  <div className="text-xs text-stone-500">当前单位</div>
                  <div className="font-display text-2xl text-stone-900 mt-1">
                    {UNIT_LABELS[rec.unit]}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-brand-50 border border-brand-100">
                  <div className="text-xs text-brand-600">单价</div>
                  <div className="font-display text-2xl text-brand-700 mt-1">
                    {formatMoney(rec.unitPrice)}
                  </div>
                </div>
              </div>

              {rec.unitMixed ? (
                <div className="p-4 rounded-2xl bg-accent-50 border border-accent-200">
                  <div className="flex items-start gap-2.5">
                    <Layers className="w-5 h-5 text-accent-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-accent-800">
                        检测到单位混用（原 {rec.originalUnit ? UNIT_LABELS[rec.originalUnit!] : ""} → 现 {UNIT_LABELS[rec.unit]}）
                      </div>
                      <p className="text-xs text-accent-700/80 mt-1 leading-relaxed">
                        系统允许<strong>部分成功</strong>核销。请在下方选择目标单位和实际核销数量：
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-accent-700 font-medium">
                            目标单位
                          </label>
                          <div className="flex gap-1.5 mt-1.5">
                            {(["class_hour", "yuan", "section"] as FeeUnit[]).map(
                              (u) => (
                                <button
                                  key={u}
                                  onClick={() => setSelectedUnit(u)}
                                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                                    (selectedUnit ?? rec.unit) === u
                                      ? "bg-white text-accent-700 shadow-sm ring-1 ring-accent-300"
                                      : "bg-white/50 text-accent-600 hover:bg-white"
                                  }`}
                                >
                                  {UNIT_LABELS[u]}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-accent-700 font-medium">
                            实际核销数量
                          </label>
                          <input
                            type="number"
                            value={partialQty ?? rec.quantity}
                            onChange={(e) =>
                              setPartialQty(Math.max(0, Number(e.target.value)))
                            }
                            className="mt-1.5 w-full px-3 py-2 rounded-lg bg-white text-sm text-stone-900 border border-accent-200 focus:outline-none focus:ring-2 focus:ring-accent-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-brand-50 border border-brand-100 flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-brand-600" />
                  <span className="text-sm text-brand-800">
                    单位一致，无需调整。如实际情况不同，可在下一步标记
                  </span>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              {rec.isBoundaryValue ? (
                <div
                  className={`p-5 rounded-2xl border ${
                    treatBoundaryAsNormal
                      ? "bg-amber-50 border-amber-300"
                      : "bg-amber-50 border-amber-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        treatBoundaryAsNormal ? "bg-amber-200" : "bg-amber-100"
                      }`}
                    >
                      <AlertTriangle
                        className={`w-5 h-5 ${
                          treatBoundaryAsNormal ? "text-amber-800" : "text-amber-600"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-base font-semibold text-amber-900">
                        ⚠ 边界值识别：数量 = {rec.quantity}
                      </div>
                      <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
                        该记录的数量处于临界值（为 0、1、整十数或 ≥ 50）。
                        {rec.boundaryAudited ? (
                          <span className="font-medium ml-1">
                            （已由 {rec.boundaryAuditedBy} 于 复核通过）
                          </span>
                        ) : (
                          <span className="font-medium ml-1">
                            如按正常核销处理，系统将<strong>自动保留审计日志</strong>，供主管后续复查。
                          </span>
                        )}
                      </p>
                      {!rec.boundaryAudited && (
                        <label className="mt-4 inline-flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={treatBoundaryAsNormal}
                            onChange={(e) => setTreatBoundaryAsNormal(e.target.checked)}
                            className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-400"
                          />
                          <span className="text-sm text-amber-900 font-medium">
                            我已确认，按正常核销处理（系统保留审计）
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-brand-50 border border-brand-100 flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-brand-600" />
                  <span className="text-sm text-brand-800">
                    该记录数量为正常值，无需特殊处理
                  </span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-stone-50">
                  <div className="text-[11px] text-stone-500">边界值</div>
                  <div className="text-sm font-semibold mt-0.5">
                    {rec.isBoundaryValue ? "是" : "否"}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-stone-50">
                  <div className="text-[11px] text-stone-500">已审计</div>
                  <div className="text-sm font-semibold mt-0.5">
                    {rec.boundaryAudited ? "是" : "否"}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-stone-50">
                  <div className="text-[11px] text-stone-500">单位混用</div>
                  <div className="text-sm font-semibold mt-0.5">
                    {rec.unitMixed ? "是（部分核销）" : "否"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <div className="text-sm font-semibold text-stone-800 mb-2">
                  备注记录（历史变更永久保留，不会被覆盖）
                </div>
                <RemarkTimeline remarks={rec.remarkHistory} compact />
              </div>
              <RemarkInput
                value={remarkDraft}
                onChange={setRemarkDraft}
                recordId={rec.id}
              />
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CircleCheckBig className="w-5 h-5 text-brand-600" />
                  <span className="font-display text-base text-brand-800">
                    请确认以下核销信息
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-brand-100/60">
                    <span className="text-stone-500">家长</span>
                    <span className="font-medium text-stone-900">{rec.parentName}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-brand-100/60">
                    <span className="text-stone-500">课程</span>
                    <span className="font-medium text-stone-900">{rec.courseName}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-brand-100/60">
                    <span className="text-stone-500">数量</span>
                    <span className="font-medium text-stone-900">
                      {partialQty ?? rec.quantity} {UNIT_LABELS[selectedUnit ?? rec.unit]}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-brand-100/60">
                    <span className="text-stone-500">单价</span>
                    <span className="font-medium text-stone-900">
                      {formatMoney(rec.unitPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-brand-100/60">
                    <span className="text-stone-500">特殊标记</span>
                    <span className="font-medium">
                      {rec.isBoundaryValue ? "边界值·" : ""}
                      {rec.unitMixed ? "单位混用·部分核销" : "正常核销"}
                      {!rec.isBoundaryValue && !rec.unitMixed && "正常核销"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-stone-500">核销金额</span>
                    <span className="font-display text-xl text-brand-700">
                      {formatMoney(
                        (partialQty ?? rec.quantity) * rec.unitPrice
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-stone-500 flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-brand-500 shrink-0" />
                <span>
                  提交后余额将自动扣减。
                  {currentRole === "supervisor"
                    ? "作为主管，你可在审计中心查看本次操作的完整日志。"
                    : "主管可在审计中心查看本次操作的完整日志。"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/60 flex items-center justify-between">
          <button
            onClick={prev}
            disabled={isFirst || rec.status === "verified" || rec.status === "partially_verified"}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ArrowLeft className="w-4 h-4" />
            上一步
          </button>

          {!isLast ? (
            <button
              onClick={next}
              disabled={rec.status === "verified" || rec.status === "partially_verified"}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              下一步
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={rec.status === "verified" || rec.status === "partially_verified"}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white text-sm font-semibold shadow-lg shadow-brand-200 hover:shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
            >
              <Check className="w-4 h-4" />
              确认核销
            </button>
          )}
        </div>
      </div>

      {currentStep !== 4 && rec.remarkHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 animate-fade-in-up stagger-4">
          <div className="text-xs text-stone-500 font-medium mb-3 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            备注变更历史（{rec.remarkHistory.length}条，可完整追溯）
          </div>
          <RemarkTimeline remarks={rec.remarkHistory} compact />
        </div>
      )}
    </div>
  );
};
