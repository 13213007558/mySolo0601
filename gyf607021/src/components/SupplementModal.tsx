import { useState } from 'react';
import { X, Plus, AlertTriangle, Sparkles, Thermometer } from 'lucide-react';
import type { Baby, MorningCheckRecord } from '../types';
import { useStore } from '../store';
import { getStatusLabel } from '../utils';

interface Props {
  open: boolean;
  onClose: () => void;
  record: MorningCheckRecord | null;
  baby: Baby | null;
}

export default function SupplementModal({ open, onClose, record, baby }: Props) {
  const { supplementRecord } = useStore();
  const [temperature, setTemperature] = useState<string>('');
  const [quickNote, setQuickNote] = useState<string>('');
  const [remark, setRemark] = useState<string>('');

  if (!open || !record || !baby) return null;

  const reset = () => {
    setTemperature('');
    setQuickNote('');
    setRemark('');
  };

  const handleSubmit = () => {
    const temp = parseFloat(temperature);
    const patch: Partial<MorningCheckRecord> = {};
    if (!isNaN(temp)) patch.temperature = temp;
    if (quickNote.trim()) patch.quickNote = quickNote.trim();
    if (remark.trim()) patch.remark = remark.trim();
    if (Object.keys(patch).length === 0) return;
    supplementRecord(record.id, patch);
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-brand-500 px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={20} />
              <h2 className="font-bold text-lg">手工补录晨检记录</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition">
              <X size={18} />
            </button>
          </div>
          <p className="text-xs text-white/80 mt-1">
            为 {baby.name}（{baby.className}）补录今日晨检信息，补录前后差异将自动留存
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <div className="text-xs font-medium text-indigo-700 mb-2 flex items-center gap-1.5">
              <Sparkles size={12} /> 补录前数据快照
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-white rounded px-2 py-1.5 border border-indigo-100">
                <div className="text-gray-400">体温</div>
                <div className="text-gray-700 font-medium">{record.temperature?.toFixed(1) || '未记录'}</div>
              </div>
              <div className="bg-white rounded px-2 py-1.5 border border-indigo-100">
                <div className="text-gray-400">状态</div>
                <div className="text-gray-700 font-medium">{getStatusLabel(record.status)}</div>
              </div>
              <div className="bg-white rounded px-2 py-1.5 border border-indigo-100">
                <div className="text-gray-400">快速备注</div>
                <div className="text-gray-700 font-medium truncate">{record.quickNote || '—'}</div>
              </div>
            </div>
          </div>

          {record.dirtyReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-red-700">
                <div className="font-medium mb-0.5">当前数据异常</div>
                <div>{record.dirtyReason}</div>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1.5">
              <Thermometer size={14} className="text-brand-500" />
              实际体温（℃）
            </label>
            <input
              type="number"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="例如：36.5"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 text-sm"
            />
            <div className="text-[11px] text-gray-400 mt-1">补录正常值（35~42℃）后数据质量将自动恢复为"正常"</div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">快速备注</label>
            <input
              type="text"
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              placeholder="例如：正常入园、状态良好"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">详细说明</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="详细说明晨检情况..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 text-sm resize-none"
            />
          </div>
        </div>

        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={() => { reset(); onClose(); }}
            className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!temperature && !quickNote && !remark}
            className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-medium transition flex items-center gap-1.5"
          >
            <Plus size={14} /> 确认补录
          </button>
        </div>
      </div>
    </div>
  );
}
