import { useAppStore } from '@/store/useAppStore';
import { CheckCircle2, Clock, AlertTriangle, Undo2, FilePlus, Users, XCircle } from 'lucide-react';

export function StatsPanel() {
  const stats = useAppStore((s) => s.stats);
  if (!stats) return null;

  const items = [
    { label: '已授权', value: stats.authorized, color: 'text-sage-500', bg: 'bg-sage-50', icon: <CheckCircle2 size={20} /> },
    { label: '待确认', value: stats.pending, color: 'text-warm-500', bg: 'bg-warm-50', icon: <Clock size={20} /> },
    { label: '已拒绝', value: stats.denied, color: 'text-rose-500', bg: 'bg-rose-50', icon: <XCircle size={20} /> },
    { label: '有冲突', value: stats.conflicted, color: 'text-warm-600', bg: 'bg-warm-100', icon: <AlertTriangle size={20} /> },
    { label: '已撤回', value: stats.revoked, color: 'text-ink-700', bg: 'bg-ink-300/30', icon: <Undo2 size={20} /> },
    { label: '已补录', value: stats.supplemented, color: 'text-sage-400', bg: 'bg-sage-50', icon: <FilePlus size={20} /> },
  ];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-semibold text-ink-900">授权情况总览</h2>
        <div className="flex items-center gap-2 text-ink-500">
          <Users size={18} />
          <span className="text-sm">共 <strong className="text-ink-900 text-lg">{stats.total}</strong> 条记录</span>
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`${item.bg} rounded-xl2 p-4 text-center transition-transform hover:scale-[1.03]`}
          >
            <div className={`${item.color} flex justify-center mb-2`}>{item.icon}</div>
            <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-xs text-ink-500 mt-1">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
