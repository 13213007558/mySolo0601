import { Thermometer, User } from 'lucide-react';
import type { TemperatureRecord } from '../../shared/types';

interface Props {
  records: TemperatureRecord[];
}

export default function TemperatureList({ records }: Props) {
  if (records.length === 0) {
    return (
      <div className="paper-card p-6 text-center">
        <Thermometer className="w-8 h-8 text-ink-300 mx-auto mb-2" />
        <div className="text-sm text-ink-500">暂无体温枪原始记录</div>
        <div className="text-xs text-ink-400 mt-1">请核实当日晨检数据是否同步</div>
      </div>
    );
  }

  return (
    <div className="paper-card overflow-hidden">
      <div className="px-5 py-3 border-b border-ink-100 flex items-center gap-2">
        <Thermometer className="w-4 h-4 text-sage-600" />
        <span className="font-medium text-ink-700">体温枪原始记录</span>
        <span className="chip bg-sage-50 text-sage-600 border border-sage-200 ml-auto">
          {records.length} 条
        </span>
      </div>
      <div className="divide-y divide-ink-50">
        {records.map(r => (
          <div key={r.id} className="px-5 py-3 flex items-center gap-4 hover:bg-paper-100 transition-colors">
            <div className="w-14 text-center">
              <div className={r.temperature >= 37.3 ? 'text-clay-600 font-bold text-lg' : 'text-sage-700 font-bold text-lg'}>
                {r.temperature.toFixed(1)}
              </div>
              <div className="text-[10px] text-ink-400 uppercase tracking-wider">℃</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-ink-700 font-medium">{r.measureTime}</div>
              <div className="text-xs text-ink-500 mt-0.5 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {r.operator}
                </span>
                <span>设备：{r.deviceId}</span>
              </div>
            </div>
            <span className={`chip border ${r.source === 'gun'
              ? 'bg-sage-50 text-sage-700 border-sage-200'
              : 'bg-clay-50 text-clay-700 border-clay-200'}`}>
              {r.source === 'gun' ? '体温枪' : '手工录入'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
