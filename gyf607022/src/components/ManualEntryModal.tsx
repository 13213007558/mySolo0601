import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { NewManualEntry } from "@/store/useRecordStore";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewManualEntry) => { ok: boolean; error?: string };
}

type Day = "Day1" | "Day2" | "Day3";
type Meal = "早餐" | "午餐" | "晚餐" | "加餐";

const DAYS: Day[] = ["Day1", "Day2", "Day3"];
const MEALS: Meal[] = ["早餐", "午餐", "晚餐", "加餐"];
const DAY_LABEL: Record<Day, string> = { Day1: "第一天", Day2: "第二天", Day3: "第三天" };

export default function ManualEntryModal({ open, onClose, onSubmit }: Props) {
  const [babyName, setBabyName] = useState("");
  const [babyMonthAge, setBabyMonthAge] = useState<number | "">("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [checkDate, setCheckDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [ingredients, setIngredients] = useState<{ name: string; day: Day; meal: Meal; tempId: number }[]>([
    { name: "", day: "Day1", meal: "早餐", tempId: 1 },
  ]);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const reset = () => {
    setBabyName("");
    setBabyMonthAge("");
    setParentName("");
    setParentPhone("");
    setCheckDate(new Date().toISOString().slice(0, 10));
    setNote("");
    setIngredients([{ name: "", day: "Day1", meal: "早餐", tempId: 1 }]);
    setErr("");
    setSuccess(false);
  };

  const closeAndReset = () => {
    reset();
    onClose();
  };

  const addIng = () => {
    setIngredients((prev) => [...prev, { name: "", day: "Day1", meal: "早餐", tempId: Date.now() }]);
  };
  const delIng = (tempId: number) => {
    setIngredients((prev) => prev.filter((i) => i.tempId !== tempId));
  };
  const updateIng = (tempId: number, patch: Partial<{ name: string; day: Day; meal: Meal }>) => {
    setIngredients((prev) => prev.map((i) => (i.tempId === tempId ? { ...i, ...patch } : i)));
  };

  const submit = () => {
    const cleanIng = ingredients.filter((i) => i.name.trim().length > 0);
    const result = onSubmit({
      babyName: babyName.trim(),
      babyMonthAge: typeof babyMonthAge === "number" ? babyMonthAge : -1,
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      checkDate,
      ingredients: cleanIng.map(({ name, day, meal }) => ({ name: name.trim(), day, meal })),
      note: note.trim(),
    });
    if (!result.ok) {
      setErr(result.error ?? "提交失败");
      setSuccess(false);
    } else {
      setErr("");
      setSuccess(true);
      setTimeout(closeAndReset, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in-up">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-pop">
        <div className="p-6 border-b border-cream-100 sticky top-0 bg-white z-10">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-serif text-xl font-semibold text-gray-800">手工补录对账记录</h3>
              <p className="text-sm text-mistblue-400 mt-1">系统将自动进行禁忌匹配并标记为待复核</p>
            </div>
            <button onClick={closeAndReset} className="p-1.5 rounded-lg hover:bg-cream-100 text-mistblue-400">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="label-text">
                宝宝姓名 <span className="text-coral-400">*</span>
              </div>
              <input className="input-field" value={babyName} onChange={(e) => setBabyName(e.target.value)} />
            </div>
            <div>
              <div className="label-text">
                月龄 <span className="text-coral-400">*</span>
              </div>
              <input
                type="number"
                min={0}
                max={72}
                className="input-field"
                value={babyMonthAge}
                onChange={(e) => setBabyMonthAge(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div>
              <div className="label-text">
                家长姓名 <span className="text-coral-400">*</span>
              </div>
              <input className="input-field" value={parentName} onChange={(e) => setParentName(e.target.value)} />
            </div>
            <div>
              <div className="label-text">
                家长手机号 <span className="text-coral-400">*</span>
              </div>
              <input className="input-field" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <div className="label-text">
                对账日期 <span className="text-coral-400">*</span>
              </div>
              <input type="date" className="input-field" value={checkDate} onChange={(e) => setCheckDate(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="label-text mb-0">
                食材清单 <span className="text-coral-400">*</span>
              </div>
              <button onClick={addIng} className="text-sm text-milkgreen-500 hover:text-milkgreen-600 flex items-center gap-1">
                <Plus size={14} /> 添加一行
              </button>
            </div>
            <div className="space-y-2">
              {ingredients.map((ing) => (
                <div key={ing.tempId} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    className="col-span-5 input-field"
                    placeholder="食材名称，如：芒果泥"
                    value={ing.name}
                    onChange={(e) => updateIng(ing.tempId, { name: e.target.value })}
                  />
                  <select
                    className="col-span-3 input-field"
                    value={ing.day}
                    onChange={(e) => updateIng(ing.tempId, { day: e.target.value as Day })}
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {DAY_LABEL[d]}
                      </option>
                    ))}
                  </select>
                  <select
                    className="col-span-3 input-field"
                    value={ing.meal}
                    onChange={(e) => updateIng(ing.tempId, { meal: e.target.value as Meal })}
                  >
                    {MEALS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => delIng(ing.tempId)}
                    disabled={ingredients.length === 1}
                    className="col-span-1 p-2 rounded-lg text-mistblue-400 hover:text-coral-500 hover:bg-coral-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-mistblue-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="label-text">补录说明</div>
            <textarea
              rows={3}
              className="input-field resize-none"
              placeholder="补录原因、家长反馈等（可选）"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {err && <div className="p-3 rounded-xl bg-coral-50 border border-coral-200 text-sm text-coral-600">{err}</div>}
          {success && (
            <div className="p-3 rounded-xl bg-milkgreen-50 border border-milkgreen-200 text-sm text-milkgreen-600">
              补录成功，已生成对账记录……
            </div>
          )}
        </div>

        <div className="p-6 border-t border-cream-100 flex gap-3 justify-end sticky bottom-0 bg-white">
          <button onClick={closeAndReset} className="btn-secondary">
            取消
          </button>
          <button onClick={submit} className="btn-primary">
            提交补录
          </button>
        </div>
      </div>
    </div>
  );
}
