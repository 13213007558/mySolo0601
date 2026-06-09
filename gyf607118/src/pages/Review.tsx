import { useState } from 'react';
import {
  History,
  Clock,
  User,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';
import { useBatteryStore } from '../store/batteryStore';
import { StatusBadge } from '../components/StatusBadge';
import { FormatTooltip } from '../components/FormatTooltip';
import { formatDateTime } from '../utils/validation';
import type { OperationType } from '../types';

const operationTypeLabels: Record<OperationType, { label: string; color: string }> = {
  import: { label: '导入', color: 'bg-primary-500' },
  update: { label: '更新', color: 'bg-warning-500' },
  review: { label: '复核', color: 'bg-success-500' },
  undo: { label: '撤回', color: 'bg-industrial-300' },
  delete: { label: '删除', color: 'bg-red-500' },
  supplement: { label: '补录', color: 'bg-purple-500' },
};

export default function Review() {
  const { records, operationLogs } = useBatteryStore();
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);

  const recordsWithAnomalies = records.filter(r => r.isAnomaly || r.formatIssue);
  const selectedRecordData = records.find(r => r.id === selectedRecord);

  return (
    <div className="flex gap-4 p-4 max-w-[1600px] mx-auto">
      <div className="w-80 flex-shrink-0">
        <div className="card-industrial">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-primary-400" />
            <h3 className="font-semibold text-industrial-100">操作时间线</h3>
          </div>
          
          <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin pr-2">
            {operationLogs.length === 0 ? (
              <p className="text-center py-8 text-industrial-400 text-sm">
                暂无操作记录
              </p>
            ) : (
              operationLogs.map((log, index) => {
                const isExpanded = expandedLog === log.id;
                const typeInfo = operationTypeLabels[log.type];
                
                return (
                  <div
                    key={log.id}
                    className="relative pl-6 pb-4 border-l-2 border-industrial-400 last:border-l-0"
                  >
                    <div
                      className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${typeInfo.color} border-2 border-industrial-500`}
                    />
                    
                    <div
                      className="cursor-pointer hover:bg-industrial-600/50 -ml-2 p-2 rounded transition-colors"
                      onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          <span className="text-xs text-industrial-300 font-mono">
                            {formatDateTime(log.timestamp)}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-industrial-300" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-industrial-300" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 mt-1 text-xs text-industrial-200">
                        <User className="w-3 h-3" />
                        <span>{log.operator}</span>
                      </div>
                      
                      <p className="text-sm text-industrial-100 mt-1">
                        {log.description}
                      </p>
                      
                      {isExpanded && (
                        <div className="mt-2 p-2 bg-industrial-700 rounded text-xs">
                          <div className="flex items-center gap-1 text-industrial-300 mb-1">
                            <FileText className="w-3 h-3" />
                            <span>操作前快照：{log.snapshot.length} 条记录</span>
                          </div>
                          <div className="font-mono text-industrial-400 max-h-32 overflow-y-auto scrollbar-thin">
                            {log.snapshot.slice(0, 5).map(r => (
                              <div key={r.id} className="truncate">
                                • {r.batteryNo} [{r.status}]
                              </div>
                            ))}
                            {log.snapshot.length > 5 && (
                              <div className="text-industrial-500">
                                ... 还有 {log.snapshot.length - 5} 条
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        <div className="card-industrial watermark-locked">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-industrial-300" />
            <h3 className="font-semibold text-industrial-100">
              原始值保留区
              <span className="ml-2 text-xs text-industrial-400 font-normal">
                （导入时的原始数据，永不修改）
              </span>
            </h3>
          </div>

          {recordsWithAnomalies.length === 0 ? (
            <p className="text-center py-8 text-industrial-400 text-sm relative z-10">
              没有发现需要特别关注的记录
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {recordsWithAnomalies.map((record) => (
                <div
                  key={record.id}
                  className={`p-3 rounded border ${
                    selectedRecord === record.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-industrial-400 bg-industrial-600/50'
                  } cursor-pointer hover:border-primary-500/50 transition-colors relative z-10`}
                  onClick={() => setSelectedRecord(selectedRecord === record.id ? null : record.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <FormatTooltip message={record.formatIssue}>
                      <span className="font-mono font-semibold">{record.batteryNo}</span>
                    </FormatTooltip>
                    <StatusBadge status={record.status} />
                  </div>
                  
                  {(record.isAnomaly || record.formatIssue) && (
                    <div className="flex items-start gap-1 text-xs text-warning-400 mb-2">
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <div>
                        {record.isAnomaly && record.anomalyReason && (
                          <div>{record.anomalyReason}</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-industrial-400 space-y-1">
                    <div className="flex justify-between">
                      <span>原始编号：</span>
                      <span className="font-mono">{record.originalBatteryNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>原始状态：</span>
                      <span>{record.originalStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>原始电压：</span>
                      <span className="font-mono">{record.voltage}V</span>
                    </div>
                    <div className="flex justify-between">
                      <span>原始温度：</span>
                      <span className="font-mono">{record.temperature}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>导入时间：</span>
                      <span className="font-mono text-[10px]">{formatDateTime(record.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedRecordData && (
          <div className="card-industrial">
            <h3 className="font-semibold text-industrial-100 mb-4">
              记录详情对比
              <span className="ml-2 font-mono text-primary-400">{selectedRecordData.batteryNo}</span>
            </h3>
            
            <div className="overflow-x-auto scrollbar-thin">
              <table className="table-industrial">
                <thead>
                  <tr>
                    <th>字段</th>
                    <th>原始值（导入时）</th>
                    <th>当前值</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { field: '电池编号', original: selectedRecordData.originalBatteryNo, current: selectedRecordData.batteryNo },
                    { field: '状态', original: selectedRecordData.originalStatus, current: selectedRecordData.status },
                    { field: '换电日期', original: selectedRecordData.exchangeDate, current: selectedRecordData.exchangeDate },
                    { field: '换电地点', original: selectedRecordData.location, current: selectedRecordData.location },
                    { field: '操作人员', original: selectedRecordData.operator, current: selectedRecordData.operator },
                    { field: '电压(V)', original: selectedRecordData.voltage, current: selectedRecordData.voltage },
                    { field: '温度(°C)', original: selectedRecordData.temperature, current: selectedRecordData.temperature },
                    { field: '备注', original: selectedRecordData.remark || '-', current: selectedRecordData.remark || '-' },
                    { field: '复核人', original: '-', current: selectedRecordData.reviewedBy || '-' },
                    { field: '复核时间', original: '-', current: selectedRecordData.reviewedAt ? formatDateTime(selectedRecordData.reviewedAt) : '-' },
                  ].map(({ field, original, current }) => {
                    const isDifferent = String(original) !== String(current);
                    return (
                      <tr key={field}>
                        <td className="font-medium">{field}</td>
                        <td className="font-mono text-industrial-300">{String(original)}</td>
                        <td className={`font-mono ${isDifferent ? 'diff-highlight' : ''}`}>
                          {String(current)}
                        </td>
                        <td>
                          {isDifferent ? (
                            <span className="text-warning-400 text-xs">已修改</span>
                          ) : (
                            <span className="text-industrial-400 text-xs">未修改</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
