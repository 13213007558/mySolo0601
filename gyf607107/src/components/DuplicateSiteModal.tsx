import { useAlarmStore } from '@/store/useAlarmStore';
import type { DuplicateSiteInfo } from '@/types';
import { AlertTriangle, X, Check, RotateCcw, Plus } from 'lucide-react';

interface DuplicateSiteModalProps {
  conflicts: DuplicateSiteInfo[];
  onClose: () => void;
}

export const DuplicateSiteModal = ({ conflicts, onClose }: DuplicateSiteModalProps) => {
  const { addAlarmsForce } = useAlarmStore();

  const handleResolveAll = (strategy: 'keep-existing' | 'replace' | 'keep-both') => {
    if (strategy === 'keep-existing') {
      alert('已保留现有数据，跳过冲突条目');
      useAlarmStore.getState().clearDuplicateConflicts();
      onClose();
      return;
    }

    if (strategy === 'replace') {
      const newAlarms = conflicts.map((c) => ({
        ...c.alarm,
        id: c.existingAlarm.id,
      }));
      newAlarms.forEach((alarm) => {
        useAlarmStore.getState().updateAlarm(alarm.id, alarm);
      });
      alert(`已替换 ${conflicts.length} 条冲突数据`);
      useAlarmStore.getState().clearDuplicateConflicts();
      onClose();
      return;
    }

    if (strategy === 'keep-both') {
      const newAlarms = conflicts.map((c) => ({
        ...c.alarm,
        siteName: `${c.alarm.siteName} (新)`,
      }));
      addAlarmsForce(newAlarms);
      alert(`已添加 ${conflicts.length} 条新数据（站点名称已标注"新"）`);
      onClose();
      return;
    }
  };

  if (conflicts.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-industrial-card border border-industrial-warning/50 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between p-4 border-b border-industrial-border bg-industrial-warning/10">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-industrial-warning" />
            <h3 className="text-lg font-semibold text-industrial-text">发现同名站点冲突</h3>
          </div>
          <button
            onClick={onClose}
            className="text-industrial-textMuted hover:text-industrial-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 text-sm text-industrial-textMuted border-b border-industrial-border">
          检测到 <span className="text-industrial-warning font-bold">{conflicts.length}</span> 条数据与现有站点同名。
          请选择处理方式（页面数据不会被清空）：
        </div>

        <div className="p-4 overflow-y-auto max-h-80 scrollbar-thin space-y-3">
          {conflicts.map((conflict, index) => (
            <div
              key={conflict.alarm.id}
              className="p-3 bg-industrial-bg rounded border border-industrial-border animate-fadeIn"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-industrial-warning font-medium">
                  {conflict.alarm.siteName}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-2 bg-red-900/20 rounded border border-red-700/30">
                  <div className="text-xs text-red-400 mb-1">现有数据</div>
                  <div className="text-industrial-text">{conflict.existingAlarm.bladeNo}</div>
                  <div className="text-industrial-textMuted text-xs">
                    {conflict.existingAlarm.defectType} · {conflict.existingAlarm.handler}
                  </div>
                </div>
                <div className="p-2 bg-green-900/20 rounded border border-green-700/30">
                  <div className="text-xs text-green-400 mb-1">新导入数据</div>
                  <div className="text-industrial-text">{conflict.alarm.bladeNo}</div>
                  <div className="text-industrial-textMuted text-xs">
                    {conflict.alarm.defectType} · {conflict.alarm.handler}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-industrial-border">
          <div className="text-sm text-industrial-textMuted mb-3">批量处理所有冲突：</div>
          <div className="flex flex-wrap gap-3 justify-end">
            <button
              className="btn-industrial flex items-center gap-2"
              onClick={() => handleResolveAll('keep-existing')}
            >
              <Check className="w-4 h-4" />
              保留现有
            </button>
            <button
              className="btn-warning flex items-center gap-2"
              onClick={() => handleResolveAll('replace')}
            >
              <RotateCcw className="w-4 h-4" />
              替换现有
            </button>
            <button
              className="btn-success flex items-center gap-2"
              onClick={() => handleResolveAll('keep-both')}
            >
              <Plus className="w-4 h-4" />
              全部保留
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
