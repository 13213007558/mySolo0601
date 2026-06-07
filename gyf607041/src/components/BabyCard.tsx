import { User, Baby, ThermometerSun, AlertTriangle, FileX2, ClipboardCheck, Search } from 'lucide-react';
import type { Baby as BabyType, DataStatus } from '@shared/types';
import StatusBadge from './StatusBadge';

interface Props {
  baby: BabyType;
  onClick: () => void;
  index: number;
}

const statusIcon = new Map<DataStatus, React.ReactNode>([
  ['normal', <ThermometerSun className="w-4 h-4 text-emerald-600" />],
  ['pending_review', <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulseSoft" />],
  ['dirty', <AlertTriangle className="w-4 h-4 text-orange-600" />],
  ['empty', <Search className="w-4 h-4 text-slate-400" />],
  ['missing_material', <FileX2 className="w-4 h-4 text-rose-600" />],
]);

export default function BabyCard({ baby, onClick, index }: Props) {
  const abnormal = baby.latestTemperature !== null && (baby.latestTemperature < 36 || baby.latestTemperature > 37.3);
  return (
    <button
      onClick={onClick}
      className="group relative text-left bg-white rounded-2xl p-5 shadow-card border border-white hover:shadow-soft hover:-translate-y-0.5 transition-all duration-300 animate-fadeInUp overflow-hidden"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        baby.status === 'normal' ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
        : baby.status === 'pending_review' ? 'bg-gradient-to-r from-amber-400 to-orange-400'
        : baby.status === 'dirty' ? 'bg-gradient-to-r from-orange-400 to-red-400'
        : baby.status === 'empty' ? 'bg-gradient-to-r from-slate-300 to-slate-400'
        : 'bg-gradient-to-r from-rose-400 to-pink-400'
      }`} />

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm ${
            baby.gender === 'male' ? 'bg-gradient-to-br from-medical-400 to-medical-600' : 'bg-gradient-to-br from-warmpink-300 to-warmpink-500'
          }`}>
            <Baby className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif font-semibold text-lg text-slate-800 leading-tight">{baby.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">房号 {baby.roomNumber} · {baby.ageMonths}月龄</p>
          </div>
        </div>
        <StatusBadge status={baby.status} />
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600">{baby.nurseInCharge}</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500">入所 {baby.admissionDate}</span>
        </div>

        <div className="flex items-center gap-2">
          {statusIcon.get(baby.status)}
          <div className="flex-1 min-w-0">
            {baby.latestTemperature !== null ? (
              <div className="flex items-baseline gap-1">
                <span className={`font-mono font-semibold text-lg ${abnormal ? 'text-rose-600 animate-pulseSoft' : 'text-slate-800'}`}>
                  {baby.latestTemperature.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400">°C</span>
                {abnormal && <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-medium">异常</span>}
              </div>
            ) : (
              <span className="text-sm text-slate-400 italic">暂无体温数据</span>
            )}
          </div>
          <ClipboardCheck className="w-4 h-4 text-slate-300 group-hover:text-medical-500 transition-colors" />
        </div>

        {baby.remark && (
          <div className="mt-2 pt-2.5 border-t border-dashed border-slate-100">
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{baby.remark}</p>
          </div>
        )}
      </div>
    </button>
  );
}
