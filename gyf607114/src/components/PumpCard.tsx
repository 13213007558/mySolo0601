import { Thermometer, Gauge, Waves, Activity, MapPin, Clock, User, Edit3 } from 'lucide-react';
import type { PumpRecord } from '../types';
import { getStatusText, getStatusColor, getStatusTextColor } from '../utils/dataUtils';

interface PumpCardProps {
  record: PumpRecord;
  isSelected: boolean;
  onClick: () => void;
}

export const PumpCard = ({ record, isSelected, onClick }: PumpCardProps) => {
  const statusColor = getStatusColor(record.status);
  const statusTextColor = getStatusTextColor(record.status);

  return (
    <div
      onClick={onClick}
      className={`card cursor-pointer p-5 transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-primary-500 shadow-lg scale-[1.02]'
          : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            record.status === 'normal' ? 'bg-green-100' :
            record.status === 'warning' ? 'bg-amber-100' :
            record.status === 'abnormal' ? 'bg-red-100' : 'bg-gray-100'
          }`}>
            <Activity className={`w-6 h-6 ${
              record.status === 'normal' ? 'text-green-600' :
              record.status === 'warning' ? 'text-amber-600' :
              record.status === 'abnormal' ? 'text-red-600' : 'text-gray-600'
            }`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{record.pumpName}</h3>
              {record.manualEntry && (
                <span className="badge bg-purple-100 text-purple-700">
                  <Edit3 className="w-3 h-3 mr-1" />
                  张工补录
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{record.pumpCode}</p>
          </div>
        </div>
        <span className={`status-dot ${statusColor} ${
          record.status === 'abnormal' ? 'animate-pulse' : ''
        }`} />
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <MapPin className="w-4 h-4" />
        <span>{record.location}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <Thermometer className="w-3.5 h-3.5" />
            <span>温度</span>
          </div>
          <p className={`font-semibold ${
            record.temperature !== null && record.temperature >= 35 ? 'text-red-600' :
            record.temperature !== null && record.temperature >= 28 ? 'text-amber-600' :
            record.temperature !== null ? 'text-green-600' : 'text-gray-400'
          }`}>
            {record.temperature !== null ? `${record.temperature.toFixed(1)}°C` : '--'}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <Gauge className="w-3.5 h-3.5" />
            <span>压力</span>
          </div>
          <p className={`font-semibold ${
            record.pressure !== null && record.pressure <= 0.22 ? 'text-red-600' :
            record.pressure !== null && record.pressure <= 0.28 ? 'text-amber-600' :
            record.pressure !== null ? 'text-green-600' : 'text-gray-400'
          }`}>
            {record.pressure !== null ? `${record.pressure.toFixed(2)} MPa` : '--'}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <Waves className="w-3.5 h-3.5" />
            <span>流量</span>
          </div>
          <p className={`font-semibold ${
            record.flowRate !== null && record.flowRate <= 80 ? 'text-red-600' :
            record.flowRate !== null && record.flowRate <= 100 ? 'text-amber-600' :
            record.flowRate !== null ? 'text-green-600' : 'text-gray-400'
          }`}>
            {record.flowRate !== null ? `${record.flowRate.toFixed(1)} m³/h` : '--'}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>振动</span>
          </div>
          <p className={`font-semibold ${
            record.vibration !== null && record.vibration >= 7.0 ? 'text-red-600' :
            record.vibration !== null && record.vibration >= 4.0 ? 'text-amber-600' :
            record.vibration !== null ? 'text-green-600' : 'text-gray-400'
          }`}>
            {record.vibration !== null ? `${record.vibration.toFixed(1)} mm/s` : '--'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <User className="w-4 h-4" />
          <span>{record.inspector || '未指定'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>{record.inspectionTime ? record.inspectionTime.slice(5, 16) : '--'}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className={`badge ${
          record.status === 'normal' ? 'bg-green-100 text-green-700' :
          record.status === 'warning' ? 'bg-amber-100 text-amber-700' :
          record.status === 'abnormal' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {getStatusText(record.status)}
        </span>
        <span className={`text-xs font-medium ${statusTextColor}`}>
          {record.source === 'manual' ? '手工补录' : record.source === 'import' ? '导入数据' : '系统数据'}
        </span>
      </div>
    </div>
  );
};
