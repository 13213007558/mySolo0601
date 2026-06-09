import { Check, Loader2, AlertCircle, HardDrive, Clock } from 'lucide-react';
import { useOilTempStore } from '@/store/useOilTempStore';

export function StatusBar() {
  const { saveStatus, lastSavedAt, records, conflicts, supplementRecords } = useOilTempStore();

  const unresolvedConflicts = conflicts.filter(c => !c.resolved).length;

  const getStatusIndicator = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-1.5 text-blue-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-xs">保存中...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-1.5 text-emerald-400 animate-fade-in">
            <Check className="w-3.5 h-3.5" />
            <span className="text-xs">已保存</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-red-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-xs">保存失败</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-slate-500">
            <HardDrive className="w-3.5 h-3.5" />
            <span className="text-xs">本地存储</span>
          </div>
        );
    }
  };

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return '从未';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="h-8 bg-slate-900 border-t border-slate-700 px-4 flex items-center justify-between text-xs">
      <div className="flex items-center gap-4">
        {getStatusIndicator()}
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>上次保存: {formatTime(lastSavedAt)}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-slate-400">
          数据记录: <span className="text-slate-200 font-mono">{records.length}</span>
        </div>
        <div className="text-slate-400">
          补录记录: <span className="text-slate-200 font-mono">{supplementRecords.length}</span>
        </div>
        {unresolvedConflicts > 0 && (
          <div className="flex items-center gap-1 text-amber-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>待处理冲突: {unresolvedConflicts}</span>
          </div>
        )}
      </div>
    </div>
  );
}
