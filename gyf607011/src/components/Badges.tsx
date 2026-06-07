import type { DataQuality, ReviewStatus, CheckStatus } from '../../shared/types';

const dataQualityConfig: Record<DataQuality, { label: string; dotColor: string; bg: string; text: string }> = {
  clean: { label: '正常', dotColor: 'bg-medical-500', bg: 'bg-medical-50', text: 'text-medical-700' },
  dirty: { label: '脏数据', dotColor: 'bg-warm-500', bg: 'bg-warm-50', text: 'text-warm-700' },
  empty: { label: '空数据', dotColor: 'bg-gray-400', bg: 'bg-gray-100', text: 'text-gray-600' },
};

export function DataQualityBadge({ quality }: { quality: DataQuality }) {
  const c = dataQualityConfig[quality];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text} transition-transform hover:scale-105`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dotColor} ${quality === 'dirty' ? 'animate-pulse-dot' : ''}`} />
      {c.label}
    </span>
  );
}

const reviewConfig: Record<ReviewStatus, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: '待复核', bg: 'bg-warm-50', text: 'text-warm-700', border: 'border-warm-200' },
  approved: { label: '已通过', bg: 'bg-medical-50', text: 'text-medical-700', border: 'border-medical-200' },
  rejected: { label: '已驳回', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'rolled-back': { label: '已回退', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
};

export function ReviewBadge({ status }: { status: ReviewStatus }) {
  const c = reviewConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${c.bg} ${c.text} ${c.border} transition-transform hover:scale-105`}>
      {c.label}
    </span>
  );
}

const statusConfig: Record<CheckStatus, { label: string; icon: string }> = {
  normal: { label: '健康', icon: '✓' },
  abnormal: { label: '异常', icon: '!' },
  leave: { label: '请假', icon: '✎' },
};

export function StatusBadge({ status }: { status: CheckStatus }) {
  const c = statusConfig[status];
  const styles =
    status === 'normal'
      ? 'bg-medical-500 text-white'
      : status === 'abnormal'
      ? 'bg-red-500 text-white'
      : 'bg-gray-400 text-white';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${styles}`}>
      <span>{c.icon}</span>
      {c.label}
    </span>
  );
}

export function TemperatureBadge({ value }: { value: number }) {
  if (!value) {
    return <span className="text-gray-400 text-sm font-mono">--.-°C</span>;
  }
  const abnormal = value >= 37.5;
  return (
    <span className={`font-mono text-sm font-semibold ${abnormal ? 'text-red-600' : 'text-medical-700'}`}>
      {value.toFixed(1)}°C
    </span>
  );
}
