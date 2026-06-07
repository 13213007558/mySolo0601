import { useMemo } from 'react';
import { useScheduleStore, statusLabel, identityLabel, materialLabel, photoLabel } from '@/store/useScheduleStore';
import type { Schedule, ScheduleStatus } from '../../shared/types';
import {
  Search, Filter, Calendar, UserRound, Shield, Package, ImageIcon, AlertTriangle, Puzzle, Wrench, CircleX, CircleCheckBig, UserX } from 'lucide-react';

const statusStyle: Record<ScheduleStatus, string> = {
  scheduled: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
  confirmed: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  in_progress: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  completed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  failed: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  cancelled: 'bg-stone-500/15 text-stone-300 border-stone-500/30',
  manually_corrected: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
};

function pill(base: string) {
  if (base === 'verified' || base === 'complete' || base === 'present') {
    return 'bg-emerald-500/12 text-emerald-300 border-emerald-500/25';
  }
  if (base === 'pending' || base === 'partial') {
    return 'bg-amber-500/12 text-amber-300 border-amber-500/25';
  }
  return 'bg-rose-500/12 text-rose-300 border-rose-500/25';
}

export default function ScheduleList() {
  const schedules = useScheduleStore((s) => s.schedules);
  const selectedScheduleId = useScheduleStore((s) => s.selectedScheduleId);
  const searchKeyword = useScheduleStore((s) => s.searchKeyword);
  const statusFilter = useScheduleStore((s) => s.statusFilter);
  const setSearchKeyword = useScheduleStore((s) => s.setSearchKeyword);
  const setStatusFilter = useScheduleStore((s) => s.setStatusFilter);
  const setSelectedScheduleId = useScheduleStore((s) => s.setSelectedScheduleId);

  const list = useMemo(() => {
    return schedules.filter((s) => {
      const kw = searchKeyword.trim().toLowerCase();
      const matchKw =
        !kw ||
        s.childName.toLowerCase().includes(kw) ||
        s.childNickname.toLowerCase().includes(kw) ||
        s.id.toLowerCase().includes(kw) ||
        s.trialCourseName.toLowerCase().includes(kw) ||
        s.consultant.toLowerCase().includes(kw);
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchKw && matchStatus;
    });
  }, [schedules, searchKeyword, statusFilter]);

  const statuses: (ScheduleStatus | 'all')[] = [
    'all',
    'scheduled',
    'confirmed',
    'in_progress',
    'completed',
    'failed',
    'manually_corrected',
  ];

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-[#151926] to-[#0f1220] shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)]">
      <div className="flex flex-col gap-3 border-b border-white/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">排程列表</h2>
            <p className="text-[11px] text-white/40">共 {schedules.length} 条 · 筛选后 {list.length} 条</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索姓名 / 昵称 / 排程编号 / 课程 / 顾问"
              className="h-9 w-full rounded-xl border border-white/10 bg-white/5 py-1.5 pl-9 pr-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-amber-500/40 focus:bg-white/[0.07] sm:w-80"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="mr-1 h-3.5 w-3.5 text-white/40" />
            {statuses.map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                  statusFilter === st
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                    : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                {st === 'all' ? '全部' : statusLabel[st]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {list.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-white/40">
            <CircleX className="mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">没有匹配的排程</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {list.map((s) => (
            <li key={s.id}>
              <ScheduleCard
                s={s}
                selected={s.id === selectedScheduleId}
                onSelect={() => setSelectedScheduleId(s.id)}
              />
            </li>
          ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ScheduleCard({
  s,
  selected,
  onSelect,
}: {
  s: Schedule;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`group w-full rounded-xl border p-3.5 text-left transition ${
        selected
          ? 'border-amber-500/40 bg-amber-500/10 shadow-[0_4px_24px_-8px_rgba(251,191,36,0.35)]'
          : 'border-white/5 bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.06]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border px-2 py-0.5 text-[10px] font-mono tracking-wide text-white/60">
              {s.id}
            </span>
            {s.isPartialSuccess && (
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] text-orange-300">
                <Puzzle className="h-3 w-3" />
                部分成功
              </span>
            )}
            {s.status === 'manually_corrected' && (
              <span className="inline-flex items-center gap-1 rounded-full border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[10px] text-teal-300">
                <Wrench className="h-3 w-3" />
                人工更正
              </span>
            )}
            {s.status === 'failed' && (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-300">
                <CircleX className="h-3 w-3" />
                失败路径
              </span>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="truncate text-sm font-semibold text-white">{s.childName}</span>
            <span className="truncate text-xs text-white/50">（{s.childNickname}）</span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-white/50">{s.trialCourseName}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] ${statusStyle[s.status]}`}
        >
          {statusLabel[s.status]}
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 text-white/60">
          <Calendar className="h-3 w-3" />
          {s.scheduledDate} {s.scheduledTime}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 ${pill(s.identityStatus)}`}>
          <UserRound className="h-3 w-3" />
          身份·{identityLabel[s.identityStatus]}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 ${pill(s.materialStatus)}`}>
          <Package className="h-3 w-3" />
          材料·{materialLabel[s.materialStatus]}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 ${pill(s.photoStatus)}`}>
          <ImageIcon className="h-3 w-3" />
          照片·{photoLabel[s.photoStatus]}
        </span>
        {s.photoStatus !== 'present' && (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-amber-300">
            <AlertTriangle className="h-3 w-3" />
            照片异常
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-white/40">
        <span className="inline-flex items-center gap-1">
          <Shield className="h-3 w-3" />
          授权接送 {s.authorizedPersons.length} 人
        </span>
        <span>顾问：{s.consultant}</span>
      </div>
    </button>
  );
}
