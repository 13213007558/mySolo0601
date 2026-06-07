import { useAppStore } from '@/store/useAppStore';
import { Baby, CheckCircle2, XCircle, Clock, FileText, RotateCcw } from 'lucide-react';
import { statusLabelMap } from '@/types';
import type { RecordStatus } from '@/types';

export function StatsBar() {
  const { records, resetToInitial } = useAppStore();

  const counts: Record<RecordStatus | 'supplemented' | 'total', number> = {
    total: records.length,
    normal: 0,
    abnormal: 0,
    pending: 0,
    overridden_normal: 0,
    overridden_abnormal: 0,
    supplemented: 0,
  };

  records.forEach((r) => {
    if (r.isSupplemented) counts.supplemented++;
    if (r.status in counts) counts[r.status]++;
  });

  const stats = [
    { key: 'total', label: '总记录', value: counts.total, icon: Baby, color: 'text-ink', bg: 'bg-ink/10' },
    { key: 'normal', label: '正常', value: counts.normal, icon: CheckCircle2, color: 'text-status-normal', bg: 'bg-status-normal/10' },
    { key: 'abnormal', label: '异常', value: counts.abnormal, icon: XCircle, color: 'text-status-abnormal', bg: 'bg-status-abnormal/10' },
    { key: 'pending', label: '待复核', value: counts.pending, icon: Clock, color: 'text-status-pending', bg: 'bg-status-pending/10' },
    { key: 'supplemented', label: '补录', value: counts.supplemented, icon: FileText, color: 'text-status-supplemented', bg: 'bg-status-supplemented/10' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-soft p-5 mb-6 animate-fade-in-slow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl font-semibold text-ink-dark flex items-center gap-2">
          <span className="w-1 h-6 bg-ink rounded-full" />
          早会交接总览
        </h2>
        <button
          onClick={resetToInitial}
          className="btn-secondary flex items-center gap-1 text-xs"
          title="重置为初始样例数据"
        >
          <RotateCcw size={14} />
          重置样例
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((s, i) => (
          <div
            key={s.key}
            className="rounded-xl p-4 bg-cream/50 hover:bg-cream transition-colors animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon size={16} className={s.color} />
              </div>
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
            <p className={`text-2xl font-serif font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-3 text-right">
        {statusLabelMap.all}：{counts.total}　·　{statusLabelMap.normal}：{counts.normal}　·　
        {statusLabelMap.abnormal}：{counts.abnormal}　·　{statusLabelMap.pending}：{counts.pending}　·　
        {statusLabelMap.supplemented}：{counts.supplemented}
      </p>
    </div>
  );
}
