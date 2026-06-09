import { X, ArrowLeftRight, Camera, Hash } from 'lucide-react';
import type { OperationHistory } from '../../types';
import { STATUS_LABELS } from '../../types';
import { cn, formatDateTime } from '../../utils/helpers';

interface DiffComparisonModalProps {
  historyItem: OperationHistory;
  onClose: () => void;
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

const DiffComparisonModal = ({ historyItem, onClose }: DiffComparisonModalProps) => {
  const changedFields = Object.keys(historyItem.afterData).filter(
    (key) => JSON.stringify(historyItem.beforeData[key as keyof typeof historyItem.beforeData]) !==
            JSON.stringify(historyItem.afterData[key as keyof typeof historyItem.afterData])
  );

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
    return String(value ?? '—');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-industrial-card border border-industrial-border rounded-sm w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideIn">
        <div className="p-4 border-b border-industrial-border flex items-center justify-between sticky top-0 bg-industrial-card z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-sm flex items-center justify-center">
              <ArrowLeftRight size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-industrial-text">
                变更对比 - 车位 {historyItem.spotNumber}
              </h2>
              <p className="text-sm text-industrial-muted">
                操作人：{historyItem.operator} · {formatDateTime(historyItem.timestamp)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-industrial-border rounded-sm transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-industrial-bg/50 p-4 rounded-sm">
            <div className="text-sm font-medium text-industrial-text mb-1">操作原因</div>
            <div className="text-industrial-text">{historyItem.reason}</div>
          </div>

          {changedFields.length > 0 && (
            <div>
              <div className="text-sm font-medium text-industrial-text mb-3 flex items-center gap-2">
                <Hash size={16} className="text-primary" />
                字段变更详情
                <span className="text-xs text-industrial-muted font-normal">
                  ({changedFields.length} 个字段)
                </span>
              </div>
              <div className="space-y-3">
                {changedFields.map((field) => {
                  const beforeVal = historyItem.beforeData[field as keyof typeof historyItem.beforeData];
                  const afterVal = historyItem.afterData[field as keyof typeof historyItem.afterData];
                  const isValueChange = field === 'exportValue' || field === 'actualValue';

                  return (
                    <div
                      key={field}
                      className="grid grid-cols-[120px_1fr_auto_1fr] gap-4 items-center bg-industrial-bg p-4 rounded-sm"
                    >
                      <div className="text-sm font-medium text-industrial-muted">
                        {fieldLabels[field] || field}
                      </div>
                      <div className={cn(
                        'p-3 rounded-sm font-mono-nums text-center',
                        isValueChange ? 'bg-alert-red/20 text-alert-red' : 'bg-industrial-card text-industrial-muted'
                      )}>
                        {formatValue(field, beforeVal)}
                      </div>
                      <ArrowLeftRight size={20} className="text-primary mx-auto" />
                      <div className={cn(
                        'p-3 rounded-sm font-mono-nums text-center',
                        isValueChange ? 'bg-alert-green/20 text-alert-green' : 'bg-industrial-card text-industrial-text'
                      )}>
                        {formatValue(field, afterVal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {historyItem.screenshotBefore && historyItem.screenshotAfter && (
            <div>
              <div className="text-sm font-medium text-industrial-text mb-3 flex items-center gap-2">
                <Camera size={16} className="text-alert-green" />
                截图前后对比
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <div className="aspect-video bg-industrial-bg rounded-sm overflow-hidden">
                    <img
                      src={historyItem.screenshotBefore}
                      alt="补录前"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute top-3 left-3 bg-alert-red text-white text-xs font-medium px-3 py-1 rounded-sm">
                    变更前
                  </div>
                  <div className="mt-2 text-center text-xs text-industrial-muted">
                    原系统截图
                  </div>
                </div>
                <div className="relative">
                  <div className="aspect-video bg-industrial-bg rounded-sm overflow-hidden">
                    <img
                      src={historyItem.screenshotAfter}
                      alt="补录后"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute top-3 left-3 bg-alert-green text-white text-xs font-medium px-3 py-1 rounded-sm">
                    变更后
                  </div>
                  <div className="mt-2 text-center text-xs text-industrial-muted">
                    手工补录截图
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/30 rounded-sm flex items-center justify-center shrink-0">
                    <Camera size={18} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-primary mb-1">导出读回验证</div>
                    <div className="text-sm text-industrial-muted">
                      此补录操作已验证：补录前导出值显示为 {formatValue('exportValue', historyItem.beforeData.exportValue)}，
                      实际核实为 {formatValue('actualValue', historyItem.afterData.actualValue)}。
                      补录后系统将重新计算导出统计，确保数据一致性。
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!changedFields.length && !historyItem.screenshotBefore && !historyItem.screenshotAfter && (
            <div className="text-center py-12 text-industrial-muted">
              该操作无具体变更内容
            </div>
          )}
        </div>

        <div className="p-4 border-t border-industrial-border flex justify-end sticky bottom-0 bg-industrial-card">
          <button onClick={onClose} className="btn-primary">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiffComparisonModal;
