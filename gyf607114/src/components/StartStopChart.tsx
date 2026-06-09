import { useState } from 'react';
import { X, Play, Square, Clock, User, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import type { PumpRecord } from '../types';

interface StartStopChartProps {
  records: PumpRecord[];
  isOpen: boolean;
  onClose: () => void;
}

export const StartStopChart = ({ records, isOpen, onClose }: StartStopChartProps) => {
  const [expandedPumps, setExpandedPumps] = useState<Set<string>>(new Set());

  const togglePump = (pumpCode: string) => {
    setExpandedPumps((prev) => {
      const next = new Set(prev);
      if (next.has(pumpCode)) {
        next.delete(pumpCode);
      } else {
        next.add(pumpCode);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedPumps(new Set(records.map((r) => r.pumpCode)));
  };

  const collapseAll = () => {
    setExpandedPumps(new Set());
  };

  const pumpsWithLogs = records.filter(
    (r) => r.startStopLogs && r.startStopLogs.length > 0
  );

  const getDateRange = (record: PumpRecord) => {
    if (!record.startStopLogs || record.startStopLogs.length === 0) return null;
    const times = record.startStopLogs.map((log) => new Date(log.timestamp).getTime());
    return {
      start: Math.min(...times),
      end: Math.max(...times),
    };
  };

  const getPosition = (timestamp: string, range: { start: number; end: number }) => {
    if (range.end === range.start) return 50;
    const time = new Date(timestamp).getTime();
    return ((time - range.start) / (range.end - range.start)) * 100;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="card-header flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">冷却泵启停图</h2>
              <p className="text-sm text-gray-500">张工手工补录前后差异对比</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={expandAll} className="btn-secondary text-xs py-1 px-3">
              展开全部
            </button>
            <button onClick={collapseAll} className="btn-secondary text-xs py-1 px-3">
              折叠全部
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)] scrollbar-thin">
          <div className="p-5 space-y-4">
            {pumpsWithLogs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无启停记录</h3>
                <p className="text-gray-500 text-sm">
                  请先切换到正常/异常模式，或手工补录启停记录
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl mb-4">
                  <p className="text-sm text-purple-700">
                    <strong>说明：</strong>此图展示各泵的启停时间线。
                    带<span className="font-medium">「张工补录」</span>标记的记录为手工补录数据，
                    可用于对比补录前后的启停状态差异。导出 Excel 时会包含完整的启停记录明细表。
                  </p>
                </div>

                {pumpsWithLogs.map((record) => {
                  const range = getDateRange(record);
                  const isExpanded = expandedPumps.has(record.pumpCode);

                  return (
                    <div
                      key={record.id}
                      className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                        record.manualEntry
                          ? 'border-purple-300 bg-purple-50/30'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div
                        onClick={() => togglePump(record.pumpCode)}
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {record.manualEntry && (
                            <span className="badge bg-purple-100 text-purple-700">
                              张工补录
                            </span>
                          )}
                          <div>
                            <h3 className="font-medium text-gray-900">{record.pumpName}</h3>
                            <p className="text-sm text-gray-500">
                              {record.pumpCode} · {record.location} · {record.startStopLogs?.length || 0} 条记录
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${
                            record.status === 'normal' ? 'bg-green-100 text-green-700' :
                            record.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                            record.status === 'abnormal' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {record.status === 'normal' ? '正常' :
                             record.status === 'warning' ? '预警' :
                             record.status === 'abnormal' ? '异常' : '数据缺失'}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {isExpanded && range && (
                        <div className="px-4 pb-4 border-t border-gray-100">
                          <div className="relative mt-4 mb-6">
                            <div className="flex justify-between text-xs text-gray-500 mb-2">
                              <span>{new Date(range.start).toLocaleString('zh-CN')}</span>
                              <span>{new Date(range.end).toLocaleString('zh-CN')}</span>
                            </div>

                            <div className="relative h-20 bg-gradient-to-b from-gray-50 to-white rounded-lg border border-gray-200">
                              <div className="absolute inset-0 flex items-center">
                                <div className="w-full h-0.5 bg-gray-200" />
                              </div>

                              {record.startStopLogs?.map((log, index) => {
                                const position = getPosition(log.timestamp, range);
                                const isManual = log.reason?.includes('手工补录') || log.reason?.includes('张工');

                                return (
                                  <div
                                    key={index}
                                    className="absolute top-1/2 -translate-y-1/2"
                                    style={{ left: `${position}%` }}
                                  >
                                    <div className={`relative group cursor-pointer`}>
                                      <div
                                        className={`w-5 h-5 rounded-full border-4 border-white shadow-lg flex items-center justify-center transition-transform hover:scale-125 ${
                                          log.action === 'start'
                                            ? 'bg-green-500'
                                            : 'bg-red-500'
                                        } ${isManual ? 'ring-2 ring-purple-400 ring-offset-2' : ''}`}
                                      >
                                        {log.action === 'start' ? (
                                          <Play className="w-2 h-2 text-white ml-0.5" fill="white" />
                                        ) : (
                                          <Square className="w-2 h-2 text-white" fill="white" />
                                        )}
                                      </div>

                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                                          <p className={`font-medium ${
                                            log.action === 'start' ? 'text-green-400' : 'text-red-400'
                                          }`}>
                                            {log.action === 'start' ? '▶ 启动' : '■ 停机'}
                                          </p>
                                          <p className="text-gray-300 mt-1">{log.timestamp}</p>
                                          <p className="text-gray-400 flex items-center gap-1 mt-1">
                                            <User className="w-3 h-3 inline" />
                                            {log.operator}
                                          </p>
                                          {log.reason && (
                                            <p className="text-gray-400 mt-1 max-w-[200px] whitespace-normal">
                                              {log.reason}
                                            </p>
                                          )}
                                          {isManual && (
                                            <p className="text-purple-400 mt-1 font-medium">张工补录</p>
                                          )}
                                        </div>
                                        <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="flex justify-center gap-6 mt-2">
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span>启动</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span>停机</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <div className="w-3 h-3 rounded-full bg-purple-500 ring-2 ring-purple-300" />
                                <span>张工补录</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {record.startStopLogs?.map((log, index) => {
                              const isManual = log.reason?.includes('手工补录') || log.reason?.includes('张工');
                              return (
                                <div
                                  key={index}
                                  className={`p-3 rounded-lg border text-sm ${
                                    log.action === 'start'
                                      ? 'bg-green-50 border-green-200'
                                      : 'bg-red-50 border-red-200'
                                  } ${isManual ? 'ring-2 ring-purple-300' : ''}`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                      {log.action === 'start' ? (
                                        <Play className="w-4 h-4 text-green-600" fill="currentColor" />
                                      ) : (
                                        <Square className="w-4 h-4 text-red-600" fill="currentColor" />
                                      )}
                                      <span className={`font-medium ${
                                        log.action === 'start' ? 'text-green-700' : 'text-red-700'
                                      }`}>
                                        {log.action === 'start' ? '启动' : '停机'}
                                      </span>
                                      {isManual && (
                                        <span className="badge bg-purple-100 text-purple-700 text-[10px]">
                                          张工补录
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-gray-500 text-xs flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {log.timestamp}
                                    </span>
                                  </div>
                                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      {log.operator}
                                    </span>
                                    {log.reason && (
                                      <span className="text-gray-500">
                                        {log.reason}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="btn-primary">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
