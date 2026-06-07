import type { StatsSummary } from '@shared/types';
import { AUTH_STATUS_LABEL } from '@shared/types';
import { cn } from '@/utils';

interface Props {
  stats: StatsSummary;
}

const statusOrder: (keyof StatsSummary)[] = [
  'total',
  'authorized',
  'partial',
  'pending',
  'revoked',
  'expired',
  'badData',
  'manualEntry',
];

const colorMap: Record<string, string> = {
  total: 'text-gray-800 bg-gray-50 border-gray-200',
  authorized: 'text-safety-600 bg-safety-100 border-safety-100',
  partial: 'text-medical-600 bg-medical-100 border-medical-100',
  pending: 'text-warning-600 bg-warning-100 border-warning-100',
  revoked: 'text-danger-600 bg-danger-100 border-danger-100',
  expired: 'text-gray-600 bg-cream-100 border-cream-200',
  badData: 'text-red-700 bg-red-50 border-red-200',
  manualEntry: 'text-brand-600 bg-brand-50 border-brand-100',
};

const labelMap: Record<string, string> = {
  ...AUTH_STATUS_LABEL,
  total: '记录总数',
  badData: '坏数据隔离',
  manualEntry: '手工补录',
};

export default function StatsBar({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
      {statusOrder.map((k) => (
        <div
          key={k}
          className={cn(
            'rounded-card border px-4 py-3 text-center',
            colorMap[k] || colorMap.total,
          )}
        >
          <div className="text-2xl font-bold font-serif leading-none mb-1">{stats[k]}</div>
          <div className="text-[11px] opacity-80">{labelMap[k]}</div>
        </div>
      ))}
    </div>
  );
}
