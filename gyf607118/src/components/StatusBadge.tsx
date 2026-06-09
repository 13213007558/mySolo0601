import type { RecordStatus } from '../types';

interface StatusBadgeProps {
  status: RecordStatus;
}

const statusMap: Record<RecordStatus, { label: string; className: string }> = {
  pending: { label: '待复核', className: 'status-pending' },
  normal: { label: '正常', className: 'status-normal' },
  anomaly: { label: '异常', className: 'status-anomaly' },
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const { label, className } = statusMap[status];
  return <span className={className}>{label}</span>;
};
