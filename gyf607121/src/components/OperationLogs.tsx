import { useState } from 'react';
import {
  Clock,
  Upload,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  RefreshCw,
  Database,
  User,
  Edit3,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useMeterStore } from '@/store/useMeterStore';
import { OperationLog, LogAction } from '@/types';

const ACTION_ICONS: Record<LogAction, React.ReactNode> = {
  import: <Upload className="w-3.5 h-3.5" />,
  validate: <CheckCircle className="w-3.5 h-3.5" />,
  supplement: <Edit3 className="w-3.5 h-3.5" />,
  resolve: <CheckCircle className="w-3.5 h-3.5" />,
  export: <Download className="w-3.5 h-3.5" />,
  refresh: <RefreshCw className="w-3.5 h-3.5" />,
  status_lost: <AlertTriangle className="w-3.5 h-3.5" />,
  multiplier_update: <Database className="w-3.5 h-3.5" />,
  operator_change: <User className="w-3.5 h-3.5" />,
};

const ACTION_COLORS: Record<LogAction, string> = {
  import: 'bg-primary-500',
  validate: 'bg-status-success',
  supplement: 'bg-status-purple',
  resolve: 'bg-status-success',
  export: 'bg-primary-500',
  refresh: 'bg-gray-500',
  status_lost: 'bg-status-danger',
  multiplier_update: 'bg-status-purple',
  operator_change: 'bg-amber-500',
};

export default function OperationLogs() {
  const operationLogs = useMeterStore((state) => state.operationLogs);
  const [filter, setFilter] = useState<LogAction | 'all'>('all');
  const [expanded, setExpanded] = useState(false);

  const filteredLogs = operationLogs.filter((log) => {
    if (filter === 'all') return true;
    return log.action === filter;
  });

  const displayLogs = expanded ? filteredLogs : filteredLogs.slice(0, 15);

  const actionTypes: (LogAction | 'all')[] = [
    'all',
    'import',
    'supplement',
    'resolve',
    'status_lost',
    'multiplier_update',
  ];

  const getActionLabel = (action: LogAction | 'all') => {
    const labels: Record<string, string> = {
      all: '全部',
      import: '导入',
      validate: '校验',
      supplement: '补录',
      resolve: '处理',
      export: '导出',
      refresh: '刷新',
      status_lost: '状态丢失',
      multiplier_update: '倍率更新',
      operator_change: '切换操作人',
    };
    return labels[action] || action;
  };

  return (
    <div className="card overflow-hidden">
      <div className="p-5 border-b border-industrial-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              操作日志
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              共 {operationLogs.length} 条操作记录
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="flex items-center gap-1 bg-industrial-bg rounded-lg p-1">
              {actionTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    filter === type
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {getActionLabel(type)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 max-h-[500px] overflow-y-auto">
        {displayLogs.length > 0 ? (
          <div className="relative pl-5">
            {displayLogs.map((log, index) => (
              <div
                key={log.id}
                className={`relative pb-5 ${
                  index === displayLogs.length - 1 ? '' : ''
                } animate-fade-in`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {index < displayLogs.length - 1 && (
                  <div className="timeline-line" />
                )}

                <div className={`timeline-dot ${ACTION_COLORS[log.action]}`} />

                <div className="ml-6">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-1.5 rounded-lg ${ACTION_COLORS[log.action]}/20 text-${
                        log.action === 'status_lost'
                          ? 'status-danger'
                          : log.action === 'multiplier_update'
                          ? 'status-purple'
                          : 'primary-400'
                      }`}
                    >
                      {ACTION_ICONS[log.action]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-200 text-sm">
                          {log.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="text-gray-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {format(log.timestamp, 'MM-dd HH:mm:ss', { locale: zhCN })}
                        </span>
                        <span className="text-gray-500">
                          <User className="w-3 h-3 inline mr-1" />
                          {log.operator}
                        </span>
                        {log.reason && (
                          <span className="text-status-warning font-medium">
                            原因: {log.reason}
                          </span>
                        )}
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-2 p-2 rounded bg-industrial-bg/50 text-xs text-gray-400 font-mono">
                          {JSON.stringify(log.metadata, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无操作记录</p>
          </div>
        )}
      </div>

      {filteredLogs.length > 15 && (
        <div className="p-4 border-t border-industrial-border">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full btn-secondary py-2 text-sm"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
            {expanded ? '收起' : `展开全部 ${filteredLogs.length} 条记录`}
          </button>
        </div>
      )}
    </div>
  );
}
