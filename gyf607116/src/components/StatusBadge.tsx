import React from 'react';
import { Check, AlertTriangle, Moon, Copy, PenTool } from 'lucide-react';
import type { RecordStatus } from '../types';

interface StatusBadgeProps {
  status: RecordStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

const statusConfig: Record<RecordStatus, {
  label: string;
  className: string;
  icon: React.ElementType;
}> = {
  normal: {
    label: '正常',
    className: 'status-normal',
    icon: Check
  },
  abnormal: {
    label: '异常',
    className: 'status-abnormal',
    icon: AlertTriangle
  },
  crossday: {
    label: '跨日',
    className: 'status-crossday',
    icon: Moon
  },
  duplicate: {
    label: '重复',
    className: 'status-duplicate',
    icon: Copy
  },
  manual: {
    label: '补录',
    className: 'status-manual',
    icon: PenTool
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  showIcon = true,
  size = 'md'
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <span className={`${config.className} ${sizeClass}`}>
      {showIcon && <Icon size={size === 'sm' ? 12 : 14} />}
      {config.label}
    </span>
  );
};
