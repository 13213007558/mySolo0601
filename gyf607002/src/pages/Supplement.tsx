import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FilePlus, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { FoodRestriction, RestrictionType, Unit } from '@/types';
import { restrictionTypeLabelMap } from '@/types';

const restrictionTypes: RestrictionType[] = ['allergy', 'intolerance', 'age_restriction', 'other'];
const unitOptions: Unit[] = ['g', 'ml', 'mg', 'piece'];
const unitLabelMap: Record<Unit, string> = { g: '克 (g)', ml: '毫升 (ml)', mg: '毫克 (mg)', piece: '份' };

function emptyRestriction(): FoodRestriction {
  return {
    id: `res-new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ingredientName: '',
    restrictionType: 'allergy',
    maxAmount: 0,
    unit: 'g',
    note: '',
    synonyms: [],
  };
}

export default function Supplement() {
  const navigate = useNavigate();
  const { supplementTemplate, addSupplementRecord } = useAppStore();
  const [name, setName] = useState(supplementTemplate.name);
  const [ageMonths, setAgeMonths] = useState(String(supplementTemplate.ageMonths));
  const [allergyHistory, setAllergyHistory] = useState(supplementTemplate.allergyHistory);
  const [supplementReason, setSupplementReason] = useState(
    supplementTemplate.supplementReason || '',
  );
  const [supplementedBy, setSupplementedBy] = useState(
    supplementTemplate.supplementedBy || '夜班老师',
  );
  const [restrictions, setRestrictions] = useState<FoodRestriction[]>(
    supplementTemplate.restrictions.map((r) => ({ ...r })),
  );

  const updateRestriction = (idx: number, patch: Partial<FoodRestriction>) => {
    setRestrictions((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    );
  };

  const addRestriction = () => {
    setRestrictions((prev) => [...prev, emptyRestriction()]);
  };

  const removeRestriction = (idx: number) => {
    if (restrictions.length <= 1) return;
    setRestrictions((prev) => prev.filter((_, i) => i !== idx));
  };

  const canSubmit =
    name.trim() &&
    ageMonths.trim() &&
    allergyHistory.trim() &&
    supplementReason.trim() &&
    supplementedBy.trim() &&
    restrictions.every((r) => r.ingredientName.trim());

  const handleSubmit = () => {
    if (!canSubmit) return;
    addSupplementRecord({
      name: name.trim(),
      ageMonths: Number(ageMonths) || 0,
      allergyHistory: allergyHistory.trim(),
      supplementReason: supplementReason.trim(),
      supplementedBy: supplementedBy.trim(),
      restrictions,
    });
    navigate('/');
  };

  return (
    <div className="container max-w-3xl px-4 md:px-6 py-6 pb-20">
      <button
        onClick={() => navigate('/')}
        className="btn-secondary flex items-center gap-1.5 mb-5 animate-fade-in"
      >
        <ArrowLeft size={16} />
        返回交接本
      </button>

      <div className="bg-white rounded-2xl shadow-soft p-6 animate-fade-in">
        <h1 className="font-serif text-2xl font-semibold text-ink-dark flex items-center gap-2 mb-1">
          <FilePlus size={24} className="text-status-supplemented" />
          手工补录记录
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          补录记录将自动标记「补录」标签，在交接摘要中单独分区展示，便于白班老师识别。
        </p>

        <div className="space-y-6">
          <section>
            <h2 className="section-title mb-4">宝宝基础信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-dark mb-1.5">
                  姓名 <span className="text-status-abnormal">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：宝宝F（乐乐）"
                  className="w-full px-4 py-2.5 rounded-xl border border-ink/15 bg-cream/30 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-dark mb-1.5">
                  月龄 <span className="text-status-abnormal">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={36}
                  value={ageMonths}
                  onChange={(e) => setAgeMonths(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-ink/15 bg-cream/30 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:bg-white text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-ink-dark mb-1.5">
                  过敏史 <span className="text-status-abnormal">*</span>
                </label>
                <textarea
                  value={allergyHistory}
                  onChange={(e) => setAllergyHistory(e.target.value)}
                  rows={2}
                  placeholder="例如：小麦过敏，面食需严格避免"
                  className="w-full px-4 py-2.5 rounded-xl border border-ink/15 bg-cream/30 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:bg-white text-sm"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">禁忌食材（可添加多条）</h2>
              <button onClick={addRestriction} className="btn-secondary text-xs flex items-center gap-1">
                <Plus size={14} />
                新增禁忌
              </button>
            </div>
            <div className="space-y-3">
              {restrictions.map((r, idx) => (
                <div
                  key={r.id}
                  className="border border-cream-dark rounded-xl p-4 bg-cream/20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm font-medium text-ink-dark">禁忌 #{idx + 1}</p>
                    {restrictions.length > 1 && (
                      <button
                        onClick={() => removeRestriction(idx)}
                        className="text-status-abnormal/70 hover:text-status-abnormal text-xs flex items-center gap-1"
                      >
                        <Trash2 size={13} />
                        删除
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        食材名称 <span className="text-status-abnormal">*</span>
                      </label>
                      <input
                        type="text"
                        value={r.ingredientName}
                        onChange={(e) => updateRestriction(idx, { ingredientName: e.target.value })}
                        placeholder="例如：小麦"
                        className="w-full px-3 py-2 rounded-lg border border-ink/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">禁忌类型</label>
                      <select
                        value={r.restrictionType}
                        onChange={(e) =>
                          updateRestriction(idx, { restrictionType: e.target.value as RestrictionType })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-ink/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
                      >
                        {restrictionTypes.map((t) => (
                          <option key={t} value={t}>
                            {restrictionTypeLabelMap[t]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">最大摄入量</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={0}
                          step="0.1"
                          value={r.maxAmount}
                          onChange={(e) =>
                            updateRestriction(idx, { maxAmount: Number(e.target.value) || 0 })
                          }
                          className="flex-1 px-3 py-2 rounded-lg border border-ink/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
                        />
                        <select
                          value={r.unit}
                          onChange={(e) => updateRestriction(idx, { unit: e.target.value as Unit })}
                          className="px-3 py-2 rounded-lg border border-ink/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
                        >
                          {unitOptions.map((u) => (
                            <option key={u} value={u}>
                              {unitLabelMap[u]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">备注</label>
                      <input
                        type="text"
                        value={r.note || ''}
                        onChange={(e) => updateRestriction(idx, { note: e.target.value })}
                        placeholder="例如：完全禁食"
                        className="w-full px-3 py-2 rounded-lg border border-ink/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="section-title mb-4">补录信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-dark mb-1.5">
                  补录人 <span className="text-status-abnormal">*</span>
                </label>
                <input
                  type="text"
                  value={supplementedBy}
                  onChange={(e) => setSupplementedBy(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-ink/15 bg-cream/30 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-dark mb-1.5">
                  补录时间
                </label>
                <input
                  type="text"
                  value={new Date().toLocaleString('zh-CN', { hour12: false })}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-ink/10 bg-cream/20 text-gray-500 text-sm cursor-not-allowed"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-ink-dark mb-1.5">
                  补录原因 <span className="text-status-abnormal">*</span>
                </label>
                <textarea
                  value={supplementReason}
                  onChange={(e) => setSupplementReason(e.target.value)}
                  rows={2}
                  placeholder="例如：今日新入托，原名单遗漏"
                  className="w-full px-4 py-2.5 rounded-xl border border-ink/15 bg-cream/30 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:bg-white text-sm"
                />
              </div>
            </div>
          </section>

          <div className="flex gap-3 pt-2 border-t border-cream-dark">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`btn-primary flex-1 ${!canSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              提交补录并返回
            </button>
            <button onClick={() => navigate('/')} className="btn-secondary">
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
