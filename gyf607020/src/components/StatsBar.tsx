import { ListChecks, AlertOctagon, FileCheck } from 'lucide-react';

interface Props {
  total: number;
  normalCount: number;
  badCount: number;
}

const cardClass =
  'bg-white rounded-card p-4 border border-cream-200 shadow-card flex items-center gap-3 hover:shadow-soft transition-shadow';

export default function StatsBar({ total, normalCount, badCount }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
      <div className={cardClass}>
        <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center">
          <ListChecks className="w-5 h-5 text-brand-500" />
        </div>
        <div>
          <p className="text-xs text-gray-500">筛选结果总数</p>
          <p className="text-2xl font-serif font-semibold text-gray-800">{total}</p>
        </div>
      </div>
      <div className={cardClass}>
        <div className="w-11 h-11 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
          <FileCheck className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="text-xs text-gray-500">正常记录</p>
          <p className="text-2xl font-serif font-semibold text-green-700">{normalCount}</p>
        </div>
      </div>
      <div className={cardClass}>
        <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
          <AlertOctagon className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <p className="text-xs text-gray-500">坏数据（已隔离）</p>
          <p className="text-2xl font-serif font-semibold text-red-600">{badCount}</p>
        </div>
      </div>
    </div>
  );
}
