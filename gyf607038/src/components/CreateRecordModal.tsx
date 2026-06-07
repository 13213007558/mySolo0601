import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { NewRecordInput } from '@/utils/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: NewRecordInput) => void;
}

export default function CreateRecordModal({ open, onClose, onSubmit }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<NewRecordInput>({
    infantName: '',
    batchNo: `WT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
    gender: 'male',
    birthDate: today,
    parentName: '',
    phone: '',
    parentVisibleContent: '',
    internalNotes: '',
    originalPromise: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        infantName: '',
        batchNo: `WT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
        gender: 'male',
        birthDate: today,
        parentName: '',
        phone: '',
        parentVisibleContent: '',
        internalNotes: '',
        originalPromise: '',
      });
    }
  }, [open, today]);

  if (!open) return null;

  const valid =
    form.infantName.trim() &&
    form.batchNo.trim() &&
    form.parentName.trim() &&
    form.phone.trim();

  const submit = () => {
    if (!valid) return;
    onSubmit(form);
    onClose();
  };

  const field = (key: keyof NewRecordInput, value: string | number) =>
    setForm({ ...form, [key]: value } as NewRecordInput);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <div className="text-base font-semibold text-slate-800">新增婴幼儿记录</div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          <div>
            <label className="label">批次号 <span className="text-red-500">*</span></label>
            <input className="input" value={form.batchNo} onChange={(e) => field('batchNo', e.target.value)} />
          </div>
          <div>
            <label className="label">婴幼儿姓名 <span className="text-red-500">*</span></label>
            <input className="input" value={form.infantName} onChange={(e) => field('infantName', e.target.value)} />
          </div>
          <div>
            <label className="label">性别</label>
            <select className="input" value={form.gender} onChange={(e) => field('gender', e.target.value as 'male' | 'female')}>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
          <div>
            <label className="label">出生日期</label>
            <input type="date" className="input" value={form.birthDate} onChange={(e) => field('birthDate', e.target.value)} />
          </div>
          <div>
            <label className="label">家长姓名 <span className="text-red-500">*</span></label>
            <input className="input" value={form.parentName} onChange={(e) => field('parentName', e.target.value)} />
          </div>
          <div>
            <label className="label">联系电话 <span className="text-red-500">*</span></label>
            <input className="input" value={form.phone} onChange={(e) => field('phone', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">家长可见内容 <span className="text-xs text-slate-400 font-normal">（授权/试听安排等）</span></label>
            <textarea rows={2} className="input" value={form.parentVisibleContent} onChange={(e) => field('parentVisibleContent', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">原始承诺 <span className="text-xs text-slate-400 font-normal">（首次登记的承诺，后续状态变更不会覆盖此字段）</span></label>
            <textarea rows={2} className="input" value={form.originalPromise} onChange={(e) => field('originalPromise', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">内部备注 <span className="text-xs text-slate-400 font-normal">（仅内部可见）</span></label>
            <textarea rows={2} className="input" value={form.internalNotes} onChange={(e) => field('internalNotes', e.target.value)} />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2 sticky bottom-0 bg-white">
          <button onClick={onClose} className="btn-secondary">取消</button>
          <button onClick={submit} disabled={!valid} className="btn-primary">保存新增</button>
        </div>
      </div>
    </div>
  );
}
