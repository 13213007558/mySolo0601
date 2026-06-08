import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { DataStatus } from '../types';
import {
  getDataStatusColor,
  getDataStatusText,
  getDataStatusDescription,
  getDataStatusBgColor,
  getDataStatusBorderColor
} from '../services/dataValidationService';

interface DataStatusCardProps {
  status: DataStatus;
  count: number;
  onClick?: () => void;
}

const iconMap: Record<DataStatus, React.ElementType> = {
  [DataStatus.NORMAL]: CheckCircle,
  [DataStatus.DIRTY]: AlertTriangle,
  [DataStatus.EMPTY]: XCircle
};

export const DataStatusCard: React.FC<DataStatusCardProps> = ({
  status,
  count,
  onClick
}) => {
  const Icon = iconMap[status];
  const color = getDataStatusColor(status);
  const bgColor = getDataStatusBgColor(status);
  const borderColor = getDataStatusBorderColor(status);
  const text = getDataStatusText(status);
  const description = getDataStatusDescription(status);

  return (
    <div
      onClick={onClick}
      className={`${bgColor} border-2 ${borderColor} rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`}
      style={{
        background: status === DataStatus.NORMAL
          ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
          : status === DataStatus.DIRTY
          ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
          : 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)'
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="w-7 h-7" style={{ color }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: '"Noto Serif SC", serif' }}>
              {text}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold" style={{ color }}>
            {count}
          </span>
          <ArrowRight className="w-5 h-5 text-slate-400" />
        </div>
      </div>

      <div className="mt-4 h-1.5 bg-white/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(count * 15, 100)}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
};
