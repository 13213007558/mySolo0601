import type { CylinderStatus } from '@/types';
import { statusLabels, statusColors } from '@/types';

interface StatusBadgeProps {
  status: CylinderStatus;
  size?: 'sm' | 'md';
}

const StatusBadge = ({ status, size = 'md' }: StatusBadgeProps) => {
  const colorMap: Record<CylinderStatus, string> = {
    normal: 'bg-safety-normal/20 text-safety-normal border-safety-normal',
    processing: 'bg-safety-processing/20 text-safety-processing border-safety-processing',
    completed: 'bg-safety-completed/20 text-safety-completed border-safety-completed',
    inspecting: 'bg-safety-inspecting/20 text-safety-inspecting border-safety-inspecting',
    overdue: 'bg-safety-overdue/20 text-safety-overdue border-safety-overdue',
    repaired: 'bg-safety-repaired/20 text-safety-repaired border-safety-repaired',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs';

  return (
    <span className={`status-badge ${colorMap[status]} ${sizeClasses} transition-all duration-300`}>
      <span
        className={`w-1.5 h-1.5 rounded-full ${statusColors[status]} mr-1.5 ${status === 'overdue' ? 'animate-pulse-slow' : ''}`}
      />
      {statusLabels[status]}
    </span>
  );
};

export default StatusBadge;
