import { Thermometer, User, Hash, MessageSquare, AlertCircle } from 'lucide-react';
import type { TemperatureRecord } from '@shared/types';

export default function TemperatureTimeline({ records }: { records: TemperatureRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-400 italic">
        暂无体温枪原始记录
      </div>
    );
  }
  return (
    <div className="relative">
      <div className="absolute left-[22px] top-2 bottom-2 w-px bg-gradient-to-b from-medical-200 via-medical-100 to-transparent" />
      <div className="space-y-4">
        {records.map((r, i) => {
          const abnormal = r.isAbnormal;
          return (
            <div key={r.id} className="relative pl-14 animate-slideIn" style={{ animationDelay: `${i * 60}ms` }}>
              <div className={`absolute left-3 top-0 w-9 h-9 rounded-full flex items-center justify-center border-4 border-white shadow-md ${
                abnormal ? 'bg-gradient-to-br from-rose-400 to-rose-600' : 'bg-gradient-to-br from-emerald-400 to-teal-500'
              }`}>
                <Thermometer className="w-4 h-4 text-white" />
              </div>
              <div className={`rounded-xl border p-4 bg-white transition-all hover:shadow-soft ${
                abnormal ? 'border-rose-200 bg-rose-50/40' : 'border-slate-100'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className={`font-mono text-2xl font-bold tabular-nums ${abnormal ? 'text-rose-600' : 'text-slate-800'}`}>
                      {r.temperature.toFixed(1)}
                    </span>
                    <span className="text-sm text-slate-400">°C</span>
                    {abnormal && <span className="text-[11px] text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-md font-medium">异常</span>}
                    {r.source === 'manual' && <span className="text-[11px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md font-medium border border-amber-100">手动补录</span>}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{r.measureTime}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1"><User className="w-3 h-3" /> {r.measuredBy || '未登记'}</span>
                  <span className="inline-flex items-center gap-1"><Hash className="w-3 h-3" /> {r.deviceId || '设备未知'}</span>
                </div>
                {r.remark && (
                  <div className="mt-2.5 pt-2 border-t border-dashed border-slate-100 flex items-start gap-1.5">
                    <MessageSquare className="w-3 h-3 text-slate-300 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-500 leading-relaxed">{r.remark}</p>
                  </div>
                )}
                {abnormal && !r.remark && (
                  <div className="mt-2.5 pt-2 border-t border-dashed border-rose-100 flex items-start gap-1.5">
                    <AlertCircle className="w-3 h-3 text-rose-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-rose-500 leading-relaxed">体温异常，建议护理主管重点复核</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
