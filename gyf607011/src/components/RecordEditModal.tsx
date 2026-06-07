import { useState } from 'react';
import Modal from './Modal';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useRecordsStore } from '../stores/recordsStore';
import { useBabyStore } from '../stores/babyStore';
import type { CheckItemStatus } from '../../shared/types';

interface Props {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'manual';
  initialData?: {
    id?: string;
    babyId?: string;
    date?: string;
    temperature?: number;
    oralCheck?: CheckItemStatus;
    handCheck?: CheckItemStatus;
    skinCheck?: CheckItemStatus;
    remark?: string;
  };
  onSuccess?: () => void;
}

interface SubmitState {
  success: number[];
  failed: { index: number; error: string }[];
  message: string;
}

export default function RecordEditModal({ open, onClose, mode, initialData, onSuccess }: Props) {
  const [form, setForm] = useState({
    babyId: initialData?.babyId ?? '',
    date: initialData?.date ?? new Date().toISOString().slice(0, 10),
    temperature: initialData?.temperature ?? 36.5,
    oralCheck: initialData?.oralCheck ?? 'normal' as CheckItemStatus,
    handCheck: initialData?.handCheck ?? 'normal' as CheckItemStatus,
    skinCheck: initialData?.skinCheck ?? 'normal' as CheckItemStatus,
    remark: initialData?.remark ?? '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitState | null>(null);
  const { babies } = useBabyStore();
  const { updateRecord, createRecord, manualEntry } = useRecordsStore();

  const reset = () => {
    setForm({
      babyId: '',
      date: new Date().toISOString().slice(0, 10),
      temperature: 36.5,
      oralCheck: 'normal',
      handCheck: 'normal',
      skinCheck: 'normal',
      remark: '',
    });
    setSubmitResult(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitResult(null);
    try {
      let result: SubmitState | undefined;
      if (mode === 'edit' && initialData?.id) {
        const resp = await updateRecord(initialData.id, {
          temperature: form.temperature,
          oralCheck: form.oralCheck,
          handCheck: form.handCheck,
          skinCheck: form.skinCheck,
          remark: form.remark,
        }, '李护士');
        result = {
          success: resp.success ? [0] : [],
          failed: resp.success ? [] : [{ index: 0, error: '更新失败' }],
          message: resp.success ? '更新成功' : '更新失败',
        };
      } else if (mode === 'manual' && form.babyId) {
        const resp = await manualEntry(form.babyId, form.date, {
          temperature: form.temperature,
          oralCheck: form.oralCheck,
          handCheck: form.handCheck,
          skinCheck: form.skinCheck,
          remark: form.remark,
        }, '王护士');
        result = {
          success: resp.success ? [0] : [],
          failed: resp.success ? [] : [{ index: 0, error: '补录失败' }],
          message: resp.success ? '补录成功' : '补录失败',
        };
      } else {
        const resp = await createRecord([
          {
            babyId: form.babyId,
            date: form.date,
            temperature: form.temperature,
            oralCheck: form.oralCheck,
            handCheck: form.handCheck,
            skinCheck: form.skinCheck,
            remark: form.remark,
            operator: '李护士',
          },
        ]);
        if (resp?.data) {
          result = resp.data as SubmitState;
        }
      }
      setSubmitResult(result ?? { success: [], failed: [{ index: 0, error: '未知错误' }], message: '提交失败' });
      if (result && result.failed.length === 0) {
        setTimeout(() => {
          onSuccess?.();
          onClose();
          reset();
        }, 800);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === 'edit' ? '编辑晨检记录' : mode === 'manual' ? '手工补录晨检记录' : '新增晨检记录';

  const CheckSelect = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: CheckItemStatus;
    onChange: (v: CheckItemStatus) => void;
  }) => (
    <div>
      <label className="block text-sm font-medium text-medical-700 mb-1.5">{label}</label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange('normal')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            value === 'normal'
              ? 'bg-medical-500 text-white shadow-inset-medical'
              : 'bg-white border border-medical-100 text-medical-600 hover:border-medical-300'
          }`}
        >
          正常
        </button>
        <button
          type="button"
          onClick={() => onChange('abnormal')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            value === 'abnormal'
              ? 'bg-red-500 text-white'
              : 'bg-white border border-medical-100 text-medical-600 hover:border-red-300'
          }`}
        >
          异常
        </button>
      </div>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        {mode !== 'edit' && (
          <>
            <div>
              <label className="block text-sm font-medium text-medical-700 mb-1.5">选择宝宝</label>
              <select
                className="w-full px-3 py-2 rounded-lg bg-white border border-medical-100 text-medical-800 focus:outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-100"
                value={form.babyId}
                onChange={(e) => setForm({ ...form, babyId: e.target.value })}
              >
                <option value="">请选择宝宝</option>
                {babies.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}（{b.className}）
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-medical-700 mb-1.5">晨检日期</label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-lg bg-white border border-medical-100 text-medical-800 focus:outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-100"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
          </>
        )}
        <div>
          <label className="block text-sm font-medium text-medical-700 mb-1.5">体温 (°C)</label>
          <input
            type="number"
            step="0.1"
            min="35"
            max="42"
            className="w-full px-3 py-2 rounded-lg bg-white border border-medical-100 text-medical-800 font-mono focus:outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-100"
            value={form.temperature}
            onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <CheckSelect label="口腔检查" value={form.oralCheck} onChange={(v) => setForm({ ...form, oralCheck: v })} />
          <CheckSelect label="手部检查" value={form.handCheck} onChange={(v) => setForm({ ...form, handCheck: v })} />
          <CheckSelect label="皮肤检查" value={form.skinCheck} onChange={(v) => setForm({ ...form, skinCheck: v })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-medical-700 mb-1.5">备注</label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-white border border-medical-100 text-medical-800 focus:outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-100 resize-none"
            placeholder="请输入备注信息..."
            value={form.remark}
            onChange={(e) => setForm({ ...form, remark: e.target.value })}
          />
        </div>

        {submitResult && (
          <div
            className={`rounded-xl p-4 border ${
              submitResult.failed.length === 0
                ? 'bg-medical-50 border-medical-200'
                : submitResult.success.length > 0
                ? 'bg-warm-50 border-warm-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {submitResult.failed.length === 0 ? (
                <CheckCircle className="w-5 h-5 text-medical-600 flex-shrink-0 mt-0.5" />
              ) : submitResult.success.length > 0 ? (
                <AlertTriangle className="w-5 h-5 text-warm-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-medical-800">{submitResult.message}</p>
                {submitResult.success.length > 0 && (
                  <p className="text-xs text-medical-600 mt-1">
                    成功 {submitResult.success.length} 条
                  </p>
                )}
                {submitResult.failed.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {submitResult.failed.map((f) => (
                      <li key={f.index} className="text-xs text-red-700 flex items-start gap-1">
                        <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        第 {f.index + 1} 条：{f.error}（可重试）
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg bg-white border border-medical-100 text-medical-700 text-sm font-medium hover:bg-medical-50 transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || (mode !== 'edit' && !form.babyId)}
            className="flex-1 px-4 py-2.5 rounded-lg bg-medical-500 text-white text-sm font-medium shadow-inset-medical hover:bg-medical-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? '提交中...' : mode === 'manual' ? '确认补录' : '确认提交'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
