import { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  title?: string;
  onClose: () => void;
  onConfirm: (note: string, operator: string) => void;
}

export default function RectificationNoteModal({
  title = '填写整改备注',
  onClose,
  onConfirm,
}: Props) {
  const [note, setNote] = useState('');
  const [operator, setOperator] = useState('护理主管');

  const handleConfirm = () => {
    onConfirm(note.trim(), operator.trim() || '护理主管');
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
          <h3 className="font-serif text-lg font-semibold text-warm-900">{title}</h3>
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
              备注
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="例如：已通知厨房重新备料..."
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
            className="rounded-xl bg-sage-400 px-4 py-2 text-sm font-medium text-white transition-all duration-200 shadow-soft hover:bg-sage-500"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
