import { X, Thermometer, Gauge, Waves, Activity, MapPin, Clock, User, Calendar, FileText, Edit3, Play, Square, Trash2 } from 'lucide-react';
import type { PumpRecord, StartStopLog } from '../types';
import { getStatusText, getStatusColor } from '../utils/dataUtils';

interface DetailPanelProps {
  record: PumpRecord | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onAddStartStop: (recordId: string, log: Omit<StartStopLog, 'timestamp'>) => void;
}

export const DetailPanel = ({ record, onClose, onDelete, onAddStartStop }: DetailPanelProps) => {
  if (!record) {
    return (
      <div className="bg-white border-l border-gray-200 w-full lg:w-96 flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">选择一台泵查看详情</h3>
          <p className="text-gray-500 text-sm">点击左侧卡片查看详细信息和时间线</p>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(record.status);

  const handleStart = () => {
    onAddStartStop(record.id, {
      action: 'start',
      operator: '张工',
      reason: '手工补录：启动操作',
    });
  };

  const handleStop = () => {
    onAddStartStop(record.id, {
      action: 'stop',
      operator: '张工',
      reason: '手工补录：停机操作',
    });
  };

  const handleDelete = () => {
    if (window.confirm(`确定要删除 ${record.pumpName} 吗？`)) {
      onDelete(record.id);
    }
  };

  const paramItems = [
    {
      label: '温度',
      value: record.temperature,
      unit: '°C',
      icon: Thermometer,
      warning: 28,
      danger: 35,
      isHigher: true,
    },
    {
      label: '压力',
      value: record.pressure,
      unit: 'MPa',
      icon: Gauge,
      warning: 0.28,
      danger: 0.22,
      isHigher: false,
    },
    {
      label: '流量',
      value: record.flowRate,
      unit: 'm³/h',
      icon: Waves,
      warning: 100,
      danger: 80,
      isHigher: false,
    },
    {
      label: '振动',
      value: record.vibration,
      unit: 'mm/s',
      icon: Activity,
      warning: 4.0,
      danger: 7.0,
      isHigher: true,
    },
  ];

  return (
    <div className="bg-white border-l border-gray-200 w-full lg:w-96 flex flex-col h-full overflow-hidden">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">设备详情</h2>
          {record.manualEntry && (
            <span className="badge bg-purple-100 text-purple-700">
              <Edit3 className="w-3 h-3 mr-1" />
              张工补录
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-5">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900">{record.pumpName}</h3>
              <span className={`status-dot ${statusColor} ${
                record.status === 'abnormal' ? 'animate-pulse' : ''
              }`} />
            </div>
            <p className="text-gray-500 mb-3">{record.pumpCode}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
              <MapPin className="w-4 h-4" />
              <span>{record.location}</span>
            </div>
            <span className={`badge ${
              record.status === 'normal' ? 'bg-green-100 text-green-700' :
              record.status === 'warning' ? 'bg-amber-100 text-amber-700' :
              record.status === 'abnormal' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {getStatusText(record.status)}
            </span>
          </div>

          <div className="space-y-4 mb-6">
            {paramItems.map((item) => {
              const isWarning = item.value !== null && (
                item.isHigher ? item.value >= item.warning && item.value < item.danger :
                item.value <= item.warning && item.value > item.danger
              );
              const isDanger = item.value !== null && (
                item.isHigher ? item.value >= item.danger : item.value <= item.danger
              );
              const isEmpty = item.value === null;

              return (
                <div
                  key={item.label}
                  className={`p-4 rounded-xl border ${
                    isDanger ? 'bg-red-50 border-red-200' :
                    isWarning ? 'bg-amber-50 border-amber-200' :
                    isEmpty ? 'bg-gray-50 border-gray-200' : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <item.icon className={`w-5 h-5 ${
                        isDanger ? 'text-red-600' :
                        isWarning ? 'text-amber-600' :
                        isEmpty ? 'text-gray-400' : 'text-green-600'
                      }`} />
                      <span className="font-medium text-gray-700">{item.label}</span>
                    </div>
                    <span className={`text-2xl font-bold ${
                      isDanger ? 'text-red-600' :
                      isWarning ? 'text-amber-600' :
                      isEmpty ? 'text-gray-400' : 'text-green-600'
                    }`}>
                      {item.value !== null ? `${item.value.toFixed(1)} ${item.unit}` : '--'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    {!isEmpty && (
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (item.value! / (item.isHigher ? item.danger * 1.5 : 0.5)) * 100)}%`,
                        }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>正常范围</span>
                    <span className={item.isHigher ? 'text-gray-600' : 'text-gray-600'}>
                      {item.isHigher ? `< ${item.warning} ${item.unit}` : `> ${item.warning} ${item.unit}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">基本信息</h4>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  运行小时
                </span>
                <span className="font-medium text-gray-900">
                  {record.runningHours !== null ? `${record.runningHours} h` : '--'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  上次维护
                </span>
                <span className="font-medium text-gray-900">
                  {record.lastMaintenance || '--'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  巡检人员
                </span>
                <span className="font-medium text-gray-900">
                  {record.inspector || '--'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  巡检时间
                </span>
                <span className="font-medium text-gray-900">
                  {record.inspectionTime || '--'}
                </span>
              </div>
            </div>
          </div>

          {record.remarks && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                备注
              </h4>
              <p className="text-sm text-blue-800">{record.remarks}</p>
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">启停操作</h4>
              <div className="flex gap-2">
                <button
                  onClick={handleStart}
                  className="btn-success text-xs py-1 px-3 flex items-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  启动
                </button>
                <button
                  onClick={handleStop}
                  className="btn-danger text-xs py-1 px-3 flex items-center gap-1"
                >
                  <Square className="w-3 h-3" />
                  停机
                </button>
              </div>
            </div>

            {record.startStopLogs && record.startStopLogs.length > 0 ? (
              <div className="space-y-2">
                {record.startStopLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border text-sm ${
                      log.action === 'start'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium ${
                        log.action === 'start' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {log.action === 'start' ? '▶ 启动' : '■ 停机'}
                      </span>
                      <span className="text-gray-500 text-xs">{log.timestamp.slice(5, 16)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <User className="w-3 h-3" />
                      <span>{log.operator}</span>
                      {log.reason && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span>{log.reason}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">暂无启停记录</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleDelete}
          className="w-full btn-danger flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          删除此记录
        </button>
      </div>
    </div>
  );
};
