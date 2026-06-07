import { useState } from 'react';
import { X, Plus, Loader2, Check } from 'lucide-react';
import { appStore } from '@/store/app';
import type { ItemType, RecordStatus } from '@shared/types';
import { ITEM_TYPE_LABEL, RECORD_STATUS_LABEL } from '@shared/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const babyOptions = [
  { id: 'b_s1', name: '小明', classId: 'c_small', className: '小班' },
  { id: 'b_s2', name: '小红', classId: 'c_small', className: '小班' },
  { id: 'b_s3', name: '小刚', classId: 'c_small', className: '小班' },
  { id: 'b_s4', name: '小丽', classId: 'c_small', className: '小班' },
  { id: 'b_m1', name: '小华', classId: 'c_middle', className: '中班' },
  { id: 'b_m2', name: '小强', classId: 'c_middle', className: '中班' },
  { id: 'b_m3', name: '小芳', classId: 'c_middle', className: '中班' },
  { id: 'b_m4', name: '小军', classId: 'c_middle', className: '中班' },
  { id: 'b_l1', name: '小伟', classId: 'c_large', className: '大班' },
  { id: 'b_l2', name: '小敏', classId: 'c_large', className: '大班' },
  { id: 'b_l3', name: '小磊', classId: 'c_large', className: '大班' },
  { id: 'b_l4', name: '小燕', classId: 'c_large', className: '大班' },
];

export default function ManualRecordModal({ open, onClose }: Props) {
  const [babyId, setBabyId] = useState('');
  const [itemType, setItemType] = useState<ItemType>('bottle');
  const [itemName, setItemName] = useState('');
  const [status, setStatus] = useState<RecordStatus>('disinfected');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const { currentUser, createManualRecord } = appStore();

  if (!open) return null;

  const selectedBaby = babyOptions.find((b) => b.id === babyId);

  async function submit() {
    if (!babyId || !itemName.trim()) return;
    if (!selectedBaby) return;
    setSubmitting(true);
    await createManualRecord({
      babyId: selectedBaby.id,
      babyName: selectedBaby.name,
      classId: selectedBaby.classId,
      itemType,
      itemName: itemName.trim(),
      status,
      operatorId: currentUser?.id || 'u_disinfector',
      operatorName: currentUser?.name || '张消毒',
      remark: remark.trim() || undefined,
    });
    setDone(true);
    setSubmitting(false);
  }

  function reset() {
    setBabyId('');
    setItemType('bottle');
    setItemName('');
    setStatus('disinfected');
    setRemark('');
    setDone(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-primary text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            <h3 className="font-serif-sc text-lg font-bold">手工补录消毒记录</h3>
          </div>
          <button onClick={reset} className="hover:bg-white/20 rounded p-1 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!done ? (
          <div className="p-5 space-y-4">
            <div className="bg-primary-50 border border-primary-100 rounded-lg p-3 text-xs text-primary-700">
              补录记录将自动标记为"手工补录"，操作人、时间会被永久记入审计日志，供主管复查。
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                选择宝宝 <span className="text-red-500">*</span>
              </label>
              <select
                value={babyId}
                onChange={(e) => setBabyId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="">请选择...</option>
                {babyOptions.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.className} - {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">用品类型</label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value as ItemType)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  {(Object.keys(ITEM_TYPE_LABEL) as ItemType[]).map((k) => (
                    <option key={k} value={k}>
                      {ITEM_TYPE_LABEL[k]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">处理状态</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RecordStatus)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  {(Object.keys(RECORD_STATUS_LABEL) as RecordStatus[]).map((k) => (
                    <option key={k} value={k}>
                      {RECORD_STATUS_LABEL[k]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                用品名称 <span className="text-red-500">*</span>
              </label>
              <input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="例：贝亲奶瓶240ml"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">补录备注</label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={3}
                placeholder="例：夜班交接时发现漏登记，实际消毒时间18:50"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={reset}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
              >
                取消
              </button>
              <button
                onClick={submit}
                disabled={!babyId || !itemName.trim() || submitting}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                提交补录
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white mx-auto">
              <Check className="w-10 h-10" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800">补录成功</p>
              <p className="text-sm text-gray-500 mt-1">记录已写入并同步至班级页、宝宝详情及导出清单</p>
            </div>
            <button
              onClick={reset}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-600 transition"
            >
              完成
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
