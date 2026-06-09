import type { Alarm } from '@/types';
import { useAlarmStore } from '@/store/useAlarmStore';
import { maskPhone } from '@/utils/mask';
import { useUserStore } from '@/store/useUserStore';
import { CheckSquare, Square, Edit3, AlertCircle } from 'lucide-react';

interface AlarmCardProps {
  alarm: Alarm;
  onClick: () => void;
}

const statusLabels: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已处理',
  reviewed: '已复核',
  withdrawn: '已撤回',
};

const severityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '严重',
};

export const AlarmCard = ({ alarm, onClick }: AlarmCardProps) => {
  const { selectedIds, toggleSelect } = useAlarmStore();
  const canExportRaw = useUserStore((state) => state.canExportRaw());
  const isSelected = selectedIds.includes(alarm.id);

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSelect(alarm.id);
    onClick();
  };

  return (
    <div
      className={`card-industrial cursor-pointer relative animate-fadeIn ${
        isSelected ? 'border-industrial-primaryLight ring-2 ring-blue-500/30' : ''
      } ${alarm.isManualSupplement ? 'border-industrial-warning/50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={handleSelect}
          className="mt-1 text-industrial-textMuted hover:text-industrial-primaryLight transition-colors"
        >
          {isSelected ? (
            <CheckSquare className="w-5 h-5 text-industrial-primaryLight" />
          ) : (
            <Square className="w-5 h-5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-industrial-text font-medium">
                {alarm.bladeNo}
              </span>
              {alarm.isManualSupplement && (
                <span className="flex items-center gap-1 text-xs text-industrial-warning">
                  <Edit3 className="w-3 h-3" />
                  周顾问补录
                </span>
              )}
            </div>
            <span className={`badge severity-${alarm.severity}`}>
              {severityLabels[alarm.severity]}
            </span>
          </div>

          <div className="mb-2">
            <div className="text-sm text-industrial-text font-medium">
              {alarm.siteName}
            </div>
            <div className="text-xs text-industrial-textMuted">
              {alarm.defectType}
            </div>
          </div>

          {alarm.conclusion && (
            <div className="mb-2 text-sm text-industrial-textMuted line-clamp-2">
              <AlertCircle className="w-3 h-3 inline mr-1" />
              {alarm.conclusion}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className={`badge status-${alarm.status}`}>
              {statusLabels[alarm.status]}
            </span>
            <div className="flex items-center gap-3 text-xs text-industrial-textMuted">
              <span>{alarm.handler}</span>
              <span>{canExportRaw ? alarm.contactPhone : maskPhone(alarm.contactPhone)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
