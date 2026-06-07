import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { UNIT_LABELS } from "@/types";
import type { FeeUnit, VerifyRecordInput } from "@/types";
import { formatMoney } from "@/data/mockData";
import { UserPlus2, FileInput, AlertCircle, CheckCircle2 } from "lucide-react";

export const SupplementForm = () => {
  const supplementRecord = useAppStore((s) => s.supplementRecord);
  const balance = useAppStore((s) => s.balance);
  const [form, setForm] = useState<VerifyRecordInput>({
    parentName: "",
    childName: "",
    childAge: "",
    courseName: "",
    quantity: 1,
    unit: "class_hour",
    unitPrice: 300,
  });
  const [remark, setRemark] = useState("");
  const [result, setResult] = useState<null | { id: string; amount: number }>(null);

  const amount = useMemo(
    () => (isNaN(form.quantity) ? 0 : form.quantity) * (isNaN(form.unitPrice) ? 0 : form.unitPrice),
    [form.quantity, form.unitPrice]
  );

  const submit = () => {
    if (!form.parentName.trim() || !form.childName.trim() || !form.courseName.trim()) {
      return;
    }
    const input: VerifyRecordInput = {
      ...form,
      initialRemark: remark.trim() || undefined,
    };
    const rec = supplementRecord(input);
    setResult({ id: rec.id, amount: rec.amount });
    setTimeout(() => {
      setForm({
        parentName: "",
        childName: "",
        childAge: "",
        courseName: "",
        quantity: 1,
        unit: "class_hour",
        unitPrice: 300,
      });
      setRemark("");
    }, 2500);
  };

  const field = (
    label: string,
    node: React.ReactNode,
    hint?: string
  ) => (
    <div>
      <label className="text-xs font-medium text-stone-700">{label}</label>
      {hint && <div className="text-[10px] text-stone-400">{hint}</div>}
      <div className="mt-1.5">{node}</div>
    </div>
  );

  const inputCls =
    "w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      <div className="lg:col-span-3 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden animate-fade-in-up stagger-1">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-accent-50 flex items-center justify-center">
            <UserPlus2 className="w-5 h-5 text-accent-600" />
          </div>
          <div>
            <h3 className="font-display text-lg text-stone-900">手工补录核销记录</h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              用于录入历史遗漏的核销记录，系统将自动保留审计轨迹
            </p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {result && (
            <div className="rounded-xl bg-brand-50 border border-brand-200 p-4 flex items-start gap-3 animate-scale-in">
              <CheckCircle2 className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-brand-800">补录成功</div>
                <div className="text-xs text-brand-700 mt-0.5">
                  记录ID：{result.id} · 核销金额 {formatMoney(result.amount)}，已自动计入余额
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {field(
              "家长姓名",
              <input
                className={inputCls}
                value={form.parentName}
                placeholder="如：张女士"
                onChange={(e) => setForm({ ...form, parentName: e.target.value })}
              />
            )}
            {field(
              "幼儿姓名",
              <input
                className={inputCls}
                value={form.childName}
                placeholder="如：浩浩"
                onChange={(e) => setForm({ ...form, childName: e.target.value })}
              />
            )}
            {field(
              "幼儿年龄",
              <input
                className={inputCls}
                value={form.childAge}
                placeholder="如：3岁2个月"
                onChange={(e) => setForm({ ...form, childAge: e.target.value })}
              />
            )}
            {field(
              "课程名称",
              <input
                className={inputCls}
                value={form.courseName}
                placeholder="如：蒙氏感官启蒙课"
                onChange={(e) => setForm({ ...form, courseName: e.target.value })}
              />
            )}
            {field(
              "核销数量",
              <input
                type="number"
                min={0}
                className={inputCls}
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: Math.max(0, Number(e.target.value)) })
                }
              />
            )}
            {field(
              "费用单位",
              <div className="flex gap-1.5">
                {(["class_hour", "yuan", "section"] as FeeUnit[]).map((u) => (
                  <button
                    key={u}
                    onClick={() => setForm({ ...form, unit: u })}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                      form.unit === u
                        ? "bg-brand-500 text-white shadow-sm"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {UNIT_LABELS[u]}
                  </button>
                ))}
              </div>
            )}
            {field(
              "单价（元）",
              <input
                type="number"
                min={0}
                className={inputCls}
                value={form.unitPrice}
                onChange={(e) =>
                  setForm({ ...form, unitPrice: Math.max(0, Number(e.target.value)) })
                }
              />
            )}
            {field(
              "核销总金额",
              <div className="px-3 py-2 rounded-xl bg-brand-50 border border-brand-100 text-brand-700 font-display text-lg">
                {formatMoney(amount)}
              </div>,
              "自动计算 = 数量 × 单价"
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-stone-700">补录备注说明</label>
            <div className="text-[10px] text-stone-400">说明补录原因，便于后续追溯</div>
            <textarea
              rows={3}
              className={inputCls + " mt-1.5 resize-none"}
              placeholder="如：5月28日游泳体验课3节系统漏录，经主管同意补录..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
            <div className="text-xs text-stone-500 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              补录将同步影响本月余额，建议先与主管确认
            </div>
            <button
              onClick={submit}
              disabled={!form.parentName || !form.childName || !form.courseName}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white text-sm font-semibold shadow-lg shadow-brand-200 hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
            >
              <FileInput className="w-4 h-4" />
              提交补录
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-5">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden animate-fade-in-up stagger-2">
          <div className="px-5 py-4 border-b border-stone-100">
            <h3 className="font-display text-base text-stone-900">补录前后对比</h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              方便快速检查数据差异
            </p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
                <div className="text-[11px] text-stone-500 font-medium">补录前余额</div>
                <div className="font-display text-2xl text-stone-700 mt-1">
                  {formatMoney(balance.remainingBalance)}
                </div>
                <div className="text-[10px] text-stone-400 mt-0.5">已核销 {formatMoney(balance.verifiedAmount)}</div>
              </div>
              <div className="p-4 rounded-xl bg-brand-50 border border-brand-100">
                <div className="text-[11px] text-brand-600 font-medium">补录后预计</div>
                <div className="font-display text-2xl text-brand-700 mt-1">
                  {formatMoney(balance.remainingBalance - amount)}
                </div>
                <div className="text-[10px] text-brand-500 mt-0.5">
                  新增核销 -{formatMoney(amount)}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-stone-100">
                <span className="text-stone-500">家长</span>
                <span className="font-medium text-stone-800">
                  {form.parentName || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-stone-100">
                <span className="text-stone-500">课程</span>
                <span className="font-medium text-stone-800">
                  {form.courseName || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-stone-100">
                <span className="text-stone-500">数量 × 单价</span>
                <span className="font-medium text-stone-800">
                  {form.quantity} {UNIT_LABELS[form.unit]} × {formatMoney(form.unitPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5">
                <span className="text-stone-500">本次补录金额</span>
                <span className="font-display text-lg text-brand-700">
                  {formatMoney(amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-accent-50 to-white border border-accent-100 p-5 animate-fade-in-up stagger-3">
          <div className="text-sm font-semibold text-accent-800 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            补录规范提示
          </div>
          <ul className="mt-2 text-[12px] text-accent-700/90 space-y-1.5 leading-relaxed">
            <li>• 补录记录会自动标记 "手工补录" 标签</li>
            <li>• 若数量为边界值（0/1/整十/≥50）会自动记录审计</li>
            <li>• 补录后金额永久计入本月余额，不可删除</li>
            <li>• 备注可多次追加，原承诺不会被覆盖</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
