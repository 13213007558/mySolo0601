import { useState } from 'react';
import { Clock, User, Edit3, Upload, FileSpreadsheet, PlusCircle, Filter, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useParkingStore } from '../../store/parkingStore';
import type { OperationType, UserRole } from '../../types';
import { OPERATION_TYPE_LABELS } from '../../types';
import { cn, formatDateTime } from '../../utils/helpers';
import DiffViewer from './DiffViewer';

const operationIcons: Record<OperationType, any> = {
  status_update: Edit3,
  screenshot_upload: Upload,
  export_correction: FileSpreadsheet,
  manual_entry: PlusCircle,
};

const operationColors: Record<OperationType, string> = {
  status_update: 'text-alert-orange bg-alert-orange/20',
  screenshot_upload: 'text-blue-400 bg-blue-400/20',
  export_correction: 'text-primary bg-primary/20',
  manual_entry: 'text-alert-green bg-alert-green/20',
};

const HistoryTimeline = () => {
  const { history, spots } = useParkingStore();
  const [filterOperator, setFilterOperator] = useState<string>('all');
  const [filterType, setFilterType] = useState<OperationType | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const operators = Array.from(new Set(history.map((h) => h.operator)));

  const filteredHistory = history.filter((h) => {
    if (filterOperator !== 'all' && h.operator !== filterOperator) return false;
    if (filterType !== 'all' && h.operationType !== filterType) return false;
    return true;
  });

  const getRoleLabel = (role: UserRole) => {
    return role === 'admin' ? '管理员' : '值班人员';
  };

  const getSpotInfo = (spotId: string) => {
    return spots.find((s) => s.id === spotId);
  };

  return (
    <div>
      <div className="card-industrial p-4 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Filter size={18} className="text-industrial-muted" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-industrial-muted">操作人：</label>
              <select
                value={filterOperator}
                onChange={(e) => setFilterOperator(e.target.value)}
                className="bg-industrial-bg border border-industrial-border rounded-sm px-3 py-1.5 text-sm text-industrial-text"
              >
                <option value="all">全部</option>
                {operators.map((op) => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-industrial-muted">操作类型：</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as OperationType | 'all')}
                className="bg-industrial-bg border border-industrial-border rounded-sm px-3 py-1.5 text-sm text-industrial-text"
              >
                <option value="all">全部</option>
                {(Object.keys(OPERATION_TYPE_LABELS) as OperationType[]).map((type) => (
                  <option key={type} value={type}>{OPERATION_TYPE_LABELS[type]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="ml-auto text-sm text-industrial-muted">
            共 {filteredHistory.length} 条记录
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-industrial-border" />

        <div className="space-y-4">
          {filteredHistory.map((item, idx) => {
            const Icon = operationIcons[item.operationType];
            const isExpanded = expandedId === item.id;
            const spotInfo = getSpotInfo(item.spotId);

            return (
              <div key={item.id} className="relative pl-14">
                <div className={cn(
                  'absolute left-4 w-5 h-5 rounded-full border-2 border-industrial-bg flex items-center justify-center',
                  operationColors[item.operationType]
                )}>
                  <Icon size={12} />
                </div>

                <div
                  className={cn(
                    'card-industrial cursor-pointer transition-all',
                    isExpanded && 'ring-2 ring-primary'
                  )}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={cn(
                            'px-2 py-0.5 text-xs font-medium rounded-sm',
                            operationColors[item.operationType]
                          )}>
                            {OPERATION_TYPE_LABELS[item.operationType]}
                          </span>
                          <span className="font-mono-nums font-bold text-industrial-text">
                            {item.spotNumber}
                          </span>
                          {spotInfo?.vehiclePlate && (
                            <span className="text-sm text-industrial-muted font-mono-nums">
                              {spotInfo.vehiclePlate}
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-industrial-text mb-2">
                          {item.reason}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-industrial-muted">
                          <div className="flex items-center gap-1">
                            <User size={12} />
                            {item.operator}
                            <span className="opacity-60">({getRoleLabel(item.operatorRole)})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatDateTime(item.timestamp)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {(Object.keys(item.beforeData).length > 0 || Object.keys(item.afterData).length > 0) && (
                          <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-sm">
                            有字段变更
                          </span>
                        )}
                        {item.screenshotBefore && item.screenshotAfter && (
                          <span className="text-xs text-alert-green bg-alert-green/10 px-2 py-0.5 rounded-sm">
                            有截图对比
                          </span>
                        )}
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </div>

                  <div className={cn(
                    'expandable-content border-t border-industrial-border',
                    isExpanded ? 'expanded' : 'collapsed'
                  )}>
                    <div className="p-4 bg-industrial-bg/50">
                      <DiffViewer historyItem={item} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredHistory.length === 0 && (
          <div className="card-industrial p-12 text-center">
            <Clock size={48} className="mx-auto text-industrial-muted mb-4 opacity-30" />
            <div className="text-xl font-medium text-industrial-text mb-2">暂无操作记录</div>
            <div className="text-industrial-muted">没有符合筛选条件的操作历史</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryTimeline;
