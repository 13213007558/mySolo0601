import { useMemo } from 'react';
import { useScheduleStore } from '@/store/useScheduleStore';
import type { SummaryStats } from '../../shared/types';
import {
  ClipboardList,
  CheckCircle2,
  PlayCircle,
  CircleCheckBig,
  CircleX,
  Puzzle,
  ShieldAlert,
  PackageX,
  ImageOff,
  Wrench,
} from 'lucide-react';

export default function SummaryPanel() {
  const schedules = useScheduleStore((s) => s.schedules);
  const stats = useMemo<SummaryStats>(() => {
    const result: SummaryStats = {
      total: schedules.length,
      confirmed: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
      partialSuccess: 0,
      pendingIdentity: 0,
      missingMaterial: 0,
      missingPhoto: 0,
      manuallyCorrected: 0,
    };
    schedules.forEach((s) => {
      if (s.status === 'confirmed') result.confirmed++;
      if (s.status === 'in_progress') result.inProgress++;
      if (s.status === 'completed') result.completed++;
      if (s.status === 'failed') result.failed++;
      if (s.isPartialSuccess) result.partialSuccess++;
      if (s.identityStatus !== 'verified') result.pendingIdentity++;
      if (s.materialStatus === 'missing' || s.materialStatus === 'partial') result.missingMaterial++;
      if (s.photoStatus === 'missing' || s.photoStatus === 'rejected') result.missingPhoto++;
      if (s.status === 'manually_corrected') result.manuallyCorrected++;
    });
    return result;
  }, [schedules]);

  const items = [
    { label: '排程总数', value: stats.total, icon: ClipboardList, color: 'text-amber-300', bg: 'bg-amber-500/10', ring: 'ring-amber-500/20' },
    { label: '已确认', value: stats.confirmed, icon: CheckCircle2, color: 'text-sky-300', bg: 'bg-sky-500/10', ring: 'ring-sky-500/20' },
    { label: '进行中', value: stats.inProgress, icon: PlayCircle, color: 'text-violet-300', bg: 'bg-violet-500/10', ring: 'ring-violet-500/20' },
    { label: '已完成', value: stats.completed, icon: CircleCheckBig, color: 'text-emerald-300', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20' },
    { label: '失败', value: stats.failed, icon: CircleX, color: 'text-rose-300', bg: 'bg-rose-500/10', ring: 'ring-rose-500/20' },
    { label: '部分成功', value: stats.partialSuccess, icon: Puzzle, color: 'text-orange-300', bg: 'bg-orange-500/10', ring: 'ring-orange-500/20' },
    { label: '身份待核验', value: stats.pendingIdentity, icon: ShieldAlert, color: 'text-yellow-300', bg: 'bg-yellow-500/10', ring: 'ring-yellow-500/20' },
    { label: '材料不完整', value: stats.missingMaterial, icon: PackageX, color: 'text-pink-300', bg: 'bg-pink-500/10', ring: 'ring-pink-500/20' },
    { label: '照片异常', value: stats.missingPhoto, icon: ImageOff, color: 'text-fuchsia-300', bg: 'bg-fuchsia-500/10', ring: 'ring-fuchsia-500/20' },
    { label: '人工更正', value: stats.manuallyCorrected, icon: Wrench, color: 'text-teal-300', bg: 'bg-teal-500/10', ring: 'ring-teal-500/20' },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1f2e] via-[#161a27] to-[#0f1220] p-5 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-wide text-white">
            页面摘要 · 与导出报告完全对齐
          </h2>
          <p className="mt-0.5 text-xs text-white/40">
            所有统计口径与 CSV / Markdown 报告使用同一数据源
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          实时同步
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((it) => (
          <div
            key={it.label}
            className={`group relative overflow-hidden rounded-xl border border-white/5 ${it.bg} px-3 py-3 ring-1 ${it.ring} transition hover:border-white/15 hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-white/50">
                {it.label}
              </span>
              <it.icon className={`h-4 w-4 ${it.color} opacity-80`} />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${it.color}`}>{it.value}</span>
              <span className="text-[10px] text-white/30">条</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
