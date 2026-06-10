import React from 'react';
import type { AcceptanceStatus } from '@/types';
import { ACCEPTANCE_STATUS_LABELS, ACCEPTANCE_STATUS_COLORS } from '@/types';

interface StatusBadgeProps {
  status: AcceptanceStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const colorClass = ACCEPTANCE_STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';

  return (
    <span className={`${baseClass} ${colorClass} ${className}`}>
      {ACCEPTANCE_STATUS_LABELS[status]}
    </span>
  );
};
