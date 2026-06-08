import React from 'react';
import { RecordStatus, DataStatus } from '../types';

interface StatusBadgeProps {
  status: RecordStatus;
}

const statusConfig: Record<RecordStatus, { label: string; bg: string; text: string; border: string }> = {
  [RecordStatus.PENDING]: {
    label: '待处理',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200'
  },
  [RecordStatus.REJECTED]: {
    label: '已拒绝',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200'
  },
  [RecordStatus.REISSUED]: {
    label: '已补发',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200'
  },
  [RecordStatus.MANUAL]: {
    label: '手工补录',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200'
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} transition-all duration-200 hover:scale-105`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5"
        style={{
          backgroundColor: status === RecordStatus.PENDING
            ? '#3b82f6'
            : status === RecordStatus.REJECTED
            ? '#ef4444'
            : status === RecordStatus.REISSUED
            ? '#10b981'
            : '#8b5cf6'
        }}
      />
      {config.label}
    </span>
  );
};

interface DataStatusBadgeProps {
  status: DataStatus;
}

const dataStatusConfig: Record<DataStatus, { label: string; bg: string; text: string; icon: string }> = {
  [DataStatus.NORMAL]: {
    label: '正常',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    icon: '✓'
  },
  [DataStatus.DIRTY]: {
    label: '脏数据',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    icon: '⚠'
  },
  [DataStatus.EMPTY]: {
    label: '空数据',
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: '✗'
  }
};

export const DataStatusBadge: React.FC<DataStatusBadgeProps> = ({ status }) => {
  const config = dataStatusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${config.bg} ${config.text}`}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
};
