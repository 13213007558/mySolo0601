import { ArrowRight, Camera, Hash } from 'lucide-react';
import type { OperationHistory } from '../../types';
import { STATUS_LABELS } from '../../types';
import { cn } from '../../utils/helpers';

interface DiffViewerProps {
  historyItem: OperationHistory;
}

const fieldLabels: Record<string, string> = {
  status: '状态',
  exportValue: '系统导出值',
  actualValue: '实际状态值',
  hasAlert: '是否告警',
  alertType: '告警类型',
  vehiclePlate: '车牌号',
  chargePower: '充电功率',
};

const formatValue = (key: string, value: any): string => {
  if (key === 'status') {
    return STATUS_LABELS[value as keyof typeof STATUS_LABELS] || value;
  }
  if (key === 'exportValue' || key === 'actualValue') {
    return `${value} (${value === 1 ? '占用' : '空闲'})`;
  }
  if (key === 'hasAlert') {
    return value ? '是' : '否';
  }
  if (key === 'chargePower' && value !== undefined) {
    return `${value} kW`;
  }
  if (key === 'alertType') {
    const alertLabels: Record<string, string> = {
      export_mismatch: '数据不一致',
      long_occupation: '长时间占用',
      offline: '设备离线',
    };
    return value ? alertLabels[value] || value : '无';
  }
  return String(value ?? '—');
};

const DiffViewer = ({ historyItem }: DiffViewerProps) => {
  const changedFields = Object.keys(historyItem.afterData).filter(
    (key) => JSON.stringify(historyItem.beforeData[key as keyof typeof historyItem.beforeData]) !==
            JSON.stringify(historyItem.afterData[key as keyof typeof historyItem.afterData])
  );

  const hasFieldChanges = changedFields.length > 0;
  const hasScreenshotDiff = historyItem.screenshotBefore && historyItem.screenshotAfter;

  return (
    <div className="space-y-4">
      {hasFieldChanges && (
        <div>
          <div className="text-sm font-medium text-industrial-text mb-3 flex items-center gap-2">
            <Hash size={16} className="text-primary" />
            字段变更
          </div>
          <div className="space-y-2">
            {changedFields.map((field) => {
              const beforeVal = historyItem.beforeData[field as keyof typeof historyItem.beforeData];
              const afterVal = historyItem.afterData[field as keyof typeof historyItem.afterData];
              const isValueChange = field === 'exportValue' || field === 'actualValue';

              return (
                <div
                  key={field}
                  className="flex items-center gap-3 bg-industrial-card p-3 rounded-sm"
                >
                  <div className="w-28 text-sm text-industrial-muted shrink-0">
                    {fieldLabels[field] || field}
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <div className={cn(
                      'flex-1 p-2 rounded-sm font-mono-nums text-sm',
                      isValueChange ? 'bg-alert-red/20 text-alert-red' : 'bg-industrial-bg text-industrial-muted'
                    )}>
                      {formatValue(field, beforeVal)}
                    </div>
                    <ArrowRight size={16} className="text-industrial-muted shrink-0" />
                    <div className={cn(
                      'flex-1 p-2 rounded-sm font-mono-nums text-sm',
                      isValueChange ? 'bg-alert-green/20 text-alert-green' : 'bg-industrial-bg text-industrial-text'
                    )}>
                      {formatValue(field, afterVal)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasScreenshotDiff && (
        <div>
          <div className="text-sm font-medium text-industrial-text mb-3 flex items-center gap-2">
            <Camera size={16} className="text-alert-green" />
            截图对比
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-industrial-muted mb-2 text-center">补录前</div>
              <div className="aspect-video bg-industrial-card rounded-sm overflow-hidden relative">
                <img
                  src={historyItem.screenshotBefore}
                  alt="补录前截图"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-alert-red/80 text-white text-xs px-2 py-0.5 rounded-sm">
                  之前
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs text-industrial-muted mb-2 text-center">补录后</div>
              <div className="aspect-video bg-industrial-card rounded-sm overflow-hidden relative">
                <img
                  src={historyItem.screenshotAfter}
                  alt="补录后截图"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-alert-green/80 text-white text-xs px-2 py-0.5 rounded-sm">
                  现在
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!hasFieldChanges && !hasScreenshotDiff && historyItem.screenshotAfter && (
        <div>
          <div className="text-sm font-medium text-industrial-text mb-3 flex items-center gap-2">
            <Camera size={16} className="text-blue-400" />
            上传截图
          </div>
          <div className="aspect-video max-w-md bg-industrial-card rounded-sm overflow-hidden">
            <img
              src={historyItem.screenshotAfter}
              alt="上传的截图"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {!hasFieldChanges && !hasScreenshotDiff && !historyItem.screenshotAfter && (
        <div className="text-sm text-industrial-muted text-center py-4">
          该操作无具体变更内容
        </div>
      )}
    </div>
  );
};

export default DiffViewer;
