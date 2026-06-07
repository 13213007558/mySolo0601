import { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import type { Ingredient, MealType, IngredientCategory } from '@/types';
import { useRecordStore } from '@/store/useRecordStore';

interface Props {
  onClose: () => void;
}

const mealTypes: MealType[] = ['早餐', '午餐', '晚餐', '加餐'];
const categories: IngredientCategory[] = [
  '主食',
  '蔬菜',
  '肉类',
  '蛋奶',
  '海鲜',
  '坚果',
  '其他',
];

export default function ManualEntryModal({ onClose }: Props) {
  const addManualRecord = useRecordStore((s) => s.addManualRecord);
  const today = new Date().toISOString().slice(0, 10);

  const [roomNo, setRoomNo] = useState('');
  const [babyNameRaw, setBabyNameRaw] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [mealType, setMealType] = useState<MealType>('午餐');
  const [mealDate, setMealDate] = useState(today);
  const [photoCaption, setPhotoCaption] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', category: '主食' },
  ]);
  const [note, setNote] = useState('');
  const [operator, setOperator] = useState('护理主管');

  const updateIng = (idx: number, patch: Partial<Ingredient>) => {
    setIngredients((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addIng = () =>
    setIngredients((arr) => [...arr, { name: '', category: '主食' }]);
  const removeIng = (idx: number) =>
    setIngredients((arr) => (arr.length <= 1 ? arr : arr.filter((_, i) => i !== idx)));

  const canSubmit =
    roomNo.trim() &&
    babyNameRaw.trim() &&
    motherPhone.trim() &&
    ingredients.some((i) => i.name.trim());

  const handleSubmit = () => {
    if (!canSubmit) return;
    const validIng = ingredients.filter((i) => i.name.trim());
    addManualRecord({
      roomNo: roomNo.trim(),
      babyNameRaw: babyNameRaw.trim(),
      motherPhone: motherPhone.trim(),
      mealType,
      mealDate,
      photoCaption: photoCaption.trim(),
      ingredients: validIng,
      note: note.trim(),
      operator: operator.trim() || '护理主管',
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-warm-900/40 backdrop-blur-sm p-4 animate-fade-in-up"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl border border-warm-100 bg-white shadow-card flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-warm-100 px-5 py-3.5 flex-shrink-0">
          <div>
            <h3 className="font-serif text-lg font-semibold text-warm-900">
              手工补录膳食记录
            </h3>
            <p className="mt-0.5 text-xs text-warm-500">
              补录后将自动标记补录差异并写入时间线
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-warm-500 transition-colors hover:bg-warm-100 hover:text-warm-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-warm-700">
                房间号 <span className="text-coral-500">*</span>
              </label>
              <input
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
                placeholder="例如 305"
                className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-sage-400 focus:ring-2 focus:ring-sage-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-warm-700">
                宝宝姓名 <span className="text-coral-500">*</span>
              </label>
              <input
                value={babyNameRaw}
                onChange={(e) => setBabyNameRaw(e.target.value)}
                placeholder="例如 乐乐"
                className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-sage-400 focus:ring-2 focus:ring-sage-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-warm-700">
                妈妈手机号 <span className="text-coral-500">*</span>
              </label>
              <input
                value={motherPhone}
                onChange={(e) => setMotherPhone(e.target.value)}
                placeholder="11 位手机号"
                className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-sage-400 focus:ring-2 focus:ring-sage-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-warm-700">
                操作人
              </label>
              <input
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-sage-400 focus:ring-2 focus:ring-sage-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-warm-700">
                餐次
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
                className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-sage-400 focus:ring-2 focus:ring-sage-100"
              >
                {mealTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-warm-700">
                膳食日期
              </label>
              <input
                type="date"
                value={mealDate}
                onChange={(e) => setMealDate(e.target.value)}
                className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-sage-400 focus:ring-2 focus:ring-sage-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-warm-700">
              照片说明
            </label>
            <textarea
              value={photoCaption}
              onChange={(e) => setPhotoCaption(e.target.value)}
              rows={2}
              placeholder="例如：补拍当日午餐，小米粥配南瓜泥..."
              className="w-full resize-none rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-sage-400 focus:ring-2 focus:ring-sage-100"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium text-warm-700">
                食材清单 <span className="text-coral-500">*</span>
              </label>
              <button
                onClick={addIng}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-sage-500 transition-colors hover:bg-sage-50"
              >
                <Plus className="h-3.5 w-3.5" />
                新增食材
              </button>
            </div>
            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    value={ing.name}
                    onChange={(e) => updateIng(idx, { name: e.target.value })}
                    placeholder="食材名称"
                    className="flex-1 rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-sage-400 focus:ring-2 focus:ring-sage-100"
                  />
                  <select
                    value={ing.category}
                    onChange={(e) =>
                      updateIng(idx, { category: e.target.value as IngredientCategory })
                    }
                    className="w-24 rounded-xl border border-warm-200 bg-white px-2 py-2 text-sm outline-none transition-colors focus:border-sage-400 focus:ring-2 focus:ring-sage-100"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeIng(idx)}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-warm-400 transition-colors hover:bg-coral-50 hover:text-coral-500"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-warm-700">
              补录说明
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="例如：系统当日漏采，根据纸质记录补录..."
              className="w-full resize-none rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-sage-400 focus:ring-2 focus:ring-sage-100"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-warm-100 bg-white px-5 py-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="rounded-xl border border-warm-200 bg-white px-4 py-2 text-sm font-medium text-warm-700 transition-colors hover:bg-warm-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-xl bg-sage-400 px-4 py-2 text-sm font-medium text-white transition-all duration-200 shadow-soft hover:bg-sage-500 hover:shadow-card disabled:cursor-not-allowed disabled:opacity-50"
          >
            确认补录
          </button>
        </div>
      </div>
    </div>
  );
}
