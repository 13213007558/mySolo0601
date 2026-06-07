import type { RecordStatus, ValidationStatus } from '@/types';
import { CheckCircle2, XCircle, AlertTriangle, Clock, FileEdit, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: RecordStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, showIcon = true, size = 'sm' }: StatusBadgeProps) {
  const config = getStatusConfig(status);
  const padding = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  return (
    <span className={`status-badge ${padding} ${config.bg} ${config.text}`}>
      {showIcon && <config.icon size={size === 'sm' ? 12 : 14} />}
      {config.label}
    </span>
  );
}

export function getStatusConfig(status: RecordStatus) {
  switch (status) {
    case 'normal':
      return {
        bg: 'bg-status-normal/10',
        text: 'text-status-normal',
        border: 'border-status-normal/20',
        label: '正常',
        icon: CheckCircle2,
      };
    case 'abnormal':
      return {
        bg: 'bg-status-abnormal/10',
        text: 'text-status-abnormal',
        border: 'border-status-abnormal/20',
        label: '异常',
        icon: XCircle,
      };
    case 'pending':
      return {
        bg: 'bg-status-pending/10',
        text: 'text-status-pending',
        border: 'border-status-pending/20',
        label: '待复核',
        icon: Clock,
      };
    case 'overridden_normal':
      return {
        bg: 'bg-status-normal/15',
        text: 'text-status-normal',
        border: 'border-status-normal/30',
        label: '已改判·正常',
        icon: FileEdit,
      };
    case 'overridden_abnormal':
      return {
        bg: 'bg-status-abnormal/15',
        text: 'text-status-abnormal',
        border: 'border-status-abnormal/30',
        label: '已改判·异常',
        icon: FileEdit,
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        border: 'border-gray-200',
        label: '未知',
        icon: AlertCircle,
      };
  }
}

interface ValidationBadgeProps {
  status: ValidationStatus;
}

export function ValidationBadge({ status }: ValidationBadgeProps) {
  const config: Record<ValidationStatus, { bg: string; text: string; icon: typeof CheckCircle2; label: string }> = {
    pass: { bg: 'bg-status-normal/10', text: 'text-status-normal', icon: CheckCircle2, label: '通过' },
    fail: { bg: 'bg-status-abnormal/10', text: 'text-status-abnormal', icon: XCircle, label: '未通过' },
    warning: { bg: 'bg-status-pending/10', text: 'text-status-pending', icon: AlertTriangle, label: '警告' },
    unit_mismatch: { bg: 'bg-status-pending/15', text: 'text-status-pending', icon: AlertTriangle, label: '单位不一致' },
    boundary_triggered: { bg: 'bg-status-abnormal/10', text: 'text-status-abnormal', icon: AlertTriangle, label: '边界值触发' },
  };
  const c = config[status];
  return (
    <span className={`status-badge ${c.bg} ${c.text}`}>
      <c.icon size={12} />
      {c.label}
    </span>
  );
}
