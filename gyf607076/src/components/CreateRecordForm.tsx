import { useState } from 'react';
import type { AuthorizationRecord, CreateRecordInput } from '../../shared/types';
import { SCOPE_OPTIONS } from '../../shared/types';
import { useAppStore } from '@/store/useAppStore';
import { X, FilePlus, Plus } from 'lucide-react';

interface Props {
  supplementOf?: AuthorizationRecord;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateRecordForm({ supplementOf, onClose, onSuccess }: Props) {
  const createRecord = useAppStore((s) => s.createRecord);
  const supplementRecord = useAppStore((s) => s.supplementRecord);
  const fetchAll = useAppStore((s) => s.fetchAll);

  const defaultValues: CreateRecordInput = supplementOf
    ? {
        childName: supplementOf.childName,
        childId: supplementOf.childId,
        photoContext: {
          ...supplementOf.photoContext,
          description: '',
        },
        authorizedScopes: [...supplementOf.authorizedScopes],
        guardianName: supplementOf.guardianName,
        guardianContact: supplementOf.guardianContact,
        changeReasonNote: '',
      }
    : {
        childName: '',
        childId: '',
        photoContext: {
          activityName: '',
          activityDate: new Date().toISOString().slice(0, 10),
          location: '',
          photographer: '',
          description: '',
        },
        authorizedScopes: [],
        guardianName: '',
        guardianContact: '',
        changeReasonNote: '',
      };

  const [form, setForm] = useState<CreateRecordInput>(defaultValues);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update<K extends keyof CreateRecordInput>(key: K, value: CreateRecordInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  function updateCtx<K extends keyof CreateRecordInput['photoContext']>(
    key: K,
    value: CreateRecordInput['photoContext'][K],
  ) {
    setForm((prev) => ({
      ...prev,
      photoContext: { ...prev.photoContext, [key]: value },
    }));
  }
  function toggleScope(scope: string) {
    setForm((prev) => ({
      ...prev,
      authorizedScopes: prev.authorizedScopes.includes(scope)
        ? prev.authorizedScopes.filter((s) => s !== scope)
        : [...prev.authorizedScopes, scope],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = supplementOf
        ? await supplementRecord(supplementOf.id, form)
        : await createRecord(form);
      if (res.success) {
        await fetchAll();
        onSuccess?.();
      } else {
        setError(res.error || '保存失败');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5 space-y-4 border-sage-200 bg-sage-50/50">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink-900 flex items-center gap-2">
          {supplementOf ? (
            <>
              <FilePlus size={16} className="text-sage-500" />
              手工补录授权记录
            </>
          ) : (
            <>
              <Plus size={16} className="text-warm-500" />
              新建授权记录
            </>
          )}
        </h3>
        <button onClick={onClose} className="btn-ghost p-2">
          <X size={18} />
        </button>
      </div>

      {supplementOf && (
        <div className="bg-sage-100/60 text-sage-500 rounded-xl p-3 text-sm">
          正在为「{supplementOf.childName} - {supplementOf.photoContext.activityName}」创建补录记录。原记录不会被覆盖，将保留完整历史版本。
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-500 rounded-xl p-3 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">儿童姓名 *</label>
            <input className="input" value={form.childName} onChange={(e) => update('childName', e.target.value)} placeholder="请输入儿童姓名" />
          </div>
          <div>
            <label className="label">儿童编号 *</label>
            <input className="input" value={form.childId} onChange={(e) => update('childId', e.target.value)} placeholder="如 CHILD_001" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">活动名称 *</label>
            <input className="input" value={form.photoContext.activityName} onChange={(e) => updateCtx('activityName', e.target.value)} placeholder="如 春季亲子运动会" />
          </div>
          <div>
            <label className="label">活动日期 *</label>
            <input type="date" className="input" value={form.photoContext.activityDate} onChange={(e) => updateCtx('activityDate', e.target.value)} />
          </div>
          <div>
            <label className="label">活动地点</label>
            <input className="input" value={form.photoContext.location || ''} onChange={(e) => updateCtx('location', e.target.value)} placeholder="可选" />
          </div>
          <div>
            <label className="label">拍摄人</label>
            <input className="input" value={form.photoContext.photographer || ''} onChange={(e) => updateCtx('photographer', e.target.value)} placeholder="可选" />
          </div>
        </div>

        <div>
          <label className="label">活动描述</label>
          <textarea className="input min-h-[70px]" value={form.photoContext.description || ''} onChange={(e) => updateCtx('description', e.target.value)} placeholder="可选，补充照片相关说明..." />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">监护人姓名 *</label>
            <input className="input" value={form.guardianName} onChange={(e) => update('guardianName', e.target.value)} placeholder="请输入监护人姓名" />
          </div>
          <div>
            <label className="label">联系电话</label>
            <input className="input" value={form.guardianContact || ''} onChange={(e) => update('guardianContact', e.target.value)} placeholder="可选" />
          </div>
        </div>

        <div>
          <label className="label">授权范围 *（至少选择一项）</label>
          <div className="flex flex-wrap gap-2">
            {SCOPE_OPTIONS.map((scope) => {
              const active = form.authorizedScopes.includes(scope);
              return (
                <button
                  type="button"
                  key={scope}
                  onClick={() => toggleScope(scope)}
                  className={`tag text-sm py-1.5 px-3 transition-all ${
                    active ? 'bg-sage-500 text-white' : 'bg-cream-100 text-ink-700 hover:bg-cream-200'
                  }`}
                >
                  {active ? '✓ ' : ''}
                  {scope}
                </button>
              );
            })}
          </div>
        </div>

        {supplementOf && (
          <div>
            <label className="label">补录说明</label>
            <textarea
              className="input min-h-[70px]"
              value={form.changeReasonNote || ''}
              onChange={(e) => update('changeReasonNote', e.target.value)}
              placeholder="请说明补录原因，如：育儿嫂发现课堂照片不完整..."
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '保存中...' : supplementOf ? '确认补录' : '创建记录'}
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
        </div>
      </form>
    </div>
  );
}
