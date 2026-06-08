import React from 'react';
import { RecordStatus, STATUS_LABELS, STATUS_COLORS } from '../../shared/types';

interface StatusBadgeProps {
  status: RecordStatus;
  showManualTag?: boolean;
  isManual?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showManualTag = false, isManual = false }) => {
  const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200';
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';

  return (
    <span className="inline-flex items-center gap-1">
      <span className={`${baseClass} ${colorClass}`}>
        {STATUS_LABELS[status]}
      </span>
      {showManualTag && isManual && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
          手工补录
        </span>
      )}
    </span>
  );
};

export default StatusBadge;
