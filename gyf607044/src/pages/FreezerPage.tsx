import { useMemo, useState } from 'react';
import {
  Refrigerator,
  Clock,
  AlertTriangle,
  UserCircle,
  CheckCircle2,
  XCircle,
  History,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { PERIOD_LABEL } from '@/types';
import { formatDateTime, nowIso } from '@/utils/helpers';
import type { FreezerSlot, SlotStatus } from '@/types';

const STATUS_STYLE: Record<SlotStatus, string> = {
  available: 'bg-secondary/15 hover:bg-secondary/25 text-secondary-dark border-secondary/30',
  verbal_hold:
    'bg-warn/40 hover:bg-warn/55 text-amber-800 border-warn animate-blink border-amber-400',
  confirmed:
    'bg-primary/35 hover:bg-primary/50 text-pink-800 border-primary-dark border-pink-300',
};

const STATUS_TEXT: Record<SlotStatus, string> = {
  available: '可放行',
  verbal_hold: '口头占用',
  confirmed: '已确认占用',
};

export default function FreezerPage() {
  const slots = useAppStore((s) => s.freezerSlots);
  const updateSlot = useAppStore((s) => s.updateFreezerSlot);
  const [selected, setSelected] = useState<FreezerSlot | null>(null);
  const [operator, setOperator] = useState('厨房管理员');
  const [occupyName, setOccupyName] = useState('');
  const [remark, setRemark] = useState('');

  const byDate = useMemo(() => {
    const m = new Map<string, FreezerSlot[]>();
    slots.forEach((s) => {
      if (!m.has(s.date)) m.set(s.date, []);
      m.get(s.date)!.push(s);
    });
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [slots]);

  const stats = useMemo(() => {
    let a = 0,
      v = 0,
      c = 0;
    slots.forEach((s) => {
      if (s.status === 'available') a++;
      else if (s.status === 'verbal_hold') v++;
      else c++;
    });
    return { available: a, verbal: v, confirmed: c, total: slots.length };
  }, [slots]);

  const overdueVerbal = useMemo(() => {
    const now = Date.now();
    return slots.filter(
      (s) =>
        s.status === 'verbal_hold' &&
        s.markedAt &&
        now - new Date(s.markedAt).getTime() > 24 * 60 * 60 * 1000
    );
  }, [slots]);

  const handleAction = (action: 'hold' | 'confirm' | 'release') => {
    if (!selected) return;
    const patch: Partial<FreezerSlot> = {};
    if (action === 'release') {
      patch.status = 'available';
      patch.occupiedBy = undefined;
      patch.occupantType = undefined;
      patch.markedAt = undefined;
    } else {
      patch.status = action === 'confirm' ? 'confirmed' : 'verbal_hold';
      patch.occupiedBy = occupyName.trim() || operator;
      patch.occupantType = action === 'hold' ? 'shift_transfer' : 'normal';
      patch.markedAt = nowIso();
    }
    updateSlot(selected.id, patch, {
      action,
      operator,
      remark: remark.trim() || undefined,
    });
    setSelected(null);
    setOccupyName('');
    setRemark('');
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<Refrigerator size={18} />}
          label="总名额"
          value={stats.total}
          color="bg-secondary/10 text-secondary-dark"
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="可放行"
          value={stats.available}
          color="bg-green-100 text-green-700"
        />
        <StatCard
          icon={<Clock size={18} />}
          label="口头占用"
          value={stats.verbal}
          color="bg-warn/30 text-amber-700"
        />
        <StatCard
          icon={<UserCircle size={18} />}
          label="已确认"
          value={stats.confirmed}
          color="bg-primary/20 text-pink-700"
        />
      </div>

      {overdueVerbal.length > 0 && (
        <div className="rounded-xl2 border border-amber-300 bg-warn/20 px-5 py-3 flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-700 shrink-0" />
          <div className="text-sm text-amber-800">
            有 <b>{overdueVerbal.length}</b> 个口头占用超过 24 小时未确认，建议尽快联系确认或释放名额
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-display text-lg text-secondary">
            辅食厨房冷冻柜 · 名额看板（未来14天）
          </h3>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <Legend color="bg-secondary/30 border border-secondary/40" text="可放行" />
            <Legend
              color="bg-warn/50 border border-amber-400"
              text="口头占用（转班）"
            />
            <Legend color="bg-primary/50 border border-pink-300" text="已确认占用" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-muted">
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-normal w-28">
                  日期
                </th>
                {(['morning', 'afternoon', 'evening'] as const).map((p) => (
                  <th
                    key={p}
                    className="text-left py-2 px-2 text-xs text-gray-500 font-normal"
                  >
                    {PERIOD_LABEL[p]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byDate.map(([date, arr]) => (
                <tr key={date} className="border-b border-muted/60">
                  <td className="py-3 px-2 text-secondary font-display text-base whitespace-nowrap">
                    {date}
                  </td>
                  {(['morning', 'afternoon', 'evening'] as const).map((p) => {
                    const s = arr.find((x) => x.period === p);
                    if (!s)
                      return <td key={p} className="py-2 px-2" />;
                    const overdue =
                      s.status === 'verbal_hold' &&
                      s.markedAt &&
                      Date.now() - new Date(s.markedAt).getTime() >
                        24 * 60 * 60 * 1000;
                    return (
                      <td key={p} className="py-2 px-2">
                        <button
                          onClick={() => setSelected(s)}
                          className={`w-full min-w-[140px] rounded-xl px-3 py-2.5 border text-left transition-all ${STATUS_STYLE[s.status]} ${overdue ? 'ring-2 ring-red-400' : ''}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-xs">
                              {STATUS_TEXT[s.status]}
                            </span>
                            {overdue && (
                              <AlertTriangle size={12} className="text-red-600" />
                            )}
                          </div>
                          <div className="mt-1 text-[11px] opacity-80 truncate">
                            {s.occupiedBy || '点击操作'}
                          </div>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-xl2 shadow-card w-full max-w-lg p-6 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-secondary">
                {selected.date} · {PERIOD_LABEL[selected.period]} 名额操作
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-cream p-3">
                <div className="text-xs text-gray-500">当前状态</div>
                <div className="text-secondary font-medium mt-0.5">
                  <span
                    className={`badge ${STATUS_STYLE[selected.status]}`}
                  >
                    {STATUS_TEXT[selected.status]}
                  </span>
                  {selected.occupiedBy && (
                    <span className="ml-2 text-gray-600">
                      占用人：{selected.occupiedBy}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="label-base">操作人</label>
                <input
                  className="input-base"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                />
              </div>
              <div>
                <label className="label-base">占用人姓名</label>
                <input
                  className="input-base"
                  placeholder="如：王妈妈 / 李护士转班"
                  value={occupyName}
                  onChange={(e) => setOccupyName(e.target.value)}
                />
              </div>
              <div>
                <label className="label-base">备注（可选）</label>
                <input
                  className="input-base"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2 flex-wrap">
              <button
                className="btn-ghost"
                onClick={() => handleAction('hold')}
              >
                <Clock size={14} /> 口头占用（转班）
              </button>
              <button
                className="btn-primary"
                onClick={() => handleAction('confirm')}
              >
                <CheckCircle2 size={14} /> 确认占用
              </button>
              <button
                className="btn-secondary"
                onClick={() => handleAction('release')}
              >
                <XCircle size={14} /> 释放名额
              </button>
            </div>

            {selected.logs.length > 0 && (
              <div className="mt-5 pt-4 border-t border-muted">
                <div className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                  <History size={12} /> 操作记录
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {selected.logs
                    .slice()
                    .reverse()
                    .map((l) => (
                      <div
                        key={l.id}
                        className="text-xs text-gray-500 flex items-baseline gap-2"
                      >
                        <span className="text-gray-400">
                          {formatDateTime(l.createdAt)}
                        </span>
                        <span className="text-secondary">
                          {l.operator}
                        </span>
                        <span>
                          {l.action === 'hold'
                            ? '口头占用'
                            : l.action === 'confirm'
                              ? '确认占用'
                              : '释放名额'}
                        </span>
                        {l.remark && <span className="text-gray-400">· {l.remark}</span>}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="card !p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl2 flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-display text-secondary leading-tight">
          {value}
        </div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-3.5 h-3.5 rounded ${color}`} />
      {text}
    </span>
  );
}
