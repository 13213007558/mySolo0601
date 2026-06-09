import { useState, useMemo } from 'react';
import { History, Clock, User, FileText, AlertTriangle, CheckCircle, Edit2, Trash2, Undo2, Hand, ChevronDown, ChevronUp, Filter, Search } from 'lucide-react';
import { useAuditStore } from '@/store/auditStore';
import { useValveStore } from '@/store/valveStore';
import { useViewStore } from '@/store/viewStore';
import { OPERATION_LABELS } from '@/types';
import type { AuditLog } from '@/types';
import DiffViewer from './DiffViewer';

const operationIcons: Record<AuditLog['operationType'], typeof Edit2> = {
  create: FileText,
  update: Edit2,
  delete: Trash2,
  undo: Undo2,
  manual: Hand,
};

const operationColors: Record<AuditLog['operationType'], string> = {
  create: 'bg-industrial-green text-industrial-green border-industrial-green/30',
  update: 'bg-industrial-blue text-industrial-blue border-industrial-blue/30',
  delete: 'bg-industrial-red text-industrial-red border-industrial-red/30',
  undo: 'bg-industrial-orange text-industrial-orange border-industrial-orange/30',
  manual: 'bg-amber-500 text-amber-500 border-amber-500/30',
};

export default function AuditTimeline() {
  const { logs, selectedLogId, selectLog, openUndoModal, getLogsByRecordId } = useAuditStore();
  const { records, getRecordById } = useValveStore();
  const { currentRole } = useViewStore();

  const [filterType, setFilterType] = useState<AuditLog['operationType'] | 'all'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const groupedLogs = useMemo(() => {
    let filtered = logs;

    if (filterType !== 'all') {
      filtered = logs.filter(l => l.operationType === filterType);
    }

    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      filtered = logs.filter(l =>
        l.operator.toLowerCase().includes(kw) ||
        l.recordId.toLowerCase().includes(kw) ||
        (l.undoReason && l.undoReason.toLowerCase().includes(kw))
      );
    }

    const groups: Record<string, AuditLog[]> = {};
    filtered.forEach(log => {
      if (!groups[log.recordId]) {
        groups[log.recordId] = [];
      }
      groups[log.recordId].push(log);
    });

    return groups;
  }, [logs, filterType, searchKeyword]);

  const handleUndo = (log: AuditLog) => {
    if (log.operationType === 'undo' || log.operationType === 'delete') {
      const previousLog = getLogsByRecordId(log.recordId)
        .filter(l => l.operationTime < log.operationTime)
        .find(l => l.undoReason);
      openUndoModal(log.id, previousLog?.undoReason || log.undoReason);
    } else {
      openUndoModal(log.id);
    }
  };

  const toggleRecordExpand = (recordId: string) => {
    setExpandedRecordId(expandedRecordId === recordId ? null : recordId);
    selectLog(null);
  };

  const statData = {
    total: logs.length,
    create: logs.filter(l => l.operationType === 'create').length,
    update: logs.filter(l => l.operationType === 'update').length,
    manual: logs.filter(l => l.operationType === 'manual').length,
    undo: logs.filter(l => l.operationType === 'undo').length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: '总操作数', value: statData.total, color: 'text-primary-500' },
          { label: '新增记录', value: statData.create, color: 'text-industrial-green' },
          { label: '修改记录', value: statData.update, color: 'text-industrial-blue' },
          { label: '手工补录', value: statData.manual, color: 'text-industrial-orange' },
          { label: '撤回操作', value: statData.undo, color: 'text-amber-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-lg shadow-industrial p-4 border border-gray-100">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-mono font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-industrial border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <History size={18} className="text-primary-500" />
            操作审计时间线
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索操作人、记录ID..."
                className="pl-8 pr-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-primary-400 w-56"
              />
            </div>
            <div className="flex items-center gap-1">
              <Filter size={14} className="text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="border border-gray-200 rounded text-sm px-2 py-1.5 focus:outline-none focus:border-primary-400"
              >
                <option value="all">全部操作</option>
                <option value="create">新增</option>
                <option value="update">修改</option>
                <option value="delete">删除</option>
                <option value="undo">撤回</option>
                <option value="manual">手工补录</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 max-h-[600px] overflow-y-auto">
          {Object.keys(groupedLogs).length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              暂无审计记录
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedLogs).map(([recordId, recordLogs]) => {
                const record = getRecordById(recordId);
                const isExpanded = expandedRecordId === recordId;
                const latestLog = recordLogs[0];
                const Icon = operationIcons[latestLog.operationType];

                return (
                  <div key={recordId} className="relative pl-8">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                    <div
                      className={`relative mb-2 cursor-pointer transition-all ${
                        isExpanded ? '' : 'hover:bg-gray-50 rounded-lg'
                      }`}
                      onClick={() => toggleRecordExpand(recordId)}
                    >
                      <div className={`absolute -left-8 w-6 h-6 rounded-full flex items-center justify-center border-2 ${operationColors[latestLog.operationType]}`}>
                        <Icon size={12} />
                      </div>

                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium text-primary-600">
                              {record?.valveNo || recordId.slice(0, 8)}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded border ${operationColors[latestLog.operationType]}`}>
                              {OPERATION_LABELS[latestLog.operationType]}
                            </span>
                            {record?.status === 'manual' && (
                              <span className="text-xs bg-industrial-orange/10 text-industrial-orange px-2 py-0.5 rounded">
                                老何补录
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <User size={12} />
                              {latestLog.operator}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {latestLog.operationTime}
                            </span>
                          </div>
                        </div>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>

                      {!isExpanded && recordLogs.length > 1 && (
                        <p className="text-xs text-gray-400 mt-1">
                          共 {recordLogs.length} 条操作记录，点击展开查看详情
                        </p>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="mt-4 space-y-4 animate-slide-in">
                        {recordLogs.map((log, idx) => {
                          const LogIcon = operationIcons[log.operationType];
                          const isSelected = selectedLogId === log.id;

                          return (
                            <div
                              key={log.id}
                              className={`relative ml-6 p-4 rounded-lg border transition-all ${
                                isSelected
                                  ? 'border-primary-300 bg-primary-50'
                                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                              }`}
                            >
                              <div className="absolute -left-5 w-4 h-4 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                                <div className={`w-2 h-2 rounded-full ${
                                  log.operationType === 'manual' ? 'bg-industrial-orange' :
                                  log.operationType === 'undo' ? 'bg-amber-500' :
                                  log.operationType === 'delete' ? 'bg-industrial-red' :
                                  log.operationType === 'create' ? 'bg-industrial-green' : 'bg-industrial-blue'
                                }`}></div>
                              </div>

                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <LogIcon size={14} className={operationColors[log.operationType].split(' ')[1]} />
                                  <span className={`text-xs font-medium ${operationColors[log.operationType].split(' ')[1]}`}>
                                    {OPERATION_LABELS[log.operationType]}
                                  </span>
                                  <span className="text-xs text-gray-400">{log.operationTime}</span>
                                </div>
                                {currentRole === 'supervisor' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isSelected) {
                                        selectLog(null);
                                      } else {
                                        selectLog(log.id);
                                      }
                                    }}
                                    className={`text-xs px-3 py-1 rounded transition-colors ${
                                      isSelected
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                    }`}
                                  >
                                    {isSelected ? '收起对比' : '查看对比'}
                                  </button>
                                )}
                              </div>

                              {isSelected && (
                                <div onClick={(e) => e.stopPropagation()}>
                                  <DiffViewer log={log} />
                                  {currentRole === 'supervisor' && log.operationType !== 'undo' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUndo(log);
                                      }}
                                      className="mt-4 w-full py-2 bg-industrial-orange text-white rounded text-sm font-medium hover:bg-industrial-orange/90 transition-colors flex items-center justify-center gap-2"
                                    >
                                      <Undo2 size={14} />
                                      撤回此操作
                                    </button>
                                  )}
                                </div>
                              )}

                              {!isSelected && log.undoReason && (
                                <div className="mt-2 p-2 bg-industrial-orange/10 rounded text-xs">
                                  <span className="text-gray-500">撤回原因: </span>
                                  <span className="font-mono text-industrial-orange">{log.undoReason}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-industrial border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-industrial-orange" />
          异常操作统计
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-industrial-red/5 border border-industrial-red/20 rounded-lg">
            <p className="text-2xl font-mono font-bold text-industrial-red">
              {logs.filter(l => l.operationType === 'delete').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">删除操作</p>
          </div>
          <div className="p-4 bg-industrial-orange/5 border border-industrial-orange/20 rounded-lg">
            <p className="text-2xl font-mono font-bold text-industrial-orange">
              {logs.filter(l => l.operationType === 'undo').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">撤回操作</p>
          </div>
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <p className="text-2xl font-mono font-bold text-amber-500">
              {logs.filter(l => l.operationType === 'manual').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">手工补录</p>
          </div>
          <div className="p-4 bg-industrial-blue/5 border border-industrial-blue/20 rounded-lg">
            <p className="text-2xl font-mono font-bold text-industrial-blue">
              {logs.filter(l => l.operationType === 'update').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">修改操作</p>
          </div>
        </div>
      </div>
    </div>
  );
}
