import { useEffect, useState } from 'react';
import Modal from './Modal';
import { recordsApi } from '@/api/records';
import { useAppStore } from '@/store/useAppStore';
import { showToast } from './Toast';
import type { FeedingMethod, MilkRecord, Shift } from '@shared/types';
import { FeedingMethodLabel, ShiftLabel } from '@shared/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editRecord?: MilkRecord | null;
}

const shifts: Shift[] = ['morning', 'afternoon', 'night'];
const methods: FeedingMethod[] = ['breast', 'formula', 'mixed', 'other'];

export default function RecordFormModal({ open, onClose, onSaved, editRecord }: Props) {
  const currentUser = useAppStore((s) => s.currentUser);
  const [babyName, setBabyName] = useState('');
  const [recordDate, setRecordDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState<Shift>('morning');
  const [milkAmountMl, setMilkAmountMl] = useState<number | ''>('');
  const [feedingMethod, setFeedingMethod] = useState<FeedingMethod>('formula');
  const [remark, setRemark] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editRecord) {
      setBabyName(editRecord.babyName);
      setRecordDate(editRecord.recordDate);
      setShift(editRecord.shift);
      setMilkAmountMl(editRecord.milkAmountMl);
      setFeedingMethod(editRecord.feedingMethod);
      setRemark(editRecord.remark);
    } else {
      setBabyName('');
      setRecordDate(new Date().toISOString().slice(0, 10));
      setShift('morning');
      setMilkAmountMl('');
      setFeedingMethod('formula');
      setRemark('');
    }
    setErrors([]);
  }, [open, editRecord]);

  async function handleSubmit() {
    const newErrors: string[] = [];
    if (!babyName.trim()) newErrors.push('请填写婴儿姓名');
    if (!recordDate) newErrors.push('请选择记录日期');
    if (recordDate && recordDate > new Date().toISOString().slice(0, 10)) {
      newErrors.push('记录日期不能晚于今天');
    }
    const ml = Number(milkAmountMl);
    if (milkAmountMl === '' || Number.isNaN(ml)) newErrors.push('请填写奶量数字');
    else if (ml < 1 || ml > 300) newErrors.push('奶量必须在 1-300 ml 之间');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors([]);
    setSubmitting(true);
    try {
      if (editRecord) {
        await recordsApi.update(editRecord.id, {
          babyName: babyName.trim(),
          recordDate,
          shift,
          milkAmountMl: ml,
          feedingMethod,
          remark,
          operator: currentUser,
        });
        showToast('记录已更新，变更历史已保存', 'success');
      } else {
        await recordsApi.create({
          babyName: babyName.trim(),
          recordDate,
          shift,
          milkAmountMl: ml,
          feedingMethod,
          remark,
          operator: currentUser,
        });
        showToast('记录已创建', 'success');
      }
      onSaved();
      onClose();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editRecord ? '修改奶量记录' : '新建奶量记录'}
      subtitle={editRecord ? `记录编号 ${editRecord.id}` : '录入家长群留言与纸质交接单的统一底账'}
      width="max-w-xl"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            取消
          </button>
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? '提交中…' : editRecord ? '保存修改' : '创建记录'}
          </button>
        </>
      }
    >
      {errors.length > 0 && (
        <div className="mb-5 rounded-lg bg-rose-50 border border-rose-100 p-3 text-sm text-rose-700 space-y-1">
          {errors.map((e, i) => (
            <div key={i}>· {e}</div>
          ))}
          <p className="text-xs text-rose-500 pt-1 border-t border-rose-100 mt-2">
            以上数据不会写入主记录，修改后再提交。
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">婴儿姓名 *</label>
          <input
            className="input"
            value={babyName}
            onChange={(e) => setBabyName(e.target.value)}
            placeholder="例如：张小宝"
          />
        </div>
        <div>
          <label className="label">记录日期 *</label>
          <input
            type="date"
            className="input"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label">班次 *</label>
          <div className="grid grid-cols-3 gap-2">
            {shifts.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setShift(s)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition border ${
                  shift === s
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-brand-400'
                }`}
              >
                {ShiftLabel[s]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">奶量 (ml) *</label>
          <input
            type="number"
            min={1}
            max={300}
            className="input"
            value={milkAmountMl}
            onChange={(e) => setMilkAmountMl(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="1 - 300"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">喂养方式 *</label>
          <div className="grid grid-cols-4 gap-2">
            {methods.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setFeedingMethod(m)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition border ${
                  feedingMethod === m
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-brand-400'
                }`}
              >
                {FeedingMethodLabel[m]}
              </button>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="label">备注</label>
          <textarea
            className="input min-h-[80px] resize-y"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="与家长群留言或纸质单的核对情况、异常说明等"
          />
        </div>
      </div>
    </Modal>
  );
}
