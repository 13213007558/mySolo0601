import React from 'react';
import { History, MapPin, Clock, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { HistoryRecord } from '../types';

export const HistoryPanel: React.FC = () => {
  const {
    historyRecords,
    selectedHistoryId,
    setSelectedHistoryId,
    showHistoryOverlay,
    toggleHistoryOverlay,
  } = useAppStore();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getModeLabel = (mode: string) => {
    return mode === 'real' ? '实盘' : '演练';
  };

  const getModeColor = (mode: string) => {
    return mode === 'real' ? 'text-warning-400 bg-warning-500/20' : 'text-blue-400 bg-blue-500/20';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-dark-200 flex items-center gap-2">
          <History size={14} className="text-purple-400" />
          历史记录
        </h3>
        <button
          onClick={toggleHistoryOverlay}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            showHistoryOverlay
              ? 'bg-purple-500 text-white'
              : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
          }`}
        >
          {showHistoryOverlay ? '隐藏叠加' : '叠加显示'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
        {historyRecords.length === 0 ? (
          <div className="text-center py-8 text-dark-500">
            <History size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无历史记录</p>
          </div>
        ) : (
          historyRecords.map((record: HistoryRecord) => (
            <div
              key={record.id}
              onClick={() => setSelectedHistoryId(
                selectedHistoryId === record.id ? null : record.id
              )}
              className={`p-3 rounded-lg cursor-pointer transition-all border ${
                selectedHistoryId === record.id
                  ? 'bg-dark-700 border-purple-500/50'
                  : 'bg-dark-800 border-transparent hover:bg-dark-700 hover:border-dark-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${getModeColor(record.mode)}`}>
                      {getModeLabel(record.mode)}
                    </span>
                    <span className={`text-xs ${
                      record.isCompliant ? 'text-safety-400' : 'text-danger-400'
                    }`}>
                      {record.isCompliant ? '合规' : '违规'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-dark-300 mb-1">
                    <MapPin size={10} />
                    <span className="truncate">{record.location}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-dark-500">
                    <Clock size={10} />
                    <span>{formatDate(record.timestamp)}</span>
                  </div>
                </div>
                <ChevronRight
                  size={14}
                  className={`text-dark-500 transition-transform ${
                    selectedHistoryId === record.id ? 'rotate-90' : ''
                  }`}
                />
              </div>

              {selectedHistoryId === record.id && (
                <div className="mt-3 pt-3 border-t border-dark-600 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-dark-500">修正半径</span>
                      <p className="text-warning-400 font-mono">
                        {record.correctedDistances.average}m
                      </p>
                    </div>
                    <div>
                      <span className="text-dark-500">最小距离</span>
                      <p className={`font-mono ${
                        record.correctedDistances.min >= 500 ? 'text-safety-400' : 'text-danger-400'
                      }`}>
                        {record.correctedDistances.min}m
                      </p>
                    </div>
                    <div>
                      <span className="text-dark-500">风向</span>
                      <p className="text-blue-400 font-mono">{record.wind.angle}°</p>
                    </div>
                    <div>
                      <span className="text-dark-500">风速</span>
                      <p className="text-blue-400 font-mono">{record.wind.speed}m/s</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
