import { useState, useEffect } from 'react';
import { X, AlertTriangle, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuditStore } from '@/store/auditStore';
import { useViewStore } from '@/store/viewStore';
import AnomalyFeedback from './AnomalyFeedback';

export default function UndoModal() {
  const { showUndoModal, closeUndoModal, undoReason, setUndoReason, undoOperation, previousUndoReason, selectedLogId } = useAuditStore();
  const { anomalyState, setAnomalyState } = useViewStore();
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (previousUndoReason && showUndoModal) {
      setAnomalyState('undo_reason_override');
    }
  }, [previousUndoReason, showUndoModal]);

  const handleSubmit = () => {
    if (!undoReason.trim()) {
      alert('请输入撤回原因');
      return;
    }

    if (previousUndoReason) {
      const confirmed = confirm('将覆盖历史撤回原因，是否继续？');
      if (!confirmed) return;
    }

    if (selectedLogId) {
      const undoLog = undoOperation(selectedLogId, undoReason);

      if (undoLog && undoLog.oldValue) {
        useValveStore.getState().updateRecord(undoLog.recordId, undoLog.oldValue);
      }

      const newFilters = useViewStore.getState().filters;
      const newKeyword = useViewStore.getState().searchKeyword;
      useValveStore.getState().applyFilters(newFilters, newKeyword);
    }

    setAnomalyState(null);
  };

  if (!showUndoModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-slide-in">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-industrial-orange text-white">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertTriangle size={20} />
            撤回操作
          </h3>
          <button
            onClick={closeUndoModal}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 p-3 bg-industrial-orange/5 border border-industrial-orange/20 rounded-lg">
            <p className="text-sm text-gray-700">
              此操作将撤销该次修改，并将数据恢复到修改前的状态。请输入撤回原因以便后续审计。
            </p>
          </div>

          {anomalyState === 'undo_reason_override' && (
            <AnomalyFeedback type="undo_reason_override" />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">撤回原因</label>
            <textarea
              value={undoReason}
              onChange={(e) => setUndoReason(e.target.value)}
              placeholder="请详细说明撤回原因..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-industrial-orange focus:ring-1 focus:ring-industrial-orange resize-none"
            />
          </div>

          {previousUndoReason && (
            <div className="mt-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-industrial-orange transition-colors"
              >
                {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showHistory ? '收起' : '查看'}历史撤回原因
              </button>
              {showHistory && (
                <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 text-sm text-gray-600">
                  <p className="text-xs text-gray-400 mb-1">历史原因：</p>
                  <p className="font-mono">{previousUndoReason}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
          <button
            onClick={closeUndoModal}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-industrial-orange text-white rounded-lg text-sm font-medium hover:bg-industrial-orange/90 transition-colors flex items-center gap-2"
          >
            <Check size={16} />
            确认撤回
          </button>
        </div>
      </div>
    </div>
  );
}
