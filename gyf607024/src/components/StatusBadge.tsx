import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import type { RecordStatus } from '@/types';

interface StatusBadgeProps {
  status: RecordStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'pending') {
    return (
      <span className="badge bg-slate-100 text-slate-700">
        <Clock className="w-3 h-3" />
        待处理
      </span>
    );
  }

  if (status === 'processed') {
    return (
      <span className="badge bg-emerald-50 text-emerald-700">
        <CheckCircle2 className="w-3 h-3" />
        已处理
      </span>
    );
  }

  return (
    <span className="badge bg-orange-50 text-orange-700">
      <AlertTriangle className="w-3 h-3" />
      异常数据
    </span>
  );
}
