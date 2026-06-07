import { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
  onConfirm: (reason: string, operator: string) => void;
}

export default function OverrideModal({ onClose, onConfirm }: Props) {
  const [reason, setReason] = useState('');
  const [operator, setOperator] = useState('护理主管');

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim(), operator.trim() || '护理主管');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-warm-900/40 backdrop-blur-sm p-4 animate-fade-in-up"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-warm-100 bg-white shadow-card"
      >
        <div className="flex items-center justify-between border-b border-warm-100 px-5 py-3.5">
          <div>
            <h3 className="font-serif text-lg font-semibold text-warm-900">
              人工改判
            </h3>
            <p className="mt-0.5 text-xs text-warm-500">
              改判理由将永久留痕，请谨慎填写
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-warm-500 transition-colors hover:bg-warm-100 hover:text-warm-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
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
          <div>
            <label className="mb-1 block text-xs font-medium text-warm-700">
              改判理由 <span className="text-coral-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="例如：经核实为专用低敏花生粉，家属签字确认耐受..."
              className="w-full resize-none rounded-xl border border-warm-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-sage-400 focus:ring-2 focus:ring-sage-100"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-warm-100 bg-white px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-warm-200 bg-white px-4 py-2 text-sm font-medium text-warm-700 transition-colors hover:bg-warm-50"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim()}
            className="rounded-xl bg-amber2-500 px-4 py-2 text-sm font-medium text-white transition-all duration-200 shadow-soft hover:bg-amber2-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            确认改判
          </button>
        </div>
      </div>
    </div>
  );
}
