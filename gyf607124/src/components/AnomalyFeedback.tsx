import { AlertTriangle, FileX, RefreshCw, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useViewStore } from '@/store/viewStore';
import { useValveStore } from '@/store/valveStore';
import { useAuditStore } from '@/store/auditStore';
import type { AnomalyType } from '@/types';

interface AnomalyFeedbackProps {
  type: AnomalyType;
  onAction?: () => void;
}

export default function AnomalyFeedback({ type, onAction }: AnomalyFeedbackProps) {
  const { setAnomalyState, setChartSyncState, updateChartRenderTimestamp, filters, searchKeyword } = useViewStore();
  const { filteredRecords, applyFilters } = useValveStore();
  const { previousUndoReason } = useAuditStore();
  const [showHistory, setShowHistory] = useState(false);

  const configs: Record<AnomalyType, {
    title: string;
    description: string;
    icon: typeof AlertTriangle;
    bgColor: string;
    borderColor: string;
    textColor: string;
    showDismiss?: boolean;
    actionLabel?: string;
    onActionClick?: () => void;
  }> = {
    all_bad_rows: {
      title: '⚠️ 数据严重异常警告',
      description: '当前筛选结果中所有记录均标记为异常状态。请立即检查数据采集系统或联系管理员核实。',
      icon: AlertTriangle,
      bgColor: 'bg-industrial-red/10',
      borderColor: 'border-industrial-red/30',
      textColor: 'text-industrial-red',
      showDismiss: true,
    },
    empty_table: {
      title: '📋 暂无数据',
      description: '当前没有符合条件的巡检记录。点击下方按钮新增第一条记录。',
      icon: FileX,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-600',
      actionLabel: '+ 新增记录',
      onActionClick: () => {
        const emptyRecord = {
          recordDate: new Date().toISOString().split('T')[0],
          valveNo: '',
          opening: 0,
          temperature: 0,
          pressure: 0,
          status: 'normal' as const,
          operator: '值班员',
        };
        useValveStore.getState().openEditModal(emptyRecord as any);
      },
    },
    chart_not_sync: {
      title: '📊 图表数据未同步',
      description: '筛选条件已变更，图表显示的仍是旧数据。点击刷新按钮同步最新数据。',
      icon: RefreshCw,
      bgColor: 'bg-industrial-orange/10',
      borderColor: 'border-industrial-orange/30',
      textColor: 'text-industrial-orange',
      actionLabel: '🔄 刷新图表',
      onActionClick: () => {
        updateChartRenderTimestamp();
        setChartSyncState('synced');
      },
    },
    undo_reason_override: {
      title: '⚠️ 将覆盖历史撤回原因',
      description: '该记录已有撤回原因，保存新原因将覆盖原有记录。请确认是否继续。',
      icon: AlertCircle,
      bgColor: 'bg-industrial-orange/10',
      borderColor: 'border-industrial-orange/30',
      textColor: 'text-industrial-orange',
      showDismiss: true,
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  const handleDismiss = () => {
    setAnomalyState(null);
    if (type === 'chart_not_sync') {
      setChartSyncState('synced');
    }
    onAction?.();
  };

  if (type === 'all_bad_rows') {
    return (
      <div className="mb-4">
        <div className={`${config.bgColor} border ${config.borderColor} rounded-t-lg p-4`}>
          <div className="flex items-start gap-3">
            <Icon size={24} className={config.textColor} />
            <div className="flex-1">
              <h3 className={`font-semibold ${config.textColor}`}>{config.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{config.description}</p>
              <p className="text-xs text-gray-500 mt-2">
                当前筛选结果共 <span className="font-mono font-bold text-industrial-red">{filteredRecords.length}</span> 条记录，全部为异常状态。
              </p>
            </div>
            {config.showDismiss && (
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-white/50 rounded transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>
        <div className={`${config.bgColor} border-x border-b ${config.borderColor} rounded-b-lg p-2`}>
          <p className="text-xs text-center text-industrial-red/70">
            ⚡ 数据严重异常，请联系管理员
          </p>
        </div>
      </div>
    );
  }

  if (type === 'empty_table') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8">
        <div className={`p-6 rounded-full ${config.bgColor} mb-4`}>
          <Icon size={48} className={config.textColor} />
        </div>
        <h3 className={`text-lg font-semibold ${config.textColor} mb-2`}>{config.title}</h3>
        <p className="text-sm text-gray-500 mb-6 text-center max-w-md">{config.description}</p>
        {config.actionLabel && config.onActionClick && (
          <button
            onClick={config.onActionClick}
            className="px-6 py-2.5 bg-gradient-to-r from-industrial-orange to-amber-500 text-white rounded font-medium hover:shadow-lg transition-all"
          >
            {config.actionLabel}
          </button>
        )}
      </div>
    );
  }

  if (type === 'chart_not_sync') {
    return (
      <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-3 mb-4 animate-slide-in`}>
        <div className="flex items-center gap-3">
          <Icon size={20} className={`${config.textColor} animate-spin-slow`} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${config.textColor}`}>{config.title}</p>
            <p className="text-xs text-gray-500">{config.description}</p>
          </div>
          {config.actionLabel && config.onActionClick && (
            <button
              onClick={config.onActionClick}
              className="px-4 py-1.5 bg-industrial-orange text-white rounded text-sm font-medium hover:bg-industrial-orange/90 transition-colors"
            >
              {config.actionLabel}
            </button>
          )}
          {config.showDismiss && (
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/50 rounded transition-colors"
            >
              <X size={16} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (type === 'undo_reason_override') {
    return (
      <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 mb-4`}>
        <div className="flex items-start gap-3">
          <Icon size={20} className={config.textColor} />
          <div className="flex-1">
            <h3 className={`font-semibold text-sm ${config.textColor}`}>{config.title}</h3>
            <p className="text-xs text-gray-600 mt-1">{config.description}</p>

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
                  <div className="mt-2 p-3 bg-white rounded border border-gray-200 text-sm text-gray-600">
                    <p className="text-xs text-gray-400 mb-1">历史原因：</p>
                    <p className="font-mono">{previousUndoReason}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          {config.showDismiss && (
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/50 rounded transition-colors"
            >
              <X size={16} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export function useAnomalyDetection() {
  const { anomalyState, setAnomalyState, chartSyncState, filterTimestamp, chartRenderTimestamp } = useViewStore();
  const { filteredRecords } = useValveStore();

  const detectAnomalies = () => {
    if (filteredRecords.length === 0) {
      setAnomalyState('empty_table');
      return;
    }

    const allBad = filteredRecords.length > 0 && filteredRecords.every(r => r.status === 'abnormal');
    if (allBad) {
      setAnomalyState('all_bad_rows');
      return;
    }

    if (chartSyncState === 'outdated' && filterTimestamp > chartRenderTimestamp) {
      setAnomalyState('chart_not_sync');
      return;
    }

    setAnomalyState(null);
  };

  return { detectAnomalies };
}
