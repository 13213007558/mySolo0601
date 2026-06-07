import { useState } from 'react';
import { X, Save, Camera, Baby, User, Phone, BookOpen } from 'lucide-react';
import type { PhotoAuthType, PhotoScope } from '@shared/types';
import { AUTH_TYPE_LABEL, PHOTO_SCOPE_LABEL } from '@shared/types';

interface Props {
  onClose: () => void;
  onDone: () => void;
}

export default function ManualEntryModal({ onClose, onDone }: Props) {
  const [form, setForm] = useState({
    babyName: '',
    babyBirthday: '',
    className: '',
    parentName: '',
    parentPhone: '',
    authType: 'class_activity' as PhotoAuthType,
    photoScope: 'class_only' as PhotoScope,
    validStart: '',
    validEnd: '',
    originalCommitment: '',
  });
  const [operatorName, setOperatorName] = useState('陈顾问');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!form.babyName || !form.className || !form.parentName || !form.parentPhone || !form.originalCommitment) {
      setErr('婴幼儿姓名、班级、家长姓名、家长电话、原始承诺为必填');
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch('/api/records/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, operatorName }),
      });
      if (!res.ok) throw new Error((await res.json()).error || '提交失败');
      onDone();
    } catch (e: any) {
      setErr(e.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm({ ...form, [k]: v });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
      <div className="bg-white rounded-card shadow-xl border border-cream-200 w-full max-w-xl mx-4 animate-fade-in">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cream-200">
          <h3 className="font-serif text-lg font-semibold text-gray-800">手工补录 · 照片授权记录</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-cream-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          <div className="bg-brand-50 border border-brand-100 rounded-lg p-3 text-brand-700 text-xs leading-relaxed">
            补录记录将完整保留创建人、创建时间与原始承诺。后续变更仅追加历史版本，不会覆盖本记录的原始内容。
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="婴幼儿姓名" icon={<Baby className="w-3.5 h-3.5" />}>
              <input value={form.babyName} onChange={(e) => update('babyName', e.target.value)} className="input" placeholder="必填" />
            </Field>
            <Field label="出生日期">
              <input type="date" value={form.babyBirthday} onChange={(e) => update('babyBirthday', e.target.value)} className="input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="班级" icon={<BookOpen className="w-3.5 h-3.5" />}>
              <input value={form.className} onChange={(e) => update('className', e.target.value)} className="input" placeholder="如：向日葵班" />
            </Field>
            <Field label="操作人">
              <input value={operatorName} onChange={(e) => setOperatorName(e.target.value)} className="input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="家长姓名" icon={<User className="w-3.5 h-3.5" />}>
              <input value={form.parentName} onChange={(e) => update('parentName', e.target.value)} className="input" placeholder="必填" />
            </Field>
            <Field label="家长电话" icon={<Phone className="w-3.5 h-3.5" />}>
              <input value={form.parentPhone} onChange={(e) => update('parentPhone', e.target.value)} className="input" placeholder="必填" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="授权类型" icon={<Camera className="w-3.5 h-3.5" />}>
              <select value={form.authType} onChange={(e) => update('authType', e.target.value as PhotoAuthType)} className="input">
                {Object.entries(AUTH_TYPE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="使用范围">
              <select value={form.photoScope} onChange={(e) => update('photoScope', e.target.value as PhotoScope)} className="input">
                {Object.entries(PHOTO_SCOPE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="有效期起">
              <input type="date" value={form.validStart} onChange={(e) => update('validStart', e.target.value)} className="input" />
            </Field>
            <Field label="有效期止">
              <input type="date" value={form.validEnd} onChange={(e) => update('validEnd', e.target.value)} className="input" />
            </Field>
          </div>

          <Field label="家长原始承诺（必填，不可覆盖）">
            <textarea
              rows={3}
              value={form.originalCommitment}
              onChange={(e) => update('originalCommitment', e.target.value)}
              className="input resize-none"
              placeholder="例如：家长同意课堂活动照仅本班展示墙使用，有效期半年..."
            />
          </Field>

          {err && <div className="text-danger-600 text-xs bg-danger-100 border border-red-200 rounded-lg p-2">{err}</div>}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-cream-200">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-cream-100">
            取消
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {submitting ? '保存中...' : '保存为历史版本'}
          </button>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.45rem 0.6rem;
          border: 1px solid #eddbb6;
          border-radius: 0.5rem;
          background: #fdfbf7;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.15s;
        }
        .input:focus {
          border-color: #f19434;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(241, 148, 52, 0.15);
        }
      `}</style>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-gray-500 mb-1 flex items-center gap-1">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}
