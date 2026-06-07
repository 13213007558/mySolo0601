import { Phone, Thermometer, FileText, Clock, AlertCircle } from 'lucide-react';
import type { Baby } from '../../shared/types';
import { cn } from '../lib/utils';

interface Props {
  baby: Baby;
  selected: boolean;
  onClick: () => void;
}

export default function BabyCard({ baby, selected, onClick }: Props) {
  const hasIssues = !baby.phoneValid || baby.temperatures.length === 0;

  const statusCfg = {
    pending: { label: '待复核', cls: 'bg-clay-100 text-clay-700 border-clay-200' },
    reviewed: { label: '已复核', cls: 'bg-sage-100 text-sage-700 border-sage-200' },
    confirmed: { label: '已确认', cls: 'bg-ink-200 text-ink-700 border-ink-300' },
  }[baby.checkStatus];

  return (
    <div
      onClick={onClick}
      className={cn(
        'paper-card p-5 cursor-pointer transition-all duration-200 hover:shadow-paper-lg',
        selected && 'ring-2 ring-sage-400 border-sage-300',
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="h-display text-xl truncate">{baby.name}</h3>
            {baby.isManual && (
              <span className="chip bg-clay-50 text-clay-600 border border-clay-200">
                <FileText className="w-3 h-3" />
                手工补录
              </span>
            )}
          </div>
          <div className="text-xs text-ink-500 flex items-center gap-2">
            <span>{baby.room}</span>
            <span className="divider-dot" />
            <span>{baby.className}</span>
            <span className="divider-dot" />
            <span>{baby.id}</span>
          </div>
        </div>
        <span className={`chip border ${statusCfg.cls} shrink-0`}>{statusCfg.label}</span>
      </div>

      <div className="space-y-2 text-sm">
        <div className={cn('flex items-center gap-2', !baby.phoneValid && 'text-clay-600')}>
          <Phone className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{baby.phone || '—'}</span>
          {!baby.phoneValid && baby.phone && (
            <span className="chip bg-clay-50 text-clay-600 border border-clay-200 ml-auto">格式异常</span>
          )}
          {!baby.phone && (
            <span className="chip bg-clay-50 text-clay-600 border border-clay-200 ml-auto">缺失</span>
          )}
        </div>

        <div className={cn('flex items-center gap-2', baby.temperatures.length === 0 && 'text-clay-600')}>
          <Thermometer className="w-3.5 h-3.5 shrink-0" />
          <span>
            {baby.temperatures.length > 0
              ? `${baby.temperatures.length} 条体温记录`
              : '暂无体温枪记录'}
          </span>
          {baby.temperatures.length === 0 && (
            <AlertCircle className="w-3.5 h-3.5 ml-auto" />
          )}
        </div>

        {baby.leaves.length > 0 && (
          <div className="flex items-center gap-2 text-ink-600">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>{baby.leaves.length} 张请假条</span>
          </div>
        )}

        {baby.notes.length > 0 && (
          <div className="flex items-center gap-2 text-ink-600">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{baby.notes.length} 条备注历史</span>
          </div>
        )}
      </div>

      {hasIssues && (
        <div className="mt-3 pt-3 border-t border-ink-100 flex items-center gap-1.5 text-xs text-clay-600">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>存在待完善信息，请点击查看详情</span>
        </div>
      )}
    </div>
  );
}
