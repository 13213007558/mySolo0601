import { CheckCircle, AlertTriangle, Clock, RotateCcw, X } from 'lucide-react';
import type { RecordStatus } from '@/types';
import { useOilTempStore } from '@/store/useOilTempStore';

export function BatchActionBar() {
  const { selectedIds, batchUpdateStatus, clearSelection, records } = useOilTempStore();

  const selectedRecords = records.filter(r => selectedIds.includes(r.id));
  const hasSelection = selectedIds.length > 0;

  if (!hasSelection) return null;

  const handleBatchUpdate = (status: RecordStatus) => {
    batchUpdateStatus(selectedIds, status);
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <span className="text-blue-400 text-sm font-medium">
            已选择 {selectedIds.length} 条记录
          </span>
        </div>

        <div className="h-6 w-px bg-slate-600" />

        <button
          onClick={() => handleBatchUpdate('normal')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm rounded-lg border border-emerald-500/30 transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          标记正常
        </button>

        <button
          onClick={() => handleBatchUpdate('abnormal')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm rounded-lg border border-amber-500/30 transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          标记异常
        </button>

        <button
          onClick={() => handleBatchUpdate('pending')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm rounded-lg border border-blue-500/30 transition-colors"
        >
          <Clock className="w-4 h-4" />
          标记待复核
        </button>

        <button
          onClick={() => handleBatchUpdate('unmarked')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 text-sm rounded-lg border border-slate-600 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          重置标记
        </button>

        <div className="h-6 w-px bg-slate-600" />

        <button
          onClick={clearSelection}
          className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          title="取消选择"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
