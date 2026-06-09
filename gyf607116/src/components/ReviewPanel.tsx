import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Copy, 
  Clock, 
  History, 
  ChevronDown, 
  ChevronUp,
  User,
  AlertTriangle
} from 'lucide-react';
import { useRecordStore } from '../store/useRecordStore';
import { StatusBadge } from './StatusBadge';
import { formatDateTime, getActionText } from '../utils/time';
import { getRecordDiff } from '../utils/validation';

export const ReviewPanel: React.FC = () => {
  const { 
    records, 
    operationLogs, 
    getDuplicateRecords, 
    getManualEntryRecords,
    setView,
    getSortedRecords
  } = useRecordStore();

  const [expandedSection, setExpandedSection] = useState<string | null>('duplicates');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const duplicateRecords = getDuplicateRecords();
  const manualEntryRecords = getManualEntryRecords();
  const sortedRecords = getSortedRecords();

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const SectionHeader = ({ 
    id, 
    icon: Icon, 
    title, 
    count, 
    color 
  }: { 
    id: string; 
    icon: React.ElementType; 
    title: string; 
    count: number; 
    color: string 
  }) => (
    <button
      onClick={() => toggleSection(id)}
      className={`w-full flex items-center justify-between p-4 border-2 ${color} transition-colors`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <span className="font-semibold">{title}</span>
        <span className="px-2 py-0.5 text-xs bg-black/20 rounded">
          {count} 条
        </span>
      </div>
      {expandedSection === id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </button>
  );

  const DiffDisplay = ({ oldVal, newVal, field }: { oldVal: string; newVal: string; field: string }) => {
    if (oldVal === newVal) {
      return (
        <div className="text-gray-400">
          <span className="text-gray-500">{field}:</span> {oldVal}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-500">{field}:</span>
        <span className="line-through text-red-400">{oldVal}</span>
        <span className="text-gray-500">→</span>
        <span className="text-emerald-400">{newVal}</span>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setView('main')}
          className="industrial-btn-gray flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          返回复核台
        </button>
        <h2 className="text-xl font-mono font-bold text-white">
          数据复盘页
        </h2>
        <p className="text-gray-400 text-sm">
          查看重复记录对比、操作历史和数据追溯
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card-panel p-4">
          <div className="text-3xl font-mono font-bold text-white">{records.length}</div>
          <div className="text-sm text-gray-400">总记录数</div>
        </div>
        <div className="card-panel p-4 border-yellow-700">
          <div className="text-3xl font-mono font-bold text-yellow-400">{duplicateRecords.length}</div>
          <div className="text-sm text-gray-400">重复记录</div>
        </div>
        <div className="card-panel p-4 border-violet-700">
          <div className="text-3xl font-mono font-bold text-violet-400">{manualEntryRecords.length}</div>
          <div className="text-sm text-gray-400">手工补录</div>
        </div>
        <div className="card-panel p-4 border-blue-700">
          <div className="text-3xl font-mono font-bold text-blue-400">{operationLogs.length}</div>
          <div className="text-sm text-gray-400">操作记录</div>
        </div>
      </div>

      <div className="card-panel overflow-hidden">
        <SectionHeader
          id="duplicates"
          icon={Copy}
          title="重复记录对比（保留原始值）"
          count={duplicateRecords.length}
          color="border-yellow-700 bg-yellow-900/20"
        />
        {expandedSection === 'duplicates' && (
          <div className="p-4 space-y-4">
            {duplicateRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无重复记录
              </div>
            ) : (
              duplicateRecords.map((record) => {
                const original = record.originalValue;
                if (!original) return null;
                
                const diffs = getRecordDiff(original, record);

                return (
                  <div key={record.id} className="border border-yellow-800 rounded overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-yellow-900/30 border-b border-yellow-800">
                      <div className="flex items-center gap-3">
                        <AlertTriangle size={16} className="text-yellow-400" />
                        <span className="font-mono text-yellow-300">
                          {record.gunCode} - {formatDateTime(record.timestamp)}
                        </span>
                        <StatusBadge status="duplicate" size="sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-yellow-800">
                      <div className="p-4 bg-gray-800/50">
                        <div className="text-xs text-gray-500 uppercase mb-2 font-semibold">原始值</div>
                        <div className="space-y-1 text-sm font-mono">
                          <div className="text-gray-400">
                            枪编号: <span className="text-gray-300">{original.gunCode}</span>
                          </div>
                          <div className="text-gray-400">
                            时间: <span className="text-gray-300">{formatDateTime(original.timestamp || '')}</span>
                          </div>
                          <div className="text-gray-400">
                            操作人: <span className="text-gray-300">{original.operator}</span>
                          </div>
                          <div className="text-gray-400">
                            动作: <span className="text-gray-300">{getActionText(original.action || 'insert')}</span>
                          </div>
                          <div className="text-gray-400">
                            备注: <span className="text-gray-300">{original.remark || '—'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="text-xs text-gray-500 uppercase mb-2 font-semibold">新导入值</div>
                        <div className="space-y-1 text-sm font-mono">
                          <DiffDisplay 
                            field="枪编号" 
                            oldVal={original.gunCode || ''} 
                            newVal={record.gunCode} 
                          />
                          <DiffDisplay 
                            field="时间" 
                            oldVal={formatDateTime(original.timestamp || '')} 
                            newVal={formatDateTime(record.timestamp)} 
                          />
                          <DiffDisplay 
                            field="操作人" 
                            oldVal={original.operator || ''} 
                            newVal={record.operator} 
                          />
                          <DiffDisplay 
                            field="动作" 
                            oldVal={getActionText(original.action || 'insert')} 
                            newVal={getActionText(record.action)} 
                          />
                          <DiffDisplay 
                            field="备注" 
                            oldVal={original.remark || '—'} 
                            newVal={record.remark || '—'} 
                          />
                        </div>
                      </div>
                    </div>
                    {diffs.length === 0 && (
                      <div className="p-3 bg-yellow-900/20 text-yellow-300 text-sm text-center border-t border-yellow-800">
                        两条记录完全相同，已保留原始值，新记录标记为重复
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="card-panel overflow-hidden">
        <SectionHeader
          id="manual"
          icon={User}
          title="手工补录记录"
          count={manualEntryRecords.length}
          color="border-violet-700 bg-violet-900/20"
        />
        {expandedSection === 'manual' && (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="font-mono">枪编号</th>
                  <th className="font-mono">插拔时间</th>
                  <th>操作人</th>
                  <th>补录人</th>
                  <th>动作</th>
                  <th>备注</th>
                  <th className="font-mono">补录时间</th>
                </tr>
              </thead>
              <tbody>
                {manualEntryRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      暂无手工补录记录
                    </td>
                  </tr>
                ) : (
                  manualEntryRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="font-mono text-violet-300">{record.gunCode}</td>
                      <td className="font-mono text-gray-300">{formatDateTime(record.timestamp)}</td>
                      <td>{record.operator}</td>
                      <td>
                        <span className="text-violet-400">{record.manualEntryBy}</span>
                      </td>
                      <td>{getActionText(record.action)}</td>
                      <td className="text-gray-400">{record.remark}</td>
                      <td className="font-mono text-gray-400 text-sm">
                        {formatDateTime(record.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card-panel overflow-hidden">
        <SectionHeader
          id="history"
          icon={History}
          title="操作历史记录"
          count={operationLogs.length}
          color="border-blue-700 bg-blue-900/20"
        />
        {expandedSection === 'history' && (
          <div className="divide-y divide-bgdark-700 max-h-96 overflow-y-auto">
            {operationLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无操作记录
              </div>
            ) : (
              operationLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="p-3 hover:bg-bgdark-700/50 cursor-pointer transition-colors"
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        log.type === 'import' ? 'bg-orange-900/50 text-orange-400' :
                        log.type === 'manual' ? 'bg-violet-900/50 text-violet-400' :
                        log.type === 'delete' ? 'bg-red-900/50 text-red-400' :
                        log.type === 'update' ? 'bg-blue-900/50 text-blue-400' :
                        'bg-green-900/50 text-green-400'
                      }`}>
                        {log.type === 'import' ? '导入' :
                         log.type === 'manual' ? '补录' :
                         log.type === 'delete' ? '删除' :
                         log.type === 'update' ? '更新' : '样例'}
                      </span>
                      <span className="text-gray-200">{log.description}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        影响 {log.recordsAffected} 条
                      </span>
                      <span className="font-mono text-xs text-gray-500">
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>
                  </div>
                  {expandedLog === log.id && (
                    <div className="mt-2 pt-2 border-t border-bgdark-600 text-sm text-gray-400">
                      {log.user && <p>操作人：{log.user}</p>}
                      {log.sampleType && <p>样例类型：{log.sampleType}</p>}
                      <p>操作ID：{log.id}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="card-panel overflow-hidden">
        <SectionHeader
          id="timeline"
          icon={Clock}
          title="完整时间线（按时间排序）"
          count={sortedRecords.length}
          color="border-primary-700 bg-primary-900/20"
        />
        {expandedSection === 'timeline' && (
          <div className="p-4 max-h-96 overflow-y-auto">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-bgdark-600" />
              <div className="space-y-4">
                {sortedRecords.map((record, index) => (
                  <div key={record.id} className="relative pl-10">
                    <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
                      record.status === 'normal' ? 'bg-emerald-500 border-emerald-300' :
                      record.status === 'crossday' ? 'bg-blue-500 border-blue-300' :
                      record.status === 'duplicate' ? 'bg-yellow-500 border-yellow-300' :
                      record.status === 'manual' ? 'bg-violet-500 border-violet-300' :
                      'bg-orange-500 border-orange-300'
                    }`} />
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm text-gray-400">
                        {formatDateTime(record.timestamp)}
                      </span>
                      <StatusBadge status={record.status} size="sm" showIcon={false} />
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        record.action === 'insert' 
                          ? 'bg-emerald-900/50 text-emerald-400' 
                          : 'bg-amber-900/50 text-amber-400'
                      }`}>
                        {getActionText(record.action)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-mono text-primary-300 mr-2">{record.gunCode}</span>
                      <span className="text-gray-300">{record.operator}</span>
                      {record.remark && (
                        <span className="text-gray-500 ml-2">— {record.remark}</span>
                      )}
                      {record.isManualEntry && record.manualEntryBy && (
                        <span className="text-violet-400 text-xs ml-2">
                          [补录: {record.manualEntryBy}]
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
