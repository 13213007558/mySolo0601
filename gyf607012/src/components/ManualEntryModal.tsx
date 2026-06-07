import { useState } from "react";
import Modal from "./Modal";
import type { DayMeals, InfantInfo, MealType, RecordStatus } from "@/types";
import { mealLabel } from "@/utils/format";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (params: {
    infant: InfantInfo;
    followUpDate: string;
    threeDayMeals: DayMeals[];
    initialStatus: RecordStatus;
    parentNote?: string;
    manualEntryNote: string;
    operator: string;
  }) => void;
}

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner"];

function emptyDay(offset: number): DayMeals {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return {
    date: d.toISOString().slice(0, 10),
    meals: mealTypes.map((m) => ({ meal: m, food: "", isAbnormal: false })),
  };
}

export default function ManualEntryModal({ open, onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [ageMonths, setAgeMonths] = useState(6);
  const [followUpDate, setFollowUpDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [days, setDays] = useState<DayMeals[]>([
    emptyDay(2),
    emptyDay(1),
    emptyDay(0),
  ]);
  const [initialStatus, setInitialStatus] = useState<RecordStatus>("normal");
  const [parentNote, setParentNote] = useState("");
  const [manualEntryNote, setManualEntryNote] = useState("");
  const [operator, setOperator] = useState("");

  const canSubmit =
    name.trim().length >= 2 &&
    ageMonths > 0 &&
    manualEntryNote.trim().length >= 5 &&
    operator.trim().length >= 2;

  const updateMeal = (dayIdx: number, meal: MealType, food: string) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? {
              ...d,
              meals: d.meals.map((m) =>
                m.meal === meal ? { ...m, food } : m
              ),
            }
          : d
      )
    );
  };

  const updateDayDate = (dayIdx: number, date: string) => {
    setDays((prev) =>
      prev.map((d, i) => (i === dayIdx ? { ...d, date } : d))
    );
  };

  const toggleAbnormal = (dayIdx: number, meal: MealType) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? {
              ...d,
              meals: d.meals.map((m) =>
                m.meal === meal ? { ...m, isAbnormal: !m.isAbnormal } : m
              ),
            }
          : d
      )
    );
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const cleanedDays: DayMeals[] = days.map((d) => ({
      ...d,
      meals: d.meals.filter((m) => m.food.trim()),
    }));
    onSubmit({
      infant: { name: name.trim(), gender, ageMonths },
      followUpDate,
      threeDayMeals: cleanedDays,
      initialStatus,
      parentNote: parentNote.trim() || undefined,
      manualEntryNote: manualEntryNote.trim(),
      operator: operator.trim(),
    });
    setName("");
    setGender("male");
    setAgeMonths(6);
    setDays([emptyDay(2), emptyDay(1), emptyDay(0)]);
    setInitialStatus("normal");
    setParentNote("");
    setManualEntryNote("");
    setOperator("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="手工补录随访记录" width="max-w-2xl">
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">婴幼儿姓名 *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：果果"
              className="input"
            />
          </div>
          <div>
            <label className="label">性别</label>
            <div className="flex gap-2">
              <button
                onClick={() => setGender("male")}
                className={`flex-1 py-2 rounded-lg border text-sm transition-all ${
                  gender === "male"
                    ? "border-medical-500 bg-medical-50 text-medical-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}>
                男
              </button>
              <button
                onClick={() => setGender("female")}
                className={`flex-1 py-2 rounded-lg border text-sm transition-all ${
                  gender === "female"
                    ? "border-medical-500 bg-medical-50 text-medical-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}>
                女
              </button>
            </div>
          </div>
          <div>
            <label className="label">月龄</label>
            <input
              type="number"
              min={1}
              max={36}
              value={ageMonths}
              onChange={(e) => setAgeMonths(Number(e.target.value))}
              className="input"
            />
          </div>
          <div>
            <label className="label">随访日期</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label">初始状态</label>
          <div className="flex gap-2">
            <button
              onClick={() => setInitialStatus("normal")}
              className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                initialStatus === "normal"
                  ? "border-status-normal bg-green-50 text-status-normal"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}>
              正常
            </button>
            <button
              onClick={() => setInitialStatus("abnormal")}
              className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                initialStatus === "abnormal"
                  ? "border-status-abnormal bg-orange-50 text-status-abnormal"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}>
              异常
            </button>
          </div>
        </div>

        <div>
          <label className="label">三日辅食食材</label>
          <div className="space-y-3">
            {days.map((day, dIdx) => (
              <div key={dIdx} className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-600">第 {dIdx + 1} 天</span>
                  <input
                    type="date"
                    value={day.date}
                    onChange={(e) => updateDayDate(dIdx, e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-200 rounded bg-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {mealTypes.map((meal) => {
                    const item = day.meals.find((m) => m.meal === meal)!;
                    return (
                      <div key={meal}>
                        <div className="text-xs text-gray-500 mb-1">
                          {mealLabel[meal]}
                        </div>
                        <div className="flex gap-1">
                          <input
                            value={item.food}
                            onChange={(e) => updateMeal(dIdx, meal, e.target.value)}
                            placeholder="食材"
                            className="input !py-1.5 text-xs flex-1"
                          />
                          <button
                            onClick={() => toggleAbnormal(dIdx, meal)}
                            title="标记风险"
                            className={`px-2 rounded border text-xs transition-all ${
                              item.isAbnormal
                                ? "border-status-abnormal bg-orange-50 text-status-abnormal"
                                : "border-gray-200 text-gray-400 hover:text-status-abnormal"
                            }`}>
                            ⚠
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="label">家长补充信息（可选）</label>
          <textarea
            value={parentNote}
            onChange={(e) => setParentNote(e.target.value)}
            placeholder="家长告知的其他情况"
            className="textarea"
            rows={2}
          />
        </div>

        <div>
          <label className="label">
            补录说明 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={manualEntryNote}
            onChange={(e) => setManualEntryNote(e.target.value)}
            placeholder="请说明补录原因，如：系统维护当日未能及时录入（至少 5 字）"
            className="textarea"
            rows={2}
          />
        </div>

        <div>
          <label className="label">
            录入护士 <span className="text-red-500">*</span>
          </label>
          <input
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            placeholder="如：刘护士"
            className="input"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-white py-2 -mx-1 px-1">
          <button className="btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={!canSubmit}>
            提交补录
          </button>
        </div>
      </div>
    </Modal>
  );
}
