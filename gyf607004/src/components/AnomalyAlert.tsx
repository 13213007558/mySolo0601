import { cn } from '@/lib/utils';
import { ANOMALY_LABELS, type AnomalyDetail } from '@/types';
import { AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react';

interface AnomalyAlertProps {
  anomaly: AnomalyDetail | null;
  isIsolated: boolean;
}

export default function AnomalyAlert({ anomaly, isIsolated }: AnomalyAlertProps) {
  if (!anomaly || anomaly.type === 'none') return null;

  const isSevere = isIsolated || anomaly.type === 'invalid_data' || anomaly.type === 'missing_required';

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        isSevere
          ? 'bg-status-red/5 border-status-red/30'
          : 'bg-status-yellow/5 border-status-yellow/30'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
            isSevere ? 'bg-status-red/10 text-status-red' : 'bg-status-yellow/10 text-status-yellow'
          )}
        >
          {isIsolated ? (
            <ShieldAlert className="h-[18px] w-[18px]" />
          ) : isSevere ? (
            <AlertCircle className="h-[18px] w-[18px]" />
          ) : (
            <AlertTriangle className="h-[18px] w-[18px]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-sm font-semibold',
                isSevere ? 'text-status-red' : 'text-status-yellow'
              )}
            >
              {isIsolated ? '已隔离记录' : ANOMALY_LABELS[anomaly.type]}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-700">{anomaly.message}</p>
          {anomaly.resolution && (
            <p className="mt-2 text-xs text-gray-500">
              <span className="font-medium">建议处理：</span>
              {anomaly.resolution}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
